(()=>{
'use strict';
const client=window.SOS_SUPABASE?.client;const id=new URLSearchParams(location.search).get('profile');if(!client||!id)return;
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const roleLabel=r=>String(r||'member').replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase());
async function open(){
 const modal=document.createElement('div');modal.className='publicProfileModal';modal.innerHTML='<section class="publicProfileCard"><button class="publicProfileClose" type="button" aria-label="Close profile">×</button><div class="publicProfileLoading">Loading member frequency…</div></section>';document.body.appendChild(modal);
 modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('.publicProfileClose')){history.replaceState({},'',location.pathname);modal.remove()}});
 const [{data:p,error},{count:topics},{count:replies}]=await Promise.all([
  client.from('profiles').select('id,username,display_name,avatar_url,banner_url,biography,location,role,rank_name,reputation,created_at,social_links').eq('id',id).maybeSingle(),
  client.from('forum_topics').select('id',{count:'exact',head:true}).eq('author_id',id),
  client.from('forum_replies').select('id',{count:'exact',head:true}).eq('author_id',id)
 ]);
 const card=modal.querySelector('.publicProfileCard');if(error||!p){card.innerHTML='<button class="publicProfileClose" type="button">×</button><div class="emptyState"><h2>Profile unavailable</h2><p>This member profile could not be loaded.</p></div>';return}
 const socials=Object.entries(p.social_links||{}).filter(([,url])=>url).map(([name,url])=>`<a href="${esc(url)}" target="_blank" rel="noopener">${esc(name)} ↗</a>`).join('');
 card.innerHTML=`<button class="publicProfileClose" type="button" aria-label="Close profile">×</button><div class="publicProfileBanner"${p.banner_url?` style="background-image:url('${esc(p.banner_url)}')"`:''}></div><div class="publicProfileIdentity"><img src="${esc(p.avatar_url||'assets/images/sos-logo.png')}" alt=""><div><p class="sectionEyebrow">Seeker Of SoundZ Member</p><h2>${esc(p.display_name||p.username||'Community Member')}</h2><p>@${esc(p.username||'member')}</p><div class="profileHoverBadges"><span class="roleBadge">${esc(roleLabel(p.role))}</span><span class="rankBadge">${esc(p.rank_name||'New Listener')}</span></div></div></div><p class="publicProfileBio">${esc(p.biography||'This member has not added a biography yet.')}</p><p class="publicProfileLocation">📍 ${esc(p.location||'Location not shared')}</p><div class="profileMiniStats"><div><strong>${topics||0}</strong><span>Topics</span></div><div><strong>${replies||0}</strong><span>Replies</span></div><div><strong>${Number(p.reputation||0)}</strong><span>Reputation</span></div></div>${socials?`<div class="publicProfileSocials">${socials}</div>`:''}`;
}
open();
})();
