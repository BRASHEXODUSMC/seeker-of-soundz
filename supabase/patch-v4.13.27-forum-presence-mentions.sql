-- Seeker Of SoundZ v4.13.27
-- Forum member presence privacy, mention autocomplete directory, and reaction/delete polish.
-- Run ONCE after patch-v4.13.26-forum-replies-notification-details.sql.

alter table public.profiles
  add column if not exists presence_visibility text not null default 'automatic';

alter table public.profiles
  drop constraint if exists profiles_presence_visibility_check;

alter table public.profiles
  add constraint profiles_presence_visibility_check
  check (presence_visibility in ('automatic','offline','hidden'));

grant update (presence_visibility,activity_status,last_seen_at,updated_at)
on public.profiles to authenticated;

create or replace function public.forum_member_directory()
returns table(
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  role public.app_role,
  rank_name text,
  reputation integer,
  biography text,
  location text,
  activity_status text,
  last_seen_at timestamptz,
  presence_visibility text,
  presence_state text,
  is_banned boolean
)
language sql
stable
security definer
set search_path=public
as $$
  select
    profile.id,
    profile.username,
    profile.display_name,
    profile.avatar_url,
    profile.role,
    profile.rank_name,
    profile.reputation,
    profile.biography,
    profile.location,
    case when profile.presence_visibility='hidden' then 'Presence hidden'
         else profile.activity_status end,
    case when profile.presence_visibility='hidden' then null
         else profile.last_seen_at end,
    profile.presence_visibility,
    case
      when profile.presence_visibility='hidden' then 'hidden'
      when profile.presence_visibility='offline' then 'offline'
      when profile.last_seen_at is not null and profile.last_seen_at > now()-interval '3 minutes' then 'online'
      else 'offline'
    end,
    profile.is_banned
  from public.profiles profile
  where not profile.is_banned
  order by
    case
      when profile.presence_visibility='automatic'
       and profile.last_seen_at is not null
       and profile.last_seen_at > now()-interval '3 minutes' then 0
      when profile.presence_visibility='offline' then 1
      else 2
    end,
    lower(coalesce(nullif(profile.display_name,''),profile.username));
$$;

grant execute on function public.forum_member_directory() to anon,authenticated;

create or replace function public.forum_get_feed()
returns jsonb
language sql
stable
security definer
set search_path=public
as $$
with visible_topics as(
  select topic.* from public.forum_topics topic where topic.is_hidden=false
),
visible_replies as(
  select reply.* from public.forum_replies reply
  join visible_topics topic on topic.id=reply.topic_id
  where reply.is_hidden=false
),
relevant_profile_ids as(
  select author_id as id from visible_topics
  union select author_id as id from visible_replies
)
select jsonb_build_object(
  'topics',coalesce((select jsonb_agg(to_jsonb(topic) order by topic.is_pinned desc,topic.last_activity_at desc,topic.created_at desc) from visible_topics topic),'[]'::jsonb),
  'replies',coalesce((select jsonb_agg(to_jsonb(reply) order by reply.created_at) from visible_replies reply),'[]'::jsonb),
  'reactions',coalesce((select jsonb_agg(to_jsonb(reaction)) from public.forum_reactions reaction join visible_topics topic on topic.id=reaction.topic_id),'[]'::jsonb),
  'profiles',coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',profile.id,
      'username',profile.username,
      'display_name',profile.display_name,
      'avatar_url',profile.avatar_url,
      'role',profile.role,
      'rank_name',profile.rank_name,
      'reputation',profile.reputation,
      'biography',profile.biography,
      'location',profile.location,
      'is_banned',profile.is_banned,
      'created_at',profile.created_at,
      'presence_visibility',profile.presence_visibility,
      'last_seen_at',case when profile.presence_visibility='hidden' then null else profile.last_seen_at end,
      'activity_status',case when profile.presence_visibility='hidden' then 'Presence hidden' else profile.activity_status end
    ))
    from public.profiles profile
    join relevant_profile_ids ids on ids.id=profile.id
  ),'[]'::jsonb),
  'members',coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',directory.id,
      'username',directory.username,
      'display_name',directory.display_name,
      'avatar_url',directory.avatar_url,
      'role',directory.role,
      'rank_name',directory.rank_name,
      'reputation',directory.reputation,
      'biography',directory.biography,
      'location',directory.location,
      'last_seen_at',directory.last_seen_at,
      'activity_status',directory.activity_status,
      'presence_visibility',directory.presence_visibility,
      'presence_state',directory.presence_state,
      'is_banned',directory.is_banned
    ))
    from public.forum_member_directory() directory
  ),'[]'::jsonb)
);
$$;

grant execute on function public.forum_get_feed() to anon,authenticated;
