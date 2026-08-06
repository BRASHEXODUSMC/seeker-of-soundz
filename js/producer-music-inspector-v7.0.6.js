/* Producer Hub 7.0.6 — Music Inspector readout sync */
(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
function sync(){const a=$('#musicRangeStartLabelV4350'),b=$('#musicRangeEndLabelV4350'),x=$('#inspectorMusicRangeStartV706'),y=$('#inspectorMusicRangeEndV706');if(a&&x)x.textContent=a.textContent;if(b&&y)y.textContent=b.textContent}
window.addEventListener('sos:music-trim-changed',sync);
for(const id of ['musicRangeStartLabelV4350','musicRangeEndLabelV4350']){const el=document.getElementById(id);if(el)new MutationObserver(sync).observe(el,{childList:true,subtree:true,characterData:true})}
window.SOSMusicInspectorV706={open(){document.querySelector('[data-inspector-tab="audio"]')?.click();document.getElementById('inspectorMusicOffsetV706')?.scrollIntoView({block:'nearest',behavior:'smooth'})},sync};
sync();
})();
