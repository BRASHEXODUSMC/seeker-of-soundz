-- Seeker Of SoundZ v4.19.1
-- Assign the requested account as the site Owner.
-- Run this once in Supabase SQL Editor while signed in as the project owner.

do $$
declare
  target_id uuid;
begin
  select id into target_id
  from auth.users
  where lower(email) = lower('romerojoseph95@gmail.com')
  order by created_at asc
  limit 1;

  if target_id is null then
    raise exception 'No Authentication user exists for romerojoseph95@gmail.com.';
  end if;

  insert into public.profiles (
    id,
    username,
    display_name,
    role,
    rank_name,
    updated_at
  )
  values (
    target_id,
    'BRASHEXODUS',
    'BRASHEXODUS',
    'owner'::public.app_role,
    'Owner',
    now()
  )
  on conflict (id) do update
  set role = 'owner'::public.app_role,
      rank_name = 'Owner',
      username = case
        when coalesce(public.profiles.username, '') = '' then 'BRASHEXODUS'
        else public.profiles.username
      end,
      display_name = case
        when coalesce(public.profiles.display_name, '') = '' then 'BRASHEXODUS'
        else public.profiles.display_name
      end,
      is_banned = false,
      ban_reason = null,
      updated_at = now();

  update auth.users
  set raw_app_meta_data =
      coalesce(raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('app_role', 'owner')
  where id = target_id;
end
$$;

select
  u.email,
  p.username,
  p.display_name,
  p.role,
  p.rank_name,
  p.is_banned
from auth.users u
join public.profiles p on p.id = u.id
where lower(u.email) = lower('romerojoseph95@gmail.com');
