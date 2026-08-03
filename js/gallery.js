/* Seeker Of SoundZ v4.16.0 — Supabase public gallery */
(()=>{
'use strict';
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const grid=document.querySelector('.fullGalleryGrid');
const client=window.SOS_SUPABASE?.client;
let galleryItems=[],visibleItems=[],currentIndex=0;
const modal=document.getElementById('galleryModal'),modalImage=document.getElementById('galleryModalImage'),modalTitle=document.getElementById('galleryModalTitle'),closeButton=document.getElementById('galleryModalClose'),previousButton=document.getElementById('galleryModalPrevious'),nextButton=document.getElementById('galleryModalNext');
let modalDescription=document.getElementById('galleryModalDescription');
if(modalTitle&&!modalDescription){modalDescription=document.createElement('p');modalDescription.id='galleryModalDescription';modalDescription.className='galleryModalDescription';modalTitle.insertAdjacentElement('afterend',modalDescription)}

function render(items){
 if(!grid||!items.length)return;
 grid.innerHTML=items.map(item=>{
  const layout=item.layout==='tall'?' fullGalleryTall':item.layout==='wide'?' fullGalleryWide':'';
  return `<button class="fullGalleryItem${layout}" type="button" data-gallery-category="${esc(item.category||'other')}" data-gallery-image="${esc(item.image)}" data-gallery-title="${esc(item.title)}" data-gallery-description="${esc(item.description||'')}" data-gallery-credit="${esc(item.credit||'')}" aria-label="Open ${esc(item.title)} image"><img src="${esc(item.image)}" alt="${esc(item.title)}" loading="lazy"><span class="fullGalleryOverlay"><small>${esc(String(item.category||'other').replaceAll('-',' '))}</small><strong>${esc(item.title)}</strong>${item.description?`<em>${esc(item.description)}</em>`:''}</span></button>`;
 }).join('');
 bindItems();
}
function bindItems(){
 galleryItems=[...document.querySelectorAll('.fullGalleryItem')];
 visibleItems=[...galleryItems];
 galleryItems.forEach(item=>item.addEventListener('click',()=>openModal(item)));
}
function filterGallery(category){
 visibleItems=[];
 galleryItems.forEach(item=>{const show=category==='all'||item.dataset.galleryCategory===category;item.classList.toggle('galleryItemHidden',!show);if(show)visibleItems.push(item)});
}
function updateModal(){
 const item=visibleItems[currentIndex];if(!item)return;
 modalImage.src=item.dataset.galleryImage;modalImage.alt=item.dataset.galleryTitle;modalTitle.textContent=item.dataset.galleryTitle;
 const parts=[item.dataset.galleryDescription,item.dataset.galleryCredit?`Photo credit: ${item.dataset.galleryCredit}`:''].filter(Boolean);
 if(modalDescription)modalDescription.textContent=parts.join(' • ');
}
function openModal(item){if(!modal)return;currentIndex=Math.max(0,visibleItems.indexOf(item));updateModal();modal.classList.add('galleryModalOpen');modal.setAttribute('aria-hidden','false');document.body.classList.add('modalOpen')}
function closeModal(){modal?.classList.remove('galleryModalOpen');modal?.setAttribute('aria-hidden','true');document.body.classList.remove('modalOpen')}
function move(amount){if(!visibleItems.length)return;currentIndex=(currentIndex+amount+visibleItems.length)%visibleItems.length;updateModal()}
async function load(){
 let items=[];
 if(client){const response=await client.rpc('get_public_gallery_items');if(!response.error&&Array.isArray(response.data))items=response.data}
 if(!items.length&&window.SOS?.K?.gallery)items=window.SOS.read(window.SOS.K.gallery,[])||[];
 if(items.length)render(items);
 else bindItems();
}
document.querySelectorAll('[data-gallery-filter]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-gallery-filter]').forEach(x=>x.classList.remove('active'));button.classList.add('active');filterGallery(button.dataset.galleryFilter)}));
closeButton?.addEventListener('click',closeModal);previousButton?.addEventListener('click',()=>move(-1));nextButton?.addEventListener('click',()=>move(1));modal?.addEventListener('click',event=>{if(event.target===modal)closeModal()});document.addEventListener('keydown',event=>{if(!modal?.classList.contains('galleryModalOpen'))return;if(event.key==='Escape')closeModal();if(event.key==='ArrowLeft')move(-1);if(event.key==='ArrowRight')move(1)});
async function boot(){await load();client?.channel('public-gallery-v416').on('postgres_changes',{event:'*',schema:'public',table:'public_gallery_items'},load).subscribe()}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();