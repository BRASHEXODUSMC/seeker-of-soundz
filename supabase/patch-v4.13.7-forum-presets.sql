-- Seeker Of SoundZ v4.13.7 forum category/subcategory/tag preset patch
-- Run ONCE after patch-v4.13.0-real-forums.sql. Do not rerun schema.sql.

create table if not exists public.forum_subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.forum_categories(id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  unique(category_id, slug)
);

create table if not exists public.forum_tag_presets (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.forum_categories(id) on delete cascade,
  subcategory_id uuid references public.forum_subcategories(id) on delete cascade,
  tag text not null,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  check (category_id is not null or subcategory_id is not null),
  unique nulls not distinct(category_id, subcategory_id, tag)
);

alter table public.forum_subcategories enable row level security;
alter table public.forum_tag_presets enable row level security;
drop policy if exists "forum subcategories public read" on public.forum_subcategories;
drop policy if exists "forum tag presets public read" on public.forum_tag_presets;
create policy "forum subcategories public read" on public.forum_subcategories for select using (is_visible=true);
create policy "forum tag presets public read" on public.forum_tag_presets for select using (is_visible=true);
grant select on public.forum_subcategories to anon, authenticated;
grant select on public.forum_tag_presets to anon, authenticated;

insert into public.forum_categories(name,slug,description,icon,sort_order,is_visible) values
('General Discussion','general-discussion','Introductions, community news and general conversation.','💬',10,true),
('EDM Community','edm-community','Genres, releases, artists and festival discussion.','🎵',20,true),
('Music Production','music-production','DAWs, mixing, mastering, sound design and works in progress.','🎛️',30,true),
('DJ Tips','dj-tips','Controllers, software, live sets and mixing techniques.','🎧',40,true),
('Events','events','Upcoming events, livestreams and community meetups.','📅',50,true),
('Help & FAQ','help-faq','Account, website, purchase and technical support.','❓',60,true),
('Feedback','feedback','Track feedback, website suggestions and creative reviews.','✨',70,true),
('Off Topic','off-topic','Gaming, random chat and other creative projects.','🌙',80,true)
on conflict (slug) do update set name=excluded.name,description=excluded.description,icon=excluded.icon,sort_order=excluded.sort_order,is_visible=true;

with seed(category_slug,name,slug,sort_order) as (values
('general-discussion','Introductions','introductions',10),('general-discussion','Community News','community-news',20),('general-discussion','General Chat','general-chat',30),
('edm-community','House','house',10),('edm-community','Techno','techno',20),('edm-community','Dubstep & Bass','dubstep-bass',30),('edm-community','Trance','trance',40),('edm-community','Drum & Bass','drum-bass',50),('edm-community','Future Bass','future-bass',60),('edm-community','EDM Releases','edm-releases',70),('edm-community','Festival Talk','festival-talk',80),
('music-production','DAWs & Software','daws-software',10),('music-production','Mixing','mixing',20),('music-production','Mastering','mastering',30),('music-production','Sound Design','sound-design',40),('music-production','Works in Progress','works-in-progress',50),('music-production','Collaboration','collaboration',60),
('dj-tips','Beginner DJ Help','beginner-dj-help',10),('dj-tips','Controllers & Gear','controllers-gear',20),('dj-tips','Rekordbox','rekordbox',30),('dj-tips','Serato','serato',40),('dj-tips','Live Sets','live-sets',50),('dj-tips','Transitions & Mixing','transitions-mixing',60),
('events','Upcoming Events','upcoming-events',10),('events','Past Events','past-events',20),('events','Livestreams','livestreams',30),('events','Meetups','meetups',40),
('help-faq','Site FAQ','site-faq',10),('help-faq','Account Help','account-help',20),('help-faq','Forum Help','forum-help',30),('help-faq','Music Purchases','music-purchases',40),('help-faq','Member Vault','member-vault',50),('help-faq','Technical Support','technical-support',60),
('feedback','Track Feedback','track-feedback',10),('feedback','Website Feedback','website-feedback',20),('feedback','Merch Feedback','merch-feedback',30),('feedback','Suggestions','suggestions',40),
('off-topic','Gaming','gaming',10),('off-topic','Random','random',20),('off-topic','Creative Projects','creative-projects',30)
)
insert into public.forum_subcategories(category_id,name,slug,sort_order,is_visible)
select c.id,s.name,s.slug,s.sort_order,true from seed s join public.forum_categories c on c.slug=s.category_slug
on conflict(category_id,slug) do update set name=excluded.name,sort_order=excluded.sort_order,is_visible=true;

