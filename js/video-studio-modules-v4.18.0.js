/* Seeker Of SoundZ v4.18.0 — compact modular video studio */
(()=>{
'use strict';
const studio=document.getElementById('videoEffectsStudio'),command=document.getElementById('studioCommandCenterV4180');
if(!studio||!command)return;
const panel=name=>command.querySelector(`[data-studio-panel="${name}"]`);
const move=(selector,name)=>{
 const node=studio.querySelector(selector);
 if(node&&panel(name)&&!panel(name).contains(node))panel(name).appendChild(node);
 return node;
};

// Reorganize existing systems without deleting or renaming them.
move('.youtubeProjectPickerV4175','create');
move('#directComposerV4180','create');
move('.videoStudioInputV4171','create');
const workspace=studio.querySelector('.videoStudioWorkspaceV4171');
if(workspace){
 const preview=workspace.querySelector('#stickyVideoPreviewV4177');
 const effects=workspace.querySelector('.videoEffectsControlsV4171');
 if(preview)panel('create').appendChild(preview);
 if(effects)panel('effects').appendChild(effects);
 workspace.remove();
}
move('#licensedMusicLibraryV4180','library');
move('#licensedVideoLibraryV41712','library');
move('.freeEffectsLibraryV4172','library');
move('#tabCaptureStudioV4178','capture');
move('#mediaConverterV4177','export');

// Add an effects intro and compact preview link.
const effectsPanel=panel('effects');
if(effectsPanel&&!effectsPanel.querySelector('.moduleIntroV4180')){
 const intro=document.createElement('div');
 intro.className='moduleIntroV4180';
 intro.innerHTML='<div><p class="sectionEyebrow">Visual Effects</p><h2>Presets and individual effects</h2><p>Select a preset or effect without leaving this module. Open Create whenever you want to see the full video preview.</p></div><button type="button" class="accountFeatureActionV417" data-open-module="create"><i>▶</i><span><strong>Open Video Preview</strong><small>Your selected effects stay active.</small></span></button>';
 effectsPanel.prepend(intro);
}

// Export module gets a direct action back to composer.
const exportPanel=panel('export');
if(exportPanel&&!exportPanel.querySelector('.moduleIntroV4180')){
 const intro=document.createElement('div');
 intro.className='moduleIntroV4180';
 intro.innerHTML='<div><p class="sectionEyebrow">Export</p><h2>Build your finished project</h2><p>The recommended exporter is inside the direct composer. Local video and uploaded music provide the most reliable result in every supported browser.</p></div><button type="button" class="accountFeatureActionV417" data-open-module="create"><i>⬇</i><span><strong>Go to Direct Composer</strong><small>Render video + music without screen capture.</small></span></button>';
 exportPanel.prepend(intro);
}

function activate(name,{focus=false}={}){
 command.querySelectorAll('[data-studio-module]').forEach(button=>button.classList.toggle('isActive',button.dataset.studioModule===name));
 command.querySelectorAll('[data-studio-panel]').forEach(section=>section.classList.toggle('isActive',section.dataset.studioPanel===name));
 localStorage.setItem('sos_video_studio_module_v4180',name);
 if(focus)command.querySelector(`[data-studio-module="${name}"]`)?.focus({preventScroll:true});
}
command.addEventListener('click',event=>{
 const tab=event.target.closest('[data-studio-module]');
 const open=event.target.closest('[data-open-module]');
 if(tab){event.preventDefault();activate(tab.dataset.studioModule);return}
 if(open){event.preventDefault();activate(open.dataset.openModule);return}
});
activate(localStorage.getItem('sos_video_studio_module_v4180')||'start');

// Tutorial
const dialog=document.getElementById('studioTutorialV4180');
const slides=[...dialog.querySelectorAll('[data-tutorial-slide]')];
let index=0;
function renderTutorial(){
 slides.forEach((slide,i)=>slide.classList.toggle('isActive',i===index));
 document.getElementById('tutorialCountV4180').textContent=`${index+1} / ${slides.length}`;
 document.getElementById('tutorialProgressV4180').style.width=`${(index+1)/slides.length*100}%`;
 document.getElementById('tutorialPrevV4180').disabled=index===0;
 document.getElementById('tutorialNextV4180').textContent=index===slides.length-1?'Finish':'Next';
}
document.getElementById('openStudioTutorialV4180')?.addEventListener('click',()=>{index=0;renderTutorial();dialog.showModal()});
document.getElementById('closeStudioTutorialV4180')?.addEventListener('click',()=>dialog.close());
document.getElementById('tutorialPrevV4180')?.addEventListener('click',()=>{if(index>0){index--;renderTutorial()}});
document.getElementById('tutorialNextV4180')?.addEventListener('click',()=>{if(index<slides.length-1){index++;renderTutorial()}else dialog.close()});
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
renderTutorial();

// Browser support summary based on actual APIs.
const firefox=/firefox/i.test(navigator.userAgent);
const captureCard=document.querySelector('[data-browser-support="capture"] small');
if(captureCard){
 captureCard.textContent=firefox
  ? 'Firefox supports screen capture, but shared-tab/system audio varies by OS. Use the local composer for dependable audio rendering.'
  : 'Chrome and Edge provide the strongest shared-tab audio support. The permission dialog is always required.';
}
const exportCard=document.querySelector('[data-browser-support="export"] small');
if(exportCard){
 const mp4=window.MediaRecorder?.isTypeSupported?.('video/mp4');
 exportCard.textContent=mp4?'This browser reports MP4 recording support; WEBM remains the safest fallback.':'WEBM is supported. MP4 recording is not reported by this browser.';
}

// Prevent module controls from navigating or changing page scroll.
command.addEventListener('click',event=>{
 const control=event.target.closest('button,summary');
 if(!control)return;
 const x=window.scrollX,y=window.scrollY;
 requestAnimationFrame(()=>window.scrollTo({left:x,top:y,behavior:'auto'}));
},{capture:true});
})();