/* Seeker Of SoundZ v4.16.0 — Supabase homepage content renderer */
(()=>{
'use strict';
const client=window.SOS_SUPABASE?.client;if(!client)return;
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
let timers=[];

function youtubeId(url){
 try{
  const u=new URL(url,location.href);
  if(u.hostname.includes('youtu.be'))return u.pathname.slice(1).split('/')[0];
  if(u.hostname.includes('youtube.com'))return u.searchParams.get('v')||u.pathname.split('/').filter(Boolean).pop();
 }catch{}
 return '';
}
function videoMedia(data){
 const link=String(data.link||'').trim(),yt=youtubeId(link);
 if(yt)return `<iframe src="https://www.youtube.com/embed/${encodeURIComponent(yt)}" title="${esc(data.title)}" loading="lazy" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
 const vimeo=(link.match(/vimeo\.com\/(?:video\/)?(\d+)/i)||[])[1];
 if(vimeo)return `<iframe src="https://player.vimeo.com/video/${vimeo}" title="${esc(data.title)}" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
 if(/^data:video\//i.test(link)||/\.(mp4|webm|ogg)(\?.*)?$/i.test(link))return `<video src="${esc(link)}" controls playsinline preload="metadata" poster="${esc(data.thumbnail||'')}"></video>`;
 return `<img src="${esc(data.thumbnail||'assets/images/featured-video-cover.jpg')}" alt="${esc(data.title||'Featured video')}" loading="lazy">`;
}
function applyVideo(slot){
 const section=document.getElementById('videoPreview');if(!section)return;
 if(slot?.active===false){section.hidden=true;return}
 const data=slot?.data||{};if(!data.source_id)return;
 section.hidden=false;
 const feature=section.querySelector('.videoFeature');if(!feature)return;
 feature.innerHTML=`<article class="videoPlayerCard"><div class="videoFrame homepageVideoFrameV416">${videoMedia(data)}</div></article>
 <div class="videoDetails"><p class="trackStatus">${esc(data.category||'Featured Video')}</p><h3>${esc(data.title||'Featured Video')}</h3><p class="videoDescription">${esc(data.description||'')}</p><div class="videoActions"><a class="primaryButton" href="${esc(data.link||'videos.html')}" ${data.link?'target="_blank" rel="noopener"':''}>Watch Now</a><a class="secondaryButton" href="videos.html">Explore Videos</a></div></div>`;
}
function applyMusic(slot){
 const section=document.getElementById('musicPreview');if(!section)return;
 if(slot?.active===false){section.hidden=true;return}
 const data=slot?.data||{};if(!data.source_id)return;
 section.hidden=false;
 const card=section.querySelector('.featuredTrack');if(!card)return;
 const playable=data.preview||data.full||'';
 card.innerHTML=`<div class="featuredTrackArtwork"><img src="${esc(data.artwork||'assets/images/featured-track-cover.jpg')}" alt="${esc(data.title||'Featured music')}" loading="lazy">${playable?'<button type="button" class="trackPlayButton" data-home-music-play aria-label="Play featured track">▶</button>':''}</div>
 <div class="featuredTrackContent"><p class="trackStatus">${esc(data.release_type||'Featured Release')}</p><h3>${esc(data.title||'Featured Music')}</h3><p>${esc(data.description||'')}</p><div class="trackMeta"><span>${esc(data.artist||'Seeker Of SoundZ')}</span><span>${esc(data.genre||'Music')}</span>${data.release_date?`<span>${esc(data.release_date)}</span>`:''}</div>${playable?`<audio data-home-music-audio src="${esc(playable)}" preload="metadata"></audio>`:''}<div class="trackActions">${playable?'<button type="button" class="primaryButton" data-home-music-play>Listen Now</button>':''}<a class="secondaryButton" href="music.html">Track Details</a></div></div>`;
}
function countdown(box,date){
 clearInterval(box._timer);
 const update=()=>{
  const delta=new Date(date)-Date.now();
  const values=delta<=0?['00','00','00']:[String(Math.floor(delta/86400000)).padStart(2,'0'),String(Math.floor(delta/3600000)%24).padStart(2,'0'),String(Math.floor(delta/60000)%60).padStart(2,'0')];
  box.querySelector('[data-countdown-days]')?.replaceChildren(values[0]);
  box.querySelector('[data-countdown-hours]')?.replaceChildren(values[1]);
  box.querySelector('[data-countdown-minutes]')?.replaceChildren(values[2]);
 };
 update();box._timer=setInterval(update,30000);timers.push(box._timer);
}
function applyEvent(slot){
 const section=document.getElementById('eventsPreview');if(!section)return;
 if(slot?.active===false){section.hidden=true;return}
 const data=slot?.data||{};if(!data.source_id)return;
 section.hidden=false;
 const article=section.querySelector('.featuredEvent');if(!article)return;
 article.innerHTML=`<div class="featuredEventImage"><img src="${esc(data.cover_image_url||'assets/images/event-featured-01.jpg')}" alt="${esc(data.title||'Featured event')}" loading="lazy"><div class="featuredEventOverlay"></div><div class="eventBadge">${esc(data.event_type||'Featured Event')}</div><div class="eventCountdown"><div><strong data-countdown-days>00</strong><span>Days</span></div><div><strong data-countdown-hours>00</strong><span>Hours</span></div><div><strong data-countdown-minutes>00</strong><span>Minutes</span></div></div></div>
 <div class="featuredEventContent"><p class="sectionEyebrow">${esc(data.event_type||'Live Experience')}</p><h3>${esc(data.title||'Upcoming Event')}</h3><p>${esc(data.description||'')}</p><div class="eventMeta"><span>${data.starts_at?esc(new Date(data.starts_at).toLocaleString()):'Date TBA'}</span><span>${esc([data.venue,data.location].filter(Boolean).join(' • ')||'Location TBA')}</span></div><div class="eventActions">${data.ticket_url?`<a class="primaryButton" href="${esc(data.ticket_url)}" target="_blank" rel="noopener">Tickets</a>`:''}<a class="secondaryButton" href="${esc(data.details_url||'events.html')}" ${data.details_url?'target="_blank" rel="noopener"':''}>Event Details</a></div></div>`;
 countdown(article,data.starts_at);
}
function applyGallery(content){
 const section=document.getElementById('galleryPreview');if(!section)return;
 const slots=['gallery_feature_1','gallery_feature_2','gallery_feature_3'].map(key=>content[key]).filter(slot=>slot&&slot.active!==false&&slot.data?.source_id);
 if(!slots.length)return;
 section.hidden=false;
 const grid=section.querySelector('.galleryPreviewGrid');if(!grid)return;
 grid.innerHTML=slots.map((slot,index)=>{
  const data=slot.data,large=index===0?' galleryPreviewLarge':'';
  return `<a class="galleryPreviewItem${large}" href="gallery.html"><img src="${esc(data.image||'assets/images/gallery-event-01.jpg')}" alt="${esc(data.title||'Gallery image')}" loading="lazy"><div class="galleryPreviewOverlay"><p>${esc(String(data.category||'Gallery').replaceAll('-',' '))}</p><h3>${esc(data.title||'Gallery Highlight')}</h3><span>View Collection →</span></div></a>`;
 }).join('');
}
function bindAudio(){
 document.addEventListener('click',event=>{
  const button=event.target.closest('[data-home-music-play]');if(!button)return;
  const audio=document.querySelector('[data-home-music-audio]');if(!audio)return;
  if(audio.paused){audio.play();document.querySelectorAll('[data-home-music-play]').forEach(x=>x.textContent='Pause')}
  else{audio.pause();document.querySelectorAll('[data-home-music-play]').forEach(x=>x.textContent=x.classList.contains('trackPlayButton')?'▶':'Listen Now')}
 });
}
async function load(){
 const response=await client.rpc('get_homepage_content');
 if(response.error){console.warn('[Homepage content]',response.error);return}
 const content=response.data||{};
 applyVideo(content.featured_video);
 applyMusic(content.featured_music);
 applyEvent(content.featured_event);
 applyGallery(content);
}
async function boot(){
 bindAudio();await load();
 client.channel('homepage-content-v416').on('postgres_changes',{event:'*',schema:'public',table:'homepage_content_slots'},load).subscribe();
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
window.addEventListener('pagehide',()=>timers.forEach(clearInterval),{once:true});
})();