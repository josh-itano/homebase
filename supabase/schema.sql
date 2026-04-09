-- ============================================================
-- Home Base — Supabase Schema
-- Run this in Supabase SQL Editor to initialize the database
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
create type user_role as enum ('owner', 'manager');
create type task_status as enum ('todo', 'in_progress', 'done');
create type task_priority as enum ('low', 'medium', 'high', 'urgent');
create type task_category as enum ('errands', 'household', 'kids', 'dog', 'groceries', 'maintenance', 'admin', 'other');
create type recurring_rule as enum ('none', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually');
create type event_category as enum ('kids', 'family', 'home_maintenance', 'appointments', 'social', 'travel', 'school', 'other');
create type contact_role as enum ('pediatrician', 'dentist', 'veterinarian', 'plumber', 'electrician', 'hvac', 'landscaper', 'housekeeper', 'school', 'extracurricular', 'insurance', 'financial', 'emergency', 'family', 'friend', 'other');
create type inventory_category as enum ('pantry', 'refrigerator', 'freezer', 'cleaning', 'bathroom', 'laundry', 'kids', 'dog', 'office', 'medicine', 'other');
create type asset_category as enum ('appliance', 'hvac', 'plumbing', 'electrical', 'furniture', 'electronics', 'outdoor', 'vehicle', 'other');

-- ============================================================
-- HOUSEHOLDS
-- ============================================================
create table households (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  created_by  uuid not null references auth.users(id),
  created_at  timestamptz not null default now()
);

create table household_members (
  id            uuid primary key default uuid_generate_v4(),
  household_id  uuid not null references households(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          user_role not null default 'manager',
  display_name  text,
  avatar_url    text,
  joined_at     timestamptz not null default now(),
  unique(household_id, user_id)
);

-- ============================================================
-- TASKS
-- ============================================================
create table tasks (
  id              uuid primary key default uuid_generate_v4(),
  household_id    uuid not null references households(id) on delete cascade,
  title           text not null,
  description     text,
  category        task_category not null default 'other',
  priority        task_priority not null default 'medium',
  assigned_to     uuid references auth.users(id),
  due_date        date,
  recurring_rule  recurring_rule not null default 'none',
  status          task_status not null default 'todo',
  created_by      uuid not null references auth.users(id),
  completed_by    uuid references auth.users(id),
  completed_at    timestamptz,
  parent_task_id  uuid references tasks(id) on delete cascade,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table task_comments (
  id          uuid primary key default uuid_generate_v4(),
  task_id     uuid not null references tasks(id) on delete cascade,
  user_id     uuid not null references auth.users(id),
  body        text not null,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- EVENTS / CALENDAR
-- ============================================================
create table events (
  id              uuid primary key default uuid_generate_v4(),
  household_id    uuid not null references households(id) on delete cascade,
  title           text not null,
  date            date not null,
  start_time      time,
  end_time        time,
  all_day         boolean not null default false,
  category        event_category not null default 'other',
  location        text,
  notes           text,
  recurring_rule  recurring_rule not null default 'none',
  created_by      uuid not null references auth.users(id),
  created_at      timestamptz not null default now()
);

create table event_members (
  id          uuid primary key default uuid_generate_v4(),
  event_id    uuid not null references events(id) on delete cascade,
  member_name text not null
);

-- ============================================================
-- CONTACTS & VENDORS
-- ============================================================
create table contacts (
  id              uuid primary key default uuid_generate_v4(),
  household_id    uuid not null references households(id) on delete cascade,
  name            text not null,
  role_type       contact_role not null default 'other',
  company         text,
  phone           text,
  email           text,
  address         text,
  website         text,
  account_number  text,  -- protected by RLS for owner-only
  availability    text,
  notes           text,
  is_favorite     boolean not null default false,
  owner_only      boolean not null default false,
  created_at      timestamptz not null default now()
);

create table service_history (
  id          uuid primary key default uuid_generate_v4(),
  contact_id  uuid not null references contacts(id) on delete cascade,
  date        date not null,
  description text not null,
  cost        numeric(10,2),  -- owner-only in app logic
  next_visit  date,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- HOUSEHOLD MANUAL
-- ============================================================
create table manual_chapters (
  id            uuid primary key default uuid_generate_v4(),
  household_id  uuid not null references households(id) on delete cascade,
  title         text not null,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

create table manual_sections (
  id          uuid primary key default uuid_generate_v4(),
  chapter_id  uuid not null references manual_chapters(id) on delete cascade,
  title       text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table manual_entries (
  id          uuid primary key default uuid_generate_v4(),
  section_id  uuid not null references manual_sections(id) on delete cascade,
  title       text not null,
  body        text,
  owner_only  boolean not null default false,
  updated_by  uuid references auth.users(id),
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create table manual_entry_versions (
  id          uuid primary key default uuid_generate_v4(),
  entry_id    uuid not null references manual_entries(id) on delete cascade,
  body        text,
  edited_by   uuid references auth.users(id),
  edited_at   timestamptz not null default now()
);

-- ============================================================
-- INVENTORY
-- ============================================================
create table inventory_items (
  id               uuid primary key default uuid_generate_v4(),
  household_id     uuid not null references households(id) on delete cascade,
  name             text not null,
  category         inventory_category not null default 'other',
  qty              numeric(10,2) not null default 0,
  unit             text not null default 'count',
  min_qty          numeric(10,2) not null default 1,
  preferred_brand  text,
  where_to_buy     text,
  notes            text,
  photo_url        text,
  last_restocked   timestamptz,
  created_at       timestamptz not null default now()
);

create table shopping_list (
  id                  uuid primary key default uuid_generate_v4(),
  household_id        uuid not null references households(id) on delete cascade,
  item_name           text not null,
  linked_inventory_id uuid references inventory_items(id) on delete set null,
  checked             boolean not null default false,
  added_by            uuid references auth.users(id),
  created_at          timestamptz not null default now()
);

-- ============================================================
-- ASSET TRACKER
-- ============================================================
create table assets (
  id                 uuid primary key default uuid_generate_v4(),
  household_id       uuid not null references households(id) on delete cascade,
  name               text not null,
  category           asset_category not null default 'other',
  location           text,
  make_model         text,
  serial_number      text,  -- owner-only in app logic
  purchase_date      date,
  purchase_price     numeric(10,2),  -- owner-only in app logic
  warranty_expires   date,
  manual_url         text,
  linked_contact_id  uuid references contacts(id) on delete set null,
  photo_url          text,
  created_at         timestamptz not null default now()
);

create table asset_maintenance (
  id              uuid primary key default uuid_generate_v4(),
  asset_id        uuid not null references assets(id) on delete cascade,
  date            date not null,
  description     text not null,
  performed_by    text,
  cost            numeric(10,2),  -- owner-only in app logic
  next_scheduled  date,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- DAILY LOG / HANDOFF
-- ============================================================
create table daily_logs (
  id               uuid primary key default uuid_generate_v4(),
  household_id     uuid not null references households(id) on delete cascade,
  date             date not null,
  author_id        uuid not null references auth.users(id),
  summary          text,
  kids_update      text,
  pet_update       text,
  inventory_notes  text,
  issues           text,
  created_at       timestamptz not null default now(),
  unique(household_id, date, author_id)
);

create table daily_log_comments (
  id          uuid primary key default uuid_generate_v4(),
  log_id      uuid not null references daily_logs(id) on delete cascade,
  user_id     uuid not null references auth.users(id),
  body        text not null,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- DOCUMENTS VAULT
-- ============================================================
create table documents (
  id           uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  folder       text not null default 'other',
  name         text not null,
  file_url     text not null,
  tags         text[],
  owner_only   boolean not null default false,
  uploaded_by  uuid references auth.users(id),
  uploaded_at  timestamptz not null default now()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table notifications (
  id            uuid primary key default uuid_generate_v4(),
  household_id  uuid not null references households(id) on delete cascade,
  user_id       uuid not null references auth.users(id),
  type          text not null,
  reference_id  uuid,
  message       text not null,
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- CROSS-MODULE LINK TABLES
-- ============================================================
create table task_contacts (
  task_id     uuid not null references tasks(id) on delete cascade,
  contact_id  uuid not null references contacts(id) on delete cascade,
  primary key (task_id, contact_id)
);

create table task_assets (
  task_id   uuid not null references tasks(id) on delete cascade,
  asset_id  uuid not null references assets(id) on delete cascade,
  primary key (task_id, asset_id)
);

create table event_contacts (
  event_id    uuid not null references events(id) on delete cascade,
  contact_id  uuid not null references contacts(id) on delete cascade,
  primary key (event_id, contact_id)
);

create table event_tasks (
  event_id  uuid not null references events(id) on delete cascade,
  task_id   uuid not null references tasks(id) on delete cascade,
  primary key (event_id, task_id)
);

create table contact_assets (
  contact_id  uuid not null references contacts(id) on delete cascade,
  asset_id    uuid not null references assets(id) on delete cascade,
  primary key (contact_id, asset_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
create index on tasks(household_id, status);
create index on tasks(household_id, due_date);
create index on tasks(assigned_to);
create index on events(household_id, date);
create index on inventory_items(household_id);
create index on daily_logs(household_id, date desc);
create index on notifications(user_id, read, created_at desc);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on tasks
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- Helper function: get caller's household_id (assumes single household per user for Phase 1)
create or replace function get_household_id()
returns uuid as $$
  select household_id from household_members
  where user_id = auth.uid()
  limit 1;
$$ language sql security definer stable;

-- Helper function: get caller's role in their household
create or replace function get_user_role()
returns user_role as $$
  select role from household_members
  where user_id = auth.uid()
  limit 1;
$$ language sql security definer stable;

-- Helper function: is caller an owner?
create or replace function is_owner()
returns boolean as $$
  select exists(
    select 1 from household_members
    where user_id = auth.uid()
    and role = 'owner'
  );
$$ language sql security definer stable;

-- ---- households ----
alter table households enable row level security;
create policy "members can view their household"
  on households for select
  using (id = get_household_id());
create policy "owners can update their household"
  on households for update
  using (id = get_household_id() and is_owner());

-- ---- household_members ----
alter table household_members enable row level security;
create policy "members can view household members"
  on household_members for select
  using (household_id = get_household_id());
create policy "owners can manage members"
  on household_members for all
  using (household_id = get_household_id() and is_owner());
-- Allow new users to create their own membership (during onboarding)
create policy "users can insert themselves"
  on household_members for insert
  with check (user_id = auth.uid());

-- ---- tasks ----
alter table tasks enable row level security;
create policy "household members can view tasks"
  on tasks for select
  using (household_id = get_household_id());
create policy "household members can create tasks"
  on tasks for insert
  with check (household_id = get_household_id());
create policy "household members can update tasks"
  on tasks for update
  using (household_id = get_household_id());
create policy "owners can delete tasks"
  on tasks for delete
  using (household_id = get_household_id() and is_owner());

-- ---- task_comments ----
alter table task_comments enable row level security;
create policy "household members can view task comments"
  on task_comments for select
  using (exists(select 1 from tasks where id = task_id and household_id = get_household_id()));
create policy "household members can add comments"
  on task_comments for insert
  with check (exists(select 1 from tasks where id = task_id and household_id = get_household_id()));

-- ---- events ----
alter table events enable row level security;
create policy "household members can view events"
  on events for select
  using (household_id = get_household_id());
create policy "household members can manage events"
  on events for all
  using (household_id = get_household_id());

-- ---- event_members ----
alter table event_members enable row level security;
create policy "household members can view event members"
  on event_members for select
  using (exists(select 1 from events where id = event_id and household_id = get_household_id()));
create policy "household members can manage event members"
  on event_members for all
  using (exists(select 1 from events where id = event_id and household_id = get_household_id()));

-- ---- contacts ----
alter table contacts enable row level security;
-- Managers cannot see owner_only contacts; owners see all
create policy "owners see all contacts"
  on contacts for select
  using (household_id = get_household_id() and is_owner());
create policy "managers see non-owner-only contacts"
  on contacts for select
  using (household_id = get_household_id() and not owner_only and not is_owner());
create policy "household members can manage contacts"
  on contacts for insert
  with check (household_id = get_household_id());
create policy "household members can update contacts"
  on contacts for update
  using (household_id = get_household_id());
create policy "owners can delete contacts"
  on contacts for delete
  using (household_id = get_household_id() and is_owner());

-- ---- service_history ----
alter table service_history enable row level security;
create policy "household members can view service history"
  on service_history for select
  using (exists(select 1 from contacts where id = contact_id and household_id = get_household_id()));
create policy "household members can manage service history"
  on service_history for all
  using (exists(select 1 from contacts where id = contact_id and household_id = get_household_id()));

-- ---- manual_chapters ----
alter table manual_chapters enable row level security;
create policy "household members can view manual"
  on manual_chapters for select
  using (household_id = get_household_id());
create policy "household members can manage chapters"
  on manual_chapters for all
  using (household_id = get_household_id());

-- ---- manual_sections ----
alter table manual_sections enable row level security;
create policy "household members can view sections"
  on manual_sections for select
  using (exists(select 1 from manual_chapters where id = chapter_id and household_id = get_household_id()));
create policy "household members can manage sections"
  on manual_sections for all
  using (exists(select 1 from manual_chapters where id = chapter_id and household_id = get_household_id()));

-- ---- manual_entries ----
alter table manual_entries enable row level security;
-- Owners see all; managers can't see owner_only
create policy "owners see all manual entries"
  on manual_entries for select
  using (is_owner() and exists(
    select 1 from manual_sections s
    join manual_chapters c on c.id = s.chapter_id
    where s.id = section_id and c.household_id = get_household_id()
  ));
create policy "managers see non-owner-only entries"
  on manual_entries for select
  using (not owner_only and not is_owner() and exists(
    select 1 from manual_sections s
    join manual_chapters c on c.id = s.chapter_id
    where s.id = section_id and c.household_id = get_household_id()
  ));
create policy "household members can manage entries"
  on manual_entries for all
  using (exists(
    select 1 from manual_sections s
    join manual_chapters c on c.id = s.chapter_id
    where s.id = section_id and c.household_id = get_household_id()
  ));

-- ---- inventory_items ----
alter table inventory_items enable row level security;
create policy "household members can view inventory"
  on inventory_items for select
  using (household_id = get_household_id());
create policy "household members can manage inventory"
  on inventory_items for all
  using (household_id = get_household_id());

-- ---- shopping_list ----
alter table shopping_list enable row level security;
create policy "household members can view shopping list"
  on shopping_list for select
  using (household_id = get_household_id());
create policy "household members can manage shopping list"
  on shopping_list for all
  using (household_id = get_household_id());

-- ---- assets ----
alter table assets enable row level security;
create policy "household members can view assets"
  on assets for select
  using (household_id = get_household_id());
create policy "household members can manage assets"
  on assets for all
  using (household_id = get_household_id());

-- ---- asset_maintenance ----
alter table asset_maintenance enable row level security;
create policy "household members can view maintenance"
  on asset_maintenance for select
  using (exists(select 1 from assets where id = asset_id and household_id = get_household_id()));
create policy "household members can manage maintenance"
  on asset_maintenance for all
  using (exists(select 1 from assets where id = asset_id and household_id = get_household_id()));

-- ---- daily_logs ----
alter table daily_logs enable row level security;
create policy "household members can view logs"
  on daily_logs for select
  using (household_id = get_household_id());
create policy "household members can create logs"
  on daily_logs for insert
  with check (household_id = get_household_id());
create policy "authors can update own logs"
  on daily_logs for update
  using (household_id = get_household_id() and author_id = auth.uid());

-- ---- daily_log_comments ----
alter table daily_log_comments enable row level security;
create policy "household members can view log comments"
  on daily_log_comments for select
  using (exists(select 1 from daily_logs where id = log_id and household_id = get_household_id()));
create policy "household members can add log comments"
  on daily_log_comments for insert
  with check (exists(select 1 from daily_logs where id = log_id and household_id = get_household_id()));

-- ---- documents ----
alter table documents enable row level security;
create policy "owners see all documents"
  on documents for select
  using (household_id = get_household_id() and is_owner());
create policy "managers see non-owner-only documents"
  on documents for select
  using (household_id = get_household_id() and not owner_only and not is_owner());
create policy "household members can upload documents"
  on documents for insert
  with check (household_id = get_household_id());

-- ---- notifications ----
alter table notifications enable row level security;
create policy "users see own notifications"
  on notifications for select
  using (user_id = auth.uid());
create policy "users can mark own notifications read"
  on notifications for update
  using (user_id = auth.uid());

-- ---- link tables ----
alter table task_contacts enable row level security;
create policy "household members can view task_contacts"
  on task_contacts for select
  using (exists(select 1 from tasks where id = task_id and household_id = get_household_id()));
create policy "household members can manage task_contacts"
  on task_contacts for all
  using (exists(select 1 from tasks where id = task_id and household_id = get_household_id()));

alter table task_assets enable row level security;
create policy "household members can view task_assets"
  on task_assets for select
  using (exists(select 1 from tasks where id = task_id and household_id = get_household_id()));
create policy "household members can manage task_assets"
  on task_assets for all
  using (exists(select 1 from tasks where id = task_id and household_id = get_household_id()));

alter table event_contacts enable row level security;
create policy "household members can view event_contacts"
  on event_contacts for select
  using (exists(select 1 from events where id = event_id and household_id = get_household_id()));
create policy "household members can manage event_contacts"
  on event_contacts for all
  using (exists(select 1 from events where id = event_id and household_id = get_household_id()));

alter table event_tasks enable row level security;
create policy "household members can view event_tasks"
  on event_tasks for select
  using (exists(select 1 from events where id = event_id and household_id = get_household_id()));
create policy "household members can manage event_tasks"
  on event_tasks for all
  using (exists(select 1 from events where id = event_id and household_id = get_household_id()));

alter table contact_assets enable row level security;
create policy "household members can view contact_assets"
  on contact_assets for select
  using (exists(select 1 from contacts where id = contact_id and household_id = get_household_id()));
create policy "household members can manage contact_assets"
  on contact_assets for all
  using (exists(select 1 from contacts where id = contact_id and household_id = get_household_id()));
