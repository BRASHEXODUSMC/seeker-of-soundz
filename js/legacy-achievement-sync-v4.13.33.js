/* Seeker Of SoundZ v4.13.33 — original achievement synchronization */
(()=>{
'use strict';
const client=window.SOS_SUPABASE?.client;if(!client)return;
let channel=null,timer=0,running=false,lastSessionId='';
async function sync(){
 clearTimeout(timer);
 timer=setTimeout(async()=>{
  if(running)return;running=true;
  try{
   const {data}=await client.auth.getSession();
   const user=data.session?.user;
   if(!user)return;
   lastSessionId=user.id;
   const q=await client.rpc('sync_my_legacy_achievements');
   if(q.error)console.warn('[Legacy achievements]',q.error);
  }finally{running=false}
 },280);
}
async function subscribe(){
 if(channel)await client.removeChannel(channel);
 const {data}=await client.auth.getSession();
 if(!data.session)return;
 channel=client.channel(`legacy-achievements-${data.session.user.id}`)
  .on('postgres_changes',{event:'*',schema:'public',table:'forum_topics'},sync)
  .on('postgres_changes',{event:'*',schema:'public',table:'forum_replies'},sync)
  .on('postgres_changes',{event:'*',schema:'public',table:'forum_reactions'},sync)
  .on('postgres_changes',{event:'UPDATE',schema:'public',table:'profiles',filter:`id=eq.${data.session.user.id}`},sync)
  .subscribe();
}
async function boot(){await sync();await subscribe()}
window.addEventListener('sos:supabase-session',async e=>{
 const id=e.detail?.id||'';
 if(id!==lastSessionId){lastSessionId=id;await sync();await subscribe()}
});
window.addEventListener('focus',sync);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();