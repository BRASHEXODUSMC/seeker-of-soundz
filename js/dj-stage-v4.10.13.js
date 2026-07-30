(()=>{
'use strict';
const stage=document.getElementById('liveFrequencyStage');
const canvas=document.getElementById('djVisualizerCanvas');
if(!stage||!canvas)return;
const ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);
const controls={
 mode:$('djWaveformMode'),lights:$('djLightsToggle'),spots:$('djSpotsToggle'),strobe:$('djStrobeToggle'),lasers:$('djLasersToggle'),crowd:$('djCrowdToggle'),focus:$('djFocusToggle'),play:$('djPlayToggle'),volume:$('djMasterVolume'),visual:$('djVisualIntensity'),color:$('djColorPreset'),lightPreset:$('djLightPreset'),laserPreset:$('djLaserPreset'),laserSpeed:$('djLaserSpeed'),laserBrightness:$('djLaserBrightness'),center:$('djCenterStage'),reset:$('djResetShow'),playbackMode:$('djPlaybackMode'),previous:$('djPreviousTrack'),next:$('djNextTrack'),queueToggle:$('djQueueToggle'),queue:$('djTrackQueue'),queueCount:$('djQueueCount')
};
const titleEl=$('djTrackTitle'),metaEl=$('djTrackMeta'),stateEl=$('djStageState');
const sampleAudio=$('djDemoAudio'),samplePlay=$('djDemoPlay'),stopShow=$('djStopShow'),demoTrack=$('djDemoTrack');
let activeAudio=null,audioContext=null,analyser=null,dataArray=null,frequencyArray=null,raf=0,last=0,queue=[],queueRenderSignature='';
const sources=new WeakMap();
const backdrop=document.createElement('div');backdrop.className='djFocusBackdrop';backdrop.setAttribute('aria-hidden','true');document.body.appendChild(backdrop);
const portal=document.createElement('div');portal.className='djShowPortal';portal.hidden=true;portal.setAttribute('aria-label','Live Frequency concert focus');document.body.appendChild(portal);
let stagePlaceholder=null,stageHomeParent=stage.parentNode,stageHomeNext=stage.nextSibling;
const defaults={mode:'line',color:'violet',lightPreset:'arena',laserPreset:'festival',visual:'1',laserSpeed:'1',laserBrightness:'.8',lights:true,spots:true,strobe:true,lasers:true,crowd:true,focus:true,playbackMode:'stop'};
let settings={...defaults};
try{settings={...settings,...JSON.parse(localStorage.getItem('sosDjShowSettings')||'{}')}}catch{}
function save(){try{localStorage.setItem('sosDjShowSettings',JSON.stringify(settings))}catch{}}
function resize(){const d=Math.min(devicePixelRatio||1,1.5),r=canvas.getBoundingClientRect();canvas.width=Math.max(1,Math.floor(r.width*d));canvas.height=Math.max(1,Math.floor(r.height*d));ctx.setTransform(d,0,0,d,0,0)}
function nameFor(audio){const card=audio.closest('article,.musicCommerceCard');return audio.dataset.title||card?.querySelector('h3')?.textContent?.trim()||'Website Audio'}
function metaFor(audio){const card=audio.closest('article,.musicCommerceCard');return audio.dataset.meta||card?.querySelector('.sectionEyebrow,.trackStatus')?.textContent?.trim()||'Seeker Of SoundZ'}
function connect(audio){
 if(!audio)return;
 try{
  audioContext=audioContext||new (window.AudioContext||window.webkitAudioContext)();
  analyser=analyser||audioContext.createAnalyser();analyser.fftSize=512;analyser.smoothingTimeConstant=.82;
  if(!sources.has(audio)){const source=audioContext.createMediaElementSource(audio);source.connect(analyser);sources.set(audio,source)}
  try{analyser.disconnect()}catch{} analyser.connect(audioContext.destination);
  dataArray=new Uint8Array(analyser.fftSize);frequencyArray=new Uint8Array(analyser.frequencyBinCount);
 }catch(err){console.warn('DJ visualizer using animated fallback.',err)}
}
function setActive(audio){if(!audio)return;if(activeAudio&&activeAudio!==audio)activeAudio.closest('article,.musicCommerceCard')?.classList.remove('is-dj-active');activeAudio=audio;connect(audio);audio.closest('article,.musicCommerceCard')?.classList.add('is-dj-active');titleEl.textContent=nameFor(audio);metaEl.textContent=metaFor(audio);controls.volume.value=String(audio.volume??1);syncLoopState();renderQueue()}
function energy(){if(!analyser||!frequencyArray)return .25+.14*Math.sin(performance.now()/260);analyser.getByteFrequencyData(frequencyArray);let sum=0,count=0;for(let i=2;i<Math.min(64,frequencyArray.length);i++){sum+=frequencyArray[i];count++}return Math.max(.04,sum/(Math.max(1,count)*255))}
function palette(){const map={violet:['#8f55ff','#eadcff'],ultraviolet:['#732cff','#ff4af0'],cyan:['#00dcff','#d9fcff'],magenta:['#ff2bbd','#ffd8f5'],white:['#f8fbff','#a7bfff'],redblue:['#ff304f','#287cff'],rainbow:['#ff35ba','#2de5ff']};return map[settings.color]||map.violet}
function getFreq(i,count,t){if(analyser&&frequencyArray){return frequencyArray[Math.min(frequencyArray.length-1,Math.floor(i/count*frequencyArray.length))]/255}return .18+.72*Math.abs(Math.sin(t*.0017+i*.31))*Math.abs(Math.cos(t*.0007+i*.13))}
function draw(t){
 const r=canvas.getBoundingClientRect(),w=r.width,h=r.height,e=energy(),intensity=Number(settings.visual||1),mode=settings.mode,[c1,c2]=palette();
 ctx.clearRect(0,0,w,h);const grad=ctx.createLinearGradient(0,0,w,0);grad.addColorStop(0,c1+'22');grad.addColorStop(.5,c2);grad.addColorStop(1,c1+'22');ctx.strokeStyle=grad;ctx.fillStyle=grad;ctx.lineWidth=1.8+intensity*.7;ctx.shadowBlur=10*intensity;ctx.shadowColor=c1;
 if(analyser&&dataArray)analyser.getByteTimeDomainData(dataArray);if(analyser&&frequencyArray)analyser.getByteFrequencyData(frequencyArray);
 if(mode==='bars'||mode==='spectrum'){
  const count=mode==='bars'?54:92,gap=3,bw=Math.max(1,(w-gap*(count-1))/count);for(let i=0;i<count;i++){const v=getFreq(i,count,t),bh=Math.max(3,v*h*(mode==='bars'?.65:.82)*intensity),x=i*(bw+gap);ctx.globalAlpha=.3+v*.7;ctx.fillRect(x,(h-bh)/2,bw,bh)}ctx.globalAlpha=1;
 }else if(mode==='mirror'){
  ctx.beginPath();const count=dataArray?.length||180;for(let i=0;i<count;i++){const x=i/(count-1)*w,v=dataArray?(dataArray[i]-128)/128:Math.sin(i*.17+t*.005)*.45,y=h/2-v*h*.22*intensity;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();ctx.save();ctx.translate(0,h);ctx.scale(1,-1);ctx.globalAlpha=.45;ctx.stroke();ctx.restore();ctx.globalAlpha=1;
 }else if(mode==='radial'||mode==='rings'){
  const cx=w/2,cy=h/2,base=Math.min(w,h)*(mode==='rings'?.13:.18),count=112;ctx.beginPath();for(let i=0;i<count;i++){const a=i/count*Math.PI*2-Math.PI/2,v=getFreq(i,count,t),rr=base+v*82*intensity,x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.stroke();if(mode==='rings'){for(let j=0;j<5;j++){ctx.globalAlpha=.1+(j*.05);ctx.beginPath();ctx.arc(cx,cy,base+24*j+e*18,0,Math.PI*2);ctx.stroke()}ctx.globalAlpha=1}
 }else if(mode==='tunnel'){
  for(let ring=0;ring<11;ring++){const p=(t*.00014+ring/11)%1,rw=w*(.035+p*.68),rh=h*(.025+p*.5);ctx.globalAlpha=(1-p)*.62;ctx.strokeRect(w/2-rw/2,h/2-rh/2,rw,rh)}ctx.globalAlpha=1;
 }else if(mode==='mountains'){
  for(let layer=0;layer<3;layer++){ctx.beginPath();for(let i=0;i<96;i++){const x=i/95*w,v=getFreq(i,96,t+layer*500),y=h*(.72-layer*.12)-v*h*.26*intensity;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.globalAlpha=.12+layer*.1;ctx.fill()}ctx.globalAlpha=1;
 }else if(mode==='particles'){
  for(let i=0;i<90;i++){const v=getFreq(i,90,t),a=i/90*Math.PI*2+t*.00008*(i%3+1),rad=35+(i%18)*7+v*85*intensity,x=w/2+Math.cos(a)*rad,y=h/2+Math.sin(a)*rad*.62;ctx.globalAlpha=.25+v*.75;ctx.beginPath();ctx.arc(x,y,1+v*2.5,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
 }else if(mode==='oscilloscope'){
  ctx.beginPath();const count=dataArray?.length||220;for(let i=0;i<count;i++){const phase=i/(count-1)*Math.PI*2,v=dataArray?(dataArray[i]-128)/128:Math.sin(i*.22+t*.007)*.55,x=w/2+Math.sin(phase*2+t*.0005)*w*.35*(.6+e),y=h/2+v*h*.32*intensity;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();
 }else{
  ctx.beginPath();const count=dataArray?.length||200;for(let i=0;i<count;i++){const x=i/(count-1)*w,v=dataArray?(dataArray[i]-128)/128:Math.sin(i*.18+t*.006)*.45,y=h/2+v*h*.29*(.75+e)*intensity;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();ctx.globalAlpha=.2;ctx.beginPath();ctx.moveTo(0,h/2);ctx.lineTo(w,h/2);ctx.stroke();ctx.globalAlpha=1;
 }
 ctx.shadowBlur=0;
}
function frame(t){raf=requestAnimationFrame(frame);if(document.hidden||t-last<33)return;last=t;draw(t)}
function isPerformance(){return document.documentElement.classList.contains('performance-mode')}
function enterFocus(){
 if(portal.contains(stage))return;
 stageHomeParent=stage.parentNode;stageHomeNext=stage.nextSibling;
 stagePlaceholder=document.createElement('div');stagePlaceholder.className='djStagePlaceholder';stagePlaceholder.setAttribute('aria-hidden','true');
 stageHomeParent.insertBefore(stagePlaceholder,stage);
 portal.hidden=false;portal.appendChild(stage);document.body.classList.add('dj-show-live');
 requestAnimationFrame(()=>{resize();stage.focus?.({preventScroll:true})});
}
function exitFocus(){
 document.body.classList.remove('dj-show-live');portal.hidden=true;
 if(portal.contains(stage)){
  if(stagePlaceholder?.parentNode){stagePlaceholder.parentNode.insertBefore(stage,stagePlaceholder);stagePlaceholder.remove()}
  else if(stageHomeParent){stageHomeParent.insertBefore(stage,stageHomeNext)}
 }
 stagePlaceholder=null;resize();
}
function availableTracks(){
 return Array.from(document.querySelectorAll('audio[src]:not([src=""])')).filter(audio=>audio.src&&!audio.dataset.excludeDjQueue);
}
function queueIndex(audio=activeAudio){return queue.indexOf(audio)}
function syncLoopState(){
 document.querySelectorAll('audio').forEach(audio=>audio.loop=false);
 if(activeAudio)activeAudio.loop=settings.playbackMode==='loop';
}
function renderQueue(){
 const previousActive=activeAudio;
 queue=availableTracks();
 if(controls.queueCount)controls.queueCount.textContent=`${queue.length} track${queue.length===1?'':'s'}`;
 if(!controls.queue)return;
 const signature=queue.map((audio,index)=>`${index}:${audio.currentSrc||audio.src}:${audio===previousActive?'active':''}:${audio.paused?'paused':'playing'}`).join('|');
 if(signature===queueRenderSignature)return;
 queueRenderSignature=signature;
 controls.queue.innerHTML='';
 if(!queue.length){controls.queue.innerHTML='<p class="djQueueEmpty">No playable website audio has been added yet.</p>';return}
 queue.forEach((audio,index)=>{
  const button=document.createElement('button');button.type='button';button.className='djQueueItem';
  if(audio===previousActive)button.classList.add('is-current');
  button.dataset.queueIndex=String(index);
  button.innerHTML=`<span class="djQueueNumber">${String(index+1).padStart(2,'0')}</span><span class="djQueueText"><strong>${nameFor(audio)}</strong><small>${metaFor(audio)}</small></span><span class="djQueuePlay">${audio===previousActive&&!audio.paused?'Pause':'Play'}</span>`;
  button.addEventListener('click',()=>{if(activeAudio===audio&&!audio.paused){audio.pause();return}setActive(audio);syncLoopState();audio.play().catch(()=>window.SOS?.toast?.('The browser blocked this track. Click it again to play.',{title:'Audio permission'}));});
  controls.queue.appendChild(button);
 });
}
function playQueueIndex(index,{wrap=true}={}){
 if(!queue.length)renderQueue();if(!queue.length)return;
 let target=index;if(wrap)target=(target+queue.length)%queue.length;
 if(target<0||target>=queue.length){stopConcert();return}
 const audio=queue[target];setActive(audio);syncLoopState();audio.currentTime=0;audio.play().catch(()=>{});
}
function moveQueue(direction){
 renderQueue();const current=queueIndex();playQueueIndex((current<0?0:current)+direction);
}
function handleEnded(audio){
 if(settings.playbackMode==='loop')return;
 if(settings.playbackMode==='queue'){
  renderQueue();const index=queue.indexOf(audio);if(index>=0&&index<queue.length-1){playQueueIndex(index+1,{wrap:false});return}
 }
 updateState();
}
function stopConcert(){
 if(activeAudio){activeAudio.pause();try{activeAudio.currentTime=0}catch{}}
 updateState();exitFocus();
}
function updateState(){
 const playing=!!activeAudio&&!activeAudio.paused&&!activeAudio.ended;
 stage.classList.toggle('is-playing',playing);controls.play.textContent=playing?'Pause':'Play';controls.play.setAttribute('aria-pressed',String(playing));stateEl.textContent=playing?'EDM concert visualization live':'Waiting for website audio';document.documentElement.classList.toggle('dj-audio-live',playing);
 demoTrack?.classList.toggle('is-active',playing&&activeAudio===sampleAudio);
 if(samplePlay)samplePlay.textContent=playing&&activeAudio===sampleAudio?'Pause demo track':'Play demo track';
 const focus=playing&&settings.focus&&!isPerformance();
 if(focus)enterFocus();else exitFocus();
}
function apply(){
 stage.dataset.colorPreset=settings.color;stage.dataset.lightPreset=settings.lightPreset;stage.dataset.laserPreset=settings.laserPreset;stage.style.setProperty('--dj-intensity',settings.visual);stage.style.setProperty('--dj-laser-speed',settings.laserSpeed);stage.style.setProperty('--dj-laser-alpha',settings.laserBrightness);
 [['lights','lights-on','Stage lights'],['spots','spots-on','Spotlights'],['strobe','strobe-on','Strobe pulse'],['lasers','lasers-on','Lasers'],['crowd','crowd-on','Crowd glow'],['focus','focus-on','Blackout focus']].forEach(([key,cls,label])=>{stage.classList.toggle(cls,!!settings[key]);const btn=controls[key];if(btn){btn.setAttribute('aria-pressed',String(!!settings[key]));btn.textContent=`${label} ${settings[key]?'on':'off'}`}});
 controls.mode.value=settings.mode;controls.color.value=settings.color;controls.lightPreset.value=settings.lightPreset;controls.laserPreset.value=settings.laserPreset;controls.visual.value=settings.visual;controls.laserSpeed.value=settings.laserSpeed;controls.laserBrightness.value=settings.laserBrightness;if(controls.playbackMode)controls.playbackMode.value=settings.playbackMode;syncLoopState();renderQueue();updateState();
}
function registerAudio(audio){if(audio.dataset.djRegistered)return;audio.dataset.djRegistered='1';audio.addEventListener('play',()=>{document.querySelectorAll('audio').forEach(a=>{if(a!==audio&&!a.paused)a.pause()});setActive(audio);syncLoopState();audioContext?.resume?.();updateState();renderQueue();if(!settings.focus)stage.scrollIntoView({behavior:'smooth',block:'center'})});audio.addEventListener('pause',()=>{updateState();renderQueue()});audio.addEventListener('ended',()=>{handleEnded(audio);renderQueue()});audio.addEventListener('emptied',()=>{updateState();renderQueue()})}
function scan(){document.querySelectorAll('audio').forEach(registerAudio);renderQueue()}
new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});scan();
controls.play.addEventListener('click',()=>{if(!activeAudio){const first=document.querySelector('audio[src]:not([src=""])');if(!first){window.SOS?.toast?.('Play an uploaded preview first, or add an audio path in Admin → Music Manager.',{title:'No audio selected'});return}setActive(first)}activeAudio.paused?activeAudio.play().catch(()=>{}):activeAudio.pause()});
controls.volume.addEventListener('input',()=>{if(activeAudio)activeAudio.volume=Number(controls.volume.value)});
samplePlay?.addEventListener('click',()=>{setActive(sampleAudio);audioContext?.resume?.();sampleAudio.paused?sampleAudio.play().catch(()=>window.SOS?.toast?.('The browser blocked audio. Click Play demo track again.',{title:'Audio permission'})):sampleAudio.pause()});
stopShow?.addEventListener('click',stopConcert);
controls.playbackMode?.addEventListener('change',()=>{settings.playbackMode=controls.playbackMode.value;save();syncLoopState();renderQueue();window.SOS?.toast?.(settings.playbackMode==='loop'?'Current track will repeat.':settings.playbackMode==='queue'?'Website tracks will play in order.':'Playback will stop after the current track.',{title:'Playback mode'});});
controls.previous?.addEventListener('click',()=>moveQueue(-1));
controls.next?.addEventListener('click',()=>moveQueue(1));
controls.queueToggle?.addEventListener('click',()=>{const open=controls.queueToggle.getAttribute('aria-expanded')==='true';controls.queueToggle.setAttribute('aria-expanded',String(!open));controls.queueToggle.textContent=open?'Open track list':'Close track list';controls.queue.hidden=open;if(!open)renderQueue();});

[['lights','lights'],['spots','spots'],['strobe','strobe'],['lasers','lasers'],['crowd','crowd'],['focus','focus']].forEach(([id,key])=>controls[id]?.addEventListener('click',()=>{settings[key]=!settings[key];save();apply()}));
[['mode','mode'],['color','color'],['lightPreset','lightPreset'],['laserPreset','laserPreset'],['visual','visual'],['laserSpeed','laserSpeed'],['laserBrightness','laserBrightness']].forEach(([id,key])=>controls[id]?.addEventListener('input',()=>{settings[key]=controls[id].value;save();apply()}));
controls.center?.addEventListener('click',()=>stage.scrollIntoView({behavior:'smooth',block:'center'}));
controls.reset?.addEventListener('click',()=>{settings={...defaults};save();apply();window.SOS?.toast?.('DJ concert controls restored.',{title:'Show reset'})});
window.addEventListener('resize',resize,{passive:true});document.addEventListener('visibilitychange',updateState);window.addEventListener('beforeunload',()=>{cancelAnimationFrame(raf);exitFocus()});
const perfObserver=new MutationObserver(updateState);perfObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
resize();apply();frame(0);
document.addEventListener('click',e=>{const b=e.target.closest('.musicMainPlayButton,.releaseArtwork button,.liveMixPlay');if(!b)return;const card=b.closest('article');const audio=card?.querySelector('audio')||document.querySelector('.musicCommerceCard audio[src]:not([src=""])');if(audio){e.preventDefault();setActive(audio);audio.paused?audio.play().catch(()=>{}):audio.pause()}},true);
})();
