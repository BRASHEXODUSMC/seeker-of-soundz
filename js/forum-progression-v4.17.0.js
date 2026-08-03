/* Seeker Of SoundZ v4.17.0 — forum progression summary */
(()=>{
'use strict';
const client=window.SOS_SUPABASE?.client;if(!client)return;
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
async function load(){
 const anchor=document.getElementById('forumCategories')?.closest('.forumSidebar')||document.getElementById('forumCategories');
 if(!anchor||document.getElementById('forumProgressionV417'))return;
 const {data:{session}}=await client.auth.getSession();if(!session)return;
 const [profile,quests,achievements]=await Promise.allSettled([
  client.rpc('get_my_progression_hub'),
  client.rpc('get_my_active_quests'),
  client.rpc('get_my_achievement_profile')
 ]);
 const hub=profile.value?.data||{},q=Array.isArray(quests.value?.data)?quests.value.data:[],a=achievements.value?.data||{};
 const progression=hub.progression||{};
 const card=document.createElement('section');card.id='forumProgressionV417';card.className='forumProgressionV417';
 card.innerHTML=`<div class="adminSectionHead"><div><p class="sectionEyebrow">Your Frequency</p><h3>Forum Progression</h3></div><span class="statusPill">Level ${Number(progression.level||1)}</span></div>
 <div class="forumProgressStatsV417"><div><strong>${Number(progression.lifetime_xp||a.points||0)}</strong><span>Lifetime XP</span></div><div><strong>${esc(progression.selected_title||'Frequency Seeker')}</strong><span>Current title</span></div><div><strong>${q.filter(x=>x.started&& !x.claimed).length}</strong><span>Active quests</span></div><div><strong>${Number(a.unlocked_count||0)}</strong><span>Achievements</span></div></div>
 <div class="forumQuestMiniListV417">${q.filter(x=>x.started&&!x.claimed).slice(0,3).map(x=>`<article><strong>${esc(x.icon||'⚡')} ${esc(x.name)}</strong><span>${Number(x.progress||0)}/${Number(x.target||1)} • ${Number(x.xp_reward||0)} XP</span><i><b style="width:${Math.min(100,Math.round(Number(x.progress||0)/Math.max(1,Number(x.target||1))*100))}%"></b></i></article>`).join('')||'<p>No active quests. Open your profile to start one.</p>'}</div>
 <a class="smallAction" href="members.html#achievements">Open Achievements & Quests</a>`;
 anchor.insertAdjacentElement('beforebegin',card);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',load,{once:true}):load();
window.addEventListener('sos:session',load);
})();