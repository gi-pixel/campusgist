-- ============================================================
-- Nicknames
-- ============================================================

-- Profiles table: one row per user. Holds the public nickname.
create table if not exists public.profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  nickname     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Case-insensitive uniqueness. citext keeps the original casing for display.
create extension if not exists citext;
alter table public.profiles
  alter column nickname type citext using nickname::citext;

-- Nickname rules: 2–20 chars, letters/digits/underscore, no leading digit/underscore
alter table public.profiles
  drop constraint if exists profiles_nickname_format;
alter table public.profiles
  add constraint profiles_nickname_format
  check (
    nickname is null
    or nickname ~ '^[A-Za-z][A-Za-z0-9_]{1,19}$'
  );

create unique index if not exists profiles_nickname_unique
  on public.profiles (nickname)
  where nickname is not null;

-- ============================================================
-- RLS for profiles
-- ============================================================

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
  on public.profiles for select to authenticated
  using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Admins can read everything (already true via select_public) and delete rows
drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin"
  on public.profiles for delete to authenticated
  using (public.is_admin());

-- ============================================================
-- Auto-create a profile row when a new auth user appears
-- (So `set_nickname` below can just update instead of upsert.)
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill for users who already exist
insert into public.profiles (user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- ============================================================
-- Nickname availability + setter
--
-- We expose one RPC that both checks availability and sets the
-- nickname atomically, so a race between two users picking the
-- same name can't both succeed.
-- ============================================================

create or replace function public.set_nickname(p_nickname text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clean text := btrim(p_nickname);
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if v_clean !~ '^[A-Za-z][A-Za-z0-9_]{1,19}$' then
    raise exception 'Nickname must be 2–20 characters, start with a letter, and contain only letters, digits, or underscores'
      using errcode = '22023';
  end if;

  update public.profiles
     set nickname = v_clean::citext,
         updated_at = now()
   where user_id = auth.uid();

  if not found then
    -- Trigger should have created the row; this is a fallback.
    insert into public.profiles (user_id, nickname)
    values (auth.uid(), v_clean::citext);
  end if;

exception
  when unique_violation then
    raise exception 'That nickname is already taken'
      using errcode = '23505';
end;
$$;

revoke execute on function public.set_nickname(text) from public, anon;
grant execute on function public.set_nickname(text) to authenticated;

-- A cheap "is this free?" check. Reads the same unique index, so no leakage
-- beyond "taken / not taken". The RPC above is still the source of truth.
create or replace function public.nickname_available(p_nickname text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select not exists (
    select 1 from public.profiles
    where nickname = btrim(p_nickname)::citext
  );
$$;

revoke execute on function public.nickname_available(text) from public, anon;
grant execute on function public.nickname_available(text) to authenticated;

-- ============================================================
-- Visits (last seen tracking)
-- ============================================================

create table if not exists public.user_visits (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

create index if not exists user_visits_last_seen_idx
  on public.user_visits (last_seen_at desc);

alter table public.user_visits enable row level security;

-- Users can read their own row (harmless, useful for "your first visit" UI)
drop policy if exists "visits_select_own" on public.user_visits;
create policy "visits_select_own"
  on public.user_visits for select to authenticated
  using (user_id = auth.uid());

-- Admins can read all
drop policy if exists "visits_select_admin" on public.user_visits;
create policy "visits_select_admin"
  on public.user_visits for select to authenticated
  using (public.is_admin());

-- No insert/update policy for users: writes go through the RPC below.

create or replace function public.touch_visit()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return; -- anonymous-not-signed-in; nothing to record
  end if;

  insert into public.user_visits (user_id, first_seen_at, last_seen_at)
  values (auth.uid(), now(), now())
  on conflict (user_id) do update
    set last_seen_at = now();
end;
$$;

revoke execute on function public.touch_visit() from public, anon;
grant execute on function public.touch_visit() to authenticated;

-- Admin-only stats RPC: returns the counts the dashboard needs
create or replace function public.visitor_stats(p_days int default 7)
returns table (
  total_visitors bigint,
  new_in_window bigint,
  returning_in_window bigint
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  cutoff timestamptz := now() - make_interval(days => greatest(p_days, 1));
begin
  if not public.is_admin() then
    raise exception 'Not allowed';
  end if;

  return query
    select
      (select count(*) from public.user_visits),
      (select count(*) from public.user_visits where first_seen_at >= cutoff),
      (select count(*) from public.user_visits
         where last_seen_at >= cutoff and first_seen_at < cutoff);
end;
$$;

revoke execute on function public.visitor_stats(int) from public, anon;
grant execute on function public.visitor_stats(int) to authenticated;

-- ============================================================
-- Replies: denormalize nickname onto posts/replies so PostCard
-- can render without an extra join on every row.
--
-- Actually, we don't denormalize. PostCard already fetches posts;
-- we'll join profiles at read time via a new view instead.
-- ============================================================

-- A view that joins posts with their author's nickname and emoji.
-- `security_invoker = true` means RLS on the underlying tables still applies.
create or replace view public.posts_with_author
with (security_invoker = true)
as
select
  p.*,
  pr.nickname as author_nickname
from public.posts p
left join public.profiles pr on pr.user_id = p.author_id;

grant select on public.posts_with_author to authenticated;