-- Seeker Of SoundZ Supabase schema v4.11.0-foundation
-- Run in a NEW Supabase project SQL Editor.

create extension if not exists pgcrypto;

create type public.app_role as enum ('owner','administrator','moderator','dj','artist','premium_member','member');
create type public.notification_type as enum ('reply','mention','reaction','achievement','announcement','system');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[A-Za-z0-9_]{3,24}$'),
  display_name text not null default '',
  avatar_url text,
  banner_url text,
  biography text not null default '',
  location text not null default '',
  favorite_genres text[] not null default '{}',
  social_links jsonb not null default '{}'::jsonb,
  website_links jsonb not null default '{}'::jsonb,
  role public.app_role not null default 'member',
  rank_name text not null default 'New Listener',
  reputation integer not null default 0,
  reactions_received integer not null default 0,
  is_banned boolean not null default false,
  ban_reason text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.forum_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text not null default '',
  icon text,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.forum_topics (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.forum_categories(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 180),
  body text not null check (char_length(body) between 1 and 50000),
  tags text[] not null default '{}',
  is_pinned boolean not null default false,
  is_locked boolean not null default false,
  is_solved boolean not null default false,
  is_featured boolean not null default false,
  is_hidden boolean not null default false,
  view_count bigint not null default 0,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.forum_topics(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_reply_id uuid references public.forum_replies(id) on delete cascade,
  quoted_reply_id uuid references public.forum_replies(id) on delete set null,
  body text not null check (char_length(body) between 1 and 30000),
  is_solution boolean not null default false,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.forum_reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic_id uuid references public.forum_topics(id) on delete cascade,
  reply_id uuid references public.forum_replies(id) on delete cascade,
  reaction text not null check (char_length(reaction) between 1 and 32),
  created_at timestamptz not null default now(),
  check ((topic_id is not null)::int + (reply_id is not null)::int = 1),
  unique nulls not distinct (user_id, topic_id, reply_id, reaction)
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  topic_id uuid references public.forum_topics(id) on delete cascade,
  reply_id uuid references public.forum_replies(id) on delete cascade,
  bucket text not null,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  created_at timestamptz not null default now()
);

create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  category text not null default 'other',
  image_url text not null,
  storage_path text,
  is_profile_item boolean not null default false,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.music_releases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  artist text not null,
  description text not null default '',
  genres text[] not null default '{}',
  artwork_url text,
  preview_url text,
  full_track_url text,
  release_date date,
  bpm integer check (bpm between 1 and 400),
  musical_key text,
  access_level text not null default 'public' check (access_level in ('public','member','premium','purchase')),
  price numeric(10,2) not null default 0,
  purchase_url text,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  body text not null,
  link_url text,
  audience text not null default 'all' check (audience in ('all','members','premium','staff')),
  priority integer not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text not null,
  icon_url text,
  points integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.user_achievements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type public.notification_type not null,
  title text not null,
  body text not null default '',
  link_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index forum_topics_category_activity_idx on public.forum_topics(category_id, is_pinned desc, last_activity_at desc);
create index forum_replies_topic_created_idx on public.forum_replies(topic_id, created_at);
create index notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index gallery_owner_created_idx on public.gallery_items(owner_id, created_at desc);
create index music_published_release_idx on public.music_releases(is_published, release_date desc);

create or replace function public.is_staff(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles p where p.id = uid and p.role in ('owner','administrator','moderator') and not p.is_banned);
$$;

create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles p where p.id = uid and p.role in ('owner','administrator') and not p.is_banned);
$$;

create or replace function public.can_participate(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles p where p.id = uid and not p.is_banned);
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, username, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'username',''), 'member_' || substr(new.id::text,1,8)),
    coalesce(nullif(new.raw_user_meta_data->>'display_name',''), 'New Member')
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();
