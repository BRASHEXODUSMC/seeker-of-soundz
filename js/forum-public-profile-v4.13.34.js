/* Seeker Of SoundZ v4.13.34 — safe forum public profiles */
(()=>{
'use strict';
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const roleLabel=r=>({owner:'Owner',administrator:'Administrator',moderator:'Moderator',dj:'DJ',artist:'Artist',premium_member:'Premium Member',member:'Member'}[String(r||'member').toLowerCase()]||String(r||'Member').replaceAll('_',' '));
let modal=null;

function profileFrom(el){
 const name=el.dataset.profileName||el.alt||'Community Member';
 const avatar=el.dataset.profileAvatar||el.getAttribute('src')||el.querySelector('img')?.src||'assets/images/sos-logo.png';
 return{
  id:el.dataset.profileId||'',
  name,
  username:el.dataset.profileUsername||'',
  avatar,
  role:el.dataset.profileRole||'member',
  rank:el.dataset.profileRank||'New Listener',
  reputation:Number(el.dataset.profileReputation||0),
  bio:el.dataset.profileBio||'Community member on the Seeker Of SoundZ frequency.',
  online:el.dataset.profileOnline==='true',
  hidden:el.dataset.profileStatus==='Presence hidden',
  status:el.dataset.profileStatus||'Exploring the frequency'
 };
}
function counts(id,name){
 const profileSelector=id?`[data-profile-id="${CSS.escape(id)}"]`:`[data-profile-name="${CSS.escape(name)}"]`;
 const topics=new Set([...document.querySelectorAll(`.forumPost ${profileSelector}`)].map(el=>el.closest('.forumPost')?.dataset.postId).filter(Boolean)).size;
 const replies=new Set([...document.querySelectorAll(`.forumReply ${profileSelector}`)].map(el=>el.closest('.forumReply')?.dataset.replyId).filter(Boolean)).size;
 return{topics,replies};
}
function ensureModal(){
 if(modal)return modal;
 modal=document.createElement('div');
 modal.className='forumPublicProfileModalV41334';
 modal.hidden=true;
 modal.innerHTML=`<article role="dialog" aria-modal="true" aria-labelledby="forumPublicProfileName"><button type="button" class="forumPublicProfileCloseV41334" aria-label="Close profile">×</button><div class="forumPublicProfileContentV41334"></div></article>`;
 document.body.appendChild(modal);
 modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('.forumPublicProfileCloseV41334'))close()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)close()});
 return modal;
}
function openFrom(el){
 const p=profileFrom(el),c=counts(p.id,p.name),box=ensureModal();
 const presence=p.hidden
  ?'<span class="presenceHidden">Presence hidden</span>'
  :p.online?`<span class="presenceOnline"><i></i>Online — ${esc(p.status)}</span>`:'<span class="presenceOffline"><i></i>Offline</span>';
 box.querySelector('.forumPublicProfileContentV41334').innerHTML=`
  <header class="forumPublicProfileHeroV41334">
   <div class="forumPublicProfileAvatarV41334 ${p.online&&!p.hidden?'isOnline':''}"><img src="${esc(p.avatar)}" alt="${esc(p.name)}"></div>
   <div><p class="sectionEyebrow">Public member profile</p><h2 id="forumPublicProfileName">${esc(p.name)}</h2>${p.username?`<small>@${esc(p.username)}</small>`:''}<div class="forumPublicProfileBadgesV41334"><span>${esc(roleLabel(p.role))}</span><span>${esc(p.rank)}</span></div>${presence}</div>
  </header>
  <section class="forumPublicProfileAboutV41334"><h3>About</h3><p>${esc(p.bio)}</p></section>
  <section class="forumPublicProfileStatsV41334"><div><strong>${c.topics}</strong><span>Topics here</span></div><div><strong>${c.replies}</strong><span>Replies here</span></div><div><strong>${p.reputation}</strong><span>Reputation</span></div></section>
  <p class="forumPublicProfilePrivacyV41334">Only public community information is shown. Email, account identifiers, private links, and exact activity times remain hidden.</p>`;
 box.hidden=false;document.body.classList.add('forumPublicProfileOpenV41334');
 requestAnimationFrame(()=>box.classList.add('open'));
}
function close(){
 if(!modal)return;modal.classList.remove('open');document.body.classList.remove('forumPublicProfileOpenV41334');setTimeout(()=>modal.hidden=true,220);
}
document.addEventListener('click',e=>{
 const el=e.target.closest('.forumPost [data-profile-name],.forumReply [data-profile-name],#forumMemberDirectory [data-profile-name],#forumPresenceStrip [data-profile-name]');
 if(!el||e.target.closest('a[href]'))return;
 e.preventDefault();e.stopImmediatePropagation();openFrom(el);
},true);
})();