/* Seeker Of SoundZ v4.13.36 — stable clickable Supabase forum reactions */
(()=>{
'use strict';
if(window.__SOS_FORUM_REACTIONS_V41336__)return;
window.__SOS_FORUM_REACTIONS_V41336__=true;

const REACTIONS=Object.freeze([
 {key:'heart',emoji:'❤️',label:'Love'},
 {key:'fire',emoji:'🔥',label:'Fire'},
 {key:'clap',emoji:'👏',label:'Applause'},
 {key:'laugh',emoji:'😂',label:'Laugh'},
 {key:'wow',emoji:'😮',label:'Wow'},
 {key:'support',emoji:'🙌',label:'Support'}
]);
const client=()=>window.SOS_SUPABASE?.client||null;
const notify=(message,title='Forum reactions')=>window.SOS?.toast?.(message,{title});
const empty=()=>({counts:Object.fromEntries(REACTIONS.map(r=>[r.key,0])),mine:new Set()});
const normalize=payload=>{
 const source=typeof payload==='string'?JSON.parse(payload):(payload||{});
 return{
  counts:Object.fromEntries(REACTIONS.map(r=>[r.key,Number(source.counts?.[r.key]||0)])),
  mine:new Set(Array.isArray(source.mine)?source.mine:[])
 };
};
const target=bar=>bar.matches('.forumTopicReactionBar')
 ?{topic:bar.dataset.topicId||null,reply:null}
 :{topic:null,reply:bar.dataset.replyId||null};

function render(bar,summary=empty()){
 if(!bar)return;
 const t=target(bar);
 const fragment=document.createDocumentFragment();
 REACTIONS.forEach(item=>{
  const button=document.createElement('button');
  button.type='button';
  button.className='forumReactionChoiceV41336';
  button.dataset.reactionValue=item.key;
  if(t.topic)button.dataset.topicId=t.topic;
  if(t.reply)button.dataset.replyId=t.reply;
  button.classList.toggle('is-reacted',summary.mine.has(item.key));
  button.setAttribute('aria-label',`${item.label} reaction`);
  button.title=item.label;
  button.innerHTML=`<span class="reactionEmoji">${item.emoji}</span><span class="reactionCount">${summary.counts[item.key]}</span><span class="reactionLabel">${item.label}</span>`;
  fragment.appendChild(button);
 });
 bar.replaceChildren(fragment);
 bar.dataset.rendered='1';
 bar.dataset.hydrated='1';
}

function renderInitial(bar){
 if(!bar||bar.dataset.rendered==='1')return;
 render(bar,empty());
 bar.dataset.hydrated='0';
}

async function hydrate(bar,{force=false}={}){
 if(!bar||bar.dataset.loading==='1')return;
 const t=target(bar);if(!t.topic&&!t.reply)return;
 renderInitial(bar);
 if(!force&&bar.dataset.hydrated==='1')return;
 const c=client();if(!c)return;
 bar.dataset.loading='1';
 try{
  const {data,error}=await c.rpc('forum_get_reaction_summary',{target_topic:t.topic,target_reply:t.reply});
  if(error)throw error;
  render(bar,normalize(data));
  bar.dataset.connected='1';
 }catch(error){
  console.warn('[Forum reactions] Load failed:',error);
  bar.dataset.connected='0';
  // Keep the visible buttons instead of replacing them with an error message.
 }finally{
  delete bar.dataset.loading;
 }
}

function ensure(root=document,{force=false}={}){
 const bars=[];
 if(root instanceof Element&&(root.matches('.forumTopicReactionBar')||root.matches('.forumReplyReactionBar')))bars.push(root);
 root.querySelectorAll?.('.forumTopicReactionBar,.forumReplyReactionBar').forEach(bar=>bars.push(bar));
 [...new Set(bars)].forEach(bar=>{
  renderInitial(bar);
  void hydrate(bar,{force});
 });
}

function setBusy(bar,busy){
 bar?.querySelectorAll('button').forEach(button=>button.disabled=busy);
}

async function toggle(button){
 const c=client();
 if(!c)return notify('Supabase is not connected.');
 const bar=button.closest('.forumTopicReactionBar,.forumReplyReactionBar');
 if(!bar||bar.dataset.saving==='1')return;
 const t=target(bar);
 bar.dataset.saving='1';
 setBusy(bar,true);
 try{
  const {data,error}=await c.rpc('forum_toggle_reaction_v41335',{
   target_topic:t.topic,
   target_reply:t.reply,
   reaction_value:button.dataset.reactionValue
  });
  if(error)throw error;
  render(bar,normalize(data));
 }catch(error){
  console.error('[Forum reactions] Save failed:',error);
  notify(error.message||'The reaction could not be saved.');
  bar.dataset.hydrated='0';
  await hydrate(bar,{force:true});
 }finally{
  delete bar.dataset.saving;
  setBusy(bar,false);
 }
}

document.addEventListener('click',event=>{
 const button=event.target.closest?.('.forumReactionChoiceV41336');
 if(!button)return;
 event.preventDefault();
 event.stopPropagation();
 event.stopImmediatePropagation();
 void toggle(button);
},true);

let frame=0;
function schedule(){
 if(frame)return;
 frame=requestAnimationFrame(()=>{
  frame=0;
  ensure(document);
 });
}
const observer=new MutationObserver(mutations=>{
 // Only initialize newly-added forum content. Button count updates do not retrigger hydration.
 if(mutations.some(m=>[...m.addedNodes].some(node=>node.nodeType===1&&(node.matches?.('.forumPost,.forumReply,.forumTopicReactionBar,.forumReplyReactionBar')||node.querySelector?.('.forumTopicReactionBar,.forumReplyReactionBar')))))schedule();
});

let realtime=null;
async function subscribe(){
 const c=client();if(!c)return;
 if(realtime)await c.removeChannel(realtime);
 realtime=c.channel('forum-reactions-v41336')
  .on('postgres_changes',{event:'*',schema:'public',table:'forum_reactions'},payload=>{
   const row=payload.new?.id?payload.new:payload.old;
   const selector=row?.topic_id
    ?`.forumTopicReactionBar[data-topic-id="${CSS.escape(row.topic_id)}"]`
    :row?.reply_id?`.forumReplyReactionBar[data-reply-id="${CSS.escape(row.reply_id)}"]`:null;
   if(selector)document.querySelectorAll(selector).forEach(bar=>{
    bar.dataset.hydrated='0';
    void hydrate(bar,{force:true});
   });
  }).subscribe();
}
function boot(){
 ensure(document);
 observer.observe(document.getElementById('postList')||document.body,{childList:true,subtree:true});
 void subscribe();
 window.addEventListener('sos:supabase-session',()=>{ensure(document,{force:true});void subscribe()});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
window.addEventListener('pagehide',()=>{
 observer.disconnect();
 if(frame)cancelAnimationFrame(frame);
 if(realtime)client()?.removeChannel(realtime);
},{once:true});
})();