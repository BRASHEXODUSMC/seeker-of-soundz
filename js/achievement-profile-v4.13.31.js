/* Seeker Of SoundZ v4.13.31 — unified achievement and progression center */
(()=>{
'use strict';
const client=window.SOS_SUPABASE?.client;if(!client)return;
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
let achievementData=null,hubData=null,modal=null,loading=false,activeTab='achievements';
const iconFor=code=>({
 first_frequency:'✦',first_topic:'💬',five_topics:'📡',first_reply:'↩',ten_replies:'🗣',
 first_reaction:'💜',ten_reactions:'⚡',first_collab:'🤝',three_collabs:'🎚',
 profile_complete:'👤',reputation_10:'🌟',reputation_50:'💫',staff_frequency:'🛡',
 night_owl:'🌙',frequency_master:'🔊',daily_signal_7:'📅',weekly_champion:'🏅',
 event_participant:'🎪',season_genesis:'🌀',level_5:'⬆',level_10:'⚡',level_20:'👑'
}[code]||'🏆');
const rarityClass=r=>`rarity-${String(r||'common').toLowerCase()}`;
function playAchievementSound(){
 try{
  const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
  const ctx=new C(),now=ctx.currentTime;
  [[523.25,0],[659.25,.09],[783.99,.18],[1046.5,.3]].forEach(([freq,delay],i)=>{
   const osc=ctx.createOscillator(),gain=ctx.createGain();
   osc.type=i===3?'sine':'triangle';osc.frequency.value=freq;
   gain.gain.setValueAtTime(.0001,now+delay);
   gain.gain.exponentialRampToValueAtTime(.08,now+delay+.018);
   gain.gain.exponentialRampToValueAtTime(.0001,now+delay+.32);
   osc.connect(gain).connect(ctx.destination);osc.start(now+delay);osc.stop(now+delay+.36);
  });
  setTimeout(()=>ctx.close(),1000);
 }catch{}
}
window.SOSAchievementSound=playAchievementSound;

function localAchievementFallback(){
 const defaults=window.SOS_LEGACY_ACHIEVEMENTS_V41333||[];
 const raw=window.SOS?.read?.('sos_achievements_v1',[])||[];
 const seen=window.SOS?.read?.(`sos_seen_achievements_${window.SOS?.getSession?.()?.id||''}`,[])||[];
 const rows=Array.isArray(raw)&&raw.length?raw:defaults;
 const achievements=rows.map((a,i)=>({
  id:a.id||a.code||`local-${i}`,code:a.code||a.id||`local_${i}`,name:a.name||a.title||`Achievement ${i+1}`,
  description:a.description||a.copy||'Original Seeker Of SoundZ achievement.',
  points:Number(a.points||10),category:a.category||'legacy',rarity:a.rarity||'common',
  is_hidden:Boolean(a.is_hidden||a.hidden),title_reward:a.title_reward||null,
  unlocked:Boolean(a.unlocked||seen.includes(a.id)||seen.includes(a.code)||seen.includes(a.name)),
  earned_at:a.earned_at||a.unlockedAt||null
 }));
 return{total:achievements.length,unlocked:achievements.filter(a=>a.unlocked).length,points:achievements.filter(a=>a.unlocked).reduce((n,a)=>n+a.points,0),achievements};
}
async function load(){
 if(loading)return;loading=true;
 try{
  const [a,h,q]=await Promise.allSettled([
   client.rpc('get_my_achievement_profile'),
   client.rpc('get_my_progression_hub'),
   client.rpc('get_my_active_quests')
  ]);
  const ar=a.status==='fulfilled'?a.value:null,hr=h.status==='fulfilled'?h.value:null,qr=q.status==='fulfilled'?q.value:null;
  if(ar&&!ar.error&&ar.data)achievementData=typeof ar.data==='string'?JSON.parse(ar.data):ar.data;
  else achievementData=localAchievementFallback();
  if(hr&&!hr.error&&hr.data)hubData=typeof hr.data==='string'?JSON.parse(hr.data):hr.data;
  else hubData={progression:{level:1,lifetime_xp:Number(achievementData?.points||0),selected_title:'Frequency Seeker'},xp_current_level:0,xp_next_level:100,titles:[],quests:[],events:[],seasons:[],rankings:[]};
  updateCard();if(modal&&!modal.hidden)renderModal();
 }catch(error){
  console.warn('[Progression]',error);
  achievementData=localAchievementFallback();
  hubData=hubData||{progression:{level:1,lifetime_xp:Number(achievementData?.points||0),selected_title:'Frequency Seeker'},xp_current_level:0,xp_next_level:100,titles:[],quests:[],events:[],seasons:[],rankings:[]};
  updateCard();if(modal&&!modal.hidden)renderModal();
 }finally{loading=false}
}
function achievementMetrics(){
 const list=Array.isArray(achievementData?.achievements)?achievementData.achievements:[];
 const unlocked=Number(achievementData?.unlocked||0),total=Math.max(1,Number(achievementData?.total||list.length||1));
 const earned=list.filter(x=>x.unlocked),next=list.find(x=>!x.unlocked&&!x.is_hidden)||list.find(x=>!x.unlocked)||null;
 return{list,unlocked,total,pct:Math.round(unlocked/total*100),next,latest:earned.sort((a,b)=>new Date(b.earned_at||0)-new Date(a.earned_at||0))[0]||list[0],points:Number(achievementData?.points||0)};
}
function progressionMetrics(){
 const p=hubData?.progression||{},current=Number(hubData?.xp_current_level||0),needed=Math.max(1,Number(hubData?.xp_next_level||100));
 return{level:Number(p.level||1),xp:Number(p.lifetime_xp||0),current,needed,pct:Math.min(100,Math.round(current/needed*100)),title:p.selected_title||'Frequency Seeker'};
}
function updateCard(){
 const card=document.querySelector('.featuredAchievementV46');if(!card||!achievementData)return;
 const m=achievementMetrics(),pm=progressionMetrics(),icon=card.querySelector('.profilePanelIconV46');
 if(icon&&!icon.matches('[data-open-achievements]'))icon.outerHTML='<button type="button" class="profilePanelIconV46 achievementOpenButtonV41330" data-open-achievements aria-label="Open progression center" title="Open Achievement Hall">🏆</button>';
 const orb=card.querySelector('.achievementOrbV46');if(orb){orb.textContent=m.latest?.icon_url||m.latest?.icon||iconFor(m.latest?.code);orb.className=`achievementOrbV46 ${rarityClass(m.latest?.rarity)}`}
 const h=card.querySelector('h4');if(h)h.textContent=m.latest?.name||'First Frequency';
 const copy=card.querySelector('.achievementOrbV46 + h4 + p');if(copy)copy.textContent=m.latest?.unlocked?(m.latest.description||'Your newest unlocked milestone.'):'Complete community milestones to unlock this badge.';
 const bar=card.querySelector('.achievementProgressV46 i');if(bar){bar.style.width='0%';requestAnimationFrame(()=>requestAnimationFrame(()=>bar.style.width=`${m.pct}%`))}
 const text=card.querySelector('.achievementProgressTextV46');if(text)text.innerHTML=`<span><strong>${m.unlocked}</strong> of ${m.total} unlocked</span><span class="achievementNextGlowV41330">${m.next?`Next: ${esc(m.next.is_hidden?'Hidden achievement':m.next.name)}`:'All milestones unlocked'}</span>`;
 document.querySelectorAll('.profileStatV46').forEach(stat=>{
  const label=stat.querySelector('small')?.textContent?.trim().toLowerCase();
  if(label==='achievements')stat.querySelector('strong').textContent=String(m.unlocked);
 });
 let xp=card.querySelector('.profileXpStripV41331');
 if(!xp){xp=document.createElement('div');xp.className='profileXpStripV41331';card.appendChild(xp)}
 xp.innerHTML=`<header><strong>Level ${pm.level}</strong><span>${esc(pm.title)}</span><small>${pm.current}/${pm.needed} XP</small></header><div><i style="--xp:${pm.pct}%"></i></div>`;
 card.dataset.achievementReady='1';
}
function ensureModal(){
 if(modal)return modal;
 modal=document.createElement('div');modal.className='achievementModalV41330 progressionModalV41331';modal.hidden=true;
 modal.innerHTML=`<section class="achievementModalCardV41330 progressionCardV41331" role="dialog" aria-modal="true"><header><div><p class="sectionEyebrow">Unified member progression</p><h2>Frequency Progression</h2></div><button type="button" class="achievementModalCloseV41330">×</button></header><nav class="progressionTabsV41331"><button data-progression-tab="achievements">Achievements</button><button data-progression-tab="quests">Quests</button><button data-progression-tab="events">Events & Seasons</button><button data-progression-tab="titles">Titles</button><button data-progression-tab="rankings">Rankings</button></nav><div class="progressionHeroV41331"></div><div class="progressionContentV41331"></div></section>`;
 document.body.appendChild(modal);
 modal.addEventListener('click',e=>{
  if(e.target===modal||e.target.closest('.achievementModalCloseV41330'))close();
  const tab=e.target.closest('[data-progression-tab]');if(tab){activeTab=tab.dataset.progressionTab;renderModal()}
  const start=e.target.closest('[data-start-quest]');if(start)startQuest(start);
   const claim=e.target.closest('[data-claim-quest]');if(claim)claimQuest(claim);
  const title=e.target.closest('[data-select-title]');if(title)selectTitle(title.dataset.selectTitle);
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)close()});
 return modal;
}
function heroHtml(){
 const p=progressionMetrics(),a=achievementMetrics();
 return `<div class="progressionIdentityV41331"><div class="progressionLevelOrbV41331"><span>LEVEL</span><strong>${p.level}</strong></div><div><h3>${esc(p.title)}</h3><p>${p.xp.toLocaleString()} lifetime XP • ${a.unlocked} achievements • ${a.points} achievement points</p><div class="progressionXpBarV41331"><i style="--xp:${p.pct}%"></i></div><small>${p.current} / ${p.needed} XP toward Level ${p.level+1}</small></div></div>`;
}
function achievementsHtml(){
 const m=achievementMetrics();
 return `<div class="achievementModalSummaryV41330"><div><strong>${m.unlocked}/${m.total}</strong><span>Unlocked</span></div><div><strong>${m.pct}%</strong><span>Complete</span></div><div><strong>${m.points}</strong><span>Achievement points</span></div><div><strong>${m.next?esc(m.next.is_hidden?'Secret milestone':m.next.name):'Complete'}</strong><span>Next milestone</span></div></div><div class="achievementModalProgressV41330"><i style="width:${m.pct}%"></i></div><div class="achievementModalListV41330">${m.list.map(a=>`<article class="achievementItemV41330 ${a.unlocked?'isUnlocked':'isLocked'} ${rarityClass(a.rarity)}"><div class="achievementItemIconV41330">${a.unlocked?(a.icon_url||a.icon||iconFor(a.code)):a.is_hidden?'❔':'🔒'}</div><div><header><h3>${esc(a.is_hidden&&!a.unlocked?'Hidden Achievement':a.name)}</h3><span>${esc(a.rarity||'common')} • ${Number(a.points||0)} pts</span></header><p>${esc(a.is_hidden&&!a.unlocked?'Complete a secret action to reveal this achievement.':a.description)}</p><small>${a.unlocked?(a.earned_at?`Unlocked ${new Date(a.earned_at).toLocaleDateString()}`:'Unlocked'):'Locked'}${a.title_reward?` • Title: ${esc(a.title_reward)}`:''}</small></div></article>`).join('')}</div>`;
}
function questsHtml(){
 const quests=Array.isArray(hubData?.quests)?hubData.quests:[];
 const groups=['daily','weekly','seasonal','community'];
 return groups.map(type=>{
  const rows=quests.filter(q=>q.type===type);if(!rows.length)return'';
  return `<section class="questGroupV41331"><header><h3>${type[0].toUpperCase()+type.slice(1)} ${type==='daily'?'Quests':'Challenges'}</h3><span>${rows.filter(q=>q.completed).length}/${rows.length} complete</span></header><div>${rows.map(q=>{const pct=Math.min(100,Math.round(Number(q.progress||0)/Number(q.target||1)*100));return `<article class="questCardV41331 ${q.completed?'isComplete':''} ${q.claimed?'isClaimed':''} ${q.started===false?'isAvailable':''}"><div><strong>${esc(q.icon||'⚡')} ${esc(q.name)}</strong><p>${esc(q.description)}</p><small>${q.progress}/${q.target} • ${q.xp_reward} XP${q.title_reward?` • Title: ${esc(q.title_reward)}`:''}</small></div><div class="questProgressV41331"><i style="width:${pct}%"></i></div>${q.started===false?`<button class="smallAction questStartButtonV4141" data-start-quest="${esc(q.code)}">Start Quest</button>`:q.completed&&!q.claimed?`<button class="smallAction" data-claim-quest="${esc(q.code)}">Claim Reward</button>`:q.claimed?'<span class="questClaimedV41331">Claimed ✓</span>':'<span class="questPendingV41331">Active Quest</span>'}</article>`}).join('')}</div></section>`;
 }).join('')||'<p class="emptyState">No quests are active right now.</p>';
}
function eventsHtml(){
 const events=Array.isArray(hubData?.events)?hubData.events:[],seasons=Array.isArray(hubData?.seasons)?hubData.seasons:[];
 return `<section class="seasonGridV41331">${seasons.map(s=>`<article><span>ACTIVE SEASON</span><h3>${esc(s.name)}</h3><p>${esc(s.description)}</p><small>${new Date(s.starts_at).toLocaleDateString()} – ${new Date(s.ends_at).toLocaleDateString()}</small></article>`).join('')||'<p class="emptyState">No active season.</p>'}</section><section class="communityEventsV41331"><h3>Community Events</h3>${events.map(e=>{const pct=Math.min(100,Math.round(Number(e.progress||0)/Number(e.target||1)*100));return `<article><header><div><strong>${esc(e.name)}</strong><p>${esc(e.description)}</p></div><span>${e.progress}/${e.target}</span></header><div><i style="width:${pct}%"></i></div><small>${e.xp_reward} XP community reward • Ends ${new Date(e.ends_at).toLocaleDateString()}</small></article>`}).join('')||'<p class="emptyState">No community events are active.</p>'}</section>`;
}
function titlesHtml(){
 const titles=Array.isArray(hubData?.titles)?hubData.titles:[],selected=hubData?.progression?.selected_title||'';
 return `<div class="titleSelectorV41331"><header><div><h3>Unlocked Profile Titles</h3><p>Select a title to display with your progression profile.</p></div><span>${titles.length} unlocked</span></header><div>${titles.map(t=>`<button class="${selected===t.title?'selected':''}" data-select-title="${esc(t.title)}"><strong>${esc(t.title)}</strong><small>${esc(t.source_code||'Achievement reward')}</small></button>`).join('')||'<p class="emptyState">Unlock achievements to earn profile titles.</p>'}</div>${selected?'<button class="smallAction clearTitleV41331" data-select-title="">Clear selected title</button>':''}</div>`;
}
function rankingsHtml(){
 const rows=Array.isArray(hubData?.rankings)?hubData.rankings:[];
 return `<div class="rankingListV41331"><header><h3>Global Member Rankings</h3><p>Ranked by lifetime XP, then reputation.</p></header>${rows.map(r=>`<article><strong>#${r.position}</strong><img src="${esc(r.avatar_url||'assets/images/sos-logo.png')}" alt=""><div><h4>${esc(r.display_name)}</h4><small>Level ${r.level} • ${Number(r.xp||0).toLocaleString()} XP${r.title?` • ${esc(r.title)}`:''}</small></div><span>${esc(r.rank_name||'Member')}</span></article>`).join('')||'<p class="emptyState">No ranked members yet.</p>'}</div>`;
}
function renderModal(){
 const box=ensureModal();box.querySelectorAll('[data-progression-tab]').forEach(b=>b.classList.toggle('active',b.dataset.progressionTab===activeTab));
 box.querySelector('.progressionHeroV41331').innerHTML=heroHtml();
 box.querySelector('.progressionContentV41331').innerHTML=activeTab==='achievements'?achievementsHtml():activeTab==='quests'?questsHtml():activeTab==='events'?eventsHtml():activeTab==='titles'?titlesHtml():rankingsHtml();
}
async function startQuest(button){
  button.disabled=true;
  const q=await client.rpc('start_my_quest',{quest_code_input:button.dataset.startQuest});
  if(q.error){button.disabled=false;return window.SOS?.toast?.(q.error.message,{title:'Quest'})}
  window.SOS?.toast?.(`“${q.data?.name||'Quest'}” is now active.`,{title:'Quest Started',icon:'⚡'});
  await load();
 }
 async function claimQuest(button){
 button.disabled=true;
 const q=await client.rpc('claim_my_quest',{quest_code_input:button.dataset.claimQuest});
 if(q.error){button.disabled=false;return window.SOS?.toast?.(q.error.message,{title:'Quest'})}
 playAchievementSound();window.SOS?.toast?.(`You earned ${q.data?.xp_reward||'bonus'} XP.`,{title:`Quest complete: ${q.data?.quest||'Challenge'}`,icon:'⚡'});
 await load();
}
async function selectTitle(title){
 const q=await client.rpc('select_my_profile_title',{title_input:title||null});
 if(q.error)return window.SOS?.toast?.(q.error.message,{title:'Profile title'});
 window.SOS?.toast?.(title?`“${title}” is now your active profile title.`:'Your profile title was cleared.',{title:'Title updated',icon:'👑'});
 await load();
}
async function open(){ensureModal();modal.hidden=false;document.body.classList.add('achievementModalOpenV41330');modal.querySelector('.progressionHeroV41331').innerHTML='<div class="achievementLoadingV41330">Synchronizing progression…</div>';modal.querySelector('.progressionContentV41331').innerHTML='<div class="achievementLoadingV41330">Loading your achievements…</div>';requestAnimationFrame(()=>modal.classList.add('open'));await load();renderModal()}
function close(){if(!modal)return;modal.classList.remove('open');document.body.classList.remove('achievementModalOpenV41330');setTimeout(()=>modal.hidden=true,220)}
function bind(){
 document.addEventListener('click',e=>{if(e.target.closest('[data-open-achievements]'))open()});
 window.addEventListener('sos:open-achievements',()=>open());
 window.addEventListener('hashchange',()=>{if(location.hash==='#achievements')open()});
 const observer=new MutationObserver(()=>{const card=document.querySelector('.featuredAchievementV46');if(card&&!card.dataset.achievementReady&&achievementData)updateCard()});
 observer.observe(document.getElementById('memberDashboard')||document.body,{childList:true,subtree:true});
 window.addEventListener('sos:session',()=>setTimeout(load,80));window.addEventListener('sos:supabase-session',()=>setTimeout(load,80));
}
window.SOSProgression={open,close,load};
async function boot(){bind();const{data}=await client.auth.getSession();if(data.session)await load();if(location.hash==='#achievements')setTimeout(open,120)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();