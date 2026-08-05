(()=>{
'use strict';
const client=window.SOS_SUPABASE?.client;
const authArea=document.getElementById('authArea');
const dashboard=document.getElementById('memberDashboard');
const loginForm=document.getElementById('loginForm');
const registerForm=document.getElementById('registerForm');
const loginMessage=document.getElementById('loginMessage');
const registerMessage=document.getElementById('registerMessage');
const resetButton=document.getElementById('resetPassword');
const logoutButton=document.getElementById('logoutButton');
const defaultAvatar='assets/images/sos-logo.png';
document.body.classList.add('membersAuthPendingV4196');

const message=(el,text,type='')=>{if(!el)return;el.textContent=text;el.dataset.state=type;};
const friendly=(error)=>{
 const source=error&&typeof error==='object'
   ?[error.message,error.details,error.hint,error.code].filter(Boolean).join(' ')
   :String(error||'Something went wrong.');
 const text=String(source||'Something went wrong.');
 if(/invalid login credentials/i.test(text))return 'The email or password is incorrect.';
 if(/email not confirmed/i.test(text))return 'Please confirm your email before signing in.';
 if(/user already registered/i.test(text))return 'An account already exists for that email.';
 if(/username|profiles_username|duplicate key|23505/i.test(text))return 'That username is already being used. Please choose a different username.';
 if(/database error saving new user/i.test(text))return 'That username may already be in use. Please choose another username and try again.';
 if(/password/i.test(text)&&/characters/i.test(text))return 'Please use a stronger password with at least 6 characters.';
 if(/^\s*\{\s*\}\s*$/.test(text)||/\[object Object\]/i.test(text))return 'The account could not be created. Check that the username and email are not already in use.';
 return text;
};
const setBusy=(form,busy)=>{form?.querySelectorAll('button,input').forEach(el=>{if(el.type!=='file')el.disabled=busy;});};

function show(session){
 const s=session||SOS.getSession();
 const signed=Boolean(s?.id&&s?.supabase);
 authArea.hidden=signed;
 dashboard.hidden=!signed;
 document.body.classList.toggle('membersSignedInV4193',signed);
 document.body.classList.remove('membersAuthPendingV4196');
 document.body.classList.add('membersAuthResolvedV4196');
 if(!signed)return;
 document.getElementById('dashboardAvatar').src=s.avatar||defaultAvatar;
 document.getElementById('dashboardName').textContent=s.displayName||s.username||'Member';
 document.getElementById('dashboardEmail').textContent=`${s.email}${s.dbRole?` • ${String(s.dbRole).replace('_',' ')}`:''}`;
 document.getElementById('vaultAccessText').textContent=s.dbRole==='premium_member'?'Premium member releases are unlocked for your account.':'Private tracks, videos, and member drops will appear here.';
}

document.querySelectorAll('[data-auth-tab]').forEach(b=>b.addEventListener('click',()=>{
 document.querySelectorAll('[data-auth-tab]').forEach(x=>x.classList.toggle('active',x===b));
 loginForm.hidden=b.dataset.authTab!=='login';
 registerForm.hidden=b.dataset.authTab!=='register';
}));

let usernameCheckTimer=0;
let usernameCheckValue='';
let usernameCheckAvailable=null;
const usernameInput=registerForm?.elements?.username;
function ensureUsernameStatus(){
 if(!usernameInput)return null;
 let status=document.getElementById('usernameAvailabilityMessage');
 if(status)return status;
 status=document.createElement('small');
 status.id='usernameAvailabilityMessage';
 status.className='usernameAvailabilityMessage';
 status.setAttribute('aria-live','polite');
 usernameInput.insertAdjacentElement('afterend',status);
 return status;
}
async function checkUsernameAvailability(value,{showChecking=true}={}){
 const username=String(value||'').trim();
 const status=ensureUsernameStatus();
 usernameCheckValue=username;
 usernameCheckAvailable=null;
 if(!/^[A-Za-z0-9_]{3,24}$/.test(username)){
  if(status){status.textContent=username?'Use 3–24 letters, numbers, or underscores.':'';status.dataset.state='error';}
  return false;
 }
 if(showChecking&&status){status.textContent='Checking username availability…';status.dataset.state='checking';}
 const {data,error}=await client.rpc('username_is_available',{username_input:username});
 if(username!==usernameCheckValue)return false;
 if(error){
  console.warn('[Username check]',error);
  if(status){status.textContent='Username availability will be verified when you register.';status.dataset.state='';}
  usernameCheckAvailable=null;
  return null;
 }
 usernameCheckAvailable=Boolean(data);
 if(status){
  status.textContent=usernameCheckAvailable?'Username is available.':'That username is already being used. Please choose another.';
  status.dataset.state=usernameCheckAvailable?'success':'error';
 }
 return usernameCheckAvailable;
}
usernameInput?.addEventListener('input',event=>{
 clearTimeout(usernameCheckTimer);
 usernameCheckAvailable=null;
 usernameCheckTimer=setTimeout(()=>checkUsernameAvailability(event.target.value),420);
});
usernameInput?.addEventListener('blur',()=>checkUsernameAvailability(usernameInput.value,{showChecking:false}));

registerForm?.addEventListener('submit',async e=>{
 e.preventDefault();
 if(!client){message(registerMessage,'Supabase is not connected. Check backend-config.js.','error');return;}
 const f=new FormData(registerForm);
 const displayName=String(f.get('displayName')||'').trim();
 const username=String(f.get('username')||'').trim();
 const email=String(f.get('email')||'').trim().toLowerCase();
 const password=String(f.get('password')||'');
 if(!/^[A-Za-z0-9_]{3,24}$/.test(username)){message(registerMessage,'Username must be 3–24 characters using letters, numbers, or underscores.','error');return;}
 const available=username===usernameCheckValue&&usernameCheckAvailable!==null
   ?usernameCheckAvailable
   :await checkUsernameAvailability(username);
 if(available===false){
  message(registerMessage,'That username is already being used. Please choose a different username.','error');
  usernameInput?.focus();
  return;
 }
 setBusy(registerForm,true);message(registerMessage,'Creating your secure account…');
 try{
   const redirectTo=new URL('members.html',location.href).href;
   const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:redirectTo,data:{username,display_name:displayName}}});
   if(error)throw error;
   registerForm.reset();
   if(data.session){
     const mapped=await window.SOS_AUTH_BRIDGE?.sync(data.session);show(mapped);
     SOS.toast('Your account is ready.',{title:'Welcome to Seeker Of SoundZ'});
   }else{
     message(registerMessage,'Account created. Check your email and click the confirmation link, then return here to sign in.','success');
   }
 }catch(err){message(registerMessage,friendly(err),'error');}
 finally{setBusy(registerForm,false);}
});

