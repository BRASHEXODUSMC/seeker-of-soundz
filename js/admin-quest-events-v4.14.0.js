/* Seeker Of SoundZ v4.14.0 — Quest & Events Administration Studio */
(()=>{
'use strict';
const client=window.SOS_SUPABASE?.client;if(!client)return;
const panel=document.getElementById('adminPanel'),menu=document.querySelector('.adminMenu');if(!panel||!menu)return;
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const toast=(m,t='Admin Studio')=>window.SOS?.toast?.(m,{title:t,icon:'✦'});
let quests=[],events=[],editingQuest=null,editingEvent=null;

function dt(value){if(!value)return'';const d=new Date(value);d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16)}
function slug(v){return String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function addQuestMenu(){
 if(menu.querySelector('[data-panel="quests"]'))return;
 const eventsButton=menu.querySelector('[data-panel="events"]');
 const b=document.createElement('button');b.dataset.panel='quests';b.textContent='Quest & Progression Studio';
 eventsButton?.before(b);
 document.getElementById('questManagement')?.remove();
}
async function loadQuests(){
 const q=await client.rpc('admin_get_quests');if(q.error)throw q.error;
 quests=Array.isArray(q.data)?q.data:[];
}
function questForm(q={}){
 const metrics=[
 ['forum_topics','Forum topics'],['forum_replies','Forum replies'],['forum_reactions','Forum reactions'],
 ['forum_activity','Topics + replies'],['collaboration_messages','Collaboration messages'],['profile_visits','Profile visits']
 ];
 return `<form class="appForm adminEditor questStudioFormV414" id="questStudioForm">
 <input type="hidden" name="originalCode" value="${esc(q.code||'')}">
 <div class="formRow"><label>Quest name<input name="name" required value="${esc(q.name||'')}"></label><label>Quest code<input name="code" required value="${esc(q.code||'')}" placeholder="daily_reply"></label></div>
 <label>Description<textarea name="description" required>${esc(q.description||'')}</textarea></label>
 <div class="formRow"><label>Quest type<select name="questType">${['daily','weekly','community','seasonal'].map(x=>`<option ${q.quest_type===x?'selected':''}>${x}</option>`).join('')}</select></label>
 <label>Progress metric<select name="metric">${metrics.map(([v,l])=>`<option value="${v}" ${q.metric===v?'selected':''}>${l}</option>`).join('')}</select></label></div>
 <div class="formRow"><label>Target amount<input name="target" type="number" min="1" value="${Number(q.target||1)}"></label><label>XP reward<input name="xpReward" type="number" min="0" value="${Number(q.xp_reward||25)}"></label></div>
 <div class="formRow"><label>Icon<input name="icon" value="${esc(q.icon||'⚡')}" maxlength="8"></label><label>Rarity<select name="rarity">${['common','uncommon','rare','epic','legendary','mythic'].map(x=>`<option ${q.rarity===x?'selected':''}>${x}</option>`).join('')}</select></label></div>
 <div class="formRow"><label>Profile title reward<input name="titleReward" value="${esc(q.title_reward||'')}"></label><label>Achievement code reward<input name="achievementCode" value="${esc(q.achievement_code||'')}"></label></div>
 <div class="formRow"><label>Starts at<input name="startsAt" type="datetime-local" value="${dt(q.starts_at)}"></label><label>Ends at<input name="endsAt" type="datetime-local" value="${dt(q.ends_at)}"></label></div>
 <div class="formRow"><label>Display order<input name="sortOrder" type="number" value="${Number(q.sort_order||0)}"></label><label class="checkLabel"><input name="active" type="checkbox" ${q.is_active!==false?'checked':''}> Quest is active</label></div>
 <label class="checkLabel"><input name="notify" type="checkbox" ${q.notify_on_publish!==false?'checked':''}> Send a toast/notification to members when published</label>
 <div class="adminItemActions"><button class="primaryButton" type="submit">${q.code?'Save Quest':'Create Quest'}</button>${q.code?'<button class="secondaryButton" type="button" data-cancel-quest>Edit New Quest</button>':''}</div>
 </form>`;
}
function questCards(){
 return quests.length?quests.map(q=>`<article class="questAdminCardV414 rarity-${esc(q.rarity||'common')}">
 <header><span>${esc(q.icon||'⚡')}</span><div><p class="sectionEyebrow">${esc(q.quest_type)} • ${esc(q.rarity||'common')}</p><h3>${esc(q.name)}</h3></div><i class="${q.is_active?'isActive':'isInactive'}">${q.is_active?'ACTIVE':'HIDDEN'}</i></header>
 <p>${esc(q.description)}</p><div class="questAdminMetaV414"><span>${esc(q.metric)}</span><span>Target ${q.target}</span><span>${q.xp_reward} XP</span></div>
 <div class="adminItemActions"><button class="smallAction" data-edit-quest="${esc(q.code)}">Edit</button><button class="smallAction" data-toggle-quest="${esc(q.code)}">${q.is_active?'Disable':'Enable'}</button><button class="smallAction dangerAction" data-delete-quest="${esc(q.code)}">Delete</button></div>
 </article>`).join(''):'<div class="emptyState">No quests are configured yet.</div>';
}
async function renderQuests(){
 panel.innerHTML='<div class="achievementLoadingV41330">Loading Quest Studio…</div>';
 try{await loadQuests()}catch(e){panel.innerHTML=`<div class="emptyState">${esc(e.message)}</div>`;return}
 const q=editingQuest?quests.find(x=>x.code===editingQuest)||{}:{};
 panel.innerHTML=`<div class="adminSectionHead"><div><p class="sectionEyebrow">Progression CMS</p><h2>Quest & Progression Studio</h2></div><span class="statusPill">${quests.filter(x=>x.is_active).length} active</span></div>
 <p class="adminLead">Create highly customizable daily, weekly, community, and seasonal quests. Changes synchronize to the Members progression center through Supabase.</p>
 ${questForm(q)}<div class="adminQuestGridV414">${questCards()}</div>`;
}
async function saveQuest(form){
 const f=new FormData(form),args={
 p_original_code:f.get('originalCode')||null,p_code:f.get('code'),p_name:f.get('name'),p_description:f.get('description'),
 p_quest_type:f.get('questType'),p_metric:f.get('metric'),p_target:Number(f.get('target')),p_xp_reward:Number(f.get('xpReward')),
 p_title_reward:f.get('titleReward')||null,p_achievement_code:f.get('achievementCode')||null,
 p_starts_at:f.get('startsAt')?new Date(f.get('startsAt')).toISOString():null,p_ends_at:f.get('endsAt')?new Date(f.get('endsAt')).toISOString():null,
 p_is_active:f.has('active'),p_icon:f.get('icon')||'⚡',p_rarity:f.get('rarity'),p_sort_order:Number(f.get('sortOrder')||0),
 p_notify_on_publish:f.has('notify')
 };
 const r=await client.rpc('admin_save_quest',args);if(r.error)throw r.error;
 editingQuest=null;toast('Quest saved and synchronized.','Quest Studio');await renderQuests();
}

async function loadEvents(){
 const r=await client.rpc('admin_event_dashboard');if(r.error)throw r.error;
 events=Array.isArray(r.data?.events)?r.data.events:[];
}
function eventForm(e={}){
 return `<form class="appForm adminEditor eventStudioFormV414" id="eventStudioForm">
 <input type="hidden" name="id" value="${esc(e.id||'')}">
 <div class="formRow"><label>Event title<input name="title" required value="${esc(e.title||'')}"></label><label>Event type<select name="eventType">${['Live Show','Festival','Livestream','Release Event','Meet & Greet','Appearance','Community Event'].map(x=>`<option ${e.event_type===x?'selected':''}>${x}</option>`).join('')}</select></label></div>
 <label>Description<textarea name="description">${esc(e.description||'')}</textarea></label>
 <div class="formRow"><label>Starts at<input name="startsAt" type="datetime-local" required value="${dt(e.starts_at)}"></label><label>Ends at<input name="endsAt" type="datetime-local" value="${dt(e.ends_at)}"></label></div>
 <div class="formRow"><label>Venue / platform<input name="venue" value="${esc(e.venue||'')}"></label><label>City / location<input name="location" value="${esc(e.location||'')}"></label></div>
 <div class="formRow"><label>Online link<input name="onlineUrl" value="${esc(e.online_url||'')}"></label><label>Tickets link<input name="ticketUrl" value="${esc(e.ticket_url||'')}"></label></div>
 <div class="formRow"><label>Details link<input name="detailsUrl" value="${esc(e.details_url||'')}"></label><label>Visibility<select name="visibility">${['public','members','private'].map(x=>`<option ${e.visibility===x?'selected':''}>${x}</option>`).join('')}</select></label></div>
 <div class="formRow"><label class="checkLabel"><input name="featured" type="checkbox" ${e.is_featured?'checked':''}> Featured event</label><label class="checkLabel"><input name="published" type="checkbox" ${e.is_published?'checked':''}> Published</label></div>
 <label class="checkLabel"><input name="responses" type="checkbox" ${e.allow_responses!==false?'checked':''}> Allow Going / Interested responses</label>
 <div class="eventPhotoDropzoneV4151" data-event-photo-dropzone tabindex="0" role="button" aria-label="Upload event photos">
   <input id="eventPhotoInputV4151" name="photos" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden>
   <div class="eventPhotoDropzoneIconV4151">▧</div>
   <div><strong>Drag and drop event photos here</strong><span>or click to browse PNG, JPG, WEBP, or GIF files</span></div>
   <button type="button" class="eventPhotoBrowseButtonV4151">Choose Photos</button>
 </div>
 <div class="eventPhotoPreviewGridV4151" data-event-photo-previews hidden></div>
 <div class="adminItemActions"><button class="primaryButton" type="submit">${e.id?'Save Event':'Create Event'}</button>${e.id?'<button class="secondaryButton" type="button" data-cancel-event>Edit New Event</button>':''}</div>
 </form>`;
}
function eventCards(){
 return events.length?events.map(e=>`<article class="eventAdminCardV414">
 ${e.cover_image_url?`<img src="${esc(e.cover_image_url)}" alt="">`:''}<header><div><p class="sectionEyebrow">${esc(e.event_type)}</p><h3>${esc(e.title)}</h3></div><span class="statusPill">${e.is_published?'Published':'Draft'}</span></header>
 <p>${new Date(e.starts_at).toLocaleString()}${e.location?` • ${esc(e.location)}`:''}</p><div class="eventResponseCountsV414"><span>✓ ${e.going} Going</span><span>★ ${e.interested} Interested</span><span>▧ ${(e.media||[]).length} Photos</span></div>
 <div class="eventAdminMediaV414">${(e.media||[]).map(m=>`<figure><img src="${esc(m.image_url)}" alt=""><button type="button" data-delete-event-photo="${m.id}" data-storage-path="${esc(m.storage_path||'')}">×</button></figure>`).join('')}</div>
 <div class="adminItemActions"><button class="smallAction" data-edit-event-v414="${e.id}">Edit</button><button class="smallAction" data-announce-event="${e.id}">Send Announcement</button><button class="smallAction dangerAction" data-delete-event-v414="${e.id}">Delete</button></div>
 </article>`).join(''):'<div class="emptyState">No Supabase events yet.</div>';
}
async function renderEvents(){
 panel.innerHTML='<div class="achievementLoadingV41330">Loading Events Studio…</div>';
 try{await loadEvents()}catch(e){panel.innerHTML=`<div class="emptyState">${esc(e.message)}</div>`;return}
 const e=editingEvent?events.find(x=>x.id===editingEvent)||{}:{};
 panel.innerHTML=`<div class="adminSectionHead"><div><p class="sectionEyebrow">Social Event CMS</p><h2>Events Manager</h2></div><span class="statusPill">${events.filter(x=>x.is_published).length} published</span></div>
 <p class="adminLead">Create events, upload or delete photos, publish countdowns, collect Going/Interested responses, and send member announcements.</p>
 ${eventForm(e)}<div class="adminEventGridV414">${eventCards()}</div>`;
 bindEventDropzone(document.getElementById('eventStudioForm'));
}
function setEventDropFiles(form,files){
 const input=form?.querySelector('#eventPhotoInputV4151');if(!input)return;
 const transfer=new DataTransfer();
 [...files].filter(file=>file&&file.type?.startsWith('image/')).forEach(file=>transfer.items.add(file));
 input.files=transfer.files;
 renderEventDropPreviews(form,input.files);
}
function renderEventDropPreviews(form,files){
 const grid=form?.querySelector('[data-event-photo-previews]');if(!grid)return;
 grid.innerHTML='';
 const list=[...files];
 grid.hidden=!list.length;
 list.forEach((file,index)=>{
  const url=URL.createObjectURL(file);
  const card=document.createElement('figure');
  card.innerHTML=`<img src="${url}" alt="${esc(file.name)}"><figcaption><strong>${esc(file.name)}</strong><small>${Math.max(1,Math.round(file.size/1024))} KB</small></figcaption><button type="button" data-remove-event-drop-photo="${index}" aria-label="Remove ${esc(file.name)}">×</button>`;
  card.querySelector('img').addEventListener('load',()=>URL.revokeObjectURL(url),{once:true});
  grid.appendChild(card);
 });
}
function bindEventDropzone(form){
 const zone=form?.querySelector('[data-event-photo-dropzone]'),input=form?.querySelector('#eventPhotoInputV4151');
 if(!zone||!input||zone.dataset.bound==='1')return;
 zone.dataset.bound='1';
 const openPicker=()=>input.click();
 zone.addEventListener('click',e=>{if(!e.target.closest('button')||e.target.closest('.eventPhotoBrowseButtonV4151'))openPicker()});
 zone.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPicker()}});
 input.addEventListener('change',()=>renderEventDropPreviews(form,input.files));
 ['dragenter','dragover'].forEach(type=>zone.addEventListener(type,e=>{e.preventDefault();zone.classList.add('isDragging')}));
 ['dragleave','drop'].forEach(type=>zone.addEventListener(type,e=>{e.preventDefault();zone.classList.remove('isDragging')}));
 zone.addEventListener('drop',e=>setEventDropFiles(form,e.dataTransfer?.files||[]));
 form.addEventListener('click',e=>{
  const remove=e.target.closest('[data-remove-event-drop-photo]');if(!remove)return;
  const files=[...input.files];files.splice(Number(remove.dataset.removeEventDropPhoto),1);setEventDropFiles(form,files);
 });
}
async function uploadEventPhotos(eventId,files){
 if(!files?.length)return [];
 const {data:{user}}=await client.auth.getUser();if(!user)throw new Error('Sign in again before uploading.');
 const rows=[];
 for(const file of files){
  const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,'-');
  const path=`${user.id}/events/${eventId}/${Date.now()}-${safe}`;
  const up=await client.storage.from('gallery').upload(path,file,{upsert:false,contentType:file.type});
  if(up.error)throw up.error;
  const {data:pub}=client.storage.from('gallery').getPublicUrl(path);
  rows.push({event_id:eventId,image_url:pub.publicUrl,storage_path:path,alt_text:file.name,created_by:user.id});
 }
 const ins=await client.from('site_event_media').insert(rows);if(ins.error)throw ins.error;
 return rows;
}
async function saveEvent(form){
 const f=new FormData(form),id=f.get('id')||crypto.randomUUID(),row={
 id,title:String(f.get('title')).trim(),slug:slug(f.get('title'))+'-'+id.slice(0,8),event_type:f.get('eventType'),
 description:f.get('description')||'',starts_at:new Date(f.get('startsAt')).toISOString(),
 ends_at:f.get('endsAt')?new Date(f.get('endsAt')).toISOString():null,venue:f.get('venue')||'',location:f.get('location')||'',
 online_url:f.get('onlineUrl')||null,ticket_url:f.get('ticketUrl')||null,details_url:f.get('detailsUrl')||null,
 visibility:f.get('visibility'),is_featured:f.has('featured'),is_published:f.has('published'),allow_responses:f.has('responses')
 };
 const r=await client.from('site_events').upsert(row,{onConflict:'id'}).select().single();if(r.error)throw r.error;
 const photos=f.getAll('photos').filter(x=>x instanceof File&&x.size);const uploaded=await uploadEventPhotos(id,photos);
 if(uploaded[0]&&!r.data.cover_image_url){
  await client.from('site_events').update({cover_image_url:uploaded[0].image_url}).eq('id',id);
 }
 editingEvent=null;toast('Event saved and synchronized.','Events Manager');await renderEvents();
}

