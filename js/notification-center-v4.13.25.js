/* Seeker Of SoundZ v4.13.25 — Supabase realtime notification center */
(()=>{"use strict";
const client=window.SOS_SUPABASE?.client;if(!client)return;
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
let user=null,items=[],channel=null,booted=false;
function openNotificationLink(n){
 const isAchievement=n?.type==="achievement"||String(n?.link_url||"").includes("#achievements");
 if(isAchievement){
  if(location.pathname.endsWith("/members.html")||location.pathname.endsWith("members.html")){
   if(location.hash!=="#achievements")history.replaceState(null,"","#achievements");
   window.dispatchEvent(new CustomEvent("sos:open-achievements"));
  }else{
   location.href="members.html#achievements";
  }
  return;
 }
 if(n?.link_url)location.href=n.link_url;
}
const formatTime=value=>{const d=new Date(value),seconds=Math.max(0,(Date.now()-d.getTime())/1000);if(seconds<60)return"Just now";if(seconds<3600)return`${Math.floor(seconds/60)}m ago`;if(seconds<86400)return`${Math.floor(seconds/3600)}h ago`;return d.toLocaleDateString()};
function ensurePanel(){if($("#sosNotificationPanel"))return;const panel=document.createElement("aside");panel.id="sosNotificationPanel";panel.className="sosNotificationPanel";panel.hidden=true;panel.innerHTML=`<div class="notificationPanelHead"><div><p class="sectionEyebrow">Member signal</p><h2>Notifications</h2></div><button type="button" class="notificationClose" aria-label="Close notifications">×</button></div><div class="notificationPanelActions"><button type="button" class="smallAction" data-notification-read-all>Mark all read</button></div><div id="notificationPanelList" class="notificationPanelList"></div>`;document.body.appendChild(panel);panel.querySelector(".notificationClose").addEventListener("click",closePanel);panel.querySelector("[data-notification-read-all]").addEventListener("click",markAllRead);panel.addEventListener("click",async e=>{const row=e.target.closest("[data-notification-id]");if(!row)return;await markRead(row.dataset.notificationId);const found=items.find(item=>String(item.id)===String(row.dataset.notificationId));openNotificationLink(found||{link_url:row.dataset.notificationLink})})}
function openPanel(){ensurePanel();const p=$("#sosNotificationPanel");p.hidden=false;requestAnimationFrame(()=>p.classList.add("open"));$("#notificationButton")?.setAttribute("aria-expanded","true")}
function closePanel(){const p=$("#sosNotificationPanel");if(!p)return;p.classList.remove("open");$("#notificationButton")?.setAttribute("aria-expanded","false");setTimeout(()=>p.hidden=true,220)}
const unread=()=>items.filter(x=>!x.read_at).length;
const icon=item=>item.type==="mention"?"@":String(item.link_url||"").includes("collaboration")?"♫":item.type==="reply"?"↩":item.type==="reaction"?"♥":"✦";
function render(){ensurePanel();const count=unread(),badge=$("#notificationCount"),button=$("#notificationButton");if(badge){badge.textContent=count>99?"99+":String(count);badge.hidden=!count}button?.classList.toggle("hasNotifications",count>0);const host=$("#notificationPanelList");if(!host)return;host.innerHTML=items.length?items.map(n=>`<button type="button" class="notificationItem ${n.read_at?"isRead":"isUnread"}" data-notification-id="${esc(n.id)}" data-notification-link="${esc(n.link_url||"")}"><span class="notificationItemIcon">${icon(n)}</span><span class="notificationItemCopy"><strong>${esc(n.title||"Member update")}</strong><span>${esc(n.body||"")}</span><small>${n.actor_name?esc(n.actor_name)+" • ":""}${formatTime(n.created_at)}</small></span>${n.read_at?"":"<i aria-label=\"Unread\"></i>"}</button>`).join(""):`<div class="notificationEmpty"><span>✦</span><strong>You are all caught up</strong><p>Messages, mentions, reactions, and community updates will appear here.</p></div>`}
async function load(){if(!user)return;const q=await client.rpc("notification_get_feed",{feed_limit:60});if(q.error){console.warn("[Notifications] Feed unavailable.",q.error);return}items=Array.isArray(q.data)?q.data:[];render()}
async function markRead(id){const q=await client.rpc("notification_mark_read",{notification_id_input:id});if(q.error)return;const found=items.find(x=>x.id===id);if(found)found.read_at=new Date().toISOString();render()}
async function markAllRead(){const q=await client.rpc("notification_mark_all_read");if(q.error)return;const now=new Date().toISOString();items.forEach(x=>x.read_at=x.read_at||now);render()}
function showRealtimeToast(n){if(n.type==="achievement"){window.SOSAchievementSound?.()}window.SOS?.toast?.(n.body||"You received a new member update.",{title:String(n.link_url||"").includes("collaboration")?"New collaboration message":n.type==="mention"?"You were mentioned":n.type==="achievement"?"Achievement unlocked":n.title||"New notification",icon:n.type==="achievement"?"🏆":icon(n),action:"Open",onAction:async()=>{await markRead(n.id);openNotificationLink(n)}})}
async function receive(payload){if(!payload?.new?.id)return;const q=await client.rpc("notification_get_one",{notification_id_input:payload.new.id});if(q.error||!q.data)return;const n=Array.isArray(q.data)?q.data[0]:q.data;if(!n)return;items=[n,...items.filter(x=>x.id!==n.id)];render();showRealtimeToast(n)}
async function subscribe(){if(channel)await client.removeChannel(channel);channel=client.channel(`sos-notifications-${user.id}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications",filter:`user_id=eq.${user.id}`},receive).on("postgres_changes",{event:"UPDATE",schema:"public",table:"notifications",filter:`user_id=eq.${user.id}`},load).subscribe()}
async function sync(){const{data}=await client.auth.getSession();user=data.session?.user||null;ensurePanel();if(!user){items=[];render();closePanel();if(channel){await client.removeChannel(channel);channel=null}return}await load();await subscribe()}
function bind(){if(booted)return;booted=true;document.addEventListener("click",e=>{if(e.target.closest("#notificationButton")){const p=$("#sosNotificationPanel");p&&!p.hidden&&p.classList.contains("open")?closePanel():openPanel();return}const p=$("#sosNotificationPanel");if(p&&!p.hidden&&!p.contains(e.target)&&!e.target.closest("#notificationButton"))closePanel()});document.addEventListener("keydown",e=>{if(e.key==="Escape")closePanel()});window.addEventListener("sos:supabase-session",sync);window.addEventListener("beforeunload",()=>{if(channel)client.removeChannel(channel)},{once:true})}
async function boot(){for(let i=0;i<80&&!$("#notificationButton");i++)await new Promise(r=>setTimeout(r,25));bind();await sync()}
document.readyState==="loading"?document.addEventListener("DOMContentLoaded",boot,{once:true}):boot();
})();