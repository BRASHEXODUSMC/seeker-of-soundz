/* Seeker Of SoundZ v4.17.2 — Expanded Premium Video Effects Studio */
(()=>{
'use strict';
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const video=$('#studioVideoV4171'),overlay=$('#videoOverlayV4171'),wave=$('#waveformCanvasV4171');
if(!video||!overlay||!wave)return;

const gate=$('#videoStudioGate'),studio=$('#videoEffectsStudio'),status=$('#videoStudioStatusV4171');
const sourceDownload=$('#downloadSourceVideoV4172'),waveDownload=$('#downloadWaveformV4171');
const assetStatus=$('#videoAssetStatusV4172'),nativeWrap=$('#videoCanvasWrapV4171');
const youtubePreview=$('#youtubePreviewV4173'),youtubeFrame=$('#youtubeFrameV4173');
const copyYouTube=$('#copyYouTubeUrlV4173'),openYouTube=$('#openYouTubeV4173');
const compatibility=$('#videoCompatibilityV4173');
const youtubeStage=$('#youtubePlayerStageV4174'),youtubeOverlay=$('#youtubeOverlayV4174');
const waveformNotice=$('#waveformModeNoticeV4174'),replaceYouTube=$('#replaceYouTubeSourceV4174');
let sourceUrl='',sourceFile=null,sourceBlob=null,audioBuffer=null,sourceMode='none',youtubeUrl='';
let youtubePlayer=null,youtubeDuration=0,youtubeAnimation=0,youtubeSeed=1,youtubeReady=false;
let previewRaf=0,mediaSource=null,audioContext=null,analyser=null,dataArray=null,timeArray=null;
let particlePool=[],lastPeak=0,lastFrame=0;
let playedWaveformHistory=[],lastWaveSampleAt=0;
const waveformDataDownload=$('#downloadWaveformDataV4175'),guideWavDownload=$('#downloadGuideWavV4175'),exactWavDownload=$('#downloadExactWavV4175');
const youtubeSearch=$('#youtubeSearchV4175'),youtubeSearchButton=$('#searchYouTubeV4175'),clipboardButton=$('#useClipboardVideoV4175'),recentProjects=$('#youtubeRecentProjectsV4175');

const premiumRoles=new Set(['owner','administrator','admin','developer','premium_member']);
const presets={
 dubstep:['beatZoom','rgb','glitchBars','dataMosh','subPulse','dropFlash','audioBars'],
 vhs:['tvStatic','scanlines','vhs','filmGrain','rgb','vignette'],
 festival:['laserGrid','particles','sparkles','glow','strobe','hueShift','beatZoom'],
 cinematic:['filmGrain','dust','vignette','letterbox','lightLeaks','glow'],
 riddim:['beatZoom','glitchBars','dataMosh','subPulse','gridFlash','chromaticPulse','dropFlash'],
 tearout:['shake','rgb','pixelate','dropFlash','strobe','glitchBars','tvStatic','zoomBlur'],
 melodic:['glow','particles','sparkles','lightLeaks','hueShift','circleSpectrum','waveform'],
 dnb:['shake','audioBars','oscilloscope','laserGrid','gridFlash','beatZoom','horizonGlow'],
 colorbass:['hueShift','chromaticPulse','glow','neonEdges','sparkles','circleSpectrum'],
 retroclub:['vhs','scanlines','tvStatic','filmGrain','digitalRain','horizonGlow','rgb'],
 minimal:['waveform','vignette','horizonGlow'],
 maximal:['beatZoom','rgb','glitchBars','dataMosh','subPulse','dropFlash','audioBars','tvStatic','scanlines','vhs','filmGrain','particles','sparkles','laserGrid','hueShift','shake','circleSpectrum','gridFlash','chromaticPulse']
};

function session(){return window.SOS?.getSession?.()||null}
function roleLabel(value){return String(value?.rankName||value?.rank_name||value?.role||'member').toLowerCase().replace(/\s+/g,'_')}
function allowed(){const current=session(),role=roleLabel(current);return !!current&&(premiumRoles.has(role)||(current.collaborationAccess&&role==='developer'))}
function setStatus(text){if(status)status.textContent=text}
function downloadBlob(blob,name){
 const anchor=document.createElement('a');anchor.href=URL.createObjectURL(blob);anchor.download=name;anchor.click();setTimeout(()=>URL.revokeObjectURL(anchor.href),1800);
}
function writeAscii(view,offset,text){for(let i=0;i<text.length;i++)view.setUint8(offset+i,text.charCodeAt(i))}
function pcm16Wav(samples,sampleRate=44100,channels=1){
 const frames=samples.length,buffer=new ArrayBuffer(44+frames*2),view=new DataView(buffer);
 writeAscii(view,0,'RIFF');view.setUint32(4,36+frames*2,true);writeAscii(view,8,'WAVE');writeAscii(view,12,'fmt ');
 view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,channels,true);view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*channels*2,true);view.setUint16(32,channels*2,true);view.setUint16(34,16,true);writeAscii(view,36,'data');view.setUint32(40,frames*2,true);
 for(let i=0;i<frames;i++){const value=Math.max(-1,Math.min(1,samples[i]||0));view.setInt16(44+i*2,value<0?value*32768:value*32767,true)}
 return new Blob([buffer],{type:'audio/wav'});
}
function syntheticGuideSamples(duration){
 const sampleRate=22050,maxDuration=Math.min(Math.max(1,duration||30),600),length=Math.floor(maxDuration*sampleRate),samples=new Float32Array(length);
 for(let i=0;i<length;i++){const t=i/sampleRate,levels=youtubeLevels(t),carrier=Math.sin(Math.PI*2*(90+levels.mid*220)*t),click=Math.sin(Math.PI*2*950*t)*Math.pow(Math.max(0,Math.sin(Math.PI*2*.82*t)),14);samples[i]=(carrier*levels.bass*.18+click*.09)*.7}
 return {samples,sampleRate};
}
function audioBufferToMono(buffer){
 const length=buffer.length,mono=new Float32Array(length),channels=buffer.numberOfChannels;
 for(let channel=0;channel<channels;channel++){const data=buffer.getChannelData(channel);for(let i=0;i<length;i++)mono[i]+=data[i]/channels}
 return mono;
}
function recordWavePoint(time,levels,mode){
 const now=performance.now();if(now-lastWaveSampleAt<100)return;lastWaveSampleAt=now;
 playedWaveformHistory.push({time:Number(time.toFixed(3)),bass:Number(levels.bass.toFixed(4)),mid:Number(levels.mid.toFixed(4)),high:Number(levels.high.toFixed(4)),peak:Number(levels.peak.toFixed(4)),mode});
 if(playedWaveformHistory.length>18000)playedWaveformHistory.shift();
 if(waveformDataDownload)waveformDataDownload.disabled=playedWaveformHistory.length<2;
}
function saveRecentYouTube(url){
 const id=youtubeId(url);if(!id)return;
 let rows=[];try{rows=JSON.parse(localStorage.getItem('sos_recent_youtube_projects_v4175')||'[]')}catch{}
 rows=[{id,url,addedAt:new Date().toISOString()},...rows.filter(row=>row.id!==id)].slice(0,12);
 localStorage.setItem('sos_recent_youtube_projects_v4175',JSON.stringify(rows));renderRecentYouTube();
}
function renderRecentYouTube(){
 if(!recentProjects)return;let rows=[];try{rows=JSON.parse(localStorage.getItem('sos_recent_youtube_projects_v4175')||'[]')}catch{}
 recentProjects.innerHTML=rows.length?rows.map(row=>`<article><img src="https://i.ytimg.com/vi/${row.id}/hqdefault.jpg" alt="YouTube thumbnail" loading="lazy"><div><strong>YouTube project</strong><small>${row.id}</small><button type="button" class="smallAction" data-use-recent-youtube="${row.url}">Use This Video</button></div></article>`).join(''):'<p>No recent YouTube projects yet.</p>';
}
function preserveScroll(action){
 const x=window.scrollX,y=window.scrollY;const result=action();requestAnimationFrame(()=>window.scrollTo(x,y));return result;
}
function youtubeId(value){
 try{
  const url=new URL(value,location.href);
  const host=url.hostname.replace(/^www\./,'').toLowerCase();
  if(host==='youtu.be')return url.pathname.split('/').filter(Boolean)[0]||'';
  if(host.endsWith('youtube.com')){
   if(url.pathname.startsWith('/shorts/'))return url.pathname.split('/')[2]||'';
   if(url.pathname.startsWith('/embed/'))return url.pathname.split('/')[2]||'';
   return url.searchParams.get('v')||'';
  }
 }catch{}
 return '';
}
function directVideoUrl(value){
 try{
  const url=new URL(value,location.href);
  return /\.(mp4|webm|ogg|mov|m4v)(?:$|[?#])/i.test(url.pathname+url.search+url.hash);
 }catch{return false}
}
function setCompatibility(state,title,copy){
 if(!compatibility)return;
 const dot=compatibility.querySelector('[data-compatibility-dot]');
 const heading=compatibility.querySelector('[data-compatibility-title]');
 const text=compatibility.querySelector('[data-compatibility-copy]');
 dot.className=`compatibilityDotV4173 ${state}`;
 if(heading)heading.textContent=title;
 if(text)text.textContent=copy;
}
function loadYouTubeApi(){
 if(window.YT?.Player)return Promise.resolve(window.YT);
 return new Promise((resolve,reject)=>{
  const existing=document.querySelector('script[data-sos-youtube-api]');
  if(existing){
   const wait=setInterval(()=>{if(window.YT?.Player){clearInterval(wait);resolve(window.YT)}},60);
   setTimeout(()=>{clearInterval(wait);reject(new Error('YouTube Player API timed out.'))},10000);
   return;
  }
  const previous=window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady=()=>{previous?.();resolve(window.YT)};
  const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true;script.dataset.sosYoutubeApi='1';script.onerror=()=>reject(new Error('YouTube Player API failed to load.'));document.head.appendChild(script);
 });
}
function hashSeed(value){
 let hash=2166136261;for(const char of String(value)){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619)}return Math.abs(hash)||1;
}
function seededValue(index){
 const x=Math.sin((index+1)*12.9898+youtubeSeed*.0001)*43758.5453;
 return x-Math.floor(x);
}
function youtubeLevels(time){
 const beat=Math.max(0,Math.sin(time*Math.PI*2*.82));
 const half=Math.max(0,Math.sin(time*Math.PI*2*.41+.7));
 const texture=(Math.sin(time*2.7+youtubeSeed%11)+1)/2;
 const bass=Math.min(1,(beat*.62+half*.25+texture*.13)*sensitivity());
 const mid=Math.min(1,((Math.sin(time*4.1+1.4)+1)/2*.58+beat*.22)*sensitivity());
 const high=Math.min(1,((Math.sin(time*7.6+2.2)+1)/2*.52+texture*.28)*sensitivity());
 return {bass,mid,high,peak:Math.max(bass,mid,high)};
}
function fillSyntheticArrays(time){
 if(!dataArray)dataArray=new Uint8Array(256);
 if(!timeArray)timeArray=new Uint8Array(512);
 for(let i=0;i<dataArray.length;i++){
  const band=i/dataArray.length,falloff=1-band*.72;
  const pulse=(Math.sin(time*(3.4+band*8)+i*.17+youtubeSeed*.001)+1)/2;
  dataArray[i]=Math.max(0,Math.min(255,Math.round((pulse*.55+seededValue(i)*.45)*255*falloff)));
 }
 for(let i=0;i<timeArray.length;i++)timeArray[i]=128+Math.round(Math.sin(i*.12+time*4.8)*54+Math.sin(i*.031+time*2.1)*22);
}
function drawSyntheticWaveform(duration,current=0){
 const context=wave.getContext('2d'),width=wave.width,height=wave.height;
 context.clearRect(0,0,width,height);context.fillStyle='#09060d';context.fillRect(0,0,width,height);
 const gradient=context.createLinearGradient(0,0,width,0);gradient.addColorStop(0,'#fff');gradient.addColorStop(.45,'#c178ff');gradient.addColorStop(1,'#6420c2');
 context.strokeStyle=gradient;context.lineWidth=2;context.beginPath();
 for(let x=0;x<width;x++){
  const t=x/width*Math.max(1,duration),envelope=.25+.55*seededValue(Math.floor(x/4))+.2*Math.max(0,Math.sin(t*Math.PI*1.64));
  const amp=Math.min(.95,envelope),top=height/2-amp*height*.42,bottom=height/2+amp*height*.42;
  context.moveTo(x,top);context.lineTo(x,bottom);
 }
 context.stroke();
 const progress=duration?Math.max(0,Math.min(1,current/duration)):0;
 context.fillStyle='rgba(255,255,255,.14)';context.fillRect(0,0,width*progress,height);
 context.fillStyle='#73ffb5';context.fillRect(width*progress-2,0,4,height);
 context.fillStyle='rgba(255,255,255,.7)';context.font='20px sans-serif';context.fillText('YouTube synchronized visual waveform',22,31);
}
function applyYouTubeCss(levels,effects){
 const frame=youtubePlayer?.getIframe?.()||$('#youtubeFrameV4173');if(!frame)return;
 const power=strength(),{bass,mid,high}=levels,transforms=[],filters=[];
 if(effects.includes('beatZoom'))transforms.push(`scale(${1+bass*power*.045})`);
 if(effects.includes('shake'))transforms.push(`translate(${(Math.random()-.5)*bass*power*12}px,${(Math.random()-.5)*bass*power*9}px)`);
 if(effects.includes('rotation'))transforms.push(`rotate(${(bass-.2)*power*1.5}deg)`);
 if(effects.includes('bounce'))transforms.push(`translateY(${-bass*power*9}px)`);
 if(effects.includes('monochrome'))filters.push('grayscale(1)');
 if(effects.includes('hueShift'))filters.push(`hue-rotate(${(youtubePlayer?.getCurrentTime?.()||0)*38+high*160}deg)`);
 if(effects.includes('glow'))filters.push(`saturate(${1+bass*1.2}) contrast(${1+bass*.25})`);
 frame.style.transform=transforms.join(' ')||'none';frame.style.filter=filters.join(' ')||'none';
}
function youtubePreviewLoop(){
 cancelAnimationFrame(youtubeAnimation);
 const context=youtubeOverlay?.getContext('2d');
 const loop=()=>{
  if(sourceMode!=='youtube'||!youtubePlayer||!youtubeOverlay||!context)return;
  const rect=youtubeStage.getBoundingClientRect(),width=Math.max(1,Math.round(rect.width)),height=Math.max(1,Math.round(rect.height));
  if(youtubeOverlay.width!==width||youtubeOverlay.height!==height){youtubeOverlay.width=width;youtubeOverlay.height=height}
  const time=Number(youtubePlayer.getCurrentTime?.()||0),levels=youtubeLevels(time),effects=selectedEffects();
  fillSyntheticArrays(time);recordWavePoint(time,levels,'youtube-guide');applyYouTubeCss(levels,effects);context.clearRect(0,0,width,height);drawEffects(context,width,height,levels,effects,false);
  if(youtubeDuration)drawSyntheticWaveform(youtubeDuration,time);
  youtubeAnimation=requestAnimationFrame(loop);
 };
 youtubeAnimation=requestAnimationFrame(loop);
}
async function createYouTubePlayer(id){
 await loadYouTubeApi();
 youtubeReady=false;
 youtubePlayer?.destroy?.();
 const old=$('#youtubeFrameV4173');old?.remove();
 const target=document.createElement('div');target.id='youtubeFrameV4173';
 youtubeStage.insertBefore(target,youtubeOverlay);
 youtubePlayer=new YT.Player(target,{
  videoId:id,
  playerVars:{rel:0,playsinline:1,modestbranding:1,enablejsapi:1,origin:location.origin},
  events:{
   onReady:event=>{
    youtubeReady=true;youtubeDuration=Number(event.target.getDuration()||0);
    $('#trimEndV4171').value=youtubeDuration.toFixed(2);
    drawSyntheticWaveform(youtubeDuration,0);waveDownload.disabled=false;if(guideWavDownload)guideWavDownload.disabled=false;if(exactWavDownload)exactWavDownload.disabled=true;setReady('waveform',true,'synchronized visual guide');
    if(waveformNotice){waveformNotice.hidden=false;waveformNotice.textContent='YouTube mode uses a deterministic waveform synchronized to playback time. Upload the original file for exact audio analysis and final edited-video export.'}
    youtubePreviewLoop();
   },
   onStateChange:()=>youtubePreviewLoop()
  }
 });
}
function showNative(){
 sourceMode='native';youtubeUrl='';cancelAnimationFrame(youtubeAnimation);youtubePlayer?.pauseVideo?.();
 if(youtubePreview)youtubePreview.hidden=true;
 if(nativeWrap)nativeWrap.hidden=false;
 if(waveformNotice)waveformNotice.hidden=true;
}
function showYouTube(url,id){
 sourceMode='youtube';youtubeUrl=url;sourceUrl=url;sourceFile=null;sourceBlob=null;youtubeSeed=hashSeed(id);
 video.pause();video.removeAttribute('src');video.load();
 if(nativeWrap)nativeWrap.hidden=true;
 if(youtubePreview)youtubePreview.hidden=false;
 if(openYouTube)openYouTube.href=url;
 setReady('video',true,'YouTube synchronized preview');
 setReady('waveform',false,'preparing visual guide');
 sourceDownload.disabled=true;waveDownload.disabled=true;
 setCompatibility('isPreview','YouTube synchronized preview','Playback time, visual waveform, and live overlay effects are synchronized. Exact audio analysis and final edited-video export require the original file.');
 setStatus('Loading the YouTube player and synchronized effects preview…');
 saveRecentYouTube(url);playedWaveformHistory=[];createYouTubePlayer(id).catch(error=>{invalidUrl(error.message);});
}
function invalidUrl(message='This URL is not a supported direct video or YouTube link.'){
 sourceMode='invalid';setReady('video',false,'unsupported');setReady('waveform',false,'unavailable');
 setCompatibility('isInvalid','Video not supported',message);setStatus(message);
}
function setReady(type,ready,label=''){
 const target=assetStatus?.querySelector(type==='video'?'[data-video-ready]':'[data-waveform-ready]');
 if(target){target.classList.toggle('isReady',ready);target.textContent=`${type==='video'?'Video':'Waveform'}: ${label||(ready?'ready':'waiting')}`}
 if(type==='video'&&sourceDownload)sourceDownload.disabled=!ready;
 if(type==='waveform'&&waveDownload)waveDownload.disabled=!ready;
}
function bootAccess(){
 if(allowed()){gate.hidden=true;studio.hidden=false}
 else gate.innerHTML='<div><p class="sectionEyebrow">Premium Members Only</p><h2>Video Effects Studio is locked</h2><p>Upgrade to Premium Member or ask an administrator for Developer access to use rendering and waveform tools.</p><a class="primaryButton" href="contact.html?type=Collaboration">Request Access</a></div>';
}
function revokeLocal(){
 if(sourceUrl?.startsWith('blob:'))URL.revokeObjectURL(sourceUrl);
}
function prepareSource({url,file=null,blob=null,label='video'}){
 revokeLocal();showNative();sourceFile=file;sourceBlob=blob||file||null;sourceUrl=url;
 video.src=url;video.load();setReady('video',true,label);setReady('waveform',false,'analyzing');
 setCompatibility('isSupported','Full editing supported','This source can use playback, waveform generation, trimming, effects rendering, and downloads.');
 setStatus(`Loaded ${label}. Generating waveform automatically…`);
}
function loadFile(file){
 if(!file)return;
 prepareSource({url:URL.createObjectURL(file),file,blob:file,label:file.name});
 analyzeFile(file).catch(error=>waveformFailure(error));
}
async function loadUrl(){
 const url=$('#videoUrlV4171').value.trim();if(!url)return invalidUrl('Paste a video URL first.');
 const id=youtubeId(url);
 if(id){showYouTube(url,id);return}
 if(!directVideoUrl(url)){
  invalidUrl('This page can embed YouTube links or fully edit direct MP4, WEBM, OGG, MOV, and M4V media URLs. A normal webpage URL is not a playable media file.');
  return;
 }
 prepareSource({url,label:'direct video URL'});
 try{
  const response=await fetch(url,{mode:'cors'});
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const contentType=response.headers.get('content-type')||'';
  if(contentType&&!contentType.startsWith('video/')&&!contentType.includes('octet-stream'))throw new Error(`server returned ${contentType}`);
  sourceBlob=await response.blob();
  await analyzeFile(sourceBlob);
 }catch(error){
  waveformFailure(new Error(`The direct video can be previewed, but its server blocked waveform analysis or downloads (${error.message}).`));
  setCompatibility('isLimited','Preview only','The direct media URL plays, but its server does not permit cross-origin waveform analysis or rendering.');
 }
}
function waveformFailure(error){
 setReady('waveform',false,'unavailable');
 drawWaveformPlaceholder(error.message);
 setStatus(`Video ready. ${error.message}`);
}
async function analyzeFile(blob){
 setReady('waveform',false,'analyzing');
 setStatus('Analyzing the video audio and generating its waveform…');
 const buffer=await blob.arrayBuffer();
 const AudioContextClass=window.AudioContext||window.webkitAudioContext;
 if(!AudioContextClass)throw new Error('Web Audio is not supported by this browser.');
 const context=new AudioContextClass();
 try{audioBuffer=await context.decodeAudioData(buffer.slice(0))}
 finally{await context.close()}
 drawWaveform(audioBuffer);setReady('waveform',true,'download ready');if(exactWavDownload)exactWavDownload.disabled=false;if(guideWavDownload)guideWavDownload.disabled=true;
 setStatus('Video and waveform are ready. Play the video to preview effects or render a download.');
}
function drawWaveform(buffer){
 const context=wave.getContext('2d'),width=wave.width,height=wave.height,data=buffer.getChannelData(0),step=Math.max(1,Math.floor(data.length/width));
 context.clearRect(0,0,width,height);context.fillStyle='#09060d';context.fillRect(0,0,width,height);
 const gradient=context.createLinearGradient(0,0,width,0);gradient.addColorStop(0,'#ffffff');gradient.addColorStop(.42,'#c178ff');gradient.addColorStop(1,'#6622c5');
 context.strokeStyle=gradient;context.lineWidth=2;context.beginPath();
 for(let x=0;x<width;x++){let min=1,max=-1;const start=x*step;for(let i=0;i<step&&start+i<data.length;i++){const value=data[start+i];if(value<min)min=value;if(value>max)max=value}context.moveTo(x,(1+min)*height/2);context.lineTo(x,(1+max)*height/2)}
 context.stroke();context.fillStyle='rgba(190,135,255,.13)';context.fillRect(0,height/2-1,width,2);
 context.fillStyle='rgba(255,255,255,.58)';context.font='24px sans-serif';context.fillText(`${buffer.duration.toFixed(2)} seconds`,22,36);
}
function drawWaveformPlaceholder(message){
 const context=wave.getContext('2d');context.clearRect(0,0,wave.width,wave.height);context.fillStyle='#09060d';context.fillRect(0,0,wave.width,wave.height);
 context.fillStyle='rgba(255,255,255,.68)';context.font='24px sans-serif';context.fillText('Waveform unavailable for this source',35,90);
 context.font='17px sans-serif';context.fillStyle='rgba(190,170,200,.72)';context.fillText(String(message).slice(0,105),35,130);
}
function selectedEffects(){return $$('[data-effect]:checked').map(input=>input.dataset.effect)}
function strength(){return Number($('#effectStrengthV4171')?.value||.55)}
function sensitivity(){return Number($('#beatSensitivityV4172')?.value||1)}
function opacity(){return Number($('#overlayOpacityV4172')?.value||.8)}
function updateCount(){const count=selectedEffects().length;const target=$('#selectedEffectCountV4172');if(target)target.textContent=`${count} selected`}
function connectAnalyser(streamDestination=null){
 const AudioContextClass=window.AudioContext||window.webkitAudioContext;if(!AudioContextClass)return;
 if(!audioContext)audioContext=new AudioContextClass();
 if(!mediaSource){
  mediaSource=audioContext.createMediaElementSource(video);analyser=audioContext.createAnalyser();analyser.fftSize=512;analyser.smoothingTimeConstant=.7;
  dataArray=new Uint8Array(analyser.frequencyBinCount);timeArray=new Uint8Array(analyser.fftSize);
  mediaSource.connect(analyser);analyser.connect(audioContext.destination);
 }
 if(streamDestination&&analyser)analyser.connect(streamDestination);
}
function energy(){
 if(!analyser||!dataArray)return {bass:0,mid:0,high:0,peak:0};
 analyser.getByteFrequencyData(dataArray);
 const avg=(from,to)=>{let sum=0,count=0;for(let i=from;i<Math.min(to,dataArray.length);i++){sum+=dataArray[i];count++}return count?sum/(count*255):0};
 const bass=Math.min(1,avg(0,18)*sensitivity()),mid=Math.min(1,avg(18,75)*sensitivity()),high=Math.min(1,avg(75,dataArray.length)*sensitivity());
 return {bass,mid,high,peak:Math.max(bass,mid,high)};
}
function applyVideoCss(levels,effects){
 const power=strength(),{bass,mid,high}=levels;
 let filters=[],transform=[];
 if(effects.includes('monochrome'))filters.push('grayscale(1)');
 if(effects.includes('invert')&&bass>.72)filters.push(`invert(${Math.min(1,bass*power)})`);
 if(effects.includes('hueShift'))filters.push(`hue-rotate(${(video.currentTime*42+high*180)%360}deg)`);
 if(effects.includes('posterize'))filters.push(`contrast(${1.2+mid}) saturate(${1.4+high})`);
 if(effects.includes('glow'))filters.push(`saturate(${1+bass*power*1.6}) contrast(${1+bass*power*.35})`);
 if(effects.includes('beatZoom'))transform.push(`scale(${1+bass*power*.055})`);
 if(effects.includes('shake'))transform.push(`translate(${(Math.random()-.5)*bass*power*18}px,${(Math.random()-.5)*bass*power*14}px)`);
 if(effects.includes('rotation'))transform.push(`rotate(${(bass-.25)*power*2.2}deg)`);
 if(effects.includes('bounce'))transform.push(`translateY(${-bass*power*12}px)`);
 video.style.filter=filters.join(' ')||'none';video.style.transform=transform.join(' ')||'none';
 video.style.transition=bass>.72?'none':'filter .08s linear,transform .08s linear';
}
function random(seed=1){return Math.abs(Math.sin(seed*12.9898+video.currentTime*78.233)%1)}
function drawStatic(context,width,height,amount){
 const count=Math.round(900*amount);context.save();context.globalAlpha=.08+.18*amount;
 for(let i=0;i<count;i++){const shade=Math.random()>.5?255:0;context.fillStyle=`rgb(${shade},${shade},${shade})`;context.fillRect(Math.random()*width,Math.random()*height,1+Math.random()*3,1+Math.random()*2)}

 if(effects.includes('digitalRain')){context.fillStyle=`rgba(90,255,190,${.18+high*.32})`;context.font='12px monospace';for(let i=0;i<32;i++){const x=i/32*width,y=(time*(35+i%7)*3+seededValue(i)*height)%height;context.fillText(String.fromCharCode(0x30A0+Math.floor(seededValue(i+7)*80)),x,y)}}
 if(effects.includes('snowNoise')){context.fillStyle=`rgba(255,255,255,${.22+high*.3})`;for(let i=0;i<80;i++){const x=seededValue(i*3)*width,y=(seededValue(i*5)*height+time*(8+i%8))%height,r=.5+seededValue(i)*2;context.beginPath();context.arc(x,y,r,0,Math.PI*2);context.fill()}}
 if(effects.includes('horizonGlow')){const y=height*(.68-bass*.09),gradient=context.createLinearGradient(0,y-25,0,y+25);gradient.addColorStop(0,'rgba(140,50,255,0)');gradient.addColorStop(.5,`rgba(220,170,255,${.35+peak*.5})`);gradient.addColorStop(1,'rgba(80,210,255,0)');context.fillStyle=gradient;context.fillRect(0,y-25,width,50)}
 if(effects.includes('circleSpectrum')){context.save();context.translate(width/2,height/2);for(let i=0;i<48;i++){const value=(dataArray?.[Math.floor(i/48*(dataArray.length||1))]||128)/255,angle=i/48*Math.PI*2,radius=Math.min(width,height)*.18;context.rotate(Math.PI*2/48);context.strokeStyle=`rgba(${120+i*2},${80+i*3},255,${.25+value*.65})`;context.beginPath();context.moveTo(radius,0);context.lineTo(radius+value*Math.min(width,height)*.18,0);context.stroke()}context.restore()}
 if(effects.includes('gridFlash')&&peak>.42){context.strokeStyle=`rgba(180,100,255,${peak*.42})`;context.lineWidth=1;const size=40;for(let x=0;x<width;x+=size){context.beginPath();context.moveTo(x,0);context.lineTo(x,height);context.stroke()}for(let y=0;y<height;y+=size){context.beginPath();context.moveTo(0,y);context.lineTo(width,y);context.stroke()}}
 if(effects.includes('chromaticPulse')){for(let i=0;i<3;i++){context.strokeStyle=[`rgba(255,40,120,${bass*.38})`,`rgba(60,220,255,${mid*.34})`,`rgba(180,80,255,${high*.34})`][i];context.lineWidth=3;context.beginPath();context.arc(width/2,height/2,(40+i*30+time*80)%(Math.min(width,height)*.48),0,Math.PI*2);context.stroke()}}
 context.restore();
}
function spawnParticles(width,height,levels){
 if(levels.peak>.55&&particlePool.length<160){const count=Math.ceil(levels.peak*7);for(let i=0;i<count;i++)particlePool.push({x:width/2,y:height/2,vx:(Math.random()-.5)*8,vy:(Math.random()-.5)*8,life:1,size:1+Math.random()*4})}
}
function drawParticles(context){
 context.save();context.globalCompositeOperation='screen';
 particlePool=particlePool.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.life-=.018;context.fillStyle=`rgba(198,122,255,${Math.max(0,p.life)})`;context.beginPath();context.arc(p.x,p.y,p.size,0,Math.PI*2);context.fill();return p.life>0});
 context.restore();
}
function drawEffects(context,width,height,levels,effects,rendering=false){
 const power=strength(),alpha=opacity(),{bass,mid,high,peak}=levels,time=video.currentTime;
 context.save();context.globalAlpha=alpha;
 if(effects.includes('tvStatic'))drawStatic(context,width,height,.35+high*.65);
 if(effects.includes('scanlines')){context.fillStyle='rgba(0,0,0,.22)';for(let y=(time*40)%6;y<height;y+=6)context.fillRect(0,y,width,2)}
 if(effects.includes('vhs')){context.fillStyle=`rgba(255,255,255,${.03+high*.06})`;const y=(time*83)%height;context.fillRect(0,y,width,3+high*8);for(let i=0;i<4;i++){const yy=random(i+time)*height;context.fillStyle='rgba(120,30,180,.08)';context.fillRect((Math.random()-.5)*12,yy,width,1+Math.random()*5)}}
 if(effects.includes('filmGrain'))drawStatic(context,width,height,.12+peak*.2);
 if(effects.includes('dust')){context.fillStyle='rgba(255,245,225,.45)';for(let i=0;i<22;i++){const x=random(i*2.7)*width,y=(random(i*4.1)*height+time*(5+i%5))%height,r=.5+random(i)*2.5;context.beginPath();context.arc(x,y,r,0,Math.PI*2);context.fill()}context.strokeStyle='rgba(255,245,225,.16)';for(let i=0;i<3;i++){const x=random(i+44)*width;context.beginPath();context.moveTo(x,0);context.lineTo(x+Math.sin(time+i)*8,height);context.stroke()}}
 if(effects.includes('glitchBars')&&peak>.38){for(let i=0;i<Math.ceil(peak*8);i++){const y=Math.random()*height,h=2+Math.random()*height*.06,offset=(Math.random()-.5)*width*.08*peak;context.fillStyle=`rgba(${Math.random()>0.5?255:80},40,220,.12)`;context.fillRect(offset,y,width,h)}}
 if(effects.includes('dataMosh')&&bass>.58){context.fillStyle=`rgba(140,45,220,${bass*.11})`;const size=12+Math.round((1-bass)*25);for(let y=0;y<height;y+=size)for(let x=0;x<width;x+=size)if(Math.random()<bass*.13)context.fillRect(x+(Math.random()-.5)*20,y,size,size)}
 if(effects.includes('pixelate')&&peak>.58){const size=8+Math.round(peak*22);context.strokeStyle=`rgba(220,180,255,${peak*.2})`;context.lineWidth=1;for(let x=0;x<width;x+=size)context.strokeRect(x,0,size,height);for(let y=0;y<height;y+=size)context.strokeRect(0,y,width,size)}
 if(effects.includes('rgb')){context.globalCompositeOperation='screen';context.fillStyle=`rgba(255,20,80,${bass*power*.12})`;context.fillRect(bass*18,0,width,height);context.fillStyle=`rgba(0,180,255,${mid*power*.12})`;context.fillRect(-mid*18,0,width,height);context.globalCompositeOperation='source-over'}
 if(effects.includes('strobe')&&peak>.72){context.fillStyle=`rgba(255,255,255,${Math.min(.24,peak*power*.26)})`;context.fillRect(0,0,width,height)}
 if(effects.includes('dropFlash')&&peak>.88&&Date.now()-lastPeak>280){context.fillStyle='rgba(255,255,255,.5)';context.fillRect(0,0,width,height);lastPeak=Date.now()}
 if(effects.includes('vignette')){const gradient=context.createRadialGradient(width/2,height/2,Math.min(width,height)*.2,width/2,height/2,Math.max(width,height)*.68);gradient.addColorStop(0,'rgba(0,0,0,0)');gradient.addColorStop(1,'rgba(0,0,0,.72)');context.fillStyle=gradient;context.fillRect(0,0,width,height)}
 if(effects.includes('letterbox')){const bar=height*.1;context.fillStyle='#000';context.fillRect(0,0,width,bar);context.fillRect(0,height-bar,width,bar)}
 if(effects.includes('lightLeaks')){const x=(Math.sin(time*.55)+1)*width*.5;const gradient=context.createRadialGradient(x,height*.35,0,x,height*.35,width*.6);gradient.addColorStop(0,`rgba(255,110,40,${.13+high*.22})`);gradient.addColorStop(.45,`rgba(160,50,255,${.08+mid*.14})`);gradient.addColorStop(1,'rgba(0,0,0,0)');context.fillStyle=gradient;context.fillRect(0,0,width,height)}
 if(effects.includes('laserGrid')){context.save();context.translate(width/2,height);context.strokeStyle=`rgba(170,65,255,${.24+peak*.7})`;context.lineWidth=1.5;for(let i=-9;i<=9;i++){context.beginPath();context.moveTo(0,0);context.lineTo(i*width*.12,-height);context.stroke()}for(let j=1;j<10;j++){const y=-height*(j/10)**1.7-(time*80)%50;context.beginPath();context.moveTo(-width,y);context.lineTo(width,y);context.stroke()}context.restore()}
 if(effects.includes('tunnel')){context.strokeStyle=`rgba(194,105,255,${.2+peak*.65})`;context.lineWidth=2;for(let i=0;i<9;i++){const radius=((i/9+time*.18)%1)*Math.max(width,height)*.7*(1+bass*.15);context.beginPath();context.arc(width/2,height/2,radius,0,Math.PI*2);context.stroke()}}
 if(effects.includes('subPulse')){context.strokeStyle=`rgba(220,180,255,${Math.max(0,bass-.1)})`;context.lineWidth=4;for(let i=0;i<3;i++){const radius=((time*180+i*90)%(Math.min(width,height)*.7));context.beginPath();context.arc(width/2,height/2,radius,0,Math.PI*2);context.stroke()}}
 if(effects.includes('particles')){spawnParticles(width,height,levels);drawParticles(context)}
 if(effects.includes('sparkles')&&high>.42){context.fillStyle='rgba(255,255,255,.9)';for(let i=0;i<Math.ceil(high*12);i++){const x=Math.random()*width,y=Math.random()*height,r=1+Math.random()*3;context.fillRect(x-r*3,y,r*6,1);context.fillRect(x,y-r*3,1,r*6)}}
 if(effects.includes('audioBars')&&analyser){context.fillStyle='rgba(188,105,255,.65)';const bars=48,gap=3,bw=(width-gap*(bars-1))/bars;for(let i=0;i<bars;i++){const value=dataArray[Math.floor(i/dataArray.length*dataArray.length)]/255;context.fillRect(i*(bw+gap),height,width>800?bw:Math.max(1,bw),-value*height*.28)}}
 if(effects.includes('waveform')&&analyser){context.strokeStyle='rgba(225,190,255,.92)';context.lineWidth=2;context.beginPath();for(let i=0;i<dataArray.length;i++){const x=i/(dataArray.length-1)*width,y=height*.82-(dataArray[i]/255)*height*.25;i?context.lineTo(x,y):context.moveTo(x,y)}context.stroke()}
 if(effects.includes('oscilloscope')&&analyser&&timeArray){analyser.getByteTimeDomainData(timeArray);context.strokeStyle='rgba(80,255,210,.92)';context.lineWidth=2;context.beginPath();for(let i=0;i<timeArray.length;i++){const x=i/(timeArray.length-1)*width,y=(timeArray[i]/255)*height;i?context.lineTo(x,y):context.moveTo(x,y)}context.stroke()}
 if(effects.includes('neonEdges')){context.strokeStyle=`rgba(40,230,255,${.25+high*.65})`;context.lineWidth=2;for(let i=0;i<7;i++){const y=height*(i+1)/8+Math.sin(time*2+i)*mid*18;context.beginPath();context.moveTo(0,y);context.lineTo(width,y);context.stroke()}}
 if(effects.includes('heatmap')){const gradient=context.createLinearGradient(0,0,width,height);gradient.addColorStop(0,`rgba(0,50,255,${.04+mid*.1})`);gradient.addColorStop(.5,`rgba(255,0,180,${.05+bass*.13})`);gradient.addColorStop(1,`rgba(255,160,0,${.04+high*.1})`);context.fillStyle=gradient;context.globalCompositeOperation='screen';context.fillRect(0,0,width,height);context.globalCompositeOperation='source-over'}
 if(effects.includes('mirror')){context.strokeStyle='rgba(255,255,255,.18)';context.beginPath();context.moveTo(width/2,0);context.lineTo(width/2,height);context.stroke()}
 if(effects.includes('kaleidoscope')){context.strokeStyle=`rgba(200,130,255,${.15+peak*.25})`;context.lineWidth=2;context.save();context.translate(width/2,height/2);for(let i=0;i<12;i++){context.rotate(Math.PI/6);context.beginPath();context.moveTo(0,0);context.lineTo(width,0);context.stroke()}context.restore()}
 if(effects.includes('zoomBlur')){context.strokeStyle=`rgba(220,180,255,${peak*.25})`;for(let i=0;i<18;i++){const angle=i/18*Math.PI*2;context.beginPath();context.moveTo(width/2+Math.cos(angle)*30,height/2+Math.sin(angle)*30);context.lineTo(width/2+Math.cos(angle)*Math.max(width,height),height/2+Math.sin(angle)*Math.max(width,height));context.stroke()}}
 context.restore();
}
function previewLoop(){
 cancelAnimationFrame(previewRaf);const context=overlay.getContext('2d');
 function draw(now){
  const width=video.clientWidth||640,height=video.clientHeight||360;if(overlay.width!==width||overlay.height!==height){overlay.width=width;overlay.height=height}
  const effects=selectedEffects(),levels=energy();recordWavePoint(Number(video.currentTime||0),levels,'exact-audio');applyVideoCss(levels,effects);context.clearRect(0,0,width,height);drawEffects(context,width,height,levels,effects,false);
  previewRaf=requestAnimationFrame(draw);lastFrame=now;
 }previewRaf=requestAnimationFrame(draw)
}
function setupVideo(){
 $('#trimEndV4171').value=Number(video.duration||0).toFixed(2);connectAnalyser();previewLoop();
 if(audioContext?.state==='suspended')video.addEventListener('play',()=>audioContext.resume(),{once:true});
}
function canvasFilter(effects,levels){
 const filters=[],{bass,mid,high}=levels,power=strength();
 if(effects.includes('monochrome'))filters.push('grayscale(1)');
 if(effects.includes('invert')&&bass>.72)filters.push(`invert(${Math.min(1,bass*power)})`);
 if(effects.includes('hueShift'))filters.push(`hue-rotate(${(video.currentTime*42+high*180)%360}deg)`);
 if(effects.includes('posterize'))filters.push(`contrast(${1.4+mid*.5}) saturate(${1.5+high})`);
 if(effects.includes('glow'))filters.push(`saturate(${1+bass*power*1.7}) contrast(${1+bass*power*.35})`);
 return filters.join(' ')||'none';
}
async function render(){
 if(sourceMode==='youtube')return setStatus('Your YouTube effects preview and synchronized waveform are ready. Choose “Use Original File for Final Export” to render a downloadable edited video with the same settings.');
 if(sourceMode!=='native'||!video.src)return setStatus('Load a supported local or direct video first.');
 connectAnalyser();
 const start=Math.max(0,Number($('#trimStartV4171').value||0)),end=Math.min(video.duration||Infinity,Number($('#trimEndV4171').value||video.duration||0));
 if(!(end>start))return setStatus('End time must be greater than start time.');
 const canvas=document.createElement('canvas');canvas.width=video.videoWidth||1280;canvas.height=video.videoHeight||720;const context=canvas.getContext('2d');
 const stream=canvas.captureStream(30),audioDestination=audioContext?.createMediaStreamDestination();
 if(audioDestination&&analyser){analyser.connect(audioDestination);audioDestination.stream.getAudioTracks().forEach(track=>stream.addTrack(track))}
 const requested=$('#outputFormatV4171').value,candidates=requested==='auto'?['video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm']:[requested,'video/webm'];
 const mime=candidates.find(type=>MediaRecorder.isTypeSupported(type))||'video/webm',chunks=[],recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:9000000});
 recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data)};
 recorder.onstop=()=>{const blob=new Blob(chunks,{type:mime}),anchor=document.createElement('a');anchor.href=URL.createObjectURL(blob);anchor.download=`sos-video-fx-${Date.now()}.${mime.includes('mp4')?'mp4':'webm'}`;anchor.click();setTimeout(()=>URL.revokeObjectURL(anchor.href),1800);setStatus(`Render complete: ${anchor.download}`)};
 const effects=selectedEffects();video.currentTime=start;await video.play();recorder.start(250);setStatus(`Rendering ${mime.includes('mp4')?'MP4':'WEBM'} with ${effects.length} effects… Keep this tab open.`);
 function frame(){
  if(video.currentTime>=end||video.ended){video.pause();recorder.stop();return}
  const levels=energy(),{bass}=levels,power=strength();context.save();
  if(effects.includes('beatZoom')){const zoom=1+bass*power*.055;context.translate(canvas.width/2,canvas.height/2);context.scale(zoom,zoom);context.translate(-canvas.width/2,-canvas.height/2)}
  if(effects.includes('shake'))context.translate((Math.random()-.5)*bass*power*20,(Math.random()-.5)*bass*power*15);
  if(effects.includes('rotation')){context.translate(canvas.width/2,canvas.height/2);context.rotate((bass-.2)*power*.035);context.translate(-canvas.width/2,-canvas.height/2)}
  if(effects.includes('bounce'))context.translate(0,-bass*power*14);
  context.filter=canvasFilter(effects,levels);context.drawImage(video,0,0,canvas.width,canvas.height);context.restore();
  drawEffects(context,canvas.width,canvas.height,levels,effects,true);requestAnimationFrame(frame)
 }frame()
}
function downloadWaveform(){
 if(waveDownload?.disabled)return;
 const anchor=document.createElement('a');anchor.href=wave.toDataURL('image/png');anchor.download=`${sourceMode==='youtube'?'youtube-synced':'video'}-waveform-${Date.now()}.png`;anchor.click()
}
function downloadWaveformData(){
 if(playedWaveformHistory.length<2)return setStatus('Play the video longer to collect waveform history.');
 const header='time_seconds,bass,mid,high,peak,mode\n',rows=playedWaveformHistory.map(row=>`${row.time},${row.bass},${row.mid},${row.high},${row.peak},${row.mode}`).join('\n');
 downloadBlob(new Blob([header+rows],{type:'text/csv'}),`played-waveform-${Date.now()}.csv`);setStatus('Played waveform history downloaded as CSV.');
}
function downloadGuideWav(){
 if(sourceMode!=='youtube'||!youtubeDuration)return setStatus('Load a YouTube project first.');
 const guide=syntheticGuideSamples(youtubeDuration);downloadBlob(pcm16Wav(guide.samples,guide.sampleRate),`youtube-waveform-guide-${Date.now()}.wav`);
 setStatus('Synthetic guide WAV downloaded. It follows the visual envelope and does not contain YouTube audio.');
}
function downloadExactWav(){
 if(!audioBuffer)return setStatus('Load the original video file to extract its exact audio waveform.');
 downloadBlob(pcm16Wav(audioBufferToMono(audioBuffer),audioBuffer.sampleRate),`original-video-audio-${Date.now()}.wav`);setStatus('Exact audio WAV exported from the supplied original file.');
}
async function downloadSource(){
 if(!sourceUrl)return;
 if(sourceFile||sourceBlob){
  const blob=sourceBlob||sourceFile,anchor=document.createElement('a');anchor.href=URL.createObjectURL(blob);anchor.download=sourceFile?.name||`source-video-${Date.now()}.${blob.type?.includes('webm')?'webm':'mp4'}`;anchor.click();setTimeout(()=>URL.revokeObjectURL(anchor.href),1600);return;
 }
 try{
  const response=await fetch(sourceUrl,{mode:'cors'});if(!response.ok)throw new Error(`HTTP ${response.status}`);const blob=await response.blob(),anchor=document.createElement('a');anchor.href=URL.createObjectURL(blob);anchor.download=`source-video-${Date.now()}.${blob.type.includes('webm')?'webm':'mp4'}`;anchor.click();setTimeout(()=>URL.revokeObjectURL(anchor.href),1600)
 }catch{window.open(sourceUrl,'_blank','noopener')}
}
function exportProject(){
 const project={source:sourceFile?.name||sourceUrl,start:Number($('#trimStartV4171').value||0),end:Number($('#trimEndV4171').value||0),effects:selectedEffects(),strength:strength(),sensitivity:sensitivity(),overlayOpacity:opacity(),createdAt:new Date().toISOString()};
 const blob=new Blob([JSON.stringify(project,null,2)],{type:'application/json'}),anchor=document.createElement('a');anchor.href=URL.createObjectURL(blob);anchor.download='sos-video-effects-project.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(anchor.href),1000)
}
function applyPreset(name){
 const selected=new Set(presets[name]||[]);$$('[data-effect]').forEach(input=>input.checked=selected.has(input.dataset.effect));updateCount()
}
const drop=$('#videoDropzoneV4171'),input=$('#videoFileV4171');
drop.addEventListener('click',()=>input.click());drop.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();input.click()}});
['dragenter','dragover'].forEach(type=>drop.addEventListener(type,event=>{event.preventDefault();drop.classList.add('isDragging')}));
['dragleave','drop'].forEach(type=>drop.addEventListener(type,event=>{event.preventDefault();drop.classList.remove('isDragging')}));
drop.addEventListener('drop',event=>loadFile(event.dataTransfer.files[0]));input.addEventListener('change',()=>loadFile(input.files[0]));
video.addEventListener('loadedmetadata',setupVideo);video.addEventListener('play',()=>{connectAnalyser();audioContext?.resume();previewLoop()});
$('#loadVideoUrlV4171').onclick=loadUrl;$('#analyzeVideoV4171').onclick=()=>{
 if(sourceMode==='youtube'){drawSyntheticWaveform(youtubeDuration,Number(youtubePlayer?.getCurrentTime?.()||0));waveDownload.disabled=false;return setStatus('The synchronized YouTube waveform guide was regenerated. Upload the original file for exact audio analysis.');}
 return sourceBlob||sourceFile?analyzeFile(sourceBlob||sourceFile):loadUrl()
};
waveDownload.onclick=downloadWaveform;sourceDownload.onclick=downloadSource;if(waveformDataDownload)waveformDataDownload.onclick=downloadWaveformData;if(guideWavDownload)guideWavDownload.onclick=downloadGuideWav;if(exactWavDownload)exactWavDownload.onclick=downloadExactWav;$('#renderVideoV4171').onclick=render;$('#exportProjectV4171').onclick=exportProject;
copyYouTube?.addEventListener('click',async()=>{if(!youtubeUrl)return;await navigator.clipboard.writeText(youtubeUrl);setStatus('YouTube URL copied to the clipboard.')});
replaceYouTube?.addEventListener('click',()=>{input.click();setStatus('Choose the original video file. Your selected effects and timeline settings will remain active for exact analysis and final export.')});
document.addEventListener('change',event=>{if(event.target.matches('[data-effect]'))updateCount()});
youtubeSearchButton?.addEventListener('click',event=>{event.preventDefault();const query=youtubeSearch?.value.trim();if(query)window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,'_blank','noopener')});
clipboardButton?.addEventListener('click',async event=>{event.preventDefault();try{const value=await navigator.clipboard.readText();$('#videoUrlV4171').value=value;await loadUrl()}catch(error){setStatus('Clipboard access was blocked. Paste the YouTube URL manually.')}});
recentProjects?.addEventListener('click',event=>{const button=event.target.closest('[data-use-recent-youtube]');if(!button)return;event.preventDefault();$('#videoUrlV4171').value=button.dataset.useRecentYoutube;loadUrl()});
document.addEventListener('click',event=>{const anchor=event.target.closest('a[href="#"]');if(anchor)event.preventDefault();const button=event.target.closest('button');if(button&&button.type!=='submit')preserveScroll(()=>{});});
document.addEventListener('click',event=>{const preset=event.target.closest('[data-effect-preset]');if(preset)applyPreset(preset.dataset.effectPreset);if(event.target.closest('[data-effect-clear]')){$$('[data-effect]').forEach(input=>input.checked=false);updateCount()}});
if(waveformDataDownload)waveformDataDownload.disabled=true;if(guideWavDownload)guideWavDownload.disabled=true;if(exactWavDownload)exactWavDownload.disabled=true;renderRecentYouTube();setReady('video',false);setReady('waveform',false);setCompatibility('isWaiting','Waiting for a video','Direct MP4/WEBM files support full editing. YouTube links support embedded preview only.');updateCount();bootAccess();
const requestedVideo=new URLSearchParams(location.search).get('video');
if(requestedVideo){$('#videoUrlV4171').value=requestedVideo;setTimeout(loadUrl,80)}
window.addEventListener('pagehide',()=>{cancelAnimationFrame(previewRaf);cancelAnimationFrame(youtubeAnimation);youtubePlayer?.destroy?.();revokeLocal();audioContext?.close()},{once:true});
})();