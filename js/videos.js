(()=>{
"use strict";
const esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const videoKey=window.SOS?.K?.videos||"sos_videos_v1";
const customVideos=window.SOS?.read(videoKey,[])||[];
const grid=document.getElementById("adminVideoGrid");

function youtubeId(url){
  try{const u=new URL(url,location.href);if(u.hostname.includes("youtu.be"))return u.pathname.slice(1).split("/")[0];if(u.hostname.includes("youtube.com"))return u.searchParams.get("v")||u.pathname.split("/").filter(Boolean).pop()}catch{}return "";
}
function embedMarkup(item){
  const link=String(item.link||"").trim(),yt=youtubeId(link);
  if(yt)return `<iframe src="https://www.youtube.com/embed/${encodeURIComponent(yt)}?autoplay=1" title="${esc(item.title)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  if(/vimeo\.com/i.test(link)){const id=(link.match(/vimeo\.com\/(?:video\/)?(\d+)/)||[])[1];if(id)return `<iframe src="https://player.vimeo.com/video/${id}?autoplay=1" title="${esc(item.title)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`}
  if(/\.(mp4|webm|ogg)(\?.*)?$/i.test(link))return `<video src="${esc(link)}" controls autoplay playsinline></video>`;
  return `<div class="videoModalMessage"><p class="sectionEyebrow">External Video</p><h3>${esc(item.title)}</h3><p>This link cannot be embedded directly.</p><a class="primaryButton" href="${esc(link)}" target="_blank" rel="noopener">Open Video</a></div>`;
}
function renderCustom(){
  if(!grid)return;
  if(!customVideos.length){grid.hidden=true;return}
  grid.innerHTML=customVideos.slice().sort((a,b)=>(b.featured?1:0)-(a.featured?1:0)||new Date(b.created)-new Date(a.created)).map(v=>`<article class="releaseCard adminVideoCard" data-video-id="${esc(v.id)}" data-category="${esc(String(v.category||"all").toLowerCase())}"><button class="videoCardTrigger" type="button" aria-label="Play ${esc(v.title)}"><div class="releaseArtwork"><img src="${esc(v.thumbnail||"assets/images/featured-video-cover.jpg")}" alt="${esc(v.title)} thumbnail"><span class="videoCardPlay">▶</span>${v.featured?'<span class="videoFeaturedBadge">Featured</span>':''}</div><div class="releaseContent"><p class="sectionEyebrow">${esc(v.category||"Video")}</p><h3>${esc(v.title)}</h3><p>${esc(v.description||"")}</p><div class="releaseMeta"><span>Watch Video</span><span>${v.featured?"Featured":"New"}</span></div></div></button></article>`).join("");
}
renderCustom();

const buttons=[...document.querySelectorAll('.videoCategories .galleryFilter')];
function allCards(){return [...document.querySelectorAll('#videoLibrary .releaseCard')]}
function categoryFor(c){if(c.dataset.category)return c.dataset.category;const t=(c.querySelector('.sectionEyebrow')?.textContent||'').toLowerCase();if(t.includes('performance'))return'performances';if(t.includes('production'))return'studio';if(t.includes('behind'))return'behind the scenes';if(t.includes('short'))return'shorts';return'all'}
allCards().forEach(c=>c.dataset.category=categoryFor(c));
buttons.forEach(b=>b.addEventListener('click',()=>{buttons.forEach(x=>x.classList.remove('active'));b.classList.add('active');const f=b.textContent.trim().toLowerCase();allCards().forEach(c=>{c.hidden=f!=='all'&&c.dataset.category!==f})}));

const modal=document.createElement('div');modal.className='videoModal';modal.setAttribute('aria-hidden','true');modal.innerHTML='<div class="videoModalPanel" role="dialog" aria-modal="true"><button class="videoModalClose" aria-label="Close">×</button><div class="videoModalMedia"></div><div class="videoModalInfo"></div></div>';document.body.appendChild(modal);
const media=modal.querySelector('.videoModalMedia'),info=modal.querySelector('.videoModalInfo');
function openItem(item){media.innerHTML=embedMarkup(item);info.innerHTML=`<p class="sectionEyebrow">${esc(item.category||"Video")}</p><h3>${esc(item.title)}</h3><p>${esc(item.description||"")}</p>`;modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
function openPlaceholder(){media.innerHTML='<div class="videoModalMessage"><p class="sectionEyebrow">Video Preview</p><h3>Connect your video link here</h3><p>Use Admin → Video Manager to publish an embeddable video.</p></div>';info.innerHTML='';modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
function close(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.style.overflow='';setTimeout(()=>{media.innerHTML='';info.innerHTML=''},300)}
document.querySelector('.videoPlayButton')?.addEventListener('click',openPlaceholder);
document.querySelectorAll('.staticVideoGrid .releaseCard').forEach(c=>c.addEventListener('click',openPlaceholder));
grid?.addEventListener('click',e=>{const card=e.target.closest('[data-video-id]');if(!card)return;const item=customVideos.find(v=>v.id===card.dataset.videoId);if(item)openItem(item)});
modal.querySelector('.videoModalClose').addEventListener('click',close);modal.addEventListener('click',e=>{if(e.target===modal)close()});document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
})();