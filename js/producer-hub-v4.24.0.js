/* Seeker Of SoundZ v4.21.0 — Producer Hub 4.0 additive runtime */
(()=>{
'use strict';
const hub=document.getElementById('producerHubV4190');
if(!hub)return;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const video=$('#composerPreviewVideoV4180');
document.body.classList.remove('producerNativeCursorV4210');
const videoInput=$('#composerVideoV4180');
const audioInput=$('#composerAudioV4180');
const waveformCanvas=$('#timelineWaveformV4190');
let theatre=false,dragging=false,decodedBuffer=null,decodedName='',virtualTimelineTime=0;const virtualTimelineDuration=60;

function toast(message,title='Producer Hub 4.0'){window.SOS?.toast?.(message,{title,icon:'✓'})}
function disableCursor(){/* The member profile cursor setting remains in control. */}

function toggleTheatre(force){
 theatre=typeof force==='boolean'?force:!theatre;
 document.body.classList.toggle('producerTheatreBodyV4210',theatre);
 hub.classList.toggle('producerTheatreV4210',theatre);

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

function duration(){return window.SOSVideoClipsV4240?.totalDuration?.()||Math.max(Number.isFinite(video?.duration)&&video.duration>0?video.duration:virtualTimelineDuration,virtualTimelineDuration)}
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
  if(window.SOSVideoClipsV4240?.seekGlobal)window.SOSVideoClipsV4240.seekGlobal(virtualTimelineTime);
  else video.currentTime=Math.min(virtualTimelineTime,Number.isFinite(video.duration)?video.duration:virtualTimelineTime);
  const audio=$('#composerPreviewAudioV4180');if(audio?.src)audio.currentTime=Math.min(virtualTimelineTime,audio.duration||virtualTimelineTime);
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

function youtubeVideoUrl(id){return `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`}
function renderYoutubeResults(rows){
 const host=$('#producerYoutubeResultsV4212'),state=$('#producerYoutubeSearchStateV4212');
 if(!host)return;
 if(!rows.length){
  host.innerHTML='';
  if(state){state.hidden=false;state.querySelector('strong').textContent='No videos found';state.querySelector('span').textContent='Try a broader search phrase.'}
  return;
 }
 if(state)state.hidden=true;
 host.innerHTML=rows.map(row=>`<article class="producerYoutubeResultCardV4212">
  <button type="button" class="producerYoutubeThumbV4212" data-load-youtube-result="${esc(row.videoId)}"><img src="${esc(row.thumbnail||'')}" alt="" loading="lazy"><i>▶</i></button>
  <div><strong>${esc(row.title||'YouTube video')}</strong><small>${esc(row.channelTitle||'YouTube')}</small><p>${esc(row.description||'')}</p></div>
  <div class="producerYoutubeResultActionsV4212"><button class="smallAction" type="button" data-load-youtube-result="${esc(row.videoId)}">Load Preview</button><button class="smallAction" type="button" data-copy-youtube-result="${esc(row.videoId)}">Copy URL</button></div>
 </article>`).join('');
}
async function youtubeSearch(){
 const q=$('#producerYoutubeSearchV4210')?.value?.trim();
 if(!q)return toast('Enter a YouTube search phrase.','Search needed');
 const status=$('#producerYoutubeSearchStatusV4212'),state=$('#producerYoutubeSearchStateV4212'),host=$('#producerYoutubeResultsV4212');
 if(status)status.textContent='Searching YouTube…';
 if(state){state.hidden=false;state.querySelector('strong').textContent='Searching YouTube';state.querySelector('span').textContent='Loading results inside Producer Hub…'}
 if(host)host.innerHTML='';
 try{
  const client=window.SOS_SUPABASE?.client;
  if(!client)throw new Error('Supabase is not connected.');
  const {data,error}=await client.functions.invoke('youtube-search',{body:{query:q,maxResults:12}});
  if(error)throw error;
  const rows=Array.isArray(data?.items)?data.items:[];
  renderYoutubeResults(rows);
  if(status)status.textContent=rows.length?`${rows.length} results loaded. Select Load Preview to play one below.`:'No videos were returned.';
 }catch(error){
  if(state){state.hidden=false;state.querySelector('strong').textContent='YouTube search needs one setup step';state.querySelector('span').textContent='Deploy the included youtube-search Edge Function and add YOUTUBE_DATA_API_KEY in Supabase Secrets.'}
  if(status)status.textContent=error.message||'YouTube search is unavailable.';
 }
}
$('#searchProducerYoutubeV4210')?.addEventListener('click',youtubeSearch);
$('#producerYoutubeSearchV4210')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();youtubeSearch()}});
$('#openYoutubeSearchTabV4212')?.addEventListener('click',()=>{const q=$('#producerYoutubeSearchV4210')?.value?.trim();window.open(q?`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`:'https://www.youtube.com/','_blank','noopener,noreferrer')});
$('#clearYoutubeSearchV4212')?.addEventListener('click',()=>{
 const input=$('#producerYoutubeSearchV4210'),host=$('#producerYoutubeResultsV4212'),state=$('#producerYoutubeSearchStateV4212');
 if(input)input.value='';if(host)host.innerHTML='';if(state){state.hidden=false;state.querySelector('strong').textContent='Search YouTube inside Producer Hub';state.querySelector('span').textContent='Results will appear here as selectable video cards. Selecting one loads it into the embedded preview below.'}
 const status=$('#producerYoutubeSearchStatusV4212');if(status)status.textContent='Ready to search.';
});
$('#producerYoutubeResultsV4212')?.addEventListener('click',async e=>{
 const load=e.target.closest('[data-load-youtube-result]');
 if(load){
  const url=youtubeVideoUrl(load.dataset.loadYoutubeResult),input=$('#producerYoutubeUrlV4199');
  if(input)input.value=url;$('#loadProducerYoutubeV4199')?.click();$('#producerYoutubeFrameV4199')?.scrollIntoView({behavior:'smooth',block:'center'});return;
 }
 const copy=e.target.closest('[data-copy-youtube-result]');
 if(copy){const url=youtubeVideoUrl(copy.dataset.copyYoutubeResult);try{await navigator.clipboard.writeText(url);toast('YouTube URL copied.')}catch{toast('Clipboard access was blocked.','Copy unavailable')}}
});

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

