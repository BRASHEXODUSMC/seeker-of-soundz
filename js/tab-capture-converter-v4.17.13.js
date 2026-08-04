/* Seeker Of SoundZ v4.17.8 — Authorized Browser Tab Capture Converter */
(()=>{
'use strict';
const $=s=>document.querySelector(s);
const source=$('#tabCaptureSourceV4178'),canvas=$('#tabCaptureCanvasV4178'),wave=$('#tabCaptureWaveformV4178');
if(!source||!canvas||!wave)return;

const startCapture=$('#startTabCaptureV4178'),startRecord=$('#startTabRecordingV4178'),stopRecord=$('#stopTabRecordingV4178');
const downloadVideo=$('#downloadTabVideoV4178'),downloadWav=$('#downloadTabWavV4178'),downloadWave=$('#downloadTabWaveformV4178');
const status=$('#tabCaptureStatusV4178');
const selectedThumb=$('#selectedCaptureThumbV41710'),selectedTitle=$('#selectedCaptureTitleV41710'),selectedUrl=$('#selectedCaptureUrlV41710');
const openSelectedTab=$('#openSelectedPlaybackTabV41710'),captureSelectedTab=$('#captureSelectedTabV41710');
const finishDownload=$('#finishAndDownloadVideoV41711'),togglePreviewSize=$('#toggleCapturePreviewSizeV41711'),compactPreview=$('#compactCapturePreviewV41711');
let selectedProject=null,playbackWindow=null;
let displayStream=null,audioContext=null,audioSource=null,analyser=null,freq=null,timeData=null,processor=null,silentGain=null;
let animation=0,recorder=null,chunks=[],recordedBlob=null,wavBlob=null,pcmChunks=[],recording=false,lastTime=0,pendingAutoRecord=false,autoDownloadFinished=false;

const selectedEffects=()=>[...document.querySelectorAll('[data-effect]:checked')].map(x=>x.dataset.effect);
const strength=()=>Number($('#effectStrengthV4171')?.value||.55);
const sensitivity=()=>Number($('#beatSensitivityV4172')?.value||1);

function setStatus(mode,title,copy){
 const dot=status?.querySelector('[data-tab-capture-dot]');
 const heading=status?.querySelector('[data-tab-capture-title]');
 const text=status?.querySelector('[data-tab-capture-copy]');
 if(dot)dot.className=`compatibilityDotV4173 ${mode}`;
 if(heading)heading.textContent=title;
 if(text)text.textContent=copy;
}
function downloadBlob(blob,name){
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1800);
}
function writeAscii(view,offset,text){for(let i=0;i<text.length;i++)view.setUint8(offset+i,text.charCodeAt(i))}
function makeWav(chunks,sampleRate){
 const length=chunks.reduce((sum,c)=>sum+c.length,0),samples=new Float32Array(length);let offset=0;
 chunks.forEach(c=>{samples.set(c,offset);offset+=c.length});
 const buffer=new ArrayBuffer(44+samples.length*2),view=new DataView(buffer);
 writeAscii(view,0,'RIFF');view.setUint32(4,36+samples.length*2,true);writeAscii(view,8,'WAVE');writeAscii(view,12,'fmt ');
 view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);writeAscii(view,36,'data');view.setUint32(40,samples.length*2,true);
 for(let i=0;i<samples.length;i++){const v=Math.max(-1,Math.min(1,samples[i]));view.setInt16(44+i*2,v<0?v*32768:v*32767,true)}
 return new Blob([buffer],{type:'audio/wav'});
}
function energy(){
 if(!analyser||!freq)return {bass:.25,mid:.2,high:.18,peak:.25};
 analyser.getByteFrequencyData(freq);
 const avg=(a,b)=>{let sum=0,count=0;for(let i=a;i<Math.min(b,freq.length);i++){sum+=freq[i];count++}return count?sum/(count*255):0};
 const bass=Math.min(1,avg(0,18)*sensitivity()),mid=Math.min(1,avg(18,70)*sensitivity()),high=Math.min(1,avg(70,freq.length)*sensitivity());
 return {bass,mid,high,peak:Math.max(bass,mid,high)};
}
function drawWaveform(){
 const ctx=wave.getContext('2d'),w=wave.width,h=wave.height;
 ctx.clearRect(0,0,w,h);ctx.fillStyle='#08050c';ctx.fillRect(0,0,w,h);
 if(!analyser||!timeData)return;
 analyser.getByteTimeDomainData(timeData);
 const grad=ctx.createLinearGradient(0,0,w,0);grad.addColorStop(0,'#fff');grad.addColorStop(.45,'#c57cff');grad.addColorStop(1,'#6320bd');
 ctx.strokeStyle=grad;ctx.lineWidth=3;ctx.beginPath();
 for(let i=0;i<timeData.length;i++){const x=i/(timeData.length-1)*w,y=timeData[i]/255*h;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}
 ctx.stroke();
}
function noise(ctx,w,h,amount=.4){
 ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.18+amount*.25;
 const count=Math.round(w*h*.0012*amount);
 for(let i=0;i<count;i++){const s=Math.random()>.5?255:20;ctx.fillStyle=`rgb(${s},${s},${s})`;ctx.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*3,1+Math.random()*2)}
 ctx.restore();
}
function effects(ctx,w,h,levels){
 const fx=selectedEffects(),p=strength(),{bass,mid,high,peak}=levels,t=performance.now()*.001;
 if(fx.includes('tvStatic'))noise(ctx,w,h,.5+high*.5);
 if(fx.includes('heavyStatic')){noise(ctx,w,h,.95);ctx.fillStyle='rgba(255,255,255,.16)';ctx.fillRect(0,(performance.now()*.32)%h,w,5+high*15)}
 if(fx.includes('signalTear')){for(let i=0;i<5+Math.floor(peak*6);i++){ctx.fillStyle=`rgba(185,55,255,${.08+peak*.16})`;ctx.fillRect((Math.random()-.5)*w*.12,Math.random()*h,w,3+Math.random()*h*.045)}}
 if(fx.includes('channelGhost')){const d=Math.sin(performance.now()*.0018)*w*.02;ctx.fillStyle=`rgba(255,30,85,${.05+mid*.08})`;ctx.fillRect(d,0,w,h);ctx.fillStyle=`rgba(20,185,255,${.05+high*.08})`;ctx.fillRect(-d,0,w,h)}
 if(fx.includes('scanlines')){ctx.fillStyle='rgba(0,0,0,.22)';for(let y=(t*40)%6;y<h;y+=6)ctx.fillRect(0,y,w,2)}
 if(fx.includes('glow')){ctx.strokeStyle=`rgba(181,92,255,${.25+bass*.65})`;ctx.lineWidth=8+bass*24;ctx.strokeRect(4,4,w-8,h-8)}
 if(fx.includes('rgb')){ctx.globalCompositeOperation='screen';ctx.fillStyle=`rgba(255,20,80,${bass*p*.1})`;ctx.fillRect(bass*14,0,w,h);ctx.fillStyle=`rgba(0,180,255,${mid*p*.1})`;ctx.fillRect(-mid*14,0,w,h);ctx.globalCompositeOperation='source-over'}
 if(fx.includes('strobe')&&peak>.75){ctx.fillStyle=`rgba(255,255,255,${Math.min(.24,peak*p*.25)})`;ctx.fillRect(0,0,w,h)}
 if(fx.includes('vignette')){const g=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.2,w/2,h/2,Math.max(w,h)*.68);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.7)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h)}
 if(fx.includes('letterbox')){ctx.save();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';const b=h*.115;ctx.fillStyle='#000';ctx.fillRect(0,0,w,b);ctx.fillRect(0,h-b,w,b);ctx.restore()}
 if(fx.includes('ultrawideBars')){ctx.save();ctx.globalAlpha=1;const b=h*.18;ctx.fillStyle='#000';ctx.fillRect(0,0,w,b);ctx.fillRect(0,h-b,w,b);ctx.restore()}
 if(fx.includes('animeBars')){ctx.save();ctx.globalAlpha=1;const b=h*(.07+peak*.09),s=w*.055;ctx.fillStyle='#000';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(w,0);ctx.lineTo(w-s,b);ctx.lineTo(s,b);ctx.fill();ctx.beginPath();ctx.moveTo(s,h-b);ctx.lineTo(w-s,h-b);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.fill();ctx.restore()}
 if(fx.includes('retroCinemaBars')){ctx.save();ctx.globalAlpha=1;const b=h*.13;ctx.fillStyle='#030303';ctx.fillRect(0,0,w,b);ctx.fillRect(0,h-b,w,b);ctx.strokeStyle='rgba(255,245,220,.14)';ctx.strokeRect(4,b+4,w-8,h-b*2-8);ctx.restore()}
 if(fx.includes('laserGrid')){ctx.save();ctx.translate(w/2,h);ctx.strokeStyle=`rgba(170,65,255,${.2+peak*.65})`;for(let i=-9;i<=9;i++){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(i*w*.12,-h);ctx.stroke()}ctx.restore()}
 if(fx.includes('waveform')||fx.includes('oscilloscope')){ctx.save();ctx.drawImage(wave,0,h*.72,w,h*.25);ctx.restore()}
 if(fx.includes('audioBars')&&freq){ctx.fillStyle='rgba(190,105,255,.62)';const bars=48,gap=3,bw=(w-gap*(bars-1))/bars;for(let i=0;i<bars;i++){const v=freq[Math.floor(i/bars*freq.length)]/255;ctx.fillRect(i*(bw+gap),h,bw,-v*h*.28)}}
 if(fx.includes('horizonGlow')){const y=h*(.68-bass*.08),g=ctx.createLinearGradient(0,y-25,0,y+25);g.addColorStop(0,'rgba(120,50,255,0)');g.addColorStop(.5,`rgba(220,175,255,${.35+peak*.45})`);g.addColorStop(1,'rgba(60,210,255,0)');ctx.fillStyle=g;ctx.fillRect(0,y-25,w,50)}
 if(fx.includes('circleSpectrum')&&freq){ctx.save();ctx.translate(w/2,h/2);for(let i=0;i<48;i++){const v=freq[Math.floor(i/48*freq.length)]/255,r=Math.min(w,h)*.18;ctx.rotate(Math.PI*2/48);ctx.strokeStyle=`rgba(${120+i*2},${80+i*3},255,${.25+v*.65})`;ctx.beginPath();ctx.moveTo(r,0);ctx.lineTo(r+v*Math.min(w,h)*.18,0);ctx.stroke()}ctx.restore()}
}
function renderLoop(){
 cancelAnimationFrame(animation);
 const ctx=canvas.getContext('2d');
 const loop=()=>{
  if(!displayStream)return;
  const w=source.videoWidth||1280,h=source.videoHeight||720;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
  const lv=energy(),fx=selectedEffects(),p=strength();
  ctx.save();
  if(fx.includes('beatZoom')){const z=1+lv.bass*p*.05;ctx.translate(w/2,h/2);ctx.scale(z,z);ctx.translate(-w/2,-h/2)}
  if(fx.includes('shake'))ctx.translate((Math.random()-.5)*lv.bass*p*16,(Math.random()-.5)*lv.bass*p*12);
  if(fx.includes('rotation')){ctx.translate(w/2,h/2);ctx.rotate((lv.bass-.2)*p*.025);ctx.translate(-w/2,-h/2)}
  ctx.filter=fx.includes('monochrome')?'grayscale(1)':fx.includes('hueShift')?`hue-rotate(${(performance.now()*.04)%360}deg)`:'none';
  ctx.drawImage(source,0,0,w,h);ctx.restore();drawWaveform();effects(ctx,w,h,lv);
  animation=requestAnimationFrame(loop);
 };
 loop();
}
function showSelectedProject(detail){
 selectedProject=detail?.url?detail:selectedProject;
 if(!selectedProject)return;
 if(selectedThumb)selectedThumb.src=selectedProject.thumbnail||`https://i.ytimg.com/vi/${selectedProject.id}/hqdefault.jpg`;
 if(selectedTitle)selectedTitle.textContent='YouTube project selected for capture';
 if(selectedUrl)selectedUrl.textContent=selectedProject.url;
 if(openSelectedTab)openSelectedTab.disabled=false;
 if(captureSelectedTab)captureSelectedTab.disabled=false;
 setStatus('isWaiting','Selected YouTube project is visible','Open the playback tab first. Then return here and choose that tab with Share tab audio enabled.');
}
function openSelectedPlayback(){
 if(!selectedProject?.url)return setStatus('isInvalid','No YouTube project selected','Choose a video from the Project Picker above.');
 playbackWindow=window.open(selectedProject.url,'sosYouTubeCaptureTab');
 setStatus(playbackWindow?'isWaiting':'isInvalid',playbackWindow?'Playback tab opened':'Popup blocked',playbackWindow?'Start the video in that tab, return here, then click Choose Selected Tab & Auto Record.':'Allow popups for this site, then try again.');
}
async function startCaptureFlow(options={}){
 pendingAutoRecord=!!options.autoRecord;downloadVideo.disabled=true;downloadWav.disabled=true;downloadWave.disabled=true;if(finishDownload)finishDownload.disabled=true;recordedBlob=null;wavBlob=null;autoDownloadFinished=false;
 if(!navigator.mediaDevices?.getDisplayMedia){setStatus('isInvalid','Tab capture unsupported','This browser does not support getDisplayMedia. Use current Chrome, Edge, or Firefox over HTTPS.');return}
 try{
  displayStream=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:30},audio:true,preferCurrentTab:false,selfBrowserSurface:'exclude',surfaceSwitching:'include',systemAudio:'include'});
  const audioTracks=displayStream.getAudioTracks();
  source.srcObject=displayStream;source.hidden=false;await source.play();
  if(audioTracks.length){
   audioContext=new (window.AudioContext||window.webkitAudioContext)();await audioContext.resume();
   audioSource=audioContext.createMediaStreamSource(new MediaStream(audioTracks));
   analyser=audioContext.createAnalyser();analyser.fftSize=2048;freq=new Uint8Array(analyser.frequencyBinCount);timeData=new Uint8Array(analyser.fftSize);
   processor=audioContext.createScriptProcessor(4096,2,1);silentGain=audioContext.createGain();silentGain.gain.value=0;
   audioSource.connect(analyser);audioSource.connect(processor);processor.connect(silentGain);silentGain.connect(audioContext.destination);
   processor.onaudioprocess=e=>{
    if(!recording)return;
    const channels=e.inputBuffer.numberOfChannels,length=e.inputBuffer.length,mono=new Float32Array(length);
    for(let channel=0;channel<channels;channel++){
     const input=e.inputBuffer.getChannelData(channel);
     for(let i=0;i<length;i++)mono[i]+=input[i]/channels;
    }
    pcmChunks.push(mono);
   };
   setStatus('isSupported','Tab and audio captured','Real audio waveform is active. Select effects, then record.');
  }else{
   setStatus('isLimited','Tab captured without audio','Restart capture and enable “Share tab audio” to generate a real waveform and WAV.');
  }
  startRecord.disabled=false;downloadWave.disabled=false;renderLoop();
  displayStream.getTracks().forEach(track=>track.addEventListener('ended',stopCapture,{once:true}));
  if(pendingAutoRecord){
   if(audioTracks.length){
    setStatus('isSupported','Capture approved — recording starts automatically','The selected tab video and real tab audio are now recording with the chosen effects.');
    setTimeout(()=>{if(displayStream&&!recording)startRecording()},550);
   }else{
    pendingAutoRecord=false;
    setStatus('isLimited','Tab selected, but Share tab audio is off','Restart using Choose Selected Tab & Auto Record and enable Share tab audio. Recording did not start so you do not end up with a silent WAV.');
   }
  }
 }catch(error){setStatus('isInvalid','Capture cancelled or blocked',error.message)}
}
function startRecording(){
 if(!displayStream)return;
 const out=canvas.captureStream(30);
 displayStream.getAudioTracks().forEach(track=>out.addTrack(track));
 const types=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];const mime=types.find(t=>MediaRecorder.isTypeSupported(t))||'video/webm';
 chunks=[];pcmChunks=[];recordedBlob=null;wavBlob=null;recorder=new MediaRecorder(out,{mimeType:mime,videoBitsPerSecond:9000000});
 recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
 recorder.onstop=()=>{
  recordedBlob=new Blob(chunks,{type:mime});downloadVideo.disabled=false;
  const sampleCount=pcmChunks.reduce((sum,chunk)=>sum+chunk.length,0);
  if(sampleCount>Math.max(4096,(audioContext?.sampleRate||44100)/4)&&audioContext){
   wavBlob=makeWav(pcmChunks,audioContext.sampleRate);downloadWav.disabled=false;
   setStatus('isSupported','Finished video created','The processed video is ready, including the selected overlays and captured tab audio.');
  }else{
   wavBlob=null;downloadWav.disabled=true;
   setStatus('isLimited','Finished video created without usable WAV samples','The video is ready. Repeat capture with Share tab audio enabled if you also need a WAV file.');
  }
  downloadWave.disabled=false;
  if(finishDownload)finishDownload.disabled=true;
  if(autoDownloadFinished&&recordedBlob){
   autoDownloadFinished=false;
   downloadBlob(recordedBlob,`sos-finished-video-${Date.now()}.webm`);
   setStatus('isSupported','Finished video downloaded','Your rendered video with overlays and captured audio has been downloaded.');
  }
 };
 recording=true;recorder.start(250);startRecord.disabled=true;stopRecord.disabled=false;if(finishDownload)finishDownload.disabled=false;
 setStatus('isSupported','Recording with selected effects','Keep the shared video playing, then use Finish, Build & Download Video.');
}
function stopRecording(options={}){
 if(!recorder||recorder.state==='inactive')return;
 autoDownloadFinished=!!options.autoDownload;
 recorder.stop();
 recording=false;stopRecord.disabled=true;startRecord.disabled=false;
 if(finishDownload)finishDownload.disabled=true;
 setStatus('isWaiting',options.autoDownload?'Building finished video…':'Building saved recording…','Please wait while the browser combines the processed canvas and captured audio.');
}
function stopCapture(){
 cancelAnimationFrame(animation);recording=false;
 if(recorder&&recorder.state!=='inactive')recorder.stop();
 displayStream?.getTracks().forEach(t=>t.stop());displayStream=null;source.srcObject=null;
 processor?.disconnect();audioSource?.disconnect();analyser?.disconnect();audioContext?.close();
 setStatus('isWaiting','Capture stopped','Start a new tab capture when ready.');
}
startCapture.onclick=()=>startCaptureFlow({autoRecord:false});
startRecord.onclick=startRecording;
stopRecord.onclick=()=>stopRecording({autoDownload:false});
finishDownload?.addEventListener('click',()=>stopRecording({autoDownload:true}));
togglePreviewSize?.addEventListener('click',()=>{
 const expanded=compactPreview?.classList.toggle('isExpanded');
 togglePreviewSize.textContent=expanded?'Compact Preview':'Expand Preview';
});
downloadVideo.onclick=()=>recordedBlob&&downloadBlob(recordedBlob,`sos-tab-capture-${Date.now()}.webm`);
downloadWav.onclick=()=>wavBlob&&downloadBlob(wavBlob,`sos-captured-audio-${Date.now()}.wav`);
downloadWave.onclick=async()=>downloadBlob(await (await fetch(wave.toDataURL('image/png'))).blob(),`sos-real-waveform-${Date.now()}.png`);
window.addEventListener('sos:youtube-project-selected',event=>showSelectedProject(event.detail||{}));
window.addEventListener('sos:start-youtube-tab-capture',event=>{
 const detail=event.detail||{};if(detail.url)showSelectedProject(detail);
 setStatus('isWaiting','Choose the YouTube playback tab','In the browser share dialog, choose the playback tab and enable Share tab audio.');
 startCaptureFlow({autoRecord:detail.autoRecord!==false});
});
openSelectedTab?.addEventListener('click',event=>{event.preventDefault();openSelectedPlayback()});
captureSelectedTab?.addEventListener('click',event=>{
 event.preventDefault();
 if(!selectedProject?.url)return setStatus('isInvalid','No YouTube project selected','Choose a video from the Project Picker above.');
 setStatus('isWaiting','Choose the visible YouTube playback tab','Enable Share tab audio in the browser picker. Recording will start automatically after approval.');
 startCaptureFlow({autoRecord:true});
});
window.addEventListener('pagehide',stopCapture,{once:true});
})();