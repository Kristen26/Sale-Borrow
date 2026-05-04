-- Initial schema for "my-rent-and"
-- Goal: keep DB schema + RLS policies in git so frontend can rely on stable contracts.

-- Extensions
create extension if not exists pgcrypto;
create extension if not exists postgis;

-- Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'deal_type') then
    create type public.deal_type as enum ('sale', 'rent', 'gift');
  end if;
end $$;

-- Buildings (geo)
create table if not exists public.buildings (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  coords geography(point, 4326) not null,
  created_at timestamptz default now()
);

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  building_id uuid not null references public.buildings(id),
  first_name text not null default '',
  last_name text,
  avatar_url text,
  rating numeric,
  created_at timestamptz not null default now()
);

-- Items (listings)
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  building_id uuid not null references public.buildings(id),
  title text not null,
  description text,
  price numeric not null default 0,
  deal_type public.deal_type not null default 'rent',
  image_urls text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Chats (buyer/seller + item)
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  last_message_text text,
  last_message_time timestamptz,
  unread_count_buyer integer default 0,
  unread_count_seller integer default 0,
  created_at timestamptz default now(),
  constraint chats_buyer_seller_item_unique unique (item_id, buyer_id, seller_id),
  constraint chats_not_self_chat check (buyer_id <> seller_id)
);

-- Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text,
  image_url text,
  is_read boolean default false,
  created_at timestamptz default now(),
  constraint messages_nonempty check (content is not null or image_url is not null)
);

-- Helpful indexes
create index if not exists buildings_coords_gix on public.buildings using gist (coords);
create index if not exists items_owner_id_idx on public.items (owner_id);
create index if not exists items_building_id_idx on public.items (building_id);
create index if not exists chats_item_id_idx on public.chats (item_id);
create index if not exists chats_buyer_id_idx on public.chats (buyer_id);
create index if not exists chats_seller_id_idx on public.chats (seller_id);
create index if not exists messages_chat_id_created_at_idx on public.messages (chat_id, created_at);

-- RLS
alter table public.buildings enable row level security;
alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;

-- Buildings policies: readable for everyone, writable for authenticated users
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='buildings' and policyname='buildings_select_all') then
    create policy buildings_select_all
      on public.buildings for select
      using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='buildings' and policyname='buildings_insert_auth') then
    create policy buildings_insert_auth
      on public.buildings for insert
      to authenticated
      with check (true);
  end if;
end $$;

-- Profiles policies: user can read all profiles (optional), but only write own
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_select_all') then
    create policy profiles_select_all
      on public.profiles for select
      using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_insert_own') then
    create policy profiles_insert_own
      on public.profiles for insert
      to authenticated
      with check (auth.uid() = id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_update_own') then
    create policy profiles_update_own
      on public.profiles for update
      to authenticated
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end $$;

-- Items policies: active items visible to everyone; owners can manage their own
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='items' and policyname='items_select_public_active') then
    create policy items_select_public_active
      on public.items for select
      using (is_active = true);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='items' and policyname='items_insert_owner') then
    create policy items_insert_owner
      on public.items for insert
      to authenticated
      with check (auth.uid() = owner_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='items' and policyname='items_update_owner') then
    create policy items_update_owner
      on public.items for update
      to authenticated
      using (auth.uid() = owner_id)
      with check (auth.uid() = owner_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='items' and policyname='items_delete_owner') then
    create policy items_delete_owner
      on public.items for delete
      to authenticated
      using (auth.uid() = owner_id);
  end if;
end $$;

-- Chats policies: only participants can read/write
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='chats' and policyname='chats_select_participants') then
    create policy chats_select_participants
      on public.chats for select
      to authenticated
      using (auth.uid() = buyer_id or auth.uid() = seller_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='chats' and policyname='chats_insert_participants') then
    create policy chats_insert_participants
      on public.chats for insert
      to authenticated
      with check (auth.uid() = buyer_id or auth.uid() = seller_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='chats' and policyname='chats_update_participants') then
    create policy chats_update_participants
      on public.chats for update
      to authenticated
      using (auth.uid() = buyer_id or auth.uid() = seller_id)
      with check (auth.uid() = buyer_id or auth.uid() = seller_id);
  end if;
end $$;

-- Messages policies: only chat participants can read/write messages
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='messages' and policyname='messages_select_participants') then
    create policy messages_select_participants
      on public.messages for select
      to authenticated
      using (
        exists (
          select 1
          from public.chats c
          where c.id = messages.chat_id
            and (auth.uid() = c.buyer_id or auth.uid() = c.seller_id)
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='messages' and policyname='messages_insert_participants') then
    create policy messages_insert_participants
      on public.messages for insert
      to authenticated
      with check (
        auth.uid() = sender_id
        and exists (
          select 1
          from public.chats c
          where c.id = messages.chat_id
            and (auth.uid() = c.buyer_id or auth.uid() = c.seller_id)
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='messages' and policyname='messages_update_sender') then
    create policy messages_update_sender
      on public.messages for update
      to authenticated
      using (auth.uid() = sender_id)
      with check (auth.uid() = sender_id);
  end if;
end $$;

-- RPC: mark chat as read (server-side atomic update)
create or replace function public.mark_chat_as_read(chat_id uuid, user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only participants can call this function successfully
  if not exists (
    select 1 from public.chats c
    where c.id = mark_chat_as_read.chat_id
      and (c.buyer_id = mark_chat_as_read.user_id or c.seller_id = mark_chat_as_read.user_id)
  ) then
    raise exception 'not allowed';
  end if;

  update public.chats c
  set
    unread_count_buyer = case when c.buyer_id = mark_chat_as_read.user_id then 0 else c.unread_count_buyer end,
    unread_count_seller = case when c.seller_id = mark_chat_as_read.user_id then 0 else c.unread_count_seller end
  where c.id = mark_chat_as_read.chat_id;
end;
$$;

-- RPC: get nearby buildings (meters)
create or replace function public.get_nearby_buildings(lat double precision, lon double precision, dist_meters integer)
returns setof public.buildings
language sql
stable
as $$
  select b.*
  from public.buildings b
  where st_dwithin(
    b.coords,
    st_setsrid(st_makepoint(lon, lat), 4326)::geography,
    dist_meters
  )
  order by st_distance(b.coords, st_setsrid(st_makepoint(lon, lat), 4326)::geography);
$$;

