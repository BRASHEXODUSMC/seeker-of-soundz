(()=>{
'use strict';
const stage=document.getElementById('liveFrequencyStage');
const canvas=document.getElementById('djVisualizerCanvas');
if(!stage||!canvas)return;
const ctx=canvas.getContext('2d');
const modeSelect=document.getElementById('djWaveformMode');
const lightsButton=document.getElementById('djLightsToggle');
const playButton=document.getElementById('djPlayToggle');
const volume=document.getElementById('djMasterVolume');
const titleEl=document.getElementById('djTrackTitle');
const metaEl=document.getElementById('djTrackMeta');
const stateEl=document.getElementById('djStageState');
let activeAudio=null,audioContext=null,sourceNode=null,analyser=null,raf=0,last=0;
let dataArray=null,frequencyArray=null;
const sources=new WeakMap();
function resize(){const d=Math.min(devicePixelRatio||1,1.5),r=canvas.getBoundingClientRect();canvas.width=Math.max(1,Math.floor(r.width*d));canvas.height=Math.max(1,Math.floor(r.height*d));ctx.setTransform(d,0,0,d,0,0)}
function nameFor(audio){const card=audio.closest('article,.musicCommerceCard');return card?.querySelector('h3')?.textContent?.trim()||audio.dataset.title||'Website Audio'}
function metaFor(audio){const card=audio.closest('article,.musicCommerceCard');return card?.querySelector('.sectionEyebrow,.trackStatus')?.textContent?.trim()||'Seeker Of SoundZ'}
function connect(audio){
  if(!audio)return;
  try{
    audioContext=audioContext||new (window.AudioContext||window.webkitAudioContext)();
    analyser=analyser||audioContext.createAnalyser(); analyser.fftSize=256; analyser.smoothingTimeConstant=.84;
    if(!sources.has(audio)){const source=audioContext.createMediaElementSource(audio);source.connect(analyser);sources.set(audio,source)}
    analyser.disconnect(); analyser.connect(audioContext.destination);
    sourceNode=sources.get(audio);
    dataArray=new Uint8Array(analyser.fftSize);frequencyArray=new Uint8Array(analyser.frequencyBinCount);
  }catch(err){console.warn('DJ visualizer audio connection unavailable; using visual fallback.',err)}
}
function setActive(audio){
  if(activeAudio===audio)return;
  if(activeAudio)activeAudio.closest('article,.musicCommerceCard')?.classList.remove('is-dj-active');
  activeAudio=audio; connect(audio);
  audio.closest('article,.musicCommerceCard')?.classList.add('is-dj-active');
  titleEl.textContent=nameFor(audio);metaEl.textContent=metaFor(audio);
  volume.value=String(audio.volume??1);
}
function energy(){if(!analyser||!frequencyArray)return .28+.16*Math.sin(performance.now()/260);analyser.getByteFrequencyData(frequencyArray);let sum=0;for(let i=2;i<Math.min(42,frequencyArray.length);i++)sum+=frequencyArray[i];return Math.max(.05,sum/(40*255))}
function drawWave(w,h,t){
  const mode=modeSelect.value,e=energy();
  ctx.clearRect(0,0,w,h);
  const grad=ctx.createLinearGradient(0,0,w,0);grad.addColorStop(0,'rgba(142,86,255,.2)');grad.addColorStop(.5,'rgba(229,211,255,.95)');grad.addColorStop(1,'rgba(116,54,220,.2)');
  ctx.strokeStyle=grad;ctx.fillStyle=grad;ctx.lineWidth=1.8;
  if(mode==='bars'||mode==='spectrum'){
    const count=mode==='bars'?52:84,gap=3,bw=(w-gap*(count-1))/count;
    if(analyser&&frequencyArray)analyser.getByteFrequencyData(frequencyArray);
    for(let i=0;i<count;i++){const v=frequencyArray?frequencyArray[Math.floor(i/count*frequencyArray.length)]/255:(.2+.8*Math.abs(Math.sin(t*.0015+i*.38)));const bh=Math.max(3,v*h*(mode==='bars'?.66:.78));const x=i*(bw+gap);ctx.globalAlpha=.35+v*.65;ctx.fillRect(x,(h-bh)/2,bw,bh)}ctx.globalAlpha=1;
  }else if(mode==='radial'){
    const cx=w/2,cy=h/2,r=Math.min(w,h)*.19,count=96;if(analyser&&frequencyArray)analyser.getByteFrequencyData(frequencyArray);
    ctx.beginPath();for(let i=0;i<count;i++){const a=i/count*Math.PI*2-Math.PI/2,v=frequencyArray?frequencyArray[Math.floor(i/count*frequencyArray.length)]/255:(.3+.4*Math.sin(t*.002+i*.22));const rr=r+v*70;const x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.stroke();
    ctx.beginPath();ctx.arc(cx,cy,r*(1+e*.12),0,Math.PI*2);ctx.strokeStyle='rgba(188,137,255,.25)';ctx.stroke();
  }else if(mode==='tunnel'){
    for(let ring=0;ring<8;ring++){const p=((t*.00012+ring/8)%1),rw=w*(.06+p*.55),rh=h*(.04+p*.42);ctx.globalAlpha=(1-p)*.55;ctx.strokeRect(w/2-rw/2,h/2-rh/2,rw,rh)}ctx.globalAlpha=1;
  }else{
    if(analyser&&dataArray)analyser.getByteTimeDomainData(dataArray);ctx.beginPath();const count=dataArray?dataArray.length:160;for(let i=0;i<count;i++){const x=i/(count-1)*w;const val=dataArray?(dataArray[i]-128)/128:Math.sin(i*.18+t*.006)*.45;const y=h/2+val*h*.29*(.7+e);i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();
    ctx.strokeStyle='rgba(159,93,255,.18)';ctx.beginPath();ctx.moveTo(0,h/2);ctx.lineTo(w,h/2);ctx.stroke();
  }
}
function frame(t){raf=requestAnimationFrame(frame);if(document.hidden||t-last<33)return;last=t;const r=canvas.getBoundingClientRect();drawWave(r.width,r.height,t)}
function updateState(){const playing=!!activeAudio&&!activeAudio.paused&&!activeAudio.ended;stage.classList.toggle('is-playing',playing);playButton.textContent=playing?'Pause':'Play';playButton.setAttribute('aria-pressed',String(playing));stateEl.textContent=playing?'Live visualization active':'Waiting for website audio';document.documentElement.classList.toggle('dj-audio-live',playing)}
function registerAudio(audio){if(audio.dataset.djRegistered)return;audio.dataset.djRegistered='1';audio.addEventListener('play',()=>{document.querySelectorAll('audio').forEach(a=>{if(a!==audio&&!a.paused)a.pause()});setActive(audio);audioContext?.resume?.();updateState();stage.scrollIntoView({behavior:'smooth',block:'center'})});['pause','ended','emptied'].forEach(ev=>audio.addEventListener(ev,updateState));}
function scan(){document.querySelectorAll('audio').forEach(registerAudio)}
new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});scan();
playButton.addEventListener('click',()=>{if(!activeAudio){const first=document.querySelector('audio[src]:not([src=""])');if(!first){window.SOS?.toast?.('Play an uploaded preview first, or add an audio path in Admin → Music Manager.',{title:'No audio selected'});return}setActive(first)}activeAudio.paused?activeAudio.play().catch(()=>{}):activeAudio.pause()});
volume.addEventListener('input',()=>{if(activeAudio)activeAudio.volume=Number(volume.value)});
lightsButton.addEventListener('click',()=>{const on=!stage.classList.contains('lights-on');stage.classList.toggle('lights-on',on);lightsButton.setAttribute('aria-pressed',String(on));lightsButton.textContent=on?'Concert lights on':'Concert lights off'});
modeSelect.addEventListener('change',()=>localStorage.setItem('sosDjWaveform',modeSelect.value));modeSelect.value=localStorage.getItem('sosDjWaveform')||'line';
window.addEventListener('resize',resize,{passive:true});resize();frame(0);stage.classList.add('lights-on');
// Route existing visual play buttons to the nearest real audio element when available.
document.addEventListener('click',e=>{const b=e.target.closest('.musicMainPlayButton,.releaseArtwork button,.liveMixPlay');if(!b)return;const card=b.closest('article');const audio=card?.querySelector('audio')||document.querySelector('.musicCommerceCard audio[src]:not([src=""])');if(audio){e.preventDefault();setActive(audio);audio.paused?audio.play().catch(()=>{}):audio.pause()}},true);
})();
