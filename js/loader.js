/* Seeker Of SoundZ v4.13.12 — one-time Frequency Reactor loader */
(()=>{
'use strict';
const KEY='sos_loader_seen_v4_13_12';
const loader=document.getElementById('loader');
if(!loader)return;
const root=document.documentElement;
const hide=()=>{loader.classList.add('loaded');loader.setAttribute('aria-hidden','true');root.classList.remove('sosLoaderRunning');root.classList.add('sosLoaderSeen')};
try{if(sessionStorage.getItem(KEY)==='1'){hide();return}sessionStorage.setItem(KEY,'1')}catch(_){ }
root.classList.add('sosLoaderRunning');
loader.classList.remove('loaded','loaderComplete');
loader.setAttribute('aria-hidden','false');
const stage=loader.querySelector('.loaderLogoStage');
if(stage){
  stage.querySelectorAll('.frequencyReactor,.loaderWaveformRing,.loaderBassPulse').forEach(n=>n.remove());
  const reactor=document.createElement('div');
  reactor.className='frequencyReactor';
  reactor.setAttribute('aria-hidden','true');
  reactor.innerHTML=`<div class="reactorHalo haloOne"></div><div class="reactorHalo haloTwo"></div><div class="reactorTicks">${Array.from({length:48},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div><div class="reactorWave">${Array.from({length:80},(_,i)=>`<i style="--i:${i};--amp:${(i*7)%13}"></i>`).join('')}</div><div class="reactorPulse"></div>`;
  stage.prepend(reactor);
}
if(!loader.querySelector('.loaderFrequencyLine')){
  const line=document.createElement('div');line.className='loaderFrequencyLine';line.setAttribute('aria-hidden','true');loader.append(line);
}
if(!loader.querySelector('.loaderCornerReadouts')){
  const reads=document.createElement('div');reads.className='loaderCornerReadouts';reads.setAttribute('aria-hidden','true');reads.innerHTML='<span>SIGNAL // SOS</span><span>FREQ 140.13</span><span>CHANNEL ONLINE</span><span>BASS CORE ACTIVE</span>';loader.append(reads);
}
const bar=loader.querySelector('.loaderProgress');
const pct=loader.querySelector('.loaderPercent');
const status=loader.querySelector('.loaderStatus span:first-child');
const brand=loader.querySelector('.loaderBrandName');
const subtitle=loader.querySelector('.loaderSubtitle');
if(subtitle)subtitle.textContent='ENTER THE FREQUENCY';
const phases=[
 [0,'Opening the signal gate'],[9,'Scanning the midnight spectrum'],[18,'Charging the sub-bass reactor'],[30,'Mapping the rhythm grid'],[43,'Synchronizing waveform channels'],[56,'Amplifying the cosmic frequency'],[69,'Calibrating the visual stage'],[81,'Connecting the SoundZ community'],[91,'Preparing the final drop'],[98,'SEEKER OF SOUNDZ']
];
let last='',finished=false;
function update(v){
 const n=Math.max(0,Math.min(100,Math.round(v)));
 if(bar)bar.style.width=n+'%';if(pct)pct.textContent=String(n).padStart(2,'0')+'%';
 let phrase=phases[0][1];for(const [at,text] of phases)if(n>=at)phrase=text;
 if(status&&phrase!==last){last=phrase;status.classList.remove('statusPulse');void status.offsetWidth;status.textContent=phrase;status.classList.add('statusPulse')}
 if(brand&&n>=88)brand.classList.add('brandFinal');
 loader.style.setProperty('--loader-progress',n/100);
}
function finish(){if(finished)return;finished=true;update(100);loader.classList.add('loaderComplete');setTimeout(hide,1050)}
const duration=7600,start=performance.now();
function tick(now){
 const p=Math.min(1,(now-start)/duration);
 const eased=p<.78?(1-Math.pow(1-p/.78,2.45))*.88:.88+((p-.78)/.22)*.12;
 update(eased*100);
 if(p<1)requestAnimationFrame(tick);else finish();
}
requestAnimationFrame(tick);
setTimeout(finish,9800);
})();
