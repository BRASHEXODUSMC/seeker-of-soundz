/* Seeker Of SoundZ v4.30.0 — reliable playhead and draggable project range */
(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const video=$('#composerPreviewVideoV4180');
const audio=$('#composerPreviewAudioV4180');
const content=$('#timelineContentV4250');
const viewport=$('#timelineViewportV4250');
const playhead=$('#timelinePlayheadV4190');
const range=$('#timelineProjectRangeV4300');
const startHandle=$('#timelineStartHandleV4300');
const endHandle=$('#timelineEndHandleV4300');
const startLabel=$('#timelineStartLabelV4300');
const endLabel=$('#timelineEndLabelV4300');
const before=$('#timelineRangeShadeBeforeV4300');
const after=$('#timelineRangeShadeAfterV4300');
const selection=$('#timelineRangeSelectionV4300');
const startInput=$('#composerStartV4180');
const endInput=$('#composerEndV4180');
if(!content||!playhead||!range||!startInput||!endInput)return;

let dragging=null;
let raf=0;
let lastTime=-1;
const duration=()=>Math.max(.01,window.SOSVideoClipsV4240?.totalDuration?.()||Number(video?.duration||endInput.value||60));
const current=()=>Math.max(0,window.SOSVideoClipsV4240?.globalTime?.()??Number(video?.currentTime||0));
const format=value=>{const n=Math.max(0,Number(value)||0),m=Math.floor(n/60),s=n%60;return `${String(m).padStart(2,'0')}:${s.toFixed(2).padStart(5,'0')}`};

function normalizeRange(){
 const total=duration();
 let start=Math.max(0,Math.min(total,Number(startInput.value)||0));
 let end=Math.max(start+.01,Math.min(total,Number(endInput.value)||total));
 if(end>total)end=total;
 if(start>=end)start=Math.max(0,end-.01);
 startInput.value=start.toFixed(2);
 endInput.value=end.toFixed(2);
 return {start,end,total};
}
function snapTime(time){
 const total=duration();
 const tolerance=Math.max(.04,total/Math.max(800,content.clientWidth)*10);
 let candidates=[0,total];
 if($('#snapPlayheadToClipEdgesV4260')?.checked&&window.SOSVideoClipsV4240?.clipEdges)candidates.push(...window.SOSVideoClipsV4240.clipEdges());
 if($('#snapEffectsToBeatsV4240')?.checked)candidates.push(...[...document.querySelectorAll('[data-marker-time]')].map(el=>Number(el.dataset.markerTime)).filter(Number.isFinite));
 const nearest=candidates.reduce((best,value)=>Math.abs(value-time)<Math.abs(best-time)?value:best,time);
 return Math.abs(nearest-time)<=tolerance?nearest:time;
}
function renderRange(){
 const {start,end,total}=normalizeRange();
 const startP=start/total*100,endP=end/total*100;
 startHandle.style.left=`${startP}%`;endHandle.style.left=`${endP}%`;
 before.style.left='0%';before.style.width=`${startP}%`;
 selection.style.left=`${startP}%`;selection.style.width=`${Math.max(0,endP-startP)}%`;
 after.style.left=`${endP}%`;after.style.width=`${Math.max(0,100-endP)}%`;
 startLabel.textContent=`Start ${format(start)}`;endLabel.textContent=`End ${format(end)}`;
}
function renderPlayhead(){
 const total=duration(),time=Math.min(total,current());
 const percent=time/total*100;
 playhead.style.left=`calc(var(--timeline-label-width, 120px) + (100% - var(--timeline-label-width, 120px)) * ${percent/100})`;
 playhead.style.transform='translateX(-1px)';
 playhead.dataset.time=format(time);
 if(Math.abs(time-lastTime)>.002){
  lastTime=time;
  const currentText=$('#producerCurrentTimeV4190');if(currentText)currentText.textContent=format(time);
  const durationText=$('#producerDurationV4190');if(durationText)durationText.textContent=format(total);
 }
 const end=Math.min(total,Number(endInput.value)||total);
 if(!video?.paused&&time>=end-.015){
  video.pause();audio?.pause();
 }
 raf=requestAnimationFrame(renderPlayhead);
}
/* Range dragging is handled by Producer Hub 5.6.1 professional timeline.
   This runtime now owns only range rendering and playhead tracking. */
[startInput,endInput].forEach(input=>{input.addEventListener('input',renderRange);input.addEventListener('change',renderRange)});
['sos:ripple-cut-applied','sos:video-split','sos:video-segment-deleted','sos:beat-analysis-complete'].forEach(name=>window.addEventListener(name,()=>setTimeout(renderRange,50)));
new ResizeObserver(renderRange).observe(content);
renderRange();cancelAnimationFrame(raf);renderPlayhead();

window.SOSProjectRangeV4300={
 get:()=>normalizeRange(),
 set:(start,end)=>{startInput.value=Number(start).toFixed(2);endInput.value=Number(end).toFixed(2);renderRange()},
 snapTime
};
})();
