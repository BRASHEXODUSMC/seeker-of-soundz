/* Seeker Of SoundZ v4.17.1 — keep one forum progression module */
(()=>{
'use strict';
function isInlineModule(node){
 if(!node||node.closest('[role="dialog"],.achievementModalV41330,.forumAchievementModalV41332'))return false;
 const text=(node.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
 if(text.length<20)return false;
 return text.includes('frequency progression')||
        text.includes('forum progression')||
        (text.includes('achievements')&&(text.includes('unlocked')||text.includes('lifetime xp')||text.includes('active quests')));
}
function cleanup(){
 const keepers=[...document.querySelectorAll('#forumProgressionV417')];
 const keep=keepers[0]||null;
 keepers.slice(1).forEach(n=>n.remove());

 const candidates=[...document.querySelectorAll('main section,main aside,main article,.forumLayout section,.forumLayout aside,.forumSidebar>div,.forumSidebar>section')];
 candidates.forEach(node=>{
  if(node===keep||node.contains(keep)||!isInlineModule(node))return;
  // Do not remove the entire forum/sidebar wrapper; only self-contained progression cards.
  const rect=node.getBoundingClientRect();
  const hasOwnHeading=!!node.querySelector(':scope > h2,:scope > h3,:scope > header h2,:scope > header h3,:scope > .adminSectionHead');
  if(hasOwnHeading&&(rect.height<900||node.classList.contains('forumProgressionCard')))node.remove();
 });

 // Legacy achievement toolbar/modal code is not needed because the unified profile
 // progression modal already contains achievements, quests, titles and rankings.
 document.getElementById('forumAchievementButton')?.remove();
 document.querySelectorAll('.forumAchievementModalV41332').forEach(n=>n.remove());
}
let timer=0;
const schedule=()=>{clearTimeout(timer);timer=setTimeout(cleanup,120)};
function boot(){
 cleanup();
 const observer=new MutationObserver(schedule);
 observer.observe(document.body,{childList:true,subtree:true});
 setTimeout(cleanup,500);setTimeout(cleanup,1500);setTimeout(cleanup,3500);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();