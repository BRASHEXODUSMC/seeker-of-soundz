-- Seeker Of SoundZ v4.13.30
-- Achievement profile viewer and friendly username availability checks.
-- Run ONCE after the existing v4.13.27 presence patch.

insert into public.achievements(code,name,description,points,is_active)
values
 ('first_frequency','First Frequency','Create your Seeker Of SoundZ member profile.',10,true),
 ('first_topic','Signal Starter','Publish your first forum discussion.',15,true),
 ('five_topics','Frequency Broadcaster','Publish five forum discussions.',35,true),
 ('first_reply','First Response','Reply to a community discussion.',10,true),
 ('ten_replies','Community Voice','Post ten forum replies.',35,true),
 ('first_reaction','Positive Signal','React to a community post or reply.',10,true),
 ('ten_reactions','Energy Amplifier','Share ten reactions across the forums.',30,true),
 ('first_collab','Studio Connected','Join your first Collaboration Studio project.',20,true),
 ('three_collabs','Collaboration Regular','Participate in three collaboration projects.',45,true),
 ('profile_complete','Profile Tuned','Add a display name, biography, location, and avatar.',25,true),
 ('reputation_10','Rising Frequency','Reach 10 reputation.',30,true),
 ('reputation_50','Community Resonance','Reach 50 reputation.',75,true),
 ('staff_frequency','Community Guardian','Serve the community as staff.',100,true)
on conflict(code) do update
set name=excluded.name,
    description=excluded.description,
    points=excluded.points,
    is_active=true;

create or replace function public.username_is_available(username_input text)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select
    nullif(trim(username_input),'') is not null
    and trim(username_input) ~ '^[A-Za-z0-9_]{3,24}$'
    and not exists(
      select 1
      from public.profiles profile
      where lower(profile.username)=lower(trim(username_input))
    );
$$;

grant execute on function public.username_is_available(text) to anon,authenticated;

create or replace function public.sync_my_achievements()
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  uid uuid:=auth.uid();
  topic_count integer:=0;
  reply_count integer:=0;
  reaction_count integer:=0;
  project_count integer:=0;
  profile_row public.profiles;
begin
  if uid is null then
    raise exception 'You must be signed in.';
  end if;

  select * into profile_row from public.profiles where id=uid;
  select count(*) into topic_count from public.forum_topics where author_id=uid and not is_hidden;
  select count(*) into reply_count from public.forum_replies where author_id=uid and not is_hidden;
  select count(*) into reaction_count from public.forum_reactions where user_id=uid;
  select count(*) into project_count from public.collaboration_project_members where user_id=uid;

  insert into public.user_achievements(user_id,achievement_id)
  select uid,a.id from public.achievements a where a.code='first_frequency'
  on conflict do nothing;

  if topic_count>=1 then
    insert into public.user_achievements select uid,a.id,now() from public.achievements a where a.code='first_topic' on conflict do nothing;
  end if;
  if topic_count>=5 then
    insert into public.user_achievements select uid,a.id,now() from public.achievements a where a.code='five_topics' on conflict do nothing;
  end if;
  if reply_count>=1 then
    insert into public.user_achievements select uid,a.id,now() from public.achievements a where a.code='first_reply' on conflict do nothing;
  end if;
  if reply_count>=10 then
    insert into public.user_achievements select uid,a.id,now() from public.achievements a where a.code='ten_replies' on conflict do nothing;
  end if;
  if reaction_count>=1 then
    insert into public.user_achievements select uid,a.id,now() from public.achievements a where a.code='first_reaction' on conflict do nothing;
  end if;
  if reaction_count>=10 then
    insert into public.user_achievements select uid,a.id,now() from public.achievements a where a.code='ten_reactions' on conflict do nothing;
  end if;
  if project_count>=1 then
    insert into public.user_achievements select uid,a.id,now() from public.achievements a where a.code='first_collab' on conflict do nothing;
  end if;
  if project_count>=3 then
    insert into public.user_achievements select uid,a.id,now() from public.achievements a where a.code='three_collabs' on conflict do nothing;
  end if;
  if coalesce(profile_row.display_name,'')<>'' and coalesce(profile_row.biography,'')<>'' and coalesce(profile_row.location,'')<>'' and coalesce(profile_row.avatar_url,'')<>'' then
    insert into public.user_achievements select uid,a.id,now() from public.achievements a where a.code='profile_complete' on conflict do nothing;
  end if;
  if coalesce(profile_row.reputation,0)>=10 then
    insert into public.user_achievements select uid,a.id,now() from public.achievements a where a.code='reputation_10' on conflict do nothing;
  end if;
  if coalesce(profile_row.reputation,0)>=50 then
    insert into public.user_achievements select uid,a.id,now() from public.achievements a where a.code='reputation_50' on conflict do nothing;
  end if;
  if profile_row.role in ('owner','administrator','moderator') then
    insert into public.user_achievements select uid,a.id,now() from public.achievements a where a.code='staff_frequency' on conflict do nothing;
  end if;
end;
$$;

grant execute on function public.sync_my_achievements() to authenticated;

create or replace function public.get_my_achievement_profile()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  result jsonb;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.';
  end if;

  perform public.sync_my_achievements();

  select jsonb_build_object(
    'total',count(*),
    'unlocked',count(*) filter(where user_achievement.user_id is not null),
    'points',coalesce(sum(achievement.points) filter(where user_achievement.user_id is not null),0),
    'achievements',coalesce(jsonb_agg(jsonb_build_object(
      'id',achievement.id,
      'code',achievement.code,
      'name',achievement.name,
      'description',achievement.description,
      'points',achievement.points,
      'unlocked',user_achievement.user_id is not null,
      'earned_at',user_achievement.earned_at
    ) order by
      case when user_achievement.user_id is not null then 0 else 1 end,
      user_achievement.earned_at desc nulls last,
      achievement.points,
      achievement.name
    ),'[]'::jsonb)
  )
  into result
  from public.achievements achievement
  left join public.user_achievements user_achievement
    on user_achievement.achievement_id=achievement.id
   and user_achievement.user_id=auth.uid()
  where achievement.is_active;

  return result;
end;
$$;

grant execute on function public.get_my_achievement_profile() to authenticated;
