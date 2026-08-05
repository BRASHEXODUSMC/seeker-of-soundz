/* Seeker Of SoundZ v4.19.5 — modular Members dashboard */
(()=>{
'use strict';
const dashboard=document.getElementById('memberDashboard');
if(!dashboard)return;

function activate(name){
 dashboard.querySelectorAll('[data-member-module-button]').forEach(button=>{
  const active=button.dataset.memberModuleButton===name;
  button.classList.toggle('isActive',active);
  button.setAttribute('aria-selected',String(active));
 });
 dashboard.querySelectorAll('[data-member-module-panel]').forEach(panel=>{
  panel.hidden=panel.dataset.memberModulePanel!==name;
 });
 try{sessionStorage.setItem('sos_member_module_v4195',name)}catch{}
}

function build(){
 if(dashboard.querySelector('.memberModuleShellV4195'))return true;
 const profilePreview=dashboard.querySelector(':scope > .profilePreview');
 const dashboardGrid=dashboard.querySelector(':scope > .dashboardGrid');
 const profileStudio=dashboard.querySelector(':scope > #profileStudio');
 const experienceStudio=dashboard.querySelector(':scope > [data-experience-studio="member"]');
 const logout=dashboard.querySelector(':scope > #logoutButton');
 if(!profilePreview||!dashboardGrid||!profileStudio||!experienceStudio||!logout)return false;

 const shell=document.createElement('section');
 shell.className='memberModuleShellV4195';
 shell.innerHTML=`
  <header class="memberModuleHeaderV4195">
   <div>
    <p class="sectionEyebrow">Member Frequency Hub</p>
    <h2>Your profile workspace</h2>
    <p>Open only the module you need while keeping every existing profile feature connected.</p>
   </div>
   <nav class="memberModuleNavV4195" role="tablist" aria-label="Member profile modules">
    <button type="button" data-member-module-button="overview"><i>◈</i><span><strong>Overview</strong><small>Profile and quick links</small></span></button>
    <button type="button" data-member-module-button="profile"><i>◎</i><span><strong>Profile Studio</strong><small>Identity, backgrounds and member tools</small></span></button>
    <button type="button" data-member-module-button="settings"><i>⚙</i><span><strong>Settings</strong><small>Loader, page and experience controls</small></span></button>
    <button type="button" data-member-module-button="account"><i>⌁</i><span><strong>Account</strong><small>Session and account actions</small></span></button>
   </nav>
  </header>
  <div class="memberModulePanelV4195" data-member-module-panel="overview"></div>
  <div class="memberModulePanelV4195" data-member-module-panel="profile" hidden></div>
  <div class="memberModulePanelV4195" data-member-module-panel="settings" hidden></div>
  <div class="memberModulePanelV4195" data-member-module-panel="account" hidden></div>`;
 dashboard.prepend(shell);
 const overview=shell.querySelector('[data-member-module-panel="overview"]');
 const profile=shell.querySelector('[data-member-module-panel="profile"]');
 const settings=shell.querySelector('[data-member-module-panel="settings"]');
 const account=shell.querySelector('[data-member-module-panel="account"]');

 overview.append(profilePreview,dashboardGrid);
 profile.append(profileStudio);
 settings.append(experienceStudio);
 const accountCard=document.createElement('article');
 accountCard.className='memberAccountModuleV4195';
 accountCard.innerHTML='<div><p class="sectionEyebrow">Account Session</p><h3>Manage this signed-in session</h3><p>Signing out restores the public website experience and keeps your saved account preferences ready for the next login.</p></div>';
 accountCard.append(logout);
 account.append(accountCard);

 shell.addEventListener('click',event=>{
  const button=event.target.closest('[data-member-module-button]');
  if(button)activate(button.dataset.memberModuleButton);
 });
 let initial='overview';
 try{initial=sessionStorage.getItem('sos_member_module_v4195')||'overview'}catch{}
 if(!['overview','profile','settings','account'].includes(initial))initial='overview';
 activate(initial);
 return true;
}
if(!build()){
 const observer=new MutationObserver(()=>{if(build())observer.disconnect()});
 observer.observe(dashboard,{childList:true,subtree:true});
 setTimeout(build,1200);
}
window.addEventListener('sos:session',()=>setTimeout(build,60));
})();
