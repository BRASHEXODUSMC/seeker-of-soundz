/* Seeker Of SoundZ v4.27.0 — Shift+K razor tool for video and music */
(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const videoLane=$('#timelineVideoLaneV4240');
const musicLane=$('#timelineMusicLaneV4270');
const musicHost=$('#timelineMusicSegmentsV4270');
const audio=$('#composerPreviewAudioV4180');
const audioInput=$('#composerAudioV4180');
const timelineContent=$('#timelineContentV4250')||$('#timelineTracksV4190');
if(!videoLane||!musicLane||!timelineContent)return;

let hoverTrack='video';
let hoverTime=0;
let musicSegments=[];
let musicDuration=0;
let musicManualMuted=false;

const totalDuration=()=>window.SOSVideoClipsV4240?.totalDuration?.()||Number(audio?.duration||60)||60;
const fmt=value=>{const total=Math.max(0,Number(value)||0),m=Math.floor(total/60),s=total%60;return `${String(m).padStart(2,'0')}:${s.toFixed(2).padStart(5,'0')}`};
const uid=()=>`music-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;

function pointerTime(event,lane){
 const rect=lane.getBoundingClientRect();
 const ratio=Math.max(0,Math.min(1,(event.clientX-rect.left)/Math.max(1,rect.width)));
 return ratio*totalDuration();
}
function updateHover(event,track,lane){
 hoverTrack=track;
 hoverTime=pointerTime(event,lane);
 timelineContent.style.setProperty('--razor-x',`${Math.max(0,Math.min(100,hoverTime/Math.max(.01,totalDuration())*100))}%`);
 timelineContent.dataset.razorTrack=track;
}
videoLane.addEventListener('pointermove',event=>updateHover(event,'video',videoLane));
musicLane.addEventListener('pointermove',event=>updateHover(event,'music',musicLane));
[videoLane,musicLane].forEach(lane=>{
 lane.addEventListener('pointerenter',()=>timelineContent.classList.add('isRazorHoverV4270'));
 lane.addEventListener('pointerleave',()=>timelineContent.classList.remove('isRazorHoverV4270'));
});

function resetMusicSegments(){
 musicDuration=Number(audio?.duration||0)||totalDuration();
 musicSegments=[{id:uid(),start:0,end:musicDuration,deleted:false}];
 renderMusicSegments();
}
function ensureMusicSegments(){
 const duration=Number(audio?.duration||0)||totalDuration();
 if(!musicSegments.length||Math.abs(duration-musicDuration)>.05)resetMusicSegments();
}
function musicSplitAt(time){
 ensureMusicSegments();
 const clamped=Math.max(0,Math.min(musicDuration,time));
 const index=musicSegments.findIndex(segment=>!segment.deleted&&clamped>segment.start+.025&&clamped<segment.end-.025);
 if(index<0){
  window.SOS?.toast?.('Move the pointer inside an active music section before pressing Shift + K.',{title:'Music Razor',icon:'!'});
  return false;
 }
 const segment=musicSegments[index];
 const left={...segment,id:uid(),end:clamped};
 const right={...segment,id:uid(),start:clamped};
 musicSegments.splice(index,1,left,right);
 renderMusicSegments();
 window.SOS?.toast?.(`Music split at ${fmt(clamped)}. Hover the split to delete its left or right side.`,{title:'Music Razor',icon:'✂'});
 return true;
}
function deleteMusicSegment(id){
 const segment=musicSegments.find(item=>item.id===id);
 if(!segment)return;
 segment.deleted=true;
 renderMusicSegments();
 window.SOS?.toast?.(`Music section ${fmt(segment.start)}–${fmt(segment.end)} removed from the project.`,{title:'Music Razor',icon:'✓'});
}
function restoreMusicSegment(id){
 const segment=musicSegments.find(item=>item.id===id);
 if(!segment)return;
 segment.deleted=false;
 renderMusicSegments();
}
function renderMusicSegments(){
 if(!musicHost)return;
 const duration=Math.max(.01,musicDuration||totalDuration());
 musicHost.innerHTML=musicSegments.map((segment,index)=>{
  const left=segment.start/duration*100,width=(segment.end-segment.start)/duration*100;
  const next=musicSegments[index+1];
  const boundary=next?`<div class="razorBoundaryV4270 musicRazorBoundaryV4270" style="left:${segment.end/duration*100}%">
    <button type="button" data-delete-music-left="${segment.id}" title="Delete music section on the left">×L</button>
    <i></i>
    <button type="button" data-delete-music-right="${next.id}" title="Delete music section on the right">R×</button>
   </div>`:'';
  return `<button type="button" class="musicRazorSegmentV4270 ${segment.deleted?'isDeleted':''}" data-music-segment="${segment.id}" style="left:${left}%;width:${width}%" title="${segment.deleted?'Restore':'Music'} ${fmt(segment.start)}–${fmt(segment.end)}">
   <strong>${segment.deleted?'Removed':'Music'}</strong><small>${fmt(segment.start)}–${fmt(segment.end)}</small>
  </button>${boundary}`;
 }).join('');
 musicHost.querySelectorAll('[data-delete-music-left],[data-delete-music-right]').forEach(button=>button.addEventListener('click',event=>{
  event.preventDefault();event.stopPropagation();
  deleteMusicSegment(button.dataset.deleteMusicLeft||button.dataset.deleteMusicRight);
 }));
 musicHost.querySelectorAll('[data-music-segment]').forEach(button=>button.addEventListener('dblclick',event=>{
  event.preventDefault();restoreMusicSegment(button.dataset.musicSegment);
 }));
}
function musicIsActive(time){
 ensureMusicSegments();
 if(!musicDuration)return true;
 const local=((time%musicDuration)+musicDuration)%musicDuration;
 return musicSegments.some(segment=>!segment.deleted&&local>=segment.start&&local<segment.end);
}
function updateMusicMute(){
 if(!audio)return requestAnimationFrame(updateMusicMute);
 const timelineMute=$('#timelineMuteMusicV4240');
 musicManualMuted=Boolean(timelineMute?.classList.contains('isMutedV4240'));
 const projectTime=window.SOSVideoClipsV4240?.globalTime?.()??Number(audio.currentTime||0);
 audio.muted=musicManualMuted||!musicIsActive(projectTime);
 requestAnimationFrame(updateMusicMute);
}
audio?.addEventListener('loadedmetadata',resetMusicSegments);
audioInput?.addEventListener('change',()=>setTimeout(resetMusicSegments,80));
updateMusicMute();

async function splitVideo(){
 const snap=$('#snapPlayheadToClipEdgesV4260')?.checked===true;
 const result=await window.SOSVideoClipsV4240?.splitAt?.(hoverTime,{snap,tolerance:.12});
 if(result?.ok){
  window.SOS?.toast?.(`Video split at ${fmt(result.time)}. Hover the boundary to delete its left or right side.`,{title:'Video Razor',icon:'✂'});
 }else{
  window.SOS?.toast?.(result?.message||'The video could not be split there.',{title:'Video Razor',icon:'!'});
 }
}
document.addEventListener('keydown',event=>{
 if(!event.shiftKey||event.key.toLowerCase()!=='k')return;
 if(event.target.closest('input,textarea,select,[contenteditable="true"]'))return;
 event.preventDefault();
 if(hoverTrack==='music')musicSplitAt(hoverTime);
 else splitVideo();
});

window.SOSMusicRazorV4270={
 segments:()=>musicSegments.map(segment=>({...segment})),
 splitAt:musicSplitAt,
 deleteSegment:deleteMusicSegment,
 restoreSegment:restoreMusicSegment,
 isActive:musicIsActive
};
})();
