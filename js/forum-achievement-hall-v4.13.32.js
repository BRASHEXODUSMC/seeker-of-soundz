/* Seeker Of SoundZ v4.13.32 — forum Achievement Hall */
(()=>{
'use strict';
const client=window.SOS_SUPABASE?.client;if(!client)return;
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
let modal=null,data=null;
function localRows(){
 const defaults=[
 {code:'first_frequency',name:'First Frequency',description:'Create your Seeker Of SoundZ member profile.',points:10,category:'profile'},
 {code:'first_topic',name:'Signal Starter',description:'Publish your first forum discussion.',points:15,category:'forums'},
 {code:'five_topics',name:'Frequency Broadcaster',description:'Publish five forum discussions.',points:35,category:'forums',rarity:'uncommon'},
 {code:'first_reply',name:'First Response',description:'Reply to a community discussion.',points:10,category:'forums'},
 {code:'ten_replies',name:'Community Voice',description:'Post ten forum replies.',points:35,category:'forums',rarity:'uncommon'},
 {code:'first_reaction',name:'Positive Signal',description:'React to a community post or reply.',points:10,category:'forums'},
 {code:'ten_reactions',name:'Energy Amplifier',description:'Share ten reactions across the forums.',points:30,category:'forums',rarity:'uncommon'},
 {code:'first_collab',name:'Studio Connected',description:'Join your first Collaboration Studio project.',points:20,category:'collaboration',rarity:'rare'},
 {code:'three_collabs',name:'Collaboration Regular',description:'Participate in three collaboration projects.',points:45,category:'collaboration',rarity:'rare'},
 {code:'profile_complete',name:'Profile Tuned',description:'Complete the important sections of your public profile.',points:25,category:'profile',rarity:'uncommon'},
 {code:'reputation_10',name:'Rising Frequency',description:'Reach 10 community reputation.',points:30,category:'reputation',rarity:'rare'},
 {code:'reputation_50',name:'Community Resonance',description:'Reach 50 community reputation.',points:75,category:'reputation',rarity:'epic'},
 {code:'staff_frequency',name:'Community Guardian',description:'Serve the community as a staff member.',points:100,category:'staff',rarity:'legendary'}
];
 const raw=window.SOS?.read?.('sos_achievements_v1',[])||[];
 const session=window.SOS?.getSession?.();
 const seen=window.SOS?.read?.(`sos_seen_achievements_${session?.id||''}`,[])||[];
 return (Array.isArray(raw)&&raw.length?raw:defaults).map((a,i)=>({
  code:a.code||a.id||`legacy_${i}`,name:a.name||a.title||`Achievement ${i+1}`,
  description:a.description||a.copy||'Original Seeker Of SoundZ achievement.',
  points:Number(a.points||10),rarity:a.rarity||'common',category:a.category||'legacy',
  is_hidden:Boolean(a.is_hidden||a.hidden),
  unlocked:Boolean(a.unlocked||seen.includes(a.id)||seen.includes(a.code)||seen.includes(a.name)),
  earned_at:a.earned_at||a.unlockedAt||null
 }));
}
async function load(){
 const {data:session}=await client.auth.getSession();
 if(session.session){
  const q=await client.rpc('get_my_achievement_profile');
  if(!q.error&&q.data){
   const parsed=typeof q.data==='string'?JSON.parse(q.data):q.data;
   const server=Array.isArray(parsed?.achievements)?parsed.achievements:[];
   const legacy=localRows();
   const codes=new Set(server.map(a=>a.code));
   data=[...server,...legacy.filter(a=>!codes.has(a.code))];
   return;
  }
 }
 data=localRows();
}
function ensureButton(){
 const toolbar=document.querySelector('.forumToolbar');if(!toolbar||document.getElementById('forumAchievementButton'))return;
 const button=document.createElement('button');
 button.id='forumAchievementButton';button.type='button';button.className='secondaryButton forumAchievementButtonV41332';
 button.innerHTML='<span>🏆</span><strong>Achievement Hall</strong>';
 toolbar.appendChild(button);
 button.addEventListener('click',open);
}
function ensureModal(){
 if(modal)return modal;
 modal=document.createElement('div');modal.className='forumAchievementModalV41332';modal.hidden=true;
 modal.innerHTML=`<section role="dialog" aria-modal="true" aria-labelledby="forumAchievementTitle"><header><div><p class="sectionEyebrow">Community progression</p><h2 id="forumAchievementTitle">Achievement Hall</h2></div><button type="button" class="forumAchievementCloseV41332" aria-label="Close">×</button></header><div class="forumAchievementSummaryV41332"></div><div class="forumAchievementListV41332"></div></section>`;
 document.body.appendChild(modal);
 modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('.forumAchievementCloseV41332'))close()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)close()});
 return modal;
}
function render(){
 const rows=Array.isArray(data)?data:[],unlocked=rows.filter(a=>a.unlocked).length,total=rows.length,pct=total?Math.round(unlocked/total*100):0;
 modal.querySelector('.forumAchievementSummaryV41332').innerHTML=`<div><strong>${unlocked}/${total}</strong><span>Unlocked</span></div><div><strong>${pct}%</strong><span>Complete</span></div><div><strong>${rows.filter(a=>a.category==='forums').length}</strong><span>Forum achievements</span></div>`;
 modal.querySelector('.forumAchievementListV41332').innerHTML=rows.length?rows.map(a=>`<article class="${a.unlocked?'unlocked':'locked'} rarity-${esc(a.rarity||'common')}"><div>${a.unlocked?'🏆':a.is_hidden?'❔':'🔒'}</div><section><header><h3>${esc(a.is_hidden&&!a.unlocked?'Hidden Achievement':a.name)}</h3><span>${esc(a.rarity||'common')} • ${Number(a.points||0)} pts</span></header><p>${esc(a.is_hidden&&!a.unlocked?'Complete a secret action to reveal this achievement.':a.description)}</p><small>${a.unlocked?(a.earned_at?`Unlocked ${new Date(a.earned_at).toLocaleDateString()}`:'Unlocked'):'Locked'} • ${esc(a.category||'community')}</small></section></article>`).join(''):'<div class="emptyState">No achievements are available yet.</div>';
}
async function open(){
 ensureModal();modal.hidden=false;modal.querySelector('.forumAchievementListV41332').innerHTML='<div class="achievementLoadingV41330">Loading achievements…</div>';requestAnimationFrame(()=>modal.classList.add('open'));
 await load();render();
}
function close(){if(!modal)return;modal.classList.remove('open');setTimeout(()=>modal.hidden=true,220)}
function boot(){ensureButton()}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();