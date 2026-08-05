/* Seeker Of SoundZ v4.19.0 — Producer Hub 2.0 */
(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const hub=$('#producerHubV4190'),studio=$('#videoEffectsStudio');
if(!hub||!studio)return;

const STORAGE_PROJECTS='sos_producer_projects_v4190';
const STORAGE_FAVORITES='sos_producer_preset_favorites_v4190';
const composer=$('#directComposerV4180');
const composerMount=$('#producerComposerMountV4190');
const createPanel=$('[data-studio-panel="create"]');
if(createPanel&&!createPanel.contains(hub))createPanel.prepend(hub);
if(composer&&composerMount&&!composerMount.contains(composer))composerMount.appendChild(composer);

const videoInput=$('#composerVideoV4180'),audioInput=$('#composerAudioV4180');
const video=$('#composerPreviewVideoV4180'),audio=$('#composerPreviewAudioV4180');
const projectName=$('#producerProjectNameV4190');
const timelineWave=$('#timelineWaveformV4190');
const markerLane=$('#timelineMarkerLaneV4190');
const effectsLane=$('#timelineEffectsLaneV4190');
const playhead=$('#timelinePlayheadV4190');
const effectLayerList=$('#effectLayerListV4190');
let beatMarkers=[],audioBuffer=null,audioContext=null,timelineRaf=0,zoom=1;
let layerState=[];

const assets=[
 {id:'tv-static',name:'TV Static',category:'retro',effect:'tvStatic',icon:'📺'},
 {id:'heavy-static',name:'Heavy Static',category:'retro',effect:'heavyStatic',icon:'⚡'},
 {id:'vhs',name:'VHS Tracking',category:'retro',effect:'vhs',icon:'📼'},
 {id:'scanlines',name:'CRT Scanlines',category:'retro',effect:'scanlines',icon:'▤'},
 {id:'particles',name:'Frequency Particles',category:'atmosphere',effect:'particles',icon:'✦'},
 {id:'snow',name:'Snow Noise',category:'atmosphere',effect:'snowNoise',icon:'❄'},
 {id:'dust',name:'Dust & Scratches',category:'atmosphere',effect:'dust',icon:'⋆'},
 {id:'light-leaks',name:'Light Leaks',category:'overlay',effect:'lightLeaks',icon:'☀'},
 {id:'laser-grid',name:'Laser Grid',category:'overlay',effect:'laserGrid',icon:'⌗'},
 {id:'waveform',name:'Waveform Overlay',category:'overlay',effect:'waveform',icon:'〰'},
 {id:'spectrum',name:'Spectrum Bars',category:'overlay',effect:'audioBars',icon:'▥'},
 {id:'cinema',name:'Cinema Bars',category:'overlay',effect:'letterbox',icon:'▬'},
 {id:'ultrawide',name:'Ultra-Wide Bars',category:'overlay',effect:'ultrawideBars',icon:'▰'},
 {id:'rgb',name:'RGB Split',category:'retro',effect:'rgb',icon:'◈'},
 {id:'glitch',name:'Glitch Bars',category:'retro',effect:'glitchBars',icon:'≋'},
 {id:'glow',name:'Frequency Glow',category:'atmosphere',effect:'glow',icon:'◎'},
];

const presetPacks=[
 {id:'dubstep',name:'Dubstep',icon:'⚡',effects:['beatZoom','rgb','glitchBars','subPulse','dropFlash','audioBars']},
 {id:'melodic',name:'Melodic Dubstep',icon:'🌌',effects:['glow','particles','sparkles','lightLeaks','hueShift','circleSpectrum']},
 {id:'riddim',name:'Riddim',icon:'🔊',effects:['beatZoom','heavyStatic','signalTear','gridFlash','chromaticPulse','shake']},
 {id:'colorbass',name:'Color Bass',icon:'🌈',effects:['hueShift','chromaticPulse','glow','neonEdges','circleSpectrum']},
 {id:'dnb',name:'Drum & Bass',icon:'🏁',effects:['shake','audioBars','oscilloscope','laserGrid','gridFlash','beatZoom']},
 {id:'hardstyle',name:'Hardstyle',icon:'💥',effects:['strobe','dropFlash','shake','subPulse','heavyStatic']},
 {id:'cinematic',name:'Cinematic',icon:'🎞️',effects:['filmGrain','dust','vignette','ultrawideBars','lightLeaks','glow']},
 {id:'anime',name:'Anime Energy',icon:'✨',effects:['animeBars','chromaticPulse','hueShift','sparkles','dropFlash','shake']},
 {id:'retro',name:'Retro Arcade',icon:'🕹️',effects:['pixelate','posterize','scanlines','channelGhost','gridFlash']},
 {id:'ps1',name:'Low-Poly 32-Bit',icon:'🔺',effects:['posterize','pixelate','vignette','retroCinemaBars','hueShift','shake']},
 {id:'snes',name:'16-Bit Speedway',icon:'🏎️',effects:['pixelate','scanlines','laserGrid','beatZoom','gridFlash']},
 {id:'vhs',name:'VHS / CRT',icon:'📼',effects:['vhs','tvStatic','scanlines','filmGrain','rgb','vignette']},
 {id:'cyberpunk',name:'Cyberpunk',icon:'🌃',effects:['hueShift','laserGrid','digitalRain','glow','rgb','particles']},
 {id:'fantasy',name:'Fantasy Aura',icon:'🧙',effects:['particles','sparkles','lightLeaks','horizonGlow','glow']},
 {id:'minecraft',name:'Block World',icon:'⛏️',effects:['pixelate','posterize','gridFlash','particles','vignette']},
];

function effectInput(id){return $(`[data-effect="${CSS.escape(id)}"]`)}
function effectName(id){
 const input=effectInput(id);
 return input?.closest('label')?.querySelector('strong')?.textContent?.trim()||id;
}
function selectedEffects(){return $$('[data-effect]:checked').map(input=>input.dataset.effect)}
function setEffect(id,on=true){
 const input=effectInput(id);if(!input)return false;
 input.checked=on;input.dispatchEvent(new Event('change',{bubbles:true}));return true;
}
function toast(text,title='Producer Hub'){window.SOS?.toast?.(text,{title,icon:'✓'})}

function activateSideView(name){
 $$('[data-producer-view]',hub).forEach(b=>b.classList.toggle('isActive',b.dataset.producerView===name));
 $$('[data-producer-sidebar-view]',hub).forEach(v=>v.classList.toggle('isActive',v.dataset.producerSidebarView===name));
}
hub.addEventListener('click',event=>{
 const view=event.target.closest('[data-producer-view]');
 if(view){event.preventDefault();activateSideView(view.dataset.producerView)}
 const inspector=event.target.closest('[data-inspector-tab]');
 if(inspector){
  $$('.inspectorTabsV4190 button',hub).forEach(b=>b.classList.toggle('isActive',b===inspector));
  $$('.inspectorPanelV4190',hub).forEach(p=>p.classList.toggle('isActive',p.dataset.inspectorPanel===inspector.dataset.inspectorTab));
 }
});

$('#collapseProducerSidebarV4190')?.addEventListener('click',()=>hub.classList.toggle('sidebarCollapsedV4190'));
$('#collapseProducerInspectorV4190')?.addEventListener('click',()=>hub.classList.toggle('inspectorCollapsedV4190'));

function renderAssets(filter='all',query=''){
 const grid=$('#assetLibraryGridV4190');if(!grid)return;
 const q=query.trim().toLowerCase();
 const rows=assets.filter(a=>(filter==='all'||a.category===filter)&&(!q||a.name.toLowerCase().includes(q)));
 grid.innerHTML=rows.length?rows.map(a=>`<button type="button" data-asset-effect="${a.effect}"><i>${a.icon}</i><span><strong>${a.name}</strong><small>${a.category}</small></span><b>${effectInput(a.effect)?.checked?'ON':'ADD'}</b></button>`).join(''):'<p>No matching assets.</p>';
}
let assetCategory='all';
$('#assetSearchV4190')?.addEventListener('input',e=>renderAssets(assetCategory,e.target.value));
$$('[data-asset-category]',hub).forEach(button=>button.addEventListener('click',()=>{
 assetCategory=button.dataset.assetCategory;
 $$('[data-asset-category]',hub).forEach(b=>b.classList.toggle('isActive',b===button));
 renderAssets(assetCategory,$('#assetSearchV4190').value);
}));
$('#assetLibraryGridV4190')?.addEventListener('click',event=>{
 const button=event.target.closest('[data-asset-effect]');if(!button)return;
 const input=effectInput(button.dataset.assetEffect);if(!input)return;
 setEffect(button.dataset.assetEffect,!input.checked);renderAssets(assetCategory,$('#assetSearchV4190').value);refreshAll();
});

function favorites(){try{return new Set(JSON.parse(localStorage.getItem(STORAGE_FAVORITES)||'[]'))}catch{return new Set()}}
function renderPresetPacks(){
 const fav=favorites(),grid=$('#presetPackGridV4190');if(!grid)return;
 grid.innerHTML=presetPacks.map(pack=>`<article><button type="button" class="favoritePresetV4190 ${fav.has(pack.id)?'isFavorite':''}" data-favorite-pack="${pack.id}" title="Favorite preset">★</button><i>${pack.icon}</i><div><strong>${pack.name}</strong><small>${pack.effects.length} layered effects</small></div><div class="presetPackActionsV4190"><button type="button" class="smallAction" data-apply-pack="${pack.id}">Apply Pack</button><button type="button" class="smallAction" data-export-pack="${pack.id}">Export JSON</button></div></article>`).join('');
}
$('#presetPackGridV4190')?.addEventListener('click',event=>{
 const favorite=event.target.closest('[data-favorite-pack]');
 if(favorite){
  const set=favorites(),id=favorite.dataset.favoritePack;set.has(id)?set.delete(id):set.add(id);
  localStorage.setItem(STORAGE_FAVORITES,JSON.stringify([...set]));renderPresetPacks();return;
 }
 const exportButton=event.target.closest('[data-export-pack]');
 if(exportButton){
  const pack=presetPacks.find(p=>p.id===exportButton.dataset.exportPack);if(!pack)return;
  const blob=new Blob([JSON.stringify({...pack,exportedAt:new Date().toISOString(),version:'4.19.0'},null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`sos-${pack.id}-preset-pack.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1200);return;
 }
 const apply=event.target.closest('[data-apply-pack]');if(!apply)return;
 const pack=presetPacks.find(p=>p.id===apply.dataset.applyPack);if(!pack)return;
 $$('[data-effect]:checked').forEach(input=>{input.checked=false});
 pack.effects.forEach(id=>setEffect(id,true));toast(`${pack.name} preset pack applied.`);refreshAll();
});

function refreshSlots(){
 const videoFile=videoInput?.files?.[0],audioFile=audioInput?.files?.[0];
 $('#producerVideoSlotV4190').textContent=videoFile?.name||'No video loaded';
 $('#producerAudioSlotV4190').textContent=audioFile?.name||'No music loaded';
 const effects=selectedEffects();$('#producerEffectSlotV4190').textContent=effects.length?`${effects.length} selected`:'No effects selected';
 const videoShelf=$('#producerVideoShelfV4190'),musicShelf=$('#producerMusicShelfV4190');
 if(videoShelf)videoShelf.innerHTML=videoFile?`<article><i>🎬</i><div><strong>${videoFile.name}</strong><small>${(videoFile.size/1024/1024).toFixed(1)} MB · ${videoFile.type||'video'}</small></div></article>`:'<p>No video loaded.</p>';
 if(musicShelf)musicShelf.innerHTML=audioFile?`<article><i>🎵</i><div><strong>${audioFile.name}</strong><small>${(audioFile.size/1024/1024).toFixed(1)} MB · ${audioFile.type||'audio'}</small></div></article>`:'<p>No music loaded.</p>';
}
function formatTime(seconds=0){
 const s=Math.max(0,Number(seconds)||0),m=Math.floor(s/60),r=s-m*60;
 return `${String(m).padStart(2,'0')}:${r.toFixed(2).padStart(5,'0')}`;
}
function transportTime(){return window.SOSVideoClipsV4240?.globalTime?.()??(video?.currentTime||0)}
function transportDuration(){return window.SOSVideoClipsV4240?.totalDuration?.()??(video?.duration||0)}
function updateTransport(){
 const current=transportTime(),duration=transportDuration();
 $('#producerCurrentTimeV4190').textContent=formatTime(current);
 $('#producerDurationV4190').textContent=formatTime(duration);
 const progress=Math.min(1,current/Math.max(.01,duration||1));
 if(playhead)playhead.style.left=`calc(120px + (100% - 120px) * ${progress})`;
 timelineRaf=requestAnimationFrame(updateTransport);
}
async function seekTransport(target){
 const total=transportDuration();
 target=Math.max(0,Math.min(total,target));
 const snap=$('#snapPlayheadToClipEdgesV4260')?.checked;
 if(snap&&window.SOSVideoClipsV4240?.snapToClipEdge){
  const edge=window.SOSVideoClipsV4240.snapToClipEdge(target,.16);
  if(Math.abs(edge-target)<=.16)target=edge;
 }
 if(window.SOSVideoClipsV4240?.seekGlobal)await window.SOSVideoClipsV4240.seekGlobal(target);
 else if(video)video.currentTime=target;
 if(audio?.src)audio.currentTime=Math.min(target,audio.duration||target);
}
cancelAnimationFrame(timelineRaf);updateTransport();
$('#producerPlayV4190')?.addEventListener('click',()=>$('#composerPreviewButtonV4180')?.click());
$('#producerPauseV4190')?.addEventListener('click',()=>{video?.pause();audio?.pause()});
$('#producerRestartV4190')?.addEventListener('click',()=>seekTransport(0));
$('#producerRewindV4260')?.addEventListener('click',()=>seekTransport(transportTime()-5));
$('#producerForwardV4260')?.addEventListener('click',()=>seekTransport(transportTime()+5));

function syncInspector(){
 const pairs=[
  ['#inspectorStartV4190','#composerStartV4180'],
  ['#inspectorEndV4190','#composerEndV4180'],
  ['#inspectorMusicVolumeV4190','#composerMusicVolumeV4180'],
  ['#inspectorSourceVolumeV4190','#composerSourceVolumeV4180'],
  ['#inspectorFormatV4190','#composerFormatV4180'],
 ];
 pairs.forEach(([a,b])=>{
  const inspect=$(a),original=$(b);if(!inspect||!original)return;
  inspect.value=original.value;
  inspect.oninput=()=>{original.value=inspect.value;original.dispatchEvent(new Event('input',{bubbles:true}));original.dispatchEvent(new Event('change',{bubbles:true}))};
  original.addEventListener('input',()=>inspect.value=original.value);
  original.addEventListener('change',()=>inspect.value=original.value);
 });
}
syncInspector();
$('#normalizeAudioV4190')?.addEventListener('click',()=>{
 $('#inspectorMusicVolumeV4190').value=.85;$('#inspectorSourceVolumeV4190').value=.25;
 $('#inspectorMusicVolumeV4190').dispatchEvent(new Event('input'));$('#inspectorSourceVolumeV4190').dispatchEvent(new Event('input'));
 toast('Balanced mix levels applied.');
});
function applyTransform(){
 const scale=Number($('#inspectorScaleV4190').value||1),rotation=Number($('#inspectorRotationV4190').value||0);
 const canvas=$('#composerCanvasV4180'),player=$('#composerPreviewVideoV4180');
 [canvas,player].forEach(el=>{if(el)el.style.transform=`scale(${scale}) rotate(${rotation}deg)`});
}
$('#inspectorScaleV4190')?.addEventListener('input',applyTransform);
$('#inspectorRotationV4190')?.addEventListener('input',applyTransform);

function refreshLayers(){
 const effects=selectedEffects();
 if(!layerState.length||layerState.map(x=>x.id).join('|')!==effects.join('|')){
  layerState=effects.map((id,index)=>({id,enabled:true,opacity:1,index}));
 }
 effectLayerList.innerHTML=layerState.length?layerState.map((layer,index)=>`<article draggable="true" data-layer-id="${layer.id}"><button type="button" data-layer-toggle="${layer.id}" class="${layer.enabled?'isEnabled':''}">${layer.enabled?'●':'○'}</button><div><strong>Layer ${index+1}: ${effectName(layer.id)}</strong><small>Visual effect layer</small></div><input type="range" min="0" max="1" step=".05" value="${layer.opacity}" data-layer-opacity="${layer.id}"><button type="button" data-remove-layer="${layer.id}">×</button></article>`).join(''):'<p>No effect layers. Add effects from Preset Packs, Assets, or the Effects module.</p>';
 effectsLane.innerHTML=layerState.map((layer,index)=>`<div class="timelineEffectClipV4190" style="left:${index*2}%;width:${Math.max(18,96-index*2)}%">${effectName(layer.id)}</div>`).join('');
}
effectLayerList?.addEventListener('click',event=>{
 const toggle=event.target.closest('[data-layer-toggle]');
 if(toggle){const layer=layerState.find(l=>l.id===toggle.dataset.layerToggle);if(layer){layer.enabled=!layer.enabled;setEffect(layer.id,layer.enabled);refreshAll()}}
 const remove=event.target.closest('[data-remove-layer]');
 if(remove){setEffect(remove.dataset.removeLayer,false);refreshAll()}
});
effectLayerList?.addEventListener('input',event=>{
 const input=event.target.closest('[data-layer-opacity]');if(!input)return;
 const layer=layerState.find(l=>l.id===input.dataset.layerOpacity);if(layer)layer.opacity=Number(input.value);
 const global=$('#effectOpacityV4172');if(global){global.value=input.value;global.dispatchEvent(new Event('input',{bubbles:true}))}
});
$('#addEffectLayerV4190')?.addEventListener('click',()=>{
 document.querySelector('[data-studio-module="effects"]')?.click();
 toast('Choose another effect to add it as a layer.');
});

async function decodeAudio(){
 const file=audioInput?.files?.[0];if(!file)throw new Error('Choose a music file first.');
 const C=window.AudioContext||window.webkitAudioContext;audioContext ||= new C();
 const buffer=await file.arrayBuffer();audioBuffer=await audioContext.decodeAudioData(buffer.slice(0));return audioBuffer;
}
function drawWaveform(buffer){
 const canvas=timelineWave,ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,data=buffer.getChannelData(0),step=Math.max(1,Math.floor(data.length/w));
 ctx.clearRect(0,0,w,h);ctx.fillStyle='rgba(0,0,0,.16)';ctx.fillRect(0,0,w,h);
 const grad=ctx.createLinearGradient(0,0,w,0);grad.addColorStop(0,'#9a54e6');grad.addColorStop(.5,'#d8aaff');grad.addColorStop(1,'#56eaa2');ctx.strokeStyle=grad;ctx.lineWidth=1;
 for(let x=0;x<w;x++){let min=1,max=-1;for(let i=0;i<step;i++){const v=data[x*step+i]||0;if(v<min)min=v;if(v>max)max=v}ctx.beginPath();ctx.moveTo(x,(1+min)*h/2);ctx.lineTo(x,(1+max)*h/2);ctx.stroke()}
}
function detectBeats(buffer){
 const data=buffer.getChannelData(0),rate=buffer.sampleRate,windowSize=1024,energies=[];
 for(let i=0;i<data.length;i+=windowSize){let sum=0;for(let j=0;j<windowSize&&i+j<data.length;j++)sum+=data[i+j]*data[i+j];energies.push(Math.sqrt(sum/windowSize))}
 const sorted=[...energies].sort((a,b)=>a-b),threshold=(sorted[Math.floor(sorted.length*.82)]||0)*1.18,markers=[];let last=-Infinity;
 energies.forEach((energy,index)=>{const time=index*windowSize/rate;if(energy>threshold&&time-last>.22){markers.push({time,energy});last=time}});
 return markers.slice(0,500);
}
function renderMarkers(){
 const duration=audioBuffer?.duration||video?.duration||1;
 markerLane.innerHTML=beatMarkers.map((marker,index)=>`<button type="button" class="beatMarkerV4190 ${index%16===0?'isDrop':''}" style="left:${marker.time/duration*100}%" title="${formatTime(marker.time)}" data-marker-time="${marker.time}"></button>`).join('');
 $('#timelineStatusV4190').textContent=beatMarkers.length?`${beatMarkers.length} beat markers detected`:'No beat markers';
}
$('#analyzeBeatsV4190')?.addEventListener('click',async()=>{
 const button=$('#analyzeBeatsV4190');button.disabled=true;button.textContent='Analyzing…';window.dispatchEvent(new CustomEvent('sos:beat-analysis-start'));
 try{const buffer=await decodeAudio();drawWaveform(buffer);beatMarkers=detectBeats(buffer);renderMarkers();const summary=$('#producerWaveformSummaryV4190');if(summary)summary.innerHTML=`<strong>${beatMarkers.length} markers generated</strong><small>${formatTime(buffer.duration)} analyzed at ${buffer.sampleRate} Hz.</small>`;$('#downloadTimelineWaveformV4190').disabled=false;$('#exportBeatMarkersV4190').disabled=false;window.dispatchEvent(new CustomEvent('sos:beat-analysis-complete',{detail:{count:beatMarkers.length}}));toast(`${beatMarkers.length} beat markers generated.`,'Beat Analysis')}
 catch(error){toast(error.message,'Beat Analysis')}
 finally{button.disabled=false;button.textContent='Analyze Beats'}
});
markerLane?.addEventListener('click',event=>{const marker=event.target.closest('[data-marker-time]');if(marker&&video){video.currentTime=Number(marker.dataset.markerTime);if(audio)audio.currentTime=Number(marker.dataset.markerTime)%Math.max(1,audio.duration||1)}});

$('#autoSyncEffectsV4190')?.addEventListener('click',async()=>{
 if(!beatMarkers.length)$('#analyzeBeatsV4190')?.click();
 ['beatZoom','dropFlash','glow','rgb','shake'].forEach(id=>setEffect(id,true));
 toast('Beat-reactive effects enabled. Markers guide drop and pulse timing.','Auto-Sync');
 refreshAll();
});

function renderRuler(){
 const ruler=$('#timelineRulerV4190'),duration=Math.max(10,video?.duration||audio?.duration||60),ticks=Math.min(30,Math.ceil(duration/5));
 ruler.style.setProperty('--timeline-zoom',zoom);
 ruler.innerHTML=Array.from({length:ticks+1},(_,i)=>`<span style="left:${i/ticks*100}%">${formatTime(duration*i/ticks).slice(0,5)}</span>`).join('');
 $('#timelineTracksV4190').style.width=`${100*zoom}%`;ruler.style.width=`${100*zoom}%`;
}
$('#timelineZoomV4190')?.addEventListener('input',e=>{zoom=Number(e.target.value);renderRuler()});
$('#timelineZoomInV4190')?.addEventListener('click',()=>{const input=$('#timelineZoomV4190');input.value=Math.min(4,Number(input.value)+.25);input.dispatchEvent(new Event('input'))});
$('#timelineZoomOutV4190')?.addEventListener('click',()=>{const input=$('#timelineZoomV4190');input.value=Math.max(1,Number(input.value)-.25);input.dispatchEvent(new Event('input'))});

function projectSnapshot(){
 return {
  id:crypto.randomUUID?.()||String(Date.now()),
  name:projectName.value.trim()||'Untitled Frequency Project',
  updatedAt:new Date().toISOString(),
  video:videoInput?.files?.[0]?.name||'',
  audio:audioInput?.files?.[0]?.name||'',
  effects:selectedEffects(),
  start:Number($('#composerStartV4180')?.value||0),
  end:Number($('#composerEndV4180')?.value||0),
  format:$('#composerFormatV4180')?.value||'auto',
  markers:beatMarkers.slice(0,250),
 };
}
function savedProjects(){try{return JSON.parse(localStorage.getItem(STORAGE_PROJECTS)||'[]')}catch{return []}}
function renderProjects(){
 const rows=savedProjects(),host=$('#recentProducerProjectsV4190');
 host.innerHTML=rows.length?rows.map(row=>`<button type="button" data-load-project="${row.id}"><strong>${row.name}</strong><small>${row.video||'No video'} · ${row.effects?.length||0} FX</small></button>`).join(''):'<p>No saved projects yet.</p>';
}
$('#saveProducerProjectV4190')?.addEventListener('click',()=>{
 const snap=projectSnapshot(),rows=savedProjects().filter(row=>row.name!==snap.name);rows.unshift(snap);
 localStorage.setItem(STORAGE_PROJECTS,JSON.stringify(rows.slice(0,15)));renderProjects();toast('Project settings saved locally.');
});
$('#recentProducerProjectsV4190')?.addEventListener('click',event=>{
 const button=event.target.closest('[data-load-project]');if(!button)return;
 const row=savedProjects().find(x=>x.id===button.dataset.loadProject);if(!row)return;
 projectName.value=row.name;$$('[data-effect]:checked').forEach(i=>i.checked=false);row.effects?.forEach(id=>setEffect(id,true));
 $('#composerStartV4180').value=row.start||0;$('#composerEndV4180').value=row.end||0;beatMarkers=row.markers||[];renderMarkers();refreshAll();toast('Project settings restored. Re-select local media files if needed.');
});
$('#clearProducerProjectsV4190')?.addEventListener('click',()=>{localStorage.removeItem(STORAGE_PROJECTS);renderProjects()});
$('#newProducerProjectV4190')?.addEventListener('click',()=>{
 projectName.value='Untitled Frequency Project';$$('[data-effect]:checked').forEach(i=>{i.checked=false;i.dispatchEvent(new Event('change',{bubbles:true}))});beatMarkers=[];renderMarkers();refreshAll();toast('New project workspace prepared.');
});

function renderDownloads(){
 const host=$('#producerDownloadListV4190');let rows=[];
 try{rows=JSON.parse(localStorage.getItem('sos_video_download_jobs_v4183')||'[]')}catch{}
 host.innerHTML=rows.length?rows.map(job=>`<article><div><strong>${job.title||job.format||'Downloaded media'}</strong><small>${job.statusText||job.status||'Queued'}</small></div>${job.downloadUrl?`<button type="button" data-import-provider-url="${job.downloadUrl}">Import</button>`:''}</article>`).join(''):'<p>No provider downloads yet.</p>';
}
$('#producerDownloadListV4190')?.addEventListener('click',async event=>{
 const button=event.target.closest('[data-import-provider-url]');if(!button)return;
 await importProviderUrl(button.dataset.importProviderUrl);
});
async function importProviderUrl(url){
 const status=$('#composerStatusV4180');status.textContent='Importing provider video into the project…';
 try{
  const response=await fetch(url,{mode:'cors'});if(!response.ok)throw new Error(`Download returned ${response.status}`);
  const blob=await response.blob(),name=`provider-import-${Date.now()}.${blob.type.includes('mp4')?'mp4':'webm'}`;
  const file=new File([blob],name,{type:blob.type||'video/mp4'}),transfer=new DataTransfer();transfer.items.add(file);videoInput.files=transfer.files;videoInput.dispatchEvent(new Event('change',{bubbles:true}));
  document.querySelector('[data-studio-module="create"]')?.click();toast('Provider video imported into the editor.');
 }catch(error){
  window.open(url,'_blank','noopener');status.textContent='The provider blocked browser import, so the secure download opened. Save it and drag it into Create.';
 }
}
window.addEventListener('sos:provider-download-ready',event=>{renderDownloads();if(event.detail?.downloadUrl)importProviderUrl(event.detail.downloadUrl)});

$('#downloadTimelineWaveformV4190')?.addEventListener('click',()=>{
 const a=document.createElement('a');a.href=timelineWave.toDataURL('image/png');a.download=`sos-waveform-${Date.now()}.png`;a.click();
});
$('#exportBeatMarkersV4190')?.addEventListener('click',()=>{
 const blob=new Blob([JSON.stringify({project:projectName.value,markers:beatMarkers,version:'4.19.0'},null,2)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`sos-beat-markers-${Date.now()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1200);
});

function refreshAll(){
 refreshSlots();refreshLayers();renderAssets(assetCategory,$('#assetSearchV4190')?.value||'');renderRuler();
}
document.addEventListener('change',event=>{if(event.target.matches('[data-effect],#composerVideoV4180,#composerAudioV4180'))setTimeout(refreshAll,20)});
document.addEventListener('click',event=>{if(event.target.closest('[data-effect-preset],[data-effect-clear]'))setTimeout(refreshAll,30)});
video?.addEventListener('loadedmetadata',()=>{renderRuler();$('#inspectorEndV4190').value=video.duration.toFixed(2)});
audioInput?.addEventListener('change',()=>{audioBuffer=null;beatMarkers=[];renderMarkers()});
videoInput?.addEventListener('change',refreshSlots);

$('#renderProducerProjectV4190')?.addEventListener('click',()=>$('#inspectorRenderV4190')?.click());
$('#inspectorRenderV4190')?.addEventListener('click',()=>{
 const format=$('#inspectorFormatV4190').value,composerFormat=$('#composerFormatV4180');if(composerFormat)composerFormat.value=format;
 window.dispatchEvent(new CustomEvent('sos:render-queue-add',{detail:{type:'render',title:projectName.value||'Producer Hub Project'}}));
 $('#composerRenderButtonV4180')?.click();
});
renderAssets();renderPresetPacks();renderProjects();renderDownloads();refreshAll();
})();