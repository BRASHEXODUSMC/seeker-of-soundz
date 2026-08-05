/* Seeker Of SoundZ v4.21.0 — Producer Hub 4.0 additive runtime */
(()=>{
'use strict';
const hub=document.getElementById('producerHubV4190');
if(!hub)return;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const video=$('#composerPreviewVideoV4180');
const videoInput=$('#composerVideoV4180');
const audioInput=$('#composerAudioV4180');
const waveformCanvas=$('#timelineWaveformV4190');
let theatre=false,dragging=false,decodedBuffer=null,decodedName='',virtualTimelineTime=0;const virtualTimelineDuration=60;

function toast(message,title='Producer Hub 4.0'){window.SOS?.toast?.(message,{title,icon:'✓'})}
function disableCursor(active){document.body.classList.toggle('producerNativeCursorV4210',active)}
hub.addEventListener('pointerenter',()=>disableCursor(true));
hub.addEventListener('pointerleave',()=>{if(!theatre)disableCursor(false)});
window.addEventListener('pagehide',()=>disableCursor(false));

function toggleTheatre(force){
 theatre=typeof force==='boolean'?force:!theatre;
 document.body.classList.toggle('producerTheatreBodyV4210',theatre);
 hub.classList.toggle('producerTheatreV4210',theatre);
 disableCursor(theatre);
 const b=$('#producerTheatreViewV4210');if(b){b.setAttribute('aria-pressed',String(theatre));b.textContent=theatre?'Exit Theatre View':'Theatre View'}
}
$('#producerTheatreViewV4210')?.addEventListener('click',()=>toggleTheatre());
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&theatre)toggleTheatre(false)});

function effectMeta(input){
 const label=input.closest('label');
 return {name:label?.querySelector('strong')?.textContent?.trim()||input.dataset.effect,copy:label?.querySelector('small')?.textContent?.trim()||'Procedural effect',category:label?.closest('details')?.querySelector('summary')?.childNodes?.[0]?.textContent?.trim()||'Effects'};
}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function renderEffects(){
 const host=$('#producerEffectsGridV4210');if(!host)return;
 const q=String($('#producerEffectsSearchV4210')?.value||'').trim().toLowerCase(),inputs=$$('[data-effect]');
 $('#producerEffectsCountV4210').textContent=`${inputs.length} effects`;
 $('#composerCanvasV4180')?.classList.toggle('isEffectsActiveV4211',inputs.some(input=>input.checked));
 const rows=inputs.map(input=>({input,...effectMeta(input)})).filter(row=>!q||`${row.name} ${row.copy} ${row.category}`.toLowerCase().includes(q));
 host.innerHTML=rows.map(row=>`<button type="button" class="${row.input.checked?'isActive':''}" data-library-effect="${row.input.dataset.effect}"><span><strong>${esc(row.name)}</strong><small>${esc(row.category)} · ${esc(row.copy)}</small></span><b>${row.input.checked?'ON':'ADD'}</b></button>`).join('');
}
$('#producerEffectsSearchV4210')?.addEventListener('input',renderEffects);
$('#producerEffectsGridV4210')?.addEventListener('click',e=>{const b=e.target.closest('[data-library-effect]');if(!b)return;const input=$(`[data-effect="${CSS.escape(b.dataset.libraryEffect)}"]`);if(!input)return;input.checked=!input.checked;input.dispatchEvent(new Event('change',{bubbles:true}));renderEffects()});
$('#producerEffectsClearV4210')?.addEventListener('click',()=>{$$('[data-effect]:checked').forEach(i=>{i.checked=false;i.dispatchEvent(new Event('change',{bubbles:true}))});renderEffects();toast('All effects cleared.')});
document.addEventListener('change',e=>{if(e.target.matches('[data-effect]'))renderEffects()});
setTimeout(renderEffects,150);

