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
 const ratio=Math.max(0,Math.min(1,(clientX-rect.left)/Math.max(1,rect.width)));
 return ratio*duration();
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
 event.preventDefault();event.stopImmediatePropagation();
 rangeDrag={type,pointer:event.pointerId};
 event.currentTarget.setPointerCapture?.(event.pointerId);
}
startHandle?.addEventListener('pointerdown',event=>beginRange(event,'start'),true);
endHandle?.addEventListener('pointerdown',event=>beginRange(event,'end'),true);
window.addEventListener('pointermove',event=>{
 if(!rangeDrag)return;
 const t=snapTime(timeFromClientX(event.clientX,range));
 const start=Number(startInput.value||0),end=Number(endInput.value||duration());
 if(rangeDrag.type==='start')startInput.value=Math.min(t,end-.01).toFixed(2);
 else endInput.value=Math.max(t,start+.01).toFixed(2);
 startInput.dispatchEvent(new Event('input',{bubbles:true}));
 endInput.dispatchEvent(new Event('input',{bubbles:true}));
},true);
window.addEventListener('pointerup',()=>rangeDrag=null,true);

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
 event.preventDefault();event.stopPropagation();
 const clipEl=handle.closest('[data-video-segment-id]');
 trimDrag={id:handle.dataset.trimLeft||handle.dataset.trimRight,edge:handle.dataset.trimLeft?'left':'right',startX:event.clientX,clipEl,pointer:event.pointerId};
 handle.setPointerCapture?.(event.pointerId);
 clipEl.classList.add('isTrimmingV4310');
},true);
window.addEventListener('pointermove',event=>{
 if(!trimDrag)return;
 const rect=videoLane.getBoundingClientRect();
 const delta=(event.clientX-trimDrag.startX)/Math.max(1,rect.width)*duration();
 trimDrag.delta=delta;
 trimDrag.clipEl.style.setProperty('--trim-preview',`${event.clientX-trimDrag.startX}px`);
},true);
window.addEventListener('pointerup',async()=>{
 if(!trimDrag)return;
 const current=trimDrag;trimDrag=null;
 current.clipEl.classList.remove('isTrimmingV4310');current.clipEl.style.removeProperty('--trim-preview');
 await window.SOSVideoClipsV4240?.trimSegment?.(current.id,current.edge,current.delta||0,{snap:mode==='magnetic'||$('#timelineSnapToggleV4310')?.classList.contains('isActive')});
 status.textContent='Clip trim applied. Drag again or use Undo to restore it.';
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
