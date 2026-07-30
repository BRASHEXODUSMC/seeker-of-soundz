/* Seeker Of SoundZ v4.8.3 — fresh, independent visible star particle system */
(() => {
  'use strict';

  document.querySelectorAll('#snowCanvas,#sosStarfield,#sosParticleStars').forEach(el => el.remove());

  const canvas = document.createElement('canvas');
  canvas.id = 'sosParticleStars';
  canvas.setAttribute('aria-hidden','true');
  document.body.insertBefore(canvas, document.body.firstChild);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const mobile = matchMedia('(max-width:760px)').matches;
  const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const collab = document.body.classList.contains('collaborationPage');
  let width=1,height=1,dpr=1,last=0,raf=0,nextMeteor=0;
  let stars=[],meteors=[];
  const mouse={x:-9999,y:-9999,nx:0,ny:0,sx:0,sy:0,active:false};
  let scrollTarget=scrollY||0,scrollEase=scrollTarget;

  function makeStar(i,total){
    const featured=i<Math.max(12,Math.round(total*.12));
    const near=i<Math.round(total*.45);
    return {
      x:Math.random()*width,
      y:Math.random()*height,
      r:featured?.95+Math.random()*1.15:near?.55+Math.random()*.65:.3+Math.random()*.38,
      a:featured?.72+Math.random()*.25:near?.48+Math.random()*.32:.3+Math.random()*.28,
      depth:featured?.75+Math.random()*.25:near?.4+Math.random()*.35:.12+Math.random()*.25,
      phase:Math.random()*Math.PI*2,
      speed:.00045+Math.random()*.0011,
      twinkle:featured||Math.random()<.42,
      drift:(Math.random()-.5)*.0025,
      tint:Math.random()
    };
  }

  function rebuild(){
    const perf=document.documentElement.classList.contains('performance-mode');
    let count=mobile?115:190;
    if(collab) count=Math.round(count*.72);
    if(perf) count=Math.round(count*.7);
    stars=Array.from({length:count},(_,i)=>makeStar(i,count));
  }

  function resize(){
    width=Math.max(1,innerWidth); height=Math.max(1,innerHeight);
    dpr=Math.min(devicePixelRatio||1,mobile?1:1.3);
    canvas.width=Math.round(width*dpr); canvas.height=Math.round(height*dpr);
    canvas.style.width=width+'px'; canvas.style.height=height+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    rebuild();
    nextMeteor=performance.now()+5000+Math.random()*7000;
  }

  function color(t,a){
    if(t<.12)return `rgba(226,210,255,${a})`;
    if(t>.88)return `rgba(205,229,255,${a})`;
    return `rgba(255,255,255,${a})`;
  }

  function drawStar(s,now){
    s.x+=s.drift;
    if(s.x<-4)s.x=width+4; else if(s.x>width+4)s.x=-4;
    const tw=s.twinkle?.7+.3*Math.sin(now*s.speed+s.phase):1;
    const x=s.x+mouse.sx*s.depth*7;
    const shifted=s.y+mouse.sy*s.depth*4-scrollEase*s.depth*.01;
    const y=((shifted%height)+height)%height;
    const dist=mouse.active?Math.hypot(x-mouse.x,y-mouse.y):9999;
    const react=Math.max(0,1-dist/155);
    const alpha=Math.min(1,s.a*tw+react*.3);
    const radius=s.r+react*.42;

    ctx.shadowBlur=radius>.85?5+react*8:0;
    ctx.shadowColor=s.tint>.88?'rgba(185,220,255,.72)':'rgba(221,198,255,.72)';
    ctx.fillStyle=color(s.tint,alpha);
    ctx.beginPath(); ctx.arc(x,y,radius,0,Math.PI*2); ctx.fill();

    if(radius>1.45&&alpha>.7){
      ctx.shadowBlur=0; ctx.strokeStyle=color(s.tint,alpha*.38); ctx.lineWidth=.55;
      ctx.beginPath();
      ctx.moveTo(x-radius*2.3,y);ctx.lineTo(x+radius*2.3,y);
      ctx.moveTo(x,y-radius*2.3);ctx.lineTo(x,y+radius*2.3);
      ctx.stroke();
    }
  }

  function spawnMeteor(now){
    if(reduced||meteors.length>1){nextMeteor=now+9000+Math.random()*10000;return;}
    const right=Math.random()>.5, len=70+Math.random()*75, speed=5+Math.random()*2;
    meteors.push({x:right?-len:width+len,y:height*(.08+Math.random()*.45),vx:right?speed:-speed,vy:.65+Math.random()*.8,len,life:0,max:72+Math.random()*25});
    nextMeteor=now+9000+Math.random()*12000;
  }

  function drawMeteor(m){
    m.x+=m.vx;m.y+=m.vy;m.life++;
    const fade=Math.sin(Math.min(1,m.life/m.max)*Math.PI);
    const tx=m.x-Math.sign(m.vx)*m.len,ty=m.y-m.len*.14;
    const g=ctx.createLinearGradient(tx,ty,m.x,m.y);
    g.addColorStop(0,'rgba(255,255,255,0)');
    g.addColorStop(.72,`rgba(214,199,255,${.24*fade})`);
    g.addColorStop(1,`rgba(255,255,255,${.92*fade})`);
    ctx.shadowBlur=5;ctx.shadowColor='rgba(220,205,255,.55)';ctx.strokeStyle=g;ctx.lineWidth=1.15;
    ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(m.x,m.y);ctx.stroke();
    return m.life>m.max||m.x>width+m.len*2||m.x<-m.len*2;
  }

  function frame(now){
    raf=requestAnimationFrame(frame);
    if(document.hidden||document.documentElement.classList.contains('sos-animations-paused'))return;
    const perf=document.documentElement.classList.contains('performance-mode');
    const delay=mobile||collab||perf?33:22;
    if(now-last<delay)return; last=now;
    mouse.sx+=(mouse.nx-mouse.sx)*.05; mouse.sy+=(mouse.ny-mouse.sy)*.05;
    scrollEase+=(scrollTarget-scrollEase)*.035;
    ctx.clearRect(0,0,width,height);
    stars.forEach(s=>drawStar(s,now)); ctx.shadowBlur=0;
    if(now>=nextMeteor)spawnMeteor(now);
    for(let i=meteors.length-1;i>=0;i--)if(drawMeteor(meteors[i]))meteors.splice(i,1);
  }

  addEventListener('pointermove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;mouse.nx=(e.clientX/width-.5)*2;mouse.ny=(e.clientY/height-.5)*2;mouse.active=true;},{passive:true});
  addEventListener('pointerleave',()=>mouse.active=false,{passive:true});
  addEventListener('scroll',()=>scrollTarget=scrollY||0,{passive:true});
  addEventListener('resize',resize,{passive:true});
  addEventListener('pagehide',()=>cancelAnimationFrame(raf),{once:true});

  resize();
  /* Draw immediately before the first animation frame, so stars are visible even if animation is paused. */
  ctx.clearRect(0,0,width,height); stars.forEach(s=>drawStar(s,performance.now()));
  raf=requestAnimationFrame(frame);
})();
