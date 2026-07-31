-- Seeker Of SoundZ v4.13.33
-- Restores all 84 achievements from SeekerOfSoundZ(3).zip into the current
-- Supabase achievement/progression/notification system.
-- Run ONCE after patch-v4.13.31-unified-progression.sql.

insert into public.achievements
(code,name,description,icon_url,points,category,rarity,is_hidden,title_reward,season_code,is_active)
values
('legacy_welcome_to_the_frequency','Welcome to the Frequency','Join the community','✨',10,'legacy_starter','common',false,null,null,true),
('legacy_first_frequency','First Frequency','Create your first topic','🎧',10,'legacy_starter','common',false,null,null,true),
('legacy_first_reply','First Reply','Post your first reply','💬',10,'legacy_starter','common',false,null,null,true),
('legacy_first_applause','First Applause','Earn your first like','❤️',10,'legacy_starter','common',false,null,null,true),
('legacy_tag_explorer','Tag Explorer','Use your first forum tag','🏷️',10,'legacy_starter','common',false,null,null,true),
('legacy_picture_this','Picture This','Share an image in a topic','🖼️',10,'legacy_starter','common',false,null,null,true),
('legacy_link_drop','Link Drop','Attach a link to a topic','🔗',10,'legacy_starter','common',false,null,null,true),
('legacy_emoji_hello','Emoji Hello','Use an emoji in a contribution','😀',10,'legacy_starter','common',false,null,null,true),
('legacy_topic_starter_i','Topic Starter I','Create 3 topics','📻',20,'legacy_topics','uncommon',false,null,null,true),
('legacy_topic_starter_ii','Topic Starter II','Create 5 topics','📡',20,'legacy_topics','uncommon',false,null,null,true),
('legacy_broadcaster_i','Broadcaster I','Create 10 topics','🛰️',20,'legacy_topics','uncommon',false,null,null,true),
('legacy_broadcaster_ii','Broadcaster II','Create 20 topics','📣',20,'legacy_topics','uncommon',false,null,null,true),
('legacy_headline_maker','Headline Maker','Create 30 topics','⚡',20,'legacy_topics','uncommon',false,null,null,true),
('legacy_forum_publisher','Forum Publisher','Create 50 topics','🌌',20,'legacy_topics','uncommon',false,null,null,true),
('legacy_century_of_topics','Century of Topics','Create 100 topics','🏆',20,'legacy_topics','uncommon',false,null,null,true),
('legacy_long_form','Long Form','Write 500 total words','📝',20,'legacy_topics','uncommon',false,null,null,true),
('legacy_forum_author','Forum Author','Write 2,000 total words','📚',20,'legacy_topics','uncommon',false,null,null,true),
('legacy_community_novelist','Community Novelist','Write 5,000 total words','📖',20,'legacy_topics','uncommon',false,null,null,true),
('legacy_conversation_starter','Conversation Starter','Post 3 replies','🗨️',20,'legacy_replies','uncommon',false,null,null,true),
('legacy_helpful_voice_i','Helpful Voice I','Post 5 replies','🤝',20,'legacy_replies','uncommon',false,null,null,true),
('legacy_helpful_voice_ii','Helpful Voice II','Post 10 replies','🙌',20,'legacy_replies','uncommon',false,null,null,true),
('legacy_active_conversationalist','Active Conversationalist','Post 20 replies','🎙️',20,'legacy_replies','uncommon',false,null,null,true),
('legacy_community_speaker','Community Speaker','Post 35 replies','🗣️',20,'legacy_replies','uncommon',false,null,null,true),
('legacy_reply_machine','Reply Machine','Post 50 replies','📢',20,'legacy_replies','uncommon',false,null,null,true),
('legacy_always_in_the_mix','Always in the Mix','Post 75 replies','💫',20,'legacy_replies','uncommon',false,null,null,true),
('legacy_reply_legend','Reply Legend','Post 100 replies','🌟',20,'legacy_replies','uncommon',false,null,null,true),
('legacy_crowd_favorite_i','Crowd Favorite I','Earn 5 likes','💜',35,'legacy_reputation','rare',false,null,null,true),
('legacy_crowd_favorite_ii','Crowd Favorite II','Earn 10 likes','💖',35,'legacy_reputation','rare',false,null,null,true),
('legacy_well_received','Well Received','Earn 25 likes','🌹',35,'legacy_reputation','rare',false,null,null,true),
('legacy_community_favorite','Community Favorite','Earn 50 likes','🌠',35,'legacy_reputation','rare',false,null,null,true),
('legacy_forum_icon','Forum Icon','Earn 100 likes','👑',35,'legacy_reputation','rare',false,null,null,true),
('legacy_diamond_reputation','Diamond Reputation','Earn 250 likes','💎',35,'legacy_reputation','rare',false,null,null,true),
('legacy_golden_signal','Golden Signal','Earn 500 likes','🏅',35,'legacy_reputation','rare',false,null,null,true),
('legacy_signal_booster','Signal Booster','Average 3 likes per topic','🔊',35,'legacy_reputation','rare',false,null,null,true),
('legacy_tag_collector_i','Tag Collector I','Use 3 unique tags','🔖',20,'legacy_discovery','uncommon',false,null,null,true),
('legacy_tag_collector_ii','Tag Collector II','Use 6 unique tags','🧭',20,'legacy_discovery','uncommon',false,null,null,true),
('legacy_tag_navigator','Tag Navigator','Use 10 unique tags','🗺️',20,'legacy_discovery','uncommon',false,null,null,true),
('legacy_category_hopper','Category Hopper','Post in 3 categories','🌐',20,'legacy_discovery','uncommon',false,null,null,true),
('legacy_category_explorer','Category Explorer','Post in 5 categories','🌀',20,'legacy_discovery','uncommon',false,null,null,true),
('legacy_subcategory_scout','Subcategory Scout','Post in 3 subcategories','🧩',20,'legacy_discovery','uncommon',false,null,null,true),
('legacy_forum_explorer','Forum Explorer','Post in 8 subcategories','🛸',20,'legacy_discovery','uncommon',false,null,null,true),
('legacy_edm_initiate','EDM Initiate','Post in EDM Community','🎵',35,'legacy_edm','rare',false,null,null,true),
('legacy_house_head','House Head','Use the house tag or subcategory','🏠',35,'legacy_edm','rare',false,null,null,true),
('legacy_techno_traveler','Techno Traveler','Use the techno tag or subcategory','⚙️',35,'legacy_edm','rare',false,null,null,true),
('legacy_bass_citizen','Bass Citizen','Post about dubstep or bass','🔊',35,'legacy_edm','rare',false,null,null,true),
('legacy_trance_traveler','Trance Traveler','Post about trance','🌈',35,'legacy_edm','rare',false,null,null,true),
('legacy_dnb_driver','DNB Driver','Post about Drum & Bass','🥁',35,'legacy_edm','rare',false,null,null,true),
('legacy_festival_frequency','Festival Frequency','Post about festivals','🎪',35,'legacy_edm','rare',false,null,null,true),
('legacy_studio_starter','Studio Starter','Post in Music Production','🎚️',35,'legacy_edm','rare',false,null,null,true),
('legacy_sound_designer','Sound Designer','Post in Sound Design','🎛️',35,'legacy_edm','rare',false,null,null,true),
('legacy_daw_talk','DAW Talk','Post in DAWs & Software','🎹',35,'legacy_edm','rare',false,null,null,true),
('legacy_mix_engineer','Mix Engineer','Post in Mixing','🎼',35,'legacy_edm','rare',false,null,null,true),
('legacy_mastering_mind','Mastering Mind','Post in Mastering','📀',35,'legacy_edm','rare',false,null,null,true),
('legacy_dj_booth','DJ Booth','Post in DJ Tips','🎧',35,'legacy_edm','rare',false,null,null,true),
('legacy_transition_technician','Transition Technician','Post about transitions or mixing','🎚️',35,'legacy_edm','rare',false,null,null,true),
('legacy_visual_contributor_i','Visual Contributor I','Share 3 forum images','📸',20,'legacy_media','uncommon',false,null,null,true),
('legacy_visual_contributor_ii','Visual Contributor II','Share 10 forum images','🖼️',20,'legacy_media','uncommon',false,null,null,true),
('legacy_resource_sharer_i','Resource Sharer I','Share 3 links','🔗',20,'legacy_media','uncommon',false,null,null,true),
('legacy_resource_sharer_ii','Resource Sharer II','Share 10 links','🌍',20,'legacy_media','uncommon',false,null,null,true),
('legacy_emoji_enthusiast','Emoji Enthusiast','Use 10 emojis','😄',20,'legacy_media','uncommon',false,null,null,true),
('legacy_emoji_party','Emoji Party','Use 50 emojis','🥳',20,'legacy_media','uncommon',false,null,null,true),
('legacy_emoji_universe','Emoji Universe','Use 150 emojis','🎉',20,'legacy_media','uncommon',false,null,null,true),
('legacy_daily_spark','Daily Spark','Create 2 topics in 24 hours','🔥',60,'legacy_activity','epic',false,null,null,true),
('legacy_daily_surge','Daily Surge','Create 5 topics in 24 hours','⚡',60,'legacy_activity','epic',false,null,null,true),
('legacy_active_week','Active Week','Create 5 topics in 7 days','📅',60,'legacy_activity','epic',false,null,null,true),
('legacy_power_week','Power Week','Create 12 topics in 7 days','🚀',60,'legacy_activity','epic',false,null,null,true),
('legacy_growing_member','Growing Member','Make 10 total contributions','🌱',60,'legacy_activity','epic',false,null,null,true),
('legacy_community_regular','Community Regular','Make 25 total contributions','🌿',60,'legacy_activity','epic',false,null,null,true),
('legacy_forum_veteran','Forum Veteran','Make 50 total contributions','🌳',60,'legacy_activity','epic',false,null,null,true),
('legacy_community_pillar','Community Pillar','Make 100 total contributions','🏔️',60,'legacy_activity','epic',false,null,null,true),
('legacy_frequency_legend','Frequency Legend','Make 250 total contributions','🌌',60,'legacy_activity','epic',false,null,null,true),
('legacy_question_seeker','Question Seeker','Post in Help & FAQ','❓',35,'legacy_community','rare',false,null,null,true),
('legacy_support_signal','Support Signal','Post 3 replies in Help & FAQ topics','🛟',35,'legacy_community','rare',false,null,null,true),
('legacy_feedback_giver','Feedback Giver','Post in Feedback','💡',35,'legacy_community','rare',false,null,null,true),
('legacy_collaborator','Collaborator','Use the collaboration tag or subcategory','🤝',35,'legacy_community','rare',false,null,null,true),
('legacy_event_explorer','Event Explorer','Post in Events','🎟️',35,'legacy_community','rare',false,null,null,true),
('legacy_off_topic_adventurer','Off Topic Adventurer','Post in Off Topic','🕹️',35,'legacy_community','rare',false,null,null,true),
('legacy_vip_frequency','VIP Frequency','Hold paid member access','💎',100,'legacy_special','legendary',false,null,null,true),
('legacy_moderator_signal','Moderator Signal','Become a moderator','🛡️',100,'legacy_special','legendary',false,null,null,true),
('legacy_site_admin','Site Admin','Become an administrator','⚡',100,'legacy_special','legendary',false,null,null,true),
('legacy_custom_identity','Custom Identity','Set a custom role','🎖️',100,'legacy_special','legendary',false,null,null,true),
('legacy_on_the_map','On the Map','Add a profile location','📍',20,'legacy_profile','uncommon',false,null,null,true),
('legacy_profile_complete','Profile Complete','Add a bio, tagline, and avatar','🪪',20,'legacy_profile','uncommon',false,null,null,true),
('legacy_social_signal','Social Signal','Add at least one social link','🌐',20,'legacy_profile','uncommon',false,null,null,true)
on conflict(code) do update set
 name=excluded.name,
 description=excluded.description,
 icon_url=excluded.icon_url,
 points=excluded.points,
 category=excluded.category,
 rarity=excluded.rarity,
 is_hidden=excluded.is_hidden,
 is_active=true;

