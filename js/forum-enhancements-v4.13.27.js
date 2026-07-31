/* Seeker Of SoundZ v4.13.27 — member strip, mention autocomplete, reactions, custom delete confirmation */
(()=>{
'use strict';
const client=window.SOS_SUPABASE?.client;if(!client)return;
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
let members=[],mentionBox=null,activeField=null,mentionStart=-1,activeIndex=0;
const toast=(m,o={})=>window.SOS?.toast?.(m,o);
const avatar=p=>p.avatar_url||'assets/images/sos-logo.png';
const display=p=>p.display_name||p.username||'Member';

async function loadMembers(){
 const q=await client.rpc('forum_member_directory');
 if(q.error){console.warn('[Forum members]',q.error);return}
 members=Array.isArray(q.data)?q.data:[];
 renderPresenceStrip();
}
function ensurePresenceStrip(){
 if($('#forumPresenceStrip'))return;
 const section=document.querySelector('.section .container');
 const grid=document.querySelector('.forumGrid');
 if(!section||!grid)return;
 const strip=document.createElement('section');
 strip.id='forumPresenceStrip';strip.className='forumPresenceStrip';
 strip.innerHTML='<div class="forumPresenceStripHead"><div><p class="sectionEyebrow">Community presence</p><h3>Members on the frequency</h3></div><span id="forumPresenceSummary">Loading members…</span></div><div class="forumPresenceMembers" id="forumPresenceMembers"></div>';
 grid.before(strip);
}
function renderPresenceStrip(){
 ensurePresenceStrip();
 const host=$('#forumPresenceMembers'),summary=$('#forumPresenceSummary');if(!host)return;
 const online=members.filter(x=>x.presence_state==='online').length;
 const hidden=members.filter(x=>x.presence_state==='hidden').length;
 if(summary)summary.textContent=`${members.length} members • ${online} online${hidden?` • ${hidden} hidden`:''}`;
 host.innerHTML=members.length?members.map(p=>`<button type="button" class="forumPresenceMember" data-state="${esc(p.presence_state)}" data-profile-id="${esc(p.id)}" data-profile-name="${esc(display(p))}" data-profile-avatar="${esc(avatar(p))}" data-profile-role="${esc(p.role||'member')}" data-profile-rank="${esc(p.rank_name||'New Listener')}" data-profile-reputation="${Number(p.reputation||0)}" data-profile-bio="${esc(p.biography||'Community member on the Seeker Of SoundZ frequency.')}" data-profile-location="${esc(p.location||'Not shared')}" data-profile-online="${p.presence_state==='online'}" data-profile-status="${esc(p.presence_state==='hidden'?'Presence hidden':p.activity_status||'Exploring the frequency')}"><img src="${esc(avatar(p))}" alt=""><i></i><span><strong>${esc(display(p))}</strong><small>${p.presence_state==='hidden'?'Hidden':p.presence_state==='online'?esc(p.activity_status||'Online'):'Offline'}</small></span></button>`).join(''):'<div class="emptyState">No members found.</div>';
}
function ensureMentionBox(){
 if(mentionBox)return;
 mentionBox=document.createElement('div');mentionBox.className='mentionAutocomplete';mentionBox.hidden=true;document.body.appendChild(mentionBox);
 mentionBox.addEventListener('mousedown',e=>e.preventDefault());
 mentionBox.addEventListener('click',e=>{const b=e.target.closest('[data-mention-user]');if(b)insertMention(b.dataset.mentionUser)});
}
function currentMention(field){
 const pos=field.selectionStart??0,before=field.value.slice(0,pos),m=before.match(/(?:^|\s)@([A-Za-z0-9_]*)$/);
 if(!m)return null;
 return{query:m[1],start:pos-m[1].length-1,end:pos};
}
function positionMentionBox(field){
 const r=field.getBoundingClientRect();
 mentionBox.style.left=Math.max(12,Math.min(innerWidth-352,r.left+18))+'px';
 mentionBox.style.top=Math.min(innerHeight-300,r.bottom-6)+'px';
}
function showMentions(field){
 ensureMentionBox();const info=currentMention(field);
 if(!info){mentionBox.hidden=true;return}
 activeField=field;mentionStart=info.start;activeIndex=0;
 const q=info.query.toLowerCase();
 const rows=members.filter(p=>p.presence_state!=='hidden'&&(!q||p.username.toLowerCase().includes(q)||display(p).toLowerCase().includes(q))).slice(0,8);
 if(!rows.length){mentionBox.hidden=true;return}
 mentionBox.innerHTML=rows.map((p,i)=>`<button type="button" class="mentionSuggestion ${i===0?'active':''}" data-mention-user="${esc(p.username)}"><img src="${esc(avatar(p))}" alt=""><span><strong>@${esc(p.username)}</strong><small>${esc(display(p))} • ${p.presence_state==='online'?'Online':'Offline'}</small></span></button>`).join('');
 mentionBox.hidden=false;positionMentionBox(field);
}
function insertMention(username){
 if(!activeField||mentionStart<0)return;
 const end=activeField.selectionStart??mentionStart;
 activeField.setRangeText(`@${username} `,mentionStart,end,'end');
 mentionBox.hidden=true;activeField.focus();activeField.dispatchEvent(new Event('input',{bubbles:true}));
}
function bindMentions(){
 document.addEventListener('input',e=>{if(e.target.matches('#postBody,.inlineReplyComposer textarea'))showMentions(e.target)});
 document.addEventListener('keydown',e=>{
   if(mentionBox?.hidden||!e.target.matches('#postBody,.inlineReplyComposer textarea'))return;
   const buttons=[...mentionBox.querySelectorAll('.mentionSuggestion')];
   if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();buttons[activeIndex]?.classList.remove('active');activeIndex=(activeIndex+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons[activeIndex]?.classList.add('active');buttons[activeIndex]?.scrollIntoView({block:'nearest'})}
   else if(e.key==='Enter'||e.key==='Tab'){e.preventDefault();buttons[activeIndex]?.click()}
   else if(e.key==='Escape')mentionBox.hidden=true;
 });
 document.addEventListener('click',e=>{if(mentionBox&&!mentionBox.contains(e.target)&&e.target!==activeField)mentionBox.hidden=true});
 addEventListener('resize',()=>{if(activeField&&mentionBox&&!mentionBox.hidden)positionMentionBox(activeField)});
 addEventListener('scroll',()=>{if(mentionBox)mentionBox.hidden=true},{passive:true});
}
async function boot(){
 ensurePresenceStrip();bindMentions();await loadMembers();
 const ch=client.channel('forum-member-presence-v41327').on('postgres_changes',{event:'UPDATE',schema:'public',table:'profiles'},loadMembers).subscribe();
 addEventListener('beforeunload',()=>client.removeChannel(ch),{once:true});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();