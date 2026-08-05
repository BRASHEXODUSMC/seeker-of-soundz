/* Seeker Of SoundZ v4.19.9 — Producer Hub 3.0 runtime repair */
(()=>{
'use strict';
const hub=document.getElementById('producerHubV4190');
const studio=document.getElementById('videoEffectsStudio');
if(!hub||!studio)return;

const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const video=$('#composerPreviewVideoV4180');
const audio=$('#composerPreviewAudioV4180');
const videoInput=$('#composerVideoV4180');
const audioInput=$('#composerAudioV4180');
const converterUrl='https://v1.y2mate.com.se/en/youtube-to-mp4/';
const storageKey='sos_producer_youtube_references_v4199';
let youtubeReference='';
let draggingPlayhead=false;

function toast(message,title='Producer Hub 3.0'){
 window.SOS?.toast?.(message,{title,icon:'✓'});
}
function activateStudioModule(name){
 const button=$(`[data-studio-module="${CSS.escape(name)}"]`,studio);
 const panel=$(`[data-studio-panel="${CSS.escape(name)}"]`,studio);
 if(!button||!panel)return false;
 $$('[data-studio-module]',studio).forEach(item=>item.classList.toggle('isActive',item===button));
 $$('[data-studio-panel]',studio).forEach(item=>{
  const active=item===panel;
  item.classList.toggle('isActive',active);
  item.hidden=!active;
 });
 panel.hidden=false;
 return true;
}
function openFilePicker(input){
 if(!input)return toast('The file input is unavailable. Refresh the page and try again.','Import unavailable');
 activateStudioModule('create');
 setTimeout(()=>{
  try{
   if(typeof input.showPicker==='function')input.showPicker();
   else input.click();
  }catch{
   input.click();
  }
 },80);
}
function ensureModuleButtons(){
 studio.addEventListener('click',event=>{
  const moduleButton=event.target.closest('[data-studio-module]');
  if(moduleButton){
   event.preventDefault();
   activateStudioModule(moduleButton.dataset.studioModule);
   return;
  }
  const opener=event.target.closest('[data-open-module]');
  if(opener){
   event.preventDefault();
   const name=opener.dataset.openModule;
   if(name==='create'){
    openFilePicker(videoInput);
   }else{
    activateStudioModule(name);
    $(`[data-studio-panel="${CSS.escape(name)}"]`,studio)?.scrollIntoView({block:'nearest'});
   }
  }
 });
}

function syncMediaTime(time){
 if(video&&Number.isFinite(video.duration))video.currentTime=Math.max(0,Math.min(time,video.duration));
 if(audio&&Number.isFinite(audio.duration))audio.currentTime=Math.max(0,Math.min(time,audio.duration));
}
async function playMedia(){
 if(!video?.src&&!video?.currentSrc){
  openFilePicker(videoInput);
  return;
 }
 try{
  if(audio?.src||audio?.currentSrc){
   audio.currentTime=Math.min(video.currentTime||0,audio.duration||video.currentTime||0);
   await audio.play().catch(()=>{});
  }
  await video.play();
 }catch(error){
  toast(error.message||'The browser could not start playback.','Playback unavailable');
 }
}
function pauseMedia(){video?.pause();audio?.pause()}
function restartMedia(){pauseMedia();syncMediaTime(Number($('#composerStartV4180')?.value||0))}
function timelineDuration(){
 return Math.max(
  0,
  Number.isFinite(video?.duration)?video.duration:0,
  Number.isFinite(audio?.duration)?audio.duration:0
 );
}
function seekFromPointer(event,target){
 const duration=timelineDuration();
 if(!duration)return;
 const rect=target.getBoundingClientRect();
 const x=Math.max(0,Math.min(rect.width,event.clientX-rect.left));
 syncMediaTime(duration*(x/Math.max(1,rect.width)));
}
function repairTimeline(){
 $('#producerPlayV4190')?.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();playMedia()},true);
 $('#producerPauseV4190')?.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();pauseMedia()},true);
 $('#producerRestartV4190')?.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();restartMedia()},true);

 const tracks=$('#timelineTracksV4190');
 const ruler=$('#timelineRulerV4190');
 [tracks,ruler].forEach(target=>target?.addEventListener('click',event=>{
  if(event.target.closest('button,[data-marker-time],input'))return;
  seekFromPointer(event,target);
 }));
 const playhead=$('#timelinePlayheadV4190');
 if(playhead){
  playhead.style.pointerEvents='auto';
  playhead.tabIndex=0;
  playhead.setAttribute('role','slider');
  playhead.setAttribute('aria-label','Timeline playhead');
  playhead.addEventListener('pointerdown',event=>{
   draggingPlayhead=true;
   playhead.setPointerCapture?.(event.pointerId);
   event.preventDefault();
  });
  playhead.addEventListener('pointermove',event=>{
   if(!draggingPlayhead)return;
   seekFromPointer(event,tracks||playhead.parentElement);
  });
  playhead.addEventListener('pointerup',event=>{
   draggingPlayhead=false;
   playhead.releasePointerCapture?.(event.pointerId);
  });
  playhead.addEventListener('keydown',event=>{
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
   event.preventDefault();
   const duration=timelineDuration(),step=event.shiftKey?5:.5;
   if(event.key==='Home')syncMediaTime(0);
   else if(event.key==='End')syncMediaTime(duration);
   else syncMediaTime((video?.currentTime||0)+(event.key==='ArrowRight'?step:-step));
  });
 }
 video?.addEventListener('play',()=>{if(audio?.src&&!audio.paused) return; if(audio?.src)audio.play().catch(()=>{})});
 video?.addEventListener('pause',()=>audio?.pause());
 video?.addEventListener('seeking',()=>{if(audio?.src&&Math.abs((audio.currentTime||0)-(video.currentTime||0))>.18)audio.currentTime=Math.min(video.currentTime||0,audio.duration||0)});
 video?.addEventListener('ended',()=>audio?.pause());
 video?.addEventListener('loadedmetadata',()=>{
  const end=$('#composerEndV4180'),inspectEnd=$('#inspectorEndV4190');
  if(end&&(!Number(end.value)||Number(end.value)>video.duration))end.value=video.duration.toFixed(2);
  if(inspectEnd)inspectEnd.value=video.duration.toFixed(2);
 });
}

