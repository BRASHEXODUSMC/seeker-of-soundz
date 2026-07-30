(()=>{
  'use strict';
  const ANNOUNCEMENTS_KEY='sos_announcements_v1';
  const esc=value=>String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

  function activeAnnouncements(){
    try{
      const items=JSON.parse(localStorage.getItem(ANNOUNCEMENTS_KEY)||'[]');
      const dismissed=JSON.parse(localStorage.getItem('sos_dismissed_announcements_v1')||'[]');
      const session=window.SOS?.getSession?.();
      const allowed=a=>{
        if(a.audience==='members'&&!session)return false;
        if(a.audience==='vip'&&!session?.paidMember)return false;
        if(a.audience==='admins'&&session?.role!=='admin')return false;
        return true;
      };
      return Array.isArray(items)?items.filter(a=>a&&a.active!==false&&(!a.expires||new Date(a.expires+'T23:59:59')>new Date())&&allowed(a)&&(!a.dismissible||!dismissed.includes(a.id))):[];
    }catch(_){return []}
  }

  function installNoticeCenter(){
    if(document.querySelector('.sosNoticeCenter'))return;
    const center=document.createElement('aside');
    center.className='sosNoticeCenter';
    center.setAttribute('aria-label','Site announcements');
    center.innerHTML=`<button class="sosNoticeToggle" type="button" aria-expanded="false" aria-controls="sosNoticePanel"><span class="sosNoticeBell">✦</span><span class="sosNoticeLabel">Updates</span><span class="sosNoticeCount">0</span></button><section class="sosNoticePanel" id="sosNoticePanel"><div class="sosNoticeHead"><strong>Frequency Updates</strong><button class="sosNoticeClose" type="button" aria-label="Close announcements">×</button></div><div class="sosNoticeList"></div></section>`;
    document.body.append(center);
    const toggle=center.querySelector('.sosNoticeToggle');
    const list=center.querySelector('.sosNoticeList');
    const count=center.querySelector('.sosNoticeCount');
    const render=()=>{
      const items=activeAnnouncements();
      count.textContent=String(items.length);
      count.hidden=!items.length;
      list.innerHTML=items.length?items.slice().reverse().map(a=>`<article class="sosNoticeItem notice-${esc(a.style||'info')} priority-${esc(a.priority||'normal')}" data-announcement-id="${esc(a.id)}"><span class="sosNoticeItemIcon">${esc(a.icon||'✦')}</span><div><div class="sosNoticeItemTop"><small>${esc((a.style||'info').replace(/-/g,' '))}${a.priority==='pinned'?' • PINNED':''}</small>${a.dismissible?`<button type="button" class="sosNoticeDismiss" data-dismiss-announcement="${esc(a.id)}" aria-label="Dismiss announcement">×</button>`:''}</div><strong>${esc(a.title||'Site update')}</strong><p>${esc(a.message||'')}</p>${a.link?`<a href="${esc(a.link)}">${esc(a.buttonText||'Open update')} →</a>`:''}</div></article>`).join(''):'<div class="sosNoticeEmpty">No active announcements right now.</div>';
    };
    const setOpen=open=>{center.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open))};
    toggle.addEventListener('click',()=>setOpen(!center.classList.contains('open')));
    list.addEventListener('click',event=>{const button=event.target.closest('[data-dismiss-announcement]');if(!button)return;const dismissed=JSON.parse(localStorage.getItem('sos_dismissed_announcements_v1')||'[]');localStorage.setItem('sos_dismissed_announcements_v1',JSON.stringify([...new Set([...dismissed,button.dataset.dismissAnnouncement])]));render();});
    center.querySelector('.sosNoticeClose').addEventListener('click',()=>setOpen(false));
    document.addEventListener('pointerdown',event=>{if(center.classList.contains('open')&&!center.contains(event.target))setOpen(false)});
    document.addEventListener('keydown',event=>{if(event.key==='Escape')setOpen(false)});
    addEventListener('storage',event=>{if(event.key===ANNOUNCEMENTS_KEY)render()});
    render();
  }

  function installNavEnhancements(){
    const nav=document.getElementById('mainNav');
    if(!nav||nav.dataset.frequencyNavReady)return false;
    nav.dataset.frequencyNavReady='true';
    const sweep=document.createElement('span');sweep.className='navSignalSweep';nav.prepend(sweep);
    const track=document.createElement('span');track.className='navSignalTrack';track.innerHTML='<i class="navActiveGlider"></i>';nav.append(track);
    const glider=track.querySelector('.navActiveGlider');
    const links=[...nav.querySelectorAll('.navLinks a')];
    let active=nav.querySelector('.navLinks a.active')||links[0];
    const positionTo=link=>{
      if(!link||innerWidth<=1000){glider.style.opacity='0';return}
      const nr=nav.getBoundingClientRect(),lr=link.getBoundingClientRect();
      const trackLeft=24;
      glider.style.opacity='1';
      glider.style.width=Math.max(24,lr.width*.72)+'px';
      glider.style.setProperty('--glider-x',(lr.left-nr.left+lr.width*.14-trackLeft)+'px');
    };
    requestAnimationFrame(()=>positionTo(active));
    links.forEach(link=>{
      link.addEventListener('pointerenter',()=>positionTo(link));
      link.addEventListener('focus',()=>positionTo(link));
    });
    nav.querySelector('.navLinks')?.addEventListener('pointerleave',()=>positionTo(active));
    nav.addEventListener('pointermove',event=>{
      const rect=nav.getBoundingClientRect();
      nav.style.setProperty('--nav-signal-x',((event.clientX-rect.left)/rect.width*100).toFixed(2)+'%');
      nav.style.setProperty('--nav-signal-strength','.62');
    },{passive:true});
    nav.addEventListener('pointerleave',()=>{nav.style.setProperty('--nav-signal-x','50%');nav.style.setProperty('--nav-signal-strength','.22')},{passive:true});
    addEventListener('resize',()=>positionTo(active),{passive:true});
    return true;
  }

  function init(){
    installNoticeCenter();
    if(installNavEnhancements())return;
    let tries=0;
    const timer=setInterval(()=>{if(installNavEnhancements()||++tries>40)clearInterval(timer)},100);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
