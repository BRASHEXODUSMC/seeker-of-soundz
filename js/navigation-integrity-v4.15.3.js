/* Seeker Of SoundZ v4.15.3 — navigation/account integrity guard */
(()=>{
'use strict';
function keepOne(selector){
 const nodes=[...document.querySelectorAll(selector)];
 if(nodes.length<2)return;
 const keep=nodes.find(n=>n.offsetParent!==null)||nodes[0];
 nodes.forEach(n=>{if(n!==keep)n.remove()});
}
function dedupeLinks(){
 document.querySelectorAll('.navLinks').forEach(nav=>{
  const seen=new Set();
  [...nav.querySelectorAll('a[href]')].forEach(link=>{
   const key=new URL(link.getAttribute('href'),location.href).pathname.replace(/\/index\.html$/,'/');
   if(seen.has(key))link.remove();else seen.add(key);
  });
 });
 const account=document.getElementById('accountContent');
 if(account){
  const seen=new Set();
  [...account.querySelectorAll('a[href],button')].forEach(item=>{
   const key=item.tagName==='A'?`a:${item.getAttribute('href')}`:`b:${item.id||item.textContent.trim()}`;
   if(seen.has(key))item.remove();else seen.add(key);
  });
 }
}
function audit(){
 ['#mainNav','#cartButton','#accountButton','#notificationButton','#globalSearchButton','#cartDrawer','#accountDrawer','#sosNotificationPanel'].forEach(keepOne);
 dedupeLinks();
}
let timer=0;
const schedule=()=>{clearTimeout(timer);timer=setTimeout(audit,80)};
function boot(){
 audit();
 const observer=new MutationObserver(schedule);
 observer.observe(document.body,{childList:true,subtree:true});
 window.addEventListener('pageshow',audit);
 setTimeout(audit,700);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();