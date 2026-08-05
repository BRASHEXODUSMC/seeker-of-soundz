/* Seeker Of SoundZ v4.28.0 — render focus and draggable original text */
(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const hub=$('#producerHubV4190');
const canvas=$('#composerCanvasV4180');
const proxy=$('#originalTextInteractiveV4280');
const label=$('#originalTextInteractiveLabelV4280');
const rotate=$('#originalTextRotateHandleV4280');
const textInput=$('#producerTextV4210');
const position=$('#producerTextPositionV4210');
const xInput=$('#producerTextXV4220');
const yInput=$('#producerTextYV4220');
const rotationInput=$('#producerTextRotationV4220');
const sizeInput=$('#producerTextSizeV4210');
const opacityInput=$('#producerTextOpacityV4210');
const focusToggle=$('#renderFocusModeV4280');
const hidePanels=$('#renderHidePreviewLayersV4280');
if(!hub||!canvas||!proxy||!textInput)return;

let drag=null,turn=null;
function canvasStage(){
 const rect=canvas.getBoundingClientRect();
 const parent=proxy.offsetParent?.getBoundingClientRect()||rect;
 proxy.style.setProperty('--canvas-left',`${rect.left-parent.left}px`);
 proxy.style.setProperty('--canvas-top',`${rect.top-parent.top}px`);
 proxy.style.setProperty('--canvas-width',`${rect.width}px`);
 proxy.style.setProperty('--canvas-height',`${rect.height}px`);
 return {rect,parent};
}
function values(){
 const text=textInput.value.trim();
 label.textContent=text||'TEXT';
 proxy.hidden=!text;
 proxy.style.left=`calc(var(--canvas-left) + var(--canvas-width) * ${Number(xInput?.value||50)/100})`;
 proxy.style.top=`calc(var(--canvas-top) + var(--canvas-height) * ${Number(yInput?.value||50)/100})`;
 proxy.style.transform=`translate(-50%,-50%) rotate(${Number(rotationInput?.value||0)}deg)`;
 proxy.style.opacity=String(Number(opacityInput?.value||.95));
 proxy.style.fontSize=`${Math.max(16,Number(sizeInput?.value||54)*.42)}px`;
}
function forceCustom(){
 if(position)position.value='custom';
 position?.dispatchEvent(new Event('change',{bubbles:true}));
}
function updateCanvas(){
 canvas.dispatchEvent(new Event('seeked'));
}
proxy.addEventListener('pointerdown',event=>{
 if(event.target===rotate)return;
 event.preventDefault();event.stopPropagation();forceCustom();
 const {rect}=canvasStage();
 drag={rect,pointer:event.pointerId};
 proxy.setPointerCapture?.(event.pointerId);
});
rotate?.addEventListener('pointerdown',event=>{
 event.preventDefault();event.stopPropagation();forceCustom();
 const rect=proxy.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
 turn={pointer:event.pointerId,cx,cy,startAngle:Math.atan2(event.clientY-cy,event.clientX-cx)*180/Math.PI,start:Number(rotationInput?.value||0)};
 rotate.setPointerCapture?.(event.pointerId);
});
window.addEventListener('pointermove',event=>{
 if(drag){
  const x=Math.max(0,Math.min(100,(event.clientX-drag.rect.left)/drag.rect.width*100));
  const y=Math.max(0,Math.min(100,(event.clientY-drag.rect.top)/drag.rect.height*100));
  if(xInput)xInput.value=String(x);if(yInput)yInput.value=String(y);values();updateCanvas();
 }
 if(turn){
  const angle=Math.atan2(event.clientY-turn.cy,event.clientX-turn.cx)*180/Math.PI;
  if(rotationInput)rotationInput.value=String(Math.round(turn.start+angle-turn.startAngle));
  values();updateCanvas();
 }
});
function finish(){drag=null;turn=null}
window.addEventListener('pointerup',finish);window.addEventListener('pointercancel',finish);
[textInput,position,xInput,yInput,rotationInput,sizeInput,opacityInput].forEach(input=>{
 input?.addEventListener('input',values);input?.addEventListener('change',values);
});
new ResizeObserver(()=>{canvasStage();values()}).observe(canvas);
window.addEventListener('resize',()=>{canvasStage();values()});
requestAnimationFrame(()=>{canvasStage();values()});

/* Render focus: keep only canvas, progress, cancel, and essential status visible. */
function enterRenderFocus(){
 if(!focusToggle?.checked)return;
 document.body.classList.add('producerRenderFocusV4280');
 hub.classList.toggle('hideRenderPanelsV4280',hidePanels?.checked!==false);
 document.documentElement.style.setProperty('--render-focus-scroll',String(window.scrollY));
 setTimeout(()=>$('#directRenderStatusV4212')?.scrollIntoView({block:'center'}),20);
}
function leaveRenderFocus(){
 document.body.classList.remove('producerRenderFocusV4280');
 hub.classList.remove('hideRenderPanelsV4280');
}
window.addEventListener('sos:render-started',enterRenderFocus);
window.addEventListener('sos:render-complete',()=>setTimeout(leaveRenderFocus,900));
$('#cancelDirectRenderV4212')?.addEventListener('click',()=>setTimeout(leaveRenderFocus,150));
window.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.body.classList.contains('producerRenderFocusV4280'))leaveRenderFocus()});

/* Ensure timeline reaches the final project duration after edits and analysis. */
function refreshTimelineEnd(){
 const total=window.SOSVideoClipsV4240?.totalDuration?.()||Number($('#composerEndV4180')?.value||0);
 $('#timelineContentV4250')?.style.setProperty('--project-duration',String(total));
 window.SOSProducerAutoSyncV4270?.refreshBeats?.();
}
['sos:beat-analysis-complete','sos:ripple-cut-applied','sos:video-split','sos:video-segment-deleted'].forEach(name=>window.addEventListener(name,()=>setTimeout(refreshTimelineEnd,60)));
refreshTimelineEnd();
})();
