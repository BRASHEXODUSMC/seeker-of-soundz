/* Seeker Of SoundZ v4.18.0 — direct video + licensed music composer */
(()=>{
'use strict';
const $=s=>document.querySelector(s);
const videoInput=$('#composerVideoV4180'),audioInput=$('#composerAudioV4180');
const video=$('#composerPreviewVideoV4180'),audio=$('#composerPreviewAudioV4180'),canvas=$('#composerCanvasV4180');
if(!videoInput||!audioInput||!video||!audio||!canvas)return;
const ctx2d=canvas.getContext('2d');
const previewButton=$('#composerPreviewButtonV4180'),renderButton=$('#composerRenderButtonV4180'),status=$('#composerStatusV4180');
const musicVolume=$('#composerMusicVolumeV4180'),sourceVolume=$('#composerSourceVolumeV4180'),audioStatus=$('#composerAudioStatusV4182');
const startInput=$('#composerStartV4180'),endInput=$('#composerEndV4180'),format=$('#composerFormatV4180');
const directRenderPanel=$('#directRenderStatusV4212'),directRenderProgress=$('#directRenderProgressV4212'),directRenderPercent=$('#directRenderPercentV4212'),directRenderMessage=$('#directRenderMessageV4212'),cancelDirectRender=$('#cancelDirectRenderV4212');
let videoUrl='',audioUrl='',raf=0,rendering=false,activeRecorder=null,renderCancelled=false;
let audioContext=null,videoNode=null,audioNode=null,videoGain=null,musicGain=null,analyser=null,freq=null,mediaDestination=null;
let logoImage=null,logoUrl='';
const logoInput=$('#producerLogoInputV4210'),logoEnabled=$('#producerLogoEnabledV4210');
const textColor=$('#producerTextColorV4220'),textOutline=$('#producerTextOutlineV4220'),textGlow=$('#producerTextGlowV4220'),textBackground=$('#producerTextBackgroundV4220'),textBackgroundOpacity=$('#producerTextBackgroundOpacityV4220'),textSpacing=$('#producerTextSpacingV4220'),textRotation=$('#producerTextRotationV4220'),textX=$('#producerTextXV4220'),textY=$('#producerTextYV4220');
const logoX=$('#producerLogoXV4220'),logoY=$('#producerLogoYV4220'),logoRotation=$('#producerLogoRotationV4220');
const waveformOverlayEnabled=$('#producerWaveformOverlayEnabledV4220'),waveformStyle=$('#producerWaveformStyleV4220'),waveformPosition=$('#producerWaveformPositionV4220'),waveformColor=$('#producerWaveformColorV4220'),waveformHeight=$('#producerWaveformHeightV4220'),waveformOpacity=$('#producerWaveformOpacityV4220');
const cameraMotion=$('#producerCameraMotionV4220'),cameraStrength=$('#producerCameraStrengthV4220'),introTransition=$('#producerIntroTransitionV4220'),introDuration=$('#producerIntroDurationV4220'),outroTransition=$('#producerOutroTransitionV4220'),outroDuration=$('#producerOutroDurationV4220');
const logoPosition=$('#producerLogoPositionV4210'),logoSize=$('#producerLogoSizeV4210'),logoOpacity=$('#producerLogoOpacityV4210');
const overlayText=$('#producerTextV4210'),textStyle=$('#producerTextStyleV4210'),textPosition=$('#producerTextPositionV4210'),textSize=$('#producerTextSizeV4210'),textOpacity=$('#producerTextOpacityV4210,#producerTextColorV4220,#producerTextOutlineV4220,#producerTextGlowV4220,#producerTextBackgroundV4220,#producerTextBackgroundOpacityV4220,#producerTextSpacingV4220,#producerTextRotationV4220,#producerTextXV4220,#producerTextYV4220,#producerLogoXV4220,#producerLogoYV4220,#producerLogoRotationV4220,#producerWaveformOverlayEnabledV4220,#producerWaveformStyleV4220,#producerWaveformPositionV4220,#producerWaveformColorV4220,#producerWaveformHeightV4220,#producerWaveformOpacityV4220,#producerCameraMotionV4220,#producerCameraStrengthV4220,#producerIntroTransitionV4220,#producerIntroDurationV4220,#producerOutroTransitionV4220,#producerOutroDurationV4220');

const selectedEffects=()=>{
 const globalEffects=[...document.querySelectorAll('[data-effect]:checked')].map(input=>input.dataset.effect);
 const time=window.SOSVideoClipsV4240?.globalTime?.()??Number(video.currentTime||0);
 const timed=window.SOSTimedEffectsV4240?.active?.(time)||[];
 return [...new Set([...globalEffects,...timed])];
};
const effectStrength=()=>Math.min(1.45,Math.max(.72,Number(document.getElementById('effectStrengthV4171')?.value||.72))*1.22);
function setStatus(text){status.textContent=text}
function updateAudioStatus(title,copy,active=false){
 if(!audioStatus)return;
 audioStatus.classList.toggle('isActive',active);
 const strong=audioStatus.querySelector('strong'),small=audioStatus.querySelector('small');
 if(strong)strong.textContent=title;if(small)small.textContent=copy;
}
function revoke(url){if(url?.startsWith('blob:'))URL.revokeObjectURL(url)}
function ready(){const ok=!!video.src;previewButton.disabled=!ok;renderButton.disabled=!ok}
function ensureAudioGraph(){
 if(audioContext)return;
 const C=window.AudioContext||window.webkitAudioContext;
 if(!C)return;
 audioContext=new C();analyser=audioContext.createAnalyser();analyser.fftSize=256;freq=new Uint8Array(analyser.frequencyBinCount);mediaDestination=audioContext.createMediaStreamDestination();
 try{videoNode=audioContext.createMediaElementSource(video);videoGain=audioContext.createGain();videoNode.connect(videoGain);videoGain.connect(analyser)}catch(error){console.warn('[Producer Hub 4.0] Video audio graph',error)}
 if(audio.src){try{audioNode=audioContext.createMediaElementSource(audio);musicGain=audioContext.createGain();audioNode.connect(musicGain);musicGain.connect(analyser)}catch(error){console.warn('[Producer Hub 4.0] Music audio graph',error)}}
 analyser.connect(audioContext.destination);analyser.connect(mediaDestination);syncVolumes();
}
function syncVolumes(){
 if(videoGain)videoGain.gain.value=Number(sourceVolume.value);
 if(musicGain)musicGain.gain.value=Number(musicVolume.value);
}
function levels(){
 if(!analyser||!freq)return {bass:.48,mid:.38,high:.3,peak:.48};
 analyser.getByteFrequencyData(freq);
 const avg=(a,b)=>{let sum=0,count=0;for(let i=a;i<Math.min(b,freq.length);i++){sum+=freq[i];count++}return count?sum/(count*255):0};
 const bass=avg(0,14),mid=avg(14,48),high=avg(48,freq.length);
 return {bass,mid,high,peak:Math.max(bass,mid,high)};
}
function staticNoise(w,h,amount=.45){
 ctx2d.save();ctx2d.globalCompositeOperation='screen';ctx2d.globalAlpha=.22+amount*.42;
 const count=Math.round(w*h*.0011*amount);
 for(let i=0;i<count;i++){const c=Math.random()>.5?255:25;ctx2d.fillStyle=`rgb(${c},${c},${c})`;ctx2d.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*3,1+Math.random()*2)}
 ctx2d.restore();
}

function vfxSeed(index,time,speed=1){
 const value=Math.sin(index*127.1+Math.floor(time*speed)*311.7)*43758.5453;
 return value-Math.floor(value);
}
function drawEmbers(w,h,lv,time,count=70,color='255,120,35'){
 ctx2d.save();ctx2d.globalCompositeOperation='screen';
 for(let i=0;i<count;i++){
  const life=(time*(.12+(i%7)*.012)+vfxSeed(i,0))%1;
  const x=(vfxSeed(i,1)*w+Math.sin(time*(.7+i%5*.1)+i)*w*.08)%w;
  const y=h-life*h*1.15;
  const size=1+vfxSeed(i,2)*4+lv.peak*3;
  ctx2d.globalAlpha=(1-life)*(.3+lv.high*.7);
  ctx2d.fillStyle=`rgba(${color},1)`;
  ctx2d.shadowColor=`rgb(${color})`;ctx2d.shadowBlur=8+size*2;
  ctx2d.fillRect(x,y,size,size*1.8);
 }
 ctx2d.restore();
}
function drawFlames(w,h,lv,time,intensity=1){
 ctx2d.save();ctx2d.globalCompositeOperation='screen';
 const flames=Math.max(18,Math.round(w/48));
 for(let i=0;i<flames;i++){
  const baseX=(i+.5)/flames*w;
  const sway=Math.sin(time*3.2+i*.83)*w/flames*.35;
  const energy=.35+lv.bass*.75;
  const height=h*(.08+vfxSeed(i,3)*.18)*intensity*energy;
  const width=w/flames*(.65+vfxSeed(i,4)*.7);
  const gradient=ctx2d.createRadialGradient(baseX+sway,h-height*.28,0,baseX+sway,h-height*.28,Math.max(width,height));
  gradient.addColorStop(0,'rgba(255,245,150,.92)');
  gradient.addColorStop(.22,'rgba(255,145,35,.82)');
  gradient.addColorStop(.58,'rgba(235,45,18,.52)');
  gradient.addColorStop(1,'rgba(80,0,0,0)');
  ctx2d.fillStyle=gradient;
  ctx2d.beginPath();
  ctx2d.moveTo(baseX-width*.5,h);
  ctx2d.quadraticCurveTo(baseX-width*.2+sway,h-height*.55,baseX+sway,h-height);
  ctx2d.quadraticCurveTo(baseX+width*.28-sway*.2,h-height*.44,baseX+width*.5,h);
  ctx2d.closePath();ctx2d.fill();
  ctx2d.strokeStyle='rgba(255,190,55,.35)';ctx2d.lineWidth=1.5;ctx2d.stroke();
 }
 ctx2d.restore();
}
function drawSmokeClouds(w,h,lv,time,options={}){
 const direction=options.direction||0;
 const purple=Boolean(options.purple);
 const rise=Boolean(options.rise);
 const density=options.density||1;
 ctx2d.save();ctx2d.globalCompositeOperation='source-over';
 const count=Math.round(34*density);
 for(let i=0;i<count;i++){
  const speed=.018+(i%6)*.004;
  const phase=(time*speed+vfxSeed(i,6))%1;
  let x=vfxSeed(i,7)*w,y=vfxSeed(i,8)*h;
  if(direction>0)x=(phase*1.35-.18)*w;
  if(direction<0)x=(1.18-phase*1.35)*w;
  if(rise)y=(1.15-phase*1.3)*h;
  else y=(y+Math.sin(time*.35+i)*h*.05)%h;
  const radius=(35+vfxSeed(i,9)*110)*density*(.8+lv.mid*.35);
  const alpha=(.035+vfxSeed(i,10)*.08)*density;
  const c=purple?`rgba(${90+Math.round(vfxSeed(i,11)*80)},${35+Math.round(vfxSeed(i,12)*45)},${150+Math.round(vfxSeed(i,13)*95)},${alpha})`:`rgba(${45+Math.round(vfxSeed(i,11)*45)},${45+Math.round(vfxSeed(i,12)*45)},${50+Math.round(vfxSeed(i,13)*50)},${alpha})`;
  const g=ctx2d.createRadialGradient(x,y,0,x,y,radius);
  g.addColorStop(0,c);g.addColorStop(.55,c.replace(/[\d.]+\)$/,'0.55)'));g.addColorStop(1,'rgba(0,0,0,0)');
  ctx2d.fillStyle=g;ctx2d.beginPath();ctx2d.arc(x,y,radius,0,Math.PI*2);ctx2d.fill();
 }
 ctx2d.restore();
}
function drawExplosion(w,h,lv,time,impact=false){
 const cycle=impact?Math.max(0,Math.min(1,(lv.bass-.55)*2.2)):((time*.38)%1);
 if(cycle<=.02||cycle>=.78)return;
 const p=cycle/.78;
 const cx=w*(.35+.3*Math.sin(Math.floor(time*.38)*2.11));
 const cy=h*(.35+.25*Math.cos(Math.floor(time*.38)*1.73));
 ctx2d.save();ctx2d.globalCompositeOperation='screen';
 const radius=Math.min(w,h)*(.04+p*.34);
 const g=ctx2d.createRadialGradient(cx,cy,0,cx,cy,radius);
 g.addColorStop(0,`rgba(255,255,210,${(1-p)*.95})`);
 g.addColorStop(.18,`rgba(255,190,50,${(1-p)*.85})`);
 g.addColorStop(.48,`rgba(255,65,18,${(1-p)*.62})`);
 g.addColorStop(1,'rgba(70,0,0,0)');
 ctx2d.fillStyle=g;ctx2d.beginPath();ctx2d.arc(cx,cy,radius,0,Math.PI*2);ctx2d.fill();
 ctx2d.strokeStyle=`rgba(255,205,90,${(1-p)*.75})`;ctx2d.lineWidth=3+10*(1-p);
 for(let i=0;i<18;i++){
  const a=i/18*Math.PI*2+vfxSeed(i,14)*.24;
  const inner=radius*.45,outer=radius*(1.05+vfxSeed(i,15)*.55);
  ctx2d.beginPath();ctx2d.moveTo(cx+Math.cos(a)*inner,cy+Math.sin(a)*inner);ctx2d.lineTo(cx+Math.cos(a)*outer,cy+Math.sin(a)*outer);ctx2d.stroke();
 }
 ctx2d.restore();
}
function drawShockwave(w,h,lv,time){
 const p=(time*.6)%1,r=Math.min(w,h)*(.08+p*.62);
 ctx2d.save();ctx2d.strokeStyle=`rgba(255,180,80,${(1-p)*(.25+lv.peak*.55)})`;ctx2d.lineWidth=2+10*(1-p);
 ctx2d.beginPath();ctx2d.arc(w/2,h/2,r,0,Math.PI*2);ctx2d.stroke();
 ctx2d.strokeStyle=`rgba(180,95,255,${(1-p)*.32})`;ctx2d.lineWidth=1+5*(1-p);ctx2d.beginPath();ctx2d.arc(w/2,h/2,r*1.12,0,Math.PI*2);ctx2d.stroke();ctx2d.restore();
}


