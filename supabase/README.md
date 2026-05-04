# Supabase backend

This project uses Supabase (Postgres + Auth) as the backend.

## What is tracked in git

- `supabase/migrations/*` — database schema, RLS policies, functions
- `.env.example` — env template (never commit real `.env*`)

## Local development (recommended)

Install Supabase CLI and run:

```bash
supabase start
supabase db reset
```

Then set your frontend env vars from the local stack or your remote project:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

