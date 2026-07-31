-- Seeker Of SoundZ v4.13.22
-- Collaboration approved-member directory synchronization.
-- Run this patch once.

create or replace function public.collaboration_list_eligible_members()
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  rank_name text,
  role text,
  collaboration_access boolean,
  is_banned boolean
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  caller_allowed boolean;
begin
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and not coalesce(p.is_banned, false)
      and (
        coalesce(p.collaboration_access, false)
        or p.role in ('owner', 'administrator')
      )
  ) into caller_allowed;

  if not caller_allowed then
    raise exception 'Collaboration Studio access is required.';
  end if;

  return query
  select
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.rank_name,
    p.role::text,
    p.collaboration_access,
    p.is_banned
  from public.profiles p
  where not coalesce(p.is_banned, false)
    and (
      coalesce(p.collaboration_access, false)
      or p.role in ('owner', 'administrator')
    )
  order by
    lower(coalesce(nullif(p.display_name, ''), nullif(p.username, ''), 'member')),
    p.created_at;
end;
$$;

revoke all on function public.collaboration_list_eligible_members() from public;
grant execute on function public.collaboration_list_eligible_members() to authenticated;