function drawReactiveParticlesV4280(w,h,lv,time,mode){
 ctx2d.save();ctx2d.globalCompositeOperation='screen';
 const count=mode==='dropConfetti'?120:mode==='beatDust'?72:mode==='audioTrails'?48:90;
 const energy=Math.max(.08,lv.bass*.62+lv.mid*.25+lv.high*.35);
 for(let i=0;i<count;i++){
  const seed=vfxSeed(i,21),seed2=vfxSeed(i,22),seed3=vfxSeed(i,23);
  let x=(seed*w+Math.sin(time*(.35+seed2)+i)*w*.08)%w;
  let y=(seed2*h-time*(18+lv.high*95)*(seed3+.2))%h;if(y<0)y+=h;
  let size=1.2+seed3*4+energy*7;
  let alpha=.18+energy*.72;
  let hue=260+lv.high*120+i%50;
  if(mode==='bassSparks'){
   const angle=seed*Math.PI*2,radius=(time*(35+lv.bass*180)+seed2*w*.25)%(Math.min(w,h)*.62);
   x=w/2+Math.cos(angle)*radius;y=h/2+Math.sin(angle)*radius;size=1+lv.bass*8;hue=25+seed*35;
  }else if(mode==='beatDust'){
   size=5+seed3*18+lv.peak*22;alpha=.04+lv.peak*.22;hue=285+seed*40;
  }else if(mode==='frequencyOrbs'){
   const band=i%3===0?lv.bass:i%3===1?lv.mid:lv.high;
   y=h*(.2+(i%3)*.3)+Math.sin(time*(1+seed)+i)*h*.08;size=4+band*24;hue=i%3===0?330:i%3===1?190:65;alpha=.2+band*.75;
  }else if(mode==='dropConfetti'){
   y=(seed2*h+time*(45+lv.peak*260)*(seed3+.3))%h;size=2+seed3*7;hue=(i*41+time*80)%360;alpha=.25+lv.peak*.7;
  }else if(mode==='audioTrails'){
   ctx2d.strokeStyle=`hsla(${hue},100%,68%,${alpha})`;ctx2d.lineWidth=1+energy*5;ctx2d.beginPath();
   ctx2d.moveTo(x,y);ctx2d.quadraticCurveTo(x+w*.05*Math.sin(time+i),y-h*.08,x+w*.12,y-h*.02);ctx2d.stroke();continue;
  }
  ctx2d.fillStyle=`hsla(${hue},100%,68%,${alpha})`;ctx2d.shadowColor=`hsl(${hue},100%,65%)`;ctx2d.shadowBlur=6+energy*18;
  ctx2d.beginPath();ctx2d.arc(x,y,size,0,Math.PI*2);ctx2d.fill();
 }
 ctx2d.restore();
}

