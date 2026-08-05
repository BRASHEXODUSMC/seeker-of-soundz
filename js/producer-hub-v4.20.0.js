/* Seeker Of SoundZ v4.20.0 — Producer Hub 3.1 workspace upgrades */
(()=>{
'use strict';
const hub=document.getElementById('producerHubV4190');
const studio=document.getElementById('videoEffectsStudio');
if(!hub||!studio)return;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const video=$('#composerPreviewVideoV4180');
const videoInput=$('#composerVideoV4180');
const audioInput=$('#composerAudioV4180');
const waveformCanvas=$('#timelineWaveformV4190');
let decodedBuffer=null;
let decodedSourceName='';
let theatre=false;

function toast(message,title='Producer Hub 3.1'){window.SOS?.toast?.(message,{title,icon:'✓'})}
function activateSide(name){
 $$('[data-producer-view]',hub).forEach(b=>b.classList.toggle('isActive',b.dataset.producerView===name));
 $$('[data-producer-sidebar-view]',hub).forEach(v=>v.classList.toggle('isActive',v.dataset.producerSidebarView===name));
}
function activateInspector(name){
 $$('[data-inspector-tab]',hub).forEach(b=>b.classList.toggle('isActive',b.dataset.inspectorTab===name));
 $$('.inspectorPanelV4190',hub).forEach(p=>p.classList.toggle('isActive',p.dataset.inspectorPanel===name));
}
function setWorkflow(name){
 $$('[data-producer-workflow]',hub).forEach(b=>b.classList.toggle('isActive',b.dataset.producerWorkflow===name));
 if(name==='workspace'){hub.scrollIntoView({block:'start'});activateSide('project')}
 if(name==='assets'){activateSide('assets');$('.producerSidebarV4190')?.scrollTo({top:0,behavior:'smooth'})}
 if(name==='youtube'){window.SOSProducerHub3?.openYoutube?.()}
 if(name==='audio'){activateSide('waveforms');$('#analyzeBeatsV4190')?.scrollIntoView({block:'nearest'})}
 if(name==='timeline')toggleTheatre(true)
 if(name==='export'){activateInspector('export');$('.producerInspectorV4190')?.scrollIntoView({block:'nearest'})}
}
$$('[data-producer-workflow]',hub).forEach(button=>button.addEventListener('click',()=>setWorkflow(button.dataset.producerWorkflow)));

function toggleTheatre(force){
 theatre=typeof force==='boolean'?force:!theatre;
 document.body.classList.toggle('producerTheatreActiveV4200',theatre);
 hub.classList.toggle('isTheatreV4200',theatre);
 const button=$('#producerTheatreViewV4200');
 if(button){button.setAttribute('aria-pressed',String(theatre));button.textContent=theatre?'Exit Theatre View':'Theatre View'}
 if(theatre){document.body.classList.add('producerCursorDisabledV4200');hub.scrollTop=0}
 else document.body.classList.remove('producerCursorDisabledV4200');
}
$('#producerTheatreViewV4200')?.addEventListener('click',()=>toggleTheatre());
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&theatre)toggleTheatre(false)});

hub.addEventListener('pointerenter',()=>document.body.classList.add('producerCursorDisabledV4200'));
hub.addEventListener('pointerleave',()=>{if(!theatre)document.body.classList.remove('producerCursorDisabledV4200')});

