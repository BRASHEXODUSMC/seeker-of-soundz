/* Seeker Of SoundZ v4.13.16 — clean one-session signal loader */
(()=>{
'use strict';
const KEY='sos_loader_seen_v4_13_16';
const loader=document.getElementById('loader');if(!loader)return;
const root=document.documentElement;
const hide=()=>{loader.classList.add('loaded');loader.setAttribute('aria-hidden','true');root.classList.remove('sosLoaderRunning');root.classList.add('sosLoaderSeen')};
try{if(sessionStorage.getItem(KEY)==='1'){hide();return}sessionStorage.setItem(KEY,'1')}catch(_){ }
root.classList.add('sosLoaderRunning');loader.classList.remove('loaded','loaderComplete');loader.setAttribute('aria-hidden','false');
const content=loader.querySelector('.loaderContent');
loader.querySelectorAll('.frequencyReactor,.loaderFrequencyLine,.loaderCornerReadouts,.loaderWaveformRing,.loaderBassPulse').forEach(n=>n.remove());
if(content&&!content.querySelector('.sosSignalWave')){
 const wave=document.createElement('div');wave.className='sosSignalWave';wave.setAttribute('aria-hidden','true');
 wave.innerHTML=Array.from({length:54},(_,i)=>`<i style="--i:${i};--a:${4+(i*11)%20}"></i>`).join('');
 content.querySelector('.loaderLogoStage')?.appendChild(wave);
 const label=document.createElement('div');label.className='sosLoaderKicker';label.textContent='A SEEKER OF SOUNDZ EXPERIENCE';content.prepend(label);
}
const bar=loader.querySelector('.loaderProgress'),pct=loader.querySelector('.loaderPercent'),status=loader.querySelector('.loaderStatus span:first-child'),brand=loader.querySelector('.loaderBrandName'),subtitle=loader.querySelector('.loaderSubtitle');
if(brand)brand.textContent='SEEKER OF SOUNDZ';if(subtitle)subtitle.textContent='DJ • PRODUCER • CREATOR';
const messages=[[0,'Tuning into the frequency'],[16,'Loading the sound system'],[34,'Connecting the community'],[53,'Preparing the visual stage'],[72,'Synchronizing the signal'],[88,'Opening the experience'],[98,'Welcome to Seeker Of SoundZ']];
let last='',done=false;
function update(v){const n=Math.max(0,Math.min(100,Math.round(v)));if(bar)bar.style.width=n+'%';if(pct)pct.textContent=n+'%';let text=messages[0][1];for(const [at,t] of messages)if(n>=at)text=t;if(status&&text!==last){last=text;status.animate([{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:260});status.textContent=text}loader.style.setProperty('--p',n/100)}
function finish(){if(done)return;done=true;update(100);loader.classList.add('loaderComplete');setTimeout(hide,760)}
const duration=5200,start=performance.now();
function tick(now){const p=Math.min(1,(now-start)/duration),e=1-Math.pow(1-p,2.15);update(e*100);p<1?requestAnimationFrame(tick):finish()}
requestAnimationFrame(tick);setTimeout(finish,7000);
})();
