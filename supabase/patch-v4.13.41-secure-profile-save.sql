-- Seeker Of SoundZ v4.13.41
-- Secure profile save function.
-- Run ONCE in the correct Supabase project:
-- https://ywwlwkveymypvbvlzccv.supabase.co

create or replace function public.save_my_profile(
  p_username text,
  p_display_name text default '',
  p_location text default '',
  p_biography text default '',
  p_avatar_url text default null,
  p_activity_status text default 'Exploring the frequency',
  p_presence_visibility text default 'automatic',
  p_social_links jsonb default '{}'::jsonb
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  saved public.profiles;
  clean_username text := trim(coalesce(p_username,''));
  clean_presence text := lower(trim(coalesce(p_presence_visibility,'automatic')));
begin
  if uid is null then
    raise exception 'You must be signed in to save your profile.';
  end if;

  if clean_username !~ '^[A-Za-z0-9_]{3,24}$' then
    raise exception 'Username must be 3–24 characters using letters, numbers, or underscores.';
  end if;

  if clean_presence not in ('automatic','offline','hidden') then
    clean_presence := 'automatic';
  end if;

  if exists (
    select 1
    from public.profiles
    where lower(username) = lower(clean_username)
      and id <> uid
  ) then
    raise exception 'That username is already being used. Please choose another.';
  end if;

  insert into public.profiles (
    id,
    username,
    display_name,
    location,
    biography,
    avatar_url,
    activity_status,
    presence_visibility,
    social_links,
    last_seen_at,
    updated_at
  )
  values (
    uid,
    clean_username,
    trim(coalesce(p_display_name,'')),
    trim(coalesce(p_location,'')),
    trim(coalesce(p_biography,'')),
    nullif(trim(coalesce(p_avatar_url,'')),''),
    left(trim(coalesce(p_activity_status,'Exploring the frequency')),80),
    clean_presence,
    coalesce(p_social_links,'{}'::jsonb),
    now(),
    now()
  )
  on conflict (id) do update set
    username = excluded.username,
    display_name = excluded.display_name,
    location = excluded.location,
    biography = excluded.biography,
    avatar_url = excluded.avatar_url,
    activity_status = excluded.activity_status,
    presence_visibility = excluded.presence_visibility,
    social_links = excluded.social_links,
    last_seen_at = now(),
    updated_at = now()
  returning * into saved;

  return saved;
end;
$$;

revoke all on function public.save_my_profile(
  text,text,text,text,text,text,text,jsonb
) from public, anon;

grant execute on function public.save_my_profile(
  text,text,text,text,text,text,text,jsonb
) to authenticated;
