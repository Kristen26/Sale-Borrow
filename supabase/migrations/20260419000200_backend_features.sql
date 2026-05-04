-- Backend features needed for frontend MVP:
-- - profile bootstrap (on auth.user creation)
-- - storage bucket for item photos + policies
-- - chat last_message + unread counters automation
-- - search helpers + indexes

-- 1) Profiles: allow onboarding without building
alter table public.profiles
  alter column building_id drop not null;

-- Ensure a profile row exists for each new auth user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, created_at)
  values (new.id, '', now())
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) Storage: bucket for item images
-- Note: Supabase Storage tables live in schema "storage".
insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', false)
on conflict (id) do nothing;

-- RLS for storage.objects is enabled by Supabase; we add policies.
do $$
begin
  -- Read: any authenticated user can read item images
  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects' and policyname='item_images_read_auth'
  ) then
    create policy item_images_read_auth
      on storage.objects for select
      to authenticated
      using (bucket_id = 'item-images');
  end if;

  -- Insert: only authenticated users, only into their own folder "userId/*"
  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects' and policyname='item_images_insert_own_folder'
  ) then
    create policy item_images_insert_own_folder
      on storage.objects for insert
      to authenticated
      with check (
        bucket_id = 'item-images'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  -- Update/Delete: only owner of the object (uploader)
  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects' and policyname='item_images_update_own'
  ) then
    create policy item_images_update_own
      on storage.objects for update
      to authenticated
      using (bucket_id = 'item-images' and owner = auth.uid())
      with check (bucket_id = 'item-images' and owner = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects' and policyname='item_images_delete_own'
  ) then
    create policy item_images_delete_own
      on storage.objects for delete
      to authenticated
      using (bucket_id = 'item-images' and owner = auth.uid());
  end if;
end $$;

-- 3) Chat automation: last message + unread counts
create or replace function public.on_message_insert_update_chat()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer uuid;
  v_seller uuid;
begin
  select c.buyer_id, c.seller_id
    into v_buyer, v_seller
  from public.chats c
  where c.id = new.chat_id;

  update public.chats c
  set
    last_message_text = coalesce(new.content, '[image]'),
    last_message_time = coalesce(new.created_at, now()),
    unread_count_buyer = case when new.sender_id = v_buyer then c.unread_count_buyer else c.unread_count_buyer + 1 end,
    unread_count_seller = case when new.sender_id = v_seller then c.unread_count_seller else c.unread_count_seller + 1 end
  where c.id = new.chat_id;

  return new;
end;
$$;

drop trigger if exists messages_after_insert on public.messages;
create trigger messages_after_insert
  after insert on public.messages
  for each row execute function public.on_message_insert_update_chat();

-- 4) Search: indexes + RPC helper (simple)
create index if not exists items_active_deal_type_created_at_idx
  on public.items (is_active, deal_type, created_at desc);

create index if not exists items_search_gin_idx
  on public.items using gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'')));

create or replace function public.search_items(q text, deal public.deal_type default null, lim int default 20, off int default 0)
returns setof public.items
language sql
stable
as $$
  select i.*
  from public.items i
  where i.is_active = true
    and (deal is null or i.deal_type = deal)
    and (
      q is null
      or btrim(q) = ''
      or to_tsvector('simple', coalesce(i.title,'') || ' ' || coalesce(i.description,'')) @@ plainto_tsquery('simple', q)
    )
  order by i.created_at desc
  limit lim offset off;
$$;

