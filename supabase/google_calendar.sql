-- Google Calendar integration
-- Run this in Supabase SQL editor

-- Add google fields to events table
alter table events add column if not exists google_event_id text;
alter table events add column if not exists google_calendar_id text;

-- Unique constraint so we don't duplicate Google events per household
create unique index if not exists events_household_google_event_id_idx
  on events(household_id, google_event_id)
  where google_event_id is not null;

-- Store OAuth tokens per user
create table if not exists google_calendar_tokens (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  household_id uuid not null references households(id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  token_expiry timestamptz not null,
  calendar_id  text not null default 'primary',
  updated_at   timestamptz not null default now()
);

alter table google_calendar_tokens enable row level security;

create policy "users can manage their own google tokens"
  on google_calendar_tokens for all
  using (user_id = auth.uid());