loginForm?.addEventListener('submit',async e=>{
 e.preventDefault();
 if(!client){message(loginMessage,'Supabase is not connected. Check backend-config.js.','error');return;}
 const f=new FormData(loginForm);const email=String(f.get('email')||'').trim().toLowerCase();const password=String(f.get('password')||'');
 setBusy(loginForm,true);message(loginMessage,'Signing you in securely…');
 try{
   const {data,error}=await client.auth.signInWithPassword({email,password});if(error)throw error;
   const mapped=await window.SOS_AUTH_BRIDGE?.sync(data.session);message(loginMessage,'');show(mapped);
   SOS.toast(`Welcome back, ${mapped?.displayName||'member'}.`,{title:'Signed in'});
 }catch(err){message(loginMessage,friendly(err),'error');}
 finally{setBusy(loginForm,false);}
});

async function sendPasswordReset(email, output = loginMessage, button = resetButton){
 if(!client)return message(output,'Supabase is not connected.','error');
 const address=String(email||'').trim().toLowerCase();
 if(!address)return message(output,'Enter your email address first, then select Reset Password.','error');
 if(button)button.disabled=true;message(output,'Sending a password-reset email…');
 try{
   const redirectTo=new URL('password-reset.html',location.href).href;
   const {error}=await client.auth.resetPasswordForEmail(address,{redirectTo});
   if(error)throw error;
   message(output,'Password-reset email sent. Open the link in that email to choose a new password.','success');
   window.SOS?.toast?.('Check your email for the secure password-reset link.',{title:'Reset email sent'});
 }catch(err){message(output,friendly(err),'error');}
 finally{if(button)button.disabled=false;}
}
window.SOS_REQUEST_PASSWORD_RESET=sendPasswordReset;
resetButton?.addEventListener('click',()=>sendPasswordReset(loginForm.elements.email.value));