function labelFor(input){
 const label=input.closest('label');
 return {
  name:label?.querySelector('strong')?.textContent?.trim()||input.dataset.effect,
  copy:label?.querySelector('small')?.textContent?.trim()||'Procedural video effect',
  category:label?.closest('details')?.querySelector('summary')?.childNodes?.[0]?.textContent?.trim()||'Effects'
 };
}
function renderAllEffects(query=''){
 const host=$('#allEffectsGridV4200');
 if(!host)return;
 const q=query.trim().toLowerCase();
 const inputs=$$('[data-effect]');
 const rows=inputs.map(input=>({input,...labelFor(input)})).filter(row=>!q||`${row.name} ${row.copy} ${row.category}`.toLowerCase().includes(q));
 $('#allEffectsCountV4200').textContent=`${inputs.length} effects`;
 host.innerHTML=rows.map(row=>`<button type="button" class="${row.input.checked?'isActive':''}" data-complete-effect="${row.input.dataset.effect}"><span><strong>${escapeHtml(row.name)}</strong><small>${escapeHtml(row.category)} · ${escapeHtml(row.copy)}</small></span><b>${row.input.checked?'ON':'ADD'}</b></button>`).join('');
}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
$('#allEffectsSearchV4200')?.addEventListener('input',event=>renderAllEffects(event.target.value));
$('#allEffectsGridV4200')?.addEventListener('click',event=>{
 const button=event.target.closest('[data-complete-effect]');if(!button)return;
 const input=$(`[data-effect="${CSS.escape(button.dataset.completeEffect)}"]`);
 if(!input)return;
 input.checked=!input.checked;input.dispatchEvent(new Event('change',{bubbles:true}));
 renderAllEffects($('#allEffectsSearchV4200')?.value||'');
});
$('#clearAllEffectsV4200')?.addEventListener('click',()=>{
 $$('[data-effect]:checked').forEach(input=>{input.checked=false;input.dispatchEvent(new Event('change',{bubbles:true}))});
 renderAllEffects($('#allEffectsSearchV4200')?.value||'');
 toast('All visual effects were cleared.');
});
document.addEventListener('change',event=>{if(event.target.matches('[data-effect]'))renderAllEffects($('#allEffectsSearchV4200')?.value||'')});
setTimeout(()=>renderAllEffects(),180);

function setupTimelineTracks(){
 $$('[data-track]',hub).forEach(track=>{
  track.tabIndex=0;
  track.setAttribute('role','button');
  const activate=()=>{
   const name=track.dataset.track;
   if(name==='video'){activateSide('videos');activateInspector('video')}
   if(name==='music'){activateSide('music');activateInspector('audio')}
   if(name==='effects'){activateSide('assets');activateInspector('effects')}
   if(name==='markers'){activateSide('waveforms')}
   track.classList.add('isSelectedV4200');
   setTimeout(()=>track.classList.remove('isSelectedV4200'),400);
  };
  track.addEventListener('dblclick',activate);
  track.querySelector('header')?.addEventListener('click',event=>{event.stopPropagation();activate()});
  track.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();activate()}});
 });
}
setupTimelineTracks();

function youtubeSearch(){
 const query=$('#producerYoutubeSearchV4200')?.value?.trim();
 if(!query)return toast('Enter a YouTube search phrase.','Search needed');
 window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,'_blank','noopener,noreferrer');
 toast('YouTube search opened. Copy the selected video URL and paste it into the preview field.');
}
$('#searchProducerYoutubeV4200')?.addEventListener('click',youtubeSearch);
$('#producerYoutubeSearchV4200')?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();youtubeSearch()}});

async function decodeSource(file){
 if(!file)return;
 const status=$('#waveformExportStatusV4200');
 status.textContent='Reading audio data from the selected file…';
 try{
  const C=window.AudioContext||window.webkitAudioContext;
  if(!C)throw new Error('Web Audio is not available in this browser.');
  const context=new C();
  decodedBuffer=await context.decodeAudioData(await file.arrayBuffer());
  decodedSourceName=file.name;
  await context.close();
  ['#exportWaveformSvgV4200','#exportWaveformCsvV4200','#exportWaveformWavV4200','#exportWaveformJsonV4200'].forEach(sel=>{$(sel).disabled=false});
  status.textContent=`Waveform ready from ${file.name}.`;
  drawDecodedWaveform();
 }catch(error){
  decodedBuffer=null;
  status.textContent=`Audio extraction was unavailable for this codec: ${error.message}`;
  ['#exportWaveformSvgV4200','#exportWaveformCsvV4200','#exportWaveformWavV4200','#exportWaveformJsonV4200'].forEach(sel=>{$(sel).disabled=true});
 }
}
videoInput?.addEventListener('change',()=>decodeSource(videoInput.files?.[0]));
audioInput?.addEventListener('change',()=>decodeSource(audioInput.files?.[0]));

