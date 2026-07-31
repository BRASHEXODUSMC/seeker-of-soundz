/* Seeker Of SoundZ v4.13.24 — backup Collaboration Studio UI + Supabase data */
(()=>{
'use strict';
const client=window.SOS_SUPABASE?.client;
const gate=document.getElementById('collabGate');
const app=document.getElementById('collabApp');
if(!gate||!app)return;
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const toast=(m,t='Collaboration Studio')=>window.SOS?.toast?.(m,{title:t});
const stages=[
 {name:'Idea',progress:0},{name:'Writing',progress:10},{name:'Recording',progress:20},{name:'Production',progress:35},
 {name:'Sound Design',progress:45},{name:'Arrangement',progress:55},{name:'Mixing',progress:70},{name:'Mastering',progress:82},
 {name:'Review',progress:90},{name:'Approved',progress:95},{name:'Ready for Release',progress:98},{name:'Released',progress:100},
 {name:'On Hold',progress:50},{name:'Archived',progress:100}
];
let user=null,profile=null,projects=[],selected=null,messages=[];
let profiles=new Map(),membersByProject=new Map(),sortMode='oldest';
const display=p=>p?.display_name||p?.username||'Member';
const avatar=p=>p?.avatar_url||'assets/images/sos-logo.png';
const safeName=n=>String(n||'audio').replace(/[^a-zA-Z0-9._-]+/g,'-').slice(-120);
const projectMembers=p=>(membersByProject.get(p?.id)||[]).map(m=>({...profiles.get(m.user_id),member_role:m.member_role,user_id:m.user_id})).filter(x=>x.id||x.user_id);
const canManage=p=>Boolean(p&&(p.created_by===user.id||['owner','administrator'].includes(profile?.role)));
const nearestStage=value=>stages.filter(s=>!['On Hold','Archived'].includes(s.name)).reduce((best,s)=>Math.abs(s.progress-value)<Math.abs(best.progress-value)?s:best,stages[0]);

async function auth(){
 if(!client){gate.hidden=false;gate.innerHTML='<h2>Supabase connection required</h2><p>Collaboration Studio requires the configured Supabase project.</p>';return false}
 const {data}=await client.auth.getSession();user=data.session?.user||null;
 if(!user){gate.hidden=false;gate.innerHTML='<h2>Member access required</h2><p>Sign in to open your private collaboration workspace.</p><a class="primaryButton" href="members.html">Open Member Login</a>';return false}
 const {data:p,error}=await client.from('profiles').select('id,username,display_name,avatar_url,role,rank_name,collaboration_access,is_banned').eq('id',user.id).single();
 if(error||!p){gate.hidden=false;gate.innerHTML='<h2>Profile unavailable</h2><p>Your Supabase profile could not be loaded.</p>';return false}
 profile=p;
 if(p.is_banned||(!p.collaboration_access&&!['owner','administrator'].includes(p.role))){gate.hidden=false;gate.innerHTML='<h2>Private collaboration access</h2><p>An Owner or Administrator must enable Collaboration Studio access.</p><a class="primaryButton" href="contact.html?type=Collaboration">Request Access</a>';return false}
 gate.hidden=true;app.hidden=false;return true;
}
async function fetchProfiles(){
 const {data,error}=await client.rpc('collaboration_list_eligible_members');
 if(error)throw error;
 profiles=new Map((data||[]).map(p=>[p.id,p]));
 if(!profiles.has(profile.id))profiles.set(profile.id,profile);
}
async function loadData(){
 const [{data:pr,error:pe},{data:pm,error:me}]=await Promise.all([
  client.from('collaboration_projects').select('*').order('created_at',{ascending:true}),
  client.from('collaboration_project_members').select('*')
 ]);
 if(pe||me)throw pe||me;
 projects=pr||[];membersByProject=new Map();
 (pm||[]).forEach(m=>{if(!membersByProject.has(m.project_id))membersByProject.set(m.project_id,[]);membersByProject.get(m.project_id).push(m)});
 if(selected)selected=projects.find(p=>p.id===selected.id)||null;
 const requestedProject=new URLSearchParams(location.search).get('project');
  if(!selected&&requestedProject)selected=projects.find(p=>p.id===requestedProject)||null;
  if(!selected&&projects.length)selected=projects[0];
 await loadMessages();
}
async function loadMessages(){
 if(!selected){messages=[];return}
 const {data,error}=await client.from('collaboration_messages').select('*').eq('project_id',selected.id).order('created_at');
 if(error)throw error;messages=data||[];
}
function approvedPeople(){return [...profiles.values()].filter(p=>p.collaboration_access||['owner','administrator'].includes(p.role));}
function sortedProjects(){
 const rows=[...projects];
 if(sortMode==='newest')rows.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
 else if(sortMode==='updated')rows.sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at));
 else if(sortMode==='az')rows.sort((a,b)=>a.title.localeCompare(b.title));
 else if(sortMode==='za')rows.sort((a,b)=>b.title.localeCompare(a.title));
 else rows.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
 return rows;
}
function ensureBackupUI(){
 const sidebar=$('.collabSidebar'); const inspector=$('.collabInspector');
 if(!$('#collabProjectSort')){
  const tools=document.createElement('div');tools.className='collabSortTools';
  tools.innerHTML='<label>Project order<select id="collabProjectSort"><option value="updated">Recently updated</option><option value="newest">Newest created</option><option value="oldest">Oldest created</option><option value="az">Name A–Z</option><option value="za">Name Z–A</option></select></label>';
  $('#projectList').before(tools);$('#collabProjectSort').value=sortMode;$('#collabProjectSort').addEventListener('change',e=>{sortMode=e.target.value;renderProjects()});
 }
 if(!$('#collabMemberManager')){
  const manager=document.createElement('section');manager.id='collabMemberManager';manager.className='collabMemberManager';
  manager.innerHTML='<div class="collabManagerHead"><div><p class="sectionEyebrow">Project Access</p><h3>Manage collaborators</h3></div><span class="statusPill">Owner / Admin</span></div><div id="collabMemberChoices" class="collabMemberChoices"></div>';
  inspector.prepend(manager);
 }
 if(!$('#collabAccessRoster')){
  const roster=document.createElement('section');roster.id='collabAccessRoster';roster.className='collabAccessRoster';
  roster.innerHTML='<div class="collabManagerHead"><div><p class="sectionEyebrow">Studio Directory</p><h3>People with collaboration access</h3></div><span class="statusPill" id="collabAccessCount">0 people</span></div><div id="collabAccessRosterList" class="collabAccessRosterList"></div>';
  $('#collabMemberManager').after(roster);
 }
 if(!$('#collabProgressPanel')){
  const panel=document.createElement('section');panel.id='collabProgressPanel';panel.className='collabProgressPanel';
  panel.innerHTML='<div class="collabProgressHead"><div><p class="sectionEyebrow">Completion</p><h3>Project progression</h3></div><strong id="collabProgressValue">0%</strong></div><div class="collabProgressTrack"><i id="collabProgressFill"></i></div><input id="collabProgressRange" type="range" min="0" max="100" step="1" value="0"><div id="collabProgressMilestones" class="collabProgressMilestones"></div><div id="collabProgressState" class="collabProgressState">Idea</div>';
  $('#collabAccessRoster').after(panel);
  $('#collabProgressRange').addEventListener('input',e=>updateProgressVisual(Number(e.target.value)));
  $('#collabProgressRange').addEventListener('change',e=>{const v=Number(e.target.value);const s=nearestStage(v);void updateProject({progress:v,stage:s.name})});
 }
 if(!$('#deleteProjectButton')){
  const actions=document.createElement('div');actions.className='collabProjectActions';actions.innerHTML='<button class="smallAction dangerAction" id="deleteProjectButton" type="button">Remove Project</button>';inspector.append(actions);
 }
 if(!$('#collabProjectModal')){
  const modal=document.createElement('div');modal.id='collabProjectModal';modal.className='collabModal';modal.hidden=true;
  modal.innerHTML='<div class="collabModalBackdrop" data-close-project-modal></div><section class="collabModalCard" role="dialog" aria-modal="true"><button class="collabModalClose" type="button" data-close-project-modal>×</button><div class="collabModalGlow"></div><p class="sectionEyebrow">New Creative Workspace</p><h2>Create a collaboration project</h2><p class="collabModalIntro">Give every release its own private conversation, team, notes, audio versions, and production progression.</p><form id="newCollabProjectForm" class="collabProjectForm"><label>Project name<input name="title" maxlength="80" placeholder="Midnight Frequency" required></label><label>First collaborator<select name="collaboratorId"><option value="">Create solo project</option></select></label><label>Starting stage<select name="stage"></select></label><label class="collabFormWide">Project notes<textarea name="notes" maxlength="1200" placeholder="Describe the idea, BPM, deadline, references, or first production goal..."></textarea></label><div class="collabModalActions collabFormWide"><button class="smallAction" type="button" data-close-project-modal>Cancel</button><button class="primaryButton" type="submit">Create Project</button></div></form></section>';
  document.body.appendChild(modal);
  $('#newCollabProjectForm').addEventListener('submit',e=>{e.preventDefault();void createProject(Object.fromEntries(new FormData(e.currentTarget)))});
 }
 const notice=$('.backendNotice');if(notice)notice.innerHTML='<strong>Supabase workspace</strong><br>Projects, messages, collaborators, notes, progress, and private audio versions are synchronized with Supabase.';
}
function populateModal(invited=''){
 const f=$('#newCollabProjectForm');if(!f)return;
 f.elements.stage.innerHTML=stages.filter(s=>!['On Hold','Archived'].includes(s.name)).map(s=>`<option value="${esc(s.name)}">${esc(s.name)}</option>`).join('');
 f.elements.collaboratorId.innerHTML='<option value="">Create solo project</option>'+approvedPeople().filter(p=>p.id!==user.id).map(p=>`<option value="${esc(p.id)}">${esc(display(p))} — ${esc(p.rank_name||'New Listener')}</option>`).join('');
 if(invited)f.elements.collaboratorId.value=invited;
}
function openModal(invited=''){populateModal(invited);const m=$('#collabProjectModal');m.hidden=false;requestAnimationFrame(()=>m.classList.add('open'));document.body.classList.add('collabModalOpen');setTimeout(()=>$('#newCollabProjectForm input[name="title"]')?.focus(),60)}
function closeModal(){const m=$('#collabProjectModal');if(!m)return;m.classList.remove('open');document.body.classList.remove('collabModalOpen');setTimeout(()=>m.hidden=true,220)}
function renderContacts(){
 const host=$('#contactList');const rows=approvedPeople().filter(p=>p.id!==user.id);
 host.innerHTML=rows.length?rows.map(p=>`<button class="collabContact" type="button" data-new-with="${esc(p.id)}"><img src="${esc(avatar(p))}" alt=""><span><strong>${esc(display(p))}</strong><small>${esc(p.role||'member')}${p.rank_name?' • '+esc(p.rank_name):''}</small></span></button>`).join(''):'<div class="emptyState">No other approved collaborators yet.</div>';
}
function renderProjects(){
 const host=$('#projectList');const rows=sortedProjects();
 host.innerHTML=rows.length?rows.map(p=>{const count=messages.filter(m=>m.project_id===p.id).length;const memberCount=projectMembers(p).length;return `<button class="collabProjectCard ${selected?.id===p.id?'active':''}" type="button" data-project="${p.id}"><div class="projectCardTop"><strong>${esc(p.title)}</strong><small>${count} message${count===1?'':'s'}</small></div><div class="projectMiniProgress"><i style="width:${Number(p.progress||0)}%"></i></div><div class="projectCardMeta"><span class="statusPill">${esc(p.stage||'Idea')}</span><small>${Number(p.progress||0)}% • ${memberCount} member${memberCount===1?'':'s'}</small></div></button>`}).join(''):'<div class="collabProjectEmpty"><p>No projects yet.</p><button class="primaryButton" type="button" data-open-project-modal>Create Your First Project</button></div>';
}
async function signedUrl(path){if(!path)return'';const {data}=await client.storage.from('collaboration-files').createSignedUrl(path,3600);return data?.signedUrl||''}
function renderConversation(){
 const title=$('#conversationTitle'),sub=$('#conversationSubtitle'),status=$('#activeProjectStatus'),host=$('#collabMessages');
 if(!selected){title.textContent='Choose an artist';sub.textContent='Select a member or create a project to begin.';status.textContent='No project selected';host.innerHTML='<div class="collabEmpty">Choose an artist or project to begin.</div>';return}
 const mem=projectMembers(selected);title.textContent=selected.title;sub.textContent=`${mem.length} collaborator${mem.length===1?'':'s'} • Separate project conversation`;status.textContent=`${selected.stage||'Idea'} • ${Number(selected.progress||0)}%`;
 host.innerHTML=messages.length?messages.map(m=>{const p=profiles.get(m.sender_id)||{};return `<article class="collabBubble ${m.sender_id===user.id?'mine':''}"><header><strong>${m.sender_id===user.id?'You':esc(display(p))}</strong><time>${new Date(m.created_at).toLocaleString()}</time></header>${m.body?`<p>${esc(m.body)}</p>`:''}${m.attachment_path?`<div class="collabAttachment" data-attachment="${esc(m.attachment_path)}"><button class="smallAction" type="button" data-load-audio="${m.id}">Load ${esc(m.attachment_name||'audio')}</button></div>`:''}</article>`}).join(''):'<div class="collabEmpty">This project chat is empty. Share an idea, update, or audio version.</div>';
 host.scrollTop=host.scrollHeight;
}
function renderManager(){
 const host=$('#collabMemberChoices');if(!selected){host.innerHTML='<div class="emptyState">Select a project to manage its team.</div>';return}
 const current=new Set((membersByProject.get(selected.id)||[]).map(m=>m.user_id));const editable=canManage(selected);
 host.innerHTML=approvedPeople().map(p=>{const added=current.has(p.id),locked=p.id===selected.created_by;return `<article class="collabMemberChoice ${added?'isAdded':''}"><img src="${esc(avatar(p))}" alt=""><div><strong>${esc(display(p))}</strong><small>${esc(p.role||'member')}${p.rank_name?' • '+esc(p.rank_name):''}</small></div><button type="button" class="smallAction ${added&&!locked?'dangerAction':''}" data-member-toggle="${p.id}" ${!editable||locked?'disabled':''}>${locked?'Owner':added?'Remove':'Add'}</button></article>`}).join('');
}
function renderRoster(){
 const host=$('#collabAccessRosterList'),rows=approvedPeople();$('#collabAccessCount').textContent=`${rows.length} ${rows.length===1?'person':'people'}`;
 host.innerHTML=rows.map(p=>{const count=projects.filter(pr=>projectMembers(pr).some(x=>(x.id||x.user_id)===p.id)).length;return `<button class="collabRosterPerson ${p.id===user.id?'isYou':''}" type="button" data-new-with="${p.id}"><img src="${esc(avatar(p))}" alt=""><div><strong>${esc(display(p))}${p.id===user.id?' (You)':''}</strong><small>${esc(p.role==='administrator'?'Administrator':p.role==='owner'?'Owner':'Approved collaborator')} • ${count} project${count===1?'':'s'}</small></div><span class="collabOnlineDot" title="Has studio access"></span></button>`}).join('');
}
function updateProgressVisual(value){
 value=Math.max(0,Math.min(100,Number(value)||0));$('#collabProgressValue').textContent=`${value}%`;$('#collabProgressFill').style.width=`${value}%`;if(document.activeElement!==$('#collabProgressRange'))$('#collabProgressRange').value=String(value);const s=selected?.stage==='On Hold'?{name:'On Hold'}:nearestStage(value);$('#collabProgressState').textContent=s.name;
 $('#collabProgressMilestones').innerHTML=stages.filter(s=>!['On Hold','Archived'].includes(s.name)).map(s=>`<button class="collabMilestoneTick ${value>=s.progress?'reached':''}" type="button" style="left:${s.progress}%" title="${esc(s.name)}" data-progress-jump="${s.progress}" data-stage-jump="${esc(s.name)}"></button>`).join('');
 $('#collabProgressRange').disabled=!canManage(selected)||selected?.stage==='On Hold';
}
function renderInspector(){
 $('#projectTitle').textContent=selected?.title||'Project Details';
 $('#statusGrid').innerHTML=stages.map(s=>`<button type="button" class="statusButton ${selected?.stage===s.name?'active':''}" data-stage="${esc(s.name)}" data-progress="${s.progress}" ${selected&&canManage(selected)?'':'disabled'}>${esc(s.name)}</button>`).join('');
 $('#projectNotes').value=selected?.notes||'';$('#projectNotes').disabled=!selected||!canManage(selected);$('#saveNotes').disabled=!selected||!canManage(selected);
 $('#projectMembers').innerHTML=selected?projectMembers(selected).map(p=>`<span class="memberChip">${esc(display(p))}</span>`).join(''):'<span class="memberChip">No collaborators selected</span>';
 const files=messages.filter(m=>m.attachment_path).slice().reverse();$('#projectFiles').innerHTML=selected?(files.length?files.map((m,i)=>`<article class="adminListItem collabAudioHistoryItem"><div class="collabVersionMeta"><span class="collabVersionBadge">v${files.length-i}</span><div><strong>${esc(m.attachment_name||'Audio file')}</strong><small>${new Date(m.created_at).toLocaleString()}</small></div></div><button class="smallAction" type="button" data-download-audio="${m.id}">Open securely</button></article>`).join(''):'<div class="emptyState">No audio versions yet. Drag an audio file into the reply composer to begin version history.</div>'):'<div class="emptyState">No project selected.</div>';
 $('#deleteProjectButton').hidden=!canManage(selected);renderManager();renderRoster();updateProgressVisual(Number(selected?.progress||0));
}
function renderAll(){renderContacts();renderProjects();renderConversation();renderInspector();}
async function createProject(v){
 const title=String(v.title||'').trim();if(!title)return toast('Enter a project name.');const stage=stages.find(s=>s.name===v.stage)||stages[0];
 const {data:p,error}=await client.from('collaboration_projects').insert({title,description:String(v.notes||''),notes:String(v.notes||''),stage:stage.name,progress:stage.progress,created_by:user.id}).select().single();if(error)return toast(error.message,'Project creation failed');
 const rows=[{project_id:p.id,user_id:user.id,member_role:'Project Owner'}];if(v.collaboratorId&&v.collaboratorId!==user.id)rows.push({project_id:p.id,user_id:v.collaboratorId,member_role:'Collaborator'});
 const {error:me}=await client.from('collaboration_project_members').insert(rows);if(me){await client.from('collaboration_projects').delete().eq('id',p.id);return toast(me.message,'Project creation failed')}
 selected=p;closeModal();await refresh();toast('Project created in Supabase.');
}
async function updateProject(values){if(!selected)return;const {error}=await client.from('collaboration_projects').update({...values,updated_at:new Date().toISOString()}).eq('id',selected.id);if(error)return toast(error.message,'Project update failed');Object.assign(selected,values);renderAll();}
async function toggleMember(id){
 if(!selected||!canManage(selected))return;const rows=membersByProject.get(selected.id)||[];const exists=rows.find(m=>m.user_id===id);if(exists){const {error}=await client.from('collaboration_project_members').delete().eq('project_id',selected.id).eq('user_id',id);if(error)return toast(error.message,'Could not remove collaborator')}else{const {error}=await client.from('collaboration_project_members').insert({project_id:selected.id,user_id:id,member_role:'Collaborator'});if(error)return toast(error.message,'Could not add collaborator')}await refresh();
}
async function deleteProject(){if(!selected||!canManage(selected))return;if(!confirm(`Remove “${selected.title}” and its private messages?`))return;const id=selected.id;const {error}=await client.from('collaboration_projects').delete().eq('id',id);if(error)return toast(error.message,'Project could not be removed');selected=null;await refresh();toast('Project removed.');}
async function sendMessage(form){if(!selected)return toast('Choose a project first.');const body=form.elements.message.value.trim(),file=$('#messageFile').files[0];if(!body&&!file)return;let att={};if(file){const path=`${selected.id}/${user.id}/${crypto.randomUUID()}-${safeName(file.name)}`;const {error}=await client.storage.from('collaboration-files').upload(path,file,{contentType:file.type||'application/octet-stream'});if(error)return toast(error.message,'Audio upload failed');att={attachment_path:path,attachment_name:file.name,attachment_type:file.type,attachment_size:file.size}}
 const {error}=await client.from('collaboration_messages').insert({project_id:selected.id,sender_id:user.id,body,...att});if(error)return toast(error.message,'Message failed');await client.from('collaboration_projects').update({updated_at:new Date().toISOString()}).eq('id',selected.id);form.reset();$('#attachmentPreview').textContent='No audio selected';await loadMessages();renderAll();}
