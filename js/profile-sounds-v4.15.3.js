/* Seeker Of SoundZ v4.15.3 — profile-selectable notification and achievement sounds */
(()=>{
'use strict';
const KEY='sos_sound_preferences_v4153';
const defaults={achievement:'crystal-rise',notification:'soft-pulse',volume:.42,enabled:true};
const read=()=>{try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {...defaults}}};
const write=value=>localStorage.setItem(KEY,JSON.stringify({...read(),...value}));
let activeContexts=0;

const presets={
 'crystal-rise':[
  {f:523.25,t:0,d:.22,g:.045,type:'sine'},
  {f:659.25,t:.09,d:.24,g:.042,type:'triangle'},
  {f:783.99,t:.18,d:.3,g:.04,type:'sine'},
  {f:1046.5,t:.31,d:.42,g:.038,type:'sine'}
 ],
 'frequency-bloom':[
  {f:392,t:0,d:.3,g:.04,type:'sine'},
  {f:523.25,t:.1,d:.36,g:.042,type:'triangle'},
  {f:659.25,t:.22,d:.45,g:.038,type:'sine'}
 ],
 'starlight':[
  {f:880,t:0,d:.18,g:.032,type:'sine'},
  {f:1174.66,t:.08,d:.22,g:.028,type:'sine'},
  {f:1396.91,t:.16,d:.3,g:.025,type:'sine'}
 ],
 'deep-signal':[
  {f:261.63,t:0,d:.3,g:.04,type:'triangle'},
  {f:392,t:.12,d:.34,g:.035,type:'sine'},
  {f:523.25,t:.25,d:.38,g:.032,type:'sine'}
 ],
 'soft-pulse':[
  {f:440,t:0,d:.16,g:.032,type:'sine'},
  {f:587.33,t:.08,d:.2,g:.025,type:'sine'}
 ],
 'digital-drop':[
  {f:740,t:0,d:.1,g:.028,type:'square'},
  {f:554.37,t:.08,d:.13,g:.024,type:'triangle'}
 ],
 'gentle-bell':[
  {f:659.25,t:0,d:.28,g:.028,type:'sine'},
  {f:987.77,t:.03,d:.34,g:.018,type:'sine'}
 ],
 'subtle-click':[
  {f:360,t:0,d:.07,g:.024,type:'triangle'}
 ],
 'none':[]
};

function play(name,kind='notification'){
 const settings=read();
 if(!settings.enabled||name==='none'||document.hidden)return;
 const sequence=presets[name]||presets[kind==='achievement'?'crystal-rise':'soft-pulse'];
 if(!sequence?.length||activeContexts>2)return;
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
 try{
  const ctx=new AC();activeContexts++;
  const master=ctx.createGain(),now=ctx.currentTime;
  const volume=Math.max(0,Math.min(.75,Number(settings.volume)||defaults.volume));
  master.gain.value=volume;
  master.connect(ctx.destination);
  sequence.forEach(note=>{
   const osc=ctx.createOscillator(),gain=ctx.createGain();
   osc.type=note.type||'sine';osc.frequency.value=note.f;
   gain.gain.setValueAtTime(.0001,now+note.t);
   gain.gain.exponentialRampToValueAtTime(note.g,now+note.t+.012);
   gain.gain.exponentialRampToValueAtTime(.0001,now+note.t+note.d);
   osc.connect(gain).connect(master);
   osc.start(now+note.t);osc.stop(now+note.t+note.d+.03);
  });
  const end=Math.max(...sequence.map(n=>n.t+n.d))+.12;
  setTimeout(()=>ctx.close().finally(()=>activeContexts--),end*1000);
 }catch{activeContexts=Math.max(0,activeContexts-1)}
}
function playAchievement(){const s=read();play(s.achievement,'achievement')}
function playNotification(){const s=read();play(s.notification,'notification')}
window.SOSAudio={read,write,play,playAchievement,playNotification,presets:Object.keys(presets)};
window.SOSAchievementSound=playAchievement;
window.SOSNotificationSound=playNotification;
})();