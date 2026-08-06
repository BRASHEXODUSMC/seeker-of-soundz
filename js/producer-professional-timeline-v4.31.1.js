/* Seeker Of SoundZ v4.31.0 — professional timeline controls */
(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const content=$('#timelineContentV4250');
const range=$('#timelineProjectRangeV4300');
const startHandle=$('#timelineStartHandleV4300');
const endHandle=$('#timelineEndHandleV4300');
const startInput=$('#composerStartV4180');
const endInput=$('#composerEndV4180');
const videoLane=$('#timelineVideoLaneV4240');
const effectsLane=$('#timelineEffectsLaneV4190');
const cameraLane=$('#timelineCameraLaneV4310');
const status=$('#timelineProfessionalStatusV4310');
if(!content||!range||!videoLane)return;

let tool='select';
let mode='normal';
let rangeDrag=null;
let trimDrag=null;

const duration=()=>Math.max(.01,window.SOSVideoClipsV4240?.totalDuration?.()||Number(endInput?.value||60));
const timeFromClientX=(clientX,element=range)=>{
 const rect=element.getBoundingClientRect();
 const localX=Math.max(0,Math.min(rect.width,clientX-rect.left));
 return localX/Math.max(1,rect.width)*duration();
};
const snapTime=time=>{
 const snap=$('#timelineSnapToggleV4310')?.classList.contains('isActive');
 if(!snap)return time;
 return window.SOSProjectRangeV4300?.snapTime?.(time)??time;
};
function updateMode(next){
 mode=next;
 $$('[data-edit-mode-v4310]').forEach(btn=>btn.classList.toggle('isActive',btn.dataset.editModeV4310===next));
 const ripple=$('#rippleDeleteCutsV4260'),snap=$('#snapCutsToClipEdgesV4260');
 if(next==='normal'){if(ripple)ripple.checked=false}
 if(next==='ripple'){if(ripple)ripple.checked=true;if(snap)snap.checked=false}
 if(next==='magnetic'){if(ripple)ripple.checked=true;if(snap)snap.checked=true}
 status.textContent=`${next[0].toUpperCase()+next.slice(1)} edit mode active.`;
}
$$('[data-edit-mode-v4310]').forEach(btn=>btn.addEventListener('click',()=>updateMode(btn.dataset.editModeV4310)));
function updateTool(next){
 tool=next;
 [['select','#timelineSelectToolV4310'],['razor','#timelineRazorToolV4310'],['trim','#timelineTrimToolV4310']].forEach(([name,sel])=>$(sel)?.classList.toggle('isActive',name===next));
 content.dataset.timelineTool=next;
 status.textContent=next==='razor'?'Razor active: click a video clip to split at the pointer.':next==='trim'?'Trim active: drag either clip edge.':'Select active: click clips and effect blocks.';
}
$('#timelineSelectToolV4310')?.addEventListener('click',()=>updateTool('select'));
$('#timelineRazorToolV4310')?.addEventListener('click',()=>updateTool('razor'));
$('#timelineTrimToolV4310')?.addEventListener('click',()=>updateTool('trim'));
$('#timelineSnapToggleV4310')?.addEventListener('click',event=>event.currentTarget.classList.toggle('isActive'));

/* Exact range-handle tracking after moving the module below Cut & Edit. */
function beginRange(event,type){
 event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
 const rect=range.getBoundingClientRect();
 rangeDrag={type,pointer:event.pointerId,rect};
 event.currentTarget.setPointerCapture?.(event.pointerId);
 document.body.classList.add('isDraggingTimelineRangeV4300');
}
startHandle?.addEventListener('pointerdown',event=>beginRange(event,'start'),true);
endHandle?.addEventListener('pointerdown',event=>beginRange(event,'end'),true);
window.addEventListener('pointermove',event=>{
 if(!rangeDrag||event.pointerId!==rangeDrag.pointer)return;
 event.preventDefault();event.stopPropagation();
 const localX=Math.max(0,Math.min(rangeDrag.rect.width,event.clientX-rangeDrag.rect.left));
 const t=snapTime(localX/Math.max(1,rangeDrag.rect.width)*duration());
 const start=Number(startInput.value||0),end=Number(endInput.value||duration());
 if(rangeDrag.type==='start')startInput.value=Math.min(t,end-.01).toFixed(2);
 else endInput.value=Math.max(t,start+.01).toFixed(2);
 startInput.dispatchEvent(new Event('input',{bubbles:true}));
 endInput.dispatchEvent(new Event('input',{bubbles:true}));
},true);
window.addEventListener('pointerup',event=>{
 if(!rangeDrag||event.pointerId!==rangeDrag.pointer)return;
 rangeDrag=null;document.body.classList.remove('isDraggingTimelineRangeV4300');
},true);
window.addEventListener('pointercancel',()=>{rangeDrag=null;document.body.classList.remove('isDraggingTimelineRangeV4300')},true);

/* Clip select, razor and trim. */
videoLane.addEventListener('click',async event=>{
 const clip=event.target.closest('[data-video-segment-id]');
 if(!clip)return;
 const id=clip.dataset.videoSegmentId;
 $$('.timelineVideoSegmentV4240').forEach(el=>el.classList.toggle('isSelectedV4310',el===clip));
 if(tool==='razor'){
  event.preventDefault();event.stopPropagation();
  const t=snapTime(timeFromClientX(event.clientX,videoLane));
  const result=await window.SOSVideoClipsV4240?.splitAt?.(t,{snap:mode==='magnetic',tolerance:.15});
  status.textContent=result?.ok?`Video split at ${t.toFixed(2)} seconds.`:(result?.message||'Could not split there.');
 }
},true);

videoLane.addEventListener('pointerdown',event=>{
 const handle=event.target.closest('[data-trim-left],[data-trim-right]');
 if(!handle)return;
 event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
 const clipEl=handle.closest('[data-video-segment-id]');
 const rect=videoLane.getBoundingClientRect();
 trimDrag={
  id:handle.dataset.trimLeft||handle.dataset.trimRight,
  edge:handle.dataset.trimLeft?'left':'right',
  startX:event.clientX,clipEl,pointer:event.pointerId,rect
 };
 handle.setPointerCapture?.(event.pointerId);
 clipEl.classList.add('isTrimmingV4310');
 status.textContent=`Dragging ${trimDrag.edge} trim handle…`;
},true);
window.addEventListener('pointermove',event=>{
 if(!trimDrag||event.pointerId!==trimDrag.pointer)return;
 event.preventDefault();event.stopPropagation();
 const pixelDelta=event.clientX-trimDrag.startX;
 trimDrag.delta=pixelDelta/Math.max(1,trimDrag.rect.width)*duration();
 trimDrag.clipEl.style.setProperty('--trim-preview',`${pixelDelta}px`);
 const seconds=Math.abs(trimDrag.delta||0).toFixed(2);
 status.textContent=`${trimDrag.edge==='left'?'Start':'End'} trim preview: ${trimDrag.delta>=0?'+':'−'}${seconds}s`;
},true);
window.addEventListener('pointerup',async event=>{
 if(!trimDrag||event.pointerId!==trimDrag.pointer)return;
 event.preventDefault();event.stopPropagation();
 const current=trimDrag;trimDrag=null;
 current.clipEl.classList.remove('isTrimmingV4310');current.clipEl.style.removeProperty('--trim-preview');
 const result=await window.SOSVideoClipsV4240?.trimSegment?.(
  current.id,current.edge,current.delta||0,
  {snap:mode==='magnetic',tolerance:Number($('#cutSnapToleranceV4260')?.value||.2)}
 );
 status.textContent=result?.ok
  ?`Clip ${current.edge==='left'?'start':'end'} trimmed successfully.`
  :(result?.message||'The clip could not be trimmed there.');
},true);
window.addEventListener('pointercancel',()=>{
 if(!trimDrag)return;
 trimDrag.clipEl?.classList.remove('isTrimmingV4310');
 trimDrag.clipEl?.style.removeProperty('--trim-preview');
 trimDrag=null;
},true);

/* Draggable timed-effect blocks. */
effectsLane?.addEventListener('dragstart',event=>{
 const region=event.target.closest('[data-effect-region-index]');if(!region)return;
 event.dataTransfer.setData('text/effect-region-index',region.dataset.effectRegionIndex);
 event.dataTransfer.effectAllowed='move';
});
effectsLane?.addEventListener('dragover',event=>event.preventDefault());
effectsLane?.addEventListener('drop',event=>{
 event.preventDefault();
 const index=event.dataTransfer.getData('text/effect-region-index');if(index==='')return;
 const t=snapTime(timeFromClientX(event.clientX,effectsLane));
 window.SOSTimedEffectsV4240?.moveRegion?.(index,t);
 status.textContent='Effect block moved on the timeline.';
});

/* Camera lane and beat classification. */
function renderCamera(){
 const regions=window.SOSAutoCameraV4250?.regions?.()||[],total=duration();
 cameraLane.innerHTML=regions.map((r,i)=>`<article class="cameraRegionV4310 ${r.drop?'isDrop':''}" style="left:${r.start/total*100}%;width:${Math.max(.25,(r.end-r.start)/total*100)}%" title="${r.motion}"><strong>${r.motion.replace('auto-','').replaceAll('-',' ')}</strong></article>`).join('');
}
function classifyBeats(){
 const markers=$$('[data-marker-time]');
 markers.forEach((marker,index)=>{
  const energy=Number(marker.dataset.beatEnergy||0),drop=marker.classList.contains('isDrop');
  const type=drop?'DROP':index%4===0?'KICK':index%4===2?'SNARE':energy>.08?'BASS':'HAT';
  marker.dataset.beatType=type;marker.setAttribute('aria-label',`${type} beat`);
 });
}
['sos:beat-analysis-complete','sos:ripple-cut-applied','sos:video-split','sos:clip-trimmed'].forEach(name=>window.addEventListener(name,()=>setTimeout(()=>{classifyBeats();renderCamera()},80)));
new MutationObserver(()=>{classifyBeats();renderCamera()}).observe($('#timelineMarkerLaneV4190'),{childList:true,subtree:true});
setInterval(renderCamera,1200);
updateMode('normal');updateTool('select');classifyBeats();renderCamera();
})();
