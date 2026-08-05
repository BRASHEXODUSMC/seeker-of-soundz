/* Seeker Of SoundZ v4.27.0 — restored beat analysis and marker bridge */
(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const audioInput=$('#composerAudioV4180');
const audio=$('#composerPreviewAudioV4180');
const video=$('#composerPreviewVideoV4180');
const markerLane=$('#timelineMarkerLaneV4190');
const waveform=$('#timelineWaveformV4190');
const analyzeButton=$('#analyzeBeatsV4190');
const autoButton=$('#autoSyncEffectsV4190');
if(!markerLane||!analyzeButton)return;

let context=null;
let buffer=null;
let markers=[];
let analyzing=false;
let autoSyncRequested=false;

const projectDuration=()=>window.SOSVideoClipsV4240?.totalDuration?.()||Number(video?.duration||audio?.duration||buffer?.duration||60)||60;
const formatTime=(value=0)=>{const total=Math.max(0,Number(value)||0),minutes=Math.floor(total/60),seconds=total%60;return `${String(minutes).padStart(2,'0')}:${seconds.toFixed(2).padStart(5,'0')}`};

async function sourceArrayBuffer(){
 const file=audioInput?.files?.[0];
 if(file)return await file.arrayBuffer();
 const source=audio?.currentSrc||audio?.src;
 if(source){
  const response=await fetch(source);
  if(!response.ok)throw new Error('The selected music could not be read for beat analysis.');
  return await response.arrayBuffer();
 }
 throw new Error('Upload your music before selecting Analyze Beats.');
}
async function decode(){
 const C=window.AudioContext||window.webkitAudioContext;
 if(!C)throw new Error('This browser does not support audio beat analysis.');
 context ||= new C();
 if(context.state==='suspended')await context.resume().catch(()=>{});
 const bytes=await sourceArrayBuffer();
 buffer=await context.decodeAudioData(bytes.slice(0));
 return buffer;
}
function monoData(audioBuffer){
 const length=audioBuffer.length,channels=audioBuffer.numberOfChannels;
 const mono=new Float32Array(length);
 for(let channel=0;channel<channels;channel++){
  const data=audioBuffer.getChannelData(channel);
  for(let i=0;i<length;i++)mono[i]+=data[i]/channels;
 }
 return mono;
}
function analyzeBuffer(audioBuffer){
 const data=monoData(audioBuffer),rate=audioBuffer.sampleRate;
 const frame=1024,hop=512;
 const energies=[],flux=[];
 let previous=0;
 for(let start=0;start<data.length;start+=hop){
  let sum=0,peak=0;
  const end=Math.min(data.length,start+frame);
  for(let i=start;i<end;i++){const sample=data[i];sum+=sample*sample;peak=Math.max(peak,Math.abs(sample))}
  const rms=Math.sqrt(sum/Math.max(1,end-start));
  energies.push(rms);
  flux.push(Math.max(0,rms-previous)+peak*.08);
  previous=rms;
 }
 const sorted=[...flux].sort((a,b)=>a-b);
 const base=sorted[Math.floor(sorted.length*.74)]||0;
 const strong=sorted[Math.floor(sorted.length*.91)]||base;
 const rows=[];
 let last=-Infinity;
 for(let i=2;i<flux.length-2;i++){
  const local=(flux[i-2]+flux[i-1]+flux[i]+flux[i+1]+flux[i+2])/5;
  const threshold=Math.max(base*1.12,local*1.14);
  const time=i*hop/rate;
  const peak=flux[i]>=flux[i-1]&&flux[i]>=flux[i+1];
  if(peak&&flux[i]>threshold&&time-last>.16){
   rows.push({time,energy:flux[i],drop:flux[i]>=strong});
   last=time;
  }
 }
 if(rows.length<8){
  rows.length=0;last=-Infinity;
  const fallback=sorted[Math.floor(sorted.length*.62)]||0;
  flux.forEach((value,index)=>{
   const time=index*hop/rate;
   if(value>fallback&&time-last>.24){rows.push({time,energy:value,drop:value>=strong});last=time}
  });
 }
 return rows.slice(0,900);
}
function drawWave(audioBuffer){
 if(!waveform)return;
 const ctx=waveform.getContext('2d'),w=waveform.width,h=waveform.height,data=monoData(audioBuffer);
 ctx.clearRect(0,0,w,h);
 ctx.fillStyle='rgba(5,3,8,.88)';ctx.fillRect(0,0,w,h);
 const gradient=ctx.createLinearGradient(0,0,w,0);
 gradient.addColorStop(0,'#9450dc');gradient.addColorStop(.5,'#d8a8ff');gradient.addColorStop(1,'#55e5a0');
 ctx.strokeStyle=gradient;ctx.lineWidth=1;
 const step=Math.max(1,Math.floor(data.length/w));
 for(let x=0;x<w;x++){
  let min=1,max=-1;
  for(let j=0;j<step;j++){const value=data[x*step+j]||0;min=Math.min(min,value);max=Math.max(max,value)}
  ctx.beginPath();ctx.moveTo(x,(1+min)*h/2);ctx.lineTo(x,(1+max)*h/2);ctx.stroke();
 }
}
function render(){
 const duration=Math.max(.01,buffer?.duration||projectDuration());
 markerLane.innerHTML=markers.map((marker,index)=>{
  const drop=marker.drop||index%16===0;
  return `<button type="button" class="beatMarkerV4190 ${drop?'isDrop':''}" style="left:${marker.time/duration*100}%" title="${formatTime(marker.time)}${drop?' · strong beat':''}" data-marker-time="${marker.time}" data-beat-energy="${marker.energy}" aria-label="Beat at ${formatTime(marker.time)}"></button>`;
 }).join('');
 const status=$('#timelineStatusV4190');
 if(status)status.textContent=markers.length?`${markers.length} beat markers detected`:'No beat markers detected';
 const summary=$('#producerWaveformSummaryV4190');
 if(summary)summary.innerHTML=`<strong>${markers.length} beat markers generated</strong><small>${formatTime(duration)} analyzed at ${buffer?.sampleRate||0} Hz.</small>`;
 $('#downloadTimelineWaveformV4190')?.removeAttribute('disabled');
 $('#exportBeatMarkersV4190')?.removeAttribute('disabled');
 window.SOSBeatAnalysisV4270={markers:()=>markers.map(row=>({...row})),buffer:()=>buffer,duration:()=>duration};
 window.dispatchEvent(new CustomEvent('sos:beat-analysis-complete',{detail:{count:markers.length,markers:markers.map(row=>({...row})),duration}}));
 window.SOSProducerAutoSyncV4270?.refreshBeats?.();
}
async function runAnalysis(){
 if(analyzing)return false;
 analyzing=true;analyzeButton.disabled=true;analyzeButton.textContent='Analyzing…';
 window.dispatchEvent(new CustomEvent('sos:beat-analysis-start'));
 try{
  const decoded=await decode();
  drawWave(decoded);
  markers=analyzeBuffer(decoded);
  render();
  window.SOS?.toast?.(`${markers.length} beat markers generated and restored to the timeline.`,{title:'Beat Analysis',icon:'✓'});
  return true;
 }catch(error){
  console.error('[Producer Hub 5.2] Beat analysis',error);
  window.SOS?.toast?.(error.message||'Beat analysis failed.',{title:'Beat Analysis',icon:'!'});
  return false;
 }finally{
  analyzing=false;analyzeButton.disabled=false;analyzeButton.textContent='Analyze Beats';
 }
}
analyzeButton.addEventListener('click',event=>{
 event.preventDefault();event.stopImmediatePropagation();
 runAnalysis().then(success=>{
  if(success&&autoSyncRequested){
   autoSyncRequested=false;
   setTimeout(()=>window.SOSProducerAutoSyncV4270?.generate?.(),60);
  }
 });
},true);

autoButton?.addEventListener('click',event=>{
 if(markers.length)return;
 autoSyncRequested=true;
 event.preventDefault();
 runAnalysis().then(success=>{
  if(success){autoSyncRequested=false;setTimeout(()=>window.SOSProducerAutoSyncV4270?.generate?.(),80)}
 });
},false);

markerLane.addEventListener('click',event=>{
 const marker=event.target.closest('[data-marker-time]');
 if(!marker)return;
 const time=Number(marker.dataset.markerTime)||0;
 window.SOSVideoClipsV4240?.seekGlobal?.(time);
 if(audio?.src)audio.currentTime=Math.min(time,audio.duration||time);
});
})();