function monoSamples(){
 if(!decodedBuffer)return null;
 const length=decodedBuffer.length,out=new Float32Array(length);
 for(let channel=0;channel<decodedBuffer.numberOfChannels;channel++){
  const data=decodedBuffer.getChannelData(channel);
  for(let i=0;i<length;i++)out[i]+=data[i]/decodedBuffer.numberOfChannels;
 }
 return out;
}
function peaks(count=600){
 const data=monoSamples();if(!data)return [];
 const step=Math.max(1,Math.floor(data.length/count)),out=[];
 for(let i=0;i<count;i++){
  let min=1,max=-1,rms=0,n=0;
  for(let j=i*step;j<Math.min(data.length,(i+1)*step);j++){const v=data[j];min=Math.min(min,v);max=Math.max(max,v);rms+=v*v;n++}
  out.push({min,max,rms:n?Math.sqrt(rms/n):0,time:i/count*decodedBuffer.duration});
 }
 return out;
}
function drawDecodedWaveform(){
 if(!waveformCanvas||!decodedBuffer)return;
 const ctx=waveformCanvas.getContext('2d'),rows=peaks(waveformCanvas.width);
 ctx.clearRect(0,0,waveformCanvas.width,waveformCanvas.height);
 ctx.fillStyle='#09060d';ctx.fillRect(0,0,waveformCanvas.width,waveformCanvas.height);
 ctx.strokeStyle='rgba(204,151,255,.9)';ctx.lineWidth=1;ctx.beginPath();
 const mid=waveformCanvas.height/2;
 rows.forEach((row,i)=>{const x=i/Math.max(1,rows.length-1)*waveformCanvas.width;ctx.moveTo(x,mid+row.min*mid*.9);ctx.lineTo(x,mid+row.max*mid*.9)});
 ctx.stroke();
}
function download(blob,name){
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1800);
}
function safeName(){return (decodedSourceName||'producer-waveform').replace(/\.[^.]+$/,'').replace(/[^a-z0-9_-]+/gi,'-')}
function wavBlob(){
 const samples=monoSamples(),rate=decodedBuffer.sampleRate,buffer=new ArrayBuffer(44+samples.length*2),view=new DataView(buffer);
 const write=(offset,text)=>[...text].forEach((c,i)=>view.setUint8(offset+i,c.charCodeAt(0)));
 write(0,'RIFF');view.setUint32(4,36+samples.length*2,true);write(8,'WAVE');write(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);write(36,'data');view.setUint32(40,samples.length*2,true);
 let offset=44;for(const sample of samples){const value=Math.max(-1,Math.min(1,sample));view.setInt16(offset,value<0?value*32768:value*32767,true);offset+=2}
 return new Blob([buffer],{type:'audio/wav'});
}
$('#exportWaveformWavV4200')?.addEventListener('click',()=>{if(decodedBuffer)download(wavBlob(),`${safeName()}-audio.wav`)});
$('#exportWaveformCsvV4200')?.addEventListener('click',()=>{
 const rows=peaks(800),csv='time_seconds,min,max,rms\n'+rows.map(r=>`${r.time.toFixed(5)},${r.min.toFixed(6)},${r.max.toFixed(6)},${r.rms.toFixed(6)}`).join('\n');
 download(new Blob([csv],{type:'text/csv'}),`${safeName()}-waveform.csv`);
});
$('#exportWaveformJsonV4200')?.addEventListener('click',()=>{
 const payload={source:decodedSourceName,duration:decodedBuffer.duration,sampleRate:decodedBuffer.sampleRate,channels:decodedBuffer.numberOfChannels,peaks:peaks(800)};
 download(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),`${safeName()}-analysis.json`);
});
$('#exportWaveformSvgV4200')?.addEventListener('click',()=>{
 const rows=peaks(1000),w=1400,h=360,mid=h/2;
 const lines=rows.map((r,i)=>{const x=(i/(rows.length-1)*w).toFixed(2),y1=(mid+r.min*mid*.9).toFixed(2),y2=(mid+r.max*mid*.9).toFixed(2);return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/>`}).join('');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#09060d"/><g stroke="#c994ff" stroke-width="1">${lines}</g></svg>`;
 download(new Blob([svg],{type:'image/svg+xml'}),`${safeName()}-waveform.svg`);
});

window.addEventListener('pagehide',()=>document.body.classList.remove('producerCursorDisabledV4200','producerTheatreActiveV4200'));
})();
