-- ============================================================
-- MR.ducaysane — users table for registration (Supabase / Postgres)
-- Paste this whole file into: Supabase Dashboard -> SQL Editor -> Run
-- Safe to run once; re-running is harmless (IF NOT EXISTS).
-- ============================================================

create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 2 and 100),
  email         text not null,
  password_hash text not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Existing tables (created before the admin dashboard upgrade):
-- add the account-status column used by activate/deactivate.
alter table public.users add column if not exists is_active boolean not null default true;

-- emails are stored lowercase by the server; enforce uniqueness
create unique index if not exists users_email_key on public.users (lower(email));

-- ============================================================
-- Row Level Security: LOCK the table down.
-- The server uses the service_role key (bypasses RLS), so no
-- policies are granted: browsers/anon key get ZERO rows.
-- ============================================================
alter table public.users enable row level security;
revoke all on table public.users from anon, authenticated;
