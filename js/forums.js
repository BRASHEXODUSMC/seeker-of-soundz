(()=>{
"use strict";
const cats=["All","General Discussion","EDM Community","Music Production","DJ Tips","Events","Help & FAQ","Feedback","Off Topic"];
const SUBCATEGORIES={"General Discussion":["Introductions","Community News","General Chat"],"EDM Community":["House","Techno","Dubstep & Bass","Trance","Drum & Bass","Future Bass","EDM Releases","Festival Talk"],"Music Production":["DAWs & Software","Mixing","Mastering","Sound Design","Works in Progress","Collaboration"],"DJ Tips":["Beginner DJ Help","Controllers & Gear","Rekordbox","Serato","Live Sets","Transitions & Mixing"],"Events":["Upcoming Events","Past Events","Livestreams","Meetups"],"Help & FAQ":["Site FAQ","Account Help","Forum Help","Music Purchases","Member Vault","Technical Support"],"Feedback":["Track Feedback","Website Feedback","Merch Feedback","Suggestions"],"Off Topic":["Gaming","Random","Creative Projects"]};
const TAG_MAP={
 "General Discussion":["community","introduction","question","news"],
 "EDM Community":["edm","house","techno","dubstep","trance","drum-and-bass","future-bass","festival"],
 "Music Production":["production","ableton","fl-studio","mixing","mastering","sound-design","feedback"],
 "DJ Tips":["dj-tips","mixing","rekordbox","serato","controllers","live-set"],
 "Events":["events","live-show","tickets","meetup","announcement"],
 "Help & FAQ":["faq","help","support","account","members-vault"],
 "Feedback":["feedback","showcase","work-in-progress","mix-review"],
 "Off Topic":["off-topic","community","gaming","random"]
};
const KEYWORDS={ableton:"ableton",fl:"fl-studio",mix:"mixing",master:"mastering",remix:"remix",house:"house",techno:"techno",dubstep:"dubstep",bass:"bass-music",event:"events",show:"live-show",ticket:"tickets",feedback:"feedback",collab:"collaboration",youtube:"youtube",soundcloud:"soundcloud",spotify:"spotify",bug:"bug",help:"support",question:"question"};
let active="All",activeTag="",query="",sort="newest",imageData="",selectedTags=new Set(),replyingTo="";

let pendingDeletePostId = "";
let pendingDeleteReply = null;

function ensureForumDeleteModal(){
  let modal=document.getElementById("forumDeleteModal");
  if(modal)return modal;
  modal=document.createElement("div");
  modal.id="forumDeleteModal";
  modal.className="forumDeleteModal";
  modal.hidden=true;
  modal.innerHTML=`
    <div class="forumDeleteBackdrop" data-close-forum-delete></div>
    <section class="forumDeleteDialog" role="dialog" aria-modal="true" aria-labelledby="forumDeleteTitle">
      <button class="forumDeleteClose" type="button" data-close-forum-delete aria-label="Close delete dialog">×</button>
      <div class="forumDeleteIcon" aria-hidden="true">!</div>
      <p class="sectionEyebrow">Forum moderation</p>
      <h2 id="forumDeleteTitle">Remove this discussion?</h2>
      <p id="forumDeleteMessage">This permanently removes the post and every reply attached to it from this browser.</p>
      <div class="forumDeletePreview" id="forumDeletePreview"></div>
      <div class="forumDeleteActions">
        <button class="smallAction" type="button" data-close-forum-delete id="keepForumItem">Keep Post</button>
        <button class="primaryButton forumDeleteConfirm" type="button" id="confirmForumDelete">
          <span id="forumDeleteConfirmLabel">Delete Discussion</span><b>×</b>
        </button>
      </div>
    </section>`;
  document.body.appendChild(modal);
  modal.addEventListener("click",event=>{
    if(event.target.closest("[data-close-forum-delete]")) closeForumDeleteModal();
  });
  document.getElementById("confirmForumDelete").addEventListener("click",()=>{
    if(pendingDeleteReply){
      const post=posts.find(item=>item.id===pendingDeleteReply.postId);
      if(!post)return;
      const reply=(post.replies||[]).find((item,index)=>(item.id||String(index))===pendingDeleteReply.replyId);
      post.replies=(post.replies||[]).filter((item,index)=>(item.id||String(index))!==pendingDeleteReply.replyId);
      post.updatedAt=new Date().toISOString();
      save();
      closeForumDeleteModal();
      draw();
      SOS.toast(reply?"The reply was removed.":"Reply removed.",{title:"Reply deleted"});
      return;
    }
    if(!pendingDeletePostId)return;
    const post=posts.find(item=>item.id===pendingDeletePostId);
    posts=posts.filter(item=>item.id!==pendingDeletePostId);
    save();
    closeForumDeleteModal();
    draw();
    SOS.toast(post?`“${post.title}” was removed.`:"Discussion removed.",{title:"Post deleted"});
  });
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&!modal.hidden)closeForumDeleteModal();
  });
  return modal;
}

