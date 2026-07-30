/* Seeker Of SoundZ v4.6.9 — resilient persistent custom cursor */
(()=>{
  "use strict";

  const root=document.documentElement;
  const cursor=document.getElementById("cursor");
  const dot=document.getElementById("cursorDot");
  const ring=document.getElementById("cursorRing");
  const supported=window.matchMedia?.("(pointer: fine) and (hover: hover)").matches===true;
  const storageKey="sos_custom_cursor_enabled_v1";
  const dangerSelector=".forumDeleteConfirm,.collabDangerButton,[data-confirm-delete],.confirmDeleteButton,.deleteConfirmButton,.sosConfirmDeleteV45,.dangerAction,.btn-danger,.delete-button,[data-danger]";

  // Safe fallback: never hide the native cursor when required markup/support is absent.
  if(!cursor||!dot||!ring||!supported){
    root.classList.add("nativeCursor");
    root.classList.remove("customCursorActive");
    return;
  }

  let enabled=true;
  try{ enabled=localStorage.getItem(storageKey)!=="false"; }catch(_){ enabled=true; }

  let mouseX=window.innerWidth/2;
  let mouseY=window.innerHeight/2;
  let ringX=mouseX;
  let ringY=mouseY;
  let hasMoved=false;
  let rafId=0;

  function putOnTop(){
    if(document.body&&cursor.parentNode!==document.body)document.body.appendChild(cursor);
    else if(document.body&&cursor!==document.body.lastElementChild)document.body.appendChild(cursor);
    cursor.style.setProperty("z-index","2147483647","important");
  }

  function setPosition(el,x,y){
    el.style.left=`${x}px`;
    el.style.top=`${y}px`;
  }

  function apply(){
    root.classList.toggle("nativeCursor",!enabled);
    root.classList.toggle("customCursorActive",enabled);
    cursor.hidden=!enabled;
    cursor.style.display=enabled?"block":"none";
    if(enabled){
      putOnTop();
      setPosition(dot,mouseX,mouseY);
      setPosition(ring,ringX,ringY);
    }else{
      cursor.classList.remove("is-visible");
      document.body?.classList.remove("cursorHover","cursorPressed","cursorDangerHover");
    }
    const toggle=document.getElementById("cursorToggle");
    if(toggle)toggle.checked=enabled;
  }

  function bindToggle(){
    const toggle=document.getElementById("cursorToggle");
    if(!toggle)return;
    toggle.checked=enabled;
    toggle.addEventListener("change",()=>{
      enabled=toggle.checked;
      try{localStorage.setItem(storageKey,String(enabled));}catch(_){}
      apply();
    });
  }

  window.addEventListener("pointermove",event=>{
    if(event.pointerType&&event.pointerType!=="mouse"&&event.pointerType!=="pen")return;
    mouseX=event.clientX;
    mouseY=event.clientY;
    hasMoved=true;
    if(!enabled)return;
    setPosition(dot,mouseX,mouseY);
    cursor.classList.add("is-visible");
  },{passive:true,capture:true});

  document.addEventListener("pointerover",event=>{
    if(!enabled)return;
    const target=event.target instanceof Element?event.target:null;
    document.body?.classList.toggle("cursorHover",Boolean(target?.closest("a,button,input,textarea,select,label,[role='button'],.card")));
    document.body?.classList.toggle("cursorDangerHover",Boolean(target?.closest(dangerSelector)));
  },true);

  document.addEventListener("pointerout",event=>{
    const next=event.relatedTarget instanceof Element?event.relatedTarget:null;
    if(!next?.closest(dangerSelector))document.body?.classList.remove("cursorDangerHover");
  },true);

  document.addEventListener("pointerdown",()=>{if(enabled)document.body?.classList.add("cursorPressed");},true);
  document.addEventListener("pointerup",()=>{document.body?.classList.remove("cursorPressed");},true);
  document.addEventListener("click",()=>{if(enabled)putOnTop();},true);
  document.addEventListener("focusin",()=>{if(enabled)putOnTop();},true);
  document.addEventListener("mouseleave",()=>cursor.classList.remove("is-visible"));
  document.addEventListener("mouseenter",()=>{if(enabled&&hasMoved)cursor.classList.add("is-visible");});
  window.addEventListener("blur",()=>cursor.classList.remove("is-visible"));

  function animate(){
    if(enabled&&!document.hidden){
      ringX+=(mouseX-ringX)*0.2;
      ringY+=(mouseY-ringY)*0.2;
      setPosition(ring,ringX,ringY);
    }
    rafId=requestAnimationFrame(animate);
  }

  window.addEventListener("pagehide",()=>cancelAnimationFrame(rafId),{once:true});
  apply();
  bindToggle();
  animate();
})();
