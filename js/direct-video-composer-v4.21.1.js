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
let videoUrl='',audioUrl='',raf=0,rendering=false;
let audioContext=null,videoNode=null,audioNode=null,videoGain=null,musicGain=null,analyser=null,freq=null,mediaDestination=null;
let logoImage=null,logoUrl='';
const logoInput=$('#producerLogoInputV4210'),logoEnabled=$('#producerLogoEnabledV4210');
const logoPosition=$('#producerLogoPositionV4210'),logoSize=$('#producerLogoSizeV4210'),logoOpacity=$('#producerLogoOpacityV4210');
const overlayText=$('#producerTextV4210'),textStyle=$('#producerTextStyleV4210'),textPosition=$('#producerTextPositionV4210'),textSize=$('#producerTextSizeV4210'),textOpacity=$('#producerTextOpacityV4210');

const selectedEffects=()=>[...document.querySelectorAll('[data-effect]:checked')].map(input=>input.dataset.effect);
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
function overlay(w,h,lv){
 const fx=selectedEffects(),p=effectStrength(),time=video.currentTime||performance.now()*.001;
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
function drawLayers(w,h,lv){
 if(logoImage&&logoEnabled?.checked){const fraction=Number(logoSize?.value||.2),tw=w*fraction,th=tw*(logoImage.naturalHeight/logoImage.naturalWidth),pad=w*.025,pos=logoPosition?.value||'bottom-right';let x=pad,y=pad;if(pos.includes('right'))x=w-tw-pad;if(pos.includes('bottom'))y=h-th-pad;if(pos==='center'){x=(w-tw)/2;y=(h-th)/2}ctx2d.save();ctx2d.globalAlpha=Number(logoOpacity?.value||.9);ctx2d.shadowColor='rgba(190,110,255,.55)';ctx2d.shadowBlur=12+lv.peak*18;ctx2d.drawImage(logoImage,x,y,tw,th);ctx2d.restore()}
 const text=String(overlayText?.value||'').trim();if(!text)return;
 const style=textStyle?.value||'retro',size=Number(textSize?.value||54),opacity=Number(textOpacity?.value||.95),pos=textPosition?.value||'bottom';const families={retro:'Trebuchet MS, sans-serif',arcade:'Courier New, monospace',cyber:'Arial Black, sans-serif',rave:'Arial Black, sans-serif',minimal:'Arial, sans-serif',terminal:'Consolas, monospace'};ctx2d.save();ctx2d.globalAlpha=opacity;ctx2d.textAlign='center';ctx2d.textBaseline='middle';ctx2d.font=`900 ${size}px ${families[style]||'sans-serif'}`;const y=pos==='top'?h*.12:pos==='center'?h*.5:pos==='lower-third'?h*.68:h*.86;
 if(style==='retro'){ctx2d.shadowColor='#ff48bb';ctx2d.shadowBlur=16;ctx2d.strokeStyle='#4eeaff';ctx2d.lineWidth=Math.max(2,size*.055);ctx2d.strokeText(text,w/2,y);ctx2d.fillStyle='#fff'}else if(style==='arcade'){ctx2d.shadowColor='#9d4eff';ctx2d.shadowBlur=0;ctx2d.fillStyle='#fff'}else if(style==='cyber'){ctx2d.shadowColor='#8d4bff';ctx2d.shadowBlur=18;ctx2d.fillStyle='#d9b6ff'}else if(style==='rave'){ctx2d.shadowColor=`hsla(${(video.currentTime*60)%360},100%,65%,.9)`;ctx2d.shadowBlur=24;ctx2d.fillStyle='#fff'}else if(style==='terminal'){ctx2d.shadowColor='#53f7bd';ctx2d.shadowBlur=12;ctx2d.fillStyle='#83ffd1'}else{ctx2d.shadowColor='rgba(0,0,0,.8)';ctx2d.shadowBlur=8;ctx2d.fillStyle='#fff'}ctx2d.fillText(text,w/2,y);ctx2d.restore();
}
function draw(){
 const w=video.videoWidth||1280,h=video.videoHeight||720;
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
 const lv=levels(),fx=selectedEffects(),p=effectStrength();
 ctx2d.save();
 if(fx.includes('beatZoom')){const z=1+lv.bass*p*.05;ctx2d.translate(w/2,h/2);ctx2d.scale(z,z);ctx2d.translate(-w/2,-h/2)}
 if(fx.includes('shake'))ctx2d.translate((Math.random()-.5)*lv.bass*p*15,(Math.random()-.5)*lv.bass*p*11);
 if(fx.includes('rotation')){ctx2d.translate(w/2,h/2);ctx2d.rotate((lv.bass-.2)*p*.025);ctx2d.translate(-w/2,-h/2)}
 ctx2d.filter=fx.includes('monochrome')?'grayscale(1)':fx.includes('posterize')?'contrast(1.5) saturate(1.7)':'none';
 ctx2d.drawImage(video,0,0,w,h);ctx2d.restore();overlay(w,h,lv);
 raf=requestAnimationFrame(draw);
}
async function playPreview(){
 ensureAudioGraph();if(audioContext)await audioContext.resume();
 const start=Math.max(0,Number(startInput.value||0));
 video.currentTime=start;if(audio.src){audio.currentTime=start%Math.max(.01,audio.duration||1);audio.loop=true}syncVolumes();
 await video.play();if(audio.src)await audio.play().catch(()=>{});updateAudioStatus(audioInput.files[0]?.name||'Music playing','Synchronized with the single video preview.',true);cancelAnimationFrame(raf);draw();setStatus('Preview playing. Open Effects to change presets; selections update live.');
}
async function render(){
 ensureAudioGraph();if(audioContext)await audioContext.resume();
 const start=Math.max(0,Number(startInput.value||0)),end=Math.min(video.duration||Infinity,Number(endInput.value||video.duration||0));
 if(!(end>start))return setStatus('End time must be greater than start time.');
 rendering=true;renderButton.disabled=true;previewButton.disabled=true;window.dispatchEvent(new CustomEvent('sos:render-started',{detail:{title:'Producer Hub Project'}}));
 video.currentTime=start;if(audio.src){audio.currentTime=start%Math.max(.01,audio.duration||1);audio.loop=true}syncVolumes();
 const stream=canvas.captureStream(30);mediaDestination?.stream?.getAudioTracks().forEach(track=>stream.addTrack(track));
 const requested=format.value,candidates=requested==='auto'?['video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm']:[requested,'video/webm'];
 const mime=candidates.find(type=>MediaRecorder.isTypeSupported(type))||'video/webm',chunks=[],recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:9000000});
 recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
 recorder.onstop=()=>{const blob=new Blob(chunks,{type:mime}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`sos-finished-project-${Date.now()}.${mime.includes('mp4')?'mp4':'webm'}`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1800);rendering=false;ready();setStatus(`Finished project downloaded as ${mime.includes('mp4')?'MP4':'WEBM'}.`);window.dispatchEvent(new CustomEvent('sos:render-complete',{detail:{title:'Producer Hub Project',format:mime,size:blob.size}}))};
 await video.play();if(audio.src)await audio.play().catch(()=>{});cancelAnimationFrame(raf);draw();recorder.start(250);setStatus('Rendering uploaded video + music with selected effects. Keep this tab open.');
 const monitor=()=>{if(!rendering)return;if(video.currentTime>=end||video.ended){video.pause();audio?.pause();recorder.stop();cancelAnimationFrame(raf);return}requestAnimationFrame(monitor)};monitor();
}
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
 const file=audioInput.files[0];if(!file)return;revoke(audioUrl);audioUrl=URL.createObjectURL(file);audio.src=audioUrl;audio.load();$('#composerAudioNameV4180').textContent=file.name;updateAudioStatus(file.name,'This music is mixed into the single video preview and finished export.',true);setStatus('Music loaded. Preview or render the project.');
});
video.addEventListener('loadedmetadata',()=>{endInput.value=Number(video.duration||0).toFixed(2);ready()});
audio.addEventListener('loadedmetadata',ready);
musicVolume.addEventListener('input',syncVolumes);sourceVolume.addEventListener('input',syncVolumes);
previewButton.addEventListener('click',playPreview);renderButton.addEventListener('click',render);
window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);revoke(videoUrl);revoke(audioUrl);revoke(logoUrl);audioContext?.close()},{once:true});
})();