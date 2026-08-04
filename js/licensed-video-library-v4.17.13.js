/* Seeker Of SoundZ v4.17.12 — licensed video source library */
(()=>{
'use strict';
const section=document.getElementById('licensedVideoLibraryV41712');
if(!section)return;
const cards=[...section.querySelectorAll('[data-library-source]')];
section.addEventListener('click',async event=>{
 const filter=event.target.closest('[data-library-filter]');
 if(filter){
  event.preventDefault();
  section.querySelectorAll('[data-library-filter]').forEach(button=>button.classList.toggle('isActive',button===filter));
  const value=filter.dataset.libraryFilter;
  cards.forEach(card=>card.hidden=value!=='all'&&card.dataset.librarySource!==value);
  return;
 }
 const useVideo=event.target.closest('[data-use-cc-youtube]');
 if(useVideo){
  event.preventDefault();
  const field=document.getElementById('videoUrlV4171');
  if(field)field.value=useVideo.dataset.useCcYoutube;
  document.getElementById('loadVideoUrlV4171')?.click();
  document.getElementById('stickyVideoPreviewV4177')?.scrollIntoView({behavior:'smooth',block:'start'});
  return;
 }
 if(event.target.closest('#copyYouTubeAttributionV41712')){
  event.preventDefault();
  const text='Video by [Creator], “[Video Title]”, [Source URL], licensed under Creative Commons Attribution (CC BY). Changes were made.';
  try{
   await navigator.clipboard.writeText(text);
   window.SOS?.toast?.('Attribution template copied.',{title:'Licensed Video Library',icon:'✓'});
  }catch{
   window.prompt('Copy this attribution template:',text);
  }
 }
});
})();