function overlay(w,h,lv){
 const fx=selectedEffects(),p=effectStrength(),time=window.SOSVideoClipsV4240?.globalTime?.()??(video.currentTime||performance.now()*.001);
 if(fx.includes('rollingSmoke'))drawSmokeClouds(w,h,lv,time,{density:1});
 if(fx.includes('smokeSwipeLeft'))drawSmokeClouds(w,h,lv,time,{density:1.45,direction:-1});
 if(fx.includes('smokeSwipeRight'))drawSmokeClouds(w,h,lv,time,{density:1.45,direction:1});
 if(fx.includes('smokeRise'))drawSmokeClouds(w,h,lv,time,{density:1.2,rise:true});
 if(fx.includes('purpleSmoke'))drawSmokeClouds(w,h,lv,time,{density:1.15,purple:true});
 if(fx.includes('drawnFire'))drawFlames(w,h,lv,time,1);
 if(fx.includes('fireBurst')){ctx2d.save();ctx2d.translate(w/2,h/2);ctx2d.rotate(time*.2);ctx2d.translate(-w/2,-h/2);drawExplosion(w,h,lv,time,false);ctx2d.restore()}
 if(fx.includes('emberStorm'))drawEmbers(w,h,lv,time,95);
 if(fx.includes('cartoonExplosion'))drawExplosion(w,h,lv,time,false);
 if(fx.includes('impactExplosion'))drawExplosion(w,h,lv,time,true);
 if(fx.includes('shockwave'))drawShockwave(w,h,lv,time);
 if(fx.includes('fireSmokeCombo')){drawSmokeClouds(w,h,lv,time,{density:1.05,rise:true});drawFlames(w,h,lv,time,.9);drawEmbers(w,h,lv,time,60)}
 if(fx.includes('reactiveParticles'))drawReactiveParticlesV4280(w,h,lv,time,'reactiveParticles');
 if(fx.includes('bassSparks'))drawReactiveParticlesV4280(w,h,lv,time,'bassSparks');
 if(fx.includes('beatDust'))drawReactiveParticlesV4280(w,h,lv,time,'beatDust');
 if(fx.includes('frequencyOrbs'))drawReactiveParticlesV4280(w,h,lv,time,'frequencyOrbs');
 if(fx.includes('dropConfetti'))drawReactiveParticlesV4280(w,h,lv,time,'dropConfetti');
 if(fx.includes('audioTrails'))drawReactiveParticlesV4280(w,h,lv,time,'audioTrails');
 if(fx.includes('tvStatic'))staticNoise(w,h,.45+lv.high*.5);
 if(fx.includes('heavyStatic')){staticNoise(w,h,.95);ctx2d.fillStyle='rgba(255,255,255,.16)';ctx2d.fillRect(0,(performance.now()*.3)%h,w,5+lv.high*15)}
 if(fx.includes('scanlines')){ctx2d.fillStyle='rgba(0,0,0,.22)';for(let y=(time*40)%6;y<h;y+=6)ctx2d.fillRect(0,y,w,2)}
 if(fx.includes('rgb')||fx.includes('channelGhost')){ctx2d.save();ctx2d.globalCompositeOperation='screen';const d=Math.sin(time*3)*w*.015;ctx2d.fillStyle=`rgba(255,30,85,${.05+lv.mid*.1})`;ctx2d.fillRect(d,0,w,h);ctx2d.fillStyle=`rgba(20,185,255,${.05+lv.high*.1})`;ctx2d.fillRect(-d,0,w,h);ctx2d.restore()}
 if(fx.includes('glow')){ctx2d.strokeStyle=`rgba(181,92,255,${.25+lv.bass*.65})`;ctx2d.lineWidth=8+lv.bass*24;ctx2d.strokeRect(4,4,w-8,h-8)}
 if(fx.includes('laserGrid')){ctx2d.save();ctx2d.translate(w/2,h);ctx2d.strokeStyle=`rgba(170,65,255,${.2+lv.peak*.65})`;for(let i=-9;i<=9;i++){ctx2d.beginPath();ctx2d.moveTo(0,0);ctx2d.lineTo(i*w*.12,-h);ctx2d.stroke()}ctx2d.restore()}
 if(fx.includes('audioBars')&&freq){ctx2d.fillStyle='rgba(190,105,255,.66)';const bars=48,gap=3,bw=(w-gap*(bars-1))/bars;for(let i=0;i<bars;i++){const v=freq[Math.floor(i/bars*freq.length)]/255;ctx2d.fillRect(i*(bw+gap),h,bw,-v*h*.26)}}
 if(fx.includes('circleSpectrum')&&freq){ctx2d.save();ctx2d.translate(w/2,h/2);for(let i=0;i<48;i++){const v=freq[Math.floor(i/48*freq.length)]/255,r=Math.min(w,h)*.18;ctx2d.rotate(Math.PI*2/48);ctx2d.strokeStyle=`rgba(${120+i*2},${80+i*3},255,${.25+v*.65})`;ctx2d.beginPath();ctx2d.moveTo(r,0);ctx2d.lineTo(r+v*Math.min(w,h)*.18,0);ctx2d.stroke()}ctx2d.restore()}
 if(fx.includes('particles')){ctx2d.fillStyle='rgba(215,175,255,.78)';for(let i=0;i<30;i++){const x=(Math.sin(i*17.2+time*.5)+1)*w/2,y=(Math.cos(i*9.3+time*(1+i%4)*.2)+1)*h/2;ctx2d.fillRect(x,y,1+lv.high*4,1+lv.high*4)}}
 if(fx.includes('hueShift')){ctx2d.fillStyle=`hsla(${(time*45)%360},85%,55%,${.04+lv.high*.08})`;ctx2d.globalCompositeOperation='screen';ctx2d.fillRect(0,0,w,h);ctx2d.globalCompositeOperation='source-over'}
 if(fx.includes('vignette')){const g=ctx2d.createRadialGradient(w/2,h/2,Math.min(w,h)*.18,w/2,h/2,Math.max(w,h)*.7);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.72)');ctx2d.fillStyle=g;ctx2d.fillRect(0,0,w,h)}
 if(fx.includes('strobe')&&lv.peak>.48){ctx2d.fillStyle=`rgba(255,255,255,${Math.min(.34,lv.peak*p*.32)})`;ctx2d.fillRect(0,0,w,h)}
 if(fx.includes('dropFlash')&&lv.bass>.68){const g=ctx2d.createRadialGradient(w/2,h/2,0,w/2,h/2,Math.max(w,h)*.7);g.addColorStop(0,`rgba(255,255,255,${lv.bass*.62})`);g.addColorStop(1,'rgba(165,65,255,0)');ctx2d.fillStyle=g;ctx2d.fillRect(0,0,w,h)}
 if(fx.includes('vhs')){ctx2d.save();ctx2d.globalAlpha=.18;for(let i=0;i<8;i++){const y=(time*95+i*131)%h;ctx2d.fillStyle=i%2?'#fff':'#7136a8';ctx2d.fillRect(Math.sin(time*4+i)*14,y,w,1+Math.random()*3)}ctx2d.restore()}
 if(fx.includes('filmGrain'))staticNoise(w,h,.25);
 if(fx.includes('snowNoise')){ctx2d.save();ctx2d.fillStyle='rgba(255,255,255,.45)';for(let i=0;i<95;i++){ctx2d.fillRect((i*97+time*71)%w,(i*53+time*(20+i%7))%h,1.5,1.5)}ctx2d.restore()}
 if(fx.includes('glitchBars')||fx.includes('dataMosh')){ctx2d.save();ctx2d.globalCompositeOperation='screen';for(let i=0;i<7;i++){const y=Math.random()*h,bh=2+Math.random()*18,dx=(Math.random()-.5)*38*lv.peak;ctx2d.drawImage(canvas,0,y,w,bh,dx,y,w,bh)}ctx2d.restore()}
 if(fx.includes('waveform')&&freq){ctx2d.save();ctx2d.strokeStyle=`rgba(221,174,255,${.48+lv.peak*.4})`;ctx2d.lineWidth=2;ctx2d.beginPath();for(let x=0;x<w;x++){const index=Math.floor(x/w*freq.length),v=freq[index]/255,y=h*.72+(v-.5)*h*.22;x?ctx2d.lineTo(x,y):ctx2d.moveTo(x,y)}ctx2d.stroke();ctx2d.restore()}
 if(fx.includes('oscilloscope')){ctx2d.save();ctx2d.strokeStyle='rgba(100,245,205,.76)';ctx2d.lineWidth=2;ctx2d.beginPath();for(let x=0;x<w;x+=4){const y=h*.5+Math.sin(x*.035+time*8)*h*(.02+lv.mid*.09);x?ctx2d.lineTo(x,y):ctx2d.moveTo(x,y)}ctx2d.stroke();ctx2d.restore()}
 if(fx.includes('lightLeaks')){const leak=ctx2d.createLinearGradient(0,0,w,h);leak.addColorStop(0,`rgba(255,84,174,${.05+lv.mid*.11})`);leak.addColorStop(.5,'rgba(255,190,80,0)');leak.addColorStop(1,`rgba(104,57,255,${.05+lv.high*.1})`);ctx2d.fillStyle=leak;ctx2d.fillRect(0,0,w,h)}
 if(fx.includes('horizonGlow')){const hg=ctx2d.createLinearGradient(0,h*.5,0,h);hg.addColorStop(0,'rgba(160,70,255,0)');hg.addColorStop(.7,`rgba(160,70,255,${.1+lv.bass*.18})`);hg.addColorStop(1,'rgba(0,0,0,.3)');ctx2d.fillStyle=hg;ctx2d.fillRect(0,h*.45,w,h*.55)}
 if(fx.includes('neonEdges')){ctx2d.save();ctx2d.strokeStyle=`rgba(87,232,255,${.25+lv.high*.45})`;ctx2d.lineWidth=3;ctx2d.strokeRect(w*.02,h*.02,w*.96,h*.96);ctx2d.restore()}
 if(fx.includes('gridFlash')||fx.includes('tunnel')){ctx2d.save();ctx2d.translate(w/2,h/2);ctx2d.strokeStyle=`rgba(185,105,255,${.08+lv.peak*.3})`;for(let r=1;r<8;r++)ctx2d.strokeRect(-r*w*.055,-r*h*.055,r*w*.11,r*h*.11);ctx2d.restore()}
 if(fx.includes('digitalRain')){ctx2d.save();ctx2d.fillStyle='rgba(115,245,205,.4)';ctx2d.font=`${Math.max(10,w*.012)}px monospace`;for(let i=0;i<28;i++)ctx2d.fillText(String.fromCharCode(48+(i*7)%42),i*w/28,(time*(40+i%5)*8+i*73)%h);ctx2d.restore()}
 const bars=fx.includes('ultrawideBars')?.18:fx.includes('retroCinemaBars')?.13:fx.includes('letterbox')?.115:0;
 if(bars){ctx2d.save();ctx2d.globalAlpha=1;ctx2d.fillStyle='#000';ctx2d.fillRect(0,0,w,h*bars);ctx2d.fillRect(0,h-h*bars,w,h*bars);ctx2d.restore()}
 if(fx.includes('animeBars')){ctx2d.save();ctx2d.fillStyle='#000';const b=h*(.07+lv.peak*.09),s=w*.055;ctx2d.beginPath();ctx2d.moveTo(0,0);ctx2d.lineTo(w,0);ctx2d.lineTo(w-s,b);ctx2d.lineTo(s,b);ctx2d.fill();ctx2d.beginPath();ctx2d.moveTo(s,h-b);ctx2d.lineTo(w-s,h-b);ctx2d.lineTo(w,h);ctx2d.lineTo(0,h);ctx2d.fill();ctx2d.restore()}
 drawLayers(w,h,lv);
}
function hexToRgba(hex,alpha=1){
 const clean=String(hex||'#ffffff').replace('#','');
 const value=parseInt(clean.length===3?clean.split('').map(c=>c+c).join(''):clean,16);
 return `rgba(${value>>16&255},${value>>8&255},${value&255},${alpha})`;
}
function textCoordinates(w,h,pos){
 const map={
  top:[.5,.12],center:[.5,.5],bottom:[.5,.86],'lower-third':[.5,.68],
  'top-left':[.16,.14],'top-right':[.84,.14],'bottom-left':[.16,.84],'bottom-right':[.84,.84]
 };
 if(pos==='custom')return [Number(textX?.value||50)/100,Number(textY?.value||50)/100];
 return map[pos]||map.bottom;
}
function drawLetterSpacedText(text,x,y,spacing,stroke=false){
 const chars=[...text],widths=chars.map(c=>ctx2d.measureText(c).width),total=widths.reduce((a,b)=>a+b,0)+Math.max(0,chars.length-1)*spacing;
 let cursor=x-total/2;
 chars.forEach((char,index)=>{
  const cx=cursor+widths[index]/2;
  stroke?ctx2d.strokeText(char,cx,y):ctx2d.fillText(char,cx,y);
  cursor+=widths[index]+spacing;
 });
}
function drawWaveformOverlay(w,h,lv){
 if(!waveformOverlayEnabled?.checked||!freq)return;
 const style=waveformStyle?.value||'line',position=waveformPosition?.value||'bottom',color=waveformColor?.value||'#c994ff';
 const height=h*Number(waveformHeight?.value||.18),alpha=Number(waveformOpacity?.value||.8);
 const cy=position==='top'?h*.18:position==='center'?h*.5:h*.82;
 ctx2d.save();ctx2d.globalAlpha=alpha;ctx2d.strokeStyle=color;ctx2d.fillStyle=color;ctx2d.lineWidth=Math.max(2,w*.0018);
 if(style==='circle'){
  ctx2d.translate(w/2,h/2);const radius=Math.min(w,h)*.2;
  for(let i=0;i<72;i++){const value=freq[Math.floor(i/72*freq.length)]/255,angle=i/72*Math.PI*2;ctx2d.beginPath();ctx2d.moveTo(Math.cos(angle)*radius,Math.sin(angle)*radius);ctx2d.lineTo(Math.cos(angle)*(radius+value*height),Math.sin(angle)*(radius+value*height));ctx2d.stroke()}
 }else if(style==='bars'){
  const bars=72,gap=2,bw=(w-gap*(bars-1))/bars;
  for(let i=0;i<bars;i++){const value=freq[Math.floor(i/bars*freq.length)]/255;ctx2d.fillRect(i*(bw+gap),cy,bw,-value*height)}
 }else{
  ctx2d.beginPath();
  for(let x=0;x<w;x++){const value=freq[Math.floor(x/w*freq.length)]/255,offset=(value-.5)*height,y=style==='mirror'?cy+offset:cy-value*height;x?ctx2d.lineTo(x,y):ctx2d.moveTo(x,y)}
  ctx2d.stroke();
  if(style==='mirror'){ctx2d.beginPath();for(let x=0;x<w;x++){const value=freq[Math.floor(x/w*freq.length)]/255,y=cy-(value-.5)*height;x?ctx2d.lineTo(x,y):ctx2d.moveTo(x,y)}ctx2d.stroke()}
 }
 ctx2d.restore();
}
function drawLayers(w,h,lv){
 if(logoImage&&logoEnabled?.checked){
  const fraction=Number(logoSize?.value||.2),tw=w*fraction,th=tw*(logoImage.naturalHeight/logoImage.naturalWidth),pad=w*.025,pos=logoPosition?.value||'bottom-right';
  let x=pad,y=pad;
  if(pos.includes('right'))x=w-tw-pad;if(pos.includes('bottom'))y=h-th-pad;
  if(pos==='center'){x=(w-tw)/2;y=(h-th)/2}
  if(pos==='custom'){x=w*Number(logoX?.value||80)/100-tw/2;y=h*Number(logoY?.value||80)/100-th/2}
  ctx2d.save();ctx2d.translate(x+tw/2,y+th/2);ctx2d.rotate(Number(logoRotation?.value||0)*Math.PI/180);ctx2d.globalAlpha=Number(logoOpacity?.value||.9);ctx2d.shadowColor='rgba(190,110,255,.55)';ctx2d.shadowBlur=12+lv.peak*18;ctx2d.drawImage(logoImage,-tw/2,-th/2,tw,th);ctx2d.restore();
 }
 drawWaveformOverlay(w,h,lv);
 const text=String(overlayText?.value||'').trim();if(!text)return;
 const style=textStyle?.value||'retro',size=Number(textSize?.value||54),opacity=Number(textOpacity?.value||.95),pos=textPosition?.value||'bottom';
 const families={retro:'Trebuchet MS, sans-serif',arcade:'Courier New, monospace',cyber:'Arial Black, sans-serif',rave:'Arial Black, sans-serif',minimal:'Arial, sans-serif',terminal:'Consolas, monospace','neon-script':'Brush Script MT, cursive',techno:'Impact, sans-serif',synthwave:'Arial Black, sans-serif',hologram:'Trebuchet MS, sans-serif',industrial:'Impact, sans-serif',graffiti:'Comic Sans MS, cursive',cinematic:'Georgia, serif',bubble:'Arial Rounded MT Bold, Arial, sans-serif'};
 const [xp,yp]=textCoordinates(w,h,pos),x=w*xp,y=h*yp,spacing=Number(textSpacing?.value||2);
 ctx2d.save();ctx2d.translate(x,y);ctx2d.rotate(Number(textRotation?.value||0)*Math.PI/180);ctx2d.globalAlpha=opacity;ctx2d.textAlign='center';ctx2d.textBaseline='middle';ctx2d.font=`900 ${size}px ${families[style]||'sans-serif'}`;
 const bgAlpha=Number(textBackgroundOpacity?.value||0);
 if(bgAlpha>0){const metrics=ctx2d.measureText(text),bw=metrics.width+size*.7,bh=size*1.5;ctx2d.fillStyle=hexToRgba(textBackground?.value||'#000000',bgAlpha);ctx2d.fillRect(-bw/2,-bh/2,bw,bh)}
 ctx2d.shadowColor=textGlow?.value||'#ff48bb';ctx2d.shadowBlur=style==='minimal'?6:style==='arcade'?2:18;
 ctx2d.strokeStyle=textOutline?.value||'#4eeaff';ctx2d.lineWidth=Math.max(1.5,size*.045);ctx2d.fillStyle=textColor?.value||'#ffffff';
 if(style==='hologram'){ctx2d.globalCompositeOperation='screen';ctx2d.globalAlpha=opacity*.72}
 if(style==='synthwave'){ctx2d.shadowBlur=24;ctx2d.lineWidth=Math.max(2,size*.07)}
 if(style==='industrial'){ctx2d.shadowBlur=5;ctx2d.lineWidth=Math.max(3,size*.08)}
 drawLetterSpacedText(text,0,0,spacing,true);drawLetterSpacedText(text,0,0,spacing,false);
 ctx2d.restore();
}
function cameraTransform(w,h,lv,time){
 const automatic=window.SOSAutoCameraV4250?.state?.(time)||null;
 const mode=automatic?.motion||(cameraMotion?.value||'none'),strength=automatic?.strength??Number(cameraStrength?.value||.7);
 let dx=0,dy=0,rotation=0,scale=1;
 if(mode==='handheld'){dx=Math.sin(time*7.1)*3*strength+Math.sin(time*17)*1.5;dy=Math.cos(time*8.7)*3*strength;rotation=Math.sin(time*4.3)*.004*strength;scale=1.015}
 if(mode==='bass-shake'){dx=(Math.random()-.5)*lv.bass*36*strength;dy=(Math.random()-.5)*lv.bass*28*strength;rotation=(Math.random()-.5)*lv.bass*.02*strength;scale=1.02+lv.bass*.025*strength}
 if(mode==='impact'){const pulse=Math.pow(Math.max(0,Math.sin(time*Math.PI*2)),8)*lv.peak;dx=(Math.random()-.5)*pulse*50*strength;dy=(Math.random()-.5)*pulse*36*strength;scale=1+pulse*.08*strength}
 if(mode==='earthquake'){dx=Math.sin(time*38)*10*strength+Math.sin(time*71)*5;dy=Math.cos(time*45)*8*strength;rotation=Math.sin(time*29)*.012*strength;scale=1.04}
 if(mode==='glitch-jitter'){dx=Math.round(Math.sin(time*24)*4)*6*strength;dy=Math.round(Math.cos(time*31)*3)*4*strength;rotation=Math.round(Math.sin(time*18)*2)*.006*strength;scale=1.03}
 if(mode==='cinematic-drift'){dx=Math.sin(time*.45)*w*.018*strength;dy=Math.cos(time*.38)*h*.015*strength;rotation=Math.sin(time*.25)*.006*strength;scale=1.04}
 if(mode==='orbit'){dx=Math.cos(time*.9)*w*.02*strength;dy=Math.sin(time*.9)*h*.025*strength;rotation=Math.sin(time*.6)*.01*strength;scale=1.04}
 if(mode==='zoom-pulse'){scale=1+(.02+lv.bass*.07)*strength}
 if(mode==='auto-zoom-in'){scale=1+Math.sin(Math.min(1,automatic?.progress||0)*Math.PI/2)*.14*strength}
 if(mode==='auto-zoom-out'){scale=1.14-Math.sin(Math.min(1,automatic?.progress||0)*Math.PI/2)*.14*strength}
 if(mode==='auto-rotate-left'){rotation=-.055*strength*Math.sin((automatic?.progress||0)*Math.PI)}
 if(mode==='auto-rotate-right'){rotation=.055*strength*Math.sin((automatic?.progress||0)*Math.PI)}
 if(mode==='auto-impact'){const p=Math.sin((automatic?.progress||0)*Math.PI);scale=1+p*.12*strength;dx=(Math.random()-.5)*p*24*strength;dy=(Math.random()-.5)*p*18*strength}
 if(mode==='auto-shake'){const p=Math.sin((automatic?.progress||0)*Math.PI);dx=(Math.random()-.5)*p*46*strength;dy=(Math.random()-.5)*p*34*strength;rotation=(Math.random()-.5)*p*.035*strength;scale=1.035}
 if(mode==='auto-bass-warp'){const p=Math.sin((automatic?.progress||0)*Math.PI);scale=1+p*.07*strength;dx=Math.sin(time*28)*p*12*strength}
 if(mode==='auto-bass-crush'){const p=Math.sin((automatic?.progress||0)*Math.PI);scale=1+p*.11*strength;dx=(Math.random()-.5)*p*18*strength;rotation=(Math.random()-.5)*p*.018*strength}
 if(mode==='auto-bass-lens'){const p=Math.sin((automatic?.progress||0)*Math.PI);scale=1+p*.18*strength}
 if(mode==='auto-bass-twist'){const p=Math.sin((automatic?.progress||0)*Math.PI);rotation=Math.sin(time*9)*p*.08*strength;scale=1+p*.06}
 return {dx,dy,rotation,scale};
}
function transitionState(time,duration){
 const intro=Math.max(.01,Number(introDuration?.value||1)),outro=Math.max(.01,Number(outroDuration?.value||1));
 if(time<intro)return {type:introTransition?.value||'none',progress:Math.max(0,Math.min(1,time/intro)),direction:'in'};
 if(duration&&time>duration-outro)return {type:outroTransition?.value||'none',progress:Math.max(0,Math.min(1,(duration-time)/outro)),direction:'out'};
 return {type:'none',progress:1,direction:'none'};
}
function applyTransitionOverlay(w,h,state){
 if(state.type==='none')return;
 const p=state.progress;
 ctx2d.save();
 if(state.type==='fade'){ctx2d.fillStyle=`rgba(0,0,0,${1-p})`;ctx2d.fillRect(0,0,w,h)}
 if(state.type==='flash'){ctx2d.fillStyle=`rgba(255,255,255,${1-p})`;ctx2d.fillRect(0,0,w,h)}
 if(state.type==='wipe-left'){ctx2d.fillStyle='#000';ctx2d.fillRect(p*w,0,w*(1-p),h)}
 if(state.type==='wipe-center'){ctx2d.fillStyle='#000';const half=w*(1-p)/2;ctx2d.fillRect(0,0,half,h);ctx2d.fillRect(w-half,0,half,h)}
 if(state.type==='glitch'){ctx2d.globalCompositeOperation='screen';for(let i=0;i<10;i++){const y=Math.random()*h,bh=2+Math.random()*22,dx=(Math.random()-.5)*(1-p)*80;ctx2d.drawImage(canvas,0,y,w,bh,dx,y,w,bh)}}
 ctx2d.restore();
}

