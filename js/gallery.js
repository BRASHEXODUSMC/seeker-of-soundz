(()=>{
"use strict";
const esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const grid=document.querySelector(".fullGalleryGrid");
const stored=(window.SOS&&SOS.K.gallery)?SOS.read(SOS.K.gallery,[]):[];
if(grid&&stored.length){
  grid.innerHTML=stored.slice().reverse().map(item=>{
    const layout=item.layout==="tall"?" fullGalleryTall":item.layout==="wide"?" fullGalleryWide":"";
    return `<button class="fullGalleryItem${layout}" type="button" data-gallery-category="${esc(item.category||'other')}" data-gallery-image="${esc(item.image)}" data-gallery-title="${esc(item.title)}" data-gallery-description="${esc(item.description||'')}" data-gallery-credit="${esc(item.credit||'')}" aria-label="Open ${esc(item.title)} image"><img src="${esc(item.image)}" alt="${esc(item.title)}" loading="lazy"><span class="fullGalleryOverlay"><small>${esc((item.category||'other').replace('-', ' '))}</small><strong>${esc(item.title)}</strong>${item.description?`<em>${esc(item.description)}</em>`:''}</span></button>`
  }).join("");
}
const filterButtons=document.querySelectorAll("[data-gallery-filter]");
const galleryItems=Array.from(document.querySelectorAll(".fullGalleryItem"));
const modal=document.getElementById("galleryModal"),modalImage=document.getElementById("galleryModalImage"),modalTitle=document.getElementById("galleryModalTitle"),closeButton=document.getElementById("galleryModalClose"),previousButton=document.getElementById("galleryModalPrevious"),nextButton=document.getElementById("galleryModalNext");
let modalDescription=document.getElementById("galleryModalDescription");
if(modalTitle&&!modalDescription){modalDescription=document.createElement("p");modalDescription.id="galleryModalDescription";modalDescription.className="galleryModalDescription";modalTitle.insertAdjacentElement("afterend",modalDescription)}
let visibleItems=[...galleryItems],currentIndex=0;
function filterGallery(category){visibleItems=[];galleryItems.forEach(item=>{const show=category==="all"||item.dataset.galleryCategory===category;item.classList.toggle("galleryItemHidden",!show);if(show)visibleItems.push(item)})}
filterButtons.forEach(button=>button.addEventListener("click",()=>{filterButtons.forEach(x=>x.classList.remove("active"));button.classList.add("active");filterGallery(button.dataset.galleryFilter)}));
function updateModal(){const item=visibleItems[currentIndex];if(!item)return;modalImage.src=item.dataset.galleryImage;modalImage.alt=item.dataset.galleryTitle;modalTitle.textContent=item.dataset.galleryTitle;const parts=[item.dataset.galleryDescription,item.dataset.galleryCredit?`Photo credit: ${item.dataset.galleryCredit}`:""] .filter(Boolean);if(modalDescription)modalDescription.textContent=parts.join(" • ")}
function openModal(item){if(!modal||!modalImage||!modalTitle)return;currentIndex=visibleItems.indexOf(item);updateModal();modal.classList.add("galleryModalOpen");modal.setAttribute("aria-hidden","false");document.body.classList.add("modalOpen")}
function closeModal(){if(!modal)return;modal.classList.remove("galleryModalOpen");modal.setAttribute("aria-hidden","true");document.body.classList.remove("modalOpen")}
function move(n){if(!visibleItems.length)return;currentIndex=(currentIndex+n+visibleItems.length)%visibleItems.length;updateModal()}
galleryItems.forEach(item=>item.addEventListener("click",()=>openModal(item)));closeButton?.addEventListener("click",closeModal);previousButton?.addEventListener("click",()=>move(-1));nextButton?.addEventListener("click",()=>move(1));modal?.addEventListener("click",e=>{if(e.target===modal)closeModal()});document.addEventListener("keydown",e=>{if(!modal?.classList.contains("galleryModalOpen"))return;if(e.key==="Escape")closeModal();if(e.key==="ArrowLeft")move(-1);if(e.key==="ArrowRight")move(1)});
})();
