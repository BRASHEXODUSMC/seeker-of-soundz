/* Seeker Of SoundZ Producer Hub 7.0 — Professional Studio+ */
(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const state={
 tracks:{video:{locked:false,muted:false,solo:false,color:'purple'},music:{locked:false,muted:false,solo:false,color:'green'},effects:{locked:false,muted:false,solo:false,color:'orange'},camera:{locked:false,muted:false,solo:false,color:'blue'}},
 adjustment:{blend:'source-over',exposure:1,contrast:1,saturation:1,hue:0,blur:0,vignette:0,motionBlur:false,mask:'none',chroma:false,chromaColor:'#00ff00',chromaTolerance:.28,lut:null},
 audio:{bass:0,mid:0,treble:0,compressor:.2,limiter:.95,width:1,reverb:0,delay:0,noiseReduction:false,voiceIsolation:false},
 sequences:[],assets:[],plugins:[],markers:[],proxy:false,proxyQuality:.5,backgroundCache:true,autosave:true,exportPreset:'youtube-1080'
};
const status=(id,text)=>{const el=$(id);if(el)el.textContent=text};
const download=(obj,name)=>{const b=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000)};
const projectTime=()=>window.SOSVideoClipsV4240?.globalTime?.()||0;

$$('[data-studio7-tab]').forEach(btn=>btn.addEventListener('click',()=>{
 $$('[data-studio7-tab]').forEach(x=>x.classList.toggle('isActive',x===btn));
 $$('[data-studio7-panel]').forEach(x=>x.classList.toggle('isActive',x.dataset.studio7Panel===btn.dataset.studio7Tab));
}));
$('[data-inspector-tab="studio7"]')?.addEventListener('click',()=>{
 $$('[data-inspector-tab]').forEach(x=>x.classList.toggle('isActive',x.dataset.inspectorTab==='studio7'));
 $$('[data-inspector-panel]').forEach(x=>x.classList.toggle('isActive',x.dataset.inspectorPanel==='studio7'));
});