function drawProjectVideoV4300(w,h,time,lv){
 const automatic=window.SOSAutoCameraV4250?.state?.(time)||null;
 const distortion=automatic?.distortion||'none';
 const progress=Math.max(0,Math.min(1,automatic?.progress||0));
 const strength=Math.max(.2,Number(automatic?.strength||1));
 const pulse=Math.sin(progress*Math.PI);
 if(distortion==='none'||pulse<=.001){
  ctx2d.drawImage(video,0,0,w,h);
  return;
 }
 if(distortion==='warp'){
  const slices=32;
  for(let i=0;i<slices;i++){
   const sy=i*h/slices,sh=h/slices+1;
   const offset=Math.sin(i*.72+time*16)*pulse*18*strength*(.35+lv.bass);
   ctx2d.drawImage(video,0,sy,w,sh,offset,sy,w,sh);
  }
  return;
 }
 if(distortion==='crush'){
  const blocks=18;
  ctx2d.drawImage(video,0,0,w,h);
  for(let i=0;i<blocks;i++){
   const sy=Math.random()*h,sh=4+Math.random()*38;
   const shift=(Math.random()-.5)*pulse*90*strength;
   ctx2d.globalAlpha=.28+.42*pulse;
   ctx2d.drawImage(video,0,sy,w,sh,shift,sy,w,sh);
  }
  ctx2d.globalAlpha=1;
  return;
 }
 if(distortion==='lens'){
  const scale=1+pulse*.16*strength;
  ctx2d.save();ctx2d.translate(w/2,h/2);ctx2d.scale(scale,scale);ctx2d.translate(-w/2,-h/2);
  ctx2d.filter=`contrast(${1+pulse*.55}) saturate(${1+pulse*.7})`;
  ctx2d.drawImage(video,0,0,w,h);ctx2d.restore();ctx2d.filter='none';
  return;
 }
 if(distortion==='twist'){
  const bands=20;
  for(let i=0;i<bands;i++){
   const sy=i*h/bands,sh=h/bands+1;
   const angle=(i/bands-.5)*pulse*.08*strength;
   ctx2d.save();ctx2d.translate(w/2,sy+sh/2);ctx2d.rotate(angle);ctx2d.translate(-w/2,-sy-sh/2);
   ctx2d.drawImage(video,0,sy,w,sh,0,sy,w,sh);ctx2d.restore();
  }
  return;
 }
 ctx2d.drawImage(video,0,0,w,h);
}

