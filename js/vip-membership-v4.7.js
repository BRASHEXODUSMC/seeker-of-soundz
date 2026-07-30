(()=>{
"use strict";
const box=document.getElementById("vipMembershipPanel");
if(!box||!window.SOS)return;
const statusEl=document.getElementById("vipMembershipStatus");
const buyButton=document.getElementById("vipCheckoutButton");
const buyButtons=[buyButton,document.getElementById("vipCheckoutButtonTop"),document.getElementById("vipCheckoutButtonModal")].filter(Boolean);
const benefitsButton=document.getElementById("vipBenefitsButton");
const benefitsModal=document.getElementById("vipBenefitsModal");
let benefitsLastFocus=null;
const refreshButton=document.getElementById("vipRefreshButton");
const config=window.SOS_BACKEND||{};
const base=String(config.apiBaseUrl||"").replace(/\/$/,"");
const session=()=>SOS.getSession();
function setStatus(title,message,state="idle"){
  box.dataset.vipState=state;
  statusEl.innerHTML=`<strong>${title}</strong><span>${message}</span>`;
}
function syncLocalVip(active,details={}){
  const current=session();
  if(!current)return;
  const updated={...current,paidMember:!!active,vipStatus:details.status||(active?"active":"inactive"),vipUpdatedAt:new Date().toISOString()};
  SOS.setSession(updated);
  const users=SOS.read(SOS.K.users,[]);
  const user=users.find(u=>u.id===current.id);
  if(user){user.paidMember=!!active;user.vipStatus=updated.vipStatus;user.vipUpdatedAt=updated.vipUpdatedAt;SOS.write(SOS.K.users,users)}
  window.dispatchEvent(new CustomEvent("sos:membership-updated",{detail:updated}));
}
async function refreshMembership({quiet=false}={}){
  const user=session();
  if(!user){setStatus("Sign in required","Create or enter your member account before purchasing VIP access.","locked");return false}
  if(!base){
    if(user.paidMember)setStatus("VIP access active","This local-preview account currently has the VIP badge. Connect the production backend for payment-controlled access.","active");
    else setStatus("Production connection required","The page is ready, but apiBaseUrl must be configured before automatic payment verification can run.","setup");
    return false;
  }
  if(!quiet)setStatus("Checking membership","Contacting the secure membership service...","loading");
  try{
    const res=await fetch(`${base}/api/membership/status`,{credentials:"include",headers:{"Accept":"application/json","X-Demo-User-Id":user.id}});
    if(!res.ok)throw new Error((await res.json().catch(()=>({}))).error||`Status ${res.status}`);
    const data=await res.json();
    syncLocalVip(!!data.vipActive,data);
    setStatus(data.vipActive?"VIP access active":"VIP access not active",data.vipActive?"Your badge and member-exclusive music access have been synchronized automatically.":"Complete checkout to unlock VIP music, downloads, and your VIP profile badge.",data.vipActive?"active":"inactive");
    return !!data.vipActive;
  }catch(err){setStatus("Membership check unavailable",`${err.message}. Your local badge was not changed.`,"error");return false}
}
async function startCheckout(){
  const user=session();
  if(!user){setStatus("Sign in required","Open the Members page, sign in, then return here to purchase VIP.","locked");return}
  if(!base){
    if(config.vipPaymentLink){location.href=config.vipPaymentLink;return}
    setStatus("Checkout is not connected","Add your deployed API URL to js/backend-config.js. The setup PDF in Documentation explains every step.","setup");return
  }
  buyButtons.forEach(button=>button.disabled=true);setStatus("Opening secure checkout","Creating your VIP checkout session...","loading");
  try{
    const res=await fetch(`${base}/api/checkout/vip`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json","Accept":"application/json","X-Demo-User-Id":user.id},body:JSON.stringify({email:user.email,displayName:user.displayName})});
    const data=await res.json().catch(()=>({}));
    if(!res.ok||!data.url)throw new Error(data.error||"Checkout could not be created");
    location.href=data.url;
  }catch(err){buyButtons.forEach(button=>button.disabled=false);setStatus("Checkout unavailable",err.message,"error")}
}
function openBenefits(){
  if(!benefitsModal)return;
  benefitsLastFocus=document.activeElement;
  benefitsModal.hidden=false;
  document.body.classList.add("vipBenefitsOpen");
  benefitsModal.querySelector(".vipBenefitsClose")?.focus();
}
function closeBenefits(){
  if(!benefitsModal)return;
  benefitsModal.hidden=true;
  document.body.classList.remove("vipBenefitsOpen");
  benefitsLastFocus?.focus?.();
}
buyButtons.forEach(button=>button.addEventListener("click",()=>{closeBenefits();startCheckout()}));
benefitsButton?.addEventListener("click",openBenefits);
benefitsModal?.addEventListener("click",event=>{if(event.target.closest("[data-vip-benefits-close]"))closeBenefits()});
document.addEventListener("keydown",event=>{if(event.key==="Escape"&&benefitsModal&&!benefitsModal.hidden)closeBenefits()});
refreshButton?.addEventListener("click",()=>refreshMembership());
const params=new URLSearchParams(location.search);
if(params.get("vip")==="success"){
  setStatus("Payment received","Verifying your membership and updating your badge...","loading");
  refreshMembership().then(active=>{if(active)SOS.toast("VIP membership unlocked automatically.",{title:"Welcome to VIP",icon:"💎"})});
  history.replaceState({},"",location.pathname+location.hash);
}else if(params.get("vip")==="cancelled"){
  setStatus("Checkout cancelled","No membership changes were made.","inactive");history.replaceState({},"",location.pathname+location.hash)
}else refreshMembership({quiet:true});
})();