function duration(){return Math.max(Number.isFinite(video?.duration)&&video.duration>0?video.duration:virtualTimelineDuration,virtualTimelineDuration)}
function timelineLane(){
 return $('#timelineTracksV4190 .timelineLaneV4190')||$('#timelineRulerV4190')||$('#timelineTracksV4190');
}
function positionPlayhead(percent){
 if(!playhead)return;
 const lane=timelineLane(),parent=playhead.offsetParent||playhead.parentElement;
 if(!lane||!parent)return;
 const laneRect=lane.getBoundingClientRect(),parentRect=parent.getBoundingClientRect();
 playhead.style.left=`${laneRect.left-parentRect.left+Math.max(0,Math.min(1,percent))*laneRect.width}px`;
 playhead.setAttribute('aria-valuenow',String(Math.round(percent*100)));
}
function seekFromPointer(e,target){
 const lane=timelineLane()||target,r=lane.getBoundingClientRect();
 const x=Math.max(0,Math.min(r.width,e.clientX-r.left)),percent=x/Math.max(1,r.width),d=duration();
 virtualTimelineTime=d*percent;
 positionPlayhead(percent);
 if(video?.src||video?.currentSrc){
  video.currentTime=Math.min(virtualTimelineTime,Number.isFinite(video.duration)?video.duration:virtualTimelineTime);
  const audio=$('#composerPreviewAudioV4180');if(audio?.src)audio.currentTime=Math.min(video.currentTime,audio.duration||video.currentTime);
 }else{
  const status=$('#timelineStatusV4190');
  if(status)status.textContent=`Preview position ${virtualTimelineTime.toFixed(1)}s of ${virtualTimelineDuration}s · load a video to seek media`;
 }
}
const tracks=$('#timelineTracksV4190'),ruler=$('#timelineRulerV4190'),playhead=$('#timelinePlayheadV4190');
requestAnimationFrame(()=>positionPlayhead(0));
video?.addEventListener('loadedmetadata',()=>{virtualTimelineTime=0;positionPlayhead(0)});
[tracks,ruler].forEach(target=>target?.addEventListener('click',e=>{if(e.target.closest('button,input,header'))return;seekFromPointer(e,target)}));
if(playhead){
 playhead.tabIndex=0;playhead.setAttribute('role','slider');playhead.setAttribute('aria-label','Timeline playhead');
 playhead.addEventListener('pointerdown',e=>{dragging=true;playhead.setPointerCapture?.(e.pointerId);e.preventDefault()});
 playhead.addEventListener('pointermove',e=>{if(dragging)seekFromPointer(e,timelineLane()||tracks||playhead.parentElement)});
 playhead.addEventListener('pointerup',e=>{dragging=false;playhead.releasePointerCapture?.(e.pointerId)});
 playhead.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const d=duration(),step=e.shiftKey?5:.5,current=(video?.src||video?.currentSrc)?(video.currentTime||0):virtualTimelineTime;let next=e.key==='Home'?0:e.key==='End'?d:Math.max(0,Math.min(d,current+(e.key==='ArrowRight'?step:-step)));virtualTimelineTime=next;positionPlayhead(next/d);if(video?.src||video?.currentSrc)video.currentTime=Math.min(next,video.duration||next);else{const status=$('#timelineStatusV4190');if(status)status.textContent=`Preview position ${next.toFixed(1)}s of ${virtualTimelineDuration}s · load a video to seek media`}});
}
$$('[data-track]',hub).forEach(track=>{
 track.tabIndex=0;track.setAttribute('role','button');
 const open=()=>{const name=track.dataset.track;if(name==='video')$('[data-producer-view="videos"]')?.click();if(name==='music')$('[data-producer-view="music"]')?.click();if(name==='effects')$('[data-producer-view="assets"]')?.click();if(name==='markers')$('[data-producer-view="waveforms"]')?.click();track.classList.add('isSelectedV4210');setTimeout(()=>track.classList.remove('isSelectedV4210'),350)};
 track.querySelector('header')?.addEventListener('click',e=>{e.stopPropagation();open()});
 track.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}});
});

function youtubeSearch(){
 const q=$('#producerYoutubeSearchV4210')?.value?.trim();
 if(!q)return toast('Enter a YouTube search phrase.','Search needed');
 const frame=$('#producerYoutubeSearchFrameV4211'),empty=$('#producerYoutubeSearchEmptyV4211'),status=$('#producerYoutubeSearchStatusV4211');
 if(frame){
  frame.src=`https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(q)}&rel=0`;
  frame.hidden=false;if(empty)empty.hidden=true;
  if(status)status.textContent=`Showing an embedded YouTube search playlist for “${q}”. Select a result inside the player.`;
  $('#openYoutubeSearchTabV4211').disabled=false;
  $('#copyYoutubeSearchQueryV4211').disabled=false;
 }
}
$('#searchProducerYoutubeV4210')?.addEventListener('click',youtubeSearch);
$('#producerYoutubeSearchV4210')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();youtubeSearch()}});
$('#openYoutubeSearchTabV4211')?.addEventListener('click',()=>{const q=$('#producerYoutubeSearchV4210')?.value?.trim();if(q)window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,'_blank','noopener,noreferrer')});
$('#copyYoutubeSearchQueryV4211')?.addEventListener('click',async()=>{const q=$('#producerYoutubeSearchV4210')?.value?.trim();if(!q)return;try{await navigator.clipboard.writeText(q);toast('YouTube search text copied.')}catch{toast('Clipboard access was blocked.','Copy unavailable')}});
$('#clearYoutubeSearchV4211')?.addEventListener('click',()=>{const input=$('#producerYoutubeSearchV4210'),frame=$('#producerYoutubeSearchFrameV4211'),empty=$('#producerYoutubeSearchEmptyV4211');if(input)input.value='';if(frame){frame.removeAttribute('src');frame.hidden=true}if(empty)empty.hidden=false;$('#openYoutubeSearchTabV4211').disabled=true;$('#copyYoutubeSearchQueryV4211').disabled=true;const status=$('#producerYoutubeSearchStatusV4211');if(status)status.textContent='Search YouTube without leaving Producer Hub.'});