function draw(){
 const w=video.videoWidth||1280,h=video.videoHeight||720;
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
 const lv=levels(),fx=selectedEffects(),p=effectStrength(),time=window.SOSVideoClipsV4240?.globalTime?.()??(video.currentTime||0),projectDuration=window.SOSVideoClipsV4240?.totalDuration?.()??(video.duration||0),state=transitionState(time,projectDuration),motion=cameraTransform(w,h,lv,time);
 if(musicGain){
  const musicActive=window.SOSMusicRazorV4270?.isActive?.(time)!==false;
  musicGain.gain.value=musicActive?Number(musicVolume.value):0;
 }
 ctx2d.clearRect(0,0,w,h);ctx2d.save();ctx2d.translate(w/2+motion.dx,h/2+motion.dy);ctx2d.rotate(motion.rotation);ctx2d.scale(motion.scale,motion.scale);
 let transitionScale=1;
 if(state.type==='zoom')transitionScale=state.direction==='in'?.72+.28*state.progress:1+.28*(1-state.progress);
 ctx2d.scale(transitionScale,transitionScale);ctx2d.translate(-w/2,-h/2);
 if(fx.includes('beatZoom')){const z=1+lv.bass*p*.05;ctx2d.translate(w/2,h/2);ctx2d.scale(z,z);ctx2d.translate(-w/2,-h/2)}
 if(fx.includes('shake')&&cameraMotion?.value==='none')ctx2d.translate((Math.random()-.5)*lv.bass*p*24,(Math.random()-.5)*lv.bass*p*18);
 if(fx.includes('rotation')){ctx2d.translate(w/2,h/2);ctx2d.rotate((lv.bass-.2)*p*.025);ctx2d.translate(-w/2,-h/2)}
 const blur=state.type==='blur'?Math.max(0,(1-state.progress)*20):0;
 ctx2d.filter=`${fx.includes('monochrome')?'grayscale(1) ':fx.includes('posterize')?'contrast(1.5) saturate(1.7) ':''}${blur?`blur(${blur}px)`:''}`.trim()||'none';
 drawProjectVideoV4300(w,h,time,lv);ctx2d.restore();overlay(w,h,lv);window.SOSProducerLayerManagerV4230?.draw?.(ctx2d,w,h,time,lv,projectDuration);applyTransitionOverlay(w,h,state);window.SOSClipTransitionsV4250?.draw?.(ctx2d,w,h,time);
 raf=requestAnimationFrame(draw);
}
async function playPreview(){
 ensureAudioGraph();if(audioContext)await audioContext.resume();
 const start=Math.max(0,Number(startInput.value||0));
 if(window.SOSVideoClipsV4240?.hasClips?.())await window.SOSVideoClipsV4240.startSequence(start,false);
 else video.currentTime=start;
 if(audio.src){audio.currentTime=start%Math.max(.01,audio.duration||1);audio.loop=true}syncVolumes();
 await video.play();if(audio.src)await audio.play().catch(()=>{});updateAudioStatus(audioInput.files[0]?.name||'Music playing','Synchronized with the single video preview.',true);cancelAnimationFrame(raf);draw();setStatus('Preview playing. Open Effects to change presets; selections update live.');
}
async function render(){
 if(rendering)return;
 ensureAudioGraph();if(audioContext)await audioContext.resume();
 const projectDuration=window.SOSVideoClipsV4240?.totalDuration?.()??(video.duration||0);const start=Math.max(0,Number(startInput.value||0)),end=Math.min(projectDuration||Infinity,Number(endInput.value||projectDuration||0));
 if(!(end>start))return setStatus('End time must be greater than start time.');

 renderCancelled=false;rendering=true;renderButton.disabled=true;previewButton.disabled=true;
 if(directRenderPanel)directRenderPanel.hidden=false;
 if(directRenderProgress)directRenderProgress.style.width='0%';
 if(directRenderPercent)directRenderPercent.textContent='0%';
 if(directRenderMessage)directRenderMessage.textContent='Preparing the project canvas and audio mix…';
 window.dispatchEvent(new CustomEvent('sos:render-started',{detail:{title:'Producer Hub Project'}}));

 if(window.SOSVideoClipsV4240?.hasClips?.())await window.SOSVideoClipsV4240.startSequence(start,true);
 else video.currentTime=start;
 if(audio.src){audio.currentTime=start%Math.max(.01,audio.duration||1);audio.loop=true}
 syncVolumes();

 const stream=canvas.captureStream(30);
 mediaDestination?.stream?.getAudioTracks().forEach(track=>stream.addTrack(track));
 const requested=format.value;
 const candidates=requested==='auto'
  ?['video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm']
  :[requested,'video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
 const mime=candidates.find(type=>MediaRecorder.isTypeSupported(type))||'video/webm';
 const quality=$('#inspectorQualityV4190')?.value||'high';
 const bitrate={standard:5000000,high:9000000,maximum:14000000}[quality]||9000000;
 const chunks=[],recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:bitrate});
 activeRecorder=recorder;

 recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
 recorder.onerror=e=>{
  activeRecorder=null;rendering=false;ready();
  const message=e.error?.message||'Unknown render error';
  if(directRenderMessage)directRenderMessage.textContent=`Render failed: ${message}`;
  setStatus(`Render failed: ${message}`);
 };
 recorder.onstop=()=>{
  activeRecorder=null;
  if(renderCancelled){
   rendering=false;ready();
   if(directRenderMessage)directRenderMessage.textContent='Render cancelled. No download was created.';
   setStatus('Render cancelled.');
   return;
  }
  const blob=new Blob(chunks,{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`sos-finished-project-${Date.now()}.${mime.includes('mp4')?'mp4':'webm'}`;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);
  rendering=false;ready();
  if(directRenderProgress)directRenderProgress.style.width='100%';
  if(directRenderPercent)directRenderPercent.textContent='100%';
  if(directRenderMessage)directRenderMessage.textContent=`Finished project downloaded as ${mime.includes('mp4')?'MP4':'WEBM'} · ${(blob.size/1048576).toFixed(1)} MB`;
  setStatus(`Finished project downloaded as ${mime.includes('mp4')?'MP4':'WEBM'}.`);
  window.dispatchEvent(new CustomEvent('sos:render-complete',{detail:{title:'Producer Hub Project',format:mime,size:blob.size}}));
 };

 await video.play();
 if(audio.src)await audio.play().catch(()=>{});
 cancelAnimationFrame(raf);draw();recorder.start(250);
 setStatus('Direct rendering in progress. This uses the project canvas, not screen or tab capture.');

 const monitor=()=>{
  if(!rendering)return;
  const projectTime=window.SOSVideoClipsV4240?.globalTime?.()??video.currentTime;
  const progress=Math.max(0,Math.min(1,(projectTime-start)/(end-start))),percent=Math.round(progress*100);
  if(directRenderProgress)directRenderProgress.style.width=`${percent}%`;
  if(directRenderPercent)directRenderPercent.textContent=`${percent}%`;
  if(directRenderMessage)directRenderMessage.textContent=`Rendering ${percent}% · combining video, effects, logo, text, and audio.`;
  window.dispatchEvent(new CustomEvent('sos:render-progress',{detail:{progress,percent}}));
  if((window.SOSVideoClipsV4240?.globalTime?.()??video.currentTime)>=end||(video.ended&&!window.SOSVideoClipsV4240?.hasNext?.())){
   video.pause();audio?.pause();if(recorder.state!=='inactive')recorder.stop();cancelAnimationFrame(raf);return;
  }
  requestAnimationFrame(monitor);
 };
 monitor();
}
cancelDirectRender?.addEventListener('click',()=>{
 if(!rendering)return;
 renderCancelled=true;rendering=false;video.pause();audio?.pause();cancelAnimationFrame(raf);
 if(activeRecorder&&activeRecorder.state!=='inactive')activeRecorder.stop();
 if(directRenderMessage)directRenderMessage.textContent='Cancelling direct render…';
});
function redrawFrame(){if(!video.src)return;cancelAnimationFrame(raf);draw();if(video.paused)setTimeout(()=>cancelAnimationFrame(raf),90)}
document.addEventListener('change',event=>{if(event.target.matches('[data-effect],#effectStrengthV4171,#producerLogoEnabledV4210,#producerLogoPositionV4210,#producerLogoSizeV4210,#producerLogoOpacityV4210,#producerTextV4210,#producerTextStyleV4210,#producerTextPositionV4210,#producerTextSizeV4210,#producerTextOpacityV4210'))redrawFrame()});
document.addEventListener('input',event=>{if(event.target.matches('#effectStrengthV4171,#producerLogoSizeV4210,#producerLogoOpacityV4210,#producerTextV4210,#producerTextSizeV4210,#producerTextOpacityV4210'))redrawFrame()});
logoInput?.addEventListener('change',()=>{const file=logoInput.files?.[0];if(!file)return;revoke(logoUrl);logoUrl=URL.createObjectURL(file);const image=new Image();image.onload=()=>{logoImage=image;$('#producerLogoNameV4210').textContent=file.name;redrawFrame()};image.src=logoUrl});
$('#producerRemoveLogoV4210')?.addEventListener('click',()=>{logoImage=null;revoke(logoUrl);logoUrl='';if(logoInput)logoInput.value='';$('#producerLogoNameV4210').textContent='PNG, JPG, WEBP, or GIF';redrawFrame()});
$('#producerClearTextV4210')?.addEventListener('click',()=>{if(overlayText)overlayText.value='';redrawFrame()});
video.addEventListener('play',()=>{cancelAnimationFrame(raf);draw()});video.addEventListener('pause',()=>setTimeout(()=>cancelAnimationFrame(raf),70));video.addEventListener('seeked',redrawFrame);
videoInput.addEventListener('change',()=>{
 const file=videoInput.files[0];if(!file)return;revoke(videoUrl);videoUrl=URL.createObjectURL(file);video.src=videoUrl;video.load();$('#composerVideoNameV4180').textContent=file.name;setStatus('Video loaded. Effects and overlays can preview immediately; licensed music is optional.');
});
audioInput.addEventListener('change',()=>{
 const file=audioInput.files[0];if(!file)return;revoke(audioUrl);audioUrl=URL.createObjectURL(file);audio.src=audioUrl;audio.load();
 if(audioContext&&!audioNode){
  try{audioNode=audioContext.createMediaElementSource(audio);musicGain=audioContext.createGain();audioNode.connect(musicGain);musicGain.connect(analyser);syncVolumes()}catch(error){console.warn('[Producer Hub 4.1] Music graph connection',error)}
 }
 $('#composerAudioNameV4180').textContent=file.name;updateAudioStatus(file.name,'Waveform, playback, transitions, and final export are ready.',true);setStatus('Music loaded. The visible waveform can now follow playback.');
});
video.addEventListener('loadedmetadata',()=>{
 const total=window.SOSVideoClipsV4240?.totalDuration?.()??Number(video.duration||0);
 endInput.value=Number(total||0).toFixed(2);ready();
});
audio.addEventListener('loadedmetadata',ready);
musicVolume.addEventListener('input',syncVolumes);sourceVolume.addEventListener('input',syncVolumes);
previewButton.addEventListener('click',playPreview);renderButton.addEventListener('click',render);
window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);revoke(videoUrl);revoke(audioUrl);revoke(logoUrl);audioContext?.close()},{once:true});
})();