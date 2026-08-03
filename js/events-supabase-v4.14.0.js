/* Seeker Of SoundZ v4.14.0 — Supabase social events */
(()=>{
'use strict';
const client=window.SOS_SUPABASE?.client;if(!client)return;
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const toast=(m,t='Events')=>window.SOS?.toast?.(m,{title:t,icon:'📅'});
let events=[],timers=[];

function countdownHtml(event){
 return `<div class="eventCountdownV414" data-countdown="${esc(event.starts_at)}"><span><strong>--</strong><small>Days</small></span><span><strong>--</strong><small>Hours</small></span><span><strong>--</strong><small>Min</small></span><span><strong>--</strong><small>Sec</small></span></div>`;
}
function updateCountdowns(){
 document.querySelectorAll('[data-countdown]').forEach(box=>{
  const delta=new Date(box.dataset.countdown)-Date.now();
  const values=delta<=0?['LIVE','00','00','00']:[
   Math.floor(delta/86400000),String(Math.floor(delta/3600000)%24).padStart(2,'0'),
   String(Math.floor(delta/60000)%60).padStart(2,'0'),String(Math.floor(delta/1000)%60).padStart(2,'0')
  ];
  box.querySelectorAll('strong').forEach((el,i)=>el.textContent=values[i]);
 });
}
function responseButtons(event){
 if(!event.allow_responses)return'';
 const mine=event.my_response||'';
 return `<div class="eventSocialActionsV414" data-event-responses="${event.id}">
  <button type="button" data-event-response="going" class="${mine==='going'?'selected':''}">✓ Going <span>${event.counts?.going||0}</span></button>
  <button type="button" data-event-response="interested" class="${mine==='interested'?'selected':''}">★ Interested <span>${event.counts?.interested||0}</span></button>
  <button type="button" data-event-response="not_going" class="${mine==='not_going'?'selected':''}">Not Going</button>
 </div>`;
}
function mediaHtml(event){
 const media=Array.isArray(event.media)?event.media:[];
 if(!media.length)return'';
 return `<div class="eventPhotoRailV414">${media.map(m=>`<button type="button" data-event-photo="${esc(m.image_url)}"><img src="${esc(m.image_url)}" alt="${esc(m.alt_text||m.caption||event.title)}"></button>`).join('')}</div>`;
}
function featuredHtml(e){
 const image=e.cover_image_url||(e.media?.[0]?.image_url)||'assets/images/event-featured-01.jpg';
 return `<div class="featuredEventImage"><img alt="${esc(e.title)}" src="${esc(image)}"><div class="featuredEventOverlay"></div></div>
 <div class="featuredEventContent" id="event-${e.id}"><span class="eventBadge">${esc(e.event_type)}</span><h2>${esc(e.title)}</h2>
 <p class="eventDescription">${esc(e.description)}</p><div class="eventDetails"><span>${new Date(e.starts_at).toLocaleString()}</span><span>${esc([e.venue,e.location].filter(Boolean).join(' • ')||'Location TBA')}</span></div>
 ${countdownHtml(e)}${responseButtons(e)}
 <div class="eventActions">${e.ticket_url?`<a class="primaryButton" href="${esc(e.ticket_url)}" target="_blank" rel="noopener">Tickets</a>`:''}${e.details_url||e.online_url?`<a class="secondaryButton" href="${esc(e.details_url||e.online_url)}" target="_blank" rel="noopener">Event Details</a>`:'<a class="secondaryButton" href="contact.html">Booking Inquiry</a>'}</div>
 ${mediaHtml(e)}</div>`;
}
function cardHtml(e){
 const d=new Date(e.starts_at);
 return `<article class="eventCard eventCardV414" id="event-${e.id}">
 <div class="eventDate"><span>${d.toLocaleString(undefined,{month:'short'}).toUpperCase()}</span><strong>${d.getDate()}</strong></div>
 <div class="eventCardContent"><p class="sectionEyebrow">${esc(e.event_type)}</p><h3>${esc(e.title)}</h3><p>${esc([e.venue,e.location].filter(Boolean).join(' • ')||'Location TBA')}</p>${countdownHtml(e)}${responseButtons(e)}${mediaHtml(e)}</div>
 <div class="eventActions">${e.details_url||e.online_url||e.ticket_url?`<a class="secondaryButton" href="${esc(e.details_url||e.online_url||e.ticket_url)}" target="_blank" rel="noopener">Details</a>`:''}</div></article>`;
}
function render(){
 if(!events.length)return;
 const now=Date.now(),upcoming=events.filter(e=>new Date(e.starts_at).getTime()>=now).sort((a,b)=>new Date(a.starts_at)-new Date(b.starts_at));
 const featured=events.find(e=>e.is_featured)||upcoming[0]||events[0];
 const featuredNode=document.querySelector('.featuredEvent');if(featuredNode)featuredNode.innerHTML=featuredHtml(featured);
 const list=document.querySelector('.eventList');if(list)list.innerHTML=upcoming.filter(e=>e.id!==featured.id).map(cardHtml).join('')||'<div class="emptyState">More event dates will appear here.</div>';
 const heading=document.querySelector('#upcoming .sectionHeading h2');if(heading)heading.textContent=featured.title;
 updateCountdowns();clearInterval(timers[0]);timers[0]=setInterval(updateCountdowns,1000);
}
async function load(){
 const r=await client.rpc('get_site_events');if(r.error){console.warn('[Events]',r.error);return}
 events=Array.isArray(r.data)?r.data:[];render();
}
async function respond(eventId,status){
 const r=await client.rpc('respond_to_site_event',{p_event_id:eventId,p_status:status,p_notify:true});
 if(r.error){if(String(r.error.message).toLowerCase().includes('sign in'))location.href='members.html';else toast(r.error.message);return}
 toast(status==='going'?'You are going to this event.':status==='interested'?'You are interested in this event.':'Your response was updated.','Event Response');
 await load();
}
function lightbox(src){
 let box=document.querySelector('.eventLightboxV414');if(!box){box=document.createElement('div');box.className='eventLightboxV414';box.innerHTML='<button aria-label="Close">×</button><img alt="Event photo">';document.body.appendChild(box);box.onclick=e=>{if(e.target===box||e.target.closest('button'))box.classList.remove('open')}}
 box.querySelector('img').src=src;box.classList.add('open');
}
document.addEventListener('click',e=>{
 const response=e.target.closest('[data-event-response]');if(response){const wrap=response.closest('[data-event-responses]');return respond(wrap.dataset.eventResponses,response.dataset.eventResponse)}
 const photo=e.target.closest('[data-event-photo]');if(photo)return lightbox(photo.dataset.eventPhoto);
});
async function boot(){await load();client.channel('site-events-v414').on('postgres_changes',{event:'*',schema:'public',table:'site_events'},load).on('postgres_changes',{event:'*',schema:'public',table:'site_event_responses'},load).subscribe()}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();