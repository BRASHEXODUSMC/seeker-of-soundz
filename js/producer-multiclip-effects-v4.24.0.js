/* Seeker Of SoundZ v4.24.0 — multiclip timeline and timed effects */
(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const video=$('#composerPreviewVideoV4180');
const videoInput=$('#composerVideoV4180');
const audio=$('#composerPreviewAudioV4180');
const audioInput=$('#composerAudioV4180');
const addInput=$('#producerAddVideoClipsV4240');
const clipList=$('#producerVideoClipListV4240');
const videoLane=$('#timelineVideoLaneV4240');
const clipStatus=$('#producerClipStatusV4240');
const endInput=$('#composerEndV4180');
if(!video||!videoInput||!clipList||!videoLane)return;

const uid=()=>`clip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
const fmt=value=>{const n=Math.max(0,Number(value)||0),m=Math.floor(n/60),s=n%60;return `${String(m).padStart(2,'0')}:${s.toFixed(1).padStart(4,'0')}`};
let clips=[];
let activeIndex=0;
let sequenceActive=false;
let renderSequence=false;
let loading=false;
let allVideoMuted=false;
let dragId=null;

function totalDuration(){return clips.reduce((sum,clip)=>sum+(Number(clip.duration)||0),0)||(Number(video.duration)||0)}
function offsetFor(index){return clips.slice(0,index).reduce((sum,clip)=>sum+(Number(clip.duration)||0),0)}
function globalTime(){return offsetFor(activeIndex)+(Number(video.currentTime)||0)}
function hasMultiple(){return clips.length>1}
function hasNext(){return activeIndex<clips.length-1}
function clipAtTime(time){
 let offset=0;
 for(let i=0;i<clips.length;i++){
  const end=offset+clips[i].duration;
  if(time<end||i===clips.length-1)return {index:i,local:Math.max(0,time-offset)};
  offset=end;
 }
 return {index:0,local:time};
}
function updateEnd(){
 const total=totalDuration();
 if(endInput&&total)endInput.value=total.toFixed(2);
}
async function metadataFor(file,url){
 return await new Promise((resolve,reject)=>{
  const probe=document.createElement('video');
  probe.preload='metadata';
  probe.onloadedmetadata=()=>resolve({duration:Number(probe.duration)||0,width:probe.videoWidth,height:probe.videoHeight});
  probe.onerror=()=>reject(new Error(`Could not read ${file.name}`));
  probe.src=url;
 });
}
function syncMute(){
 const clip=clips[activeIndex];
 video.muted=allVideoMuted||Boolean(clip?.muted);
 $('#timelineMuteVideosV4240').textContent=(allVideoMuted?'🔇':'🔊');
 $('#timelineMuteVideosV4240').classList.toggle('isMutedV4240',allVideoMuted);
}
async function loadIndex(index,localTime=0,autoplay=false){
 if(!clips[index]||loading)return;
 loading=true;activeIndex=index;
 const clip=clips[index];
 if(video.src!==clip.url){
  video.pause();video.src=clip.url;video.load();
  await new Promise(resolve=>{
   if(video.readyState>=1)return resolve();
   const done=()=>{video.removeEventListener('loadedmetadata',done);resolve()};
   video.addEventListener('loadedmetadata',done);
  });
 }
 video.currentTime=Math.min(Math.max(0,localTime),Math.max(0,clip.duration-.02));
 syncMute();renderClips();loading=false;
 if(autoplay)await video.play().catch(()=>{});
}
async function startSequence(time=0,isRender=false){
 sequenceActive=true;renderSequence=isRender;
 const location=clipAtTime(Math.max(0,time));
 await loadIndex(location.index,location.local,false);
}
async function seekGlobal(time){
 const location=clipAtTime(Math.max(0,Math.min(totalDuration(),time)));
 await loadIndex(location.index,location.local,false);
}
async function addFiles(files,replace=false){
 const valid=[...files].filter(file=>String(file.type||'').startsWith('video/'));
 if(!valid.length)return;
 if(replace)clearClips();
 for(const file of valid){
  const url=URL.createObjectURL(file);
  try{
   const meta=await metadataFor(file,url);
   clips.push({id:uid(),name:file.name,url,file,duration:meta.duration,muted:false,width:meta.width,height:meta.height});
  }catch(error){URL.revokeObjectURL(url);console.warn(error)}
 }
 if(clips.length){
  await loadIndex(replace?0:Math.max(0,clips.length-valid.length),0,false);
  updateEnd();renderClips();
  clipStatus.textContent=`${clips.length} video clip${clips.length===1?'':'s'} · total ${fmt(totalDuration())}. Clips play in order and render as one project.`;
 }
}
function adoptPrimaryFile(){
 const file=videoInput.files?.[0];
 if(!file)return;
 setTimeout(async()=>{
  const url=video.currentSrc||video.src;
  if(!url)return;
  clips.forEach(clip=>{if(clip.url&&clip.url!==url&&clip.url.startsWith('blob:'))URL.revokeObjectURL(clip.url)});
  const durationValue=Number(video.duration)||await metadataFor(file,url).then(meta=>meta.duration).catch(()=>0);
  clips=[{id:uid(),name:file.name,url,file,duration:durationValue,muted:false,width:video.videoWidth,height:video.videoHeight}];
  activeIndex=0;sequenceActive=false;renderSequence=false;updateEnd();syncMute();renderClips();
  clipStatus.textContent=`Video 1 loaded · ${fmt(durationValue)}. Add more clips below it.`;
 },120);
}
function clearClips(){
 const current=video.currentSrc||video.src;
 clips.forEach(clip=>{if(clip.url&&clip.url!==current&&clip.url.startsWith('blob:'))URL.revokeObjectURL(clip.url)});
 clips=[];activeIndex=0;sequenceActive=false;renderSequence=false;renderClips();updateEnd();
}
function moveClip(id,targetId){
 const from=clips.findIndex(c=>c.id===id),to=clips.findIndex(c=>c.id===targetId);
 if(from<0||to<0||from===to)return;
 const [item]=clips.splice(from,1);clips.splice(to,0,item);
 activeIndex=Math.max(0,clips.findIndex(c=>c.url===video.src));renderClips();updateEnd();
}
function renderClips(){
 if(!clips.length){
  clipList.innerHTML='<p>No extra clips added.</p>';
  videoLane.innerHTML='<div class="timelineClipV4190 videoClipV4190" id="timelineVideoClipV4190">Video 1</div>';
  return;
 }
 clipList.innerHTML=clips.map((clip,index)=>`<article class="producerClipItemV4240 ${index===activeIndex?'isActive':''}" draggable="true" data-clip-id="${clip.id}">
  <button type="button" data-open-clip="${clip.id}"><i>🎬</i><span><strong>Video ${index+1}</strong><small>${clip.name} · ${fmt(clip.duration)}</small></span></button>
  <button type="button" class="producerClipMuteV4240 ${clip.muted?'isMuted':''}" data-mute-clip="${clip.id}" title="Mute or unmute this clip">${clip.muted?'🔇':'🔊'}</button>
  <button type="button" class="producerClipDeleteV4240" data-delete-clip="${clip.id}" title="Remove clip">×</button>
 </article>`).join('');
 const total=Math.max(.01,totalDuration());let left=0;
 videoLane.innerHTML=clips.map((clip,index)=>{
  const width=clip.duration/total*100,html=`<button type="button" class="timelineVideoSegmentV4240 ${index===activeIndex?'isActive':''} ${clip.muted?'isMuted':''}" data-open-index="${index}" style="left:${left}%;width:${width}%"><strong>Video ${index+1}</strong><small>${clip.muted?'Muted · ':''}${fmt(clip.duration)}</small></button>`;
  left+=width;return html;
 }).join('');
 clipList.querySelectorAll('[data-open-clip]').forEach(button=>button.addEventListener('click',()=>loadIndex(clips.findIndex(c=>c.id===button.dataset.openClip),0,false)));
 clipList.querySelectorAll('[data-mute-clip]').forEach(button=>button.addEventListener('click',()=>{
  const clip=clips.find(c=>c.id===button.dataset.muteClip);if(!clip)return;clip.muted=!clip.muted;syncMute();renderClips();
 }));
 clipList.querySelectorAll('[data-delete-clip]').forEach(button=>button.addEventListener('click',async()=>{
  const index=clips.findIndex(c=>c.id===button.dataset.deleteClip);if(index<0)return;
  const [removed]=clips.splice(index,1);if(removed.url?.startsWith('blob:'))URL.revokeObjectURL(removed.url);
  activeIndex=Math.min(activeIndex,Math.max(0,clips.length-1));
  if(clips.length)await loadIndex(activeIndex,0,false);else{video.removeAttribute('src');video.load()}
  updateEnd();renderClips();
 }));
 clipList.querySelectorAll('[data-clip-id]').forEach(item=>{
  item.addEventListener('dragstart',()=>dragId=item.dataset.clipId);
  item.addEventListener('dragover',event=>event.preventDefault());
  item.addEventListener('drop',event=>{event.preventDefault();if(dragId)moveClip(dragId,item.dataset.clipId);dragId=null});
 });
 videoLane.querySelectorAll('[data-open-index]').forEach(button=>button.addEventListener('click',event=>{
  event.stopPropagation();loadIndex(Number(button.dataset.openIndex),0,false);
 }));
}
video.addEventListener('ended',async()=>{
 if(sequenceActive&&hasNext()){
  await loadIndex(activeIndex+1,0,true);
 }else{
  sequenceActive=false;renderSequence=false;
 }
});
videoInput.addEventListener('change',adoptPrimaryFile);
addInput?.addEventListener('change',async event=>{await addFiles(event.target.files,false);event.target.value=''});
$('#muteAllVideoClipsV4240')?.addEventListener('click',()=>{allVideoMuted=true;syncMute();renderClips()});
$('#unmuteAllVideoClipsV4240')?.addEventListener('click',()=>{allVideoMuted=false;clips.forEach(c=>c.muted=false);syncMute();renderClips()});
$('#clearVideoClipsV4240')?.addEventListener('click',()=>{
 clearClips();video.pause();video.removeAttribute('src');video.load();
 if(videoInput)videoInput.value='';
 const name=document.getElementById('composerVideoNameV4180');if(name)name.textContent='MP4, WEBM, MOV, or another browser-readable video.';
 clipStatus.textContent='All video clips cleared.';
});
$('#timelineMuteVideosV4240')?.addEventListener('click',event=>{event.stopPropagation();allVideoMuted=!allVideoMuted;syncMute();renderClips()});
$('#timelineMuteMusicV4240')?.addEventListener('click',event=>{
 event.stopPropagation();audio.muted=!audio.muted;event.currentTarget.textContent=audio.muted?'🔇':'🔊';event.currentTarget.classList.toggle('isMutedV4240',audio.muted);
});
window.addEventListener('pagehide',()=>clips.forEach(clip=>{if(clip.url?.startsWith('blob:'))URL.revokeObjectURL(clip.url)}));

window.SOSVideoClipsV4240={totalDuration,globalTime,hasMultiple,hasNext,startSequence,seekGlobal,getClips:()=>clips.map(c=>({...c,file:undefined})),activeIndex:()=>activeIndex};

/* Timed effect regions */
const effectSelect=$('#timelineEffectSelectV4240');
const effectLane=$('#timelineEffectsLaneV4190');
const effectStatus=$('#timelineEffectStatusV4240');
const snapToggle=$('#snapEffectsToBeatsV4240');
let effectStart=null,effectEnd=null,effectRegions=[],effectsMuted=false;
function effectName(input){
 const label=input.closest('label');
 return label?.querySelector('strong')?.textContent?.trim()||input.dataset.effect;
}
function populateEffects(){
 if(!effectSelect)return;
 const rows=$$('[data-effect]').map(input=>({value:input.dataset.effect,name:effectName(input)}));
 effectSelect.innerHTML='<option value="">Choose an effect</option>'+rows.map(row=>`<option value="${row.value}">${row.name}</option>`).join('');
}
function nearestBeat(time){
 if(!snapToggle?.checked)return time;
 const beats=$$('[data-marker-time]').map(el=>Number(el.dataset.markerTime)).filter(Number.isFinite);
 if(!beats.length)return time;
 return beats.reduce((best,value)=>Math.abs(value-time)<Math.abs(best-time)?value:best,beats[0]);
}
function effectProjectTime(){return nearestBeat(globalTime())}
function updateEffectButton(){
 $('#addTimedEffectV4240').disabled=!(effectSelect?.value&&Number.isFinite(effectStart)&&Number.isFinite(effectEnd)&&effectEnd>effectStart);
}
function renderEffectRegions(){
 if(!effectLane)return;
 const total=Math.max(.01,totalDuration());
 effectLane.innerHTML=effectRegions.map((region,index)=>`<article class="timedEffectRegionV4240 ${region.muted?'isMuted':''}" style="left:${region.start/total*100}%;width:${(region.end-region.start)/total*100}%">
  <button type="button" data-toggle-effect-region="${index}"><strong>${region.name}</strong><small>${fmt(region.start)}–${fmt(region.end)} · ${region.muted?'Muted':'Active'}</small></button>
  <button type="button" data-delete-effect-region="${index}" title="Delete effect region">×</button>
 </article>`).join('');
 effectLane.querySelectorAll('[data-toggle-effect-region]').forEach(button=>button.addEventListener('click',event=>{
  event.stopPropagation();const region=effectRegions[Number(button.dataset.toggleEffectRegion)];if(region){region.muted=!region.muted;renderEffectRegions()}
 }));
 effectLane.querySelectorAll('[data-delete-effect-region]').forEach(button=>button.addEventListener('click',event=>{
  event.stopPropagation();effectRegions.splice(Number(button.dataset.deleteEffectRegion),1);renderEffectRegions();
 }));
}
$('#markEffectStartV4240')?.addEventListener('click',()=>{effectStart=effectProjectTime();if(effectEnd!==null&&effectEnd<=effectStart)effectEnd=null;effectStatus.textContent=`Effect start marked at ${fmt(effectStart)}${snapToggle?.checked?' (beat-snapped)':''}.`;updateEffectButton()});
$('#markEffectEndV4240')?.addEventListener('click',()=>{effectEnd=effectProjectTime();if(effectStart===null||effectEnd<=effectStart){effectStatus.textContent='Move after the effect start before marking the end.';return}effectStatus.textContent=`Effect end marked at ${fmt(effectEnd)}. Ready to add.`;updateEffectButton()});
effectSelect?.addEventListener('change',updateEffectButton);
$('#addTimedEffectV4240')?.addEventListener('click',()=>{
 const input=$(`[data-effect="${CSS.escape(effectSelect.value)}"]`);if(!input)return;
 effectRegions.push({effect:effectSelect.value,name:effectName(input),start:effectStart,end:effectEnd,muted:false});
 effectRegions.sort((a,b)=>a.start-b.start);effectStart=null;effectEnd=null;renderEffectRegions();updateEffectButton();effectStatus.textContent='Timed effect region added to the Effects lane.';
});
function setEffectsMuted(value){
 effectsMuted=value;$('#timelineMuteEffectsV4240').textContent=value?'🚫':'✨';$('#timelineMuteEffectsV4240').classList.toggle('isMutedV4240',value);
 renderEffectRegions();
}
$('#muteAllEffectsV4240')?.addEventListener('click',()=>setEffectsMuted(true));
$('#unmuteAllEffectsV4240')?.addEventListener('click',()=>setEffectsMuted(false));
$('#timelineMuteEffectsV4240')?.addEventListener('click',event=>{event.stopPropagation();setEffectsMuted(!effectsMuted)});
$('#clearTimedEffectsV4240')?.addEventListener('click',()=>{effectRegions=[];renderEffectRegions();effectStatus.textContent='All timed effect regions cleared.'});
populateEffects();renderEffectRegions();

window.SOSTimedEffectsV4240={
 active:time=>effectsMuted?[]:effectRegions.filter(region=>!region.muted&&time>=region.start&&time<=region.end).map(region=>region.effect),
 regions:()=>effectRegions.map(region=>({...region})),
 muted:()=>effectsMuted
};
})();