async function openRecovery(){
 const params=new URLSearchParams(location.search);
 const hashParams=new URLSearchParams(location.hash.replace(/^#/,''));
 const code=params.get('code');
 const recoveryRequested=params.get('recovery')==='1'||params.get('type')==='recovery'||hashParams.get('type')==='recovery'||Boolean(code);
 if(!recoveryRequested)return false;
 authArea.hidden=false;dashboard.hidden=true;
 document.body.classList.remove('membersAuthPendingV4196');
 document.body.classList.add('membersAuthResolvedV4196');
 const card=authArea.querySelector('.authCard');
 card.innerHTML=`<div class="authModeHeader"><p class="sectionEyebrow">Secure Recovery</p><h2>Choose a new password</h2><p>Complete the secure recovery link before setting your new password.</p></div><form class="appForm" id="passwordUpdateForm"><label>New password<input name="password" type="password" minlength="6" required autocomplete="new-password"></label><label>Confirm new password<input name="confirmPassword" type="password" minlength="6" required autocomplete="new-password"></label><button class="primaryButton">Update Password</button><p class="formMessage" id="passwordUpdateMessage">Verifying your recovery link…</p></form>`;
 const form=document.getElementById('passwordUpdateForm'),out=document.getElementById('passwordUpdateMessage');
 let recoverySession=null;
 try{
   if(code){
     const {data,error}=await client.auth.exchangeCodeForSession(code);
     if(error)throw error;
     recoverySession=data.session;
   }else{
     const {data,error}=await client.auth.getSession();
     if(error)throw error;
     recoverySession=data.session;
   }
   if(!recoverySession){
     await new Promise(resolve=>{
       let settled=false;
       const timer=setTimeout(()=>{if(!settled){settled=true;resolve()}},1800);
       const {data:listener}=client.auth.onAuthStateChange((event,session)=>{
         if(event==='PASSWORD_RECOVERY'||session){recoverySession=session;if(!settled){settled=true;clearTimeout(timer);listener.subscription.unsubscribe();resolve()}}
       });
     });
   }
   if(!recoverySession)throw new Error('The password-reset link is expired or incomplete. Request a new reset email and open the newest link.');
   message(out,'Recovery verified. Choose your new password.','success');
 }catch(err){message(out,friendly(err),'error');form.querySelector('button').disabled=true;return true;}
 form.onsubmit=async e=>{
   e.preventDefault();const f=new FormData(form),p=String(f.get('password')),c=String(f.get('confirmPassword'));
   if(p!==c)return message(out,'The passwords do not match.','error');
   setBusy(form,true);
   try{
     const {data:sessionData}=await client.auth.getSession();
     if(!sessionData.session)throw new Error('Your recovery session expired. Request a new password-reset email.');
     const {error}=await client.auth.updateUser({password:p});if(error)throw error;
     message(out,'Password updated. You are signed in and may continue to your dashboard.','success');
     history.replaceState({},'',location.pathname);
     const mapped=await window.SOS_AUTH_BRIDGE?.sync(sessionData.session);
     window.SOS?.toast?.('Your password was updated securely.',{title:'Password updated'});
     setTimeout(()=>show(mapped),800);
   }catch(err){message(out,friendly(err),'error');}
   finally{setBusy(form,false);}
 };
 return true;
}

logoutButton?.addEventListener('click',()=>SOS.logout());
document.getElementById('dashboardCart')?.addEventListener('click',()=>document.getElementById('cartDrawer')?.classList.add('open'));
window.addEventListener('sos:supabase-session',e=>show(e.detail));
window.addEventListener('sos:session',e=>show(e.detail));

const pageParams=new URLSearchParams(location.search);
const notice=pageParams.get('notice');
if(notice==='admin-required')message(loginMessage,'Please sign in with an Owner or Administrator account to open the Admin Hub.','error');
if(pageParams.get('reset')==='1'){message(loginMessage,'Enter your account email, then choose Reset Password to receive a new secure link.','success');loginForm?.elements.email?.focus();}
if(pageParams.get('password')==='updated')message(loginMessage,'Your password was updated. Sign in with your new password.','success');
openRecovery().then(recoveryOpen=>{
 if(recoveryOpen)return;
 if(!client){show(null);return}
 client.auth.getSession()
  .then(({data})=>window.SOS_AUTH_BRIDGE?.sync(data.session).then(show))
  .catch(error=>{console.error(error);show(null)});
}).catch(error=>{console.error(error);show(null)});
})();
