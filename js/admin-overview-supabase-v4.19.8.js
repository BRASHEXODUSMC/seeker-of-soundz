/* Seeker Of SoundZ v4.19.8 — Live Supabase Admin Overview */
(()=>{
'use strict';
const client=window.SOS_SUPABASE?.client;
const panel=document.getElementById('adminPanel');
const menu=document.querySelector('.adminMenu');
if(!client||!panel||!menu)return;

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const format=value=>Number.isFinite(Number(value))?new Intl.NumberFormat().format(Number(value)):'—';

async function exactCount(table,filter){
 let query=client.from(table).select('*',{count:'exact',head:true});
 if(typeof filter==='function')query=filter(query);
 const {count,error}=await query;
 if(error)throw error;
 return Number(count||0);
}
async function profileSnapshot(){
 const {data,error}=await client.from('profiles').select('role,last_seen_at,is_banned,collaboration_access');
 if(error)throw error;
 const now=Date.now();
 return {
  members:data.length,
  online:data.filter(row=>row.last_seen_at&&now-new Date(row.last_seen_at).getTime()<150000).length,
  admins:data.filter(row=>['owner','administrator'].includes(String(row.role||'').toLowerCase())).length,
  banned:data.filter(row=>row.is_banned).length,
  collaboration:data.filter(row=>row.collaboration_access).length
 };
}
async function safe(label,loader){
 try{return {label,value:await loader(),ok:true}}
 catch(error){console.warn(`[Admin Overview] ${label}`,error.message);return {label,value:null,ok:false,error:error.message}}
}
async function loadStats(){
 const results=await Promise.all([
  safe('profiles',profileSnapshot),
  safe('topics',()=>exactCount('forum_topics')),
  safe('replies',()=>exactCount('forum_replies')),
  safe('reactions',()=>exactCount('forum_reactions')),
  safe('collaborationProjects',()=>exactCount('collaboration_projects')),
  safe('collaborationMessages',()=>exactCount('collaboration_messages')),
  safe('events',()=>exactCount('site_events')),
  safe('eventResponses',()=>exactCount('site_event_responses')),
  safe('music',()=>exactCount('music_releases')),
  safe('gallery',async()=>{
   try{return await exactCount('public_gallery_items')}
   catch{return exactCount('gallery_items')}
  }),
  safe('contacts',()=>exactCount('contact_messages')),
  safe('notifications',()=>exactCount('notifications')),
  safe('socials',()=>exactCount('site_social_links',query=>query.eq('is_visible',true))),
  safe('quests',()=>exactCount('progression_quests',query=>query.eq('is_active',true)))
 ]);
 return Object.fromEntries(results.map(item=>[item.label,item]));
}
function metric(label,value,detail,icon='◆'){
 return `<article class="liveAdminMetricV4198"><i>${icon}</i><div><strong>${format(value)}</strong><span>${esc(label)}</span><small>${esc(detail)}</small></div></article>`;
}
function unavailable(label,error){
 return `<article class="liveAdminMetricV4198 isUnavailable"><i>!</i><div><strong>—</strong><span>${esc(label)}</span><small>${esc(error||'Unavailable from current database permissions')}</small></div></article>`;
}
function isOverview(){
 return menu.querySelector('[data-panel="overview"]')?.classList.contains('active')||
   panel.textContent.includes('Dashboard Overview')||
   panel.textContent.includes('Live Supabase Overview');
}
async function render(){
 if(!isOverview())return;
 const existing=panel.querySelector('.liveSupabaseOverviewV4198');
 if(existing?.dataset.loading==='true')return;
 panel.innerHTML=`<section class="liveSupabaseOverviewV4198" data-loading="true">
  <header class="liveOverviewHeroV4198">
   <div><p class="sectionEyebrow">Live Production Snapshot</p><h2>Supabase Overview</h2><p>Current database totals and website activity from the production project.</p></div>
   <button class="secondaryButton" id="refreshLiveOverviewV4198" disabled>Loading live data…</button>
  </header>
  <div class="liveOverviewLoadingV4198"><span></span><p>Synchronizing members, forums, collaboration, media and events…</p></div>
 </section>`;
 const data=await loadStats();
 if(!isOverview())return;
 const profiles=data.profiles.ok?data.profiles.value:null;
 const cards=[
  profiles?metric('Members',profiles.members,`${profiles.online} online now`,'◎'):unavailable('Members',data.profiles.error),
  profiles?metric('Owners & Admins',profiles.admins,`${profiles.banned} banned accounts`,'♛'):unavailable('Owners & Admins',data.profiles.error),
  data.topics.ok?metric('Forum Topics',data.topics.value,`${format(data.replies.value)} replies`,'▤'):unavailable('Forum Topics',data.topics.error),
  data.reactions.ok?metric('Forum Reactions',data.reactions.value,'Community engagement','♥'):unavailable('Forum Reactions',data.reactions.error),
  data.collaborationProjects.ok?metric('Collaboration Projects',data.collaborationProjects.value,`${format(data.collaborationMessages.value)} project messages`,'⌁'):unavailable('Collaboration Projects',data.collaborationProjects.error),
  profiles?metric('Collaboration Access',profiles.collaboration,'Approved member accounts','🤝'):unavailable('Collaboration Access',data.profiles.error),
  data.events.ok?metric('Events',data.events.value,`${format(data.eventResponses.value)} RSVP responses`,'◷'):unavailable('Events',data.events.error),
  data.music.ok?metric('Music Releases',data.music.value,'Supabase music catalog','♫'):unavailable('Music Releases',data.music.error),
  data.gallery.ok?metric('Gallery Images',data.gallery.value,'Public gallery records','▧'):unavailable('Gallery Images',data.gallery.error),
  data.contacts.ok?metric('Contact Messages',data.contacts.value,'Website inbox records','✉'):unavailable('Contact Messages',data.contacts.error),
  data.notifications.ok?metric('Notifications',data.notifications.value,'Member notification records','●'):unavailable('Notifications',data.notifications.error),
  data.socials.ok?metric('Visible Social Links',data.socials.value,'Published on Socials page','↗'):unavailable('Visible Social Links',data.socials.error),
  data.quests.ok?metric('Active Quests',data.quests.value,'Available progression quests','⚡'):unavailable('Active Quests',data.quests.error)
 ].join('');
 const unavailableCount=Object.values(data).filter(item=>!item.ok).length;
 panel.innerHTML=`<section class="liveSupabaseOverviewV4198">
  <header class="liveOverviewHeroV4198">
   <div><p class="sectionEyebrow">Live Production Snapshot</p><h2>Supabase Overview</h2><p>Current database totals and website activity from the production project.</p></div>
   <button class="secondaryButton" id="refreshLiveOverviewV4198">Refresh Supabase Data</button>
  </header>
  <div class="liveOverviewStatusV4198"><span class="isOnline">● Connected</span><small>Updated ${new Date().toLocaleTimeString()}${unavailableCount?` · ${unavailableCount} restricted or unavailable source${unavailableCount===1?'':'s'}`:''}</small></div>
  <div class="liveAdminMetricsV4198">${cards}</div>
  <section class="liveOverviewSystemsV4198">
   <article><i>◎</i><div><strong>Members & Roles</strong><p>Profiles, online activity, account roles, collaboration access and bans are read from Supabase.</p></div><a href="#" data-open-admin-panel="members">Open Members</a></article>
   <article><i>▤</i><div><strong>Community</strong><p>Forum topics, replies, reactions, quests and notifications are counted from production tables.</p></div><a href="#" data-open-admin-panel="forums">Open Forums</a></article>
   <article><i>⌁</i><div><strong>Content & Collaboration</strong><p>Projects, messages, events, gallery, music, contact inbox and social links are included where available.</p></div><a href="#" data-open-admin-panel="collaborations">Open Collaboration</a></article>
  </section>
 </section>`;
}
menu.addEventListener('click',event=>{
 const button=event.target.closest('[data-panel]');
 if(button?.dataset.panel==='overview')setTimeout(render,180);
});
panel.addEventListener('click',event=>{
 if(event.target.closest('#refreshLiveOverviewV4198')){event.preventDefault();render();return}
 const link=event.target.closest('[data-open-admin-panel]');
 if(link){
  event.preventDefault();
  menu.querySelector(`[data-panel="${CSS.escape(link.dataset.openAdminPanel)}"]`)?.click();
 }
});
const observer=new MutationObserver(()=>{
 if(isOverview()&&!panel.querySelector('.liveSupabaseOverviewV4198'))setTimeout(render,40);
});
observer.observe(panel,{childList:true,subtree:false});
setTimeout(render,240);
})();
