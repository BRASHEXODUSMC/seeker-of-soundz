(()=>{
'use strict';
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const hover=document.createElement('aside');hover.className='profileHoverCard sosProfileHover';hover.setAttribute('aria-live','polite');document.body.appendChild(hover);
let hideTimer=null,active=null;
const roleLabel=r=>({owner:'Owner',administrator:'Administrator',moderator:'Moderator',dj:'DJ',artist:'Artist',premium_member:'Premium Member',member:'Member'}[String(r||'member').toLowerCase()]||String(r||'Member').replaceAll('_',' '));
function fromElement(el){
 const name=el.dataset.profileName||el.alt||'Community Member';
 const avatar=el.dataset.profileAvatar||el.getAttribute('src')||el.querySelector('img')?.src||'assets/images/sos-logo.png';
 return{id:el.dataset.profileId||'',name,avatar,role:el.dataset.profileRole||'member',rank:el.dataset.profileRank||'New Listener',reputation:Number(el.dataset.profileReputation||0),bio:el.dataset.profileBio||'Community member on the Seeker Of SoundZ frequency.',location:el.dataset.profileLocation||'Not shared',online:el.dataset.profileOnline==='true',status:el.dataset.profileStatus||'Exploring the frequency',lastSeen:el.dataset.profileLastSeen||''};
}
function counts(name){const topic=[...document.querySelectorAll('.forumPost')].filter(x=>x.querySelector('[data-profile-name]')?.dataset.profileName===name).length;const replies=[...document.querySelectorAll('.forumReply [data-profile-name]')].filter(x=>x.dataset.profileName===name).length;return{topic,replies}}
function html(p){const c=counts(p.name);const href='members.html';const presence=p.online?`<div class="profileHoverPresence isOnline"><i></i><strong>Online</strong><span>— ${esc(p.status)}</span></div>`:`<div class="profileHoverPresence"><i></i><span>Offline${p.lastSeen?' • last active '+new Date(p.lastSeen).toLocaleString():''}</span></div>`;return `<div class="profileHoverGlow"></div><div class="profileHoverHead"><div class="profileHoverAvatarWrap ${p.online?'isOnline':''}"><img src="${esc(p.avatar)}" alt="${esc(p.name)}"></div><div><p class="profileHoverEyebrow">Community frequency</p><h3>${esc(p.name)}</h3><div class="profileHoverBadges"><span class="roleBadge">${esc(roleLabel(p.role))}</span><span class="rankBadge">${esc(p.rank)}</span></div>${presence}</div></div><p class="profileHoverBio">${esc(p.bio)}</p><div class="profileHoverLocation">📍 ${esc(p.location)}</div><div class="profileMiniStats"><div><strong>${c.topic}</strong><span>Topics here</span></div><div><strong>${c.replies}</strong><span>Replies here</span></div><div><strong>${p.reputation}</strong><span>Reputation</span></div></div><a class="primaryButton profileHoverOpen" href="${href}">Open Members Area →</a>`}
function position(el){const r=el.getBoundingClientRect(),w=Math.min(410,innerWidth-28),h=hover.offsetHeight||320;let left=r.right+14;if(left+w>innerWidth-14)left=r.left-w-14;left=Math.max(14,left);let top=Math.max(14,Math.min(innerHeight-h-14,r.top-26));hover.style.left=left+'px';hover.style.top=top+'px'}
function show(el){clearTimeout(hideTimer);active=el;hover.innerHTML=html(fromElement(el));hover.classList.add('show');requestAnimationFrame(()=>position(el))}
function hide(){hideTimer=setTimeout(()=>{hover.classList.remove('show');active=null},220)}
document.addEventListener('pointerover',e=>{const el=e.target.closest('[data-profile-name]');if(!el||hover.contains(el))return;show(el)});
document.addEventListener('pointerout',e=>{const el=e.target.closest('[data-profile-name]');if(!el)return;if(e.relatedTarget&&hover.contains(e.relatedTarget))return;hide()});
hover.addEventListener('pointerenter',()=>clearTimeout(hideTimer));hover.addEventListener('pointerleave',hide);
document.addEventListener('click',e=>{const el=e.target.closest('[data-profile-name]');if(!el)return;const id=el.dataset.profileId;if(id){e.preventDefault();location.href='members.html'}});
addEventListener('scroll',()=>{if(active&&hover.classList.contains('show'))position(active)},{passive:true});addEventListener('resize',()=>{if(active&&hover.classList.contains('show'))position(active)});
})();
