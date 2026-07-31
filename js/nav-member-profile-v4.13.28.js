/* Seeker Of SoundZ v4.13.28 — navigation member profile */
(()=>{
'use strict';
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
let card=null,hideTimer=null;
function getLink(){return document.getElementById('navMemberProfile')}
function update(session){
 const link=getLink();if(!link)return;
 const image=link.querySelector('img');
 if(!session?.supabase){
  if(image)image.src='assets/images/sos-logo.png';
  Object.assign(link.dataset,{profileName:'Members',profileAvatar:'assets/images/sos-logo.png',profileRole:'guest',profileRank:'Community Access',profileReputation:'0',profileBio:'Login, register, and manage your Seeker Of SoundZ profile.',profileLocation:'Member Area',profileOnline:'false',profileStatus:'Sign in to join the frequency'});
  return;
 }
 const avatar=session.avatar||'assets/images/sos-logo.png';
 if(image)image.src=avatar;
 Object.assign(link.dataset,{
  profileId:session.id||'',
  profileName:session.displayName||session.username||'Member',
  profileAvatar:avatar,
  profileRole:session.dbRole||session.role||'member',
  profileRank:session.rank||'New Listener',
  profileReputation:String(session.reputation||0),
  profileBio:session.bio||'Community member on the Seeker Of SoundZ frequency.',
  profileLocation:session.location||'Not shared',
  profileOnline:session.presenceVisibility==='automatic'?'true':'false',
  profileStatus:session.presenceVisibility==='hidden'?'Presence hidden':session.presenceVisibility==='offline'?'Appearing offline':session.activityStatus||'Exploring the frequency'
 });
 link.classList.toggle('navMemberOnline',session.presenceVisibility==='automatic');
}
function ensureCard(){
 if(document.querySelector('.sosProfileHover'))return document.querySelector('.sosProfileHover');
 if(card)return card;
 card=document.createElement('aside');card.className='profileHoverCard sosProfileHover navProfileHover';document.body.appendChild(card);
 card.addEventListener('pointerenter',()=>clearTimeout(hideTimer));card.addEventListener('pointerleave',hide);
 return card;
}
function roleLabel(r){return String(r||'Member').replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase())}
function show(){
 const link=getLink();if(!link)return;
 const existing=document.querySelector('.sosProfileHover');
 if(existing&&!existing.classList.contains('navProfileHover'))return;
 const box=ensureCard(),online=link.dataset.profileOnline==='true';
 box.innerHTML=`<div class="profileHoverGlow"></div><div class="profileHoverHead"><div class="profileHoverAvatarWrap ${online?'isOnline':''}"><img src="${esc(link.dataset.profileAvatar)}" alt="${esc(link.dataset.profileName)}"></div><div><p class="profileHoverEyebrow">Member profile</p><h3>${esc(link.dataset.profileName)}</h3><div class="profileHoverBadges"><span class="roleBadge">${esc(roleLabel(link.dataset.profileRole))}</span><span class="rankBadge">${esc(link.dataset.profileRank)}</span></div><div class="profileHoverPresence ${online?'isOnline':''}"><i></i><span>${esc(link.dataset.profileStatus)}</span></div></div></div><p class="profileHoverBio">${esc(link.dataset.profileBio)}</p><div class="profileHoverLocation">📍 ${esc(link.dataset.profileLocation)}</div><a class="primaryButton profileHoverOpen" href="members.html">Open Members Area →</a>`;
 box.classList.add('show');
 const r=link.getBoundingClientRect(),w=Math.min(390,innerWidth-24),h=box.offsetHeight||310;
 let left=Math.min(innerWidth-w-12,Math.max(12,r.right-w));
 let top=Math.min(innerHeight-h-12,r.bottom+12);
 if(top<12)top=12;
 box.style.left=left+'px';box.style.top=top+'px';
}
function hide(){hideTimer=setTimeout(()=>document.querySelector('.navProfileHover')?.classList.remove('show'),180)}
async function boot(){
 for(let i=0;i<80&&!getLink();i++)await new Promise(r=>setTimeout(r,25));
 const link=getLink();if(!link)return;
 update(window.SOS?.getSession?.());
 link.addEventListener('pointerenter',show);link.addEventListener('pointerleave',hide);
 window.addEventListener('sos:supabase-session',e=>update(e.detail));
 window.addEventListener('sos:session',e=>update(e.detail));
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();