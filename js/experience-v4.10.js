/* Seeker Of SoundZ v4.10.8 — account-scoped experience profiles and guest-default restoration */
(()=>{
"use strict";
const SETTINGS_KEY="sos_experience_settings_v2",LEGACY_KEY="sos_experience_settings_v1",ADMIN_DEFAULTS_KEY="sos_experience_defaults_v2",LEGACY_DEFAULTS="sos_experience_defaults_v1";
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}},write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const getSession=()=>window.SOS?.getSession?.()||null;
const sessionKey=session=>{const s=session||getSession();return s?.id||s?.email||null};
const siteDefaults=()=>({...defaults,...read(ADMIN_DEFAULTS_KEY,{})});
const defaults={starfield:"balanced",nebula:false,shootingStars:true,loader:"signal",motion:"balanced",cursorGlow:true,theme:"original",transition:"stellar",contrast:"balanced",cardGlow:true};
const migrate=()=>{if(!localStorage.getItem(SETTINGS_KEY)&&localStorage.getItem(LEGACY_KEY))localStorage.setItem(SETTINGS_KEY,localStorage.getItem(LEGACY_KEY));if(!localStorage.getItem(ADMIN_DEFAULTS_KEY)&&localStorage.getItem(LEGACY_DEFAULTS))localStorage.setItem(ADMIN_DEFAULTS_KEY,localStorage.getItem(LEGACY_DEFAULTS));};migrate();
function settingsForSession(session){
 const global=siteDefaults(),key=sessionKey(session);
 if(!key)return global;
 const all=read(SETTINGS_KEY,{});
 return {...global,...(all[key]||{})};
}
function currentSettings(){return settingsForSession(getSession())}
function saveSettings(next){
 const key=sessionKey();
 if(!key){const guest=siteDefaults();applySettings(guest);return guest}
 const all=read(SETTINGS_KEY,{});
 all[key]={...settingsForSession(getSession()),...next};
 write(SETTINGS_KEY,all);
 const saved=settingsForSession(getSession());
 applySettings(saved);
 return saved;
}
const themeTokens={
 original:["#160020","#07000c","#000000","155,74,255"],
 black:["#030303","#010101","#000000","210,210,225"],
 violet:["#1a0328","#09010f","#000000","191,99,255"],
 blue:["#020c1e","#01040b","#000000","78,150,255"],
 crimson:["#1b020b","#080104","#000000","255,72,113"],
 emerald:["#021711","#010806","#000000","63,230,177"],
 monochrome:["#101014","#050507","#000000","235,235,245"]
};
function applySettings(settings){
 const s=settings?{...defaults,...settings}:currentSettings(),h=document.documentElement;
 [...h.classList].filter(c=>/^(sos-stars|sos-motion|sos-loader|sos-theme|sos-transition|sos-contrast)-/.test(c)).forEach(c=>h.classList.remove(c));
 h.classList.add(`sos-stars-${s.starfield}`,`sos-motion-${s.motion}`,`sos-loader-${s.loader}`,`sos-theme-${s.theme}`,`sos-transition-${s.transition}`,`sos-contrast-${s.contrast}`);
 h.classList.toggle("sos-nebula-enabled",!!s.nebula);h.classList.toggle("sos-shooting-disabled",!s.shootingStars);h.classList.toggle("sos-cursor-glow",!!s.cursorGlow);h.classList.toggle("sos-card-glow",!!s.cardGlow);
 const t=themeTokens[s.theme]||themeTokens.original;
 h.style.setProperty("--sos-theme-top",t[0]);h.style.setProperty("--sos-theme-mid",t[1]);h.style.setProperty("--sos-theme-bottom",t[2]);h.style.setProperty("--sos-accent",t[3]);
 h.dataset.sosAppliedTheme=s.theme;
 if(document.body){
  document.body.style.setProperty("--sos-theme-top",t[0]);
  document.body.style.setProperty("--sos-theme-mid",t[1]);
  document.body.style.setProperty("--sos-theme-bottom",t[2]);
  document.body.style.setProperty("background-color",t[2],"important");
  document.body.style.setProperty("background-image",`linear-gradient(180deg, ${t[0]} 0%, ${t[1]} 44%, ${t[2]} 100%)`,"important");
  document.body.style.setProperty("background-attachment","fixed","important");
  let backdrop=document.getElementById("sosExperienceBackdrop");
  if(!backdrop){
   backdrop=document.createElement("div");
   backdrop.id="sosExperienceBackdrop";
   backdrop.setAttribute("aria-hidden","true");
   document.body.prepend(backdrop);
  }
  backdrop.style.setProperty("background",`linear-gradient(180deg, ${t[0]} 0%, ${t[1]} 44%, ${t[2]} 100%)`,"important");
  backdrop.dataset.theme=s.theme;
 }
 window.dispatchEvent(new CustomEvent("sos:experience-settings",{detail:s}));
 window.dispatchEvent(new CustomEvent("sos:experience-applied",{detail:s}));
 updatePreview(s);
 requestAnimationFrame(()=>{h.classList.add("sosExperienceRepaint");requestAnimationFrame(()=>h.classList.remove("sosExperienceRepaint"))});
 return s;
}
function applyDefaultSettings(){return applySettings(siteDefaults())}
function applyForSession(session){return applySettings(settingsForSession(session))}
window.SOSExperience={get:currentSettings,getDefaults:siteDefaults,set:saveSettings,apply:applySettings,applyDefault:applyDefaultSettings,applyForSession};
function opts(value,list){return list.map(([v,l])=>`<option value="${v}" ${value===v?"selected":""}>${l}</option>`).join("")}
function settingsMarkup(title="Personal Experience Studio",admin=false){const s=admin?{...defaults,...read(ADMIN_DEFAULTS_KEY,{})}:currentSettings();return `<section class="experienceStudio experienceStudioV410 ${admin?"adminExperienceStudio":""}" data-experience-studio="${admin?"admin":"member"}"><div class="experienceStudioHead"><div><p class="sectionEyebrow">Personal Signal Design</p><h2>${title}</h2><p>Preview and save an atmosphere that belongs to ${admin?"new visitors":"your signed-in account"}. Signing out restores the site defaults automatically.</p></div><span class="experienceSignal"><i></i>LIVE PREVIEW</span></div><div class="experienceStudioLayout"><div class="experienceGrid"><label class="experienceControl"><span>Background palette</span><select data-setting="theme">${opts(s.theme,[["original","Original SOS"],["black","Midnight Black"],["violet","Deep Violet"],["blue","Void Blue"],["crimson","Dark Crimson"],["emerald","Signal Emerald"],["monochrome","Monochrome"]])}</select><small>Changes the page atmosphere while preserving readability.</small></label><label class="experienceControl"><span>Page transition</span><select data-setting="transition">${opts(s.transition,[["stellar","Stellar Signal Jump"],["fade","Soft Fade"],["aperture","Frequency Aperture"],["warp","Star Warp"],["scan","Signal Scan"],["cubes","Orbiting Cubes"],["minimal","Instant Minimal"]])}</select><small>Choose how pages enter and leave.</small></label><label class="experienceControl"><span>Starfield intensity</span><select data-setting="starfield">${opts(s.starfield,[["off","Off"],["subtle","Subtle"],["balanced","Balanced"],["crazy","Deep Space"]])}</select><small>Performance Mode still overrides this setting.</small></label><label class="experienceControl"><span>Motion intensity</span><select data-setting="motion">${opts(s.motion,[["minimal","Minimal"],["balanced","Balanced"],["cinematic","Cinematic"]])}</select><small>Controls parallax and interface movement.</small></label><label class="experienceControl"><span>Loader identity</span><select data-setting="loader">${opts(s.loader,[["minimal","Minimal Signal"],["signal","SOS Signal Lock"],["nebula","Nebula Transmission"]])}</select><small>Changes only your opening loader presentation.</small></label><label class="experienceControl"><span>Interface contrast</span><select data-setting="contrast">${opts(s.contrast,[["soft","Soft"],["balanced","Balanced"],["high","High Contrast"]])}</select><small>Adjusts borders, text separation, and glass depth.</small></label><label class="experienceSwitch"><input type="checkbox" data-setting="nebula" ${s.nebula?"checked":""}><span><b>Personal nebula atmosphere</b><small>Faint cosmic clouds behind page content.</small></span></label><label class="experienceSwitch"><input type="checkbox" data-setting="shootingStars" ${s.shootingStars?"checked":""}><span><b>Shooting stars</b><small>Rare streaks through the starfield.</small></span></label><label class="experienceSwitch"><input type="checkbox" data-setting="cursorGlow" ${s.cursorGlow?"checked":""}><span><b>Enhanced cursor glow</b><small>Brightens the custom cursor near controls.</small></span></label><label class="experienceSwitch"><input type="checkbox" data-setting="cardGlow" ${s.cardGlow?"checked":""}><span><b>Interactive card glow</b><small>Adds a restrained edge response on hover.</small></span></label></div><div class="experiencePreview" data-experience-live-preview><div class="experiencePreviewSky"><span class="previewStar p1"></span><span class="previewStar p2"></span><span class="previewStar p3"></span><span class="previewStar p4"></span><span class="previewStar p5"></span><span class="previewStar p6"></span><div class="previewNebula"></div><div class="previewTransitionLayer" aria-hidden="true"><span class="previewWarpLine w1"></span><span class="previewWarpLine w2"></span><span class="previewWarpLine w3"></span><span class="previewScanLine"></span><span class="previewAperture apTop"></span><span class="previewAperture apBottom"></span><span class="previewCube c1"></span><span class="previewCube c2"></span><span class="previewCube c3"></span><span class="previewCube c4"></span></div><div class="previewLogoRing"><span class="previewOrbit one"></span><span class="previewOrbit two"></span><img src="assets/images/sos-logo.png" alt="SOS preview"></div><div class="previewTransitionName" data-preview-transition-name>Stellar Signal Jump</div></div><div class="experiencePreviewNav"><i></i><span>HOME</span><span>MUSIC</span><span>FORUMS</span></div><div class="experiencePreviewCard"><p>YOUR FREQUENCY</p><h3>Live appearance preview</h3><div class="previewActions"><b></b><b></b></div></div><small class="previewCaption">Changes update here instantly before you leave this page.</small></div></div><div class="experienceActions"><button class="smallAction" type="button" data-experience-preview>Play transition preview</button><button class="primaryButton experienceApplyButton" type="button" data-experience-apply>${admin?"Save site defaults":"Save & apply to my account"}</button><button class="smallAction" type="button" data-experience-revert>Undo preview changes</button><button class="smallAction" type="button" data-experience-reset>Reset ${admin?"defaults":"my settings"}</button><span data-experience-status data-state="saved">Saved settings are active</span></div></section>`}
const transitionNames={stellar:'Stellar Signal Jump',fade:'Soft Fade',aperture:'Frequency Aperture',warp:'Star Warp',scan:'Signal Scan',cubes:'Orbiting Cubes',minimal:'Instant Minimal'};
function playPreview(box){if(!box)return;box.classList.remove('isPreviewing');void box.offsetWidth;box.classList.add('isPreviewing');const duration=box.dataset.transition==='minimal'?420:1500;clearTimeout(box._previewTimer);box._previewTimer=setTimeout(()=>box.classList.remove('isPreviewing'),duration)}
function updatePreview(s=currentSettings(),autoPlay=false,scope=document){scope.querySelectorAll('[data-experience-live-preview]').forEach(p=>{const changed=p.dataset.transition&&p.dataset.transition!==s.transition;p.dataset.theme=s.theme;p.dataset.transition=s.transition;p.dataset.motion=s.motion;p.dataset.stars=s.starfield;p.classList.toggle('hasNebula',!!s.nebula);p.classList.toggle('hasGlow',!!s.cardGlow);const label=p.querySelector('[data-preview-transition-name]');if(label)label.textContent=transitionNames[s.transition]||'Page Transition';if(autoPlay||changed)playPreview(p)})}
function studioSavedSettings(studio){return studio?.dataset.experienceStudio==="admin"?{...defaults,...read(ADMIN_DEFAULTS_KEY,{})}:currentSettings()}
function collectStudioSettings(studio){const next={...studioSavedSettings(studio)};studio?.querySelectorAll('[data-setting]').forEach(input=>{next[input.dataset.setting]=input.type==="checkbox"?input.checked:input.value});return next}
function syncStudioControls(studio,settings){studio?.querySelectorAll('[data-setting]').forEach(input=>{const value=settings[input.dataset.setting];if(input.type==="checkbox")input.checked=!!value;else if(value!=null)input.value=String(value)});updatePreview(settings,false,studio);markStudioSaved(studio)}
function setStudioStatus(studio,text,state="dirty"){const status=studio?.querySelector('[data-experience-status]');if(status){status.textContent=text;status.dataset.state=state}}
function markStudioDirty(studio){studio?.classList.add('hasUnsavedExperience');setStudioStatus(studio,'Previewing changes — not saved yet','dirty')}
function markStudioSaved(studio){studio?.classList.remove('hasUnsavedExperience');setStudioStatus(studio,'Saved settings are active','saved')}
function mountMemberSettings(){const studio=document.getElementById("profileStudio");if(!studio||document.querySelector('[data-experience-studio="member"]'))return;studio.insertAdjacentHTML("beforebegin",settingsMarkup());updatePreview()}
function mountAdminSettings(){const panel=document.getElementById("adminPanel");if(!panel||!document.querySelector('.adminMenu [data-panel="settings"].active'))return;if(!panel.querySelector('[data-experience-studio="admin"]')){panel.insertAdjacentHTML("afterbegin",settingsMarkup("Site Experience Defaults",true));updatePreview({...defaults,...read(ADMIN_DEFAULTS_KEY,{})})}}
document.addEventListener("click",e=>{if(e.target.closest('.adminMenu [data-panel="settings"]'))setTimeout(mountAdminSettings,20);const reset=e.target.closest("[data-experience-reset]");if(reset){const st=reset.closest("[data-experience-studio]");if(st.dataset.experienceStudio==="admin")write(ADMIN_DEFAULTS_KEY,defaults);else{const all=read(SETTINGS_KEY,{}),key=sessionKey();if(key)delete all[key];write(SETTINGS_KEY,all)}applyForSession(getSession());syncStudioControls(st,studioSavedSettings(st));setStudioStatus(st,'Defaults restored and applied','saved');return}const preview=e.target.closest("[data-experience-preview]");if(preview){const st=preview.closest("[data-experience-studio]"),box=st?.querySelector('[data-experience-live-preview]');playPreview(box);return}const revert=e.target.closest("[data-experience-revert]");if(revert){const st=revert.closest("[data-experience-studio]");const saved=studioSavedSettings(st);applySettings(saved);syncStudioControls(st,saved);setStudioStatus(st,'Preview changes undone','saved');return}const apply=e.target.closest("[data-experience-apply]");if(apply){const st=apply.closest("[data-experience-studio]"),next=collectStudioSettings(st);apply.disabled=true;apply.classList.add('isApplying');let applied;if(st.dataset.experienceStudio==="admin"){write(ADMIN_DEFAULTS_KEY,next);applied=applySettings({...defaults,...next})}else applied=saveSettings(next);syncStudioControls(st,applied);updatePreview(applied,true,st);markStudioSaved(st);setStudioStatus(st,st.dataset.experienceStudio==="admin"?'Site defaults saved and active ✓':'Saved to your account and applied live ✓','saved');document.documentElement.classList.add('sosExperienceJustApplied');setTimeout(()=>document.documentElement.classList.remove('sosExperienceJustApplied'),900);setTimeout(()=>{apply.disabled=false;apply.classList.remove('isApplying')},450)}});
function previewStudioChange(e){const input=e.target.closest?.("[data-experience-studio] [data-setting]");if(!input)return;const st=input.closest("[data-experience-studio]"),draft=collectStudioSettings(st);applySettings(draft);updatePreview(draft,input.dataset.setting==="transition"&&e.type==="change",st);markStudioDirty(st)}
document.addEventListener("input",previewStudioChange);
document.addEventListener("change",previewStudioChange);
window.addEventListener("storage",e=>{if([SETTINGS_KEY,ADMIN_DEFAULTS_KEY].includes(e.key)){const applied=applySettings();document.querySelectorAll("[data-experience-studio]").forEach(st=>syncStudioControls(st,studioSavedSettings(st)))}});
function syncMountedStudios(){
 document.querySelectorAll('[data-experience-studio="member"]').forEach(st=>{syncStudioControls(st,currentSettings());updatePreview(currentSettings(),false,st);markStudioSaved(st)});
 document.querySelectorAll('[data-experience-studio="admin"]').forEach(st=>{const d=siteDefaults();syncStudioControls(st,d);updatePreview(d,false,st);markStudioSaved(st)});
}
window.addEventListener("sos:session",event=>{
 applyForSession(event.detail||null);
 setTimeout(()=>{mountMemberSettings();syncMountedStudios()},0);
});
window.addEventListener("storage",event=>{
 if([SETTINGS_KEY,ADMIN_DEFAULTS_KEY].includes(event.key)){applyForSession(getSession());syncMountedStudios()}
});
const bootExperience=()=>{applyForSession(getSession());mountMemberSettings();mountAdminSettings()};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bootExperience,{once:true});else bootExperience();
window.addEventListener("load",()=>{applySettings();mountMemberSettings();mountAdminSettings()},{once:true});
const enhance=()=>{const c=document.querySelector('.announcementCenterPanel,.announcementPanel');if(c&&!c.dataset.v410){c.dataset.v410='1';c.classList.add('modernAnnouncementCenter')}};new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});enhance();
})();
