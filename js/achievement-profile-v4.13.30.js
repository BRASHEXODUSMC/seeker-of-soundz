/* Seeker Of SoundZ v4.13.30 — Supabase achievement profile center */
(()=>{
'use strict';
const client=window.SOS_SUPABASE?.client;
if(!client)return;
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
let data=null,modal=null,loading=false;

const iconFor=code=>({
 first_frequency:'✦',first_topic:'💬',five_topics:'📡',first_reply:'↩',
 ten_replies:'🗣',first_reaction:'💜',ten_reactions:'⚡',first_collab:'🤝',
 three_collabs:'🎚',profile_complete:'👤',reputation_10:'🌟',
 reputation_50:'💫',staff_frequency:'🛡'
}[code]||'🏆');

async function load(){
 if(loading)return data;
 loading=true;
 try{
  const q=await client.rpc('get_my_achievement_profile');
  if(q.error)throw q.error;
  data=typeof q.data==='string'?JSON.parse(q.data):q.data;
  updateCard();
  return data;
 }catch(error){
  console.warn('[Achievements]',error);
  return null;
 }finally{loading=false}
}
function metrics(){
 const list=Array.isArray(data?.achievements)?data.achievements:[];
 const unlocked=Number(data?.unlocked||0),total=Math.max(1,Number(data?.total||list.length||1));
 const pct=Math.max(0,Math.min(100,Math.round(unlocked/total*100)));
 const earned=list.filter(x=>x.unlocked);
 const next=list.find(x=>!x.unlocked)||null;
 const latest=earned.slice().sort((a,b)=>new Date(b.earned_at||0)-new Date(a.earned_at||0))[0]||list[0]||null;
 return{list,unlocked,total,pct,next,latest,points:Number(data?.points||0)};
}
function updateCard(){
 const card=document.querySelector('.featuredAchievementV46');
 if(!card||!data)return;
 const m=metrics(),icon=card.querySelector('.profilePanelIconV46');
 if(icon){
  icon.outerHTML=`<button type="button" class="profilePanelIconV46 achievementOpenButtonV41330" data-open-achievements aria-label="Open all achievements" title="Open Achievement Hall">🏆</button>`;
 }
 const orb=card.querySelector('.achievementOrbV46');
 if(orb)orb.textContent=iconFor(m.latest?.code);
 const heading=card.querySelector('h4');
 if(heading)heading.textContent=m.latest?.name||'First Frequency';
 const copy=card.querySelector('.achievementOrbV46 + h4 + p');
 if(copy)copy.textContent=m.latest?.unlocked?(m.latest.description||'Your newest unlocked milestone.'):'Complete community milestones to unlock this badge.';
 const bar=card.querySelector('.achievementProgressV46 i');
 if(bar){
  bar.style.width='0%';
  bar.dataset.progress=String(m.pct);
  requestAnimationFrame(()=>requestAnimationFrame(()=>bar.style.width=`${m.pct}%`));
 }
 const text=card.querySelector('.achievementProgressTextV46');
 if(text)text.innerHTML=`<span><strong>${m.unlocked}</strong> of ${m.total} unlocked</span><span class="achievementNextGlowV41330">${m.next?`Next: ${esc(m.next.name)}`:'All milestones unlocked'}</span>`;
 card.dataset.achievementReady='1';
}
function ensureModal(){
 if(modal)return modal;
 modal=document.createElement('div');
 modal.className='achievementModalV41330';
 modal.hidden=true;
 modal.innerHTML=`<section class="achievementModalCardV41330" role="dialog" aria-modal="true" aria-labelledby="achievementModalTitle"><header><div><p class="sectionEyebrow">Member progression</p><h2 id="achievementModalTitle">Achievement Hall</h2></div><button type="button" class="achievementModalCloseV41330" aria-label="Close achievements">×</button></header><div class="achievementModalSummaryV41330"></div><div class="achievementModalProgressV41330"><i></i></div><div class="achievementModalListV41330"></div></section>`;
 document.body.appendChild(modal);
 modal.addEventListener('click',e=>{
  if(e.target===modal||e.target.closest('.achievementModalCloseV41330'))close();
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)close()});
 return modal;
}
function renderModal(){
 const box=ensureModal(),m=metrics();
 box.querySelector('.achievementModalSummaryV41330').innerHTML=`<div><strong>${m.unlocked}/${m.total}</strong><span>Unlocked</span></div><div><strong>${m.pct}%</strong><span>Complete</span></div><div><strong>${m.points}</strong><span>Frequency points</span></div><div><strong>${m.next?esc(m.next.name):'Complete'}</strong><span>Next milestone</span></div>`;
 const progress=box.querySelector('.achievementModalProgressV41330 i');
 progress.style.width='0%';requestAnimationFrame(()=>requestAnimationFrame(()=>progress.style.width=`${m.pct}%`));
 box.querySelector('.achievementModalListV41330').innerHTML=m.list.map(a=>`<article class="achievementItemV41330 ${a.unlocked?'isUnlocked':'isLocked'}"><div class="achievementItemIconV41330">${a.unlocked?iconFor(a.code):'🔒'}</div><div><header><h3>${esc(a.name)}</h3><span>${Number(a.points||0)} pts</span></header><p>${esc(a.description)}</p><small>${a.unlocked?(a.earned_at?`Unlocked ${new Date(a.earned_at).toLocaleDateString()}`:'Unlocked'):'Locked — complete this milestone to unlock'}</small></div></article>`).join('');
}
async function open(){
 ensureModal();modal.hidden=false;document.body.classList.add('achievementModalOpenV41330');
 modal.querySelector('.achievementModalListV41330').innerHTML='<div class="achievementLoadingV41330">Synchronizing achievements…</div>';
 await load();renderModal();requestAnimationFrame(()=>modal.classList.add('open'));
}
function close(){
 if(!modal)return;
 modal.classList.remove('open');document.body.classList.remove('achievementModalOpenV41330');
 setTimeout(()=>modal.hidden=true,220);
}
function bind(){
 document.addEventListener('click',e=>{if(e.target.closest('[data-open-achievements]'))open()});
 const observer=new MutationObserver(()=>{const card=document.querySelector('.featuredAchievementV46');if(card&&!card.dataset.achievementReady&&data)updateCard()});
 observer.observe(document.getElementById('memberDashboard')||document.body,{childList:true,subtree:true});
 window.addEventListener('sos:session',()=>setTimeout(load,80));
 window.addEventListener('sos:supabase-session',()=>setTimeout(load,80));
}
async function boot(){
 bind();
 const {data:sessionData}=await client.auth.getSession();
 if(sessionData.session)await load();
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();