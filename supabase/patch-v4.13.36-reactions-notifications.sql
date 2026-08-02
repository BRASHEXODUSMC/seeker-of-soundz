-- Seeker Of SoundZ v4.13.36
-- Stable forum reactions plus Supabase notifications for post/reply owners.
-- Run ONCE after patch-v4.13.35-forum-reaction-display.sql.

create or replace function public.forum_get_reaction_summary(
  target_topic uuid default null,
  target_reply uuid default null
) returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare result jsonb;
begin
  if ((target_topic is not null)::int + (target_reply is not null)::int) <> 1 then
    raise exception 'Choose one forum reaction target.';
  end if;

  if target_topic is not null and not exists(
    select 1 from public.forum_topics where id=target_topic and not is_hidden
  ) then raise exception 'Discussion not found.'; end if;

  if target_reply is not null and not exists(
    select 1 from public.forum_replies where id=target_reply and not is_hidden
  ) then raise exception 'Reply not found.'; end if;

  select jsonb_build_object(
    'counts',jsonb_build_object(
      'heart',count(*) filter(where reaction='heart'),
      'fire',count(*) filter(where reaction='fire'),
      'clap',count(*) filter(where reaction='clap'),
      'laugh',count(*) filter(where reaction='laugh'),
      'wow',count(*) filter(where reaction='wow'),
      'support',count(*) filter(where reaction='support')
    ),
    'mine',coalesce(
      jsonb_agg(reaction order by reaction) filter(where user_id=auth.uid()),
      '[]'::jsonb
    )
  ) into result
  from public.forum_reactions
  where topic_id is not distinct from target_topic
    and reply_id is not distinct from target_reply;

  return coalesce(result,jsonb_build_object('counts','{}'::jsonb,'mine','[]'::jsonb));
end;
$$;

grant execute on function public.forum_get_reaction_summary(uuid,uuid) to anon,authenticated;

create or replace function public.forum_toggle_reaction_v41335(
  target_topic uuid default null,
  target_reply uuid default null,
  reaction_value text default 'heart'
) returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  normalized_reaction text:=lower(trim(coalesce(reaction_value,'')));
  existing_id uuid;
begin
  if auth.uid() is null then raise exception 'You must be signed in to react.'; end if;
  if not public.can_participate(auth.uid()) then raise exception 'Your account cannot participate right now.'; end if;

  if ((target_topic is not null)::int + (target_reply is not null)::int) <> 1 then
    raise exception 'Choose one forum reaction target.';
  end if;

  if normalized_reaction not in ('heart','fire','clap','laugh','wow','support') then
    raise exception 'That reaction is not available.';
  end if;

  if target_topic is not null and not exists(
    select 1 from public.forum_topics where id=target_topic and not is_hidden
  ) then raise exception 'Discussion not found.'; end if;

  if target_reply is not null and not exists(
    select 1 from public.forum_replies where id=target_reply and not is_hidden
  ) then raise exception 'Reply not found.'; end if;

  select id into existing_id
  from public.forum_reactions
  where user_id=auth.uid()
    and topic_id is not distinct from target_topic
    and reply_id is not distinct from target_reply
    and reaction=normalized_reaction
  limit 1;

  if existing_id is not null then
    delete from public.forum_reactions where id=existing_id;
  else
    insert into public.forum_reactions(user_id,topic_id,reply_id,reaction)
    values(auth.uid(),target_topic,target_reply,normalized_reaction);
  end if;

  return public.forum_get_reaction_summary(target_topic,target_reply);
end;
$$;

grant execute on function public.forum_toggle_reaction_v41335(uuid,uuid,text) to authenticated;

create or replace function public.notify_forum_reaction_owner()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  recipient_id uuid;
  topic_value uuid;
  topic_title text;
  actor_name text;
  reaction_name text;
  target_name text;
  destination text;
begin
  if new.topic_id is not null then
    select topic.author_id,topic.id,topic.title
      into recipient_id,topic_value,topic_title
    from public.forum_topics topic
    where topic.id=new.topic_id;

    target_name:='discussion';
    destination:='forums.html?topic='||new.topic_id::text;
  else
    select reply.author_id,reply.topic_id,topic.title
      into recipient_id,topic_value,topic_title
    from public.forum_replies reply
    join public.forum_topics topic on topic.id=reply.topic_id
    where reply.id=new.reply_id;

    target_name:='reply';
    destination:='forums.html?topic='||topic_value::text||'&reply='||new.reply_id::text;
  end if;

  if recipient_id is null or recipient_id=new.user_id then
    return new;
  end if;

  select coalesce(profile.display_name,profile.username,'A member')
    into actor_name
  from public.profiles profile
  where profile.id=new.user_id;

  reaction_name:=case new.reaction
    when 'heart' then 'Love ❤️'
    when 'fire' then 'Fire 🔥'
    when 'clap' then 'Applause 👏'
    when 'laugh' then 'Laugh 😂'
    when 'wow' then 'Wow 😮'
    when 'support' then 'Support 🙌'
    else initcap(new.reaction)
  end;

  insert into public.notifications(user_id,actor_id,type,title,body,link_url)
  values(
    recipient_id,
    new.user_id,
    'reaction'::public.notification_type,
    coalesce(topic_title,'Forum reaction'),
    actor_name||' reacted with '||reaction_name||' to your '||target_name||' in “'||coalesce(topic_title,'a forum discussion')||'”.',
    destination
  );

  return new;
end;
$$;

drop trigger if exists forum_reaction_owner_notification on public.forum_reactions;
create trigger forum_reaction_owner_notification
after insert on public.forum_reactions
for each row execute function public.notify_forum_reaction_owner();

do $$
begin
  if not exists(
    select 1
    from pg_publication_tables
    where pubname='supabase_realtime'
      and schemaname='public'
      and tablename='forum_reactions'
  ) then
    execute 'alter publication supabase_realtime add table public.forum_reactions';
  end if;
end $$;
