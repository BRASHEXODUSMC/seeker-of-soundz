/* Seeker Of SoundZ v4.17.1 — Premium Video Effects Studio */
(()=>{
'use strict';
const $=s=>document.querySelector(s),video=$('#studioVideoV4171'),overlay=$('#videoOverlayV4171'),wave=$('#waveformCanvasV4171');
if(!video||!overlay||!wave)return;
const gate=$('#videoStudioGate'),studio=$('#videoEffectsStudio'),status=$('#videoStudioStatusV4171');
let sourceUrl='',sourceFile=null,audioBuffer=null,previewRaf=0,mediaSource=null,audioContext=null,analyser=null,dataArray=null;
const premiumRoles=new Set(['owner','administrator','admin','developer','premium_member']);
function session(){return window.SOS?.getSession?.()||null}
function roleLabel(s){return String(s?.rankName||s?.rank_name||s?.role||'member').toLowerCase().replace(/\s+/g,'_')}
function setStatus(text){status.textContent=text}
function allowed(){const s=session(),role=roleLabel(s);return !!s&&(premiumRoles.has(role)||s.collaborationAccess&&role==='developer')}
function bootAccess(){
 if(allowed()){gate.hidden=true;studio.hidden=false}
 else{gate.innerHTML='<div><p class="sectionEyebrow">Premium Members Only</p><h2>Video Effects Studio is locked</h2><p>Upgrade to Premium Member or ask an administrator for Developer access to use rendering and waveform tools.</p><a class="primaryButton" href="contact.html?type=Collaboration">Request Access</a></div>'}
}
function loadFile(file){
 if(!file)return;
 sourceFile=file;if(sourceUrl)URL.revokeObjectURL(sourceUrl);sourceUrl=URL.createObjectURL(file);
 video.src=sourceUrl;video.load();setStatus(`Loaded ${file.name}.`);
 analyzeFile(file).catch(err=>setStatus(`Video loaded. Waveform analysis is unavailable: ${err.message}`));
}
async function loadUrl(){
 const url=$('#videoUrlV4171').value.trim();if(!url)return;
 sourceFile=null;sourceUrl=url;video.src=url;video.load();setStatus('Video URL loaded. Cross-origin servers may block waveform analysis or rendering.');
 try{const response=await fetch(url,{mode:'cors'});if(!response.ok)throw new Error(`HTTP ${response.status}`);const blob=await response.blob();await analyzeFile(blob)}
 catch(error){setStatus(`Video preview loaded, but waveform analysis is blocked by the source server: ${error.message}`)}
}
async function analyzeFile(blob){
 setStatus('Analyzing audio and generating waveform…');
 const buffer=await blob.arrayBuffer();const C=window.AudioContext||window.webkitAudioContext;if(!C)throw new Error('Web Audio is not supported.');
 const ctx=new C();audioBuffer=await ctx.decodeAudioData(buffer.slice(0));await ctx.close();drawWaveform(audioBuffer);setStatus('Waveform generated. Choose effects and render when ready.');
}
function drawWaveform(buffer){
 const ctx=wave.getContext('2d'),w=wave.width,h=wave.height,data=buffer.getChannelData(0),step=Math.max(1,Math.floor(data.length/w));
 ctx.clearRect(0,0,w,h);ctx.fillStyle='#09060d';ctx.fillRect(0,0,w,h);
 const grad=ctx.createLinearGradient(0,0,w,0);grad.addColorStop(0,'#ffffff');grad.addColorStop(.45,'#b56cff');grad.addColorStop(1,'#6c27c7');
 ctx.strokeStyle=grad;ctx.lineWidth=2;ctx.beginPath();
 for(let x=0;x<w;x++){let min=1,max=-1;const start=x*step;for(let i=0;i<step&&start+i<data.length;i++){const v=data[start+i];if(v<min)min=v;if(v>max)max=v}ctx.moveTo(x,(1+min)*h/2);ctx.lineTo(x,(1+max)*h/2)}
 ctx.stroke();ctx.fillStyle='rgba(190,135,255,.12)';ctx.fillRect(0,h/2-1,w,2);
}
function selectedEffects(){return [...document.querySelectorAll('[data-effect]:checked')].map(x=>x.dataset.effect)}
function strength(){return Number($('#effectStrengthV4171').value||.55)}
function connectAnalyser(streamDestination){
 if(audioContext)return;
 const C=window.AudioContext||window.webkitAudioContext;audioContext=new C();
 mediaSource=audioContext.createMediaElementSource(video);analyser=audioContext.createAnalyser();analyser.fftSize=256;dataArray=new Uint8Array(analyser.frequencyBinCount);
 mediaSource.connect(analyser);analyser.connect(audioContext.destination);if(streamDestination)analyser.connect(streamDestination);
}
function previewLoop(){
 cancelAnimationFrame(previewRaf);const ctx=overlay.getContext('2d'),wrap=$('#videoCanvasWrapV4171'),effects=selectedEffects();
 function draw(){
  const w=video.clientWidth||640,h=video.clientHeight||360;if(overlay.width!==w||overlay.height!==h){overlay.width=w;overlay.height=h}
  ctx.clearRect(0,0,w,h);if(analyser){analyser.getByteFrequencyData(dataArray);const bass=dataArray.slice(0,12).reduce((a,b)=>a+b,0)/(12*255);drawEffects(ctx,w,h,bass,effects)}
  previewRaf=requestAnimationFrame(draw)
 }draw()
}
function drawEffects(ctx,w,h,bass,effects){
 const power=strength(),pulse=bass*power;
 if(effects.includes('glow')){ctx.save();ctx.strokeStyle=`rgba(176,92,255,${.25+pulse*.65})`;ctx.lineWidth=8+pulse*28;ctx.strokeRect(3,3,w-6,h-6);ctx.restore()}
 if(effects.includes('rgb')){ctx.save();ctx.globalCompositeOperation='screen';ctx.fillStyle=`rgba(255,30,90,${pulse*.18})`;ctx.fillRect(pulse*18,0,w,h);ctx.fillStyle=`rgba(0,170,255,${pulse*.16})`;ctx.fillRect(-pulse*18,0,w,h);ctx.restore()}
 if(effects.includes('strobe')&&bass>.72){ctx.fillStyle=`rgba(255,255,255,${Math.min(.28,pulse*.3)})`;ctx.fillRect(0,0,w,h)}
 if(effects.includes('waveform')&&analyser){ctx.save();ctx.strokeStyle='rgba(220,185,255,.9)';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<dataArray.length;i++){const x=i/(dataArray.length-1)*w,y=h*.8-(dataArray[i]/255)*h*.24;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();ctx.restore()}
}
function setupVideo(){
 $('#trimEndV4171').value=Number(video.duration||0).toFixed(2);connectAnalyser();previewLoop();
}
async function render(){
 if(!video.src)return setStatus('Load a video first.');
 const start=Math.max(0,Number($('#trimStartV4171').value||0)),end=Math.min(video.duration||Infinity,Number($('#trimEndV4171').value||video.duration||0));
 if(!(end>start))return setStatus('End time must be greater than start time.');
 const canvas=document.createElement('canvas');canvas.width=video.videoWidth||1280;canvas.height=video.videoHeight||720;const ctx=canvas.getContext('2d');
 const stream=canvas.captureStream(30),audioDest=audioContext?.createMediaStreamDestination();if(audioDest&&analyser)analyser.connect(audioDest);audioDest?.stream.getAudioTracks().forEach(t=>stream.addTrack(t));
 const requested=$('#outputFormatV4171').value,candidates=requested==='auto'?['video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm']: [requested,'video/webm'];
 const mime=candidates.find(x=>MediaRecorder.isTypeSupported(x))||'video/webm',chunks=[],recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:8000000});
 recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
 recorder.onstop=()=>{const blob=new Blob(chunks,{type:mime}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`sos-video-effect-${Date.now()}.${mime.includes('mp4')?'mp4':'webm'}`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);setStatus(`Render complete: ${a.download}`)};
 const effects=selectedEffects(),power=strength();video.currentTime=start;await video.play();recorder.start(250);setStatus(`Rendering ${mime.includes('mp4')?'MP4':'WEBM'}… Keep this tab open.`);
 function frame(){
  if(video.currentTime>=end||video.ended){video.pause();recorder.stop();return}
  if(analyser)analyser.getByteFrequencyData(dataArray);const bass=analyser?dataArray.slice(0,12).reduce((a,b)=>a+b,0)/(12*255):0;
  ctx.save();if(effects.includes('beatZoom')){const z=1+bass*power*.045;ctx.translate(canvas.width/2,canvas.height/2);ctx.scale(z,z);ctx.translate(-canvas.width/2,-canvas.height/2)}
  ctx.filter=effects.includes('glow')?`saturate(${1+bass*power}) contrast(${1+bass*power*.25})`:'none';ctx.drawImage(video,0,0,canvas.width,canvas.height);ctx.restore();drawEffects(ctx,canvas.width,canvas.height,bass,effects);requestAnimationFrame(frame)
 }frame()
}
function downloadWaveform(){
 const a=document.createElement('a');a.href=wave.toDataURL('image/png');a.download=`video-waveform-${Date.now()}.png`;a.click()
}
function exportProject(){
 const project={source:sourceFile?.name||sourceUrl,start:Number($('#trimStartV4171').value||0),end:Number($('#trimEndV4171').value||0),effects:selectedEffects(),strength:strength(),createdAt:new Date().toISOString()};
 const blob=new Blob([JSON.stringify(project,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='sos-video-effects-project.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
}
const drop=$('#videoDropzoneV4171'),input=$('#videoFileV4171');
drop.addEventListener('click',()=>input.click());drop.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();input.click()}});
['dragenter','dragover'].forEach(type=>drop.addEventListener(type,e=>{e.preventDefault();drop.classList.add('isDragging')}));
['dragleave','drop'].forEach(type=>drop.addEventListener(type,e=>{e.preventDefault();drop.classList.remove('isDragging')}));
drop.addEventListener('drop',e=>loadFile(e.dataTransfer.files[0]));input.addEventListener('change',()=>loadFile(input.files[0]));
video.addEventListener('loadedmetadata',setupVideo);$('#loadVideoUrlV4171').onclick=loadUrl;$('#analyzeVideoV4171').onclick=()=>sourceFile?analyzeFile(sourceFile):loadUrl();$('#downloadWaveformV4171').onclick=downloadWaveform;$('#renderVideoV4171').onclick=render;$('#exportProjectV4171').onclick=exportProject;
bootAccess();
})();