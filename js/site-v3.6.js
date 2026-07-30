(()=>{
  "use strict";
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function addAdminLinks(){
    const session=window.SOS?.getSession?.();
    if(session?.role!=="admin")return;
    const account=document.getElementById("accountContent");
    document.querySelectorAll('.profileModule,.profileStudio,.memberDashboard').forEach(host=>{if(!host.querySelector('.adminProfileLink'))host.insertAdjacentHTML('beforeend','<a class="adminProfileLink" href="admin.html">⚙ Open Admin Hub</a>')});
  }
  const profileObserver=new MutationObserver(addAdminLinks);profileObserver.observe(document.body,{childList:true,subtree:true});addAdminLinks();

  function renderEvents(){
    const page=document.querySelector('.eventList'); if(!page||!window.SOS)return;
    const events=SOS.read('sos_events_v1',[]).filter(e=>e.active!==false).sort((a,b)=>new Date(a.date)-new Date(b.date));
    if(!events.length)return;
    page.classList.add('dynamicEventsGrid');
    page.innerHTML=events.map(e=>`<article class="dynamicEventCard"><div class="dynamicEventDate"><span>${new Date(e.date).toLocaleDateString(undefined,{month:'short'})}</span><strong>${new Date(e.date).getDate()}</strong><small>${new Date(e.date).getFullYear()}</small></div><div><p class="sectionEyebrow">${esc(e.type||'Event')}</p><h3>${esc(e.title)}</h3><p>${esc(e.venue||'Location TBA')}${e.city?` • ${esc(e.city)}`:''}</p><div class="dynamicEventCountdown" data-event-time="${esc(e.date)}">Calculating countdown…</div></div><div>${e.link?`<a class="secondaryButton" href="${esc(e.link)}">${esc(e.buttonText||'Details')}</a>`:''}</div></article>`).join('');
    const tick=()=>document.querySelectorAll('[data-event-time]').forEach(el=>{const d=Math.max(0,new Date(el.dataset.eventTime)-Date.now());if(!d){el.textContent='Event started';return}const days=Math.floor(d/86400000),hours=Math.floor(d/3600000)%24,mins=Math.floor(d/60000)%60;el.textContent=`${days}d ${hours}h ${mins}m remaining`});tick();setInterval(tick,30000);
  }
  function renderMusicProgress(){
    if(!window.SOS)return;const items=SOS.read(SOS.K.music,[]);if(!items.length)return;
    document.querySelectorAll('[data-music-id],.musicReleaseCard,.musicCard,.releaseCard').forEach((card,i)=>{if(card.querySelector('.musicProgressPublic'))return;const title=card.querySelector('h2,h3,h4')?.textContent?.trim();const item=items.find(x=>x.id===card.dataset.musicId)||items.find(x=>x.title===title)||items[i];if(!item)return;const value=Math.max(0,Math.min(100,Number(item.progress??100)));const state=value===100?'Completed':value===0?'Not started':'In progress';card.insertAdjacentHTML('beforeend',`<div class="musicProgressPublic"><div class="musicProgressPublicHead"><span>${state}</span><strong>${value}%</strong></div><div class="musicProgressTrack"><i style="width:${value}%"></i></div></div>`)});
  }
  setTimeout(()=>{renderEvents();renderMusicProgress();addAdminLinks()},180);
})();
