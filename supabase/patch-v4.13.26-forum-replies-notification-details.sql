-- Seeker Of SoundZ v4.13.26
-- Forum nested reply notifications, detailed mentions, project-scoped collaboration alerts,
-- and public online/offline member directory.
-- Run ONCE after patch-v4.13.25-notifications-presence.sql.

-- Collaboration alerts remain strictly limited to members of the project where
-- the message was created. Members who only have general Collaboration Studio
-- access do not receive messages from unrelated projects.
create or replace function public.notify_collaboration_message()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  sender_name text;
  project_name text;
begin
  select coalesce(display_name,username,'A collaborator')
  into sender_name
  from public.profiles
  where id=new.sender_id;

  select title into project_name
  from public.collaboration_projects
  where id=new.project_id;

  insert into public.notifications(user_id,actor_id,type,title,body,link_url)
  select distinct
    member.user_id,
    new.sender_id,
    'system'::public.notification_type,
    coalesce(project_name,'Collaboration project'),
    sender_name || ' sent a new message in “' || coalesce(project_name,'Collaboration project') || '”.',
    'collaboration.html?project=' || new.project_id::text
  from public.collaboration_project_members member
  where member.project_id=new.project_id
    and member.user_id<>new.sender_id;

  return new;
end;
$$;

drop trigger if exists collaboration_message_notification on public.collaboration_messages;
create trigger collaboration_message_notification
after insert on public.collaboration_messages
for each row execute function public.notify_collaboration_message();

-- Mention alerts now include the discussion title and sender.
create or replace function public.create_forum_mention_notifications()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  source_text text;
  destination text;
  actor_name text;
  discussion_title text;
  discussion_id uuid;
begin
  source_text:=coalesce(new.body,'');

  select coalesce(display_name,username,'A member')
  into actor_name
  from public.profiles
  where id=new.author_id;

  if tg_table_name='forum_topics' then
    discussion_id:=new.id;
    discussion_title:=new.title;
    source_text:=coalesce(new.title,'') || ' ' || source_text;
    destination:='forums.html?topic=' || new.id::text;
  else
    discussion_id:=new.topic_id;
    select title into discussion_title
    from public.forum_topics
    where id=new.topic_id;
    destination:='forums.html?topic=' || new.topic_id::text || '&reply=' || new.id::text;
  end if;

  insert into public.notifications(user_id,actor_id,type,title,body,link_url)
  select distinct
    profile.id,
    new.author_id,
    'mention'::public.notification_type,
    coalesce(discussion_title,'Forum mention'),
    actor_name || ' mentioned you in “' || coalesce(discussion_title,'a forum discussion') || '”.',
    destination
  from regexp_matches(source_text,'@([A-Za-z0-9_]{3,24})','g') as rm(found)
  join public.profiles profile on lower(profile.username)=lower(rm.found[1])
  where profile.id<>new.author_id
    and not profile.is_banned;

  return new;
end;
$$;

drop trigger if exists forum_topic_mention_notification on public.forum_topics;
create trigger forum_topic_mention_notification
after insert on public.forum_topics
for each row execute function public.create_forum_mention_notifications();

drop trigger if exists forum_reply_mention_notification on public.forum_replies;
create trigger forum_reply_mention_notification
after insert on public.forum_replies
for each row execute function public.create_forum_mention_notifications();

-- A direct reply notifies the member whose reply was selected.
-- A normal top-level reply notifies the discussion author.
create or replace function public.notify_forum_reply_recipient()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  recipient_id uuid;
  recipient_username text;
  actor_name text;
  discussion_title text;
begin
  select title into discussion_title
  from public.forum_topics
  where id=new.topic_id;

  if new.parent_reply_id is not null then
    select author_id into recipient_id
    from public.forum_replies
    where id=new.parent_reply_id;
  else
    select author_id into recipient_id
    from public.forum_topics
    where id=new.topic_id;
  end if;

  if recipient_id is null or recipient_id=new.author_id then
    return new;
  end if;

  select username into recipient_username
  from public.profiles
  where id=recipient_id;

  -- Do not send a duplicate direct-reply alert when the same member was
  -- explicitly tagged with @username in the reply body.
  if recipient_username is not null
     and position('@' || lower(recipient_username) in lower(new.body)) > 0 then
    return new;
  end if;

  select coalesce(display_name,username,'A member')
  into actor_name
  from public.profiles
  where id=new.author_id;

  insert into public.notifications(user_id,actor_id,type,title,body,link_url)
  values(
    recipient_id,
    new.author_id,
    'reply'::public.notification_type,
    coalesce(discussion_title,'New forum reply'),
    actor_name || case when new.parent_reply_id is null then ' replied to your discussion “' else ' replied to you in “' end
      || coalesce(discussion_title,'a forum discussion') || '”.',
    'forums.html?topic=' || new.topic_id::text || '&reply=' || new.id::text
  );

  return new;
end;
$$;

drop trigger if exists forum_direct_reply_notification on public.forum_replies;
create trigger forum_direct_reply_notification
after insert on public.forum_replies
for each row execute function public.notify_forum_reply_recipient();

-- Extend the forum feed with the public member directory and the fields needed
-- for online indicators and profile hover cards.
create or replace function public.forum_get_feed()
returns jsonb
language sql
stable
security definer
set search_path=public
as $$
with visible_topics as(
  select topic.*
  from public.forum_topics topic
  where topic.is_hidden=false
),
visible_replies as(
  select reply.*
  from public.forum_replies reply
  join visible_topics topic on topic.id=reply.topic_id
  where reply.is_hidden=false
),
relevant_profile_ids as(
  select author_id as id from visible_topics
  union
  select author_id as id from visible_replies
)
select jsonb_build_object(
  'topics',coalesce((
    select jsonb_agg(to_jsonb(topic) order by topic.is_pinned desc,topic.last_activity_at desc,topic.created_at desc)
    from visible_topics topic
  ),'[]'::jsonb),
  'replies',coalesce((
    select jsonb_agg(to_jsonb(reply) order by reply.created_at)
    from visible_replies reply
  ),'[]'::jsonb),
  'reactions',coalesce((
    select jsonb_agg(to_jsonb(reaction))
    from public.forum_reactions reaction
    join visible_topics topic on topic.id=reaction.topic_id
  ),'[]'::jsonb),
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
      'last_seen_at',profile.last_seen_at,
      'activity_status',profile.activity_status
    ))
    from public.profiles profile
    join relevant_profile_ids ids on ids.id=profile.id
  ),'[]'::jsonb),
  'members',coalesce((
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
      'last_seen_at',profile.last_seen_at,
      'activity_status',profile.activity_status,
      'is_banned',profile.is_banned
    ) order by profile.display_name,profile.username)
    from public.profiles profile
    where not profile.is_banned
  ),'[]'::jsonb)
);
$$;

grant execute on function public.forum_get_feed() to anon,authenticated;
