/* Seeker Of SoundZ v4.16.0 — Homepage Content Studio + Gallery publishing */
(()=>{
'use strict';
const client=window.SOS_SUPABASE?.client;
const panel=document.getElementById('adminPanel');
const menu=document.querySelector('.adminMenu');
if(!client||!panel||!menu)return;

const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const toast=(message,title='Homepage Studio')=>window.SOS?.toast?.(message,{title,icon:'⌂'});
const read=(key)=>window.SOS?.read?.(key,[])||[];
const keys=window.SOS?.K||{};
let events=[];
let saved={};

function addMenuButton(){
 if(menu.querySelector('[data-panel="homepage"]'))return;
 const overview=menu.querySelector('[data-panel="overview"]');
 const button=document.createElement('button');
 button.dataset.panel='homepage';
 button.textContent='Homepage Content';
 overview?.insertAdjacentElement('afterend',button);
}

function optionRows(items,label){
 return `<option value="">Use current homepage fallback</option>${items.map(item=>`<option value="${esc(item.id)}">${esc(label(item))}</option>`).join('')}`;
}
function selectedFor(slot){
 const source=saved?.[slot]?.data?.source_id;
 return source==null?'':String(source);
}
function selectValue(select,value){
 if(!select)return;
 const exists=[...select.options].some(option=>option.value===value);
 select.value=exists?value:'';
}
function musicItems(){return read(keys.music||'sos_music_v1')}
function videoItems(){return read(keys.videos||'sos_videos_v1')}
function galleryItems(){return read(keys.gallery||'sos_gallery_v1')}

async function loadSaved(){
 const response=await client.rpc('admin_get_homepage_content');
 if(response.error)throw response.error;
 saved=response.data&&typeof response.data==='object'?response.data:{};
}
async function loadEvents(){
 const response=await client.rpc('admin_event_dashboard');
 if(response.error){events=[];return}
 events=Array.isArray(response.data?.events)?response.data.events:[];
}
function slotCard(key,title,copy,selectHtml){
 const active=saved?.[key]?.active!==false;
 return `<article class="homepageSlotCardV416" data-home-slot="${key}">
  <header><div><p class="sectionEyebrow">${esc(key.replaceAll('_',' '))}</p><h3>${esc(title)}</h3></div><label class="homepageSlotToggleV416"><input type="checkbox" data-slot-active ${active?'checked':''}><span>Show</span></label></header>
  <p>${esc(copy)}</p>
  ${selectHtml}
  <div class="homepageSlotPreviewV416" data-slot-preview></div>
 </article>`;
}
function gallerySelector(key,title,index){
 return slotCard(key,title,'Choose one Gallery Manager image for this homepage position.',
 `<label>Gallery item<select data-slot-select data-source="gallery">${optionRows(galleryItems(),item=>item.title||'Untitled image')}</select></label>`);
}
function renderPreview(card){
 const select=card.querySelector('[data-slot-select]');
 const source=select?.dataset.source;
 const id=select?.value;
 const list=source==='video'?videoItems():source==='music'?musicItems():source==='event'?events:galleryItems();
 const item=list.find(entry=>String(entry.id)===String(id));
 const box=card.querySelector('[data-slot-preview]');
 if(!box)return;
 if(!item){box.innerHTML='<span>Current static homepage content remains active.</span>';return}
 const image=item.thumbnail||item.artwork||item.cover_image_url||item.image||item.media?.[0]?.image_url||'assets/images/sos-logo.png';
 box.innerHTML=`<img src="${esc(image)}" alt=""><div><strong>${esc(item.title||item.name||'Selected content')}</strong><small>${esc(item.category||item.genre||item.event_type||item.releaseType||source)}</small></div>`;
}
async function render(){
 panel.innerHTML='<div class="achievementLoadingV41330">Loading Homepage Content Studio…</div>';
 try{await Promise.all([loadSaved(),loadEvents()])}
 catch(error){panel.innerHTML=`<div class="emptyState">${esc(error.message)}</div>`;return}

 panel.innerHTML=`<div class="adminSectionHead"><div><p class="sectionEyebrow">Homepage CMS</p><h2>Homepage Content Studio</h2></div><span class="statusPill">Supabase Live</span></div>
 <p class="adminLead">Assign content already created in Video Manager, Music Manager, Events Manager, and Gallery Manager to the existing homepage sections. The homepage design remains unchanged.</p>
 <form id="homepageContentFormV416" class="homepageStudioGridV416">
  ${slotCard('featured_video','Featured Video','Embeds YouTube, Vimeo, uploaded MP4, WEBM, or OGG video in the current Featured Video section.',
   `<label>Video<select data-slot-select data-source="video">${optionRows(videoItems(),item=>`${item.title||'Untitled'}${item.featured?' — Featured':''}`)}</select></label>`)}
  ${slotCard('featured_music','Featured Music','Places one Music Manager release in the current Featured Music card with playable preview audio.',
   `<label>Music release<select data-slot-select data-source="music">${optionRows(musicItems(),item=>`${item.title||'Untitled'} — ${item.artist||'Seeker Of SoundZ'}`)}</select></label>`)}
  ${slotCard('featured_event','Featured Event','Places one published Supabase event into the current Upcoming Events feature.',
   `<label>Event<select data-slot-select data-source="event">${optionRows(events,item=>`${item.title||'Untitled'} — ${new Date(item.starts_at).toLocaleDateString()}`)}</select></label>`)}
  ${Array.from({length:8},(_,index)=>gallerySelector(`gallery_feature_${index+1}`,`Gallery Highlight ${index+1}`,index+1)).join('')}
  <section class="homepageStudioActionsV416">
   <button class="primaryButton" type="submit">Publish Homepage Assignments</button>
   <button class="secondaryButton" type="button" data-sync-public-gallery>Sync Gallery Manager to Gallery Page</button>
   <small>Publishing copies a safe content snapshot to Supabase so visitors receive the same homepage on every device.</small>
  </section>
 </form>`;

 panel.querySelectorAll('[data-home-slot]').forEach(card=>{
  selectValue(card.querySelector('[data-slot-select]'),selectedFor(card.dataset.homeSlot));
  renderPreview(card);
  card.querySelector('[data-slot-select]')?.addEventListener('change',()=>renderPreview(card));
 });
}

function snapshot(source,id){
 const list=source==='video'?videoItems():source==='music'?musicItems():source==='event'?events:galleryItems();
 const item=list.find(entry=>String(entry.id)===String(id));
 if(!item)return {};
 if(source==='video')return {
  source_id:item.id,title:item.title||'',category:item.category||'Video',description:item.description||'',
  link:item.link||'',thumbnail:item.thumbnail||'',featured:!!item.featured
 };
 if(source==='music')return {
  source_id:item.id,title:item.title||'',artist:item.artist||'Seeker Of SoundZ',genre:item.genre||'Music',
  release_type:item.releaseType||'Single',tags:item.tags||[],description:item.description||'',
  artwork:item.artwork||'',preview:item.preview||'',full:item.full||'',purchase_url:item.purchaseUrl||'',
  release_date:item.releaseDate||'',featured:!!item.featured
 };
 if(source==='event')return {
  source_id:item.id,title:item.title||'',event_type:item.event_type||'Event',description:item.description||'',
  starts_at:item.starts_at,ends_at:item.ends_at,venue:item.venue||'',location:item.location||'',
  cover_image_url:item.cover_image_url||item.media?.[0]?.image_url||'',ticket_url:item.ticket_url||'',
  details_url:item.details_url||item.online_url||'',is_featured:!!item.is_featured
 };
 return {
  source_id:item.id,title:item.title||'',category:item.category||'other',description:item.description||'',
  credit:item.credit||'',layout:item.layout||'standard',image:item.image||''
 };
}
async function saveHomepage(form){
 const cards=[...form.querySelectorAll('[data-home-slot]')];
 for(const card of cards){
  const select=card.querySelector('[data-slot-select]');
  const response=await client.rpc('admin_save_homepage_slot',{
   p_slot_key:card.dataset.homeSlot,
   p_content_type:select.dataset.source,
   p_content_data:snapshot(select.dataset.source,select.value),
   p_is_active:card.querySelector('[data-slot-active]').checked
  });
  if(response.error)throw response.error;
 }
 toast('Homepage assignments were published to Supabase.');
 await render();
}

async function assignGallery(itemId,position){
 const number=Math.max(1,Math.min(8,Number(position)||1));
 const items=galleryItems();
 const item=items.find(entry=>String(entry.id)===String(itemId));
 if(!item)throw new Error('Gallery item was not found.');
 items.forEach(entry=>{if(Number(entry.homepagePosition)===number)entry.homepagePosition=null});
 item.homepagePosition=number;
 window.SOS?.write?.(keys.gallery||'sos_gallery_v1',items);
 const response=await client.rpc('admin_save_homepage_slot',{
  p_slot_key:`gallery_feature_${number}`,
  p_content_type:'gallery',
  p_content_data:snapshot('gallery',item.id),
  p_is_active:true
 });
 if(response.error)throw response.error;
 await syncGallery(false);
 toast(`${item.title||'Gallery image'} was assigned to homepage position ${number}.`,'Gallery Manager');
 return item;
}
async function assignMusic(itemId){
 const item=musicItems().find(entry=>String(entry.id)===String(itemId));
 if(!item)throw new Error('Featured music release was not found.');
 const response=await client.rpc('admin_save_homepage_slot',{
  p_slot_key:'featured_music',
  p_content_type:'music',
  p_content_data:snapshot('music',item.id),
  p_is_active:true
 });
 if(response.error)throw response.error;
 toast(`${item.title||'Music release'} is now Featured Music on the homepage.`,'Music Manager');
 return item;
}
async function syncGallery(showToast=true){
 const items=galleryItems().map((item,index)=>({...item,sort_order:index,is_published:true}));
 const response=await client.rpc('admin_replace_gallery_items',{p_items:items});
 if(response.error)throw response.error;
 if(showToast)toast(`${Number(response.data||0)} gallery item${Number(response.data||0)===1?'':'s'} synchronized.`,'Gallery Manager');
 return response.data;
}

menu.addEventListener('click',event=>{
 const button=event.target.closest('[data-panel="homepage"]');
 if(!button)return;
 event.preventDefault();event.stopImmediatePropagation();
 menu.querySelectorAll('[data-panel]').forEach(item=>item.classList.toggle('active',item===button));
 render();
},true);

panel.addEventListener('submit',async event=>{
 if(event.target.id!=='homepageContentFormV416')return;
 event.preventDefault();
 const button=event.target.querySelector('[type="submit"]');button.disabled=true;
 try{await saveHomepage(event.target)}
 catch(error){toast(error.message,'Homepage publish failed');button.disabled=false}
});
panel.addEventListener('click',async event=>{
 const push=event.target.closest('[data-push-gallery-home]');
 if(push){
  const select=panel.querySelector(`[data-gallery-home-position="${push.dataset.pushGalleryHome}"]`);
  const position=Number(select?.value||0);
  if(!position)return toast('Choose a homepage position before publishing.','Gallery Manager');
  push.disabled=true;
  try{await assignGallery(push.dataset.pushGalleryHome,position);setTimeout(()=>window.SOSHomepageAdmin?.renderCurrentGallery?.(),120)}
  catch(error){toast(error.message,'Gallery homepage publish failed')}
  finally{push.disabled=false}
  return;
 }
 const sync=event.target.closest('[data-sync-public-gallery]');
 if(!sync)return;
 sync.disabled=true;
 try{await syncGallery(true)}catch(error){toast(error.message,'Gallery synchronization failed')}
 finally{sync.disabled=false}
});


document.addEventListener('click',async event=>{
 const push=event.target.closest('[data-push-gallery-home]');
 if(!push)return;
 event.preventDefault();
 event.stopPropagation();
 const select=document.querySelector(`[data-gallery-home-position="${push.dataset.pushGalleryHome}"]`);
 const position=Number(select?.value||0);
 if(!position)return toast('Choose a homepage position before publishing.','Gallery Manager');
 push.disabled=true;
 try{
  await assignGallery(push.dataset.pushGalleryHome,position);
  push.textContent=`Update Position ${position}`;
 }catch(error){
  toast(error.message,'Gallery homepage publish failed');
 }finally{
  push.disabled=false;
 }
},true);

// Keep the public Gallery page synchronized whenever Gallery Manager saves or deletes.
document.addEventListener('submit',event=>{
 if(event.target.id==='galleryForm')setTimeout(()=>syncGallery(false).catch(console.warn),150);
});
document.addEventListener('click',event=>{
 if(event.target.closest('[data-delete-gallery]'))setTimeout(()=>syncGallery(false).catch(console.warn),180);
});

addMenuButton();
window.SOSHomepageAdmin={render,syncGallery,assignGallery,assignMusic};
})();