function openForumDeleteModal(postId){
  const post=posts.find(item=>item.id===postId);
  if(!post)return;
  pendingDeletePostId=postId;
  const modal=ensureForumDeleteModal();
  const preview=modal.querySelector("#forumDeletePreview");
  pendingDeleteReply=null;
  modal.querySelector("#forumDeleteTitle").textContent="Remove this discussion?";
  modal.querySelector("#forumDeleteMessage").textContent="This permanently removes the post and every reply attached to it from this browser.";
  modal.querySelector("#keepForumItem").textContent="Keep Post";
  modal.querySelector("#forumDeleteConfirmLabel").textContent="Delete Discussion";
  preview.innerHTML=`<strong>${esc(post.title)}</strong><span>${esc(post.category)} • ${(post.replies||[]).length} repl${(post.replies||[]).length===1?"y":"ies"}</span>`;
  modal.hidden=false;
  document.body.classList.add("forumDeleteOpen");
  requestAnimationFrame(()=>modal.classList.add("open"));
  setTimeout(()=>modal.querySelector("[data-close-forum-delete]")?.focus(),80);
}

function openReplyDeleteModal(postId,replyId){
  const post=posts.find(item=>item.id===postId);
  const reply=(post?.replies||[]).find((item,index)=>(item.id||String(index))===replyId);
  if(!post||!reply)return;
  pendingDeletePostId="";
  pendingDeleteReply={postId,replyId};
  const modal=ensureForumDeleteModal();
  modal.querySelector("#forumDeleteTitle").textContent="Delete this reply?";
  modal.querySelector("#forumDeleteMessage").textContent="This removes only this reply. The original discussion and other replies will stay published.";
  modal.querySelector("#keepForumItem").textContent="Keep Reply";
  modal.querySelector("#forumDeleteConfirmLabel").textContent="Delete Reply";
  modal.querySelector("#forumDeletePreview").innerHTML=`<strong>${esc(reply.author)}</strong><span>${esc(reply.body).slice(0,180)}${reply.body.length>180?"…":""}</span>`;
  modal.hidden=false;
  document.body.classList.add("forumDeleteOpen");
  requestAnimationFrame(()=>modal.classList.add("open"));
  setTimeout(()=>modal.querySelector("[data-close-forum-delete]")?.focus(),80);
}