menu.addEventListener('click',e=>{
 const b=e.target.closest('[data-panel]');if(!b)return;
 if(b.dataset.panel==='quests'){e.stopImmediatePropagation();menu.querySelectorAll('[data-panel]').forEach(x=>x.classList.toggle('active',x===b));setTimeout(renderQuests,0)}
 if(b.dataset.panel==='events'){e.stopImmediatePropagation();menu.querySelectorAll('[data-panel]').forEach(x=>x.classList.toggle('active',x===b));setTimeout(renderEvents,0)}
},true);

panel.addEventListener('submit',async e=>{
 try{
  if(e.target.id==='questStudioForm'){e.preventDefault();await saveQuest(e.target)}
  if(e.target.id==='eventStudioForm'){e.preventDefault();await saveEvent(e.target)}
 }catch(err){toast(err.message,'Save failed')}
});
panel.addEventListener('click',async e=>{
 try{
  let b=e.target.closest('[data-edit-quest]');if(b){editingQuest=b.dataset.editQuest;return renderQuests()}
  b=e.target.closest('[data-cancel-quest]');if(b){editingQuest=null;return renderQuests()}
  b=e.target.closest('[data-toggle-quest]');if(b){const q=quests.find(x=>x.code===b.dataset.toggleQuest);await client.rpc('admin_save_quest',{p_original_code:q.code,p_code:q.code,p_name:q.name,p_description:q.description,p_quest_type:q.quest_type,p_metric:q.metric,p_target:q.target,p_xp_reward:q.xp_reward,p_title_reward:q.title_reward,p_achievement_code:q.achievement_code,p_starts_at:q.starts_at,p_ends_at:q.ends_at,p_is_active:!q.is_active,p_icon:q.icon,p_rarity:q.rarity,p_sort_order:q.sort_order,p_notify_on_publish:false});return renderQuests()}
  b=e.target.closest('[data-delete-quest]');if(b){const r=await client.rpc('admin_delete_quest',{p_code:b.dataset.deleteQuest});if(r.error)throw r.error;toast('Quest deleted.','Quest Studio');return renderQuests()}
  b=e.target.closest('[data-edit-event-v414]');if(b){editingEvent=b.dataset.editEventV414;return renderEvents()}
  b=e.target.closest('[data-cancel-event]');if(b){editingEvent=null;return renderEvents()}
  b=e.target.closest('[data-announce-event]');if(b){const r=await client.rpc('admin_publish_event_announcement',{p_event_id:b.dataset.announceEvent});if(r.error)throw r.error;toast(`Announcement sent to ${r.data} members.`,'Events Manager');return renderEvents()}
  b=e.target.closest('[data-delete-event-v414]');if(b){const r=await client.from('site_events').delete().eq('id',b.dataset.deleteEventV414);if(r.error)throw r.error;toast('Event deleted.','Events Manager');return renderEvents()}
  b=e.target.closest('[data-delete-event-photo]');if(b){if(b.dataset.storagePath){const st=await client.storage.from('gallery').remove([b.dataset.storagePath]);if(st.error)throw st.error}const r=await client.from('site_event_media').delete().eq('id',b.dataset.deleteEventPhoto);if(r.error)throw r.error;toast('Event photo deleted.','Events Manager');return renderEvents()}
 }catch(err){toast(err.message,'Admin action failed')}
});

addQuestMenu();
})();