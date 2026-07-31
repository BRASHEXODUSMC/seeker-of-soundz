(()=>{
'use strict';
const client=window.SOS_SUPABASE?.client;
const gate=document.getElementById('collabGate');
const app=document.getElementById('collabApp');
if(!gate||!app)return;
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const toast=(m,t='Collaboration Studio')=>window.SOS?.toast?.(m,{title:t});
const stages=[['Idea',0],['Writing',10],['Recording',20],['Production',35],['Sound Design',45],['Arrangement',55],['Mixing',70],['Mastering',82],['Review',90],['Approved',95],['Ready for Release',98],['Released',100],['On Hold',50],['Archived',100]];
let user=null,profile=null,projects=[],membersByProject=new Map(),profiles=new Map(),selected=null,messages=[];
const display=p=>p?.display_name||p?.username||'Member';
const safeName=name=>String(name||'audio').replace(/[^a-zA-Z0-9._-]+/g,'-').slice(-120);

async function auth(){
 if(!client){gate.hidden=false;gate.innerHTML='<h2>Supabase connection required</h2><p>Collaboration Studio now uses Supabase and cannot run in browser-local mode.</p>';return false}
 const {data}=await client.auth.getSession();user=data.session?.user||null;
 if(!user){gate.hidden=false;gate.innerHTML='<h2>Member access required</h2><p>Sign in to open your private collaboration workspace.</p><a class="primaryButton" href="members.html">Open Member Login</a>';return false}
 const {data:p,error}=await client.from('profiles').select('id,username,display_name,avatar_url,role,rank_name,collaboration_access,is_banned').eq('id',user.id).single();
 if(error||!p){gate.hidden=false;gate.innerHTML='<h2>Profile unavailable</h2><p>Your Supabase profile could not be loaded.</p>';return false}
 profile=p;
 if(p.is_banned||(!p.collaboration_access&&!['owner','administrator'].includes(p.role))){gate.hidden=false;gate.innerHTML='<h2>Private collaboration access</h2><p>This studio is invitation-only. An Owner or Administrator can enable Collaboration Access from Admin Hub → Members.</p><a class="primaryButton" href="contact.html?type=Collaboration">Request Access</a>';return false}
 gate.hidden=true;app.hidden=false;return true;
}

function eligibleCollaborators(){return [...profiles.values()].filter(p=>p.id!==user.id&&(p.collaboration_access||['owner','administrator'].includes(p.role)));}
function ensureProjectModal(){
 if($('#collabProjectModal'))return;
 const modal=document.createElement('div');
 modal.className='collabModal';
 modal.id='collabProjectModal';
 modal.hidden=true;
 modal.innerHTML=`
  <div class="collabModalBackdrop" data-close-project-modal></div>
  <section class="collabModalCard" role="dialog" aria-modal="true" aria-labelledby="collabProjectModalTitle">
   <button class="collabModalClose" type="button" aria-label="Close project creator" data-close-project-modal>×</button>
   <div class="collabModalGlow"></div>
   <p class="sectionEyebrow">New Creative Workspace</p>
   <h2 id="collabProjectModalTitle">Create a collaboration project</h2>
   <p class="collabModalIntro">Give every release its own private conversation, team, notes, audio versions, and production progression.</p>
   <form id="newCollabProjectForm" class="collabProjectForm">
    <label>Project name<input name="title" maxlength="80" placeholder="Midnight Frequency" required></label>
    <label>First collaborator<select name="collaboratorId"><option value="">Create solo project</option></select></label>
    <label>Starting stage<select name="stage">${stages.map(([name])=>`<option value="${esc(name)}">${esc(name)}</option>`).join('')}</select></label>
    <label class="collabFormWide">Project notes<textarea name="notes" maxlength="1200" placeholder="Describe the idea, BPM, deadline, references, or first production goal..."></textarea></label>
    <div class="collabModalActions collabFormWide"><button class="smallAction" type="button" data-close-project-modal>Cancel</button><button class="primaryButton" type="submit">Create Project</button></div>
   </form>
  </section>`;
 document.body.appendChild(modal);
 modal.querySelector('#newCollabProjectForm').addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget;const values=Object.fromEntries(new FormData(form));await createProject(values);});
}
function populateProjectModal(invitedId=''){
 ensureProjectModal();
 const select=$('#newCollabProjectForm select[name="collaboratorId"]');
 if(!select)return;
 const current=invitedId||select.value||'';
 select.innerHTML='<option value="">Create solo project</option>'+eligibleCollaborators().map(p=>`<option value="${esc(p.id)}">${esc(display(p))} — ${esc(p.rank_name||'New Listener')}</option>`).join('');
 select.value=current;
}
function openProjectModal(invitedId=''){
 populateProjectModal(invitedId);
 const modal=$('#collabProjectModal');
 const form=$('#newCollabProjectForm');
 form?.reset();
 populateProjectModal(invitedId);
 if(invitedId)form.elements.collaboratorId.value=invitedId;
 modal.hidden=false;
 requestAnimationFrame(()=>modal.classList.add('open'));
 document.body.classList.add('collabModalOpen');
 setTimeout(()=>form?.elements.title?.focus(),80);
}
function closeProjectModal(){const modal=$('#collabProjectModal');if(!modal)return;modal.classList.remove('open');document.body.classList.remove('collabModalOpen');setTimeout(()=>{modal.hidden=true},260);}

