/* Seeker Of SoundZ v4.19.7 — Supabase Socials Manager */
(()=>{
'use strict';
const client=window.SOS_SUPABASE?.client;
const panel=document.getElementById('adminPanel');
const menu=document.querySelector('.adminMenu');
if(!client||!panel||!menu)return;
const $=(s,r=document)=>r.querySelector(s);
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
let rows=[],editingKey='';

function toast(message,title='Socials Manager'){
 window.SOS?.toast?.(message,{title,icon:'✓'});
}
async function load(){
 const {data,error}=await client.rpc('admin_get_site_social_links');
 if(error)throw error;
 rows=Array.isArray(data)?data:[];
}
function formMarkup(item={}){
 return `<form class="appForm adminEditor socialsAdminFormV4197" id="socialsAdminFormV4197">
  <div class="adminSectionHead"><div><p class="sectionEyebrow">Social Link Editor</p><h3>${item.key?'Edit':'Add'} social destination</h3></div><button class="smallAction" type="button" data-social-reset>New Link</button></div>
  <div class="formRow">
   <label>Platform key<input name="key" required pattern="[a-zA-Z0-9_-]+" value="${esc(item.key||'')}" ${item.key?'readonly':''} placeholder="youtube"></label>
   <label>Platform name<input name="name" required value="${esc(item.name||'')}" placeholder="YouTube"></label>
  </div>
  <div class="formRow">
   <label>Category label<input name="category" value="${esc(item.category||'Connect')}" placeholder="Videos"></label>
   <label>Icon or symbol<input name="icon" maxlength="8" value="${esc(item.icon||'↗')}" placeholder="▶"></label>
  </div>
  <label>Profile URL<input name="url" type="url" value="${esc(item.url||'')}" placeholder="https://..."></label>
  <label>Description<textarea name="description" maxlength="300" placeholder="Describe what visitors will find here.">${esc(item.description||'')}</textarea></label>
  <div class="formRow">
   <label>Display order<input name="sortOrder" type="number" value="${Number(item.sort_order??rows.length*10+10)}"></label>
   <div class="socialAdminChecksV4197">
    <label class="checkLine"><input name="featured" type="checkbox" ${item.featured?'checked':''}> Featured card</label>
    <label class="checkLine"><input name="visible" type="checkbox" ${item.visible!==false?'checked':''}> Visible publicly</label>
   </div>
  </div>
  <button class="primaryButton">${item.key?'Save Social Changes':'Publish Social Link'}</button>
  <p class="formMessage" id="socialsAdminMessageV4197"></p>
 </form>`;
}
function listMarkup(){
 return `<section class="socialsAdminListV4197">
  <div class="adminSectionHead"><div><p class="sectionEyebrow">Published Destinations</p><h3>Socials page order</h3></div><span class="statusPill">${rows.length} links</span></div>
  <div class="adminList">${rows.length?rows.map(row=>`<article class="adminListItem socialAdminItemV4197">
   <span class="socialAdminIconV4197">${esc(row.icon||'↗')}</span>
   <div><strong>${esc(row.name)}</strong><p>${esc(row.category)} · ${esc(row.url||'No URL entered')}</p><small>${row.visible?'Public':'Hidden'}${row.featured?' · Featured':''} · Position ${Number(row.sort_order||0)}</small></div>
   <div class="adminItemActions"><button class="smallAction" data-social-edit="${esc(row.key)}">Edit</button><button class="smallAction dangerAction" data-social-delete="${esc(row.key)}">Delete</button></div>
  </article>`).join(''):'<div class="emptyState">No social links are stored yet.</div>'}</div>
 </section>`;
}
function render(item={}){
 panel.innerHTML=`<div class="socialsAdminHeroV4197"><div><p class="sectionEyebrow">Social Presence Studio</p><h2>Socials Manager</h2><p>Edit the official links, labels, descriptions, visibility and order used by the public Socials page.</p></div><a class="secondaryButton" href="socials.html" target="_blank" rel="noopener">Preview Socials Page ↗</a></div>${formMarkup(item)}${listMarkup()}`;
}
async function open(){
 editingKey='';
 panel.innerHTML='<div class="emptyState">Loading Socials Manager…</div>';
 try{await load();render()}catch(error){panel.innerHTML=`<div class="backendNotice"><strong>Socials Manager needs setup</strong><p>${esc(error.message)}</p><p>Run <code>supabase/patch-v4.19.7-socials-manager.sql</code> in Supabase SQL Editor.</p></div>`}
}
menu.addEventListener('click',event=>{
 const button=event.target.closest('[data-panel="socials"]');
 if(!button)return;
 event.preventDefault();event.stopImmediatePropagation();
 menu.querySelectorAll('button').forEach(item=>item.classList.toggle('active',item===button));
 open();
},true);

panel.addEventListener('submit',async event=>{
 const form=event.target.closest('#socialsAdminFormV4197');if(!form)return;
 event.preventDefault();
 const button=form.querySelector('button[type="submit"]'),message=$('#socialsAdminMessageV4197',form),fd=new FormData(form);
 button.disabled=true;message.textContent='Publishing to Supabase…';
 try{
  const {error}=await client.rpc('admin_save_site_social_link',{
   p_platform_key:String(fd.get('key')||'').trim(),
   p_platform_name:String(fd.get('name')||'').trim(),
   p_category_label:String(fd.get('category')||'Connect').trim(),
   p_description:String(fd.get('description')||'').trim(),
   p_icon:String(fd.get('icon')||'↗').trim(),
   p_profile_url:String(fd.get('url')||'').trim(),
   p_sort_order:Number(fd.get('sortOrder')||0),
   p_is_featured:fd.has('featured'),
   p_is_visible:fd.has('visible')
  });
  if(error)throw error;
  await load();render();toast('The Socials page was updated immediately.');
 }catch(error){message.textContent=error.message;message.dataset.state='error'}
 finally{button.disabled=false}
});
panel.addEventListener('click',async event=>{
 let button=event.target.closest('[data-social-edit]');
 if(button){editingKey=button.dataset.socialEdit;const item=rows.find(row=>row.key===editingKey);if(item){render(item);panel.scrollIntoView({block:'start'});}return}
 button=event.target.closest('[data-social-reset]');
 if(button){editingKey='';render();return}
 button=event.target.closest('[data-social-delete]');
 if(button){
  if(!confirm(`Delete ${button.dataset.socialDelete} from the Socials page?`))return;
  const {error}=await client.rpc('admin_delete_site_social_link',{p_platform_key:button.dataset.socialDelete});
  if(error)return toast(error.message,'Delete failed');
  await load();render();toast('Social link deleted.');
 }
});
})();
