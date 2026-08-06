/* Seeker Of SoundZ v4.32.0 — Pro Suite, project save, keyframes, multicam */
(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const hub=$('#producerHubV4190');
const video=$('#composerPreviewVideoV4180');
const audio=$('#composerPreviewAudioV4180');
const videoInput=$('#composerVideoV4180');
const audioInput=$('#composerAudioV4180');
const extraVideoInput=$('#producerAddVideoClipsV4240');
if(!hub)return;

const state={
 keyframes:[],
 selectedKeyframe:null,
 curve:'ease',
 directorRegions:[],
 multicamCuts:[],
 gpuCache:true,
 projectVersion:'4.32.0'
};
const now=()=>window.SOSVideoClipsV4240?.globalTime?.()??Number(video?.currentTime||0);
const duration=()=>window.SOSVideoClipsV4240?.totalDuration?.()||Number(video?.duration||60)||60;
const fmt=n=>{n=Math.max(0,Number(n)||0);const m=Math.floor(n/60),s=n%60;return `${String(m).padStart(2,'0')}:${s.toFixed(2).padStart(5,'0')}`};
const toast=(message,title='Producer Hub')=>window.SOS?.toast?.(message,{title,icon:'✓'});

function easing(name,t){
 t=Math.max(0,Math.min(1,t));
 if(name==='linear')return t;
 if(name==='ease-in')return t*t*t;
 if(name==='ease-out')return 1-Math.pow(1-t,3);
 if(name==='ease')return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
 if(name==='cubic')return t*t*(3-2*t);
 if(name==='bounce'){
  const n1=7.5625,d1=2.75;
  if(t<1/d1)return n1*t*t;
  if(t<2/d1){t-=1.5/d1;return n1*t*t+.75}
  if(t<2.5/d1){t-=2.25/d1;return n1*t*t+.9375}
  t-=2.625/d1;return n1*t*t+.984375;
 }
 if(name==='elastic'){
  if(t===0||t===1)return t;
  return Math.pow(2,-10*t)*Math.sin((t*10-.75)*(2*Math.PI/3))+1;
 }
 return t;
}
function evaluate(property,time,fallback){
 const rows=state.keyframes.filter(k=>k.property===property).sort((a,b)=>a.time-b.time);
 if(!rows.length)return fallback;
 if(time<=rows[0].time)return rows[0].value;
 if(time>=rows.at(-1).time)return rows.at(-1).value;
 const right=rows.find(row=>row.time>=time),index=rows.indexOf(right),left=rows[index-1];
 const p=(time-left.time)/Math.max(.001,right.time-left.time);
 return left.value+(right.value-left.value)*easing(right.curve||left.curve||'ease',p);
}
function directorState(time){
 const region=state.directorRegions.find(r=>time>=r.start&&time<=r.end);
 if(!region)return null;
 return {...region,progress:(time-region.start)/Math.max(.01,region.end-region.start)};
}

/* Inspector / Pro Suite tabs */
$$('[data-pro-suite-tab]').forEach(button=>button.addEventListener('click',()=>{
 $$('[data-pro-suite-tab]').forEach(b=>b.classList.toggle('isActive',b===button));
 $$('[data-pro-suite-panel]').forEach(panel=>panel.classList.toggle('isActive',panel.dataset.proSuitePanel===button.dataset.proSuiteTab));
}));
const proTabButton=$('[data-inspector-tab="pro"]');
proTabButton?.addEventListener('click',()=>{
 $$('[data-inspector-tab]').forEach(b=>b.classList.toggle('isActive',b===proTabButton));
 $$('[data-inspector-panel]').forEach(p=>p.classList.toggle('isActive',p.dataset.inspectorPanel==='pro'));
});

/* AI Camera Director */
function classifyMarkers(){
 return $$('[data-marker-time]').map((el,index)=>({
  time:Number(el.dataset.markerTime)||0,
  type:el.dataset.beatType||(el.classList.contains('isDrop')?'DROP':index%4===0?'KICK':index%4===2?'SNARE':'HAT'),
  drop:el.classList.contains('isDrop')
 })).filter(row=>Number.isFinite(row.time));
}
function renderDirectorLane(){
 const lane=$('#timelineCameraLaneV4310');if(!lane)return;
 const total=duration();
 const auto=window.SOSAutoCameraV4250?.regions?.()||[];
 const all=[...auto,...state.directorRegions];
 lane.innerHTML=all.map((r,index)=>`<article class="cameraRegionV4310 ${r.drop?'isDrop':''} ${r.director?'isDirectorV4320':''}" style="left:${r.start/total*100}%;width:${Math.max(.2,(r.end-r.start)/total*100)}%" title="${r.motion}"><strong>${String(r.motion).replace('director-','').replace('auto-','').replaceAll('-',' ')}</strong></article>`).join('');
}
$('#generateCameraDirectorV4320')?.addEventListener('click',()=>{
 const markers=classifyMarkers();
 if(!markers.length){$('#aiDirectorStatusV4320').textContent='Analyze Beats before generating camera direction.';return}
 const style=$('#aiDirectorStyleV4320')?.value||'balanced',intensity=Number($('#aiDirectorIntensityV4320')?.value||1);
 const banks={
  balanced:['director-push','director-pan-left','director-impact','director-pan-right','director-pull'],
  cinematic:['director-push','director-drift','director-pan-right','director-pull'],
  aggressive:['director-impact','director-shake','director-spin','director-push','director-impact'],
  minimal:['director-drift','director-push','director-pull'],
  chaos:['director-shake','director-spin','director-impact','director-pan-left','director-pan-right']
 };
 state.directorRegions=[];
 markers.forEach((beat,index)=>{
  if(index%4!==0&&!beat.drop)return;
  const next=markers[index+1]?.time??Math.min(duration(),beat.time+.7);
  state.directorRegions.push({
   start:beat.time,end:Math.min(duration(),beat.time+Math.max(.15,Math.min(1.4,next-beat.time))),
   motion:banks[style][index%banks[style].length],strength:beat.drop?intensity*1.35:intensity,
   drop:beat.drop,director:true
  });
 });
 if($('#aiDirectorUseKeyframesV4320')?.checked){
  state.directorRegions.forEach((r,index)=>{
   const scale=r.drop?1.14:r.motion.includes('push')?1.09:r.motion.includes('pull')?.96:1.02;
   state.keyframes.push({id:crypto.randomUUID(),property:'cameraScale',time:r.start,value:1,curve:'ease'});
   state.keyframes.push({id:crypto.randomUUID(),property:'cameraScale',time:r.end,value:scale,curve:r.drop?'bounce':'ease'});
   if(r.motion.includes('pan'))state.keyframes.push({id:crypto.randomUUID(),property:'cameraX',time:r.end,value:r.motion.includes('left')?-24:24,curve:'ease'});
  });
  renderKeyframes();
 }
 if($('#aiDirectorUseCutsV4320')?.checked){
  const clips=window.SOSVideoClipsV4240?.clipsRef?.()||[];
  if(clips.length>1){
   state.multicamCuts=markers.filter((b,i)=>b.drop||i%8===0).map((b,i)=>({time:b.time,angle:i%clips.length,auto:true}));
  }
 }
 renderDirectorLane();renderMulticam();
 $('#aiDirectorStatusV4320').textContent=`Generated ${state.directorRegions.length} camera regions, ${state.keyframes.length} keyframes, and ${state.multicamCuts.length} multicamera switches.`;
 toast('AI Camera Director created a full pass.','AI Camera Director');
});
$('#clearCameraDirectorV4320')?.addEventListener('click',()=>{
 state.directorRegions=[];state.multicamCuts=state.multicamCuts.filter(c=>!c.auto);renderDirectorLane();renderMulticam();
 $('#aiDirectorStatusV4320').textContent='Director pass cleared.';
});

/* Keyframes */
function renderKeyframes(){
 const host=$('#keyframeListV4320');if(!host)return;
 if(!state.keyframes.length){host.innerHTML='<p>No keyframes yet.</p>';return}
 host.innerHTML=state.keyframes.sort((a,b)=>a.time-b.time).map(k=>`<button type="button" class="keyframeRowV4320 ${state.selectedKeyframe===k.id?'isSelected':''}" data-keyframe-id="${k.id}"><span><strong>${k.property}</strong><small>${fmt(k.time)} · ${k.curve}</small></span><b>${Number(k.value).toFixed(2)}</b></button>`).join('');
 host.querySelectorAll('[data-keyframe-id]').forEach(button=>button.addEventListener('click',()=>{
  state.selectedKeyframe=button.dataset.keyframeId;const k=state.keyframes.find(x=>x.id===state.selectedKeyframe);
  if(k){$('#keyframePropertyV4320').value=k.property;$('#keyframeValueV4320').value=k.value;$('#curvePresetV4320').value=k.curve||'ease'}
  renderKeyframes();drawCurve();
 }));
}
$('#addKeyframeV4320')?.addEventListener('click',()=>{
 const property=$('#keyframePropertyV4320').value,value=Number($('#keyframeValueV4320').value||0),time=now();
 const existing=state.keyframes.find(k=>k.property===property&&Math.abs(k.time-time)<.02);
 if(existing){existing.value=value;existing.curve=$('#curvePresetV4320')?.value||'ease';state.selectedKeyframe=existing.id}
 else{const row={id:crypto.randomUUID(),property,value,time,curve:$('#curvePresetV4320')?.value||'ease'};state.keyframes.push(row);state.selectedKeyframe=row.id}
 renderKeyframes();drawCurve();toast(`Keyframe added at ${fmt(time)}.`,'Keyframes');
});
$('#deleteSelectedKeyframeV4320')?.addEventListener('click',()=>{
 state.keyframes=state.keyframes.filter(k=>k.id!==state.selectedKeyframe);state.selectedKeyframe=null;renderKeyframes();drawCurve();
});
function drawCurve(){
 const canvas=$('#curveEditorCanvasV4320');if(!canvas)return;
 const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,preset=$('#curvePresetV4320')?.value||'ease';
 ctx.clearRect(0,0,w,h);ctx.fillStyle='#08060b';ctx.fillRect(0,0,w,h);
 ctx.strokeStyle='rgba(255,255,255,.08)';ctx.lineWidth=1;
 for(let i=1;i<5;i++){ctx.beginPath();ctx.moveTo(i*w/5,0);ctx.lineTo(i*w/5,h);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*h/5);ctx.lineTo(w,i*h/5);ctx.stroke()}
 ctx.strokeStyle='#a864dd';ctx.lineWidth=4;ctx.beginPath();
 for(let x=0;x<=w;x++){const t=x/w,y=h-easing(preset,t)*h;x?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();
}
$('#curvePresetV4320')?.addEventListener('change',drawCurve);
$('#applyCurveV4320')?.addEventListener('click',()=>{
 const curve=$('#curvePresetV4320').value;
 if(state.selectedKeyframe){const k=state.keyframes.find(x=>x.id===state.selectedKeyframe);if(k)k.curve=curve}
 else state.keyframes.forEach(k=>k.curve=curve);
 state.curve=curve;renderKeyframes();drawCurve();
});

/* Audio ducking */
function duckGain(levels){
 if(!$('#audioDuckingEnabledV4320')?.checked)return 1;
 const threshold=Number($('#audioDuckingThresholdV4320')?.value||.3);
 const amount=Number($('#audioDuckingAmountV4320')?.value||.55);
 const source=$('#audioDuckingSourceV4320')?.value||'video';
 const signal=source==='music'?levels.bass:Math.max(levels.mid,levels.peak*.7);
 const target=signal>threshold?1-amount:1;
 const current=Number($('#audioDuckingStatusV4320')?.dataset.gain||1);
 const rate=target<current?Number($('#audioDuckingAttackV4320')?.value||.12):Number($('#audioDuckingReleaseV4320')?.value||.5);
 const next=current+(target-current)*Math.min(1,.12/Math.max(.02,rate));
 $('#audioDuckingStatusV4320').dataset.gain=String(next);
 $('#audioDuckingStatusV4320').textContent=`Music gain ${Math.round(next*100)}% · ${signal>threshold?'ducking active':'normal'}`;
 return next;
}

/* Multicamera */
function renderMulticam(){
 const host=$('#multiCamViewerV4320');if(!host)return;
 const clips=window.SOSVideoClipsV4240?.clipsRef?.()||[];
 if(!clips.length){host.innerHTML='<p>Add multiple videos to create camera angles.</p>';return}
 host.innerHTML=clips.slice(0,8).map((clip,index)=>`<button type="button" class="multiCamTileV4320" data-multicam-tile="${index}" style="background-image:linear-gradient(rgba(0,0,0,.15),rgba(0,0,0,.65)),url('${clip.thumbnail||''}')"><strong>Camera ${index+1}</strong><small>${clip.name}</small></button>`).join('');
 host.querySelectorAll('[data-multicam-tile]').forEach(button=>button.addEventListener('click',()=>switchCamera(Number(button.dataset.multicamTile))));
}
async function switchCamera(angle){
 const clips=window.SOSVideoClipsV4240?.clipsRef?.()||[];if(!clips[angle])return;
 const time=now();
 window.SOSVideoClipsV4240?.selectClip?.(angle);
 await window.SOSVideoClipsV4240?.seekGlobal?.(time);
 if($('#multiCamRecordCutsV4320')?.checked){
  state.multicamCuts.push({time,angle,auto:false});state.multicamCuts.sort((a,b)=>a.time-b.time);
 }
 renderMulticam();toast(`Camera ${angle+1} selected at ${fmt(time)}.`,'Multicam');
}
$$('[data-multicam-angle]').forEach(button=>button.addEventListener('click',()=>switchCamera(Number(button.dataset.multicamAngle))));
$('#clearMultiCamCutsV4320')?.addEventListener('click',()=>{state.multicamCuts=[];renderMulticam()});

/* GPU timeline cache */
function updateGpu(){
 const button=$('#gpuTimelineToggleV4320'),status=$('#gpuTimelineStatusV4320');
 state.gpuCache=button?.classList.contains('isActive')??true;
 document.body.classList.toggle('gpuTimelineEnabledV4320',state.gpuCache);
 const supported='OffscreenCanvas' in window&&CSS.supports('contain','paint');
 status.textContent=state.gpuCache?(supported?'GPU cache ready':'optimized DOM cache'):'cache disabled';
}
$('#gpuTimelineToggleV4320')?.addEventListener('click',event=>{
 event.currentTarget.classList.toggle('isActive');
 event.currentTarget.setAttribute('aria-pressed',String(event.currentTarget.classList.contains('isActive')));
 updateGpu();
});
$('#gpuTimelineToggleV4320')?.setAttribute('aria-pressed',String($('#gpuTimelineToggleV4320')?.classList.contains('isActive')));
updateGpu();

/* Save / import */
function serializeControls(){
 const result={};
 $$('input[id],select[id],textarea[id]',hub).forEach(el=>{
  if(el.type==='file'||el.type==='button'||el.type==='submit')return;
  result[el.id]=el.type==='checkbox'?el.checked:el.value;
 });
 return result;
}
function applyControls(values={}){
 Object.entries(values).forEach(([id,value])=>{
  const el=document.getElementById(id);if(!el||el.type==='file')return;
  if(el.type==='checkbox')el.checked=Boolean(value);else el.value=value;
  el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));
 });
}
const fileToDataURL=file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)});
async function dataURLToFile(data,name,type){const blob=await fetch(data).then(r=>r.blob());return new File([blob],name,{type:type||blob.type})}
function downloadObject(object,name){
 const blob=new Blob([JSON.stringify(object,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function buildProject(embed){
 const clips=window.SOSVideoClipsV4240?.clipsRef?.()||[];
 const project={
  kind:'seeker-of-soundz-project',version:state.projectVersion,name:$('#projectNameV4320')?.value||'Project',
  savedAt:new Date().toISOString(),controls:serializeControls(),
  pro:{keyframes:state.keyframes,directorRegions:state.directorRegions,multicamCuts:state.multicamCuts,curve:state.curve,gpuCache:state.gpuCache},
  clips:clips.map(c=>({name:c.name,type:c.file?.type||'video/*',sourceStart:c.sourceStart,sourceEnd:c.sourceEnd,muted:c.muted,transitionAfter:c.transitionAfter,transitionDuration:c.transitionDuration})),
  media:{embedded:embed,video:[],audio:null}
 };
 if(embed){
  const unique=new Map();
  clips.forEach(c=>{if(c.file&&!unique.has(c.file.name+'|'+c.file.size))unique.set(c.file.name+'|'+c.file.size,c.file)});
  let total=[...unique.values()].reduce((sum,f)=>sum+f.size,0)+(audioInput?.files?.[0]?.size||0);
  if(total>450*1024*1024&&!confirm(`This portable project will embed about ${Math.round(total/1024/1024)} MB. Continue?`))throw new Error('Portable save canceled.');
  for(const file of unique.values())project.media.video.push({name:file.name,type:file.type,data:await fileToDataURL(file)});
  if(audioInput?.files?.[0])project.media.audio={name:audioInput.files[0].name,type:audioInput.files[0].type,data:await fileToDataURL(audioInput.files[0])};
 }
 return project;
}
$('#saveProjectV4320')?.addEventListener('click',async()=>{
 const status=$('#projectStatusV4320');try{
  status.textContent='Building project file…';
  const project=await buildProject($('#embedProjectMediaV4320')?.checked);
  downloadObject(project,`${project.name.replace(/[^\w-]+/g,'-')||'project'}.sosproject`);
  status.textContent=project.media.embedded?'Portable project downloaded with embedded media.':'Project downloaded. Re-link original media after import.';
 }catch(error){status.textContent=error.message}
});
$('#savePresetV4320')?.addEventListener('click',()=>{
 downloadObject({kind:'seeker-of-soundz-preset',version:state.projectVersion,controls:serializeControls(),pro:{keyframes:state.keyframes,directorRegions:state.directorRegions,curve:state.curve}},'seeker-of-soundz-settings.sospreset');
});
async function importObject(file,isProject){
 const data=JSON.parse(await file.text());
 if(!data.kind?.startsWith('seeker-of-soundz'))throw new Error('This is not a Seeker Of SoundZ project or preset.');
 applyControls(data.controls);
 if(data.pro){state.keyframes=data.pro.keyframes||[];state.directorRegions=data.pro.directorRegions||[];state.multicamCuts=data.pro.multicamCuts||[];state.curve=data.pro.curve||'ease';state.gpuCache=data.pro.gpuCache!==false}
 if(isProject&&data.media?.embedded){
  const files=[];
  for(const row of data.media.video||[])files.push(await dataURLToFile(row.data,row.name,row.type));
  if(files.length){
   const dt=new DataTransfer();files.forEach(f=>dt.items.add(f));
   videoInput.files=new DataTransfer().files;
   const primary=new DataTransfer();primary.items.add(files[0]);videoInput.files=primary.files;videoInput.dispatchEvent(new Event('change',{bubbles:true}));
   if(files.length>1&&extraVideoInput){const extras=new DataTransfer();files.slice(1).forEach(f=>extras.items.add(f));extraVideoInput.files=extras.files;extraVideoInput.dispatchEvent(new Event('change',{bubbles:true}))}
  }
  if(data.media.audio){const f=await dataURLToFile(data.media.audio.data,data.media.audio.name,data.media.audio.type),dt=new DataTransfer();dt.items.add(f);audioInput.files=dt.files;audioInput.dispatchEvent(new Event('change',{bubbles:true}))}
 }
 renderKeyframes();drawCurve();renderDirectorLane();renderMulticam();updateGpu();
 $('#projectStatusV4320').textContent=data.media?.embedded?'Portable project imported with media.':'Settings imported. Re-link the original video and music files.';
}
$('#importProjectV4320')?.addEventListener('change',async event=>{try{await importObject(event.target.files[0],true)}catch(error){$('#projectStatusV4320').textContent=error.message}event.target.value=''});
$('#importPresetV4320')?.addEventListener('change',async event=>{try{await importObject(event.target.files[0],false)}catch(error){$('#projectStatusV4320').textContent=error.message}event.target.value=''});

/* Public integration */
window.SOSProSuiteV4320={
 evaluate,directorState,duckGain,
 multicamAngleAt(time){
  const cuts=state.multicamCuts.filter(c=>c.time<=time).sort((a,b)=>a.time-b.time);
  return cuts.length?cuts.at(-1).angle:null;
 },
 state:()=>JSON.parse(JSON.stringify(state)),
 importState(next){Object.assign(state,next||{});renderKeyframes();drawCurve();renderDirectorLane();renderMulticam()}
};
['sos:beat-analysis-complete','sos:video-split','sos:clip-trimmed','sos:video-segment-deleted'].forEach(name=>window.addEventListener(name,()=>setTimeout(()=>{renderMulticam();renderDirectorLane()},80)));
renderKeyframes();drawCurve();renderMulticam();renderDirectorLane();
})();
