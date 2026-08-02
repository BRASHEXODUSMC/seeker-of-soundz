/* Seeker Of SoundZ v4.13.35 — reliable topic and reply reaction display */
(()=>{
'use strict';
if(window.__SOS_FORUM_REACTIONS_V41335__)return;
window.__SOS_FORUM_REACTIONS_V41335__=true;

const REACTIONS=Object.freeze([
 {key:'heart',emoji:'❤️',label:'Love'},
 {key:'fire',emoji:'🔥',label:'Fire'},
 {key:'clap',emoji:'👏',label:'Applause'},
 {key:'laugh',emoji:'😂',label:'Laugh'},
 {key:'wow',emoji:'😮',label:'Wow'},
 {key:'support',emoji:'🙌',label:'Support'}
]);
const client=()=>window.SOS_SUPABASE?.client||null;
const toast=(message,title='Forum reactions')=>window.SOS?.toast?.(message,{title});
const emptySummary=()=>({counts:Object.fromEntries(REACTIONS.map(r=>[r.key,0])),mine:new Set()});
function normalize(payload){
 const source=typeof payload==='string'?JSON.parse(payload):(payload||{});
 const counts=Object.fromEntries(REACTIONS.map(r=>[r.key,Number(source.counts?.[r.key]||0)]));
 return{counts,mine:new Set(Array.isArray(source.mine)?source.mine:[])};
}
function target(bar){
 if(bar.matches('.forumTopicReactionBar'))return{topic:bar.dataset.topicId||null,reply:null};
 return{topic:null,reply:bar.dataset.replyId||null};
}
function render(bar,summary=emptySummary()){
 if(!bar)return;
 const t=target(bar);
 bar.replaceChildren(...REACTIONS.map(item=>{
  const button=document.createElement('button');
  button.type='button';
  button.className='forumReactionChoiceV41335';
  button.dataset.reactionValue=item.key;
  if(t.topic)button.dataset.topicId=t.topic;
  if(t.reply)button.dataset.replyId=t.reply;
  button.classList.toggle('is-reacted',summary.mine.has(item.key));
  button.setAttribute('aria-label',`${item.label} reaction`);
  button.title=item.label;
  button.innerHTML=`<span class="reactionEmoji">${item.emoji}</span><span class="reactionCount">${summary.counts[item.key]}</span><span class="reactionLabel">${item.label}</span>`;
  return button;
 }));
 bar.dataset.rendered='1';
}
async function hydrate(bar){
 if(!bar||bar.dataset.loading==='1')return;
 const t=target(bar);if(!t.topic&&!t.reply)return;
 if(bar.dataset.rendered!=='1')render(bar);
 const c=client();if(!c)return;
 bar.dataset.loading='1';
 try{
  const {data,error}=await c.rpc('forum_get_reaction_summary',{target_topic:t.topic,target_reply:t.reply});
  if(error)throw error;
  render(bar,normalize(data));
  bar.dataset.connected='1';
 }catch(error){
  console.warn('[Forum reactions] Hydration failed:',error);
  bar.dataset.connected='0';
 }finally{delete bar.dataset.loading}
}
function ensure(root=document){
 const bars=[];
 if(root instanceof Element&&(root.matches('.forumTopicReactionBar')||root.matches('.forumReplyReactionBar')))bars.push(root);
 root.querySelectorAll?.('.forumTopicReactionBar,.forumReplyReactionBar').forEach(bar=>bars.push(bar));
 bars.forEach(bar=>{if(bar.dataset.rendered!=='1')render(bar);hydrate(bar)});
}
async function toggle(button){
 const c=client();if(!c)return toast('Supabase is not connected.');
 const bar=button.closest('.forumTopicReactionBar,.forumReplyReactionBar');if(!bar)return;
 const t=target(bar);
 bar.querySelectorAll('button').forEach(b=>b.disabled=true);
 try{
  const {data,error}=await c.rpc('forum_toggle_reaction_v41335',{
   target_topic:t.topic,
   target_reply:t.reply,
   reaction_value:button.dataset.reactionValue
  });
  if(error)throw error;
  render(bar,normalize(data));
  // Keep the existing post Love button synchronized without replacing it.
  if(t.topic&&button.dataset.reactionValue==='heart'){
   const post=bar.closest('.forumPost'),love=post?.querySelector('[data-like]');
   const summary=normalize(data),mine=summary.mine.has('heart');
   if(love){
    love.classList.toggle('is-reacted',mine);
    const spans=love.querySelectorAll('span');
    if(spans[0])spans[0].textContent=mine?'♥':'♡';
    if(spans[1])spans[1].textContent=String(summary.counts.heart);
    if(spans[2])spans[2].textContent=mine?'Loved':'Love';
   }
  }
 }catch(error){
  console.error('[Forum reactions] Save failed:',error);
  toast(error.message||'The reaction could not be saved.');
  await hydrate(bar);
 }finally{bar.querySelectorAll('button').forEach(b=>b.disabled=false)}
}
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-reaction-value]');
 if(!button)return;
 event.preventDefault();event.stopImmediatePropagation();
 void toggle(button);
},true);

let frame=0;
const schedule=()=>{if(frame)return;frame=requestAnimationFrame(()=>{frame=0;ensure(document)})};
const observer=new MutationObserver(schedule);
function boot(){
 ensure(document);
 observer.observe(document.getElementById('postList')||document.body,{childList:true,subtree:true});
 window.addEventListener('sos:supabase-session',()=>ensure(document));
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
window.addEventListener('pagehide',()=>{observer.disconnect();if(frame)cancelAnimationFrame(frame)},{once:true});
})();