with category_tags(category_slug,tag,sort_order) as (values
('general-discussion','community',10),('general-discussion','introduction',20),('general-discussion','question',30),('general-discussion','news',40),
('edm-community','edm',10),('edm-community','house',20),('edm-community','techno',30),('edm-community','dubstep',40),('edm-community','trance',50),('edm-community','drum-and-bass',60),('edm-community','future-bass',70),('edm-community','festival',80),
('music-production','production',10),('music-production','ableton',20),('music-production','fl-studio',30),('music-production','mixing',40),('music-production','mastering',50),('music-production','sound-design',60),('music-production','feedback',70),
('dj-tips','dj-tips',10),('dj-tips','mixing',20),('dj-tips','rekordbox',30),('dj-tips','serato',40),('dj-tips','controllers',50),('dj-tips','live-set',60),
('events','events',10),('events','live-show',20),('events','tickets',30),('events','meetup',40),('events','announcement',50),
('help-faq','faq',10),('help-faq','help',20),('help-faq','support',30),('help-faq','account',40),('help-faq','members-vault',50),
('feedback','feedback',10),('feedback','showcase',20),('feedback','work-in-progress',30),('feedback','mix-review',40),
('off-topic','off-topic',10),('off-topic','community',20),('off-topic','gaming',30),('off-topic','random',40)
)
insert into public.forum_tag_presets(category_id,subcategory_id,tag,sort_order,is_visible)
select c.id,null,t.tag,t.sort_order,true from category_tags t join public.forum_categories c on c.slug=t.category_slug
on conflict(category_id,subcategory_id,tag) do update set sort_order=excluded.sort_order,is_visible=true;

with sub_tags(sub_slug,tag,sort_order) as (values
('introductions','new-member',10),('community-news','community-news',10),('general-chat','discussion',10),
('house','house',10),('techno','techno',10),('dubstep-bass','bass-music',10),('trance','trance',10),('drum-bass','dnb',10),('future-bass','future-bass',10),('edm-releases','new-release',10),('festival-talk','festival',10),
('daws-software','daw',10),('mixing','mixing',10),('mastering','mastering',10),('sound-design','sound-design',10),('works-in-progress','work-in-progress',10),('collaboration','collaboration',10),
('beginner-dj-help','beginner-dj',10),('controllers-gear','dj-gear',10),('rekordbox','rekordbox',10),('serato','serato',10),('live-sets','live-set',10),('transitions-mixing','transitions',10),
('upcoming-events','upcoming-events',10),('past-events','past-events',10),('livestreams','livestream',10),('meetups','meetup',10),
('site-faq','faq',10),('account-help','account-help',10),('forum-help','forum-help',10),('music-purchases','music-purchases',10),('member-vault','members-vault',10),('technical-support','technical-support',10),
('track-feedback','track-feedback',10),('website-feedback','website-feedback',10),('merch-feedback','merch-feedback',10),('suggestions','suggestions',10),
('gaming','gaming',10),('random','random',10),('creative-projects','creative-projects',10)
)
insert into public.forum_tag_presets(category_id,subcategory_id,tag,sort_order,is_visible)
select s.category_id,s.id,t.tag,t.sort_order,true from sub_tags t join public.forum_subcategories s on s.slug=t.sub_slug
on conflict(category_id,subcategory_id,tag) do update set sort_order=excluded.sort_order,is_visible=true;
