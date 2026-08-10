-- HELEN — Supabase schema
--
-- Run this in the Supabase SQL editor (or via `supabase db push`) once you
-- have a project created. Matches the data model in the project brief.
--
-- Member IDs are assigned from a Postgres sequence, so concurrent signups
-- can never race for the same number (this is what lib/data/globalRepo.ts's
-- localStorage mock stands in for until this is connected).

create extension if not exists "pgcrypto";

-- Members ---------------------------------------------------------------

create sequence if not exists member_id_seq start 1;

create table if not exists members (
  id bigint primary key default nextval('member_id_seq'), -- the Member ID itself
  user_id uuid not null references auth.users(id) on delete cascade unique,
  tier text not null,
  username text,
  creature_rarity text check (creature_rarity in ('common', 'rare', 'legendary')),
  creature_seed text,
  creature_name text,
  streak_count int not null default 1,
  happiness int not null default 50 check (happiness between 0 and 100),
  invites_count int not null default 0,
  care_points int not null default 0,
  last_active_date date not null default current_date,
  -- Set by app/api/cron/inactivity-reminder — skips members already
  -- reminded in the last 7 days so the cron doesn't email daily.
  last_reminder_sent_date date,
  reward_claimed_today boolean not null default false,
  mission_feed boolean not null default false,
  mission_play boolean not null default false,
  mission_clean boolean not null default false,
  mission_share boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists members_user_id_idx on members(user_id);

-- Shop ----------------------------------------------------------------------
-- Cosmetic items — ids/prices are the source of truth in lib/domain.ts
-- (SHOP_ITEMS); this table just needs to exist so purchases can reference it.

create table if not exists shop_items (
  id text primary key,
  price_eur numeric(6, 2) not null
);

-- Keep this in sync with SHOP_ITEMS in lib/domain.ts by hand — there's no
-- automated sync between the two yet.
insert into shop_items (id, price_eur) values
  ('party-hat', 0.99),
  ('golden-bowl', 1.99),
  ('rainbow-trail', 2.99),
  ('confetti-burst', 0.99),
  ('cozy-blanket', 1.49),
  ('star-crown', 3.99),
  ('diamond-collar', 4.99),
  ('magic-cape', 7.99),
  ('royal-throne', 12.99),
  ('phoenix-wings', 15.99),
  ('cosmic-aura', 19.99),
  ('founder-statue', 24.99)
on conflict (id) do update set price_eur = excluded.price_eur;

create table if not exists shop_purchases (
  id bigint generated always as identity primary key,
  member_id bigint not null references members(id) on delete cascade on update cascade,
  item_id text not null references shop_items(id),
  amount_eur numeric(6, 2) not null,
  created_at timestamptz not null default now(),
  unique (member_id, item_id) -- each cosmetic item ownable once per member
);

-- Organizations -----------------------------------------------------------

create table if not exists orgs (
  id bigint generated always as identity primary key,
  name text not null,
  category text not null,
  region text not null,
  status text not null default 'queued' check (status in ('pending_review', 'queued', 'active', 'completed')),
  verification_docs_url text,
  contact_email text,
  description text,
  created_at timestamptz not null default now()
);

-- Fund cycles ---------------------------------------------------------------

create table if not exists fund_cycles (
  id bigint generated always as identity primary key,
  cycle_number int not null unique,
  pool_amount numeric(12, 2) not null,
  org_ids bigint[] not null, -- the 3 active orgs for this cycle
  starts_at timestamptz not null,
  ends_at timestamptz not null
);

-- Votes -----------------------------------------------------------------

create table if not exists votes (
  id bigint generated always as identity primary key,
  member_id bigint not null references members(id) on delete cascade on update cascade,
  cycle_id bigint not null references fund_cycles(id) on delete cascade,
  org_id bigint not null references orgs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (member_id, cycle_id) -- one vote per member per cycle
);

-- Payouts -----------------------------------------------------------------

create table if not exists payouts (
  id bigint generated always as identity primary key,
  cycle_id bigint not null references fund_cycles(id) on delete cascade,
  org_id bigint not null references orgs(id) on delete cascade,
  amount numeric(12, 2) not null,
  paid_at timestamptz,
  receipt_url text
);

-- Row Level Security ------------------------------------------------------
-- Members can read/write only their own row; everything else (leaderboard
-- rank, org names, cycle totals, past payouts) is public read-only. Writes
-- to members happen server-side (via the Stripe webhook and mission/vote
-- API routes) using the service role key, which bypasses RLS.

alter table members enable row level security;
alter table orgs enable row level security;
alter table fund_cycles enable row level security;
alter table votes enable row level security;
alter table payouts enable row level security;
alter table shop_items enable row level security;
alter table shop_purchases enable row level security;

create policy "members read own row" on members
  for select using (auth.uid() = user_id);

create policy "members public leaderboard read" on members
  for select using (true); -- id + tier only; expose via a view instead of this table if you need to hide other columns

create policy "orgs public read" on orgs for select using (true);
create policy "fund_cycles public read" on fund_cycles for select using (true);
create policy "payouts public read" on payouts for select using (true);
create policy "shop_items public read" on shop_items for select using (true);

create policy "shop_purchases read own" on shop_purchases
  for select using (
    exists (select 1 from members where members.id = shop_purchases.member_id and members.user_id = auth.uid())
  );

create policy "votes read own" on votes
  for select using (
    exists (select 1 from members where members.id = votes.member_id and members.user_id = auth.uid())
  );