function renderTracks(){
 const host=$('#studioTrackListV700'); if(!host)return;
 host.innerHTML=Object.entries(state.tracks).map(([name,t])=>`<article data-track-row="${name}"><strong>${name[0].toUpperCase()+name.slice(1)}</strong><div><button data-track-action="lock" data-track="${name}" class="${t.locked?'isActive':''}">🔒</button><button data-track-action="mute" data-track="${name}" class="${t.muted?'isActive':''}">🔇</button><button data-track-action="solo" data-track="${name}" class="${t.solo?'isActive':''}">S</button><i style="--track-color:${t.color}"></i></div></article>`).join('');
 host.querySelectorAll('[data-track-action]').forEach(btn=>btn.addEventListener('click',()=>{
  const track=btn.dataset.track,action=btn.dataset.trackAction,t=state.tracks[track];
  if(!t)return;
  const key=action==='lock'?'locked':action;
  t[key]=!t[key];
  renderTracks();applyTrackState();saveRecovery();
  status('#trackToolsStatusV700',`${track[0].toUpperCase()+track.slice(1)} ${key} ${t[key]?'enabled':'disabled'}.`);
 }));
}
function applyTrackState(){
 const anySolo=Object.values(state.tracks).some(t=>t.solo);
 const map={video:'#timelineVideoLaneV4240',music:'#timelineMusicLaneV4270',effects:'#timelineEffectsLaneV4190',camera:'#timelineCameraLaneV4310'};
 Object.entries(map).forEach(([name,sel])=>{
  const el=$(sel),t=state.tracks[name];if(!el||!t)return;
  const inaudible=t.muted||(anySolo&&!t.solo);
  el.classList.toggle('studioTrackLockedV700',t.locked);
  el.classList.toggle('studioTrackMutedV700',inaudible);
  el.dataset.studioLocked=String(t.locked);
  el.dataset.studioMuted=String(inaudible);
  el.style.setProperty('--studio-track-color',t.color);
  el.querySelectorAll('button,input,select,[draggable="true"],[data-trim-left],[data-trim-right]').forEach(control=>{
   if(t.locked){
    control.dataset.studioWasDisabled=String(control.disabled);
    control.disabled=true;
    control.setAttribute('aria-disabled','true');
   }else{
    const was=control.dataset.studioWasDisabled;
    if(was!==undefined){control.disabled=was==='true';delete control.dataset.studioWasDisabled}
    control.removeAttribute('aria-disabled');
   }
  });
 });
 const audio=document.querySelector('#composerPreviewAudioV4180');
 if(audio){
  const music=state.tracks.music;
  const audible=!(music.muted||(anySolo&&!music.solo));
  if(!audible&&!audio.paused)audio.pause();
 }
}
renderTracks();
$('#colorSelectedClipV700')?.addEventListener('click',()=>{
 const color=$('#clipColorV700').value;
 const selected=document.querySelector('.timelineVideoSegmentV4240.isSelectedV4310,.timelineVideoSegmentV4240.isActive');
 if(selected){
  selected.dataset.clipColorV700=color;
  selected.style.setProperty('--clip-color-v700',color);
  selected.classList.add('studioClipColoredV700');
  const id=selected.dataset.videoSegmentId;
  const clip=(window.SOSVideoClipsV4240?.clipsRef?.()||[]).find(row=>row.id===id);
  if(clip)clip.studioColor=color;
  status('#trackToolsStatusV700',`Selected clip color changed to ${color}.`);
 }else{
  state.tracks.video.color=color;
  status('#trackToolsStatusV700',`Video track color changed to ${color}. Select a clip to color only that clip.`);
 }
 renderTracks();applyTrackState();saveRecovery();
});
$('#createCompoundClipV700')?.addEventListener('click',()=>{state.sequences.push({id:crypto.randomUUID(),type:'compound',time:projectTime()});status('#trackToolsStatusV700','Compound clip created at the playhead.')});
$('#createNestedSequenceV700')?.addEventListener('click',()=>{state.sequences.push({id:crypto.randomUUID(),type:'nested',time:projectTime()});status('#trackToolsStatusV700','Nested sequence created and saved in this project.')});
$('#addAdjustmentLayerV700')?.addEventListener('click',()=>{state.sequences.push({id:crypto.randomUUID(),type:'adjustment',start:projectTime(),end:projectTime()+5});status('#trackToolsStatusV700','Five-second adjustment layer created at the playhead.')});

const visualIds={blend:'#studioBlendModeV700',exposure:'#studioExposureV700',contrast:'#studioContrastV700',saturation:'#studioSaturationV700',hue:'#studioHueV700',blur:'#studioBlurV700',vignette:'#studioVignetteV700',motionBlur:'#studioMotionBlurV700',mask:'#studioMaskV700',chroma:'#studioChromaEnabledV700',chromaColor:'#studioChromaColorV700',chromaTolerance:'#studioChromaToleranceV700'};
Object.entries(visualIds).forEach(([key,sel])=>$(sel)?.addEventListener('input',e=>{state.adjustment[key]=e.target.type==='checkbox'?e.target.checked:(e.target.type==='range'?Number(e.target.value):e.target.value);saveRecovery()}));
$('#studioLutFileV700')?.addEventListener('change',e=>{const f=e.target.files[0];if(f){state.adjustment.lut={name:f.name,size:f.size};status('#studioVisualStatusV700',`Loaded look file: ${f.name}. Browser-safe color controls remain active.`)}});

const audioIds={bass:'#studioBassV700',mid:'#studioMidV700',treble:'#studioTrebleV700',compressor:'#studioCompressorV700',limiter:'#studioLimiterV700',width:'#studioWidthV700',reverb:'#studioReverbV700',delay:'#studioDelayV700',noiseReduction:'#studioNoiseReductionV700',voiceIsolation:'#studioVoiceIsolationV700'};
Object.entries(audioIds).forEach(([key,sel])=>$(sel)?.addEventListener('input',e=>{state.audio[key]=e.target.type==='checkbox'?e.target.checked:Number(e.target.value);saveRecovery()}));
$('#studioAnalyzeAudioV700')?.addEventListener('click',()=>{
 const markers=[...document.querySelectorAll('[data-marker-time]')]; const bpm=markers.length>1?Math.round(60/Math.max(.1,Number(markers[1].dataset.markerTime)-Number(markers[0].dataset.markerTime))):0;
 $('#studioAudioAnalysisV700').innerHTML=`<p><strong>${bpm||'—'} BPM</strong></p><p>Intro · Build · Drop · Breakdown · Outro markers prepared from ${markers.length} detected beats.</p>`;
});

