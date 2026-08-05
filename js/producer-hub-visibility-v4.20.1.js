/* Seeker Of SoundZ v4.20.1 — Producer Hub visibility recovery */
(()=>{
'use strict';
const gate=document.getElementById('videoStudioGate');
const studio=document.getElementById('videoEffectsStudio');
const hub=document.getElementById('producerHubV4190');
if(!gate||!studio||!hub)return;

const allowedRoles=new Set(['owner','administrator','admin','developer','premium_member']);
let resolved=false;

function roleFrom(value){
 return String(value?.rankName||value?.rank_name||value?.role||'').toLowerCase().replace(/\s+/g,'_');
}
function reveal(){
 studio.hidden=false;
 studio.removeAttribute('hidden');
 studio.style.removeProperty('display');
 studio.style.visibility='visible';
 studio.style.opacity='1';
 hub.style.removeProperty('display');
 hub.style.visibility='visible';
 hub.style.opacity='1';
 gate.hidden=true;
 resolved=true;
 requestAnimationFrame(()=>{
  window.dispatchEvent(new Event('resize'));
  document.querySelector('#composerPreviewVideoV4180')?.dispatchEvent(new Event('loadedmetadata'));
 });
}
function showGate(){
 gate.hidden=false;
 studio.hidden=true;
 if(!gate.querySelector('[data-v4201-gate]')){
  gate.innerHTML='<div data-v4201-gate><p class="sectionEyebrow">Members Access</p><h2>Producer Hub access required</h2><p>Sign in with an Owner, Administrator, Developer, or Premium Member account to use Producer Hub.</p><a class="primaryButton" href="members.html">Open Member Login</a></div>';
 }
 resolved=true;
}
async function resolve(){
 try{
  const existing=window.SOS?.getSession?.();
  if(existing){
   if(allowedRoles.has(roleFrom(existing.profile||existing)))reveal();
   else showGate();
   return;
  }
  const client=window.SOS_SUPABASE?.client;
  if(!client)return;
  const {data}=await client.auth.getSession();
  const session=data?.session;
  if(!session){showGate();return}
  let profile=null;
  try{
   const response=await client.from('profiles').select('role,rank_name').eq('id',session.user.id).maybeSingle();
   profile=response.data;
  }catch{}
  if(allowedRoles.has(roleFrom(profile))||session.user.email?.toLowerCase()==='brashexodus@gmail.com')reveal();
  else showGate();
 }catch(error){
  console.error('[Producer Hub visibility]',error);
 }
}
window.addEventListener('sos:session',event=>{
 const value=event.detail||window.SOS?.getSession?.();
 if(value&&allowedRoles.has(roleFrom(value.profile||value)))reveal();
});
resolve();
setTimeout(()=>{if(!resolved&&studio.hidden===false)reveal()},1200);
setTimeout(()=>{
 if(!resolved){
  const session=window.SOS?.getSession?.();
  if(session&&allowedRoles.has(roleFrom(session.profile||session)))reveal();
  else if(!session)showGate();
 }
},3500);
})();
