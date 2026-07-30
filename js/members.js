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

const message=(el,text,type='')=>{if(!el)return;el.textContent=text;el.dataset.state=type;};
const friendly=(error)=>{
 const text=String(error?.message||error||'Something went wrong.');
 if(/invalid login credentials/i.test(text))return 'The email or password is incorrect.';
 if(/email not confirmed/i.test(text))return 'Please confirm your email before signing in.';
 if(/user already registered/i.test(text))return 'An account already exists for that email.';
 if(/password/i.test(text)&&/characters/i.test(text))return 'Please use a stronger password with at least 6 characters.';
 return text;
};
const setBusy=(form,busy)=>{form?.querySelectorAll('button,input').forEach(el=>{if(el.type!=='file')el.disabled=busy;});};

function show(session){
 const s=session||SOS.getSession();
 const signed=Boolean(s?.id&&s?.supabase);
 authArea.hidden=signed;
 dashboard.hidden=!signed;
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

registerForm?.addEventListener('submit',async e=>{
 e.preventDefault();
 if(!client){message(registerMessage,'Supabase is not connected. Check backend-config.js.','error');return;}
 const f=new FormData(registerForm);
 const displayName=String(f.get('displayName')||'').trim();
 const username=String(f.get('username')||'').trim();
 const email=String(f.get('email')||'').trim().toLowerCase();
 const password=String(f.get('password')||'');
 if(!/^[A-Za-z0-9_]{3,24}$/.test(username)){message(registerMessage,'Username must be 3–24 characters using letters, numbers, or underscores.','error');return;}
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

resetButton?.addEventListener('click',async()=>{
 if(!client)return message(loginMessage,'Supabase is not connected.','error');
 const email=String(loginForm.elements.email.value||'').trim().toLowerCase();
 if(!email)return message(loginMessage,'Enter your email address first, then select Reset Password.','error');
 resetButton.disabled=true;message(loginMessage,'Sending a password-reset email…');
 try{const redirectTo=new URL('members.html?recovery=1',location.href).href;const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo});if(error)throw error;message(loginMessage,'Password-reset email sent. Open the link in that email to choose a new password.','success');}
 catch(err){message(loginMessage,friendly(err),'error');}finally{resetButton.disabled=false;}
});

function openRecovery(){
 const params=new URLSearchParams(location.search);const hash=location.hash;
 if(params.get('recovery')!=='1'&&!/type=recovery/.test(hash))return;
 authArea.hidden=false;dashboard.hidden=true;
 const card=authArea.querySelector('.authCard');
 card.innerHTML=`<p class="sectionEyebrow">Secure Recovery</p><h2>Choose a new password</h2><form class="appForm" id="passwordUpdateForm"><label>New password<input name="password" type="password" minlength="6" required autocomplete="new-password"></label><label>Confirm new password<input name="confirmPassword" type="password" minlength="6" required autocomplete="new-password"></label><button class="primaryButton">Update Password</button><p class="formMessage" id="passwordUpdateMessage"></p></form>`;
 const form=document.getElementById('passwordUpdateForm'),out=document.getElementById('passwordUpdateMessage');
 form.onsubmit=async e=>{e.preventDefault();const f=new FormData(form),p=String(f.get('password')),c=String(f.get('confirmPassword'));if(p!==c)return message(out,'The passwords do not match.','error');setBusy(form,true);try{const {error}=await client.auth.updateUser({password:p});if(error)throw error;message(out,'Password updated. You are signed in and may continue to your dashboard.','success');history.replaceState({},'',location.pathname);const {data}=await client.auth.getSession();const mapped=await window.SOS_AUTH_BRIDGE?.sync(data.session);setTimeout(()=>show(mapped),900);}catch(err){message(out,friendly(err),'error');}finally{setBusy(form,false);}};
}

logoutButton?.addEventListener('click',()=>SOS.logout());
document.getElementById('dashboardCart')?.addEventListener('click',()=>document.getElementById('cartDrawer')?.classList.add('open'));
window.addEventListener('sos:supabase-session',e=>show(e.detail));
window.addEventListener('sos:session',e=>show(e.detail));

const notice=new URLSearchParams(location.search).get('notice');
if(notice==='admin-required')message(loginMessage,'Please sign in with an Owner or Administrator account to open the Admin Hub.','error');
openRecovery();
client?.auth.getSession().then(({data})=>window.SOS_AUTH_BRIDGE?.sync(data.session).then(show));
})();