async function decodeFile(file){
 if(!file)return;const status=$('#producerWaveformStatusV4210');status.textContent='Analyzing audio data…';
 try{const C=window.AudioContext||window.webkitAudioContext;if(!C)throw new Error('Web Audio is unavailable.');const ctx=new C();decodedBuffer=await ctx.decodeAudioData(await file.arrayBuffer());decodedName=file.name;await ctx.close();['#producerWaveformSvgV4210','#producerWaveformCsvV4210','#producerWaveformJsonV4210','#producerWaveformWavV4210'].forEach(s=>$(s).disabled=false);status.textContent=`Waveform ready from ${file.name}.`;drawWaveform()}catch(error){decodedBuffer=null;status.textContent=`This browser could not decode that file's audio: ${error.message}`}
}
videoInput?.addEventListener('change',()=>decodeFile(videoInput.files?.[0]));
audioInput?.addEventListener('change',()=>decodeFile(audioInput.files?.[0]));
function mono(){if(!decodedBuffer)return null;const out=new Float32Array(decodedBuffer.length);for(let c=0;c<decodedBuffer.numberOfChannels;c++){const data=decodedBuffer.getChannelData(c);for(let i=0;i<data.length;i++)out[i]+=data[i]/decodedBuffer.numberOfChannels}return out}
function peaks(count=700){const data=mono();if(!data)return[];const step=Math.max(1,Math.floor(data.length/count)),out=[];for(let i=0;i<count;i++){let min=1,max=-1,rms=0,n=0;for(let j=i*step;j<Math.min(data.length,(i+1)*step);j++){const v=data[j];min=Math.min(min,v);max=Math.max(max,v);rms+=v*v;n++}out.push({time:i/count*decodedBuffer.duration,min,max,rms:n?Math.sqrt(rms/n):0})}return out}
function drawWaveform(){if(!waveformCanvas||!decodedBuffer)return;const ctx=waveformCanvas.getContext('2d'),rows=peaks(waveformCanvas.width),mid=waveformCanvas.height/2;ctx.clearRect(0,0,waveformCanvas.width,waveformCanvas.height);ctx.fillStyle='#09060d';ctx.fillRect(0,0,waveformCanvas.width,waveformCanvas.height);ctx.strokeStyle='#c994ff';ctx.beginPath();rows.forEach((r,i)=>{const x=i/Math.max(1,rows.length-1)*waveformCanvas.width;ctx.moveTo(x,mid+r.min*mid*.9);ctx.lineTo(x,mid+r.max*mid*.9)});ctx.stroke()}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}
function name(){return (decodedName||'producer-waveform').replace(/\.[^.]+$/,'').replace(/[^a-z0-9_-]+/gi,'-')}
function wav(){const samples=mono(),rate=decodedBuffer.sampleRate,buf=new ArrayBuffer(44+samples.length*2),v=new DataView(buf),write=(o,t)=>[...t].forEach((c,i)=>v.setUint8(o+i,c.charCodeAt(0)));write(0,'RIFF');v.setUint32(4,36+samples.length*2,true);write(8,'WAVE');write(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);write(36,'data');v.setUint32(40,samples.length*2,true);let o=44;for(const s of samples){const x=Math.max(-1,Math.min(1,s));v.setInt16(o,x<0?x*32768:x*32767,true);o+=2}return new Blob([buf],{type:'audio/wav'})}
$('#producerWaveformWavV4210')?.addEventListener('click',()=>decodedBuffer&&download(wav(),`${name()}-audio.wav`));
$('#producerWaveformCsvV4210')?.addEventListener('click',()=>{const rows=peaks(),csv='time_seconds,min,max,rms\n'+rows.map(r=>`${r.time.toFixed(5)},${r.min.toFixed(6)},${r.max.toFixed(6)},${r.rms.toFixed(6)}`).join('\n');download(new Blob([csv],{type:'text/csv'}),`${name()}-waveform.csv`)});
$('#producerWaveformJsonV4210')?.addEventListener('click',()=>download(new Blob([JSON.stringify({source:decodedName,duration:decodedBuffer.duration,sampleRate:decodedBuffer.sampleRate,channels:decodedBuffer.numberOfChannels,peaks:peaks()},null,2)],{type:'application/json'}),`${name()}-analysis.json`));
$('#producerWaveformSvgV4210')?.addEventListener('click',()=>{const rows=peaks(1000),w=1400,h=360,mid=h/2,lines=rows.map((r,i)=>{const x=(i/(rows.length-1)*w).toFixed(2);return `<line x1="${x}" y1="${(mid+r.min*mid*.9).toFixed(2)}" x2="${x}" y2="${(mid+r.max*mid*.9).toFixed(2)}"/>`}).join('');download(new Blob([`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#09060d"/><g stroke="#c994ff">${lines}</g></svg>`],{type:'image/svg+xml'}),`${name()}-waveform.svg`)});
})();
