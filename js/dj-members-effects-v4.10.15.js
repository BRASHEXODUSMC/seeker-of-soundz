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
 stage.before(gate);
 return;
}
const viewport=stage.querySelector('.djStageViewport');
if(!viewport)return;
const extra=document.createElement('div');extra.className='djExtraFx';extra.setAttribute('aria-hidden','true');
extra.innerHTML='<div class="djLedWall"></div><div class="djFogLayer"></div><div class="djBeamGrid"></div><div class="djSparkLayer"></div><div class="djConfettiLayer"></div><div class="djBassPulse"></div>';
viewport.appendChild(extra);
const lasers=stage.querySelector('.djLasers');
if(lasers){for(let i=9;i<=16;i++){const s=document.createElement('span');s.className=`djLaser l${i}`;s.style.setProperty('--start',`${-72+(i-9)*20}deg`);s.style.left=`${8+(i-9)*12}%`;lasers.appendChild(s)}}
const venue=stage.querySelector('.djConsoleSection:last-of-type')||stage.querySelector('.djControlConsole');
const panel=document.createElement('div');panel.className='djConsoleSection djEffectConsole';
panel.innerHTML=`<h3>Show FX & Presets</h3><div class="djEffectPresetRow"><button class="djPresetButton" data-dj-preset="club" type="button">Underground Club</button><button class="djPresetButton" data-dj-preset="festival" type="button">Mainstage Festival</button><button class="djPresetButton" data-dj-preset="warehouse" type="button">Dark Warehouse</button><button class="djPresetButton" data-dj-preset="cosmic" type="button">Cosmic Rave</button><button class="djPresetButton" data-dj-preset="minimal" type="button">Minimal Deck</button></div><div class="djEffectToggleGrid"><button class="djEffectToggle" data-dj-fx="fog" type="button"><span>Venue fog</span><i></i></button><button class="djEffectToggle" data-dj-fx="led" type="button"><span>LED wall</span><i></i></button><button class="djEffectToggle" data-dj-fx="grid" type="button"><span>Beam grid</span><i></i></button><button class="djEffectToggle" data-dj-fx="bass" type="button"><span>Bass pulse</span><i></i></button><button class="djEffectToggle" data-dj-fx="sparks" type="button"><span>Spark fountains</span><i></i></button><button class="djEffectToggle" data-dj-fx="confetti" type="button"><span>Confetti</span><i></i></button></div><div class="djConsoleGrid" style="margin-top:14px"><div class="djControlGroup"><label for="djLaserCount">Laser quantity</label><select id="djLaserCount"><option value="2">2 beams</option><option value="4">4 beams</option><option value="8" selected>8 beams</option><option value="12">12 beams</option><option value="16">16 beams</option></select></div><div class="djControlGroup"><label for="djStrobeSpeed">Strobe rhythm</label><select id="djStrobeSpeed"><option value="3.4">Slow pulse</option><option value="2.8" selected>Concert pulse</option><option value="2.1">Energetic pulse</option></select></div><div class="djControlGroup"><label for="djStrobeBrightness">Strobe brightness</label><input id="djStrobeBrightness" type="range" min="0.25" max="1" step="0.05" value="0.75"></div></div>`;
venue.after(panel);
let state={fog:true,led:true,grid:false,bass:true,sparks:false,confetti:false,laserCount:8,strobeSpeed:'2.8',strobeBrightness:'.75',preset:'festival'};
try{state={...state,...JSON.parse(localStorage.getItem('sosDjExtraFx')||'{}')}}catch{}
const save=()=>{try{localStorage.setItem('sosDjExtraFx',JSON.stringify(state))}catch{}};
function apply(){
 ['fog','led','grid','bass','sparks','confetti'].forEach(k=>{stage.classList.toggle(`fx-${k}-on`,!!state[k]);const b=panel.querySelector(`[data-dj-fx="${k}"]`);b?.setAttribute('aria-pressed',String(!!state[k]))});
 stage.style.setProperty('--dj-strobe-speed',`${state.strobeSpeed}s`);stage.style.setProperty('--dj-strobe-brightness',state.strobeBrightness);
 panel.querySelector('#djLaserCount').value=String(state.laserCount);panel.querySelector('#djStrobeSpeed').value=String(state.strobeSpeed);panel.querySelector('#djStrobeBrightness').value=String(state.strobeBrightness);
 stage.querySelectorAll('.djLaser').forEach((el,i)=>{el.style.display=i<Number(state.laserCount)?'block':'none'});
 panel.querySelectorAll('[data-dj-preset]').forEach(b=>b.classList.toggle('is-active',b.dataset.djPreset===state.preset));
}
const presets={club:{fog:true,led:true,grid:true,bass:true,sparks:false,confetti:false,laserCount:8,strobeSpeed:'2.8',strobeBrightness:'.65'},festival:{fog:true,led:true,grid:true,bass:true,sparks:true,confetti:true,laserCount:16,strobeSpeed:'2.1',strobeBrightness:'.85'},warehouse:{fog:true,led:false,grid:true,bass:true,sparks:false,confetti:false,laserCount:12,strobeSpeed:'2.8',strobeBrightness:'.9'},cosmic:{fog:true,led:true,grid:false,bass:true,sparks:true,confetti:false,laserCount:16,strobeSpeed:'3.4',strobeBrightness:'.55'},minimal:{fog:false,led:false,grid:false,bass:false,sparks:false,confetti:false,laserCount:2,strobeSpeed:'3.4',strobeBrightness:'.35'}};
panel.addEventListener('click',e=>{const fx=e.target.closest('[data-dj-fx]');if(fx){const k=fx.dataset.djFx;state[k]=!state[k];save();apply();return}const p=e.target.closest('[data-dj-preset]');if(p){state={...state,...presets[p.dataset.djPreset],preset:p.dataset.djPreset};save();apply();window.SOS?.toast?.(`${p.textContent.trim()} show loaded.`,{title:'DJ show preset'});}});
panel.querySelector('#djLaserCount').addEventListener('change',e=>{state.laserCount=Number(e.target.value);save();apply()});
panel.querySelector('#djStrobeSpeed').addEventListener('change',e=>{state.strobeSpeed=e.target.value;save();apply()});
panel.querySelector('#djStrobeBrightness').addEventListener('input',e=>{state.strobeBrightness=e.target.value;save();apply()});
apply();
})();
