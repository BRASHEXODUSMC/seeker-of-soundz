(()=>{
'use strict';
const section=document.getElementById('liveDjStageSection');
const stage=document.getElementById('liveFrequencyStage');
if(!section||!stage)return;
const session=window.SOS?.getSession?.();
if(!session){
 stage.hidden=true;
 const gate=document.createElement('div');gate.className='djMemberGate';
 gate.innerHTML='<div class="djMemberGateIcon" aria-hidden="true">🎛️</div><p class="sectionEyebrow">Member Experience</p><h3>Sign in to open the Live Frequency DJ Stage</h3><p>The full waveform deck, lasers, spotlights, strobe controls, queue, blackout focus, and concert effects are reserved for signed-in members.</p><a class="primaryButton" href="members.html">Sign in to unlock the concert</a>';
 stage.before(gate);return;
}
const viewport=stage.querySelector('.djStageViewport');
if(!viewport)return;
let extra=viewport.querySelector('.djExtraFx');
if(!extra){
 extra=document.createElement('div');extra.className='djExtraFx';extra.setAttribute('aria-hidden','true');
 extra.innerHTML='<div class="djLedWall"></div><div class="djFogLayer"></div><div class="djBeamGrid"></div><div class="djSparkLayer"></div><div class="djConfettiLayer"></div><div class="djBassPulse"></div>';
 viewport.appendChild(extra);
}
const lasers=stage.querySelector('.djLasers');
if(lasers&&lasers.querySelectorAll('.djLaser').length<16){
 for(let i=lasers.querySelectorAll('.djLaser').length+1;i<=16;i++){
  const s=document.createElement('span');s.className=`djLaser l${i}`;s.style.setProperty('--start',`${-72+(i-9)*20}deg`);s.style.left=`${8+(i-9)*12}%`;lasers.appendChild(s);
 }
}
const existing=stage.querySelector('.djEffectConsole');
if(existing)existing.remove();
const venue=stage.querySelector('.djConsoleSection:last-of-type')||stage.querySelector('.djControlConsole');
const panel=document.createElement('div');panel.className='djConsoleSection djEffectConsole';
panel.innerHTML=`
 <div class="djFxHeader"><div><p class="sectionEyebrow">Show Designer</p><h3>Concert Presets & FX</h3></div><button class="djResetMaster" id="djResetFx" type="button">Reset to default</button></div>
 <div class="djEffectPresetRow">
  <button class="djPresetButton" data-dj-preset="club" type="button">Underground Club</button>
  <button class="djPresetButton" data-dj-preset="festival" type="button">Mainstage Festival</button>
  <button class="djPresetButton" data-dj-preset="warehouse" type="button">Dark Warehouse</button>
  <button class="djPresetButton" data-dj-preset="cosmic" type="button">Cosmic Rave</button>
  <button class="djPresetButton" data-dj-preset="minimal" type="button">Minimal Deck</button>
  <button class="djPresetButton" data-dj-preset="neon" type="button">Neon Megacity</button>
  <button class="djPresetButton" data-dj-preset="thunder" type="button">Thunder Dome</button>
  <button class="djPresetButton" data-dj-preset="afterhours" type="button">Afterhours</button>
  <button class="djPresetButton" data-dj-preset="dream" type="button">Dream State</button>
  <button class="djPresetButton" data-dj-preset="laserlab" type="button">Laser Laboratory</button>
  <button class="djPresetButton" data-dj-preset="sunrise" type="button">Sunrise Finale</button>
  <button class="djPresetButton" data-dj-preset="cyber" type="button">Cyber Pulse</button>
 </div>
 <div class="djEffectToggleGrid">
  <button class="djEffectToggle" data-dj-fx="fog" type="button"><span>Venue fog</span><i></i></button>
  <button class="djEffectToggle" data-dj-fx="led" type="button"><span>LED wall</span><i></i></button>
  <button class="djEffectToggle" data-dj-fx="grid" type="button"><span>Beam grid</span><i></i></button>
  <button class="djEffectToggle" data-dj-fx="bass" type="button"><span>Bass pulse</span><i></i></button>
  <button class="djEffectToggle" data-dj-fx="sparks" type="button"><span>Spark fountains</span><i></i></button>
  <button class="djEffectToggle" data-dj-fx="confetti" type="button"><span>Confetti</span><i></i></button>
 </div>
 <div class="djSubConsole"><h4>Laser Array</h4><div class="djConsoleGrid">
  <div class="djControlGroup"><label for="djLaserCount">Laser quantity</label><select id="djLaserCount"><option value="2">2 beams</option><option value="4">4 beams</option><option value="8">8 beams</option><option value="12">12 beams</option><option value="16">16 beams</option></select></div>
 </div></div>
 <div class="djSubConsole djStrobeDesigner"><div class="djSubConsoleTitle"><h4>Custom Strobe Designer</h4><span>Accessibility-capped below rapid-flash ranges</span></div><div class="djConsoleGrid">
  <div class="djControlGroup"><label for="djStrobePattern">Strobe pattern</label><select id="djStrobePattern"><option value="single">Single Flash</option><option value="double">Double Hit</option><option value="triple">Triple Accent</option><option value="sweep">Stage Sweep</option><option value="breathe">White Breathe</option></select></div>
  <div class="djControlGroup"><label for="djStrobeRhythm">Strobe rhythm <output id="djStrobeRhythmValue"></output></label><input id="djStrobeRhythm" type="range" min="0.65" max="4" step="0.05" value="2.8"></div>
  <div class="djControlGroup"><label for="djStrobeBrightness">Strobe brightness <output id="djStrobeBrightnessValue"></output></label><input id="djStrobeBrightness" type="range" min="0.15" max="1" step="0.05" value="0.75"></div>
  <div class="djControlGroup"><label for="djStrobeWidth">Flash width <output id="djStrobeWidthValue"></output></label><input id="djStrobeWidth" type="range" min="45" max="220" step="5" value="90"></div>
 </div></div>
 <div class="djResetOptions">
  <button class="djEffectToggle" id="djAutoReset" type="button"><span>Auto-reset after track ends</span><i></i></button>
  <p>When enabled, the show returns to the default concert setup after audio stops or finishes.</p>
 </div>`;
venue.after(panel);
const defaults={fog:true,led:true,grid:false,bass:true,sparks:false,confetti:false,laserCount:8,strobeRhythm:2.8,strobeBrightness:.75,strobeWidth:90,strobePattern:'single',preset:'festival',autoReset:false};
let state={...defaults};
try{state={...state,...JSON.parse(localStorage.getItem('sosDjExtraFx')||'{}')}}catch{}
// backwards compatibility
if(state.strobeSpeed&&!state.strobeRhythm)state.strobeRhythm=Number(state.strobeSpeed);
const presets={
 club:{fog:true,led:true,grid:true,bass:true,sparks:false,confetti:false,laserCount:8,strobeRhythm:2.8,strobeBrightness:.58,strobeWidth:95,strobePattern:'single'},
 festival:{fog:true,led:true,grid:true,bass:true,sparks:true,confetti:true,laserCount:16,strobeRhythm:1.55,strobeBrightness:.88,strobeWidth:80,strobePattern:'double'},
 warehouse:{fog:true,led:false,grid:true,bass:true,sparks:false,confetti:false,laserCount:12,strobeRhythm:2.25,strobeBrightness:.82,strobeWidth:70,strobePattern:'triple'},
 cosmic:{fog:true,led:true,grid:false,bass:true,sparks:true,confetti:false,laserCount:16,strobeRhythm:3.3,strobeBrightness:.52,strobeWidth:140,strobePattern:'breathe'},
 minimal:{fog:false,led:false,grid:false,bass:false,sparks:false,confetti:false,laserCount:2,strobeRhythm:4,strobeBrightness:.28,strobeWidth:65,strobePattern:'single'},
 neon:{fog:true,led:true,grid:true,bass:true,sparks:false,confetti:false,laserCount:12,strobeRhythm:2.1,strobeBrightness:.7,strobeWidth:85,strobePattern:'sweep'},
 thunder:{fog:true,led:false,grid:true,bass:true,sparks:true,confetti:false,laserCount:16,strobeRhythm:.9,strobeBrightness:1,strobeWidth:60,strobePattern:'triple'},
 afterhours:{fog:true,led:false,grid:false,bass:true,sparks:false,confetti:false,laserCount:4,strobeRhythm:3.6,strobeBrightness:.38,strobeWidth:120,strobePattern:'single'},
 dream:{fog:true,led:true,grid:false,bass:true,sparks:false,confetti:true,laserCount:8,strobeRhythm:3.8,strobeBrightness:.4,strobeWidth:180,strobePattern:'breathe'},
 laserlab:{fog:true,led:false,grid:true,bass:false,sparks:false,confetti:false,laserCount:16,strobeRhythm:2.6,strobeBrightness:.48,strobeWidth:75,strobePattern:'sweep'},
 sunrise:{fog:true,led:true,grid:false,bass:true,sparks:true,confetti:true,laserCount:12,strobeRhythm:2.9,strobeBrightness:.62,strobeWidth:150,strobePattern:'double'},
 cyber:{fog:true,led:true,grid:true,bass:true,sparks:true,confetti:false,laserCount:16,strobeRhythm:1.85,strobeBrightness:.78,strobeWidth:70,strobePattern:'double'}
};
const save=()=>{try{localStorage.setItem('sosDjExtraFx',JSON.stringify(state))}catch{}};
const q=id=>panel.querySelector('#'+id);
function apply(){
 ['fog','led','grid','bass','sparks','confetti'].forEach(k=>{stage.classList.toggle(`fx-${k}-on`,!!state[k]);panel.querySelector(`[data-dj-fx="${k}"]`)?.setAttribute('aria-pressed',String(!!state[k]))});
 stage.dataset.strobePattern=state.strobePattern;
 stage.style.setProperty('--dj-strobe-speed',`${Number(state.strobeRhythm)}s`);
 stage.style.setProperty('--dj-strobe-brightness',String(state.strobeBrightness));
 stage.style.setProperty('--dj-strobe-width',`${Number(state.strobeWidth)}ms`);
 q('djLaserCount').value=String(state.laserCount);q('djStrobePattern').value=state.strobePattern;q('djStrobeRhythm').value=String(state.strobeRhythm);q('djStrobeBrightness').value=String(state.strobeBrightness);q('djStrobeWidth').value=String(state.strobeWidth);
 q('djStrobeRhythmValue').textContent=`${Number(state.strobeRhythm).toFixed(2)}s`;q('djStrobeBrightnessValue').textContent=`${Math.round(Number(state.strobeBrightness)*100)}%`;q('djStrobeWidthValue').textContent=`${Math.round(Number(state.strobeWidth))}ms`;
 stage.querySelectorAll('.djLaser').forEach((el,i)=>{el.style.display=i<Number(state.laserCount)?'block':'none'});
 panel.querySelectorAll('[data-dj-preset]').forEach(b=>b.classList.toggle('is-active',b.dataset.djPreset===state.preset));
 q('djAutoReset').setAttribute('aria-pressed',String(!!state.autoReset));
}
function resetAll(showToast=true){state={...defaults};save();apply();document.getElementById('djResetShow')?.click();if(showToast)window.SOS?.toast?.('DJ concert restored to the default show.',{title:'Show reset'})}
panel.addEventListener('click',e=>{
 const fx=e.target.closest('[data-dj-fx]');if(fx){const k=fx.dataset.djFx;state[k]=!state[k];state.preset='custom';save();apply();return}
 const p=e.target.closest('[data-dj-preset]');if(p){state={...state,...presets[p.dataset.djPreset],preset:p.dataset.djPreset};save();apply();window.SOS?.toast?.(`${p.textContent.trim()} show loaded.`,{title:'DJ show preset'});return}
 if(e.target.closest('#djResetFx')){resetAll();return}
 if(e.target.closest('#djAutoReset')){state.autoReset=!state.autoReset;save();apply();return}
});
q('djLaserCount').addEventListener('change',e=>{state.laserCount=Number(e.target.value);state.preset='custom';save();apply()});
q('djStrobePattern').addEventListener('change',e=>{state.strobePattern=e.target.value;state.preset='custom';save();apply()});
q('djStrobeRhythm').addEventListener('input',e=>{state.strobeRhythm=Number(e.target.value);state.preset='custom';save();apply()});
q('djStrobeBrightness').addEventListener('input',e=>{state.strobeBrightness=Number(e.target.value);state.preset='custom';save();apply()});
q('djStrobeWidth').addEventListener('input',e=>{state.strobeWidth=Number(e.target.value);state.preset='custom';save();apply()});
let wasPlaying=false;
function watchPlayback(){
 const playing=stage.classList.contains('is-playing');
 if(wasPlaying&&!playing&&state.autoReset)resetAll(false);
 wasPlaying=playing;
}
new MutationObserver(watchPlayback).observe(stage,{attributes:true,attributeFilter:['class']});
apply();
})();
