/* Seeker Of SoundZ v4.18.0 — compact modular video studio */
(()=>{
'use strict';
const studio=document.getElementById('videoEffectsStudio'),command=document.getElementById('studioCommandCenterV4180');
if(!studio||!command)return;
const panel=name=>command.querySelector(`[data-studio-panel="${name}"]`);
const dashboard=document.createElement('section');
dashboard.className='studioProjectDashboardV4181';
dashboard.innerHTML=`
 <div class="projectProgressV4181">
  <div><p class="sectionEyebrow">Project Readiness</p><strong id="projectReadinessLabelV4181">Start your project</strong></div>
  <div class="projectProgressTrackV4181"><span id="projectProgressFillV4181"></span></div>
  <b id="projectProgressValueV4181">0%</b>
 </div>
 <div class="selectedEffectsSummaryV4181">
  <div><p class="sectionEyebrow">Active Effects</p><strong id="activeEffectCountV4181">0 selected</strong></div>
  <div id="activeEffectChipsV4181"><span class="emptyEffectChipV4181">No effects selected</span></div>
 </div>
 <div class="studioQuickActionsV4181">
  <button type="button" data-open-module="create"><i>▶</i><span><strong>Preview</strong><small>Open project canvas</small></span></button>
  <button type="button" id="studioFocusModeV4181"><i>◉</i><span><strong>Focus Mode</strong><small>Cinematic distraction-free preview</small></span></button>
  <button type="button" id="clearAllStudioEffectsV4181"><i>×</i><span><strong>Clear FX</strong><small>Remove selected effects</small></span></button>
 </div>`;
command.querySelector('.studioModuleNavV4180')?.insertAdjacentElement('afterend',dashboard);
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
move('#providerManagerV4182','export');
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
let tutorialNativeCursorWasSet=false;
function openTutorial(){
 index=0;renderTutorial();
 tutorialNativeCursorWasSet=document.documentElement.classList.contains('nativeCursor');
 document.documentElement.classList.add('studioTutorialOpenV4181','nativeCursor');
 document.body.classList.add('studioTutorialOpenV4181');
 dialog.showModal();
 setTimeout(()=>document.getElementById('tutorialNextV4180')?.focus({preventScroll:true}),30);
}
function closeTutorial(){
 dialog.close();
 document.documentElement.classList.remove('studioTutorialOpenV4181');
 document.body.classList.remove('studioTutorialOpenV4181');
 if(!tutorialNativeCursorWasSet)document.documentElement.classList.remove('nativeCursor');
}
document.getElementById('openStudioTutorialV4180')?.addEventListener('click',openTutorial);
document.getElementById('closeStudioTutorialV4180')?.addEventListener('click',closeTutorial);
document.getElementById('tutorialPrevV4180')?.addEventListener('click',()=>{if(index>0){index--;renderTutorial()}});
document.getElementById('tutorialNextV4180')?.addEventListener('click',()=>{if(index<slides.length-1){index++;renderTutorial()}else closeTutorial()});
dialog.addEventListener('click',event=>{if(event.target===dialog)closeTutorial()});
dialog.addEventListener('cancel',event=>{event.preventDefault();closeTutorial()});
dialog.addEventListener('keydown',event=>{
 if(event.key==='ArrowRight'){event.preventDefault();if(index<slides.length-1){index++;renderTutorial()}else closeTutorial()}
 if(event.key==='ArrowLeft'){event.preventDefault();if(index>0){index--;renderTutorial()}}
});
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

// Live project readiness and selected-effects summary.
const readinessLabel=document.getElementById('projectReadinessLabelV4181');
const readinessFill=document.getElementById('projectProgressFillV4181');
const readinessValue=document.getElementById('projectProgressValueV4181');
const effectCount=document.getElementById('activeEffectCountV4181');
const effectChips=document.getElementById('activeEffectChipsV4181');
function selectedEffectInputs(){return [...document.querySelectorAll('[data-effect]:checked')]}
function effectName(input){return input.closest('label')?.querySelector('strong')?.textContent?.trim()||input.dataset.effect}
function refreshDashboard(){
 const hasVideo=!!document.getElementById('composerVideoV4180')?.files?.length||!!document.getElementById('videoFileV4171')?.files?.length;
 const hasAudio=!!document.getElementById('composerAudioV4180')?.files?.length;
 const effects=selectedEffectInputs();
 const hasTrim=Number(document.getElementById('composerEndV4180')?.value||document.getElementById('trimEndV4171')?.value||0)>0;
 const checks=[hasVideo,hasAudio,effects.length>0,hasTrim];
 const percent=Math.round(checks.filter(Boolean).length/checks.length*100);
 readinessFill.style.width=`${percent}%`;readinessValue.textContent=`${percent}%`;
 readinessLabel.textContent=percent===100?'Ready to render':hasVideo&&hasAudio?'Choose effects and confirm timing':hasVideo?'Add licensed music':'Start with a video';
 effectCount.textContent=`${effects.length} selected`;
 effectChips.innerHTML=effects.length
  ? effects.slice(0,8).map(input=>`<span>${effectName(input)}</span>`).join('')+(effects.length>8?`<span>+${effects.length-8} more</span>`:'')
  : '<span class="emptyEffectChipV4181">No effects selected</span>';
}
document.addEventListener('change',event=>{
 if(event.target.matches('[data-effect],#composerVideoV4180,#composerAudioV4180,#videoFileV4171,#composerEndV4180,#trimEndV4171'))refreshDashboard();
});
document.addEventListener('click',event=>{
 if(event.target.closest('[data-effect-preset],[data-effect-clear]'))setTimeout(refreshDashboard,20);
});
document.getElementById('clearAllStudioEffectsV4181')?.addEventListener('click',()=>{
 document.querySelectorAll('[data-effect]:checked').forEach(input=>{input.checked=false;input.dispatchEvent(new Event('change',{bubbles:true}))});
 window.SOS?.toast?.('All video effects cleared.',{title:'Video Studio',icon:'✓'});
});
refreshDashboard();

// Cinematic focus mode keeps the real preview and controls inside a modal-like workspace.
const focusButton=document.getElementById('studioFocusModeV4181');
let focusPlaceholder=null,focusPreview=null;
function closeFocusMode(){
 if(!focusPreview)return;
 focusPlaceholder?.replaceWith(focusPreview);
 focusPreview.classList.remove('studioFocusPreviewV4181');
 document.documentElement.classList.remove('studioFocusOpenV4181');
 document.getElementById('studioFocusBackdropV4181')?.remove();
 focusPreview=null;focusPlaceholder=null;
}
focusButton?.addEventListener('click',()=>{
 const preview=document.getElementById('stickyVideoPreviewV4177')||document.querySelector('.composerPreviewV4180');
 if(!preview)return window.SOS?.toast?.('Load or open a video preview first.',{title:'Focus Mode',icon:'▶'});
 focusPlaceholder=document.createComment('studio-preview-placeholder');
 preview.replaceWith(focusPlaceholder);focusPreview=preview;
 const backdrop=document.createElement('div');backdrop.id='studioFocusBackdropV4181';backdrop.className='studioFocusBackdropV4181';
 backdrop.innerHTML='<div class="studioFocusBarV4181"><div><p class="sectionEyebrow">Cinematic Preview</p><strong>Live effects focus mode</strong></div><button type="button" id="closeStudioFocusV4181">Exit Focus Mode</button></div><div class="studioFocusStageV4181"></div>';
 backdrop.querySelector('.studioFocusStageV4181').appendChild(preview);
 preview.classList.add('studioFocusPreviewV4181');document.body.appendChild(backdrop);
 document.documentElement.classList.add('studioFocusOpenV4181');
 backdrop.querySelector('#closeStudioFocusV4181').addEventListener('click',closeFocusMode);
 backdrop.addEventListener('click',event=>{if(event.target===backdrop)closeFocusMode()});
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&focusPreview)closeFocusMode()});
})();