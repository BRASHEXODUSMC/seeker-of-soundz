-- Seeker Of SoundZ v4.19.2
-- Make brashexodus@gmail.com the site Owner.
-- Owner includes all Administrator permissions in the current role system.
-- Run once in Supabase SQL Editor as the Supabase project owner.

do $$
declare
  target_id uuid;
begin
  select id
  into target_id
  from auth.users
  where lower(email) = lower('brashexodus@gmail.com')
  order by created_at asc
  limit 1;

  if target_id is null then
    raise exception 'No Authentication user exists for brashexodus@gmail.com.';
  end if;

  insert into public.profiles (
    id,
    username,
    display_name,
    role,
    rank_name,
    collaboration_access,
    is_banned,
    ban_reason,
    updated_at
  )
  values (
    target_id,
    'BRASHEXODUS',
    'BRASHEXODUS',
    'owner'::public.app_role,
    'Owner',
    true,
    false,
    null,
    now()
  )
  on conflict (id) do update
  set role = 'owner'::public.app_role,
      rank_name = 'Owner',
      collaboration_access = true,
      is_banned = false,
      ban_reason = null,
      username = case
        when coalesce(trim(public.profiles.username), '') = '' then 'BRASHEXODUS'
        else public.profiles.username
      end,
      display_name = case
        when coalesce(trim(public.profiles.display_name), '') = '' then 'BRASHEXODUS'
        else public.profiles.display_name
      end,
      updated_at = now();

  update auth.users
  set raw_app_meta_data =
        coalesce(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object(
             'app_role', 'owner',
             'role', 'owner',
             'is_owner', true,
             'is_admin', true
           )
  where id = target_id;
end
$$;

select
  u.id,
  u.email,
  p.username,
  p.display_name,
  p.role,
  p.rank_name,
  p.collaboration_access,
  p.is_banned
from auth.users u
join public.profiles p on p.id = u.id
where lower(u.email) = lower('brashexodus@gmail.com');
