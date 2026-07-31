
-- Seeker Of SoundZ v4.13.17
-- Supabase-backed Admin member directory and secure individual member updates.
-- Run this patch once after the earlier Supabase setup/patches.

create or replace function public.admin_list_members()
returns table (
  id uuid,
  email text,
  email_confirmed_at timestamptz,
  last_sign_in_at timestamptz,
  auth_created_at timestamptz,
  username text,
  display_name text,
  avatar_url text,
  role text,
  rank_name text,
  reputation integer,
  reactions_received integer,
  is_banned boolean,
  ban_reason text,
  last_seen_at timestamptz,
  profile_created_at timestamptz,
  updated_at timestamptz,
  location text,
  biography text,
  topic_count bigint,
  reply_count bigint
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller_role public.app_role;
begin
  select p.role into caller_role
  from public.profiles p
  where p.id = auth.uid();

  if caller_role is null or caller_role not in ('owner', 'administrator') then
    raise exception 'Administrator access is required.';
  end if;

  return query
  select
    u.id,
    u.email::text,
    u.email_confirmed_at,
    u.last_sign_in_at,
    u.created_at,
    p.username,
    p.display_name,
    p.avatar_url,
    p.role::text,
    p.rank_name,
    p.reputation,
    p.reactions_received,
    p.is_banned,
    p.ban_reason,
    p.last_seen_at,
    p.created_at,
    p.updated_at,
    p.location,
    p.biography,
    (select count(*) from public.forum_topics t where t.author_id = u.id),
    (select count(*) from public.forum_replies r where r.author_id = u.id)
  from auth.users u
  left join public.profiles p on p.id = u.id
  order by coalesce(p.last_seen_at, u.last_sign_in_at, u.created_at) desc;
end;
$$;

revoke all on function public.admin_list_members() from public;
grant execute on function public.admin_list_members() to authenticated;

create or replace function public.admin_update_member(
  target_user_id uuid,
  new_role text,
  new_rank_name text,
  new_reputation integer,
  new_is_banned boolean,
  new_ban_reason text
)
returns table (
  id uuid,
  role text,
  rank_name text,
  reputation integer,
  is_banned boolean,
  ban_reason text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller_role public.app_role;
  target_role public.app_role;
  desired_role public.app_role;
  owner_count integer;
begin
  select p.role into caller_role
  from public.profiles p
  where p.id = auth.uid();

  if caller_role is null or caller_role not in ('owner', 'administrator') then
    raise exception 'Administrator access is required.';
  end if;

  select p.role into target_role
  from public.profiles p
  where p.id = target_user_id;

  if target_role is null then
    raise exception 'That member profile does not exist.';
  end if;

  begin
    desired_role := new_role::public.app_role;
  exception when invalid_text_representation then
    raise exception 'That role is not valid.';
  end;

  if caller_role = 'administrator' and (target_role = 'owner' or desired_role = 'owner') then
    raise exception 'Only an Owner can manage the Owner role.';
  end if;

  if target_user_id = auth.uid() and coalesce(new_is_banned, false) then
    raise exception 'You cannot ban your own account.';
  end if;

  if target_role = 'owner' and desired_role <> 'owner' then
    select count(*) into owner_count from public.profiles where role = 'owner';
    if owner_count <= 1 then
      raise exception 'The final Owner account cannot be demoted.';
    end if;
  end if;

  update public.profiles p
  set
    role = desired_role,
    rank_name = left(coalesce(nullif(trim(new_rank_name), ''), 'New Listener'), 80),
    reputation = greatest(0, least(coalesce(new_reputation, 0), 100000000)),
    is_banned = coalesce(new_is_banned, false),
    ban_reason = case
      when coalesce(new_is_banned, false)
      then nullif(left(trim(coalesce(new_ban_reason, '')), 500), '')
      else null
    end,
    updated_at = now()
  where p.id = target_user_id;

  return query
  select p.id, p.role::text, p.rank_name, p.reputation,
         p.is_banned, p.ban_reason, p.updated_at
  from public.profiles p
  where p.id = target_user_id;
end;
$$;

revoke all on function public.admin_update_member(uuid, text, text, integer, boolean, text) from public;
grant execute on function public.admin_update_member(uuid, text, text, integer, boolean, text) to authenticated;
