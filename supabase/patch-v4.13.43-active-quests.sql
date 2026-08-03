-- Seeker Of SoundZ v4.13.43
-- ACTIVE QUESTS + CHALLENGES
--
-- Run ONCE in:
-- https://ywwlwkveymypvbvlzccv.supabase.co
--
-- Quests appear at:
-- Members → Newest Achievement trophy → Quests

insert into public.progression_quests (
  code,
  name,
  description,
  quest_type,
  metric,
  target,
  xp_reward,
  title_reward,
  achievement_code,
  starts_at,
  ends_at,
  is_active
)
values
  (
    'daily_tune_in',
    'Tune Into the Frequency',
    'Visit your member profile and synchronize your progression today.',
    'daily',
    'profile_visits',
    1,
    15,
    null,
    null,
    null,
    null,
    true
  ),
  (
    'daily_first_response',
    'Daily Response',
    'Post one forum reply today.',
    'daily',
    'forum_replies',
    1,
    30,
    null,
    null,
    null,
    null,
    true
  ),
  (
    'daily_positive_energy',
    'Positive Energy',
    'React to three forum posts or replies today.',
    'daily',
    'forum_reactions',
    3,
    25,
    null,
    null,
    null,
    null,
    true
  ),
  (
    'daily_conversation',
    'Start a Signal',
    'Create one forum discussion today.',
    'daily',
    'forum_topics',
    1,
    35,
    null,
    null,
    null,
    null,
    true
  ),
  (
    'weekly_voice',
    'Community Voice',
    'Post ten forum replies this week.',
    'weekly',
    'forum_replies',
    10,
    120,
    null,
    null,
    null,
    null,
    true
  ),
  (
    'weekly_broadcaster',
    'Frequency Broadcaster',
    'Create two forum discussions this week.',
    'weekly',
    'forum_topics',
    2,
    90,
    null,
    null,
    null,
    null,
    true
  ),
  (
    'weekly_studio_momentum',
    'Studio Momentum',
    'Send five messages inside your Collaboration Studio projects this week.',
    'weekly',
    'collaboration_messages',
    5,
    130,
    null,
    null,
    null,
    null,
    true
  ),
  (
    'community_signal_builder',
    'Community Signal Builder',
    'Complete twenty-five forum actions during the current community cycle.',
    'community',
    'forum_activity',
    25,
    200,
    'Signal Builder',
    null,
    date_trunc('month', now()),
    date_trunc('month', now()) + interval '1 month',
    true
  )
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  quest_type = excluded.quest_type,
  metric = excluded.metric,
  target = excluded.target,
  xp_reward = excluded.xp_reward,
  title_reward = excluded.title_reward,
  achievement_code = excluded.achievement_code,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  is_active = true;

-- Ensure authenticated users can read the active quest definitions.
grant select on public.progression_quests to authenticated;
grant select on public.member_quest_claims to authenticated;

-- Verification result.
select
  code,
  name,
  quest_type,
  metric,
  target,
  xp_reward,
  is_active,
  starts_at,
  ends_at
from public.progression_quests
where is_active
order by
  case quest_type
    when 'daily' then 1
    when 'weekly' then 2
    when 'community' then 3
    when 'seasonal' then 4
    else 5
  end,
  name;