document.getElementById('renderProducerProjectV4190')?.addEventListener('click',event=>{
 event.preventDefault();event.stopImmediatePropagation();
 const button=document.getElementById('composerRenderButtonV4180');
 if(!button||button.disabled){
  window.SOS?.toast?.('Import a local video before generating the finished project.',{title:'Video required',icon:'!'});
  document.querySelector('[data-producer-view="videos"]')?.click();return;
 }
 document.getElementById('directRenderStatusV4212')?.scrollIntoView({behavior:'smooth',block:'center'});
 button.click();
},true);


/* Producer Hub v4.22.0 — cuts, undo/redo, waveform sync and advanced timeline */
(()=>{
'use strict';
const hub=document.getElementById('producerHubV4190');
if(!hub)return;
const $=(s,r=document)=>r.querySelector(s);
const video=$('#composerPreviewVideoV4180'),audio=$('#composerPreviewAudioV4180');
const cutStartButton=$('#markCutStartV4220'),cutEndButton=$('#markCutEndV4220'),applyButton=$('#applyTimelineCutV4220');
const undoButton=$('#undoTimelineEditV4220'),redoButton=$('#redoTimelineEditV4220'),clearButton=$('#clearTimelineCutsV4220');
const status=$('#timelineEditStatusV4220'),videoLane=$('#timelineVideoClipV4190')?.parentElement;
let cutStart=null,cutEnd=null,cuts=[],undoStack=[],redoStack=[],seekingCut=false;

const cloneCuts=()=>cuts.map(item=>({...item}));
const currentTime=()=>window.SOSVideoClipsV4240?.globalTime?.()??Number(video?.currentTime||0);
const duration=()=>window.SOSVideoClipsV4240?.totalDuration?.()??(Number(video?.duration||60)||60);
function normalize(items){
 return items.slice().sort((a,b)=>a.start-b.start).reduce((out,item)=>{
  const start=Math.max(0,Math.min(duration(),Number(item.start)||0)),end=Math.max(start,Math.min(duration(),Number(item.end)||0));
  if(end-start<.05)return out;
  const previous=out[out.length-1];
  if(previous&&start<=previous.end+.02)previous.end=Math.max(previous.end,end);
  else out.push({start,end});
  return out;
 },[]);
}
function saveHistory(){
 undoStack.push(cloneCuts());if(undoStack.length>50)undoStack.shift();redoStack=[];
}
function updateButtons(){
 applyButton.disabled=!(Number.isFinite(cutStart)&&Number.isFinite(cutEnd)&&cutEnd>cutStart);
 undoButton.disabled=!undoStack.length;redoButton.disabled=!redoStack.length;
}
function format(seconds){
 const m=Math.floor(seconds/60),s=seconds%60;
 return `${String(m).padStart(2,'0')}:${s.toFixed(2).padStart(5,'0')}`;
}
function renderCuts(){
 if(!videoLane)return;
 videoLane.querySelectorAll('.timelineCutRegionV4220').forEach(el=>el.remove());
 const d=duration();
 cuts.forEach((cut,index)=>{
  const region=document.createElement('button');
  region.type='button';region.className='timelineCutRegionV4220';
  region.style.left=`${cut.start/d*100}%`;region.style.width=`${(cut.end-cut.start)/d*100}%`;
  region.title=`Removed ${format(cut.start)} – ${format(cut.end)}. Click to restore.`;
  region.innerHTML=`<span>Cut ${index+1}</span><small>${format(cut.start)}–${format(cut.end)}</small>`;
  region.addEventListener('click',event=>{
   event.stopPropagation();saveHistory();cuts.splice(index,1);cuts=normalize(cuts);renderCuts();updateButtons();
   status.textContent='Cut restored. Use Undo to reverse this change.';
  });
  videoLane.appendChild(region);
 });
 window.SOSProducerCuts4220={getCuts:()=>cloneCuts(),setCuts:value=>{cuts=normalize(Array.isArray(value)?value:[]);renderCuts()}};
}
function markStart(){
 cutStart=currentTime();if(cutEnd!==null&&cutEnd<=cutStart)cutEnd=null;
 status.textContent=`Cut start marked at ${format(cutStart)}. Move the playhead and mark the end.`;updateButtons();
}
function markEnd(){
 cutEnd=currentTime();
 if(cutStart===null){status.textContent='Mark the cut start first.';return}
 if(cutEnd<=cutStart){status.textContent='Cut end must be after the start.';return}
 status.textContent=`Ready to remove ${format(cutStart)} – ${format(cutEnd)}.`;updateButtons();
}
function applyCut(){
 if(applyButton.disabled)return;
 saveHistory();cuts=normalize([...cuts,{start:cutStart,end:cutEnd}]);cutStart=null;cutEnd=null;renderCuts();updateButtons();
 status.textContent='Section removed non-destructively. Preview and export will skip it.';
}
function undo(){
 if(!undoStack.length)return;redoStack.push(cloneCuts());cuts=undoStack.pop();renderCuts();updateButtons();status.textContent='Timeline edit undone.';
}
function redo(){
 if(!redoStack.length)return;undoStack.push(cloneCuts());cuts=redoStack.pop();renderCuts();updateButtons();status.textContent='Timeline edit redone.';
}
function clearCuts(){
 if(!cuts.length)return;saveHistory();cuts=[];renderCuts();updateButtons();status.textContent='All timeline cuts cleared.';
}
function skipRemovedRanges(){
 if(seekingCut||!video||!cuts.length)return;
 const time=currentTime();
 const hit=cuts.find(cut=>time>=cut.start&&time<cut.end-.02);
 if(!hit)return;
 seekingCut=true;
 if(window.SOSVideoClipsV4240?.seekGlobal)window.SOSVideoClipsV4240.seekGlobal(Math.min(hit.end,duration()));
 else video.currentTime=Math.min(hit.end,duration());
 if(audio?.src)audio.currentTime=Math.min(hit.end,audio.duration||hit.end);
 setTimeout(()=>seekingCut=false,40);
}
cutStartButton?.addEventListener('click',markStart);
cutEndButton?.addEventListener('click',markEnd);
applyButton?.addEventListener('click',applyCut);
undoButton?.addEventListener('click',undo);
redoButton?.addEventListener('click',redo);
clearButton?.addEventListener('click',clearCuts);
video?.addEventListener('timeupdate',skipRemovedRanges);
video?.addEventListener('seeking',skipRemovedRanges);
video?.addEventListener('loadedmetadata',()=>{cuts=normalize(cuts);renderCuts()});
document.addEventListener('keydown',event=>{
 if(!(event.ctrlKey||event.metaKey))return;
 if(event.key.toLowerCase()==='z'){event.preventDefault();event.shiftKey?redo():undo()}
 if(event.key.toLowerCase()==='y'){event.preventDefault();redo()}
});
renderCuts();updateButtons();

/* Keep the visible timeline waveform synchronized to uploaded audio playback. */
const waveformCanvas=$('#timelineWaveformV4190');
function animateWaveformCursor(){
 if(!waveformCanvas)return requestAnimationFrame(animateWaveformCursor);
 const durationValue=Number(video?.duration||audio?.duration||0);
 waveformCanvas.style.setProperty('--waveform-progress',durationValue?`${Math.max(0,Math.min(100,currentTime()/durationValue*100))}%`:'0%');
 requestAnimationFrame(animateWaveformCursor);
}
animateWaveformCursor();
})();
