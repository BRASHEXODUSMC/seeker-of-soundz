-- Seeker Of SoundZ v4.13.15 reliable reply reaction functions
-- Run once after patch-v4.13.12-forum-reactions-delete.sql.

create or replace function public.forum_get_reply_reactions(target_reply uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not exists (select 1 from public.forum_replies where id = target_reply and is_hidden = false) then
    raise exception 'Reply not found.';
  end if;

  select jsonb_build_object(
    'counts', jsonb_build_object(
      'heart', count(*) filter (where reaction = 'heart'),
      'fire', count(*) filter (where reaction = 'fire'),
      'clap', count(*) filter (where reaction = 'clap'),
      'laugh', count(*) filter (where reaction = 'laugh'),
      'wow', count(*) filter (where reaction = 'wow'),
      'support', count(*) filter (where reaction = 'support')
    ),
    'mine', coalesce(
      jsonb_agg(reaction order by reaction) filter (where user_id = auth.uid()),
      '[]'::jsonb
    )
  ) into result
  from public.forum_reactions
  where reply_id = target_reply;

  return coalesce(result, jsonb_build_object('counts', '{}'::jsonb, 'mine', '[]'::jsonb));
end;
$$;

grant execute on function public.forum_get_reply_reactions(uuid) to anon, authenticated;

create or replace function public.forum_toggle_reply_reaction(
  target_reply uuid,
  reaction_value text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_reaction text := lower(trim(coalesce(reaction_value, '')));
  existing_id uuid;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to react.';
  end if;
  if not public.can_participate(auth.uid()) then
    raise exception 'Your account cannot participate right now.';
  end if;
  if normalized_reaction not in ('heart','fire','clap','laugh','wow','support') then
    raise exception 'That reaction is not available.';
  end if;
  if not exists (select 1 from public.forum_replies where id = target_reply and is_hidden = false) then
    raise exception 'Reply not found.';
  end if;

  select id into existing_id
  from public.forum_reactions
  where user_id = auth.uid()
    and reply_id = target_reply
    and topic_id is null
    and reaction = normalized_reaction
  limit 1;

  if existing_id is not null then
    delete from public.forum_reactions where id = existing_id;
  else
    insert into public.forum_reactions(user_id, topic_id, reply_id, reaction)
    values(auth.uid(), null, target_reply, normalized_reaction);
  end if;

  return public.forum_get_reply_reactions(target_reply);
end;
$$;

grant execute on function public.forum_toggle_reply_reaction(uuid,text) to authenticated;
