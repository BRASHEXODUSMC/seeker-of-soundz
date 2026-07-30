-- Run in Supabase SQL Editor after enabling Supabase Auth.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'member' check (role in ('member','moderator','admin')),
  vip_active boolean not null default false,
  vip_status text not null default 'inactive',
  stripe_customer_id text,
  stripe_subscription_id text,
  updated_at timestamptz not null default now()
);

create table if not exists public.forum_posts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  is_pinned boolean not null default false,
  is_locked boolean not null default false,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.forum_replies (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.forum_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.forum_posts enable row level security;
alter table public.forum_replies enable row level security;

create policy "profiles readable by owner" on public.profiles for select using (auth.uid() = id);
create policy "posts readable by signed-in users" on public.forum_posts for select to authenticated using (not is_hidden);
create policy "users create own posts" on public.forum_posts for insert to authenticated with check (auth.uid() = user_id);
create policy "users update own posts" on public.forum_posts for update to authenticated using (auth.uid() = user_id);
create policy "replies readable by signed-in users" on public.forum_replies for select to authenticated using (true);
create policy "users create own replies" on public.forum_replies for insert to authenticated with check (auth.uid() = user_id);
create policy "users delete own replies" on public.forum_replies for delete to authenticated using (auth.uid() = user_id);

-- IMPORTANT: do not allow members to update vip_active themselves.
-- Update VIP fields only from a trusted server/Edge Function using the service role.