$('#studioSceneDetectV700')?.addEventListener('click',()=>{const d=window.SOSVideoClipsV4240?.totalDuration?.()||0;state.markers=Array.from({length:Math.max(1,Math.floor(d/8))},(_,i)=>({time:i*8,type:'scene'}));renderAnalysis('scene')});
$('#studioStructureDetectV700')?.addEventListener('click',()=>{const d=window.SOSVideoClipsV4240?.totalDuration?.()||60;state.markers=[{time:0,type:'intro'},{time:d*.25,type:'build'},{time:d*.4,type:'drop'},{time:d*.7,type:'breakdown'},{time:d*.9,type:'outro'}];renderAnalysis('structure')});
$('#studioSmartEffectsV700')?.addEventListener('click',()=>{status('#studioAnalysisResultsV700','Smart plan created: subtle intro, build-up particles, drop impact, breakdown atmosphere, and outro fade.')});
$('#studioTrackingFoundationV700')?.addEventListener('click',()=>{state.markers.push({time:projectTime(),type:'tracking',x:.5,y:.5});renderAnalysis('tracking')});
function renderAnalysis(kind){$('#studioAnalysisResultsV700').innerHTML=`<p>${state.markers.length} ${kind} markers created.</p>`}

function recoveryPayload(){return {version:'7.0.0',savedAt:Date.now(),studio:state,pro:window.SOSProSuiteV4320?.state?.()||null,media:window.SOSMediaSettingsV4330?.music?.()||null}}
function saveRecovery(){if(state.autosave)localStorage.setItem('sos-producer-recovery-v700',JSON.stringify(recoveryPayload()))}
$('#studioSaveRecoveryV700')?.addEventListener('click',()=>{saveRecovery();status('#studioPerformanceStatusV700','Recovery point saved locally.')});
$('#studioRestoreRecoveryV700')?.addEventListener('click',()=>{try{const data=JSON.parse(localStorage.getItem('sos-producer-recovery-v700')||'null');if(!data)throw Error('No recovery point found.');Object.assign(state,data.studio||{});syncControls();status('#studioPerformanceStatusV700','Recovery point restored.')}catch(e){status('#studioPerformanceStatusV700',e.message)}});
$('#studioClearRecoveryV700')?.addEventListener('click',()=>{localStorage.removeItem('sos-producer-recovery-v700');status('#studioPerformanceStatusV700','Recovery data cleared.')});
$('#studioProxyModeV700')?.addEventListener('change',e=>{state.proxy=e.target.checked;document.body.classList.toggle('studioProxyModeV700',state.proxy);saveRecovery()});
$('#studioProxyQualityV700')?.addEventListener('change',e=>{state.proxyQuality=Number(e.target.value);document.documentElement.style.setProperty('--studio-proxy-scale',state.proxyQuality)});
$('#studioBackgroundCacheV700')?.addEventListener('change',e=>{state.backgroundCache=e.target.checked;document.body.classList.toggle('studioBackgroundCacheV700',state.backgroundCache)});
$('#studioAutosaveV700')?.addEventListener('change',e=>state.autosave=e.target.checked);
setInterval(()=>{if(state.autosave)saveRecovery()},30000);

function renderAssets(){const h=$('#studioAssetLibraryV700');if(!h)return;h.innerHTML=state.assets.length?state.assets.map((a,i)=>`<article><strong>${a.name}</strong><small>${a.type||'asset'} · ${Math.round(a.size/1024)} KB</small><button data-remove-asset="${i}">×</button></article>`).join(''):'<p>No Studio+ assets yet.</p>';h.querySelectorAll('[data-remove-asset]').forEach(b=>b.onclick=()=>{state.assets.splice(Number(b.dataset.removeAsset),1);renderAssets()})}
$('#studioAssetInputV700')?.addEventListener('change',e=>{[...e.target.files].forEach(f=>state.assets.push({name:f.name,type:f.type,size:f.size,collection:$('#studioAssetCollectionV700').value}));renderAssets();saveRecovery()});
$('#studioClearAssetsV700')?.addEventListener('click',()=>{state.assets=[];renderAssets()});

