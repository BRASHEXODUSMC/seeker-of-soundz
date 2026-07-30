/* Seeker Of SoundZ v4.10.18 — reliable per-member visibility preferences */
(()=>{
  'use strict';

  const KEY='sos_member_visibility_v1';
  const SESSION_KEYS=['sos_session_v2','sos_session_v1'];
  const defaults={hideFrequencyUpdates:false,hideAnnouncements:false};

  const read=(key,fallback)=>{
    try{
      const raw=localStorage.getItem(key);
      return raw===null?fallback:(JSON.parse(raw)??fallback);
    }catch{return fallback;}
  };
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}};

  function getSession(){
    try{
      if(window.SOS?.getSession){
        const active=window.SOS.getSession();
        if(active)return active;
      }
    }catch{}
    for(const key of SESSION_KEYS){
      const value=read(key,null);
      if(value)return value;
    }
    return null;
  }

  function accountKey(){
    const s=getSession();
    return s?.id||s?.userId||s?.email||s?.username||null;
  }

  function all(){return read(KEY,{})}
  function current(){
    const key=accountKey();
    return key?{...defaults,...(all()[key]||{})}:{...defaults};
  }

  function forceVisibility(settings=current()){
    const root=document.documentElement;
    const hideUpdates=!!settings.hideFrequencyUpdates;
    const hideAnnouncements=!!settings.hideAnnouncements;

    root.classList.toggle('memberHideFrequencyUpdates',hideUpdates);
    root.classList.toggle('memberHideAnnouncements',hideAnnouncements);
    root.dataset.hideFrequencyUpdates=hideUpdates?'true':'false';
    root.dataset.hideAnnouncements=hideAnnouncements?'true':'false';

    const updateSelectors=[
      '.sosNoticeCenter','.sosAnnouncementCenter','[data-sos-announcement-center]',
      '[data-frequency-updates]','.frequencyUpdates','.frequencyUpdateCenter',
      '#frequencyUpdates','#announcementCenter'
    ];
    const announcementSelectors=[
      '.homeAnnouncementRail','.memberAnnouncement','.profileAnnouncement',
      '[data-member-announcement]','[data-home-announcement]',
      '.announcementCenterPanel','.announcementPanel','.modernAnnouncementCenter',
      '.priorityAnnouncementBanner','.siteAnnouncementBanner'
    ];

    document.querySelectorAll(updateSelectors.join(',')).forEach(el=>{
      el.hidden=hideUpdates;
      el.setAttribute('aria-hidden',hideUpdates?'true':'false');
      if(hideUpdates)el.classList.remove('open','active','isOpen');
    });
    document.querySelectorAll(announcementSelectors.join(',')).forEach(el=>{
      el.hidden=hideAnnouncements;
      el.setAttribute('aria-hidden',hideAnnouncements?'true':'false');
      if(hideAnnouncements)el.classList.remove('open','active','isOpen');
    });

    window.dispatchEvent(new CustomEvent('sos:member-visibility',{detail:{...settings}}));
  }

  function save(next){
    const key=accountKey();
    if(!key)return false;
    const data=all();
    data[key]={...current(),...next};
    if(!write(KEY,data))return false;
    forceVisibility(data[key]);
    return true;
  }

  function inject(){
    const studio=document.querySelector('[data-experience-studio="member"]');
    const grid=studio?.querySelector('.experienceGrid');
    if(!grid)return;

    let block=grid.querySelector('[data-member-visibility]');
    const settings=current();
    if(!block){
      grid.insertAdjacentHTML('beforeend',`<div class="experienceSubheading" data-member-visibility><span>Profile & notification visibility</span><small>Choose which broadcast elements appear while this account is signed in.</small></div>
        <label class="experienceSwitch" data-visibility-row="updates"><input type="checkbox" data-member-visibility-setting="hideFrequencyUpdates"><span><b>Hide Frequency Updates</b><small>Removes the compact Updates control and its notification panel on every page.</small></span></label>
        <label class="experienceSwitch" data-visibility-row="announcements"><input type="checkbox" data-member-visibility-setting="hideAnnouncements"><span><b>Hide announcement banners</b><small>Hides homepage, profile, priority, and announcement-center banners for this account.</small></span></label>`);
      block=grid.querySelector('[data-member-visibility]');
    }

    grid.querySelectorAll('[data-member-visibility-setting]').forEach(input=>{
      input.checked=!!settings[input.dataset.memberVisibilitySetting];
    });
  }

  function refresh(){inject();forceVisibility(current())}

  document.addEventListener('change',event=>{
    const input=event.target.closest('[data-member-visibility-setting]');
    if(!input)return;
    const ok=save({[input.dataset.memberVisibilitySetting]:input.checked});
    const studio=input.closest('[data-experience-studio]');
    const status=studio?.querySelector('[data-experience-status]');
    if(status){
      status.textContent=ok?'Visibility preference saved and applied ✓':'Sign in to save this preference.';
      status.dataset.state=ok?'saved':'error';
    }
  });

  let observerQueued=false;
  const observer=new MutationObserver(()=>{
    if(observerQueued)return;
    observerQueued=true;
    requestAnimationFrame(()=>{observerQueued=false;refresh()});
  });

  window.addEventListener('storage',event=>{
    if(event.key===KEY||SESSION_KEYS.includes(event.key))refresh();
  });
  window.addEventListener('sos:session-changed',refresh);
  window.addEventListener('sos:account-experience-applied',refresh);
  document.addEventListener('DOMContentLoaded',()=>{
    refresh();
    observer.observe(document.body,{childList:true,subtree:true});
  });

  refresh();
})();
