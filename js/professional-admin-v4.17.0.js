/* Seeker Of SoundZ v4.17.0 — Professional Studio Admin Systems */
(()=>{
'use strict';
const client=window.SOS_SUPABASE?.client, panel=document.getElementById('adminPanel'), menu=document.querySelector('.adminMenu');
if(!client||!panel||!menu)return;
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const toast=(m,t='Admin Studio')=>window.SOS?.toast?.(m,{title:t,icon:'✦'});
const key='sos_producer_resources_v3';
const musicCategories=['Synthesizer','Sampler','Drum Machine','Reverb','Delay','Distortion','Saturation','Compression','EQ','Limiter','Mastering','Vocal Processing','Pitch Correction','Metering','Stereo Imaging','MIDI Tool','Sequencer','Arpeggiator','DAW Utility','DJ Tool','Live Performance','Sample Pack','Drum Kit','Preset Pack','MIDI Pack','Template','Project File','Open Source Audio'];
let active='';

function addButtons(){
 const settings=menu.querySelector('[data-panel="settings"]');
 const defs=[
  ['contactInbox','Contact Inbox'],
  ['pluginsStudio','Producer Plugins'],
  ['resourcesStudio','Producer Resources'],
  ['mediaLibrary','Media Library']
 ];
 defs.forEach(([id,label])=>{
  if(menu.querySelector(`[data-panel="${id}"]`))return;
  const b=document.createElement('button');b.dataset.panel=id;b.textContent=label;settings?.before(b);
 });
}
function localResources(){try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return[]}}
function writeResources(items){localStorage.setItem(key,JSON.stringify(items))}
function thumb(item){return item.thumbnail_url||item.thumbnail||item.image||`https://placehold.co/640x360/17101f/c9a7ff?text=${encodeURIComponent(item.name||'Audio Tool')}`}
function resourceCard(item){
 return `<article class="professionalResourceCardV417">
  <img src="${esc(thumb(item))}" alt="${esc(item.name)} thumbnail" loading="lazy">
  <div><p class="sectionEyebrow">${esc(item.category||item.type||'Audio Resource')}</p><h3>${esc(item.name)}</h3>
  <p>${esc(item.description||'Music production resource for producers and DJs.')}</p>
  <div class="resourceBadgeRowV417"><span>${esc(item.vendor||'Community')}</span><span>${esc(item.price||item.price_type||'Free')}</span>${(item.formats||[]).map(x=>`<span>${esc(x)}</span>`).join('')}</div>
  <div class="adminItemActions"><button class="smallAction" data-edit-pro-resource="${esc(item.id)}">Edit</button><button class="smallAction dangerAction" data-delete-pro-resource="${esc(item.id)}">Delete</button></div></div>
 </article>`;
}
function resourceForm(item={}){
 return `<form id="professionalResourceFormV417" class="appForm adminEditor">
  <input type="hidden" name="id" value="${esc(item.id||'')}">
  <div class="formRow"><label>Name<input name="name" required value="${esc(item.name||'')}"></label><label>Developer / Vendor<input name="vendor" value="${esc(item.vendor||'')}"></label></div>
  <div class="formRow"><label>Resource type<select name="type">${['Plugin','Sample Pack','Preset Pack','Drum Kit','MIDI Pack','Template','Project File','DAW Utility','DJ Tool'].map(x=>`<option ${item.type===x?'selected':''}>${x}</option>`).join('')}</select></label>
  <label>Music category<select name="category">${musicCategories.map(x=>`<option ${item.category===x?'selected':''}>${x}</option>`).join('')}</select></label></div>
  <div class="formRow"><label>Price / License<select name="price">${['Free','Donationware','Freemium','Commercial','Open Source'].map(x=>`<option ${item.price===x?'selected':''}>${x}</option>`).join('')}</select></label><label>Version<input name="version" value="${esc(item.version||'')}"></label></div>
  <label>Description<textarea name="description">${esc(item.description||'')}</textarea></label>
  <div class="formRow"><label>Thumbnail URL<input name="thumbnail" value="${esc(item.thumbnail||item.thumbnail_url||'')}"></label><label>Website / Download URL<input name="url" value="${esc(item.url||item.website_url||'')}"></label></div>
  <div class="formRow"><label>Formats<input name="formats" value="${esc((item.formats||[]).join(', '))}" placeholder="VST3, AU, AAX"></label><label>Tags<input name="tags" value="${esc((item.tags||[]).join(', '))}" placeholder="free, synth, edm"></label></div>
  <div class="catalogStatusGrid"><label class="catalogStatusToggle"><input type="checkbox" name="featured" ${item.featured?'checked':''}><span><i>✦</i><strong>Featured</strong><small>Highlight this for producers.</small></span></label><label class="catalogStatusToggle"><input type="checkbox" name="published" ${item.is_published!==false?'checked':''}><span><i>✓</i><strong>Published</strong><small>Show this in the public Plugin Library.</small></span></label></div>
  <div class="adminItemActions"><button class="primaryButton" type="submit">${item.id?'Save Changes':'Add Resource'}</button><button class="secondaryButton" type="button" data-new-pro-resource>Clear Editor</button></div>
 </form>`;
}
function renderResources(editId='',pluginsOnly=false){
 const items=localResources().filter(x=>pluginsOnly?String(x.type).toLowerCase()==='plugin':String(x.type).toLowerCase()!=='plugin');
 const edit=localResources().find(x=>x.id===editId)||{};
 panel.innerHTML=`<div class="adminSectionHead"><div><p class="sectionEyebrow">Music Production CMS</p><h2>${pluginsOnly?'Producer Plugin Library':'Producer Resources'}</h2></div><span class="statusPill">${items.length} items</span></div>
 <p class="adminLead">${pluginsOnly?'Strictly music-production plugins for EDM producers, DJs, mixing, mastering, vocals, MIDI and live performance.':'Edit the existing sample packs, presets, drum kits, templates, project files and producer downloads already on the site.'}</p>
 ${resourceForm(edit)}<div class="professionalResourceGridV417">${items.map(resourceCard).join('')||'<div class="emptyState">No resources in this section yet.</div>'}</div>`;
}
async function renderInbox(){
 panel.innerHTML='<div class="achievementLoadingV41330">Loading Contact Inbox…</div>';
 const q=await client.rpc('admin_contact_inbox');
 if(q.error){panel.innerHTML=`<div class="emptyState">${esc(q.error.message)}</div>`;return}
 const messages=q.data?.messages||[],requests=q.data?.requests||[];
 panel.innerHTML=`<div class="adminSectionHead"><div><p class="sectionEyebrow">Supabase Messages</p><h2>Contact Inbox</h2></div><span class="statusPill">${messages.filter(x=>x.status==='new').length} unread</span></div>
 <div class="professionalInboxGridV417">${messages.map(m=>`<article class="inboxCardV417 ${m.status==='new'?'isUnread':''}"><header><div><p class="sectionEyebrow">${esc(m.message_type)}</p><h3>${esc(m.subject)}</h3></div><span>${new Date(m.created_at).toLocaleString()}</span></header><strong>${esc(m.sender_name)} • ${esc(m.sender_email)}</strong><p>${esc(m.message)}</p>${m.wants_collaboration?'<div class="collabRequestFlagV417">Collaboration Studio requested</div>':''}<div class="formRow"><label>Status<select data-message-status="${m.id}">${['new','in_progress','replied','closed'].map(x=>`<option value="${x}" ${m.status===x?'selected':''}>${x.replace('_',' ')}</option>`).join('')}</select></label><label>Priority<select data-message-priority="${m.id}">${['low','normal','high','urgent'].map(x=>`<option ${m.priority===x?'selected':''}>${x}</option>`).join('')}</select></label></div><label>Admin note<textarea data-message-note="${m.id}">${esc(m.admin_note||'')}</textarea></label><button class="smallAction" data-save-contact="${m.id}">Save Message</button></article>`).join('')||'<div class="emptyState">No contact messages yet.</div>'}</div>
 <div class="adminSectionHead"><div><p class="sectionEyebrow">Access Requests</p><h2>Collaboration Requests</h2></div></div>
 <div class="professionalResourceGridV417">${requests.map(r=>`<article class="inboxCardV417"><h3>${esc(r.sender_name)}</h3><p>${esc(r.sender_email)}</p><p>${esc(r.message)}</p><div class="adminItemActions"><button class="smallAction" data-review-collab="${r.id}" data-status="approved">Approve</button><button class="smallAction dangerAction" data-review-collab="${r.id}" data-status="declined">Decline</button><span class="statusPill">${esc(r.status)}</span></div></article>`).join('')||'<div class="emptyState">No collaboration requests.</div>'}</div>`;
}
async function renderMedia(){
 const {data,error}=await client.from('media_library').select('*').order('created_at',{ascending:false});
 if(error){panel.innerHTML=`<div class="emptyState">${esc(error.message)}</div>`;return}
 panel.innerHTML=`<div class="adminSectionHead"><div><p class="sectionEyebrow">Reusable Assets</p><h2>Global Media Library</h2></div><span class="statusPill">${data.length} assets</span></div>
 <p class="adminLead">Register existing artwork, logos, event photos, merch images, plugin thumbnails, gallery media and producer-resource covers once, then reuse their public URL throughout the site.</p>
 <form id="mediaLibraryFormV417" class="appForm adminEditor"><div class="formRow"><label>Asset name<input name="name" required></label><label>Category<select name="category">${['Artwork','Logos','Events','Merch','Plugins','Gallery','Producer Resources','Videos','Other'].map(x=>`<option>${x}</option>`).join('')}</select></label></div><div class="formRow"><label>Public URL<input name="url" required></label><label>Tags<input name="tags" placeholder="artwork, album, purple"></label></div><label>Alternative text<input name="alt"></label><button class="primaryButton">Add to Media Library</button></form>
 <div class="mediaLibraryGridV417">${data.map(x=>`<article><img src="${esc(x.public_url)}" alt="${esc(x.alt_text||x.name)}"><div><p class="sectionEyebrow">${esc(x.category)}</p><h3>${esc(x.name)}</h3><small>${esc((x.tags||[]).join(' • '))}</small><div class="adminItemActions"><button class="smallAction" data-copy-media="${esc(x.public_url)}">Copy URL</button><button class="smallAction dangerAction" data-delete-media="${x.id}">Delete</button></div></div></article>`).join('')||'<div class="emptyState">No reusable media yet.</div>'}</div>`;
}
function enhanceMerch(){
 if(active!=='catalog')return;
 const items=window.SOS?.read?.(window.SOS.K.catalog,[])||[];
 if(panel.querySelector('.publishedMerchV417'))return;
 const section=document.createElement('section');section.className='publishedMerchV417 adminEditor';
 section.innerHTML=`<div class="adminSectionHead"><div><p class="sectionEyebrow">Storefront Inventory</p><h2>Published Merchandise</h2></div><span class="statusPill">${items.length} products</span></div><p class="adminLead">These are the exact products currently supplied to the Merch page. Use Edit to load an existing product back into the editor above.</p><div class="professionalResourceGridV417">${items.map(x=>`<article class="professionalResourceCardV417"><img src="${esc(x.image||'assets/images/sos-logo.png')}" alt=""><div><p class="sectionEyebrow">${esc(x.type||'Merch')}</p><h3>${esc(x.name)}</h3><p>${esc(x.description||'')}</p><div class="resourceBadgeRowV417"><span>$${Number(x.price||0).toFixed(2)}</span>${x.featured?'<span>Featured</span>':''}${x.limited?'<span>Limited</span>':''}${x.membersOnly?'<span>Members Only</span>':''}</div><button class="smallAction" data-edit-item="${esc(x.id)}">Edit Product</button></div></article>`).join('')}</div>`;
 panel.appendChild(section);
}
menu.addEventListener('click',e=>{
 const b=e.target.closest('[data-panel]');if(!b)return;
 active=b.dataset.panel;
 if(['contactInbox','pluginsStudio','resourcesStudio','mediaLibrary'].includes(active)){
  e.preventDefault();e.stopImmediatePropagation();menu.querySelectorAll('[data-panel]').forEach(x=>x.classList.toggle('active',x===b));
  if(active==='contactInbox')renderInbox();
  if(active==='pluginsStudio')renderResources('',true);
  if(active==='resourcesStudio')renderResources('',false);
  if(active==='mediaLibrary')renderMedia();
 }else if(active==='catalog')setTimeout(enhanceMerch,180);
},true);
panel.addEventListener('submit',async e=>{
 if(e.target.id==='professionalResourceFormV417'){
  e.preventDefault();const f=new FormData(e.target),items=localResources(),id=f.get('id')||crypto.randomUUID(),old=items.find(x=>x.id===id);
  const record={...old,id,name:f.get('name').trim(),vendor:f.get('vendor').trim(),type:f.get('type'),category:f.get('category'),price:f.get('price'),version:f.get('version').trim(),description:f.get('description').trim(),thumbnail:f.get('thumbnail').trim(),url:f.get('url').trim(),formats:String(f.get('formats')).split(',').map(x=>x.trim()).filter(Boolean),tags:String(f.get('tags')).split(',').map(x=>x.trim()).filter(Boolean),featured:f.has('featured'),is_published:f.has('published'),updated:new Date().toISOString()};
  const index=items.findIndex(x=>x.id===id);if(index>=0)items[index]=record;else items.push(record);writeResources(items);
  await client.from('producer_resources').upsert({id,name:record.name,vendor:record.vendor,resource_type:record.type,category:record.category,ecosystem:record.ecosystem||'Universal',price_type:record.price,version:record.version,formats:record.formats,tags:record.tags,description:record.description,thumbnail_url:record.thumbnail||null,website_url:record.url||null,featured:record.featured,is_published:record.is_published,updated_at:new Date().toISOString()});
  toast('Producer resource saved.');renderResources('',active==='pluginsStudio');
 }
 if(e.target.id==='mediaLibraryFormV417'){
  e.preventDefault();const f=new FormData(e.target),url=f.get('url').trim();
  const row={name:f.get('name').trim(),media_type:/\.(mp4|webm|ogg)$/i.test(url)?'video':/\.(mp3|wav|flac|ogg)$/i.test(url)?'audio':'image',category:f.get('category'),public_url:url,tags:String(f.get('tags')).split(',').map(x=>x.trim()).filter(Boolean),alt_text:f.get('alt').trim()};
  const q=await client.from('media_library').insert(row);if(q.error)return toast(q.error.message,'Media Library');toast('Asset added.','Media Library');renderMedia();
 }
});
panel.addEventListener('click',async e=>{
 let b=e.target.closest('[data-edit-pro-resource]');if(b)return renderResources(b.dataset.editProResource,active==='pluginsStudio');
 b=e.target.closest('[data-new-pro-resource]');if(b)return renderResources('',active==='pluginsStudio');
 b=e.target.closest('[data-delete-pro-resource]');if(b){const items=localResources().filter(x=>x.id!==b.dataset.deleteProResource);writeResources(items);await client.from('producer_resources').delete().eq('id',b.dataset.deleteProResource);return renderResources('',active==='pluginsStudio')}
 b=e.target.closest('[data-save-contact]');if(b){const id=b.dataset.saveContact,q=await client.rpc('admin_update_contact_message',{p_id:id,p_status:panel.querySelector(`[data-message-status="${id}"]`).value,p_priority:panel.querySelector(`[data-message-priority="${id}"]`).value,p_admin_note:panel.querySelector(`[data-message-note="${id}"]`).value});if(q.error)return toast(q.error.message,'Inbox');toast('Message updated.','Inbox');return renderInbox()}
 b=e.target.closest('[data-review-collab]');if(b){const q=await client.rpc('admin_review_collaboration_request',{p_id:b.dataset.reviewCollab,p_status:b.dataset.status});if(q.error)return toast(q.error.message,'Collaboration');toast(`Request ${b.dataset.status}.`,'Collaboration');return renderInbox()}
 b=e.target.closest('[data-copy-media]');if(b){await navigator.clipboard.writeText(b.dataset.copyMedia);return toast('Media URL copied.','Media Library')}
 b=e.target.closest('[data-delete-media]');if(b){await client.from('media_library').delete().eq('id',b.dataset.deleteMedia);return renderMedia()}
});
addButtons();
})();