/* Seeker Of SoundZ v4.19.7 — live Socials page */
(()=>{
'use strict';
const client=window.SOS_SUPABASE?.client;
const grid=document.querySelector('#socialHub .socialGrid');
if(!client||!grid)return;
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function safeUrl(value){
 const url=String(value||'').trim();
 if(!url)return '#';
 try{const parsed=new URL(url,location.href);return ['http:','https:'].includes(parsed.protocol)?parsed.href:'#'}catch{return '#'}
}
function render(rows){
 if(!Array.isArray(rows)||!rows.length)return;
 grid.innerHTML=rows.map(row=>`<a class="socialCard ${row.featured?'socialCardFeatured':''}" href="${esc(safeUrl(row.url))}" ${row.url?'target="_blank" rel="noopener noreferrer"':'aria-disabled="true"'}>
  <div class="socialCardTop"><span class="socialIcon">${esc(row.icon||'↗')}</span><span class="socialArrow">↗</span></div>
  <div class="socialCardContent"><p class="sectionEyebrow">${esc(row.category||'Connect')}</p><h3>${esc(row.name||row.key)}</h3><p>${esc(row.description||'Official Seeker Of SoundZ social destination.')}</p></div>
  ${row.url?'':'<span class="socialComingSoonV4197">Link coming soon</span>'}
 </a>`).join('');
 if(window.matchMedia('(pointer:fine)').matches){
  grid.querySelectorAll('.socialCard').forEach(card=>{
   card.addEventListener('mousemove',event=>{const r=card.getBoundingClientRect(),x=(event.clientX-r.left)/r.width-.5,y=(event.clientY-r.top)/r.height-.5;card.style.transform=`perspective(700px) rotateX(${-y*4}deg) rotateY(${x*6}deg) translateY(-5px)`});
   card.addEventListener('mouseleave',()=>card.style.transform='');
  });
 }
}
async function load(){
 const {data,error}=await client.rpc('get_site_social_links');
 if(error){console.warn('[Socials Manager]',error.message);return}
 render(data);
}
load();
client.channel('site-social-links-v4197').on('postgres_changes',{event:'*',schema:'public',table:'site_social_links'},load).subscribe();
})();
