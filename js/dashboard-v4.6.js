(()=>{
"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmtDate=value=>{const d=new Date(value||Date.now());return Number.isNaN(d.getTime())?"Recent":d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:d.getFullYear()!==new Date().getFullYear()?"numeric":undefined})};
const arr=(key,fallback=[])=>window.SOS?.read?.(key,fallback)||fallback;
function storagePercent(){try{let bytes=0;for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i)||"";bytes+=(k.length+(localStorage.getItem(k)||"").length)*2}return Math.min(99,Math.max(1,Math.round(bytes/(5*1024*1024)*100)))}catch{return 0}}
function userStats(s){
 const posts=arr(SOS.K.posts),projects=arr("sos_collab_projects_v1"),notifications=arr(SOS.K.notifications),seen=arr(`sos_seen_achievements_${s.id}`);
 const mine=posts.filter(p=>p.authorId===s.id||p.author===s.displayName);
 const replies=posts.flatMap(p=>(p.replies||[]).map(r=>({...r,parentTitle:p.title}))).filter(r=>r.authorId===s.id||r.author===s.displayName);
 const myProjects=projects.filter(p=>p.ownerId===s.id||(p.memberIds||p.members||[]).includes(s.id)||(p.collaborators||[]).some(x=>(x.id||x)===s.id));
 const unread=notifications.filter(n=>n.userId===s.id&&!n.seen).length;
 const achievements=[...new Set(seen)];
 return {posts,mine,replies,myProjects,unread,achievements};
}
function activityItems(s,st){
 const items=[
  ...st.mine.map(p=>({icon:"💬",title:`Created “${p.title||"Forum discussion"}”`,meta:"Forum discussion",date:p.updatedAt||p.date||p.createdAt})),
  ...st.replies.map(r=>({icon:"↩",title:`Replied to “${r.parentTitle||"a discussion"}”`,meta:"Forum reply",date:r.date||r.createdAt})),
  ...st.myProjects.map(p=>({icon:"🎚",title:`Worked on “${p.title||p.name||"Collaboration project"}”`,meta:p.stage||p.status||"Collaboration project",date:p.updatedAt||p.createdAt||p.date}))
 ];
 return items.sort((a,b)=>new Date(b.date||0)-new Date(a.date||0)).slice(0,6);
}
function makeAccess(s){
 const admin=String(s.role||"").toLowerCase()==="admin"||/administrator|admin/i.test(String(s.customRole||s.roleLabel||""));
 const collab=admin||s.collaborationAccess,vip=!!s.paidMember,founder=admin;
 const rows=[
  ["◉","Member Account",s.email||"Signed in",true,"Active","active"],
  ["🤝","Collaboration Studio",collab?"Projects, chats and shared audio":"Awaiting administrator approval",collab,collab?"Approved":"Locked",collab?"active":""],
  ["💎","VIP Music Vault",vip?"Premium releases and downloads":"Free membership access",vip,vip?"Active":"Free",vip?"active":""],
  ["🛡","Administrator",admin?"Full site-management access":"Standard community permissions",admin,admin?"Full access":"Member",admin?"admin":""],
 ];
 if(founder)rows.push(["★","Founder","Owner-level profile status",true,"Enabled","founder"]);
 return rows.map(([icon,title,copy,on,status,cls])=>`<div class="accessLevelV46 ${cls}"><span class="accessDotV46">${icon}</span><div><strong>${esc(title)}</strong><small>${esc(copy)}</small></div><em>${esc(status)}</em></div>`).join("");
}
function makeActions(s){
 const actions=[
  ["💬","Forums","Read and join discussions","forums.html"],
  ["🎵","Music Vault","Browse releases and downloads","music.html#musicStore"],
  ["🛒","Saved Cart","Review saved merchandise","#open-cart-v46"],
  ["⚙","Profile Settings","Update your public profile","#profileStudio"]
 ];
 if(String(s.role||"").toLowerCase()==="admin"||s.collaborationAccess)actions.unshift(["🤝","Collaboration Studio","Open projects and shared files","collaboration.html"]);
 if(String(s.role||"").toLowerCase()==="admin")actions.unshift(["🛡","Admin Dashboard","Manage the full website","admin.html"]);
 return actions.map(([icon,title,copy,url])=>`<a class="quickActionV46" href="${url}"><span>${icon}</span><div><strong>${esc(title)}</strong><small>${esc(copy)}</small></div></a>`).join("");
}
function makeProjects(projects){
 if(!projects.length)return '<p class="emptyState">Your active collaboration projects will appear here after you are added to one.</p>';
 return projects.slice().sort((a,b)=>new Date(b.updatedAt||b.createdAt||0)-new Date(a.updatedAt||a.createdAt||0)).slice(0,3).map(p=>{const n=Math.max(0,Math.min(100,Number(p.progress??p.completion??0)||0));return `<a class="projectMiniV46" href="collaboration.html"><header><h4>${esc(p.title||p.name||"Untitled Project")}</h4><span>${n}%</span></header><p>${esc(p.stage||p.status||"In production")}</p><div class="projectBarV46"><i style="width:${n}%"></i></div></a>`}).join("");
}
function render(){
 const dash=document.getElementById("memberDashboard"),s=window.SOS?.getSession?.();if(!dash||!s||dash.hidden)return;
 dash.querySelectorAll(".profileStatsV45,.profileActivityV45,.dashboardV46").forEach(x=>x.remove());
 const preview=dash.querySelector(".profilePreview");if(!preview)return;
 const st=userStats(s),activities=activityItems(s,st),storage=storagePercent();
 const name=preview.querySelector("#dashboardName");if(name){name.classList.add("profileWelcomeV46");name.innerHTML=`Welcome back,<span>${esc(s.displayName||"Member")}</span><small>${esc(s.tagline||"Your Seeker Of SoundZ command center")}</small>`}
 const email=preview.querySelector("#dashboardEmail");if(email)email.textContent=s.email||"Member profile";
 let status=preview.querySelector(".profileStatusLine");if(!status){status=document.createElement("div");status.className="profileStatusLine";email?.after(status)}
 const admin=String(s.role||"").toLowerCase()==="admin"||/administrator|admin/i.test(String(s.customRole||s.roleLabel||""));
 status.innerHTML=`<span class="statusOnline">● Online</span><span>${admin?"🔴 Administrator":"◉ Member"}</span>${admin?"<span>⭐ Founder</span>":""}${admin||s.collaborationAccess?"<span>🤝 Collaboration approved</span>":""}${s.paidMember?"<span>💎 VIP active</span>":""}`;
 const totalForum=st.mine.length+st.replies.length;
 const stats=document.createElement("section");stats.className="profileStatsV46 dashboardV46";stats.innerHTML=[
  [st.unread,"Unread"],[st.myProjects.length,"Collaborations"],[st.replies.length,"Forum replies"],[st.achievements.length,"Achievements"],[`${storage}%`,"Storage used"],[s.paidMember?"VIP":"Free","Vault status"]
 ].map(([v,l])=>`<div class="profileStatV46"><strong>${esc(v)}</strong><small>${esc(l)}</small></div>`).join("");
 preview.after(stats);
 const command=document.createElement("section");command.className="profileCommandGridV46 dashboardV46";command.innerHTML=`
  <article class="profilePanelV46"><div class="profilePanelHeadV46"><div><p class="sectionEyebrow">Permissions</p><h3>Access Levels</h3></div><span class="profilePanelIconV46">✦</span></div><div class="accessLevelsV46">${makeAccess(s)}</div></article>
  <article class="profilePanelV46"><div class="profilePanelHeadV46"><div><p class="sectionEyebrow">Command center</p><h3>Quick Actions</h3></div><span class="profilePanelIconV46">⚡</span></div><div class="quickActionsV46">${makeActions(s)}</div></article>`;
 stats.after(command);
 const lower=document.createElement("section");lower.className="profileLowerGridV46 dashboardV46";
 const activity=activities.length?activities.map(i=>`<div class="activityItemV46"><span>${i.icon}</span><div><strong>${esc(i.title)}</strong><small>${esc(i.meta)}</small></div><time>${fmtDate(i.date)}</time></div>`).join(""):'<p class="emptyState">New forum replies, achievements and project updates will appear here.</p>';
 const featured=st.achievements.at(-1)||"First Frequency";const pct=Math.min(100,Math.max(8,Math.round((st.achievements.length/90)*100)));
 lower.innerHTML=`<article class="profilePanelV46"><div class="profilePanelHeadV46"><div><p class="sectionEyebrow">Recent activity</p><h3>Since your last visit</h3></div><span class="profilePanelIconV46">↻</span></div><div class="activityListV46">${activity}</div></article><article class="profilePanelV46 featuredAchievementV46"><div class="profilePanelHeadV46"><div><p class="sectionEyebrow">Featured badge</p><h3>Newest Achievement</h3></div><button type="button" class="profilePanelIconV46 achievementOpenButtonV41330" data-open-achievements aria-label="Open Achievement Hall" title="Open Achievement Hall">🏆</button></div><div class="achievementOrbV46">${st.achievements.length?"🏆":"✦"}</div><h4>${esc(featured)}</h4><p>${st.achievements.length?"Your newest unlocked milestone is featured here.":"Join discussions and collaborate to begin unlocking achievements."}</p><div class="achievementProgressV46"><i style="width:${pct}%"></i></div><div class="achievementProgressTextV46"><span>${st.achievements.length} unlocked</span><span>Next milestone</span></div></article>`;
 command.after(lower);
 const projects=document.createElement("section");projects.className="profilePanelV46 currentProjectsV46 dashboardV46";projects.innerHTML=`<div class="profilePanelHeadV46"><div><p class="sectionEyebrow">Production</p><h3>Current Projects</h3></div>${st.myProjects.length?'<a class="secondaryButton" href="collaboration.html">View all</a>':''}</div><div class="projectCardsV46">${makeProjects(st.myProjects)}</div>`;
 lower.after(projects);
 dash.querySelector('[href="#open-cart-v46"]')?.addEventListener("click",e=>{e.preventDefault();document.getElementById("cartDrawer")?.classList.add("open")});
 dash.querySelector('[href="#profileStudio"]')?.addEventListener("click",e=>{e.preventDefault();document.getElementById("profileStudio")?.scrollIntoView({behavior:"smooth",block:"start"})});
}
window.addEventListener("DOMContentLoaded",()=>setTimeout(render,80));
window.addEventListener("storage",render);
window.addEventListener("sos:session",render);
document.addEventListener("click",e=>{if(e.target.closest("#loginForm button,#registerForm button,[data-demo-login]"))setTimeout(render,250)});
setTimeout(render,450);
})();
