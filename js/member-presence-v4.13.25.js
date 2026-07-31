/* Seeker Of SoundZ v4.13.28 — responsive member presence card */
(()=>{
'use strict';
const clean=v=>String(v||'').replace(/[<>]/g,'');
function render(session){
 const dash=document.getElementById('memberDashboard'),avatar=document.getElementById('dashboardAvatar');
 if(!dash||!avatar||!session?.supabase)return;
 let wrap=avatar.closest('.publicProfileAvatarWrap');
 if(!wrap){wrap=document.createElement('span');wrap.className='publicProfileAvatarWrap';avatar.parentNode.insertBefore(wrap,avatar);wrap.appendChild(avatar)}
 const mode=session.presenceVisibility||'automatic';
 const online=mode==='automatic';
 wrap.classList.toggle('isOnline',online);
 wrap.classList.toggle('isOffline',mode==='offline');
 wrap.classList.toggle('isHiddenPresence',mode==='hidden');
 let card=document.getElementById('memberOnlineStatusCard');
 if(!card){card=document.createElement('div');card.id='memberOnlineStatusCard';card.className='memberOnlineStatusCard';dash.querySelector('.profilePreview')?.insertAdjacentElement('afterend',card)}
 card.className=`memberOnlineStatusCard presence-${mode}`;
 if(mode==='hidden')card.innerHTML='<i></i><strong>Presence hidden</strong><span>— Other members cannot see your activity or last-seen time.</span>';
 else if(mode==='offline')card.innerHTML='<i></i><strong>Appearing offline</strong><span>— Your account remains signed in, but your public status is offline.</span>';
 else card.innerHTML=`<i></i><strong>Online</strong><span>— ${clean(session.activityStatus||'Exploring the frequency')}</span>`;
}
window.addEventListener('sos:supabase-session',e=>render(e.detail));
window.addEventListener('sos:session',e=>render(e.detail));
if(window.SOS?.getSession?.())render(window.SOS.getSession());
})();