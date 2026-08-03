(()=>{
'use strict';
const form=document.getElementById('contactForm');if(!form)return;
const requested=new URLSearchParams(location.search).get('type');
if(requested&&form.elements.type){form.elements.type.value=requested;if(requested==='Collaboration'){form.elements.subject.value=form.elements.subject.value||'Collaboration Studio access request';form.elements.wantsCollaboration.checked=true}}
form.addEventListener('submit',async event=>{
 event.preventDefault();
 const status=document.getElementById('contactStatus'),button=form.querySelector('[type="submit"]'),fields=new FormData(form);
 button.disabled=true;button.textContent='Sending…';
 const payload={p_name:String(fields.get('name')||'').trim(),p_email:String(fields.get('email')||'').trim(),p_type:String(fields.get('type')||'General'),p_subject:String(fields.get('subject')||'').trim(),p_message:String(fields.get('message')||'').trim(),p_wants_collaboration:fields.has('wantsCollaboration')};
 try{
  const client=window.SOS_SUPABASE?.client;
  if(client){const result=await client.rpc('submit_contact_message',payload);if(result.error)throw result.error}
  else{const item={id:crypto.randomUUID(),name:payload.p_name,email:payload.p_email,type:payload.p_type,subject:payload.p_subject,message:payload.p_message,wantsCollaboration:payload.p_wants_collaboration,date:new Date().toISOString(),status:'new'};const messages=window.SOS?.read?.(window.SOS.K.messages,[])||[];messages.push(item);window.SOS?.write?.(window.SOS.K.messages,messages)}
  status.textContent=payload.p_wants_collaboration?'Message sent. Your Collaboration Studio request is waiting for administrator review.':'Message received and saved to the website Admin Inbox.';
  form.reset();window.SOS?.toast?.('Message sent successfully.',{title:'Contact',icon:'✓'});
 }catch(error){status.textContent=error.message||'The message could not be sent.';window.SOS?.toast?.(status.textContent,{title:'Contact error'})}
 finally{button.disabled=false;button.textContent='Send Message'}
});
})();