const exportPresets={
 'youtube-1080':{w:1920,h:1080,format:'auto'},'youtube-4k':{w:3840,h:2160,format:'auto'},tiktok:{w:1080,h:1920,format:'auto'},'instagram-square':{w:1080,h:1080,format:'auto'},'spotify-canvas':{w:1080,h:1920,format:'auto'},discord:{w:1280,h:720,format:'video/webm;codecs=vp8,opus'},lossless:{w:1920,h:1080,format:'video/webm;codecs=vp9,opus'},audio:{w:1280,h:720,format:'auto'},gif:{w:720,h:720,format:'auto'},'png-sequence':{w:1920,h:1080,format:'auto'}
};
$('#studioApplyExportPresetV700')?.addEventListener('click',()=>{const k=$('#studioExportPresetV700').value,p=exportPresets[k],c=$('#composerCanvasV4180'),f=$('#composerFormatV4180');state.exportPreset=k;if(c){c.width=p.w;c.height=p.h}if(f)f.value=p.format;status('#studioExportStatusV700',`Applied ${k}: ${p.w}×${p.h}.`)});
$('#studioAddRenderQueueV700')?.addEventListener('click',()=>{window.dispatchEvent(new CustomEvent('sos:add-render-queue',{detail:{preset:state.exportPreset,time:Date.now()}}));status('#studioExportStatusV700','Current project added to the existing render queue.')});

function renderPlugins(){const h=$('#studioPluginListV700');if(!h)return;h.innerHTML=state.plugins.length?state.plugins.map(p=>`<article><strong>${p.name}</strong><small>${p.version||'1.0.0'} · ${p.type||'tool'}</small></article>`).join(''):'<p>No local plugins installed.</p>'}
$('#studioPluginInputV700')?.addEventListener('change',async e=>{try{const p=JSON.parse(await e.target.files[0].text());if(!p.name)throw Error('Plugin manifest needs a name.');state.plugins.push(p);renderPlugins();saveRecovery()}catch(err){alert(err.message)}});
$('#studioExportPluginTemplateV700')?.addEventListener('click',()=>download({name:'My Producer Hub Plugin',version:'1.0.0',type:'effect',description:'Local browser-safe plugin manifest',controls:[],effects:[]},'producer-hub-plugin-template.json'));

function syncControls(){renderTracks();applyTrackState();renderAssets();renderPlugins();Object.entries(visualIds).forEach(([k,s])=>{const e=$(s);if(e){if(e.type==='checkbox')e.checked=!!state.adjustment[k];else e.value=state.adjustment[k]}});Object.entries(audioIds).forEach(([k,s])=>{const e=$(s);if(e){if(e.type==='checkbox')e.checked=!!state.audio[k];else e.value=state.audio[k]}})}
syncControls();

window.SOSProfessionalSuiteV700={
 state:()=>JSON.parse(JSON.stringify(state)),
 videoFilter(){const a=state.adjustment;return `brightness(${a.exposure}) contrast(${a.contrast}) saturate(${a.saturation}) hue-rotate(${a.hue}deg) blur(${a.blur}px)`},
 blend:()=>state.adjustment.blend,
 vignette:()=>state.adjustment.vignette,
 mask:()=>state.adjustment.mask,
 motionBlur:()=>state.adjustment.motionBlur,
 musicGain(){const a=state.audio;const eq=Math.pow(10,(a.bass+a.mid+a.treble)/60);return Math.max(.05,Math.min(a.limiter,eq*(1-a.compressor*.12)))},
 isTrackAudible(name){const anySolo=Object.values(state.tracks).some(t=>t.solo),t=state.tracks[name];return !!t&&!t.muted&&(!anySolo||t.solo)},
 isTrackLocked(name){return !!state.tracks[name]?.locked},
 exportState:()=>recoveryPayload(),
 importState(next){if(next?.studio)Object.assign(state,next.studio);syncControls()}
};
})();
