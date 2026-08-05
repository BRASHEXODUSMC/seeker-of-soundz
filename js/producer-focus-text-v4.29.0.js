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
 const preview=proxy.offsetParent||canvas.parentElement;
 const canvasRect=canvas.getBoundingClientRect();
 const previewRect=preview.getBoundingClientRect();
 return {
  canvasRect,
  previewRect,
  left:canvasRect.left-previewRect.left,
  top:canvasRect.top-previewRect.top,
  width:canvasRect.width,
  height:canvasRect.height
 };
}
function textFontFamily(){
 const style=$('#producerTextStyleV4210')?.value||'retro';
 return {
  retro:'Trebuchet MS, sans-serif',arcade:'Courier New, monospace',
  cyber:'Arial Black, sans-serif',rave:'Arial Black, sans-serif',
  minimal:'Arial, sans-serif',terminal:'Consolas, monospace',
  'neon-script':'Brush Script MT, cursive',techno:'Impact, sans-serif',
  synthwave:'Arial Black, sans-serif',hologram:'Trebuchet MS, sans-serif',
  industrial:'Impact, sans-serif',graffiti:'Comic Sans MS, cursive',
  cinematic:'Georgia, serif',bubble:'Arial Rounded MT Bold, Arial, sans-serif'
 }[style]||'sans-serif';
}
function values(){
 const text=textInput.value.trim();
 label.textContent=text||'TEXT';
 proxy.hidden=!text;
 if(!text)return;
 const stage=canvasStage();
 const x=Number(xInput?.value||50)/100;
 const y=Number(yInput?.value||50)/100;
 const rotation=Number(rotationInput?.value||0);
 const sourceSize=Number(sizeInput?.value||54);
 const renderedSize=Math.max(14,sourceSize*(stage.width/Math.max(1,canvas.width)));
 const measuring=document.createElement('canvas').getContext('2d');
 measuring.font=`900 ${renderedSize}px ${textFontFamily()}`;
 const width=Math.max(56,Math.min(stage.width*.92,measuring.measureText(text).width+renderedSize*.8));
 const height=Math.max(34,renderedSize*1.55);
 proxy.style.left=`${stage.left+x*stage.width}px`;
 proxy.style.top=`${stage.top+y*stage.height}px`;
 proxy.style.width=`${width}px`;
 proxy.style.height=`${height}px`;
 proxy.style.transform=`translate(-50%,-50%) rotate(${rotation}deg)`;
 proxy.style.opacity='1';
 proxy.style.fontSize=`${renderedSize}px`;
 proxy.style.setProperty('--text-opacity',String(Number(opacityInput?.value||.95)));
}function forceCustom(){
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
let renderFocusPlaceholder=null;
let renderFocusParent=null;
let renderFocusNextSibling=null;
const directComposer=$('#directComposerV4180');
function enterRenderFocus(){
 if(!focusToggle?.checked||!directComposer)return;
 renderFocusParent=directComposer.parentNode;
 renderFocusNextSibling=directComposer.nextSibling;
 renderFocusPlaceholder=document.createComment('producer-render-focus-placeholder');
 renderFocusParent.insertBefore(renderFocusPlaceholder,directComposer);
 document.body.appendChild(directComposer);
 document.body.classList.add('producerRenderFocusV4290');
 directComposer.classList.add('isRenderFocusV4290');
 requestAnimationFrame(()=>{
  window.dispatchEvent(new Event('resize'));
  canvas.dispatchEvent(new Event('seeked'));
  const preview=$('.composerPreviewV4180',directComposer);
  preview?.scrollIntoView({block:'start'});
 });
}
function leaveRenderFocus(){
 document.body.classList.remove('producerRenderFocusV4290');
 directComposer?.classList.remove('isRenderFocusV4290');
 if(renderFocusPlaceholder?.parentNode){
  renderFocusPlaceholder.parentNode.insertBefore(directComposer,renderFocusPlaceholder);
  renderFocusPlaceholder.remove();
 }else if(renderFocusParent){
  renderFocusParent.insertBefore(directComposer,renderFocusNextSibling);
 }
 renderFocusPlaceholder=null;renderFocusParent=null;renderFocusNextSibling=null;
 requestAnimationFrame(()=>{window.dispatchEvent(new Event('resize'));canvasStage();values()});
}
window.addEventListener('sos:render-started',enterRenderFocus);
window.addEventListener('sos:render-complete',()=>setTimeout(leaveRenderFocus,900));
$('#cancelDirectRenderV4212')?.addEventListener('click',()=>setTimeout(leaveRenderFocus,150));
window.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.body.classList.contains('producerRenderFocusV4290'))leaveRenderFocus()});

/* Ensure timeline reaches the final project duration after edits and analysis. */
function refreshTimelineEnd(){
 const total=window.SOSVideoClipsV4240?.totalDuration?.()||Number($('#composerEndV4180')?.value||0);
 $('#timelineContentV4250')?.style.setProperty('--project-duration',String(total));
 window.SOSProducerAutoSyncV4270?.refreshBeats?.();
}
['sos:beat-analysis-complete','sos:ripple-cut-applied','sos:video-split','sos:video-segment-deleted'].forEach(name=>window.addEventListener(name,()=>setTimeout(refreshTimelineEnd,60)));
refreshTimelineEnd();
})();
