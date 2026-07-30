(()=>{
'use strict';
const host=document.getElementById('musicCommerceGrid');if(!host||!window.SOS)return;
const esc=v=>String(v??'').replace(/[&<>\'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const enhance=()=>{
 const tracks=SOS.read(SOS.K.music,[]);if(!tracks.length)return;
 host.querySelectorAll('.musicCommerceCard').forEach(card=>{
  const title=card.querySelector('h3')?.textContent?.trim();const t=tracks.find(x=>x.title===title);if(!t)return;
  const body=card.querySelector('.musicCommerceBody');if(!body)return;
  if(!body.querySelector('.musicReleaseDetails')&&(t.license||t.releaseDate||t.previewLabel)){
   const facts=body.querySelector('.musicFacts');const d=document.createElement('div');d.className='musicReleaseDetails';d.innerHTML=`${t.previewLabel?`<span>${esc(t.previewLabel)}</span>`:''}${t.license?`<span>${esc(t.license)}</span>`:''}${t.releaseDate?`<span>${esc(t.releaseDate)}</span>`:''}`;facts?.after(d);
  }
  if(t.purchaseUrl&&!body.querySelector('.musicPurchaseLink')){
   const actions=body.querySelector('.musicCommerceActions');const a=document.createElement('a');a.className='secondaryButton musicPurchaseLink';a.href=t.purchaseUrl;a.target='_blank';a.rel='noopener';a.textContent=t.purchaseCta||'Open purchase page';actions?.appendChild(a);
  }
 });
};
requestAnimationFrame(enhance);setTimeout(enhance,250);
})();
