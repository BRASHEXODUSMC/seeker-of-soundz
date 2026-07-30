-- Seeker Of SoundZ v4.13.11 forum feed visibility patch
-- Run ONCE after patch-v4.13.9-forum-sync-rpc.sql.
-- This does not delete or replace existing forum content.

create or replace function public.forum_get_feed()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with visible_topics as (
    select t.*
    from public.forum_topics t
    where t.is_hidden = false
  ),
  visible_replies as (
    select r.*
    from public.forum_replies r
    join visible_topics t on t.id = r.topic_id
    where r.is_hidden = false
  ),
  relevant_profile_ids as (
    select author_id as id from visible_topics
    union
    select author_id as id from visible_replies
  )
  select jsonb_build_object(
    'topics', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.is_pinned desc, t.last_activity_at desc, t.created_at desc)
      from visible_topics t
    ), '[]'::jsonb),
    'replies', coalesce((
      select jsonb_agg(to_jsonb(r) order by r.created_at asc)
      from visible_replies r
    ), '[]'::jsonb),
    'reactions', coalesce((
      select jsonb_agg(to_jsonb(fr))
      from public.forum_reactions fr
      join visible_topics t on t.id = fr.topic_id
    ), '[]'::jsonb),
    'profiles', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'username', p.username,
        'display_name', p.display_name,
        'avatar_url', p.avatar_url,
        'role', p.role,
        'is_banned', p.is_banned,
        'created_at', p.created_at
      ))
      from public.profiles p
      join relevant_profile_ids ids on ids.id = p.id
    ), '[]'::jsonb)
  );
$$;

grant execute on function public.forum_get_feed() to anon, authenticated;