async function openAudio(id){const m=messages.find(x=>x.id===id);if(!m)return;const url=await signedUrl(m.attachment_path);if(!url)return toast('Could not create a secure audio link.');window.open(url,'_blank','noopener');}
async function refresh(){await Promise.all([fetchProfiles(),loadData()]);renderAll();populateModal();}
function bind(){
 $('#newProjectButton').addEventListener('click',()=>openModal());$('#messageForm').addEventListener('submit',e=>{e.preventDefault();void sendMessage(e.currentTarget)});$('#messageFile').addEventListener('change',e=>{$('#attachmentPreview').textContent=e.target.files[0]?.name||'No audio selected'});$('#saveNotes').addEventListener('click',()=>void updateProject({notes:$('#projectNotes').value.trim()}));$('#deleteProjectButton').addEventListener('click',()=>void deleteProject());
 document.addEventListener('click',async e=>{let b=e.target.closest('[data-close-project-modal]');if(b)return closeModal();b=e.target.closest('[data-open-project-modal]');if(b)return openModal();b=e.target.closest('[data-project]');if(b){selected=projects.find(p=>p.id===b.dataset.project)||null;await loadMessages();renderAll();return}b=e.target.closest('[data-new-with]');if(b)return openModal(b.dataset.newWith);b=e.target.closest('[data-stage]');if(b)return void updateProject({stage:b.dataset.stage,progress:Number(b.dataset.progress)});b=e.target.closest('[data-progress-jump]');if(b)return void updateProject({stage:b.dataset.stageJump,progress:Number(b.dataset.progressJump)});b=e.target.closest('[data-member-toggle]');if(b)return void toggleMember(b.dataset.memberToggle);b=e.target.closest('[data-load-audio],[data-download-audio]');if(b)return void openAudio(b.dataset.loadAudio||b.dataset.downloadAudio)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#collabProjectModal').hidden)closeModal()});
}
async function boot(){if(!await auth())return;ensureBackupUI();bind();try{await refresh()}catch(e){console.error(e);toast(e.message,'Collaboration could not load')}
 const ch=client.channel(`collab-backup-ui-${user.id}`).on('postgres_changes',{event:'*',schema:'public',table:'collaboration_messages'},refresh).on('postgres_changes',{event:'*',schema:'public',table:'collaboration_projects'},refresh).on('postgres_changes',{event:'*',schema:'public',table:'collaboration_project_members'},refresh).on('postgres_changes',{event:'UPDATE',schema:'public',table:'profiles'},refresh).subscribe();window.addEventListener('beforeunload',()=>client.removeChannel(ch),{once:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
