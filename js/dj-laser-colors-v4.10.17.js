/* Seeker Of SoundZ v4.10.17 — customizable laser colors */
(()=>{
 'use strict';
 const stage=document.getElementById('liveFrequencyStage');if(!stage)return;
 const KEY='sos_dj_laser_colors_v1';
 const palette={violet:'#a768ff',cyan:'#42dcff',magenta:'#ff47c4',green:'#5cff9a',gold:'#ffe252',red:'#ff5a46',blue:'#4f79ff',white:'#ffffff'};
 const hexRgb=h=>{h=(h||'#a768ff').replace('#','');if(h.length===3)h=[...h].map(x=>x+x).join('');return `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`};
 let s;try{s={mode:'random',solid:'violet',...(JSON.parse(localStorage.getItem(KEY)||'{}'))}}catch{s={mode:'random',solid:'violet'}}
 const controls=document.querySelector('.djControlsGrid,.djConsoleControls,.djControlPanel');if(!controls)return;
 const wrap=document.createElement('div');wrap.className='djLaserColorDesigner';wrap.innerHTML=`<div class="djControlGroup"><label for="djLaserColorMode">Laser color mode</label><select id="djLaserColorMode"><option value="random">Random multi-color</option><option value="solid">Solid single color</option></select></div><div class="djControlGroup"><label for="djLaserSolidColor">Solid laser color</label><select id="djLaserSolidColor">${Object.keys(palette).map(k=>`<option value="${k}">${k[0].toUpperCase()+k.slice(1)}</option>`).join('')}</select></div><div class="djControlGroup"><label>Laser color preview</label><div class="djLaserColorPreview" id="djLaserColorPreview"></div></div>`;
 controls.appendChild(wrap);
 const mode=wrap.querySelector('#djLaserColorMode'),solid=wrap.querySelector('#djLaserSolidColor'),preview=wrap.querySelector('#djLaserColorPreview');
 function apply(){mode.value=s.mode;solid.value=s.solid;solid.disabled=s.mode!=='solid';stage.dataset.laserColorMode=s.mode;stage.style.setProperty('--dj-laser-solid-rgb',hexRgb(palette[s.solid]));preview.style.setProperty('--laser-one',s.mode==='solid'?palette[s.solid]:'#a768ff');preview.style.setProperty('--laser-two',s.mode==='solid'?palette[s.solid]:'#42dcff');preview.style.setProperty('--laser-three',s.mode==='solid'?palette[s.solid]:'#ff47c4');localStorage.setItem(KEY,JSON.stringify(s));}
 mode.addEventListener('change',()=>{s.mode=mode.value;apply()});solid.addEventListener('change',()=>{s.solid=solid.value;apply()});
 document.getElementById('djResetShow')?.addEventListener('click',()=>{s={mode:'random',solid:'violet'};apply()});window.addEventListener('sos:dj-reset',()=>{s={mode:'random',solid:'violet'};apply()});apply();
})();
