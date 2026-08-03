(()=>{
  "use strict";

  const K={
    cart:"sos_cart_v2",
    users:"sos_users_v2",
    session:"sos_session_v2",
    posts:"sos_forum_posts_v2",
    messages:"sos_messages_v2",
    announcements:"sos_announcements_v1",
    catalog:"sos_catalog_v1",
    music:"sos_music_v1",
    videos:"sos_videos_v1",
    gallery:"sos_gallery_v1",
    notifications:"sos_member_notifications_v1"
  };

  const read=(key,fallback)=>{
    try{return JSON.parse(localStorage.getItem(key))??fallback}
    catch{return fallback}
  };
  const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));

  function toast(message,options={}){
    let stack=document.querySelector(".toastStack");
    if(!stack){
      stack=document.createElement("div");
      stack.className="toastStack";
      stack.setAttribute("aria-live","polite");
      document.body.append(stack);
    }

    const item=document.createElement("div");
    item.className=`appToast ${options.type==="cart"?"toastCart":""}`;
    item.innerHTML=`
      <div class="toastIcon" aria-hidden="true">${options.icon||"✦"}</div>
      <div class="toastCopy">
        <strong>${options.title||"Seeker Of SoundZ"}</strong>
        <span>${message}</span>
      </div>
      ${options.cancel||options.dismissible?`<button class="toastCancel" type="button" aria-label="${options.cancel||'Dismiss'}">${options.cancel||'×'}</button>`:""}
      ${options.action?`<button class="toastAction" type="button">${options.action}</button>`:""}
      <div class="toastProgress"></div>
    `;
    stack.prepend(item);

    item.querySelector(".toastAction")?.addEventListener("click",()=>{
      options.onAction?.();
      dismiss();
    });
    item.querySelector(".toastCancel")?.addEventListener("click",()=>{
      options.onCancel?.();
      dismiss();
    });

    let timer=setTimeout(dismiss,3200);
    item.addEventListener("mouseenter",()=>clearTimeout(timer));
    item.addEventListener("mouseleave",()=>timer=setTimeout(dismiss,1300));

    function dismiss(){
      if(!item.isConnected||item.classList.contains("toastLeaving"))return;
      item.classList.add("toastLeaving");
      setTimeout(()=>item.remove(),380);
    }
  }

  window.SOS={
    K,read,write,toast,
    getSession:()=>read(K.session,null),
    setSession(value){
      write(K.session,value);
      window.dispatchEvent(new CustomEvent("sos:session",{detail:value||null}));
      window.SOSExperience?.applyForSession?.(value||null);
      return value;
    },
    getCart:()=>read(K.cart,[]),
    saveCart(value){write(K.cart,value);renderCart()},
    addCart(item){
      const cart=this.getCart();
      const variantKey=[item.id,item.size||"",item.color||"",item.format||""].join("|");
      const existing=cart.find(entry=>entry.variantKey===variantKey);
      existing?existing.qty+=(item.qty||1):cart.push({...item,variantKey,qty:item.qty||1});
      this.saveCart(cart);
      const details=[item.size&&`Size: ${item.size}`,item.color&&`Color: ${item.color}`,item.format&&`Format: ${item.format}`,`Quantity: ${item.qty||1}`].filter(Boolean).join(" • ");
      toast(`${item.name}${details?` — ${details}`:""}`,{
        type:"cart",
        title:"Added to your cart",
        action:"View Cart",
        onAction:()=>document.getElementById("cartDrawer")?.classList.add("open")
      });
    },
    logout(){
      const previous=read(K.session,null);
      window.dispatchEvent(new CustomEvent("sos:before-logout",{detail:previous}));
      localStorage.removeItem(K.session);
      window.SOSExperience?.applyDefault?.();
      window.dispatchEvent(new CustomEvent("sos:session",{detail:null}));
      toast("Signed out — the default site experience has been restored.",{title:"Signed out"});
      setTimeout(()=>location.href="members.html",650);
    }
  };

  if(!document.getElementById("cartDrawer")&&!document.getElementById("accountDrawer")){
    const shell=document.createElement("div");
    shell.innerHTML=`
      <aside class="cartDrawer" id="cartDrawer">
        <div class="drawerHeader"><h2>Your Cart</h2><button class="drawerClose" data-close="cart">×</button></div>
        <div id="cartItems"></div>
        <div class="cartTotal"><span>Total</span><span id="cartTotal">$0.00</span></div>
        <button class="primaryButton" id="checkoutButton">Checkout Preview</button>
      </aside>
      <aside class="accountDrawer" id="accountDrawer">
        <div class="drawerHeader"><h2>Account</h2><button class="drawerClose" data-close="account">×</button></div>
        <div id="accountContent"></div>
      </aside>
      `;
    document.body.append(...shell.children);
  }

  function decoratePageLogos(){
    document.querySelectorAll('img[src*="sos-logo.png"]:not(.loaderLogoImage):not(.transitionLogo):not(.avatar)').forEach(img=>{
      if(img.closest(".logoCubeFrame"))return;
      const frame=document.createElement("span");
      frame.className="logoCubeFrame";
      const halo=document.createElement("span");
      halo.className="logoCubeHalo";
      halo.setAttribute("aria-hidden","true");
      halo.innerHTML="<i></i><i></i><i></i><i></i>";
      img.parentNode.insertBefore(frame,img);
      frame.append(img,halo);
    });
  }

  function renderCart(){
    const cart=SOS.getCart();
    const host=document.getElementById("cartItems");
    const badge=document.getElementById("cartCount");
    if(badge)badge.textContent=cart.reduce((sum,item)=>sum+item.qty,0);
    if(!host)return;
    if(!cart.length){
      host.innerHTML='<div class="emptyState">Your cart is empty.</div>';
      document.getElementById("cartTotal").textContent="$0.00";
      return;
    }
    host.innerHTML=cart.map(item=>`<article class="cartItem"><div class="cartThumb">SOS</div><div><h4>${item.name}</h4><small>$${Number(item.price).toFixed(2)}${item.size?` • Size ${item.size}`:""}${item.color?` • ${item.color}`:""}${item.format?` • ${item.format}`:""}</small><div class="qtyRow"><button data-cart="minus" data-id="${item.id}">−</button><span>${item.qty}</span><button data-cart="plus" data-id="${item.id}">+</button></div></div><button class="smallAction" data-cart="remove" data-id="${item.id}">×</button></article>`).join("");
    document.getElementById("cartTotal").textContent="$"+cart.reduce((sum,item)=>sum+item.price*item.qty,0).toFixed(2);
  }

  function presenceMode(session){
    if(!session?.supabase)return "guest";
    if(session.presenceVisibility==="hidden")return "hidden";
    if(session.presenceVisibility==="offline")return "offline";
    return "online";
  }

  function updateAccountControl(session=SOS.getSession()){
    const button=document.getElementById("accountButton");
    const image=document.getElementById("accountNavAvatar");
    if(!button||!image)return;
    const mode=presenceMode(session);
    button.classList.remove("presence-online","presence-offline","presence-hidden","presence-guest");
    button.classList.add(`presence-${mode}`);
    image.src=session?.avatar||"assets/images/sos-logo.png";
    image.alt=session?.displayName?`${session.displayName} profile`:"Account profile";
    button.title=session?.supabase
      ? `${session.displayName||session.username||"Member"} — ${mode==="online"?"Online":mode==="offline"?"Appearing offline":mode==="hidden"?"Presence hidden":"Member"}`
      : "Login or register";
  }

  function renderAccount(){
    const session=SOS.getSession();
    const host=document.getElementById("accountContent");
    updateAccountControl(session);
    if(!host)return;
    if(session){
      const mode=presenceMode(session);
      const stateLabel=mode==="online"?"Online":mode==="offline"?"Appearing offline":mode==="hidden"?"Presence hidden":"Signed out";
      const statusText=mode==="online"?(session.activityStatus||"Exploring the frequency"):mode==="offline"?"Other members see you as offline.":mode==="hidden"?"Your activity and last-seen time are concealed.":"";
      host.innerHTML=`<div class="profilePreview accountProfilePreview presence-${mode}"><span class="accountDrawerAvatar"><img class="avatar" src="${session.avatar||'assets/images/sos-logo.png'}"><i></i></span><div><strong>${session.displayName||session.email}</strong><p>${session.role||'member'}</p><small>${stateLabel}${statusText?` — ${statusText}`:""}</small></div></div><a class="primaryButton" href="members.html">Profile</a>${(session.role==="admin"||session.collaborationAccess)?'<a class="secondaryButton profileAccessLink" href="collaboration.html">Collaboration Studio</a>':''}${session.role==="admin"?'<a class="secondaryButton profileAccessLink" href="admin.html">Admin Hub</a>':''}<button class="secondaryButton" id="quickLogout" style="margin-top:10px">Sign Out</button>`;
    }else{
      host.innerHTML=`<div class="accountGuestCard"><img src="assets/images/sos-logo.png" alt="Seeker Of SoundZ"><div><strong>Member Access</strong><p>Sign in to manage your profile and community presence.</p></div></div><a class="primaryButton" href="members.html">Login or Register</a>`;
    }
    document.getElementById("quickLogout")?.addEventListener("click",()=>SOS.logout());
  }

  function activeAnnouncements(){
    return read(K.announcements,[]).filter(a=>a.active!==false&&(!a.expires||new Date(a.expires+"T23:59:59")>new Date()));
  }


  function showMemberNotifications(){
    const session=SOS.getSession();
    if(!session)return;
    const all=read(K.notifications,[]);
    const mine=all.filter(n=>n.userId===session.id&&!n.seen);
    mine.slice(0,4).forEach((n,index)=>setTimeout(()=>toast(n.message,{title:n.title||"Member update",icon:n.icon||"✦",action:n.link?"Open":null,onAction:()=>n.link&&(location.href=n.link)}),700+index*650));
    if(mine.length){mine.forEach(n=>n.seen=true);write(K.notifications,all)}
  }

  function showAnnouncements(){
    // v4.9.1: Site broadcasts now live in the compact Frequency Updates center.
    // Member and cart notifications continue to use temporary toasts.
    return;
  }

  function setupHomepageAnnouncementRail(){
    const hero=document.getElementById("hero");
    if(!hero)return;
    const rail=document.createElement("section");
    rail.className="homeAnnouncementRail";
    rail.setAttribute("aria-live","polite");
    rail.innerHTML=`<div class="homeAnnouncementInner"><div class="homeAnnouncementIcon">📢</div><div class="homeAnnouncementCopy"><span>Latest announcement</span><strong>No active announcements</strong><p>Admins can publish announcements from Admin → Announcements.</p></div><a class="homeAnnouncementAction" hidden>Learn more</a><div class="homeAnnouncementDots"></div><div class="homeAnnouncementTimer"><i></i></div></div>`;
    hero.insertAdjacentElement("afterend",rail);
    let index=0,timer;
    const render=()=>{
      const items=activeAnnouncements().filter(a=>a.placement!=="toast");
      if(!items.length){rail.classList.add("isEmpty");return}
      rail.classList.remove("isEmpty");
      index=index%items.length;
      const a=items[index];
      rail.classList.remove("announcementEnter"); void rail.offsetWidth; rail.classList.add("announcementEnter");
      rail.querySelector(".homeAnnouncementIcon").textContent=a.icon||"📢";
      rail.querySelector("strong").textContent=a.title||"Site announcement";
      rail.querySelector("p").textContent=a.message||"";
      const action=rail.querySelector(".homeAnnouncementAction");
      if(a.link){action.hidden=false;action.href=a.link;action.textContent=a.buttonText||"Learn more"}else action.hidden=true;
      rail.querySelector(".homeAnnouncementDots").innerHTML=items.map((_,i)=>`<button type="button" aria-label="Show announcement ${i+1}" class="${i===index?"active":""}" data-ann-index="${i}"></button>`).join("");
      const seconds=Math.max(5,Number(a.cycleSeconds||20));
      const bar=rail.querySelector(".homeAnnouncementTimer i");
      bar.style.animation="none"; void bar.offsetWidth; bar.style.animation=`announcementCountdown ${seconds}s linear forwards`;
      let label=rail.querySelector(".announcementTimerLabel");
      if(!label){label=document.createElement("small");label.className="announcementTimerLabel";rail.querySelector(".homeAnnouncementCopy").append(label)}
      label.textContent=`Next announcement in ${seconds} seconds`;
    };
    const restart=()=>{clearTimeout(timer);const items=activeAnnouncements().filter(a=>a.placement!=="toast");const current=items[index%Math.max(items.length,1)];const seconds=Math.max(5,Number(current?.cycleSeconds||20));timer=setTimeout(()=>{const fresh=activeAnnouncements().filter(a=>a.placement!=="toast");if(fresh.length>1){index=(index+1)%fresh.length;render();restart()}},seconds*1000)};
    rail.addEventListener("click",e=>{const b=e.target.closest("[data-ann-index]");if(!b)return;index=Number(b.dataset.annIndex)||0;render();restart()});
    render();restart();
    window.addEventListener("storage",e=>{if(e.key===K.announcements){index=0;render();restart()}});
  }

  renderCart();
  renderAccount();
  decoratePageLogos();
  showAnnouncements();
  showMemberNotifications();
  setupHomepageAnnouncementRail();

  document.addEventListener("click",event=>{
    if(event.target.closest("#cartButton"))document.getElementById("cartDrawer").classList.toggle("open");
    if(event.target.closest("#accountButton")){
      renderAccount();
      document.getElementById("accountDrawer").classList.toggle("open");
    }
    if(event.target.dataset.close)document.getElementById(event.target.dataset.close+"Drawer").classList.remove("open");

    const button=event.target.closest("[data-cart]");
    if(button){
      let cart=SOS.getCart();
      const item=cart.find(entry=>entry.id===button.dataset.id);
      if(!item)return;
      if(button.dataset.cart==="plus")item.qty++;
      if(button.dataset.cart==="minus")item.qty--;
      if(button.dataset.cart==="remove"||item.qty<=0)cart=cart.filter(entry=>entry.id!==button.dataset.id);
      SOS.saveCart(cart);
    }
  });

  window.addEventListener("sos:session",event=>{updateAccountControl(event.detail);renderAccount()});
  window.addEventListener("sos:supabase-session",event=>{updateAccountControl(event.detail);renderAccount()});

  document.getElementById("checkoutButton")?.addEventListener("click",()=>toast("Connect Stripe or PayPal to activate secure checkout.",{title:"Checkout preview"}));
  // v4.13.5: all internal navigation is owned exclusively by SOSTransitions.
  // No legacy page-transition listener is registered here.

})();
