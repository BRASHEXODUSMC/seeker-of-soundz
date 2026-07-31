(()=>{
'use strict';
const client=window.SOS_SUPABASE?.client;
const status=document.getElementById('passwordResetStatus');
const statusText=document.getElementById('passwordResetStatusText');
const form=document.getElementById('dedicatedPasswordResetForm');
const output=document.getElementById('passwordResetMessage');
const resend=document.getElementById('requestAnotherReset');
let verifiedSession=null;

function setStatus(text,state='loading'){
  statusText.textContent=text;
  status.dataset.state=state;
}
function setMessage(text,state=''){
  output.textContent=text;
  output.dataset.state=state;
}
function friendly(error){
  const text=String(error?.message||error||'Something went wrong.');
  if(/expired|invalid.*code|code.*invalid/i.test(text)) return 'This reset link has expired or was already used. Request a new reset email.';
  if(/auth session missing/i.test(text)) return 'The secure recovery session could not be created. Request a new reset email and open the newest link in this browser.';
  return text;
}
async function establishRecoverySession(){
  if(!client) throw new Error('Supabase is not connected.');
  const url=new URL(location.href);
  const code=url.searchParams.get('code');
  const hash=new URLSearchParams(url.hash.replace(/^#/,''));
  const accessToken=hash.get('access_token');
  const refreshToken=hash.get('refresh_token');

  if(code){
    const {data,error}=await client.auth.exchangeCodeForSession(code);
    if(error) throw error;
    if(data?.session) verifiedSession=data.session;
  } else if(accessToken && refreshToken){
    const {data,error}=await client.auth.setSession({access_token:accessToken,refresh_token:refreshToken});
    if(error) throw error;
    if(data?.session) verifiedSession=data.session;
  }

  if(!verifiedSession){
    const {data,error}=await client.auth.getSession();
    if(error) throw error;
    verifiedSession=data?.session||null;
  }

  if(!verifiedSession){
    await new Promise(resolve=>{
      let done=false;
      const timer=setTimeout(()=>{if(!done){done=true;subscription?.unsubscribe();resolve();}},2500);
      const {data}=client.auth.onAuthStateChange((event,session)=>{
        if(event==='PASSWORD_RECOVERY'||session){verifiedSession=session||verifiedSession;if(!done){done=true;clearTimeout(timer);data.subscription.unsubscribe();resolve();}}
      });
      const subscription=data.subscription;
    });
  }
  if(!verifiedSession) throw new Error('Auth session missing.');
  return verifiedSession;
}

async function initialize(){
  try{
    await establishRecoverySession();
    setStatus('Secure recovery verified. Enter your new password.','success');
    form.hidden=false;
    form.querySelector('input')?.focus();
  }catch(error){
    setStatus(friendly(error),'error');
    form.hidden=true;
  }
}

form?.addEventListener('submit',async event=>{
  event.preventDefault();
  const button=form.querySelector('button[type="submit"]');
  const fields=new FormData(form);
  const password=String(fields.get('password')||'');
  const confirmPassword=String(fields.get('confirmPassword')||'');
  if(password.length<8){setMessage('Use at least 8 characters.','error');return;}
  if(password!==confirmPassword){setMessage('The passwords do not match.','error');return;}
  button.disabled=true;setMessage('Updating your password securely…');
  try{
    const {data}=await client.auth.getSession();
    if(!data?.session) await establishRecoverySession();
    const {error}=await client.auth.updateUser({password});
    if(error) throw error;
    history.replaceState({},'',location.pathname);
    setStatus('Password updated successfully.','success');
    setMessage('Your new password is active. Redirecting you to the Members area…','success');
    window.SOS?.toast?.('Your password was updated securely.',{title:'Password updated'});
    setTimeout(()=>location.replace('members.html?password=updated'),1800);
  }catch(error){setMessage(friendly(error),'error');button.disabled=false;}
});

document.querySelectorAll('[data-reveal]').forEach(button=>button.addEventListener('click',()=>{
  const input=form.elements[button.dataset.reveal];
  const show=input.type==='password';input.type=show?'text':'password';button.textContent=show?'Hide':'Show';
}));
form?.elements.password?.addEventListener('input',event=>{
  const value=event.target.value;let score=0;
  if(value.length>=8)score++;if(value.length>=12)score++;if(/[A-Z]/.test(value)&&/[a-z]/.test(value))score++;if(/\d/.test(value))score++;if(/[^A-Za-z0-9]/.test(value))score++;
  document.querySelector('#passwordStrength span').style.width=`${Math.min(100,score*20)}%`;
});
resend?.addEventListener('click',()=>location.href='members.html?reset=1');
initialize();
})();