create or replace function public.unlock_my_legacy_achievement(code_input text, condition_input boolean)
returns void
language plpgsql
security definer
set search_path=public
as $$
begin
  if not condition_input or auth.uid() is null then return; end if;
  insert into public.user_achievements(user_id,achievement_id)
  select auth.uid(),achievement.id
  from public.achievements achievement
  where achievement.code=code_input and achievement.is_active
  on conflict do nothing;
end;
$$;
revoke all on function public.unlock_my_legacy_achievement(text,boolean) from public,anon,authenticated;

create or replace function public.sync_my_legacy_achievements()
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare
  profile_row public.profiles;
  before_count integer:=0;
  after_count integer:=0;
  topic_count integer:=0;
  reply_count integer:=0;
  contribution_count integer:=0;
  likes_received integer:=0;
  unique_tags integer:=0;
  unique_categories integer:=0;
  unique_subcategories integer:=0;
  image_count integer:=0;
  link_count integer:=0;
  emoji_count integer:=0;
  word_count integer:=0;
  topics_today integer:=0;
  topics_week integer:=0;
  help_reply_count integer:=0;
  has_edm boolean:=false;
  has_house boolean:=false;
  has_techno boolean:=false;
  has_bass boolean:=false;
  has_trance boolean:=false;
  has_dnb boolean:=false;
  has_festival boolean:=false;
  has_music_production boolean:=false;
  has_sound_design boolean:=false;
  has_daw boolean:=false;
  has_mixing boolean:=false;
  has_mastering boolean:=false;
  has_dj_tips boolean:=false;
  has_transitions boolean:=false;
  has_help boolean:=false;
  has_feedback boolean:=false;
  has_collaboration boolean:=false;
  has_events boolean:=false;
  has_off_topic boolean:=false;
