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
const isStaff=()=>['owner','administrator'].includes(profile?.role);
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

async function load(){
 const [{data:ps,error:pe},{data:pr,error:pre},{data:pm,error:pme}]=await Promise.all([
  client.from('profiles').select('id,username,display_name,avatar_url,rank_name,role,collaboration_access').eq('is_banned',false).order('display_name'),
  client.from('collaboration_projects').select('*').order('updated_at',{ascending:false}),
  client.from('collaboration_project_members').select('*')
 ]);
 if(pe||pre||pme)throw pe||pre||pme;
 profiles=new Map((ps||[]).map(p=>[p.id,p]));projects=pr||[];membersByProject=new Map();
 (pm||[]).forEach(m=>{if(!membersByProject.has(m.project_id))membersByProject.set(m.project_id,[]);membersByProject.get(m.project_id).push(m)});
 if(selected)selected=projects.find(p=>p.id===selected.id)||null;
 if(!selected&&projects.length)selected=projects[0];
 await loadMessages();renderAll();
}
async function loadMessages(){if(!selected){messages=[];return}const {data,error}=await client.from('collaboration_messages').select('*').eq('project_id',selected.id).order('created_at');if(error)throw error;messages=data||[]}
function projectMemberProfiles(projectId){return (membersByProject.get(projectId)||[]).map(m=>({...profiles.get(m.user_id),member_role:m.member_role})).filter(x=>x.id)}
function renderContacts(){const list=$('#contactList');const eligible=[...profiles.values()].filter(p=>p.id!==user.id&&(p.collaboration_access||['owner','administrator'].includes(p.role)));list.innerHTML=eligible.length?eligible.map(p=>`<button class="collabContact" type="button" data-new-with="${p.id}"><img src="${esc(p.avatar_url||'assets/images/sos-logo.png')}" alt=""><span><strong>${esc(display(p))}</strong><small>${esc(p.rank_name||'New Listener')}</small></span></button>`).join(''):'<p class="emptyState">No other approved collaborators yet.</p>'}
function renderProjects(){const list=$('#projectList');list.innerHTML=projects.length?projects.map(p=>`<button type="button" class="collabProjectItem ${selected?.id===p.id?'active':''}" data-project="${p.id}"><strong>${esc(p.title)}</strong><span>${esc(p.stage)} · ${p.progress}%</span></button>`).join(''):'<p class="emptyState">No projects yet. Create the first one.</p>'}
async function signedUrl(path){if(!path)return'';const {data}=await client.storage.from('collaboration-files').createSignedUrl(path,3600);return data?.signedUrl||''}
async function renderConversation(){const box=$('#collabMessages');if(!selected){box.innerHTML='<div class="collabEmpty">Choose or create a project to begin.</div>';return}box.innerHTML=messages.length?messages.map(m=>{const p=profiles.get(m.sender_id)||{};return `<article class="collabMessage"><img src="${esc(p.avatar_url||'assets/images/sos-logo.png')}" alt=""><div><header><strong>${esc(display(p))}</strong><time>${new Date(m.created_at).toLocaleString()}</time></header>${m.body?`<p>${esc(m.body)}</p>`:''}${m.attachment_path?`<div class="collabAttachment" data-attachment="${esc(m.attachment_path)}"><button type="button" class="smallAction" data-load-audio="${esc(m.id)}">Load ${esc(m.attachment_name||'audio')}</button></div>`:''}</div></article>`}).join(''):'<div class="collabEmpty">No messages yet. Start the frequency.</div>';box.scrollTop=box.scrollHeight}
function renderInspector(){
 $('#conversationTitle').textContent=selected?.title||'Choose a project';$('#conversationSubtitle').textContent=selected?`${projectMemberProfiles(selected.id).length} collaborators · Supabase workspace`:'Select a project to start collaborating.';$('#activeProjectStatus').textContent=selected?`${selected.stage} · ${selected.progress}%`:'No project selected';$('#projectTitle').textContent=selected?.title||'Project Details';$('#projectNotes').value=selected?.notes||'';
 $('#statusGrid').innerHTML=selected?stages.map(([name,progress])=>`<button type="button" class="statusPill ${selected.stage===name?'active':''}" data-stage="${esc(name)}" data-progress="${progress}">${esc(name)}</button>`).join(''):'';
 $('#projectMembers').innerHTML=selected?projectMemberProfiles(selected.id).map(p=>`<span><img src="${esc(p.avatar_url||'assets/images/sos-logo.png')}" alt="">${esc(display(p))}</span>`).join(''):'';
 $('#projectFiles').innerHTML=selected?messages.filter(m=>m.attachment_path).map(m=>`<div class="adminListItem"><strong>${esc(m.attachment_name||'Audio file')}</strong><button class="smallAction" type="button" data-download-audio="${esc(m.id)}">Open</button></div>`).join('')||'<p class="emptyState">No shared audio yet.</p>':'';
}
function renderAll(){renderContacts();renderProjects();renderConversation();renderInspector()}
async function createProject(invitedId=''){
 const title=prompt('Project title');if(!title?.trim())return;
 const description=prompt('Short project description (optional)')||'';
 const {data:p,error}=await client.from('collaboration_projects').insert({title:title.trim(),description:description.trim(),created_by:user.id}).select().single();if(error){toast(error.message,'Project creation failed');return}
 const rows=[{project_id:p.id,user_id:user.id,member_role:'Project Owner'}];if(invitedId&&invitedId!==user.id)rows.push({project_id:p.id,user_id:invitedId,member_role:'Collaborator'});
 const {error:me}=await client.from('collaboration_project_members').insert(rows);if(me){await client.from('collaboration_projects').delete().eq('id',p.id);toast(me.message,'Project creation failed');return}
 selected=p;toast('Project created in Supabase.');await load();
}
async function sendMessage(form){if(!selected)return toast('Choose a project first.');const body=form.elements.message.value.trim();const file=$('#messageFile').files[0];if(!body&&!file)return;let attachment={};
 if(file){const path=`${selected.id}/${user.id}/${crypto.randomUUID()}-${safeName(file.name)}`;const {error}=await client.storage.from('collaboration-files').upload(path,file,{contentType:file.type||'application/octet-stream'});if(error)return toast(error.message,'Audio upload failed');attachment={attachment_path:path,attachment_name:file.name,attachment_type:file.type,attachment_size:file.size}}
 const {error}=await client.from('collaboration_messages').insert({project_id:selected.id,sender_id:user.id,body,...attachment});if(error)return toast(error.message,'Message failed');
 await client.from('collaboration_projects').update({updated_at:new Date().toISOString()}).eq('id',selected.id);form.reset();$('#attachmentPreview').textContent='No audio selected';await loadMessages();renderConversation();renderInspector();
}
async function updateProject(values){if(!selected)return;const {error}=await client.from('collaboration_projects').update({...values,updated_at:new Date().toISOString()}).eq('id',selected.id);if(error)return toast(error.message,'Project update failed');Object.assign(selected,values);renderInspector();renderProjects();toast('Project updated in Supabase.')}
async function openAudio(id,download=false){const m=messages.find(x=>x.id===id);if(!m?.attachment_path)return;const url=await signedUrl(m.attachment_path);if(!url)return toast('Could not create a secure audio link.');if(download){const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.click();return}const host=document.querySelector(`[data-attachment="${CSS.escape(m.attachment_path)}"]`);if(host)host.innerHTML=`<audio controls autoplay preload="metadata" src="${esc(url)}"></audio><a class="smallAction" href="${esc(url)}" target="_blank" rel="noopener">Open securely</a>`}
async function renderNoteHistory(){
 const host=$('#collaborationNoteHistoryList');if(!host)return;
 if(!selected){host.innerHTML='<p class="emptyState">Select a project to view saved note versions.</p>';return}
 const q=await client.rpc('get_collaboration_note_history',{p_project_id:selected.id});
 if(q.error){host.innerHTML=`<p class="emptyState">${esc(q.error.message)}</p>`;return}
 const rows=Array.isArray(q.data)?q.data:[];
 host.innerHTML=rows.length?rows.map(v=>`<article class="noteVersionCardV417"><header><strong>Version ${v.version}</strong><span>${esc(v.author||'Member')} • ${new Date(v.created_at).toLocaleString()}</span></header><p>${esc(v.body).replace(/\n/g,'<br>')}</p><button type="button" class="smallAction" data-restore-note-version="${v.id}" data-note-body="${encodeURIComponent(v.body||'')}">Restore to Editor</button></article>`).join(''):'<p class="emptyState">No saved versions yet. Saving notes creates Version 1.</p>';
}
function bind(){
 $('#newProjectButton')?.addEventListener('click',()=>createProject());$('#messageForm')?.addEventListener('submit',e=>{e.preventDefault();sendMessage(e.currentTarget)});$('#messageFile')?.addEventListener('change',e=>{$('#attachmentPreview').textContent=e.target.files[0]?.name||'No audio selected'});$('#saveNotes')?.addEventListener('click',async()=>{if(!selected)return toast('Select a project first.');const button=$('#saveNotes');button.disabled=true;button.textContent='Saving version…';const q=await client.rpc('save_collaboration_note_version',{p_project_id:selected.id,p_note_body:$('#projectNotes').value.trim()});button.disabled=false;button.textContent='Save Notes';if(q.error)return toast(q.error.message,'Project Notes');selected.notes=$('#projectNotes').value.trim();await renderNoteHistory();toast(`Notes saved as Version ${q.data?.version_number||q.data?.version||''}.`,'Project Notes')});$('#refreshNoteHistory')?.addEventListener('click',renderNoteHistory);
 document.addEventListener('click',async e=>{let b=e.target.closest('[data-project]');if(b){selected=projects.find(p=>p.id===b.dataset.project);await loadMessages();renderAll();await renderNoteHistory();return}b=e.target.closest('[data-restore-note-version]');if(b){$('#projectNotes').value=decodeURIComponent(b.dataset.noteBody||'');toast('This version was restored to the editor. Save Notes to create a new version.','Project Notes');return}b=e.target.closest('[data-new-with]');if(b){createProject(b.dataset.newWith);return}b=e.target.closest('[data-stage]');if(b){updateProject({stage:b.dataset.stage,progress:Number(b.dataset.progress)});return}b=e.target.closest('[data-load-audio]');if(b){openAudio(b.dataset.loadAudio);return}b=e.target.closest('[data-download-audio]');if(b){openAudio(b.dataset.downloadAudio,true)}});
}
async function boot(){if(!await auth())return;const notice=app.querySelector('.backendNotice');if(notice)notice.innerHTML='<strong>Supabase workspace</strong><br>Projects, members, private messages, notes, stages, and audio files are stored securely in Supabase.';bind();try{await load()}catch(e){console.error(e);toast(e.message,'Collaboration could not load')}const channel=client.channel(`collab-${user.id}`).on('postgres_changes',{event:'*',schema:'public',table:'collaboration_messages'},async()=>{await loadMessages();renderConversation()}).on('postgres_changes',{event:'*',schema:'public',table:'collaboration_projects'},load).subscribe();window.addEventListener('beforeunload',()=>client.removeChannel(channel),{once:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
