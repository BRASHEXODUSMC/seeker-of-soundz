(()=>{
  "use strict";
  const formatBytes=n=>{if(!Number.isFinite(n))return "0 B";const u=["B","KB","MB"];let i=0;while(n>=1024&&i<u.length-1){n/=1024;i++}return `${n.toFixed(i?1:0)} ${u[i]}`};
  async function compress(file,opts={}){
    if(!file||!file.type?.startsWith("image/"))throw new Error("Choose a valid image file.");
    const maxWidth=opts.maxWidth||1400,maxHeight=opts.maxHeight||1400,quality=opts.quality??.78,maxBytes=opts.maxBytes||900*1024;
    if(file.type==="image/gif"){
      if(file.size>maxBytes)throw new Error("Animated GIFs cannot be resized here. Use a GIF smaller than "+formatBytes(maxBytes)+".");
      return {dataUrl:await readFile(file),originalBytes:file.size,outputBytes:file.size,width:0,height:0,originalWidth:0,originalHeight:0,type:file.type,compressed:false};
    }
    const source=await readFile(file),img=await loadImage(source);
    const ratio=Math.min(1,maxWidth/img.naturalWidth,maxHeight/img.naturalHeight);
    const width=Math.max(1,Math.round(img.naturalWidth*ratio)),height=Math.max(1,Math.round(img.naturalHeight*ratio));
    const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext("2d",{alpha:true});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";ctx.drawImage(img,0,0,width,height);
    let type=file.type==="image/png"?"image/webp":(file.type==="image/webp"?"image/webp":"image/jpeg");
    let q=quality,blob=await toBlob(canvas,type,q);
    while(blob.size>maxBytes&&q>.48){q-=.08;blob=await toBlob(canvas,type,q)}
    const dataUrl=await readFile(blob);
    return {dataUrl,originalBytes:file.size,outputBytes:blob.size,width,height,originalWidth:img.naturalWidth,originalHeight:img.naturalHeight,type,compressed:blob.size<file.size||ratio<1};
  }
  const readFile=file=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(new Error("The image could not be read."));r.readAsDataURL(file)});
  const loadImage=src=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error("The image could not be opened."));i.src=src});
  const toBlob=(canvas,type,q)=>new Promise((res,rej)=>canvas.toBlob(b=>b?res(b):rej(new Error("The image could not be compressed.")),type,q));
  function status(result){return `${result.originalWidth||"?"}×${result.originalHeight||"?"} • ${formatBytes(result.originalBytes)} → ${result.width||"?"}×${result.height||"?"} • ${formatBytes(result.outputBytes)}`}
  window.SOSImages={compress,formatBytes,status};
})();