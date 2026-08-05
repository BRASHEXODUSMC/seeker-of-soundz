/* Seeker Of SoundZ v4.23.0 — draggable multi-layer canvas editor */
(()=>{
'use strict';
const stage=document.getElementById('producerInteractiveLayersV4230');
const canvas=document.getElementById('composerCanvasV4180');
const video=document.getElementById('composerPreviewVideoV4180');
const list=document.getElementById('producerLayerListV4230');
const editor=document.getElementById('producerSelectedLayerEditorV4230');
if(!stage||!canvas||!list||!editor)return;

const $=(selector,root=document)=>root.querySelector(selector);
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const uid=()=>`layer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
const fontMap={
  retro:'Trebuchet MS, sans-serif',arcade:'Courier New, monospace',cyber:'Arial Black, sans-serif',
  rave:'Arial Black, sans-serif',minimal:'Arial, sans-serif',terminal:'Consolas, monospace',
  'neon-script':'Brush Script MT, cursive',techno:'Impact, sans-serif',
  synthwave:'Arial Black, sans-serif',hologram:'Trebuchet MS, sans-serif',
  industrial:'Impact, sans-serif',graffiti:'Comic Sans MS, cursive',
  cinematic:'Georgia, serif',bubble:'Arial Rounded MT Bold, Arial, sans-serif'
};
let layers=[];
let selectedId=null;
let drag=null;
let rotating=null;
let activeElement=null;
let activeRotateHandle=null;
let pendingEditorFrame=0;

function defaultText(){
 return {
  id:uid(),type:'text',name:`Text ${layers.filter(l=>l.type==='text').length+1}`,visible:true,
  x:.5,y:.5,rotation:0,opacity:1,scale:1,text:'NEW TEXT',font:'retro',fontSize:62,
  fill:'#ffffff',outline:'#4eeaff',glow:'#ff48bb',background:'#000000',backgroundOpacity:0,
  spacing:2,effect:'none',entrance:'fade',exit:'fade',transitionDuration:1,start:0,end:null
 };
}
function defaultImage(image,name,url){
 return {
  id:uid(),type:'image',name:name||`Image ${layers.filter(l=>l.type==='image').length+1}`,
  visible:true,x:.72,y:.72,rotation:0,opacity:1,scale:.24,image,url,
  effect:'none',entrance:'fade',exit:'fade',transitionDuration:1,start:0,end:null
 };
}
function selected(){return layers.find(layer=>layer.id===selectedId)||null}
function duration(){return Number(video?.duration||0)||60}
function layerActive(layer,time){
 const end=layer.end==null?duration():Number(layer.end);
 return layer.visible&&time>=Number(layer.start||0)&&time<=end;
}
function transitionAmount(layer,time,total){
 const start=Number(layer.start||0),end=layer.end==null?total:Number(layer.end),d=Math.max(.05,Number(layer.transitionDuration||1));
 if(time<start||time>end)return 0;
 if(time<start+d)return clamp((time-start)/d,0,1);
 if(time>end-d)return clamp((end-time)/d,0,1);
 return 1;
}
function animation(layer,time,lv,total){
 const amount=transitionAmount(layer,time,total);
 let alpha=layer.opacity*amount,scale=layer.scale,rotation=layer.rotation,x=layer.x,y=layer.y;
 const entrance=time<Number(layer.start||0)+Number(layer.transitionDuration||1);
 const exit=time>(layer.end==null?total:Number(layer.end))-Number(layer.transitionDuration||1);
 const transition=exit?layer.exit:entrance?layer.entrance:'none';
 const inverse=1-amount;
 if(transition==='slide-left')x-=inverse*.3;
 if(transition==='slide-right')x+=inverse*.3;
 if(transition==='slide-up')y-=inverse*.3;
 if(transition==='slide-down')y+=inverse*.3;
 if(transition==='zoom')scale*=.25+.75*amount;
 if(transition==='spin')rotation+=inverse*360;
 if(transition==='bounce')scale*=1+Math.sin(amount*Math.PI)*.28;
 if(transition==='blur')alpha*=.55+.45*amount;
 if(transition==='glitch'){x+=(Math.random()-.5)*inverse*.04;y+=(Math.random()-.5)*inverse*.025}
 if(transition==='flip')scale*=Math.max(.05,Math.abs(Math.cos(inverse*Math.PI/2)));

 const effect=layer.effect||'none';
 if(effect==='pulse')scale*=1+Math.sin(time*5)*.06;
 if(effect==='beat-pulse')scale*=1+(lv?.bass||.3)*.16;
 if(effect==='float')y+=Math.sin(time*1.8+layer.id.length)*.018;
 if(effect==='shake'){x+=(Math.random()-.5)*.012;y+=(Math.random()-.5)*.012}
 if(effect==='spin')rotation+=time*55;
 if(effect==='slow-spin')rotation+=time*14;
 if(effect==='flicker')alpha*=.65+Math.random()*.35;
 if(effect==='glitch'){x+=(Math.random()-.5)*.015;rotation+=(Math.random()-.5)*2}
 if(effect==='bounce')y-=Math.abs(Math.sin(time*3))* .025;
 if(effect==='zoom')scale*=1.05+Math.sin(time*2.2)*.04;
 return {x,y,rotation,scale,alpha,effect};
}
function drawText(ctx,layer,w,h,state){
 const size=layer.fontSize*state.scale;
 ctx.save();ctx.translate(state.x*w,state.y*h);ctx.rotate(state.rotation*Math.PI/180);ctx.globalAlpha=state.alpha;
 ctx.font=`900 ${size}px ${fontMap[layer.font]||fontMap.retro}`;ctx.textAlign='center';ctx.textBaseline='middle';
 const width=ctx.measureText(layer.text).width+Math.max(0,layer.text.length-1)*layer.spacing;
 const height=size*1.45;
 if(layer.backgroundOpacity>0){ctx.fillStyle=hex(layer.background,layer.backgroundOpacity);ctx.fillRect(-width/2-size*.28,-height/2,width+size*.56,height)}
 ctx.shadowColor=layer.glow;ctx.shadowBlur=state.effect==='neon'?32:18;
 if(state.effect==='blur')ctx.filter='blur(2px)';
 if(state.effect==='chromatic'){
  ctx.globalCompositeOperation='screen';ctx.fillStyle='rgba(255,30,95,.5)';drawSpaced(ctx,layer.text,-4,0,layer.spacing,false);
  ctx.fillStyle='rgba(40,210,255,.5)';drawSpaced(ctx,layer.text,4,0,layer.spacing,false);ctx.globalCompositeOperation='source-over';
 }
 ctx.strokeStyle=layer.outline;ctx.lineWidth=Math.max(1.5,size*.045);drawSpaced(ctx,layer.text,0,0,layer.spacing,true);
 ctx.fillStyle=layer.fill;drawSpaced(ctx,layer.text,0,0,layer.spacing,false);ctx.restore();
}
function drawSpaced(ctx,text,x,y,spacing,stroke){
 const chars=[...text],widths=chars.map(char=>ctx.measureText(char).width);
 const total=widths.reduce((sum,width)=>sum+width,0)+Math.max(0,chars.length-1)*spacing;
 let cursor=x-total/2;
 chars.forEach((char,index)=>{const cx=cursor+widths[index]/2;stroke?ctx.strokeText(char,cx,y):ctx.fillText(char,cx,y);cursor+=widths[index]+spacing});
}
function drawImage(ctx,layer,w,h,state){
 if(!layer.image?.complete)return;
 const naturalW=layer.image.naturalWidth||500,naturalH=layer.image.naturalHeight||500;
 const targetW=w*state.scale,targetH=targetW*(naturalH/naturalW);
 ctx.save();ctx.translate(state.x*w,state.y*h);ctx.rotate(state.rotation*Math.PI/180);ctx.globalAlpha=state.alpha;
 if(state.effect==='blur')ctx.filter='blur(3px)';
 if(state.effect==='grayscale')ctx.filter='grayscale(1)';
 if(state.effect==='saturate')ctx.filter='saturate(1.8)';
 if(state.effect==='hue')ctx.filter=`hue-rotate(${(performance.now()*.04)%360}deg)`;
 if(state.effect==='neon'){ctx.shadowColor='#bd72ff';ctx.shadowBlur=28}
 if(state.effect==='chromatic'){
  ctx.globalCompositeOperation='screen';ctx.globalAlpha=state.alpha*.45;ctx.drawImage(layer.image,-targetW/2-5,-targetH/2,targetW,targetH);ctx.drawImage(layer.image,-targetW/2+5,-targetH/2,targetW,targetH);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=state.alpha;
 }
 ctx.drawImage(layer.image,-targetW/2,-targetH/2,targetW,targetH);ctx.restore();
}
function hex(value,alpha){
 const clean=String(value||'#000000').replace('#','');const num=parseInt(clean.length===3?clean.split('').map(c=>c+c).join(''):clean,16);
 return `rgba(${num>>16&255},${num>>8&255},${num&255},${alpha})`;
}
function draw(ctx,w,h,time,lv,total){
 layers.forEach(layer=>{
  if(!layerActive(layer,time))return;
  const state=animation(layer,time,lv,total||duration());
  if(layer.type==='text')drawText(ctx,layer,w,h,state);else drawImage(ctx,layer,w,h,state);
 });
}
function syncStage(){
 const rect=canvas.getBoundingClientRect();
 const parent=stage.parentElement.getBoundingClientRect();
 stage.style.left=`${rect.left-parent.left}px`;stage.style.top=`${rect.top-parent.top}px`;
 stage.style.width=`${rect.width}px`;stage.style.height=`${rect.height}px`;
 renderStage();
}
function layerBox(layer){
 const element=document.createElement('button');element.type='button';
 element.className=`producerInteractiveLayerV4230 ${layer.type==='text'?'isText':'isImage'} ${layer.id===selectedId?'isSelected':''}`;
 element.dataset.layerId=layer.id;element.style.left=`${layer.x*100}%`;element.style.top=`${layer.y*100}%`;
 element.style.transform=`translate(-50%,-50%) rotate(${layer.rotation}deg)`;
 element.style.opacity=layer.visible?String(layer.opacity):'.2';
 if(layer.type==='text'){
  element.textContent=layer.text||'Text';element.style.fontFamily=fontMap[layer.font]||fontMap.retro;
  element.style.fontSize=`${clamp(layer.fontSize/18,1.1,4)}rem`;element.style.color=layer.fill;
  element.style.textShadow=`0 0 12px ${layer.glow}`;element.style.webkitTextStroke=`1px ${layer.outline}`;
 }else{
  const image=document.createElement('img');image.src=layer.url;image.alt=layer.name;element.appendChild(image);
  element.style.width=`${clamp(layer.scale*100,8,65)}%`;
 }
 const rotate=document.createElement('i');rotate.className='producerRotateHandleV4230';rotate.textContent='↻';rotate.title='Drag to rotate';element.appendChild(rotate);
 element.addEventListener('pointerdown',event=>{
  if(event.target===rotate)return;
  event.preventDefault();event.stopPropagation();
  selectLayerForInteraction(layer.id,element);
  const rect=stage.getBoundingClientRect();
  drag={id:layer.id,pointer:event.pointerId,rect};
  activeElement=element;
  element.setPointerCapture?.(event.pointerId);
 });
 rotate.addEventListener('pointerdown',event=>{
  event.preventDefault();event.stopPropagation();
  selectLayerForInteraction(layer.id,element);
  const rect=stage.getBoundingClientRect(),cx=rect.left+layer.x*rect.width,cy=rect.top+layer.y*rect.height;
  rotating={id:layer.id,pointer:event.pointerId,cx,cy,startAngle:Math.atan2(event.clientY-cy,event.clientX-cx)*180/Math.PI,startRotation:layer.rotation};
  activeElement=element;activeRotateHandle=rotate;
  rotate.setPointerCapture?.(event.pointerId);
 });
 return element;
}
function renderStage(){
 stage.innerHTML='';layers.filter(layer=>layer.visible||layer.id===selectedId).forEach(layer=>stage.appendChild(layerBox(layer)));
}
function updateActiveElement(layer){
 if(!activeElement)return;
 activeElement.style.left=`${layer.x*100}%`;
 activeElement.style.top=`${layer.y*100}%`;
 activeElement.style.transform=`translate(-50%,-50%) rotate(${layer.rotation}deg)`;
}
function syncEditorValues(layer){
 cancelAnimationFrame(pendingEditorFrame);
 pendingEditorFrame=requestAnimationFrame(()=>{
  const x=editor.querySelector('[data-layer-prop="x"]');
  const y=editor.querySelector('[data-layer-prop="y"]');
  const rotation=editor.querySelector('[data-layer-prop="rotation"]');
  if(x)x.value=String(layer.x);
  if(y)y.value=String(layer.y);
  if(rotation)rotation.value=String(layer.rotation);
 });
}
function finishInteraction(){
 drag=null;rotating=null;activeElement=null;activeRotateHandle=null;
 renderList();renderEditor();renderStage();redraw();
}
stage.addEventListener('pointermove',event=>{
 if(drag){
  const layer=layers.find(item=>item.id===drag.id);if(!layer)return;
  layer.x=clamp((event.clientX-drag.rect.left)/drag.rect.width,0,1);
  layer.y=clamp((event.clientY-drag.rect.top)/drag.rect.height,0,1);
  updateActiveElement(layer);syncEditorValues(layer);redraw();
 }
 if(rotating){
  const layer=layers.find(item=>item.id===rotating.id);if(!layer)return;
  const angle=Math.atan2(event.clientY-rotating.cy,event.clientX-rotating.cx)*180/Math.PI;
  layer.rotation=Math.round(rotating.startRotation+angle-rotating.startAngle);
  updateActiveElement(layer);syncEditorValues(layer);redraw();
 }
});
stage.addEventListener('pointerup',finishInteraction);
stage.addEventListener('pointercancel',finishInteraction);
window.addEventListener('pointerup',()=>{if(drag||rotating)finishInteraction()});
window.addEventListener('pointercancel',()=>{if(drag||rotating)finishInteraction()});

function renderList(){
 if(!layers.length){list.innerHTML='<p>No extra layers yet.</p>'}
 else list.innerHTML=layers.slice().reverse().map(layer=>`<button type="button" class="producerLayerListItemV4230 ${layer.id===selectedId?'isSelected':''}" data-select-layer="${layer.id}">
  <i>${layer.type==='text'?'T':'▧'}</i><span><strong>${esc(layer.name)}</strong><small>${layer.visible?'Visible':'Hidden'} · ${layer.effect}</small></span>
  <b data-toggle-layer="${layer.id}" title="Show or hide">${layer.visible?'◉':'○'}</b>
 </button>`).join('');
 list.querySelectorAll('[data-select-layer]').forEach(button=>button.addEventListener('click',event=>{
  if(event.target.closest('[data-toggle-layer]'))return;selectLayer(button.dataset.selectLayer);
 }));
 list.querySelectorAll('[data-toggle-layer]').forEach(button=>button.addEventListener('click',event=>{
  event.stopPropagation();const layer=layers.find(item=>item.id===button.dataset.toggleLayer);if(layer){layer.visible=!layer.visible;renderAll();redraw()}
 }));
}
function selectLayerForInteraction(id,element){
 selectedId=id;
 stage.querySelectorAll('.producerInteractiveLayerV4230').forEach(item=>item.classList.toggle('isSelected',item===element));
 renderList();renderEditor();
}
function selectLayer(id){selectedId=id;renderAll()}
function option(value,label,current){return `<option value="${value}" ${value===current?'selected':''}>${label}</option>`}
function commonEditor(layer){
 return `<div class="producerLayerPropertyGridV4230">
  <label>Name<input data-layer-prop="name" value="${esc(layer.name)}"></label>
  <label>Opacity<input data-layer-prop="opacity" type="range" min="0" max="1" step=".05" value="${layer.opacity}"></label>
  <label>Scale<input data-layer-prop="scale" type="range" min=".05" max="${layer.type==='text'?'3':'1'}" step=".01" value="${layer.scale}"></label>
  <label>Rotation<input data-layer-prop="rotation" type="number" min="-720" max="720" step="1" value="${layer.rotation}"></label>
  <label>X position<input data-layer-prop="x" type="range" min="0" max="1" step=".005" value="${layer.x}"></label>
  <label>Y position<input data-layer-prop="y" type="range" min="0" max="1" step=".005" value="${layer.y}"></label>
  <label>Start time<input data-layer-prop="start" type="number" min="0" step=".1" value="${layer.start}"></label>
  <label>End time<input data-layer-prop="end" type="number" min="0" step=".1" placeholder="Video end" value="${layer.end??''}"></label>
  <label>Entrance<select data-layer-prop="entrance">
   ${option('none','None',layer.entrance)}${option('fade','Fade',layer.entrance)}${option('slide-left','Slide Left',layer.entrance)}${option('slide-right','Slide Right',layer.entrance)}
   ${option('slide-up','Slide Up',layer.entrance)}${option('slide-down','Slide Down',layer.entrance)}${option('zoom','Zoom',layer.entrance)}${option('spin','Spin',layer.entrance)}
   ${option('bounce','Bounce',layer.entrance)}${option('glitch','Glitch',layer.entrance)}${option('flip','Flip',layer.entrance)}
  </select></label>
  <label>Exit<select data-layer-prop="exit">
   ${option('none','None',layer.exit)}${option('fade','Fade',layer.exit)}${option('slide-left','Slide Left',layer.exit)}${option('slide-right','Slide Right',layer.exit)}
   ${option('slide-up','Slide Up',layer.exit)}${option('slide-down','Slide Down',layer.exit)}${option('zoom','Zoom',layer.exit)}${option('spin','Spin',layer.exit)}
   ${option('bounce','Bounce',layer.exit)}${option('glitch','Glitch',layer.exit)}${option('flip','Flip',layer.exit)}
  </select></label>
  <label>Transition duration<input data-layer-prop="transitionDuration" type="range" min=".1" max="5" step=".1" value="${layer.transitionDuration}"></label>
  <label>Layer effect<select data-layer-prop="effect">
   ${option('none','None',layer.effect)}${option('pulse','Pulse',layer.effect)}${option('beat-pulse','Beat Pulse',layer.effect)}${option('float','Float',layer.effect)}
   ${option('shake','Shake',layer.effect)}${option('spin','Fast Spin',layer.effect)}${option('slow-spin','Slow Spin',layer.effect)}${option('flicker','Flicker',layer.effect)}
   ${option('glitch','Glitch',layer.effect)}${option('bounce','Bounce',layer.effect)}${option('zoom','Zoom Pulse',layer.effect)}
   ${option('neon','Neon Glow',layer.effect)}${option('chromatic','Chromatic',layer.effect)}${option('blur','Blur',layer.effect)}
   ${layer.type==='image'?`${option('grayscale','Grayscale',layer.effect)}${option('saturate','High Saturation',layer.effect)}${option('hue','Hue Cycle',layer.effect)}`:''}
  </select></label>
 </div>`;
}
function renderEditor(){
 const layer=selected();
 ['moveLayerUpV4230','moveLayerDownV4230','duplicateLayerV4230','deleteLayerV4230'].forEach(id=>{const button=document.getElementById(id);if(button)button.disabled=!layer});
 if(!layer){editor.innerHTML='<p>Select or add a layer to edit it.</p>';return}
 const typeFields=layer.type==='text'?`<div class="producerLayerPropertyGridV4230">
  <label>Text<textarea data-layer-prop="text">${esc(layer.text)}</textarea></label>
  <label>Font<select data-layer-prop="font">${Object.keys(fontMap).map(key=>option(key,key.replace(/-/g,' '),layer.font)).join('')}</select></label>
  <label>Font size<input data-layer-prop="fontSize" type="range" min="18" max="180" step="2" value="${layer.fontSize}"></label>
  <label>Text color<input data-layer-prop="fill" type="color" value="${layer.fill}"></label>
  <label>Outline<input data-layer-prop="outline" type="color" value="${layer.outline}"></label>
  <label>Glow<input data-layer-prop="glow" type="color" value="${layer.glow}"></label>
  <label>Background<input data-layer-prop="background" type="color" value="${layer.background}"></label>
  <label>Background opacity<input data-layer-prop="backgroundOpacity" type="range" min="0" max="1" step=".05" value="${layer.backgroundOpacity}"></label>
  <label>Letter spacing<input data-layer-prop="spacing" type="range" min="-2" max="24" step="1" value="${layer.spacing}"></label>
 </div>`:'<p class="producerLayerHintV4230">Drag the image over the preview, use ↻ to rotate, and use Scale for its size.</p>';
 editor.innerHTML=`<header><div><strong>${esc(layer.name)}</strong><small>${layer.type==='text'?'Text layer':'Image layer'}</small></div><label class="checkLine"><input data-layer-prop="visible" type="checkbox" ${layer.visible?'checked':''}> Visible</label></header>${typeFields}${commonEditor(layer)}`;
 editor.querySelectorAll('[data-layer-prop]').forEach(input=>{
  const eventName=input.matches('select,input[type="checkbox"],input[type="color"]')?'change':'input';
  input.addEventListener(eventName,()=>{
   const prop=input.dataset.layerProp;
   if(prop==='visible')layer[prop]=input.checked;
   else if(['opacity','scale','rotation','x','y','start','transitionDuration','fontSize','backgroundOpacity','spacing'].includes(prop))layer[prop]=Number(input.value);
   else if(prop==='end')layer.end=input.value===''?null:Number(input.value);
   else layer[prop]=input.value;
   renderList();renderStage();redraw();
  });
 });
}
function renderAll(){renderList();renderEditor();renderStage()}
function redraw(){video?.dispatchEvent(new Event('seeked'))}
function addText(){const layer=defaultText();layers.push(layer);selectLayer(layer.id);redraw()}
async function addImages(files){
 for(const file of files){
  const url=URL.createObjectURL(file),image=new Image();
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url});
  const layer=defaultImage(image,file.name,url);layers.push(layer);selectedId=layer.id;
 }
 renderAll();redraw();
}
document.getElementById('addTextLayerV4230')?.addEventListener('click',addText);
document.getElementById('addImageLayerV4230')?.addEventListener('change',event=>{addImages([...event.target.files]).catch(console.error);event.target.value=''});
document.getElementById('deleteLayerV4230')?.addEventListener('click',()=>{
 const index=layers.findIndex(layer=>layer.id===selectedId);if(index<0)return;
 const [removed]=layers.splice(index,1);if(removed.url&&!layers.some(layer=>layer.url===removed.url))URL.revokeObjectURL(removed.url);selectedId=layers[Math.min(index,layers.length-1)]?.id||null;renderAll();redraw();
});
document.getElementById('duplicateLayerV4230')?.addEventListener('click',()=>{
 const layer=selected();if(!layer)return;const copy={...layer,id:uid(),name:`${layer.name} Copy`,x:clamp(layer.x+.04,0,1),y:clamp(layer.y+.04,0,1)};layers.push(copy);selectedId=copy.id;renderAll();redraw();
});
document.getElementById('moveLayerUpV4230')?.addEventListener('click',()=>{const index=layers.findIndex(layer=>layer.id===selectedId);if(index<layers.length-1){[layers[index],layers[index+1]]=[layers[index+1],layers[index]];renderAll();redraw()}});
document.getElementById('moveLayerDownV4230')?.addEventListener('click',()=>{const index=layers.findIndex(layer=>layer.id===selectedId);if(index>0){[layers[index],layers[index-1]]=[layers[index-1],layers[index]];renderAll();redraw()}});
document.getElementById('hideAllLayersV4230')?.addEventListener('click',()=>{layers.forEach(layer=>layer.visible=false);renderAll();redraw()});
document.getElementById('showAllLayersV4230')?.addEventListener('click',()=>{layers.forEach(layer=>layer.visible=true);renderAll();redraw()});
document.getElementById('clearExtraLayersV4230')?.addEventListener('click',()=>{
 layers.forEach(layer=>{if(layer.url)URL.revokeObjectURL(layer.url)});layers=[];selectedId=null;renderAll();redraw();
});

new ResizeObserver(syncStage).observe(canvas);
window.addEventListener('resize',syncStage);
video?.addEventListener('loadedmetadata',syncStage);
requestAnimationFrame(syncStage);
renderAll();


/* Music tab: upload local audio directly from the sidebar. */
const ownMusicButton=document.getElementById('uploadOwnMusicV4231');
const musicInput=document.getElementById('composerAudioV4180');
const musicShelf=document.getElementById('producerMusicShelfV4190');
const musicStatus=document.getElementById('producerOwnMusicStatusV4231');
function openMusicPicker(){
 if(!musicInput)return;
 try{
  if(typeof musicInput.showPicker==='function')musicInput.showPicker();
  else musicInput.click();
 }catch{musicInput.click()}
}
function assignMusicFile(file){
 if(!file||!musicInput)return;
 if(!String(file.type||'').startsWith('audio/')){
  if(musicStatus)musicStatus.textContent='That file is not a supported audio file.';
  return;
 }
 try{
  const transfer=new DataTransfer();
  transfer.items.add(file);
  musicInput.files=transfer.files;
  musicInput.dispatchEvent(new Event('change',{bubbles:true}));
  if(musicStatus)musicStatus.textContent=`Loaded ${file.name}. It is ready for waveform analysis, preview, and export.`;
  document.querySelector('[data-producer-view="music"]')?.classList.add('hasLocalMusicV4231');
 }catch(error){
  if(musicStatus)musicStatus.textContent='Your browser blocked direct assignment. Use the Upload Your Own Music button.';
  openMusicPicker();
 }
}
ownMusicButton?.addEventListener('click',openMusicPicker);
musicShelf?.addEventListener('dragover',event=>{
 event.preventDefault();musicShelf.classList.add('isDragOverV4231');
});
musicShelf?.addEventListener('dragleave',()=>musicShelf.classList.remove('isDragOverV4231'));
musicShelf?.addEventListener('drop',event=>{
 event.preventDefault();musicShelf.classList.remove('isDragOverV4231');
 const file=[...event.dataTransfer.files].find(item=>String(item.type||'').startsWith('audio/'));
 if(file)assignMusicFile(file);
 else if(musicStatus)musicStatus.textContent='Drop an MP3, WAV, OGG, M4A, or another browser-readable audio file.';
});
musicShelf?.addEventListener('keydown',event=>{
 if(event.key==='Enter'||event.key===' '){event.preventDefault();openMusicPicker()}
});
musicInput?.addEventListener('change',()=>{
 const file=musicInput.files?.[0];
 if(file&&musicStatus)musicStatus.textContent=`Loaded ${file.name}. It will be mixed into preview and the finished download.`;
});

window.SOSProducerLayerManagerV4230={
 draw,
 getLayers:()=>layers.map(layer=>({...layer,image:undefined})),
 select:selectLayer,
 addText,
 clear:()=>document.getElementById('clearExtraLayersV4230')?.click()
};
})();