begin
  if auth.uid() is null then raise exception 'You must be signed in.'; end if;
  select * into profile_row from public.profiles where id=auth.uid();

  select count(*) into before_count
  from public.user_achievements ua
  join public.achievements a on a.id=ua.achievement_id
  where ua.user_id=auth.uid() and a.code like 'legacy_%';

  select count(*) into topic_count
  from public.forum_topics where author_id=auth.uid() and not is_hidden;

  select count(*) into reply_count
  from public.forum_replies where author_id=auth.uid() and not is_hidden;

  contribution_count:=topic_count+reply_count;

  select count(*) into likes_received
  from public.forum_reactions reaction
  where reaction.topic_id in(select id from public.forum_topics where author_id=auth.uid() and not is_hidden)
     or reaction.reply_id in(select id from public.forum_replies where author_id=auth.uid() and not is_hidden);

  select count(distinct lower(tag_value)) into unique_tags
  from public.forum_topics topic
  cross join lateral unnest(topic.tags) tag_value
  where topic.author_id=auth.uid() and not topic.is_hidden;

  select count(distinct topic.category_id) into unique_categories
  from public.forum_topics topic
  where topic.author_id=auth.uid() and not topic.is_hidden;

  select count(distinct nullif(trim(topic.subcategory),'')) into unique_subcategories
  from public.forum_topics topic
  where topic.author_id=auth.uid() and not topic.is_hidden;

  select count(distinct attachment.topic_id) into image_count
  from public.attachments attachment
  join public.forum_topics topic on topic.id=attachment.topic_id
  where topic.author_id=auth.uid()
    and not topic.is_hidden
    and attachment.mime_type like 'image/%';

  select count(*) into link_count
  from public.forum_topics topic
  where topic.author_id=auth.uid() and not topic.is_hidden and nullif(trim(topic.media_url),'') is not null;

  select coalesce(sum(length(regexp_replace(content_text,'[\x00-\x7F]','','g'))),0)::integer into emoji_count
  from(
    select body as content_text from public.forum_topics where author_id=auth.uid() and not is_hidden
    union all
    select body from public.forum_replies where author_id=auth.uid() and not is_hidden
  ) content;

  select coalesce(sum(array_length(regexp_split_to_array(trim(content_text),'\s+'),1)),0)::integer into word_count
  from(
    select body as content_text from public.forum_topics where author_id=auth.uid() and not is_hidden
    union all
    select body from public.forum_replies where author_id=auth.uid() and not is_hidden
  ) content
  where nullif(trim(content_text),'') is not null;

  select count(*) into topics_today from public.forum_topics
  where author_id=auth.uid() and not is_hidden and created_at>now()-interval '24 hours';

  select count(*) into topics_week from public.forum_topics
  where author_id=auth.uid() and not is_hidden and created_at>now()-interval '7 days';

  select count(*) into help_reply_count
  from public.forum_replies reply
  join public.forum_topics topic on topic.id=reply.topic_id
  join public.forum_categories category on category.id=topic.category_id
  where reply.author_id=auth.uid() and not reply.is_hidden and lower(category.name)='help & faq';

  select
    bool_or(lower(category.name)='edm community'),
    bool_or(lower(topic.subcategory)='house' or topic.tags @> array['house']::text[]),
    bool_or(lower(topic.subcategory)='techno' or topic.tags @> array['techno']::text[]),
    bool_or(lower(coalesce(topic.subcategory,'')||' '||array_to_string(topic.tags,' ')) ~ '(dubstep|bass)'),
    bool_or(lower(coalesce(topic.subcategory,'')||' '||array_to_string(topic.tags,' ')) ~ 'trance'),
    bool_or(lower(coalesce(topic.subcategory,'')||' '||array_to_string(topic.tags,' ')) ~ '(drum|dnb)'),
    bool_or(lower(coalesce(topic.subcategory,'')||' '||array_to_string(topic.tags,' ')) ~ 'festival'),
    bool_or(lower(category.name)='music production'),
    bool_or(lower(topic.subcategory)='sound design'),
    bool_or(lower(topic.subcategory)='daws & software'),
    bool_or(lower(topic.subcategory)='mixing'),
    bool_or(lower(topic.subcategory)='mastering'),
    bool_or(lower(category.name)='dj tips'),
    bool_or(lower(coalesce(topic.subcategory,'')||' '||array_to_string(topic.tags,' ')) ~ '(transition|mixing)'),
    bool_or(lower(category.name)='help & faq'),
    bool_or(lower(category.name)='feedback'),
    bool_or(lower(topic.subcategory)='collaboration' or topic.tags @> array['collaboration']::text[]),
    bool_or(lower(category.name)='events'),
    bool_or(lower(category.name)='off topic')
  into
    has_edm,has_house,has_techno,has_bass,has_trance,has_dnb,has_festival,
    has_music_production,has_sound_design,has_daw,has_mixing,has_mastering,
    has_dj_tips,has_transitions,has_help,has_feedback,has_collaboration,has_events,has_off_topic
  from public.forum_topics topic
  join public.forum_categories category on category.id=topic.category_id
  where topic.author_id=auth.uid() and not topic.is_hidden;

  has_edm:=coalesce(has_edm,false);
  has_house:=coalesce(has_house,false);
  has_techno:=coalesce(has_techno,false);
  has_bass:=coalesce(has_bass,false);
  has_trance:=coalesce(has_trance,false);
  has_dnb:=coalesce(has_dnb,false);
  has_festival:=coalesce(has_festival,false);
  has_music_production:=coalesce(has_music_production,false);
  has_sound_design:=coalesce(has_sound_design,false);
  has_daw:=coalesce(has_daw,false);
  has_mixing:=coalesce(has_mixing,false);
  has_mastering:=coalesce(has_mastering,false);
  has_dj_tips:=coalesce(has_dj_tips,false);
  has_transitions:=coalesce(has_transitions,false);
  has_help:=coalesce(has_help,false);
  has_feedback:=coalesce(has_feedback,false);
  has_collaboration:=coalesce(has_collaboration,false);
  has_events:=coalesce(has_events,false);
  has_off_topic:=coalesce(has_off_topic,false);

  perform public.unlock_my_legacy_achievement('legacy_welcome_to_the_frequency', true);
  perform public.unlock_my_legacy_achievement('legacy_first_frequency', topic_count>=1);
  perform public.unlock_my_legacy_achievement('legacy_first_reply', reply_count>=1);
  perform public.unlock_my_legacy_achievement('legacy_first_applause', likes_received>=1);
  perform public.unlock_my_legacy_achievement('legacy_tag_explorer', unique_tags>=1);
  perform public.unlock_my_legacy_achievement('legacy_picture_this', image_count>=1);
  perform public.unlock_my_legacy_achievement('legacy_link_drop', link_count>=1);
  perform public.unlock_my_legacy_achievement('legacy_emoji_hello', emoji_count>=1);
  perform public.unlock_my_legacy_achievement('legacy_topic_starter_i', topic_count>=3);
  perform public.unlock_my_legacy_achievement('legacy_topic_starter_ii', topic_count>=5);
  perform public.unlock_my_legacy_achievement('legacy_broadcaster_i', topic_count>=10);
  perform public.unlock_my_legacy_achievement('legacy_broadcaster_ii', topic_count>=20);
  perform public.unlock_my_legacy_achievement('legacy_headline_maker', topic_count>=30);
  perform public.unlock_my_legacy_achievement('legacy_forum_publisher', topic_count>=50);
  perform public.unlock_my_legacy_achievement('legacy_century_of_topics', topic_count>=100);
  perform public.unlock_my_legacy_achievement('legacy_long_form', word_count>=500);
  perform public.unlock_my_legacy_achievement('legacy_forum_author', word_count>=2000);
  perform public.unlock_my_legacy_achievement('legacy_community_novelist', word_count>=5000);
  perform public.unlock_my_legacy_achievement('legacy_conversation_starter', reply_count>=3);
  perform public.unlock_my_legacy_achievement('legacy_helpful_voice_i', reply_count>=5);
  perform public.unlock_my_legacy_achievement('legacy_helpful_voice_ii', reply_count>=10);
  perform public.unlock_my_legacy_achievement('legacy_active_conversationalist', reply_count>=20);
  perform public.unlock_my_legacy_achievement('legacy_community_speaker', reply_count>=35);
  perform public.unlock_my_legacy_achievement('legacy_reply_machine', reply_count>=50);
  perform public.unlock_my_legacy_achievement('legacy_always_in_the_mix', reply_count>=75);
  perform public.unlock_my_legacy_achievement('legacy_reply_legend', reply_count>=100);
  perform public.unlock_my_legacy_achievement('legacy_crowd_favorite_i', likes_received>=5);
  perform public.unlock_my_legacy_achievement('legacy_crowd_favorite_ii', likes_received>=10);
  perform public.unlock_my_legacy_achievement('legacy_well_received', likes_received>=25);
  perform public.unlock_my_legacy_achievement('legacy_community_favorite', likes_received>=50);
  perform public.unlock_my_legacy_achievement('legacy_forum_icon', likes_received>=100);
  perform public.unlock_my_legacy_achievement('legacy_diamond_reputation', likes_received>=250);
  perform public.unlock_my_legacy_achievement('legacy_golden_signal', likes_received>=500);
  perform public.unlock_my_legacy_achievement('legacy_signal_booster', topic_count>=5 and likes_received::numeric/greatest(topic_count,1)>=3);
  perform public.unlock_my_legacy_achievement('legacy_tag_collector_i', unique_tags>=3);
  perform public.unlock_my_legacy_achievement('legacy_tag_collector_ii', unique_tags>=6);
  perform public.unlock_my_legacy_achievement('legacy_tag_navigator', unique_tags>=10);
  perform public.unlock_my_legacy_achievement('legacy_category_hopper', unique_categories>=3);
  perform public.unlock_my_legacy_achievement('legacy_category_explorer', unique_categories>=5);
  perform public.unlock_my_legacy_achievement('legacy_subcategory_scout', unique_subcategories>=3);
  perform public.unlock_my_legacy_achievement('legacy_forum_explorer', unique_subcategories>=8);
  perform public.unlock_my_legacy_achievement('legacy_edm_initiate', has_edm);
  perform public.unlock_my_legacy_achievement('legacy_house_head', has_house);
  perform public.unlock_my_legacy_achievement('legacy_techno_traveler', has_techno);
  perform public.unlock_my_legacy_achievement('legacy_bass_citizen', has_bass);
  perform public.unlock_my_legacy_achievement('legacy_trance_traveler', has_trance);
  perform public.unlock_my_legacy_achievement('legacy_dnb_driver', has_dnb);
  perform public.unlock_my_legacy_achievement('legacy_festival_frequency', has_festival);
  perform public.unlock_my_legacy_achievement('legacy_studio_starter', has_music_production);
  perform public.unlock_my_legacy_achievement('legacy_sound_designer', has_sound_design);
  perform public.unlock_my_legacy_achievement('legacy_daw_talk', has_daw);
  perform public.unlock_my_legacy_achievement('legacy_mix_engineer', has_mixing);
  perform public.unlock_my_legacy_achievement('legacy_mastering_mind', has_mastering);
  perform public.unlock_my_legacy_achievement('legacy_dj_booth', has_dj_tips);
  perform public.unlock_my_legacy_achievement('legacy_transition_technician', has_transitions);
  perform public.unlock_my_legacy_achievement('legacy_visual_contributor_i', image_count>=3);
  perform public.unlock_my_legacy_achievement('legacy_visual_contributor_ii', image_count>=10);
  perform public.unlock_my_legacy_achievement('legacy_resource_sharer_i', link_count>=3);
  perform public.unlock_my_legacy_achievement('legacy_resource_sharer_ii', link_count>=10);
  perform public.unlock_my_legacy_achievement('legacy_emoji_enthusiast', emoji_count>=10);
  perform public.unlock_my_legacy_achievement('legacy_emoji_party', emoji_count>=50);
  perform public.unlock_my_legacy_achievement('legacy_emoji_universe', emoji_count>=150);
  perform public.unlock_my_legacy_achievement('legacy_daily_spark', topics_today>=2);
  perform public.unlock_my_legacy_achievement('legacy_daily_surge', topics_today>=5);
  perform public.unlock_my_legacy_achievement('legacy_active_week', topics_week>=5);
  perform public.unlock_my_legacy_achievement('legacy_power_week', topics_week>=12);
  perform public.unlock_my_legacy_achievement('legacy_growing_member', contribution_count>=10);
  perform public.unlock_my_legacy_achievement('legacy_community_regular', contribution_count>=25);
  perform public.unlock_my_legacy_achievement('legacy_forum_veteran', contribution_count>=50);
  perform public.unlock_my_legacy_achievement('legacy_community_pillar', contribution_count>=100);
  perform public.unlock_my_legacy_achievement('legacy_frequency_legend', contribution_count>=250);
  perform public.unlock_my_legacy_achievement('legacy_question_seeker', has_help);
  perform public.unlock_my_legacy_achievement('legacy_support_signal', help_reply_count>=3);
  perform public.unlock_my_legacy_achievement('legacy_feedback_giver', has_feedback);
  perform public.unlock_my_legacy_achievement('legacy_collaborator', has_collaboration);
  perform public.unlock_my_legacy_achievement('legacy_event_explorer', has_events);
  perform public.unlock_my_legacy_achievement('legacy_off_topic_adventurer', has_off_topic);
  perform public.unlock_my_legacy_achievement('legacy_vip_frequency', profile_row.role='premium_member');
  perform public.unlock_my_legacy_achievement('legacy_moderator_signal', profile_row.role='moderator');
  perform public.unlock_my_legacy_achievement('legacy_site_admin', profile_row.role in ('owner','administrator'));
  perform public.unlock_my_legacy_achievement('legacy_custom_identity', coalesce(profile_row.rank_name,'') not in ('','New Listener'));
  perform public.unlock_my_legacy_achievement('legacy_on_the_map', coalesce(profile_row.location,'')<>'');
  perform public.unlock_my_legacy_achievement('legacy_profile_complete', coalesce(profile_row.biography,'')<>'' and coalesce(profile_row.avatar_url,'')<>'' and coalesce(profile_row.activity_status,'')<>'');
  perform public.unlock_my_legacy_achievement('legacy_social_signal', coalesce(profile_row.social_links,'{}'::jsonb)<>'{}'::jsonb);

  select count(*) into after_count
  from public.user_achievements ua
  join public.achievements a on a.id=ua.achievement_id
  where ua.user_id=auth.uid() and a.code like 'legacy_%';

  return after_count-before_count;
