-- Seeker Of SoundZ v4.19.7
-- Admin-managed Socials page links.
-- Run once in the correct Supabase project SQL Editor.

create table if not exists public.site_social_links (
  id uuid primary key default gen_random_uuid(),
  platform_key text unique not null,
  platform_name text not null,
  category_label text not null default 'Connect',
  description text not null default '',
  icon text not null default '↗',
  profile_url text not null default '',
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  is_visible boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_social_key_format check (platform_key ~ '^[a-z0-9_-]+$')
);

alter table public.site_social_links enable row level security;

drop policy if exists site_social_links_public_read on public.site_social_links;
create policy site_social_links_public_read
on public.site_social_links
for select
to anon, authenticated
using (is_visible or public.is_admin(auth.uid()));

drop policy if exists site_social_links_admin_manage on public.site_social_links;
create policy site_social_links_admin_manage
on public.site_social_links
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

grant select on public.site_social_links to anon, authenticated;
grant insert, update, delete on public.site_social_links to authenticated;

create or replace function public.get_site_social_links()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'key', platform_key,
        'name', platform_name,
        'category', category_label,
        'description', description,
        'icon', icon,
        'url', profile_url,
        'sort_order', sort_order,
        'featured', is_featured,
        'visible', is_visible,
        'updated_at', updated_at
      )
      order by sort_order, platform_name
    ) filter (where is_visible),
    '[]'::jsonb
  )
  from public.site_social_links;
$$;

grant execute on function public.get_site_social_links() to anon, authenticated;

create or replace function public.admin_get_site_social_links()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.is_admin(auth.uid()) then
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', id,
            'key', platform_key,
            'name', platform_name,
            'category', category_label,
            'description', description,
            'icon', icon,
            'url', profile_url,
            'sort_order', sort_order,
            'featured', is_featured,
            'visible', is_visible,
            'updated_at', updated_at
          )
          order by sort_order, platform_name
        ),
        '[]'::jsonb
      )
    else '[]'::jsonb
  end
  from public.site_social_links;
$$;

grant execute on function public.admin_get_site_social_links() to authenticated;

create or replace function public.admin_save_site_social_link(
  p_platform_key text,
  p_platform_name text,
  p_category_label text,
  p_description text,
  p_icon text,
  p_profile_url text,
  p_sort_order integer default 0,
  p_is_featured boolean default false,
  p_is_visible boolean default true
)
returns public.site_social_links
language plpgsql
security definer
set search_path = public
as $$
declare
  saved public.site_social_links;
  clean_key text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Administrator access is required.';
  end if;

  clean_key := lower(regexp_replace(trim(coalesce(p_platform_key,'')), '[^a-zA-Z0-9_-]+', '-', 'g'));
  if clean_key = '' then raise exception 'Platform key is required.'; end if;
  if trim(coalesce(p_platform_name,'')) = '' then raise exception 'Platform name is required.'; end if;

  insert into public.site_social_links (
    platform_key, platform_name, category_label, description, icon,
    profile_url, sort_order, is_featured, is_visible, updated_by, updated_at
  )
  values (
    clean_key,
    trim(p_platform_name),
    trim(coalesce(p_category_label,'Connect')),
    trim(coalesce(p_description,'')),
    left(coalesce(nullif(trim(p_icon),''),'↗'),8),
    trim(coalesce(p_profile_url,'')),
    coalesce(p_sort_order,0),
    coalesce(p_is_featured,false),
    coalesce(p_is_visible,true),
    auth.uid(),
    now()
  )
  on conflict (platform_key) do update set
    platform_name = excluded.platform_name,
    category_label = excluded.category_label,
    description = excluded.description,
    icon = excluded.icon,
    profile_url = excluded.profile_url,
    sort_order = excluded.sort_order,
    is_featured = excluded.is_featured,
    is_visible = excluded.is_visible,
    updated_by = auth.uid(),
    updated_at = now()
  returning * into saved;

  return saved;
end;
$$;

grant execute on function public.admin_save_site_social_link(
  text,text,text,text,text,text,integer,boolean,boolean
) to authenticated;

create or replace function public.admin_delete_site_social_link(p_platform_key text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Administrator access is required.';
  end if;
  delete from public.site_social_links where platform_key = p_platform_key;
  return found;
end;
$$;

grant execute on function public.admin_delete_site_social_link(text) to authenticated;

insert into public.site_social_links
(platform_key,platform_name,category_label,description,icon,profile_url,sort_order,is_featured,is_visible)
values
('youtube','YouTube','Videos','Music videos, live sets, production content, and official uploads.','▶','',10,true,true),
('twitch','Twitch','Livestreams','Live DJ sessions, production streams, and real-time community interaction.','●','',20,false,true),
('instagram','Instagram','Visual Updates','Photos, reels, event highlights, announcements, and daily creativity.','◎','',30,false,true),
('soundcloud','SoundCloud','Music','Tracks, mixes, works in progress, and audio experiments.','◒','',40,false,true),
('tiktok','TikTok','Short Form','Quick performances, edits, sound ideas, and behind-the-scenes clips.','♪','',50,false,true),
('facebook','Facebook','Community','Announcements, event updates, photos, and community posts.','f','',60,false,true),
('spotify','Spotify','Streaming','Official tracks, releases, playlists, and artist updates.','♫','',70,false,true),
('linktree','Linktree','Everything','Open every official Seeker Of SoundZ destination from one link.','↗','',80,false,true)
on conflict (platform_key) do nothing;

do $$
begin
  if not exists(
    select 1 from pg_publication_tables
    where pubname='supabase_realtime'
      and schemaname='public'
      and tablename='site_social_links'
  ) then
    alter publication supabase_realtime add table public.site_social_links;
  end if;
end
$$;
