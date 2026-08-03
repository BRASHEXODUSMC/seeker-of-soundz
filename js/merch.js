(()=>{
"use strict";
const defaults=[
{id:"signature-tee",name:"Signature Frequency Tee",price:29,type:"Apparel",category:"T-Shirts",description:"Official Seeker Of SoundZ signature tee.",image:"",link:"",sizes:["S","M","L","XL","2XL"],colors:["Black","White","Charcoal"],stock:24},
{id:"midnight-hoodie",name:"Midnight Seeker Hoodie",price:59,type:"Apparel",category:"Hoodies",description:"A heavyweight hoodie for late-night sessions.",image:"",link:"",sizes:["S","M","L","XL","2XL","3XL"],colors:["Black","Charcoal","White"],stock:18},
{id:"sos-cap",name:"SOS Logo Cap",price:24,type:"Accessory",category:"Headwear",description:"Minimal logo cap built for everyday wear.",image:"",link:"",sizes:["One Size"],colors:["Black","White"],stock:14},
{id:"sound-pack-1",name:"Seeker Sound Pack Vol. 1",price:19,type:"Digital",category:"Sound Packs",description:"Production-ready sounds and creative assets.",image:"",link:"",sizes:[],colors:[],stock:999},

{id:"creator-assets",name:"DJ & Production Assets",price:35,type:"Digital",category:"Creator Assets",description:"Useful tools for DJs and producers.",image:"",link:"",sizes:[],colors:[],stock:999}
];
const custom=SOS.read(SOS.K.catalog,[]).filter(x=>String(x.type||"").toLowerCase()!=="music"),products=[...custom.filter(x=>x.featured),...defaults,...custom.filter(x=>!x.featured)];
const esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const arr=v=>Array.isArray(v)?v:String(v||"").split(",").map(x=>x.trim()).filter(Boolean);
const grid=document.getElementById("productGrid");
const modal=document.createElement("div");modal.className="quickViewModal";modal.id="quickViewModal";modal.innerHTML='<div class="quickViewBackdrop" data-close-quick></div><section class="quickViewPanel" role="dialog" aria-modal="true" aria-labelledby="quickViewTitle"><button class="quickViewClose animatedX" type="button" data-close-quick aria-label="Close quick view"><span></span><span></span></button><div id="quickViewContent"></div></section>';document.body.append(modal);
function statusBadges(p){const badges=[];if(p.featured)badges.push('<span class="productStatusBadge">Featured</span>');if(p.limited)badges.push('<span class="productStatusBadge isLimited">Limited</span>');if(p.seasonal)badges.push('<span class="productStatusBadge isSeasonal">Seasonal</span>');if(p.newRelease)badges.push('<span class="productStatusBadge">New Release</span>');if(p.preorder)badges.push('<span class="productStatusBadge">Pre-order</span>');if(p.membersOnly)badges.push('<span class="productStatusBadge isMembers">Members Only</span>');return badges.length?`<div class="productStatusBadges">${badges.join("")}</div>`:""}
function card(p){return `<article class="productCard">${p.featured?'<span class="productFeatured">Featured</span>':''}<div class="productVisual">${p.image?`<img src="${esc(p.image)}" alt="${esc(p.name)}">`:'<span>SOS</span>'}</div><p class="sectionEyebrow">${esc(p.category||p.type)}</p>${statusBadges(p)}<h3>${esc(p.name)}</h3><p class="productDescription">${esc(p.description||"")}</p><div class="productMeta"><span>${esc(p.type)}</span><strong>$${Number(p.price).toFixed(2)}</strong></div><div class="productActions"><button class="secondaryButton" data-quick-view="${p.id}">Quick View</button><button class="primaryButton" data-fast-add="${p.id}">${esc(p.buttonLabel||"Add to Cart")}</button></div></article>`}
grid.innerHTML=products.map(card).join("");
function colorSwatch(name){
  const value=String(name||"").toLowerCase();
  const swatches={black:"#08080b",white:"#f7f4ff",charcoal:"#3b3940",purple:"#6f2ca2",violet:"#8e55d7",red:"#b92d4b",blue:"#285aa8",navy:"#151f48",green:"#2f7b58",grey:"#77747e",gray:"#77747e"};
  return swatches[value]||"linear-gradient(135deg,#f4e7ff,#6f2ca2)";
}
function openQuick(p){const sizes=arr(p.sizes),colors=arr(p.colors);document.getElementById("quickViewContent").innerHTML=`<div class="quickViewGrid"><div class="quickViewImage zoomableProductImage">${p.image?`<img src="${esc(p.image)}" alt="${esc(p.name)}">`:'<span>SOS</span>'}<span class="zoomHint">Move cursor to zoom</span></div><div class="quickViewDetails"><p class="sectionEyebrow">${esc(p.category||p.type)}</p>${statusBadges(p)}<h2 id="quickViewTitle">${esc(p.name)}</h2><p>${esc(p.description||"")}</p><strong class="quickPrice">$${Number(p.price).toFixed(2)}</strong>${sizes.length?`<fieldset><legend>Size</legend><div class="optionPills">${sizes.map((s,i)=>`<label data-merch-option="size"><input type="radio" name="quickSize" value="${esc(s)}" ${i===0?'checked':''}><span>${esc(s)}</span></label>`).join("")}</div></fieldset>`:""}${colors.length?`<fieldset><legend>Color</legend><div class="optionPills colorPills">${colors.map((c,i)=>`<label data-merch-option="color"><input type="radio" name="quickColor" value="${esc(c)}" ${i===0?'checked':''}><span style="--swatch:${colorSwatch(c)}">${esc(c)}</span></label>`).join("")}</div></fieldset>`:""}<label class="quantityField">Quantity<input id="quickQty" type="number" min="1" max="20" value="1"></label><p class="stockLine">${Number(p.stock||0)>0?`${Number(p.stock)} available`:'Made to order / digital delivery'}</p><div class="quickViewActions"><button class="primaryButton" data-confirm-add="${p.id}">Add Selected Item</button>${p.link?`<a class="secondaryButton" href="${esc(p.link)}" target="_blank" rel="noopener">Open Product Link</a>`:""}</div></div></div>`;modal.classList.add("open");document.body.classList.add("modalOpen")}
function add(p,options={}){const qty=Math.max(1,Number(options.qty)||1);const optionText=[options.size,options.color].filter(Boolean).join(" / ");for(let i=0;i<qty;i++)SOS.addCart({id:p.id+(optionText?"-"+optionText:""),productId:p.id,name:p.name+(optionText?` (${optionText})`:""),price:Number(p.price),image:p.image||"",link:p.link||"",size:options.size||"",color:options.color||""})}
function close(){document.body.classList.remove("cursorMerchOptionHover","cursorMerchCloseHover");modal.classList.add("closing");setTimeout(()=>{modal.classList.remove("open","closing");document.body.classList.remove("modalOpen")},320)}
document.addEventListener("click",e=>{const q=e.target.closest("[data-quick-view]"),f=e.target.closest("[data-fast-add]"),c=e.target.closest("[data-confirm-add]");if(q){openQuick(products.find(x=>x.id===q.dataset.quickView));return}if(f){const p=products.find(x=>x.id===f.dataset.fastAdd);const sizes=arr(p.sizes),colors=arr(p.colors);if(sizes.length||colors.length)openQuick(p);else add(p);return}if(c){const p=products.find(x=>x.id===c.dataset.confirmAdd);add(p,{size:document.querySelector('input[name="quickSize"]:checked')?.value,color:document.querySelector('input[name="quickColor"]:checked')?.value,qty:document.getElementById("quickQty")?.value});close();return}if(e.target.closest("[data-close-quick]"))close()});

modal.addEventListener("change",e=>{
  const option=e.target.closest('input[type="radio"][name^="quick"]');
  if(!option)return;
  const visual=option.nextElementSibling;
  visual?.classList.remove("merchOptionFlash");
  void visual?.offsetWidth;
  visual?.classList.add("merchOptionFlash");
  if(navigator.vibrate)navigator.vibrate(12);
});
modal.addEventListener("pointerover",e=>{
  const option=e.target.closest("[data-merch-option]");
  const closeButton=e.target.closest("[data-close-quick]");
  document.body.classList.toggle("cursorMerchOptionHover",Boolean(option));
  document.body.classList.toggle("cursorMerchCloseHover",Boolean(closeButton));
});
modal.addEventListener("pointerout",e=>{
  const next=e.relatedTarget instanceof Element?e.relatedTarget:null;
  if(!next?.closest("[data-merch-option]"))document.body.classList.remove("cursorMerchOptionHover");
  if(!next?.closest("[data-close-quick]"))document.body.classList.remove("cursorMerchCloseHover");
});
modal.addEventListener("mousemove",e=>{const box=e.target.closest(".zoomableProductImage");if(!box)return;const img=box.querySelector("img");if(!img)return;const r=box.getBoundingClientRect(),x=((e.clientX-r.left)/r.width)*100,y=((e.clientY-r.top)/r.height)*100;img.style.transformOrigin=`${x}% ${y}%`;img.classList.add("isZoomed")});
modal.addEventListener("mouseleave",()=>{const img=modal.querySelector(".zoomableProductImage img");if(img){img.classList.remove("isZoomed");img.style.transformOrigin="center"}},true);
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&modal.classList.contains("open"))close()});
})();