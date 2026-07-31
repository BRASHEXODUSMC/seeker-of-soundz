(()=>{
'use strict';
const panel=document.getElementById('adminPanel');const client=window.SOS_SUPABASE?.client;if(!panel||!client)return;
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const toast=(m,t='Collaboration Admin')=>window.SOS?.toast?.(m,{title:t});
const isPanel=()=>document.querySelector('.adminMenu [data-panel="collaborations"]')?.classList.contains('active');
async function render(){if(!isPanel())return;panel.innerHTML='<div class="emptyState"><h2>Loading Supabase collaboration projects…</h2></div>';
 const [{data:projects,error},{data:members},{data:messages},{data:profiles}]=await Promise.all([
  client.from('collaboration_projects').select('*').order('updated_at',{ascending:false}),
  client.from('collaboration_project_members').select('*'),
  client.from('collaboration_messages').select('id,project_id'),
  client.from('profiles').select('id,display_name,username,avatar_url,rank_name,collaboration_access,role').order('display_name')
 ]);
 if(error){panel.innerHTML=`<div class="emptyState"><h2>Collaboration Supabase patch required</h2><p>${esc(error.message)}</p><p>Run <code>patch-v4.13.20-collaboration-admin-sync.sql</code> once.</p></div>`;return}
 const names=new Map((profiles||[]).map(p=>[p.id,p]));
 const cards=(projects||[]).map(p=>{const roster=(members||[]).filter(m=>m.project_id===p.id);const count=(messages||[]).filter(m=>m.project_id===p.id).length;return `<article class="supabaseMemberCard" data-admin-collab="${p.id}"><header class="supabaseMemberHead"><div><p class="sectionEyebrow">${esc(p.stage)} · ${Number(p.progress||0)}%</p><h3>${esc(p.title)}</h3><p>${esc(p.description||'No description')}</p></div><span class="statusPill">${count} messages</span></header><div class="memberChips">${roster.map(m=>{const x=names.get(m.user_id)||{};return `<span><img src="${esc(x.avatar_url||'assets/images/sos-logo.png')}" alt="">${esc(x.display_name||x.username||'Member')} · ${esc(m.member_role)}</span>`}).join('')}</div><div class="adminMemberActions"><a class="smallAction" href="collaboration.html">Open Studio</a><button class="smallAction danger" type="button" data-delete-supabase-collab="${p.id}">Delete project</button></div></article>`}).join('');
 panel.innerHTML=`<div class="adminSectionHead"><div><p class="sectionEyebrow">Supabase Collaboration</p><h2>Projects & Private Workspaces</h2><p class="adminLead">These projects, memberships, messages, notes, stages, and audio records are live in Supabase.</p></div><button class="smallAction" data-refresh-collab-admin>Refresh</button></div><div class="supabaseMemberStats"><div><strong>${(projects||[]).length}</strong><span>Projects</span></div><div><strong>${(members||[]).length}</strong><span>Project memberships</span></div><div><strong>${(messages||[]).length}</strong><span>Private messages</span></div><div><strong>${(profiles||[]).filter(p=>p.collaboration_access||['owner','administrator'].includes(p.role)).length}</strong><span>Approved collaborators</span></div></div><div class="supabaseMemberList">${cards||'<div class="emptyState"><h3>No collaboration projects yet</h3><p>Create one from Collaboration Studio.</p></div>'}</div>`;
}
document.addEventListener('click',async e=>{if(e.target.closest('.adminMenu [data-panel="collaborations"]'))setTimeout(render,0);if(e.target.closest('[data-refresh-collab-admin]'))render();const b=e.target.closest('[data-delete-supabase-collab]');if(b){if(!confirm('Delete this collaboration project, all messages, and shared file records?'))return;const {error}=await client.from('collaboration_projects').delete().eq('id',b.dataset.deleteSupabaseCollab);if(error)return toast(error.message,'Delete failed');toast('The collaboration project was deleted from Supabase.');render()}});
new MutationObserver(()=>{if(isPanel()&&(panel.textContent.includes('Collaboration Projects')||panel.textContent.includes('Local')))render()}).observe(panel,{childList:true,subtree:false});
})();
