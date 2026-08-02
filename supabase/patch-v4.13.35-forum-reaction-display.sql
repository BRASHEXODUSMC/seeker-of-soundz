-- Seeker Of SoundZ v4.13.35
-- Reliable Supabase topic and reply emoji reactions.
-- Run ONCE after the existing forum reaction patches.

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
  ) then
    raise exception 'Discussion not found.';
  end if;

  if target_reply is not null and not exists(
    select 1 from public.forum_replies where id=target_reply and not is_hidden
  ) then
    raise exception 'Reply not found.';
  end if;

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