function youtubeId(value){
 const raw=String(value||'').trim();
 if(!raw)return '';
 try{
  const url=new URL(raw);
  if(url.hostname.includes('youtu.be'))return url.pathname.split('/').filter(Boolean)[0]||'';
  if(url.hostname.includes('youtube.com')){
   if(url.pathname.startsWith('/shorts/'))return url.pathname.split('/')[2]||'';
   if(url.pathname.startsWith('/embed/'))return url.pathname.split('/')[2]||'';
   return url.searchParams.get('v')||'';
  }
 }catch{}
 return /^[a-zA-Z0-9_-]{11}$/.test(raw)?raw:'';
}
function setYoutubeReference(url){
 const id=youtubeId(url);
 const frame=$('#producerYoutubeFrameV4199');
 const empty=$('#producerYoutubeEmptyV4199');
 const status=$('#producerYoutubeStatusV4199');
 if(!id){
  youtubeReference='';
  if(frame)frame.removeAttribute('src');
  if(empty)empty.hidden=false;
  $('#saveYoutubeReferenceV4199').disabled=true;
  $('#copyYoutubeReferenceV4199').disabled=true;
  if(status)status.textContent='Enter a valid YouTube video URL.';
  return false;
 }
 youtubeReference=`https://www.youtube.com/watch?v=${id}`;
 if(frame)frame.src=`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0`;
 if(empty)empty.hidden=true;
 $('#saveYoutubeReferenceV4199').disabled=false;
 $('#copyYoutubeReferenceV4199').disabled=false;
 if(status)status.textContent='Preview loaded. Save it as a project reference, or import an authorized local MP4 to render.';
 return true;
}
function savedYoutubeReferences(){
 try{return JSON.parse(localStorage.getItem(storageKey)||'[]')}catch{return []}
}
function saveYoutubeReference(){
 if(!youtubeReference)return;
 const rows=savedYoutubeReferences().filter(item=>item.url!==youtubeReference);
 rows.unshift({url:youtubeReference,project:$('#producerProjectNameV4190')?.value||'Untitled Frequency Project',savedAt:new Date().toISOString()});
 localStorage.setItem(storageKey,JSON.stringify(rows.slice(0,20)));
 const snapshot=JSON.parse(localStorage.getItem('sos_producer_active_youtube_v4199')||'{}');
 localStorage.setItem('sos_producer_active_youtube_v4199',JSON.stringify({...snapshot,url:youtubeReference,savedAt:new Date().toISOString()}));
 toast('YouTube reference saved to this project.');
}
function toggleYoutubeDock(force){
 const dock=$('#producerYoutubeDockV4199');
 const body=$('#producerYoutubeDockBodyV4199');
 const button=$('#toggleProducerYoutubeV4199');
 if(!dock||!body||!button)return;
 const open=typeof force==='boolean'?force:dock.classList.contains('isCollapsed');
 dock.classList.toggle('isCollapsed',!open);
 body.hidden=!open;
 button.setAttribute('aria-expanded',String(open));
 button.textContent=open?'Minimize YouTube Tools':'Open YouTube Tools';
 if(open)dock.scrollIntoView({block:'nearest'});
}
function activateYoutubeTab(name){
 $$('[data-youtube-tool-tab]').forEach(button=>button.classList.toggle('isActive',button.dataset.youtubeToolTab===name));
 $$('[data-youtube-tool-panel]').forEach(panel=>{
  const active=panel.dataset.youtubeToolPanel===name;
  panel.classList.toggle('isActive',active);
  panel.hidden=!active;
 });
}
function loadConverter(){
 const frame=$('#producerConverterFrameV4199');
 const fallback=$('#producerConverterFallbackV4199');
 const status=$('#producerConverterStatusV4199');
 if(!frame)return;
 frame.src=converterUrl;
 if(fallback)fallback.hidden=true;
 if(status)status.textContent='Loading the external converter. If the frame stays blank or shows a refusal, open it in a new tab.';
 setTimeout(()=>{
  if(status)status.textContent='The converter is external. After downloading an authorized MP4, use Choose or Import Video to place it in the editor.';
 },2500);
}
function unloadConverter(){
 const frame=$('#producerConverterFrameV4199');
 if(frame)frame.removeAttribute('src');
 const fallback=$('#producerConverterFallbackV4199');
 if(fallback)fallback.hidden=false;
 $('#producerConverterStatusV4199').textContent='Converter unloaded.';
}
function openConverterTab(){window.open(converterUrl,'_blank','noopener,noreferrer')}

