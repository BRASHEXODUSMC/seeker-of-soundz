/* Seeker Of SoundZ v4.33.0 — precision timeline, native video sizing, music trim, SOS quick files */
(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const content=$('#timelineContentV4250');
const viewport=$('#timelineViewportV4250');
const videoLane=$('#timelineVideoLaneV4240');
const musicLane=$('#timelineMusicLaneV4270');
const playhead=$('#timelinePlayheadV4190');
const video=$('#composerPreviewVideoV4180');
const canvas=$('#composerCanvasV4180');
const videoInput=$('#composerVideoV4180');
const audio=$('#composerPreviewAudioV4180');
const audioInput=$('#composerAudioV4180');
if(!content||!videoLane||!musicLane)return;

let pointer={track:'video',time:0,x:0};
let draggingPlayhead=false;
let videoSettings={mode:'stretch',nativeWidth:1280,nativeHeight:720,projectWidth:canvas?.width||1280,projectHeight:canvas?.height||720};
let musicTrim={sourceStart:0,sourceEnd:0,projectOffset:0,duration:0};
let musicDrag=null;
let musicAuditionTimer=0;

const duration=()=>Math.max(.01,window.SOSVideoClipsV4240?.totalDuration?.()||Number(video?.duration||60)||60);
const timelineGeometry=()=>{
 const contentRect=content.getBoundingClientRect();
 const laneRect=videoLane.getBoundingClientRect();
 return {
  contentRect,laneRect,
  trackLeft:laneRect.left,
  trackWidth:Math.max(1,laneRect.width),
  contentLeft:contentRect.left
 };
};
function pointToTimeline(clientX){
 const g=timelineGeometry();
 const local=Math.max(0,Math.min(g.trackWidth,clientX-g.trackLeft));
 const time=local/g.trackWidth*duration();
 const contentX=g.trackLeft-g.contentLeft+local;
 return {time,contentX,percent:local/g.trackWidth*100};
}
function updatePointer(event,track){
 const p=pointToTimeline(event.clientX);
 pointer={track,time:p.time,x:p.contentX};
 content.style.setProperty('--precision-pointer-x',`${p.contentX}px`);
 content.style.setProperty('--razor-x',`${p.contentX}px`);
 content.dataset.razorTrack=track;
}
videoLane.addEventListener('pointermove',event=>updatePointer(event,'video'),true);
musicLane.addEventListener('pointermove',event=>updatePointer(event,'music'),true);

/* Override Shift+K with the corrected shared geometry. */
document.addEventListener('keydown',async event=>{
 if(!event.shiftKey||event.key.toLowerCase()!=='k')return;
 if(event.target.closest('input,textarea,select,[contenteditable="true"]'))return;
 event.preventDefault();event.stopImmediatePropagation();
 if(pointer.track==='music'){
  window.SOSMusicRazorV4270?.splitAt?.(musicTrim.sourceStart+Math.max(0,pointer.time-musicTrim.projectOffset));
 }else{
  const result=await window.SOSVideoClipsV4240?.splitAt?.(pointer.time,{snap:$('#timelineSnapToggleV4310')?.classList.contains('isActive'),tolerance:.14});
  window.SOS?.toast?.(result?.ok?`Video split at ${pointer.time.toFixed(2)} seconds.`:(result?.message||'Unable to split there.'),{title:'Precision Razor',icon:result?.ok?'✂':'!'});
 }
},true);

/* Click or drag the playhead directly under the pointer. */
function seekPointer(event){
 const p=pointToTimeline(event.clientX);
 window.SOSVideoClipsV4240?.seekGlobal?.(p.time);
 if(playhead){playhead.style.left=`${p.contentX}px`;playhead.style.transform='translateX(-1px)'}
}
content.addEventListener('pointerdown',event=>{
 if(event.button!==0||event.target.closest('button,input,select,textarea,[data-trim-left],[data-trim-right]'))return;
 if(!event.target.closest('.timelineLaneV4190,.timelineRulerV4190'))return;
 draggingPlayhead=true;seekPointer(event);content.setPointerCapture?.(event.pointerId);
},true);
content.addEventListener('pointermove',event=>{if(draggingPlayhead)seekPointer(event)},true);
content.addEventListener('pointerup',()=>draggingPlayhead=false,true);
content.addEventListener('pointercancel',()=>draggingPlayhead=false,true);

/* Native video resolution and sizing dialog. */
const dialog=$('#videoSettingsDialogV4330');
function aspect(w,h){const gcd=(a,b)=>b?gcd(b,a%b):a,d=gcd(w,h);return `${Math.round(w/d)}:${Math.round(h/d)}`}
function applyVideoSizing(mode){
 videoSettings.mode=mode;
 if(mode==='match'&&canvas){
  canvas.width=videoSettings.nativeWidth;canvas.height=videoSettings.nativeHeight;
  videoSettings.projectWidth=canvas.width;videoSettings.projectHeight=canvas.height;
 }else if(mode==='keep'||mode==='stretch'||mode==='fit'||mode==='fill'){
  if(mode==='keep')videoSettings.mode='stretch';
 }
 document.documentElement.style.setProperty('--producer-video-aspect',`${videoSettings.projectWidth}/${videoSettings.projectHeight}`);
 dialog?.close();
 window.dispatchEvent(new CustomEvent('sos:video-sizing-changed',{detail:{...videoSettings}}));
 window.SOS?.toast?.(`Project sizing set to ${mode==='match'?'native resolution':mode}.`,{title:'Video Settings',icon:'✓'});
}
video?.addEventListener('loadedmetadata',()=>{
 const w=video.videoWidth||1280,h=video.videoHeight||720;
 videoSettings.nativeWidth=w;videoSettings.nativeHeight=h;
 $('#videoMetadataTitleV4330').textContent=`${w} × ${h} video detected`;
 $('#videoMetadataDetailsV4330').textContent=`Aspect ratio ${aspect(w,h)} · Current project ${canvas.width} × ${canvas.height}. The viewer stays compact while output settings change.`;
 if(dialog&&!dialog.open)dialog.showModal();
});
$$('[data-video-sizing-v4330]').forEach(button=>button.addEventListener('click',()=>applyVideoSizing(button.dataset.videoSizingV4330)));
$('#closeVideoSettingsV4330')?.addEventListener('click',()=>dialog?.close());

/* Music trim, source start, source end, and project offset. */
const startInput=$('#musicSourceStartV4330'),endInput=$('#musicSourceEndV4330'),offsetInput=$('#musicProjectOffsetV4330');
const startHandle=$('#musicTrimStartV4330'),endHandle=$('#musicTrimEndV4330'),selection=$('#musicTrimSelectionV4330');
function normalizeMusic(){
 const total=Math.max(.01,Number(audio?.duration||musicTrim.duration||1));
 musicTrim.duration=total;
 musicTrim.sourceStart=Math.max(0,Math.min(total-.01,Number(startInput?.value||musicTrim.sourceStart||0)));
 musicTrim.sourceEnd=Math.max(musicTrim.sourceStart+.01,Math.min(total,Number(endInput?.value||musicTrim.sourceEnd||total)));
 musicTrim.projectOffset=Math.max(0,Number(offsetInput?.value||musicTrim.projectOffset||0));
 if(startInput)startInput.value=musicTrim.sourceStart.toFixed(2);
 if(endInput)endInput.value=musicTrim.sourceEnd.toFixed(2);
 if(offsetInput)offsetInput.value=musicTrim.projectOffset.toFixed(2);
 renderMusicTrim();
 window.dispatchEvent(new CustomEvent('sos:music-trim-changed',{detail:{...musicTrim}}));
 return musicTrim;
}
function renderMusicTrim(){
 const total=Math.max(.01,musicTrim.duration||1);
 const left=musicTrim.sourceStart/total*100,right=musicTrim.sourceEnd/total*100;
 if(startHandle)startHandle.style.left=`${left}%`;
 if(endHandle)endHandle.style.left=`${right}%`;
 if(selection){selection.style.left=`${left}%`;selection.style.width=`${Math.max(0,right-left)}%`}
}
function musicSourceFromPointer(clientX){
 const rect=musicLane.getBoundingClientRect();
 return Math.max(0,Math.min(1,(clientX-rect.left)/Math.max(1,rect.width)))*Math.max(.01,musicTrim.duration||audio?.duration||1);
}
function beginMusicDrag(event,edge){
 event.preventDefault();event.stopPropagation();musicDrag={edge,pointer:event.pointerId};event.currentTarget.setPointerCapture?.(event.pointerId);
}
startHandle?.addEventListener('pointerdown',e=>beginMusicDrag(e,'start'));
endHandle?.addEventListener('pointerdown',e=>beginMusicDrag(e,'end'));
function auditionMusicSource(value){
 if(!audio?.src)return;
 const safe=Math.max(0,Math.min((audio.duration||value+.01)-.01,value));
 audio.currentTime=safe;
 clearTimeout(musicAuditionTimer);
 if(video?.paused){
  audio.volume=Math.max(.05,Number(document.querySelector('#composerMusicVolumeV4180')?.value||.75));
  audio.play().catch(()=>{});
  musicAuditionTimer=setTimeout(()=>audio.pause(),650);
 }
}
window.addEventListener('pointermove',event=>{
 if(!musicDrag||event.pointerId!==musicDrag.pointer)return;
 event.preventDefault();event.stopPropagation();
 const value=musicSourceFromPointer(event.clientX);
 if(musicDrag.edge==='start')startInput.value=Math.min(value,musicTrim.sourceEnd-.01).toFixed(2);
 else endInput.value=Math.max(value,musicTrim.sourceStart+.01).toFixed(2);
 normalizeMusic();
 auditionMusicSource(musicDrag.edge==='start'?musicTrim.sourceStart:Math.max(musicTrim.sourceStart,musicTrim.sourceEnd-.08));
});
window.addEventListener('pointerup',event=>{
 if(!musicDrag||event.pointerId!==musicDrag.pointer)return;
 const edge=musicDrag.edge;musicDrag=null;
 const source=edge==='start'?musicTrim.sourceStart:Math.max(musicTrim.sourceStart,musicTrim.sourceEnd-.08);
 auditionMusicSource(source);
 if(edge==='start'&&window.SOSVideoClipsV4240?.seekGlobal){
  window.SOSVideoClipsV4240.seekGlobal(musicTrim.projectOffset);
 }
},true);
window.addEventListener('pointercancel',()=>{musicDrag=null});
[startInput,endInput,offsetInput].forEach(input=>input?.addEventListener('input',normalizeMusic));
audio?.addEventListener('loadedmetadata',()=>{
 musicTrim.duration=audio.duration||0;musicTrim.sourceStart=0;musicTrim.sourceEnd=audio.duration||0;musicTrim.projectOffset=0;normalizeMusic();
});
$('#resetMusicTrimV4330')?.addEventListener('click',()=>{
 musicTrim.sourceStart=0;musicTrim.sourceEnd=audio?.duration||0;musicTrim.projectOffset=0;
 if(startInput)startInput.value='0';if(endInput)endInput.value=String(audio?.duration||0);if(offsetInput)offsetInput.value='0';normalizeMusic();
});
function musicActive(projectTime){
 const t=Number(projectTime)||0;
 if(t<musicTrim.projectOffset)return false;
 const span=Math.max(.01,musicTrim.sourceEnd-musicTrim.sourceStart);
 return t-musicTrim.projectOffset<span;
}
function mapMusicTime(projectTime){
 const t=Math.max(0,Number(projectTime)||0);
 if(t<musicTrim.projectOffset)return musicTrim.sourceStart;
 return Math.min(musicTrim.sourceEnd-.01,musicTrim.sourceStart+(t-musicTrim.projectOffset));
}

/* Quick SOS file controls proxy the complete Pro Suite save/import controls. */
$('#quickSaveProjectV4330')?.addEventListener('click',()=>$('#saveProjectV4320')?.click());
$('#quickImportProjectV4330')?.addEventListener('click',()=>$('#importProjectV4320')?.click());
$('#quickSavePresetV4330')?.addEventListener('click',()=>$('#savePresetV4320')?.click());
$('#quickImportPresetV4330')?.addEventListener('click',()=>$('#importPresetV4320')?.click());

window.SOSMediaSettingsV4330={
 video:()=>({...videoSettings}),
 music:()=>({...musicTrim}),
 musicActive,mapMusicTime,
 sourceRange:()=>({start:musicTrim.sourceStart,end:musicTrim.sourceEnd,offset:musicTrim.projectOffset}),
 seekToStart:()=>{
  if(audio?.src)audio.currentTime=musicTrim.sourceStart;
  window.SOSVideoClipsV4240?.seekGlobal?.(musicTrim.projectOffset);
 },
 applyVideoSizing,
 timelinePoint:clientX=>pointToTimeline(clientX)
};
normalizeMusic();
})();
