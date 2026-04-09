-- Run this in Supabase SQL Editor to add the invite system

create table household_invites (
  id           uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  role         user_role not null default 'manager',
  token        text not null unique default encode(gen_random_bytes(24), 'hex'),
  created_by   uuid not null references auth.users(id),
  expires_at   timestamptz not null default now() + interval '7 days',
  used_by      uuid references auth.users(id),
  used_at      timestamptz,
  created_at   timestamptz not null default now()
);

alter table household_invites enable row level security;

-- Owners can create and view invites for their household
create policy "owners can manage invites"
  on household_invites for all
  using (household_id = get_household_id() and is_owner())
  with check (household_id = get_household_id() and is_owner());

-- Anyone (including unauthenticated) can look up an invite by token
-- (token acts as the secret — only people with the link can find it)
create policy "anyone can look up an invite by token"
  on household_invites for select
  using (true);