function setupYoutubeWorkspace(){
 $('#toggleProducerYoutubeV4199')?.addEventListener('click',()=>toggleYoutubeDock());
 $('#openExternalConverterV4199')?.addEventListener('click',()=>{toggleYoutubeDock(true);activateYoutubeTab('converter');openConverterTab()});
 $$('[data-youtube-tool-tab]').forEach(button=>button.addEventListener('click',()=>activateYoutubeTab(button.dataset.youtubeToolTab)));
 $('#loadProducerYoutubeV4199')?.addEventListener('click',()=>setYoutubeReference($('#producerYoutubeUrlV4199')?.value));
 $('#producerYoutubeUrlV4199')?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();setYoutubeReference(event.currentTarget.value)}});
 $('#pasteProducerYoutubeV4199')?.addEventListener('click',async()=>{
  try{
   const text=await navigator.clipboard.readText();
   $('#producerYoutubeUrlV4199').value=text;
   setYoutubeReference(text);
  }catch{
   $('#producerYoutubeUrlV4199')?.focus();
   toast('Clipboard access was blocked. Paste the URL manually.','Clipboard unavailable');
  }
 });
 $('#clearProducerYoutubeV4199')?.addEventListener('click',()=>{
  $('#producerYoutubeUrlV4199').value='';
  setYoutubeReference('');
 });
 $('#saveYoutubeReferenceV4199')?.addEventListener('click',saveYoutubeReference);
 $('#copyYoutubeReferenceV4199')?.addEventListener('click',async()=>{
  if(!youtubeReference)return;
  try{await navigator.clipboard.writeText(youtubeReference);toast('YouTube URL copied.')}catch{toast('Copy was blocked by the browser.','Copy unavailable')}
 });
 $('#loadConverterEmbedV4199')?.addEventListener('click',loadConverter);
 $('#openConverterTabV4199')?.addEventListener('click',openConverterTab);
 $('#hideConverterEmbedV4199')?.addEventListener('click',unloadConverter);
}

function repairProjectButtons(){
 $('#newProducerProjectV4190')?.addEventListener('click',event=>{
  event.preventDefault();event.stopImmediatePropagation();
  pauseMedia();
  $('#producerProjectNameV4190').value='Untitled Frequency Project';
  if(videoInput)videoInput.value='';
  if(audioInput)audioInput.value='';
  if(video){video.pause();video.removeAttribute('src');video.load()}
  if(audio){audio.pause();audio.removeAttribute('src');audio.load()}
  $$('[data-effect]:checked').forEach(input=>{input.checked=false;input.dispatchEvent(new Event('change',{bubbles:true}))});
  setYoutubeReference('');
  toast('A clean Producer Hub 3.0 project is ready.');
 },true);
 $('#renderProducerProjectV4190')?.addEventListener('click',event=>{
  if(!video?.src&&!video?.currentSrc){
   event.preventDefault();
   event.stopImmediatePropagation();
   openFilePicker(videoInput);
   toast('Choose a local video before rendering.','Video required');
  }
 },true);
}

ensureModuleButtons();
repairTimeline();
setupYoutubeWorkspace();
repairProjectButtons();
activateYoutubeTab('preview');

window.SOSProducerHub3={
 openVideo:()=>openFilePicker(videoInput),
 openMusic:()=>openFilePicker(audioInput),
 openYoutube:()=>toggleYoutubeDock(true),
 seek:syncMediaTime,
 play:playMedia,
 pause:pauseMedia
};
})();
