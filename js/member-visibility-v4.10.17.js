/* Seeker Of SoundZ v4.10.17 — member visibility preferences */
(()=>{
  'use strict';
  const KEY='sos_member_visibility_v1';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const session=()=>{try{return JSON.parse(localStorage.getItem('sos_session_v1')||'null')}catch{return null}};
  const accountKey=()=>{const s=session();return s?.id||s?.email||null};
  const defaults={hideFrequencyUpdates:false,hideAnnouncements:false};
  function all(){return read(KEY,{})}
  function current(){const k=accountKey();return k?{...defaults,...(all()[k]||{})}:defaults}
  function save(next){const k=accountKey();if(!k)return;const data=all();data[k]={...current(),...next};write(KEY,data);apply(data[k]);}
  function apply(s=current()){
    document.documentElement.classList.toggle('memberHideFrequencyUpdates',!!s.hideFrequencyUpdates);
    document.documentElement.classList.toggle('memberHideAnnouncements',!!s.hideAnnouncements);
    window.dispatchEvent(new CustomEvent('sos:member-visibility',{detail:s}));
  }
  function inject(){
    const grid=document.querySelector('[data-experience-studio="member"] .experienceGrid');
    if(!grid||grid.querySelector('[data-member-visibility]'))return;
    const s=current();
    grid.insertAdjacentHTML('beforeend',`<div class="experienceSubheading" data-member-visibility><span>Profile & notification visibility</span><small>Choose which broadcast elements appear while this account is signed in.</small></div>
      <label class="experienceSwitch"><input type="checkbox" data-member-visibility-setting="hideFrequencyUpdates" ${s.hideFrequencyUpdates?'checked':''}><span><b>Hide Frequency Updates</b><small>Removes the compact Updates control and its notification panel.</small></span></label>
      <label class="experienceSwitch"><input type="checkbox" data-member-visibility-setting="hideAnnouncements" ${s.hideAnnouncements?'checked':''}><span><b>Hide announcement banners</b><small>Hides rotating homepage and member-page announcement cards for this account.</small></span></label>`);
  }
  document.addEventListener('change',e=>{
    const input=e.target.closest('[data-member-visibility-setting]');if(!input)return;
    save({[input.dataset.memberVisibilitySetting]:input.checked});
    const st=input.closest('[data-experience-studio]');const status=st?.querySelector('[data-experience-status]');
    if(status){status.textContent='Visibility preference saved and applied ✓';status.dataset.state='saved'}
  });
  window.addEventListener('storage',e=>{if(e.key===KEY||e.key==='sos_session_v1'){apply();setTimeout(inject,50)}});
  window.addEventListener('sos:session-changed',()=>{apply();setTimeout(inject,50)});
  new MutationObserver(inject).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',()=>{apply();inject()});
  apply();
})();
