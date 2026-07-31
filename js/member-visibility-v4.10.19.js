/* Seeker Of SoundZ v4.10.19 — definitive saved visibility controller */
(()=>{
  'use strict';

  const KEY='sos_member_visibility_v2';
  const LEGACY_KEY='sos_member_visibility_v1';
  const SESSION_KEY='sos_session_v2';
  const DEFAULTS={hideFrequencyUpdates:false,hideAnnouncements:false};
  const HIDDEN_ATTR='data-sos-member-hidden';

  const read=(key,fallback)=>{
    try{const raw=localStorage.getItem(key);return raw==null?fallback:(JSON.parse(raw)??fallback)}catch{return fallback}
  };
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}};
  const session=()=>{try{return window.SOS?.getSession?.()||read(SESSION_KEY,null)}catch{return read(SESSION_KEY,null)}};
  const accountId=()=>{const s=session();return s?.id||s?.userId||s?.email||s?.username||null};

  function migrate(){
    if(localStorage.getItem(KEY)||!localStorage.getItem(LEGACY_KEY))return;
    const old=read(LEGACY_KEY,{});
    write(KEY,old&&typeof old==='object'?old:{});
  }
  migrate();

  const all=()=>read(KEY,{});
  function get(){
    const id=accountId();
    return id?{...DEFAULTS,...(all()[id]||{})}:{...DEFAULTS};
  }
  function save(next){
    const id=accountId();
    if(!id)return false;
    const data=all();
    data[id]={...DEFAULTS,...(data[id]||{}),...next};
    if(!write(KEY,data))return false;
    apply(data[id]);
    return true;
  }

  const UPDATE_SELECTORS=[
    '.sosNoticeCenter','.sosAnnouncementCenter','[data-sos-announcement-center]',
    '[data-frequency-updates]','.frequencyUpdates','.frequencyUpdateCenter',
    '#frequencyUpdates','#announcementCenter','#sosNoticePanel','.sosNoticeToggle'
  ];
  const ANNOUNCEMENT_SELECTORS=[
    '.homeAnnouncementRail','.memberAnnouncement','.profileAnnouncement',
    '[data-member-announcement]','[data-home-announcement]',
    '.announcementCenterPanel','.announcementPanel','.modernAnnouncementCenter',
    '.priorityAnnouncementBanner','.siteAnnouncementBanner','.announcementBanner',
    '.memberAnnouncementRail','.profileAnnouncementRail','[data-announcement-banner]'
  ];

  function setElementHidden(el,hidden,reason){
    if(!el)return;
    if(hidden){
      el.setAttribute(HIDDEN_ATTR,reason);
      el.hidden=true;
      el.setAttribute('aria-hidden','true');
      el.style.setProperty('display','none','important');
      el.style.setProperty('visibility','hidden','important');
      el.style.setProperty('pointer-events','none','important');
      el.classList.remove('open','active','isOpen','show','visible');
    }else if(el.getAttribute(HIDDEN_ATTR)===reason){
      el.removeAttribute(HIDDEN_ATTR);
      el.hidden=false;
      el.removeAttribute('aria-hidden');
      el.style.removeProperty('display');
      el.style.removeProperty('visibility');
      el.style.removeProperty('pointer-events');
    }
  }

  function apply(settings=get()){
    const s={...DEFAULTS,...settings};
    const root=document.documentElement;
    root.classList.toggle('memberHideFrequencyUpdates',!!s.hideFrequencyUpdates);
    root.classList.toggle('memberHideAnnouncements',!!s.hideAnnouncements);
    root.dataset.hideFrequencyUpdates=s.hideFrequencyUpdates?'true':'false';
    root.dataset.hideAnnouncements=s.hideAnnouncements?'true':'false';

    document.querySelectorAll(UPDATE_SELECTORS.join(',')).forEach(el=>setElementHidden(el,!!s.hideFrequencyUpdates,'frequency'));
    document.querySelectorAll(ANNOUNCEMENT_SELECTORS.join(',')).forEach(el=>setElementHidden(el,!!s.hideAnnouncements,'announcement'));

    syncControls(s);
    window.dispatchEvent(new CustomEvent('sos:member-visibility',{detail:{...s}}));
    return s;
  }

  function inject(){
    const studio=document.querySelector('[data-experience-studio="member"]');
    const grid=studio?.querySelector('.experienceGrid');
    if(!grid)return;
    if(!grid.querySelector('[data-member-visibility-heading]')){
      grid.insertAdjacentHTML('beforeend',`
        <div class="experienceSubheading" data-member-visibility-heading>
          <span>Profile & notification visibility</span>
          <small>These choices are saved with your account when you press Save & apply.</small>
        </div>
        <label class="experienceSwitch" data-member-visibility-row="announcements">
          <input type="checkbox" data-member-visibility-setting="hideAnnouncements">
          <span><b>Hide announcement banners</b><small>Removes homepage, member, profile, and priority announcement banners.</small></span>
        </label>`);
    }
    syncControls(get());
  }

  function syncControls(settings=get()){
    document.querySelectorAll('[data-member-visibility-setting]').forEach(input=>{
      const key=input.dataset.memberVisibilitySetting;
      if(document.activeElement!==input)input.checked=!!settings[key];
    });
  }

  function draftFromStudio(studio){
    const next={...get()};
    studio?.querySelectorAll('[data-member-visibility-setting]').forEach(input=>{
      next[input.dataset.memberVisibilitySetting]=!!input.checked;
    });
    return next;
  }

  function markStatus(studio,ok){
    const status=studio?.querySelector('[data-experience-status]');
    if(!status)return;
    status.textContent=ok?'Saved to your account and applied live ✓':'Sign in to save these visibility settings.';
    status.dataset.state=ok?'saved':'error';
  }

  // Make checkbox changes visibly preview immediately, then persist again with Save & apply.
  document.addEventListener('change',event=>{
    const input=event.target.closest('[data-member-visibility-setting]');
    if(!input)return;
    const studio=input.closest('[data-experience-studio]');
    const draft=draftFromStudio(studio);
    apply(draft);
    studio?.classList.add('hasUnsavedExperience');
    const status=studio?.querySelector('[data-experience-status]');
    if(status){status.textContent='Previewing visibility changes — press Save & apply';status.dataset.state='dirty'}
  },true);

  // Capture before the Experience Studio's own Save handler so these settings are saved in the same action.
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-experience-apply]');
    if(!button)return;
    const studio=button.closest('[data-experience-studio="member"]');
    if(!studio)return;
    const ok=save(draftFromStudio(studio));
    markStatus(studio,ok);
    setTimeout(()=>apply(),0);
    setTimeout(()=>apply(),120);
  },true);

  // Do not allow hidden update controls to reopen from stale handlers.
  document.addEventListener('click',event=>{
    if(document.documentElement.dataset.hideFrequencyUpdates!=='true')return;
    if(event.target.closest('.sosNoticeToggle,.sosNoticeCenter,#sosNoticePanel')){
      event.preventDefault();event.stopImmediatePropagation();apply();
    }
  },true);

  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{queued=false;inject();apply()});
  });

  const refresh=()=>{inject();apply()};
  window.SOSMemberVisibility={get,save,apply,refresh};
  window.addEventListener('sos:session',refresh);
  window.addEventListener('sos:session-changed',refresh);
  window.addEventListener('sos:experience-applied',refresh);
  window.addEventListener('sos:account-experience-applied',refresh);
  window.addEventListener('storage',event=>{if([KEY,LEGACY_KEY,SESSION_KEY].includes(event.key))refresh()});

  const boot=()=>{
    inject();apply();
    if(document.body)observer.observe(document.body,{childList:true,subtree:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
