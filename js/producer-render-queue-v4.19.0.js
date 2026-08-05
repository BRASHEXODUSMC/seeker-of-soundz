/* Seeker Of SoundZ v4.19.0 — render and task queue */
(()=>{
'use strict';
const host=document.getElementById('renderQueueListV4190'),clear=document.getElementById('clearRenderQueueV4190');
if(!host)return;
const STORAGE='sos_producer_render_queue_v4190';
let rows=[];
try{rows=JSON.parse(localStorage.getItem(STORAGE)||'[]')}catch{}
function save(){localStorage.setItem(STORAGE,JSON.stringify(rows.slice(0,30)));render()}
function esc(value=''){return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function add(detail={}){
 const row={id:crypto.randomUUID?.()||String(Date.now()),title:detail.title||'Producer Hub Task',type:detail.type||'render',status:'queued',progress:0,createdAt:new Date().toISOString()};
 rows.unshift(row);save();return row.id;
}
function update(id,patch){const row=rows.find(item=>item.id===id);if(row)Object.assign(row,patch);save()}
function render(){
 host.innerHTML=rows.length?rows.map(row=>`<article class="renderQueueItemV4190 ${esc(row.status)}"><i>${row.type==='download'?'↓':row.type==='analysis'?'◆':'⬢'}</i><div><strong>${esc(row.title)}</strong><small>${esc(row.statusText||row.status)}</small><div class="renderQueueProgressV4190"><span style="width:${Math.max(0,Math.min(100,row.progress||0))}%"></span></div></div><b>${Math.round(row.progress||0)}%</b></article>`).join(''):'<p>No queued tasks.</p>';
}
let activeRenderId='';
window.addEventListener('sos:render-queue-add',event=>{activeRenderId=add(event.detail)});
window.addEventListener('sos:render-started',event=>{
 if(!activeRenderId)activeRenderId=add({type:'render',title:event.detail?.title});
 update(activeRenderId,{status:'rendering',statusText:'Rendering video and audio',progress:8});
 let value=8;
 const timer=setInterval(()=>{
  const row=rows.find(item=>item.id===activeRenderId);
  if(!row||row.status!=='rendering'){clearInterval(timer);return}
  value=Math.min(92,value+Math.max(1,(95-value)*.045));update(activeRenderId,{progress:value});
 },900);
});
window.addEventListener('sos:render-complete',event=>{
 if(!activeRenderId)activeRenderId=add({type:'render',title:event.detail?.title});
 update(activeRenderId,{status:'complete',statusText:`Finished ${event.detail?.format||'video'}`,progress:100,completedAt:new Date().toISOString()});
 activeRenderId='';
});
window.addEventListener('sos:provider-download-ready',event=>{
 const id=add({type:'download',title:event.detail?.title||'Provider import'});
 update(id,{status:'complete',statusText:'Download ready for import',progress:100,downloadUrl:event.detail?.downloadUrl});
});
window.addEventListener('sos:beat-analysis-start',event=>{const id=add({type:'analysis',title:'Beat analysis'});update(id,{status:'processing',statusText:'Detecting beats and drops',progress:35});window.__SOS_BEAT_QUEUE_ID=id});
window.addEventListener('sos:beat-analysis-complete',event=>{const id=window.__SOS_BEAT_QUEUE_ID;if(id)update(id,{status:'complete',statusText:`${event.detail?.count||0} markers generated`,progress:100})});
clear?.addEventListener('click',()=>{rows=rows.filter(row=>!['complete','failed'].includes(row.status));save()});
render();
})();