end;
$$;
grant execute on function public.sync_my_legacy_achievements() to authenticated;

create or replace function public.get_my_achievement_profile()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception 'You must be signed in.'; end if;
 perform public.sync_my_progression();
 perform public.sync_my_legacy_achievements();

 select jsonb_build_object(
  'total',count(*),
  'unlocked',count(*) filter(where ua.user_id is not null),
  'points',coalesce(sum(a.points) filter(where ua.user_id is not null),0),
  'achievements',coalesce(jsonb_agg(jsonb_build_object(
    'id',a.id,'code',a.code,'name',a.name,'description',a.description,'icon_url',a.icon_url,
    'points',a.points,'category',a.category,'rarity',a.rarity,'is_hidden',a.is_hidden,
    'title_reward',a.title_reward,'season_code',a.season_code,
    'unlocked',ua.user_id is not null,'earned_at',ua.earned_at
  ) order by
    case when ua.user_id is not null then 0 else 1 end,
    ua.earned_at desc nulls last,
    a.category,a.points,a.name
  ),'[]'::jsonb)
 ) into result
 from public.achievements a
 left join public.user_achievements ua on ua.achievement_id=a.id and ua.user_id=auth.uid()
 where a.is_active;
 return result;
end;
$$;
grant execute on function public.get_my_achievement_profile() to authenticated;