function closeForumDeleteModal(){
  const modal=document.getElementById("forumDeleteModal");
  if(!modal)return;
  modal.classList.remove("open");
  document.body.classList.remove("forumDeleteOpen");
  pendingDeletePostId="";
  pendingDeleteReply=null;
  setTimeout(()=>{modal.hidden=true},260);
}
let posts=SOS.read(SOS.K.posts,[{id:"welcome",category:"General Discussion",title:"Welcome to the Seeker Of SoundZ forums",body:"Introduce yourself, share what you create, and keep the community respectful.",author:"Seeker Of SoundZ",avatar:"assets/images/sos-logo.png",date:new Date().toISOString(),likes:0,replies:[],tags:["welcome","community"],image:"",mediaUrl:""}]);
// One reaction per signed-in member (or per browser for guests). Clicking again removes it.
function forumReactionIdentity(){
  const session=SOS.getSession();
  if(session?.displayName)return `member:${String(session.displayName).trim().toLowerCase()}`;
  const key="sos_forum_guest_reactor_v1";
  try{
    let id=localStorage.getItem(key);
    if(!id){id=`guest:${crypto.randomUUID()}`;localStorage.setItem(key,id)}
    return id;
  }catch(_){return "guest:current-browser"}
}
function normalizeForumReactions(){
  posts.forEach(post=>{
    if(!Array.isArray(post.likedBy))post.likedBy=[];
    post.likedBy=[...new Set(post.likedBy.map(String))];
    post.likes=post.likedBy.length || Math.max(0,Number(post.likes)||0);
  });
}
normalizeForumReactions();
const save=()=>SOS.write(SOS.K.posts,posts);
const esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const safeUrl=v=>{try{const u=new URL(v,location.href);return ["http:","https:"].includes(u.protocol)?u.href:""}catch{return ""}};
const cleanTag=v=>String(v||"").trim().toLowerCase().replace(/^#+/,"").replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"").replace(/-+/g,"-").slice(0,24);
const normalizeTags=v=>[...new Set(String(v||"").split(/[,#]/).map(cleanTag).filter(Boolean))].slice(0,8);
function allTags(){const count={};posts.forEach(p=>(p.tags||[]).forEach(t=>count[t]=(count[t]||0)+1));return Object.entries(count).sort((a,b)=>b[1]-a[1]).slice(0,18)}
function drawCats(){document.getElementById("forumCategories").innerHTML=cats.map(c=>`<button class="categoryButton ${c===active?"active":""}" data-category="${esc(c)}"><span>${esc(c)}</span><small>${c==="All"?posts.length:posts.filter(p=>p.category===c).length}</small></button>`).join("")}
function drawTags(){document.getElementById("forumTagCloud").innerHTML=allTags().map(([t,n])=>`<button class="forumTag ${t===activeTag?"active":""}" data-tag="${esc(t)}">#${esc(t)} <small>${n}</small></button>`).join("")||'<span class="postMeta">Tags appear after members publish posts.</span>';document.getElementById("activeTagRow").innerHTML=activeTag?`<span>Filtering by <strong>#${esc(activeTag)}</strong></span><button class="smallAction" data-clear-tag>Clear tag</button>`:""}
function filtered(){const session=SOS.getSession();let list=posts.filter(p=>(session?.role==="admin"||!p.hidden)&&(active==="All"||p.category===active)&&(!activeTag||(p.tags||[]).includes(activeTag)));if(query){const q=query.toLowerCase();list=list.filter(p=>[p.title,p.body,p.author,p.category,...(p.tags||[])].join(" ").toLowerCase().includes(q))}if(sort==="popular")list.sort((a,b)=>(b.likes||0)-(a.likes||0));else if(sort==="replied")list.sort((a,b)=>(b.replies||[]).length-(a.replies||[]).length);else if(sort==="oldest")list.sort((a,b)=>(Number(!!b.pinned)-Number(!!a.pinned))||(new Date(a.date)-new Date(b.date)));else if(sort==="updated")list.sort((a,b)=>(Number(!!b.pinned)-Number(!!a.pinned))||(new Date(b.updatedAt||b.date)-new Date(a.updatedAt||a.date)));else list.sort((a,b)=>(Number(!!b.pinned)-Number(!!a.pinned))||(new Date(b.date)-new Date(a.date)));return list}
function mediaBlock(p){const url=safeUrl(p.mediaUrl);return `${p.image?`<img class="postImage" src="${p.image}" alt="Uploaded forum image">`:""}${url?`<a class="postMediaLink" href="${esc(url)}" target="_blank" rel="noopener"><span>↗</span><div><strong>Open attached link</strong><small>${esc(new URL(url).hostname)}</small></div></a>`:""}`}
function replyComposer(id){
  if(replyingTo!==id)return "";
  return `
    <form class="inlineReplyComposer" data-reply-form="${id}">
      <div class="replyComposerHeader">
        <div>
          <span class="replyComposerIcon">↳</span>
          <div>
            <strong>Write a reply</strong>
            <small>Share feedback, ideas, or support with the community.</small>
          </div>
        </div>
        <button type="button" class="replyCloseButton" data-cancel-reply aria-label="Close reply editor">×</button>
      </div>
      <div class="replyEditorSurface">
        <textarea id="replyText-${id}" maxlength="1200" required placeholder="Type your reply here..."></textarea>
        <div class="replyEditorFooter">
          <div class="emojiToolbar compact" data-emoji-target="replyText-${id}">
            <span>Quick emojis</span>
            ${["😀","😂","🔥","🎵","🎧","🙌","❤️","👍","🚀","💯"].map(x=>`<button type="button" data-quick-emoji="${x}" aria-label="Add ${x}">${x}</button>`).join("")}
          </div>
          <span class="replyCharacterCount" data-reply-count>0 / 1200</span>
        </div>
      </div>
      <div class="inlineReplyActions">
        <button type="button" class="smallAction replyCancelButton" data-cancel-reply>Discard</button>
        <button class="primaryButton replySubmitButton" type="submit"><span>Post Reply</span><b>→</b></button>
      </div>
    </form>`
}
const REPLY_REACTIONS=[
 {key:"heart",emoji:"❤️",label:"Heart"},
 {key:"like",emoji:"👍",label:"Like"},
 {key:"fire",emoji:"🔥",label:"Fire"},
 {key:"headphones",emoji:"🎧",label:"Headphones"},
 {key:"applause",emoji:"👏",label:"Applause"},
 {key:"sparkles",emoji:"✨",label:"Sparkles"}
];
const LEGACY_REACTION_KEYS={heart:"❤️",like:"👍",fire:"🔥",headphones:"🎧",applause:"👏",sparkles:"✨"};
const REPLY_REACTION_STORE_KEY="sos_forum_reply_reactions_v3";
function readReplyReactionStore(){try{return JSON.parse(localStorage.getItem(REPLY_REACTION_STORE_KEY)||"{}")||{}}catch(_){return {}}}
function writeReplyReactionStore(store){localStorage.setItem(REPLY_REACTION_STORE_KEY,JSON.stringify(store))}
function reactionStorePath(postId,replyId,key){return `${String(postId)}::${String(replyId)}::${String(key)}`}
function storedReactionPeople(postId,replyId,key){const store=readReplyReactionStore();const people=store[reactionStorePath(postId,replyId,key)];return Array.isArray(people)?people.map(String):[]}

function reactionPeople(reply,key,postId=""){
 reply.reactions=reply.reactions&&typeof reply.reactions==="object"?reply.reactions:{};
 const modern=Array.isArray(reply.reactions[key])?reply.reactions[key]:[];
 const legacy=Array.isArray(reply.reactions[LEGACY_REACTION_KEYS[key]])?reply.reactions[LEGACY_REACTION_KEYS[key]]:[];
 const stored=storedReactionPeople(postId,reply.id||"",key);
 return [...new Set([...modern,...legacy,...stored].map(String))];
}
function replyReactionMarkup(post,reply,replyIndex){
 const session=SOS.getSession();
 const identity=session?forumReactionIdentity():"";reply.id=reply.id||String(replyIndex);
 return `<div class="replyReactionBar" data-post-id="${esc(post.id)}" data-reply-id="${esc(reply.id)}"><span class="replyReactionHint">React</span>${REPLY_REACTIONS.map(r=>{const people=reactionPeople(reply,r.key,post.id),active=!!identity&&people.includes(identity);return `<button type="button" class="replyReactionButton ${active?"is-reacted":""}" data-reply-reaction-key="${r.key}" aria-pressed="${active}" aria-label="${active?"Remove":"Add"} ${r.label} reaction" title="${r.label}"><span class="replyReactionEmoji" aria-hidden="true">${r.emoji}</span><span class="replyReactionCount">${people.length||""}</span></button>`}).join("")}</div>`;
}
function toggleReplyReaction(button){
 if(!button||button.dataset.reactionBusy==="1")return;
 const session=SOS.getSession();
 if(!session){
  SOS.toast("Please sign in to react to replies.",{title:"Members only"});
  return;
 }
 const bar=button.closest(".replyReactionBar"),key=button.dataset.replyReactionKey;
 if(!bar||!key)return;
 const postId=String(bar.dataset.postId||""),replyId=String(bar.dataset.replyId||"");
 const post=posts.find(item=>String(item.id)===postId);
 const reply=post?.replies?.find((item,index)=>String(item.id||index)===replyId);
 if(!post||!reply){SOS.toast("This reply could not be found. Refresh the forum and try again.",{title:"Reaction unavailable"});return}
 button.dataset.reactionBusy="1";
 const identity=forumReactionIdentity();
 const store=readReplyReactionStore();
 const path=reactionStorePath(postId,replyId,key);
 const people=new Set(reactionPeople(reply,key,postId));
 const removing=people.has(identity);
 removing?people.delete(identity):people.add(identity);
 store[path]=[...people];
 try{writeReplyReactionStore(store)}catch(err){delete button.dataset.reactionBusy;SOS.toast("The reaction could not be saved. Browser storage may be full.",{title:"Reaction error"});return}
 // Keep the current in-memory reply synchronized, but avoid rewriting the entire posts database.
 reply.reactions=reply.reactions&&typeof reply.reactions==="object"?reply.reactions:{};
 reply.reactions[key]=[...people];delete reply.reactions[LEGACY_REACTION_KEYS[key]];
 button.classList.toggle("is-reacted",!removing);
 button.setAttribute("aria-pressed",String(!removing));
 button.setAttribute("aria-label",`${removing?"Add":"Remove"} ${REPLY_REACTIONS.find(r=>r.key===key)?.label||""} reaction`);
 const count=button.querySelector(".replyReactionCount");if(count)count.textContent=people.size||"";
 button.classList.remove("reaction-added","reaction-removed");void button.offsetWidth;button.classList.add(removing?"reaction-removed":"reaction-added");
 setTimeout(()=>{button.classList.remove("reaction-added","reaction-removed");delete button.dataset.reactionBusy},260);
}
function bindReplyReactionButtons(){
 document.querySelectorAll("#postList .replyReactionButton[data-reply-reaction-key]").forEach(button=>{
  button.onclick=event=>{
   event.preventDefault();
   event.stopPropagation();
   event.stopImmediatePropagation();
   toggleReplyReaction(button);
  };
  button.onpointerdown=event=>{
   event.stopPropagation();
  };
 });
}
function draw(){const s=SOS.getSession(),list=filtered();document.getElementById("postList").innerHTML=list.length?list.map(p=>`<article data-post-id="${esc(p.id)}" class="forumPost ${p.pinned?"forumPostPinned":""} ${p.locked?"forumPostLocked":""}">${p.pinned?`<div class="pinnedRibbon"><span>📌</span><strong>Pinned Discussion</strong></div>`:""}${p.locked?`<div class="lockedRibbon">🔒 Replies locked by an administrator</div>`:""}<div class="postTop"><button class="forumAvatarButton" type="button" aria-label="View ${esc(p.author)} profile" data-profile-name="${esc(p.author)}"><img class="avatar" src="${esc(p.avatar||"assets/images/sos-logo.png")}" alt="${esc(p.author)} profile image"></button><div class="postIdentity"><h3>${esc(p.title)}</h3><div class="postMeta"><button class="forumAuthorLink" type="button" data-profile-name="${esc(p.author)}">${esc(p.author)}</button> • ${esc(p.category)}${p.subcategory?` / ${esc(p.subcategory)}`:""} • ${new Date(p.date).toLocaleString()}</div></div></div><div class="postTags">${(p.tags||[]).map(t=>`<button data-tag="${esc(t)}">#${esc(t)}</button>`).join("")}</div><div class="postBody">${esc(p.body)}</div>${mediaBlock(p)}<div class="postActions"><button class="smallAction forumHeartReaction ${(p.likedBy||[]).includes(forumReactionIdentity())?"is-reacted":""}" type="button" data-like="${p.id}" aria-pressed="${(p.likedBy||[]).includes(forumReactionIdentity())?"true":"false"}" aria-label="${(p.likedBy||[]).includes(forumReactionIdentity())?"Remove heart reaction":"Add heart reaction"}"><span class="forumHeartIcon" aria-hidden="true">${(p.likedBy||[]).includes(forumReactionIdentity())?"♥":"♡"}</span><span class="forumHeartCount">${p.likes||0}</span><span class="forumHeartLabel">${(p.likedBy||[]).includes(forumReactionIdentity())?"Loved":"Love"}</span></button>${p.locked?`<button class="smallAction" disabled>Locked (${(p.replies||[]).length})</button>`:`<button class="smallAction" data-reply="${p.id}">Reply (${(p.replies||[]).length})</button>`}${s&&(s.displayName===p.author||s.role==="admin")?`<button class="smallAction dangerAction forumPostDelete" type="button" data-delete="${p.id}" aria-label="Delete discussion: ${esc(p.title)}"><span aria-hidden="true">×</span><b>Delete</b></button>`:""}</div>${replyComposer(p.id)}${(p.replies||[]).map((r,replyIndex)=>`<div class="forumReply" data-reply-id="${esc(r.id||String(replyIndex))}"><button class="forumAvatarButton forumReplyAvatarButton" type="button" aria-label="View ${esc(r.author)} profile" data-profile-name="${esc(r.author)}"><img class="avatar" src="${esc(r.avatar||"assets/images/sos-logo.png")}" alt="${esc(r.author)} profile image"></button><div class="forumReplyContent"><div class="forumReplyHeading"><div class="forumReplyIdentity"><button class="forumAuthorLink replyAuthor" type="button" data-profile-name="${esc(r.author)}">${esc(r.author)}</button><span class="forumReplyDate">${r.date?new Date(r.date).toLocaleString():"Reply"}</span></div>${s&&(s.displayName===r.author||s.role==="admin")?`<button type="button" class="replyDeleteButton" data-delete-reply="${esc(r.id||String(replyIndex))}" data-post-id="${esc(p.id)}" aria-label="Remove reply by ${esc(r.author)}" title="Remove this reply"><span class="replyDeleteIcon" aria-hidden="true"></span><span class="replyDeleteText">Delete reply</span></button>`:""}</div><p>${esc(r.body)}</p>${replyReactionMarkup(p,r,replyIndex)}</div></div>`).join("")}</article>`).join(""):'<div class="emptyState">No forum posts matched your filters.</div>';drawCats();drawTags();bindReplyReactionButtons()}
function suggestedTags(){const form=document.getElementById("postForm"),cat=form.elements.category.value,text=`${form.elements.title.value} ${form.elements.body.value}`.toLowerCase(),suggestions=[...(TAG_MAP[cat]||[])];Object.entries(KEYWORDS).forEach(([word,tag])=>{if(text.includes(word))suggestions.push(tag)});allTags().slice(0,6).forEach(([tag])=>suggestions.push(tag));return [...new Set(suggestions)].slice(0,14)}
function syncTagUI(){
 const input=document.getElementById("postTags");
 input.value=[...selectedTags].join(",");
 const suggestions=suggestedTags();
 document.getElementById("suggestedTagButtons").innerHTML=suggestions.map(t=>`<button type="button" class="tagChoice ${selectedTags.has(t)?"selected":""}" data-pick-tag="${esc(t)}" aria-pressed="${selectedTags.has(t)}"><span class="tagChoiceSignal" aria-hidden="true"></span><span>#${esc(t)}</span><b aria-hidden="true">${selectedTags.has(t)?"✓":"+"}</b></button>`).join("");
 document.getElementById("selectedTagChips").innerHTML=selectedTags.size?`<span class="selectedTagsLabel">Selected tags</span>${[...selectedTags].map(t=>`<span class="selectedTagChip" data-selected-tag="${esc(t)}"><span class="selectedTagName">#${esc(t)}</span><button type="button" class="selectedTagRemove" data-remove-selected-tag="${esc(t)}" aria-label="Remove ${esc(t)} tag" title="Remove #${esc(t)}">×</button></span>`).join("")}`:'<span class="postMeta tagPickerEmpty">Select up to 8 tags or create your own.</span>'
}
function addTag(value){const tag=cleanTag(value);if(!tag)return;if(selectedTags.size>=8&&!selectedTags.has(tag)){SOS.toast("You can select up to 8 tags.",{title:"Tag limit"});return}selectedTags.add(tag);syncTagUI()}
function openComposer(){if(!SOS.getSession()){SOS.toast("Please sign in before creating a post.",{title:"Members only"});return}document.getElementById("forumComposer").hidden=false;syncTagUI();document.getElementById("forumComposer").scrollIntoView({behavior:"smooth",block:"center"})}
function resetComposer(){document.getElementById("postForm").reset();selectedTags.clear();imageData="";const preview=document.getElementById("imagePreview");preview.hidden=true;preview.innerHTML="";localStorage.removeItem("sos_forum_draft_v2");syncTagUI()}
function syncSubcategories(){const c=document.getElementById("postCategory"),sub=document.getElementById("postSubcategory");if(!c||!sub)return;const current=sub.value;sub.innerHTML=(SUBCATEGORIES[c.value]||["General"]).map(x=>`<option>${esc(x)}</option>`).join("");if([...sub.options].some(o=>o.value===current))sub.value=current}
draw();
document.getElementById("forumCategories").onclick=e=>{const b=e.target.closest("[data-category]");if(!b)return;active=b.dataset.category;draw()};
document.getElementById("forumTagCloud").onclick=e=>{const b=e.target.closest("[data-tag]");if(!b)return;activeTag=b.dataset.tag;draw()};
document.getElementById("activeTagRow").onclick=e=>{if(e.target.closest("[data-clear-tag]")){activeTag="";draw()}};
document.getElementById("forumSearch").oninput=e=>{query=e.target.value.trim();draw()};document.getElementById("forumSort").onchange=e=>{sort=e.target.value;draw()};
const newPostButton=document.getElementById("newPostButton");
if(newPostButton){
  newPostButton.type="button";
  newPostButton.addEventListener("click",event=>{
    event.preventDefault();
    openComposer();
  });
}
const closeComposerButton=document.getElementById("closeComposer");
if(closeComposerButton){
  closeComposerButton.type="button";
  closeComposerButton.addEventListener("click",event=>{
    event.preventDefault();
    document.getElementById("forumComposer").hidden=true;
  });
}
document.getElementById("postCategory").onchange=()=>{syncSubcategories();syncTagUI()};syncSubcategories();document.getElementById("postForm").elements.title.addEventListener("input",syncTagUI);document.getElementById("postForm").elements.body.addEventListener("input",syncTagUI);
document.getElementById("suggestedTagButtons").addEventListener("click",e=>{
 const b=e.target.closest("[data-pick-tag]");
 if(!b)return;
 e.preventDefault();
 e.stopPropagation();
 const tag=cleanTag(b.dataset.pickTag);
 if(!tag)return;
 if(selectedTags.has(tag)){selectedTags.delete(tag);syncTagUI()}else addTag(tag);
});
document.getElementById("selectedTagChips").addEventListener("click",e=>{
 const b=e.target.closest("[data-remove-selected-tag]");
 if(!b)return;
 e.preventDefault();
 e.stopPropagation();
 const tag=cleanTag(b.dataset.removeSelectedTag);
 if(!tag)return;
 selectedTags.delete(tag);
 syncTagUI();
});
document.getElementById("clearSelectedTags")?.addEventListener("click",()=>{selectedTags.clear();syncTagUI();document.getElementById("customTagInput")?.focus()});
const customInput=document.getElementById("customTagInput");document.getElementById("addCustomTag").onclick=()=>{addTag(customInput.value);customInput.value="";customInput.focus()};customInput.onkeydown=e=>{if(e.key==="Enter"||e.key===","){e.preventDefault();addTag(customInput.value);customInput.value=""}};
document.getElementById("postImage").onchange=async e=>{const file=e.target.files[0];if(!file)return;const box=document.getElementById("imagePreview");box.hidden=false;box.innerHTML='<div class="imageProcessing">Optimizing image…</div>';try{const result=await SOSImages.compress(file,{maxWidth:1400,maxHeight:1400,quality:.76,maxBytes:850*1024});imageData=result.dataUrl;box.innerHTML=`<img src="${imageData}" alt="Post preview"><p class="imageUploadStatus">${SOSImages.status(result)}</p><button type="button" class="smallAction animatedCloseText" id="removePostImage">Remove image</button>`;document.getElementById("removePostImage").onclick=()=>{imageData="";e.target.value="";box.hidden=true;box.innerHTML=""};SOS.toast("Your image was resized and compressed for local storage.",{title:"Image optimized"})}catch(err){imageData="";e.target.value="";box.hidden=true;box.innerHTML="";SOS.toast(err.message,{title:"Image upload"})}};
document.getElementById("saveDraftButton").onclick=()=>{const f=new FormData(document.getElementById("postForm"));localStorage.setItem("sos_forum_draft_v2",JSON.stringify({category:f.get("category"),title:f.get("title"),body:f.get("body"),tags:[...selectedTags],mediaUrl:f.get("mediaUrl")}));SOS.toast("Your forum draft was saved in this browser.",{title:"Draft saved"})};
const draft=JSON.parse(localStorage.getItem("sos_forum_draft_v2")||"null");if(draft){const form=document.getElementById("postForm");["category","subcategory","title","body","mediaUrl"].forEach(k=>{if(form.elements[k])form.elements[k].value=draft[k]||""});selectedTags=new Set((draft.tags||[]).map(cleanTag).filter(Boolean));syncTagUI()}else syncTagUI();
document.getElementById("postForm").onsubmit=e=>{e.preventDefault();const s=SOS.getSession(),f=new FormData(e.target);if(!s)return openComposer();posts.push({id:crypto.randomUUID(),category:f.get("category"),subcategory:f.get("subcategory")||"",title:f.get("title").trim(),body:f.get("body").trim(),tags:[...selectedTags].slice(0,8),image:imageData,mediaUrl:safeUrl(f.get("mediaUrl")),author:s.displayName,avatar:s.avatar,date:new Date().toISOString(),likes:0,replies:[]});try{save()}catch{posts.pop();SOS.toast("Browser storage is full. Try a smaller image.",{title:"Could not publish"});return}resetComposer();document.getElementById("forumComposer").hidden=true;draw();SOS.toast("Your discussion is now live.",{title:"Post published"})};
function insertEmoji(targetId,emoji){const field=document.getElementById(targetId);if(!field)return;const start=field.selectionStart??field.value.length,end=field.selectionEnd??start;field.value=field.value.slice(0,start)+emoji+field.value.slice(end);field.focus();field.selectionStart=field.selectionEnd=start+emoji.length;field.dispatchEvent(new Event("input",{bubbles:true}))}
document.addEventListener("click",e=>{const bar=e.target.closest(".emojiToolbar"),button=e.target.closest(".emojiToolbar button:not([data-open-emoji])");if(bar&&button){e.preventDefault();e.stopPropagation();insertEmoji(bar.dataset.emojiTarget,button.dataset.quickEmoji||button.textContent.trim());return}});
document.getElementById("postList").addEventListener("input",e=>{const area=e.target.closest(".inlineReplyComposer textarea");if(!area)return;const count=area.closest(".inlineReplyComposer").querySelector("[data-reply-count]");if(count)count.textContent=`${area.value.length} / 1200`});
// Capture destructive forum actions before profile cards or other delegated handlers can intercept them.
// Reply controls intentionally stay in the single bubble handler below so they are never double-handled.
document.getElementById("postList").addEventListener("click",e=>{
  const replyDelete=e.target.closest("[data-delete-reply]");
  if(replyDelete){
    e.preventDefault();
    e.stopPropagation();
    const postId=replyDelete.dataset.postId;
    const replyId=replyDelete.dataset.deleteReply;
    if(postId&&replyId!=null)openReplyDeleteModal(postId,replyId);
    return;
  }
  const postDelete=e.target.closest("[data-delete]");
  if(postDelete){
    e.preventDefault();
    e.stopPropagation();
    const postId=postDelete.dataset.delete;
    if(postId)openForumDeleteModal(postId);
  }
},true);
document.getElementById("postList").onclick=e=>{const tag=e.target.closest("[data-tag]"),like=e.target.closest("[data-like]"),del=e.target.closest("[data-delete]"),rep=e.target.closest("[data-reply]"),cancel=e.target.closest("[data-cancel-reply]");if(tag){activeTag=tag.dataset.tag;draw();scrollTo({top:document.querySelector(".forumSearchBar").offsetTop-100,behavior:"smooth"});return}if(like){
  const session=SOS.getSession();
  if(!session){SOS.toast("Please sign in to react to discussions.",{title:"Members only"});return}
  const post=posts.find(p=>p.id===like.dataset.like);
  if(!post)return;
  const reactor=forumReactionIdentity();
  post.likedBy=Array.isArray(post.likedBy)?post.likedBy:[];
  const hadReaction=post.likedBy.includes(reactor);
  post.likedBy=hadReaction?post.likedBy.filter(id=>id!==reactor):[...post.likedBy,reactor];
  post.likes=post.likedBy.length;
  post.updatedAt=new Date().toISOString();
  save();
  draw();
  const refreshed=document.querySelector(`[data-like="${CSS.escape(post.id)}"]`);
  refreshed?.classList.add(hadReaction?"reaction-removed":"reaction-added");
  setTimeout(()=>refreshed?.classList.remove("reaction-added","reaction-removed"),420);
  return
}if(del){openForumDeleteModal(del.dataset.delete);return}if(cancel){
  const composer=cancel.closest(".inlineReplyComposer");
  if(composer){
    composer.classList.add("is-closing");
    setTimeout(()=>{replyingTo="";draw()},260);
  }else{
    replyingTo="";
    draw();
  }
  return
}if(rep){
  e.preventDefault();
  const session=SOS.getSession();
  const postId=rep.dataset.reply;
  const target=posts.find(p=>p.id===postId);
  if(target?.locked&&session?.role!=="admin"){SOS.toast("This discussion is locked.",{title:"Replies unavailable"});return}
  if((target?.mutedUsers||[]).includes(session?.displayName)&&session?.role!=="admin"){SOS.toast("An administrator restricted your replies in this discussion.",{title:"Reply restricted"});return}
  if(!session){SOS.toast("Sign in to reply.",{title:"Members only"});return}
  replyingTo=replyingTo===postId?"":postId;
  draw();
  if(replyingTo){
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const field=document.getElementById(`replyText-${replyingTo}`);
      field?.scrollIntoView({behavior:"smooth",block:"center"});
      field?.focus({preventScroll:true});
    }));
  }
}};
document.getElementById("postList").onsubmit=e=>{const form=e.target.closest("[data-reply-form]");if(!form)return;e.preventDefault();const session=SOS.getSession();if(!session){SOS.toast("Please sign in to reply.",{title:"Members only"});return}const post=posts.find(x=>x.id===form.dataset.replyForm),body=form.querySelector("textarea").value.trim();if(!post||!body)return;if(post.locked&&session.role!=="admin"){SOS.toast("This discussion is locked.",{title:"Replies unavailable"});return}if((post.mutedUsers||[]).includes(session.displayName)&&session.role!=="admin"){SOS.toast("You cannot reply in this discussion.",{title:"Reply restricted"});return}post.replies=post.replies||[];post.replies.push({id:crypto.randomUUID(),author:session.displayName,avatar:session.avatar,body,date:new Date().toISOString()});post.updatedAt=new Date().toISOString();replyingTo="";save();draw();SOS.toast("Your reply is now live.",{title:"Reply posted"})};
// Forum interaction polish: gives every actionable control a lightweight pointer-reactive highlight.
document.addEventListener("pointermove",event=>{
  const control=event.target.closest(".forumToolbar button,.forumSearchBar select,.forumSidebar button,.forumComposer button,.postActions button,.postTags button,.emojiToolbar button,.forumDeleteDialog button");
  if(!control)return;
  const rect=control.getBoundingClientRect();
  control.style.setProperty("--forum-pointer-x",`${event.clientX-rect.left}px`);
  control.style.setProperty("--forum-pointer-y",`${event.clientY-rect.top}px`);
},{passive:true});

})();