async function load(){
 const [{data:ps,error:pe},{data:pr,error:pre},{data:pm,error:pme}]=await Promise.all([
  client.from('profiles').select('id,username,display_name,avatar_url,rank_name,role,collaboration_access,is_banned').eq('is_banned',false).order('display_name'),
  client.from('collaboration_projects').select('*').order('updated_at',{ascending:false}),
  client.from('collaboration_project_members').select('*')
 ]);
 if(pe||pre||pme)throw pe||pre||pme;
 profiles=new Map((ps||[]).map(p=>[p.id,p]));projects=pr||[];membersByProject=new Map();
 (pm||[]).forEach(m=>{if(!membersByProject.has(m.project_id))membersByProject.set(m.project_id,[]);membersByProject.get(m.project_id).push(m)});
 if(selected)selected=projects.find(p=>p.id===selected.id)||null;
 if(!selected&&projects.length)selected=projects[0];
 await loadMessages();renderAll();populateProjectModal();
}
async function loadMessages(){if(!selected){messages=[];return}const {data,error}=await client.from('collaboration_messages').select('*').eq('project_id',selected.id).order('created_at');if(error)throw error;messages=data||[]}
function projectMemberProfiles(projectId){return (membersByProject.get(projectId)||[]).map(m=>({...profiles.get(m.user_id),member_role:m.member_role})).filter(x=>x.id)}
function renderContacts(){const list=$('#contactList');const eligible=eligibleCollaborators();list.innerHTML=eligible.length?eligible.map(p=>`<button class="collabContact" type="button" data-new-with="${p.id}"><img src="${esc(p.avatar_url||'assets/images/sos-logo.png')}" alt=""><span><strong>${esc(display(p))}</strong><small>${esc(p.rank_name||'New Listener')}</small></span><span class="collabContactAction">Start project</span></button>`).join(''):'<p class="emptyState">No other approved collaborators yet.</p>'}
function renderProjects(){const list=$('#projectList');list.innerHTML=projects.length?projects.map(p=>`<button type="button" class="collabProjectItem ${selected?.id===p.id?'active':''}" data-project="${p.id}"><span class="projectCardTop"><strong>${esc(p.title)}</strong><small>${esc(p.stage)} · ${Number(p.progress||0)}%</small></span><div class="projectMiniProgress"><i style="width:${Number(p.progress||0)}%"></i></div></button>`).join(''):'<div class="collabProjectEmpty"><p>No projects yet.</p><button class="primaryButton" type="button" data-open-project-modal>Create Your First Project</button></div>'}
async function signedUrl(path){if(!path)return'';const {data}=await client.storage.from('collaboration-files').createSignedUrl(path,3600);return data?.signedUrl||''}
async function renderConversation(){const box=$('#collabMessages');if(!selected){box.innerHTML='<div class="collabEmpty"><strong>Your private project chat will appear here.</strong><span>Create or choose a project to begin.</span><button class="primaryButton" type="button" data-open-project-modal>Create Project</button></div>';return}box.innerHTML=messages.length?messages.map(m=>{const p=profiles.get(m.sender_id)||{};return `<article class="collabMessage"><img src="${esc(p.avatar_url||'assets/images/sos-logo.png')}" alt=""><div><header><strong>${esc(display(p))}</strong><time>${new Date(m.created_at).toLocaleString()}</time></header>${m.body?`<p>${esc(m.body)}</p>`:''}${m.attachment_path?`<div class="collabAttachment" data-attachment="${esc(m.attachment_path)}"><button type="button" class="smallAction" data-load-audio="${esc(m.id)}">Load ${esc(m.attachment_name||'audio')}</button></div>`:''}</div></article>`}).join(''):'<div class="collabEmpty">No messages yet. Start the frequency.</div>';box.scrollTop=box.scrollHeight}
function renderInspector(){
 $('#conversationTitle').textContent=selected?.title||'Choose a project';$('#conversationSubtitle').textContent=selected?`${projectMemberProfiles(selected.id).length} collaborators · Supabase workspace`:'Select or create a project to start collaborating.';$('#activeProjectStatus').textContent=selected?`${selected.stage} · ${selected.progress}%`:'No project selected';$('#projectTitle').textContent=selected?.title||'Project Details';$('#projectNotes').value=selected?.notes||'';
 $('#statusGrid').innerHTML=selected?stages.map(([name,progress])=>`<button type="button" class="statusPill ${selected.stage===name?'active':''}" data-stage="${esc(name)}" data-progress="${progress}">${esc(name)}</button>`).join(''):'<p class="emptyState">Create a project to track production stages.</p>';
 $('#projectMembers').innerHTML=selected?projectMemberProfiles(selected.id).map(p=>`<span><img src="${esc(p.avatar_url||'assets/images/sos-logo.png')}" alt="">${esc(display(p))}<small>${esc(p.member_role||'Collaborator')}</small></span>`).join(''):'<p class="emptyState">No project selected.</p>';
 $('#projectFiles').innerHTML=selected?messages.filter(m=>m.attachment_path).map(m=>`<div class="adminListItem"><strong>${esc(m.attachment_name||'Audio file')}</strong><button class="smallAction" type="button" data-download-audio="${esc(m.id)}">Open</button></div>`).join('')||'<p class="emptyState">No shared audio yet.</p>':'<p class="emptyState">No project selected.</p>';
}
function renderAll(){renderContacts();renderProjects();renderConversation();renderInspector()}
async function createProject(values={}){
 const title=String(values.title||'').trim();if(!title)return toast('Enter a project name.','Project creation');
 const stage=stages.some(([name])=>name===values.stage)?values.stage:'Idea';
 const progress=stages.find(([name])=>name===stage)?.[1]||0;
 const notes=String(values.notes||'').trim();const invitedId=String(values.collaboratorId||'');
 const {data:p,error}=await client.from('collaboration_projects').insert({title,description:notes,notes,stage,progress,created_by:user.id}).select().single();if(error){toast(error.message,'Project creation failed');return}
 const rows=[{project_id:p.id,user_id:user.id,member_role:'Project Owner'}];if(invitedId&&invitedId!==user.id)rows.push({project_id:p.id,user_id:invitedId,member_role:'Collaborator'});
 const {error:me}=await client.from('collaboration_project_members').insert(rows);if(me){await client.from('collaboration_projects').delete().eq('id',p.id);toast(me.message,'Project creation failed');return}
 selected=p;closeProjectModal();toast('Project created in Supabase.');await load();
}
async function sendMessage(form){if(!selected)return toast('Choose a project first.');const body=form.elements.message.value.trim();const file=$('#messageFile').files[0];if(!body&&!file)return;let attachment={};
 if(file){const path=`${selected.id}/${user.id}/${crypto.randomUUID()}-${safeName(file.name)}`;const {error}=await client.storage.from('collaboration-files').upload(path,file,{contentType:file.type||'application/octet-stream'});if(error)return toast(error.message,'Audio upload failed');attachment={attachment_path:path,attachment_name:file.name,attachment_type:file.type,attachment_size:file.size}}
 const {error}=await client.from('collaboration_messages').insert({project_id:selected.id,sender_id:user.id,body,...attachment});if(error)return toast(error.message,'Message failed');
 await client.from('collaboration_projects').update({updated_at:new Date().toISOString()}).eq('id',selected.id);form.reset();$('#attachmentPreview').textContent='No audio selected';await loadMessages();renderConversation();renderInspector();
}
async function updateProject(values){if(!selected)return;const {error}=await client.from('collaboration_projects').update({...values,updated_at:new Date().toISOString()}).eq('id',selected.id);if(error)return toast(error.message,'Project update failed');Object.assign(selected,values);renderInspector();renderProjects();toast('Project updated in Supabase.')}
async function openAudio(id,download=false){const m=messages.find(x=>x.id===id);if(!m?.attachment_path)return;const url=await signedUrl(m.attachment_path);if(!url)return toast('Could not create a secure audio link.');if(download){const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.click();return}const host=document.querySelector(`[data-attachment="${CSS.escape(m.attachment_path)}"]`);if(host)host.innerHTML=`<audio controls autoplay preload="metadata" src="${esc(url)}"></audio><a class="smallAction" href="${esc(url)}" target="_blank" rel="noopener">Open securely</a>`}
function bind(){
 ensureProjectModal();
 $('#newProjectButton')?.addEventListener('click',()=>openProjectModal());
 $('#messageForm')?.addEventListener('submit',e=>{e.preventDefault();sendMessage(e.currentTarget)});
 $('#messageFile')?.addEventListener('change',e=>{$('#attachmentPreview').textContent=e.target.files[0]?.name||'No audio selected'});
 $('#saveNotes')?.addEventListener('click',()=>updateProject({notes:$('#projectNotes').value.trim()}));
 document.addEventListener('click',async e=>{
  let b=e.target.closest('[data-close-project-modal]');if(b){closeProjectModal();return}
  b=e.target.closest('[data-open-project-modal]');if(b){openProjectModal();return}
  b=e.target.closest('[data-project]');if(b){selected=projects.find(p=>p.id===b.dataset.project);await loadMessages();renderAll();return}
  b=e.target.closest('[data-new-with]');if(b){openProjectModal(b.dataset.newWith);return}
  b=e.target.closest('[data-stage]');if(b){updateProject({stage:b.dataset.stage,progress:Number(b.dataset.progress)});return}
  b=e.target.closest('[data-load-audio]');if(b){openAudio(b.dataset.loadAudio);return}
  b=e.target.closest('[data-download-audio]');if(b){openAudio(b.dataset.downloadAudio,true)}
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#collabProjectModal')?.hidden)closeProjectModal()});
}
async function boot(){if(!await auth())return;const notice=app.querySelector('.backendNotice');if(notice)notice.innerHTML='<strong>Supabase workspace</strong><br>Projects, members, private messages, notes, stages, and audio files are stored securely in Supabase.';bind();try{await load()}catch(e){console.error(e);toast(e.message,'Collaboration could not load')}const channel=client.channel(`collab-${user.id}`).on('postgres_changes',{event:'*',schema:'public',table:'collaboration_messages'},async()=>{await loadMessages();renderConversation()}).on('postgres_changes',{event:'*',schema:'public',table:'collaboration_projects'},load).subscribe();window.addEventListener('beforeunload',()=>client.removeChannel(channel),{once:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
