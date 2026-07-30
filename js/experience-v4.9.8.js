/* Seeker Of SoundZ v4.9.8 — Experience Studio, modern announcements, collab deep links */
(() => {
  "use strict";
  const SETTINGS_KEY="sos_experience_settings_v1";
  const ADMIN_DEFAULTS_KEY="sos_experience_defaults_v1";
  const uid=()=>crypto.randomUUID?.()||`id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
  const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  const sessionKey=()=>window.SOS?.getSession?.()?.id||"guest";
  const defaults={starfield:"balanced",nebula:false,shootingStars:true,loader:"signal",motion:"balanced",cursorGlow:true};
  function currentSettings(){
    const global={...defaults,...read(ADMIN_DEFAULTS_KEY,{})};
    const all=read(SETTINGS_KEY,{});
    return {...global,...(all[sessionKey()]||{})};
  }
  function saveSettings(next){const all=read(SETTINGS_KEY,{});all[sessionKey()]={...currentSettings(),...next};write(SETTINGS_KEY,all);applySettings();}
  function applySettings(){
    const s=currentSettings(),html=document.documentElement;
    [...html.classList].filter(c=>c.startsWith("sos-stars-")||c.startsWith("sos-motion-")||c.startsWith("sos-loader-")).forEach(c=>html.classList.remove(c));
    html.classList.add(`sos-stars-${s.starfield}`,`sos-motion-${s.motion}`,`sos-loader-${s.loader}`);
    html.classList.toggle("sos-nebula-enabled",!!s.nebula);
    html.classList.toggle("sos-shooting-disabled",!s.shootingStars);
    html.classList.toggle("sos-cursor-glow",!!s.cursorGlow);
    window.dispatchEvent(new CustomEvent("sos:experience-settings",{detail:s}));
  }
  window.SOSExperience={get:currentSettings,set:saveSettings,apply:applySettings};
  applySettings();

  function settingsMarkup(title="Personal Experience Studio",admin=false){const s=admin?{...defaults,...read(ADMIN_DEFAULTS_KEY,{})}:currentSettings();return `<section class="experienceStudio ${admin?"adminExperienceStudio":""}" data-experience-studio="${admin?"admin":"member"}"><div class="experienceStudioHead"><div><p class="sectionEyebrow">Visual Control Center</p><h2>${title}</h2><p>Shape the atmosphere without changing anyone else’s account${admin?". These become the default for new visitors.":"."}</p></div><span class="experienceSignal"><i></i>LIVE</span></div><div class="experienceGrid"><label class="experienceControl"><span>Starfield intensity</span><select data-setting="starfield"><option value="off" ${s.starfield==="off"?"selected":""}>Off</option><option value="subtle" ${s.starfield==="subtle"?"selected":""}>Subtle</option><option value="balanced" ${s.starfield==="balanced"?"selected":""}>Balanced</option><option value="crazy" ${s.starfield==="crazy"?"selected":""}>Deep Space</option></select><small>Deep Space increases density and brighter glints.</small></label><label class="experienceControl"><span>Motion intensity</span><select data-setting="motion"><option value="minimal" ${s.motion==="minimal"?"selected":""}>Minimal</option><option value="balanced" ${s.motion==="balanced"?"selected":""}>Balanced</option><option value="cinematic" ${s.motion==="cinematic"?"selected":""}>Cinematic</option></select><small>Controls parallax and interface movement.</small></label><label class="experienceControl"><span>Loader identity</span><select data-setting="loader"><option value="minimal" ${s.loader==="minimal"?"selected":""}>Minimal Signal</option><option value="signal" ${s.loader==="signal"?"selected":""}>SOS Signal Lock</option><option value="nebula" ${s.loader==="nebula"?"selected":""}>Nebula Transmission</option></select><small>Nebula styling appears only in the loader.</small></label><label class="experienceSwitch"><input type="checkbox" data-setting="nebula" ${s.nebula?"checked":""}><span><b>Personal nebula atmosphere</b><small>Add faint custom cosmic clouds behind page content.</small></span></label><label class="experienceSwitch"><input type="checkbox" data-setting="shootingStars" ${s.shootingStars?"checked":""}><span><b>Shooting stars</b><small>Keep rare streaks moving through the background.</small></span></label><label class="experienceSwitch"><input type="checkbox" data-setting="cursorGlow" ${s.cursorGlow?"checked":""}><span><b>Enhanced cursor glow</b><small>Brighten the custom cursor around controls.</small></span></label></div><div class="experienceActions"><button class="smallAction" type="button" data-experience-preview>Preview pulse</button><button class="smallAction" type="button" data-experience-reset>Reset ${admin?"defaults":"my settings"}</button><span data-experience-status>Saved automatically</span></div></section>`}

  function mountMemberSettings(){const studio=document.getElementById("profileStudio");if(!studio||document.querySelector('[data-experience-studio="member"]'))return;studio.insertAdjacentHTML("beforebegin",settingsMarkup());}
  function mountAdminSettings(){const panel=document.getElementById("adminPanel");if(!panel||!document.querySelector('.adminMenu [data-panel="settings"].active'))return;if(!panel.querySelector('[data-experience-studio="admin"]'))panel.insertAdjacentHTML("afterbegin",settingsMarkup("Site Experience Defaults",true));}
  document.addEventListener("click",e=>{
    const tab=e.target.closest('.adminMenu [data-panel="settings"]');if(tab)setTimeout(mountAdminSettings,20);
    const reset=e.target.closest("[data-experience-reset]");if(reset){const studio=reset.closest("[data-experience-studio]");if(studio.dataset.experienceStudio==="admin")write(ADMIN_DEFAULTS_KEY,defaults);else{const all=read(SETTINGS_KEY,{});delete all[sessionKey()];write(SETTINGS_KEY,all)}location.reload();}
    const preview=e.target.closest("[data-experience-preview]");if(preview){document.documentElement.classList.add("sos-experience-preview");setTimeout(()=>document.documentElement.classList.remove("sos-experience-preview"),900);}
  });
  document.addEventListener("change",e=>{const input=e.target.closest("[data-experience-studio] [data-setting]");if(!input)return;const studio=input.closest("[data-experience-studio]"),value=input.type==="checkbox"?input.checked:input.value;if(studio.dataset.experienceStudio==="admin"){const d={...defaults,...read(ADMIN_DEFAULTS_KEY,{})};d[input.dataset.setting]=value;write(ADMIN_DEFAULTS_KEY,d);applySettings()}else saveSettings({[input.dataset.setting]:value});const status=studio.querySelector("[data-experience-status]");if(status){status.textContent="Saved ✓";setTimeout(()=>status.textContent="Saved automatically",1200)}});
  window.addEventListener("load",()=>{mountMemberSettings();mountAdminSettings()});

  // Modern announcement cards: priorities, types, audience and dismiss state.
  const enhanceAnnouncementCenter=()=>{
    const center=document.querySelector(".announcementCenterPanel,.announcementPanel");if(!center||center.dataset.v498)return;center.dataset.v498="1";center.classList.add("modernAnnouncementCenter");
  };
  new MutationObserver(enhanceAnnouncementCenter).observe(document.body,{childList:true,subtree:true});enhanceAnnouncementCenter();
})();
