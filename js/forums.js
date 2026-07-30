(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const toast=(m,t='Forums')=>window.SOS?.toast?.(m,{title:t})||alert(m);
const client=()=>window.SOS_SUPABASE?.client;
const state={categories:[],topics:[],replies:new Map(),reactions:[],active:'all',tag:'',query:'',sort:'newest',replying:'',selectedTags:new Set(),file:null,user:null,profile:null};
const defaultAvatar='assets/images/sos-logo.png';
const FALLBACK_CATEGORY_NAMES=['General Discussion','EDM Community','Music Production','DJ Tips','Events','Help & FAQ','Feedback','Off Topic'];
const SUBCATEGORIES={
 'General Discussion':['Introductions','Community News','General Chat'],
 'EDM Community':['House','Techno','Dubstep & Bass','Trance','Drum & Bass','Future Bass','EDM Releases','Festival Talk'],
 'Music Production':['DAWs & Software','Mixing','Mastering','Sound Design','Works in Progress','Collaboration'],
 'DJ Tips':['Beginner DJ Help','Controllers & Gear','Rekordbox','Serato','Live Sets','Transitions & Mixing'],
 'Events':['Upcoming Events','Past Events','Livestreams','Meetups'],
 'Help & FAQ':['Site FAQ','Account Help','Forum Help','Music Purchases','Member Vault','Technical Support'],
 'Feedback':['Track Feedback','Website Feedback','Merch Feedback','Suggestions'],
 'Off Topic':['Gaming','Random','Creative Projects']
};
const TAG_MAP={
 'General Discussion':['community','introduction','question','news'],
 'EDM Community':['edm','house','techno','dubstep','trance','drum-and-bass','future-bass','festival'],
 'Music Production':['production','ableton','fl-studio','mixing','mastering','sound-design','feedback'],
 'DJ Tips':['dj-tips','mixing','rekordbox','serato','controllers','live-set'],
 'Events':['events','live-show','tickets','meetup','announcement'],
 'Help & FAQ':['faq','help','support','account','members-vault'],
 'Feedback':['feedback','showcase','work-in-progress','mix-review'],
 'Off Topic':['off-topic','community','gaming','random']
};
const SUBCATEGORY_TAGS={
 'Introductions':['introduction','new-member'],'Community News':['community-news','announcement'],'General Chat':['community','discussion'],
 'House':['house'],'Techno':['techno'],'Dubstep & Bass':['dubstep','bass-music'],'Trance':['trance'],'Drum & Bass':['drum-and-bass','dnb'],'Future Bass':['future-bass'],'EDM Releases':['new-release','edm'],'Festival Talk':['festival','events'],
 'DAWs & Software':['daw','software'],'Mixing':['mixing'],'Mastering':['mastering'],'Sound Design':['sound-design'],'Works in Progress':['work-in-progress','feedback'],'Collaboration':['collaboration'],
 'Beginner DJ Help':['beginner-dj','help'],'Controllers & Gear':['dj-gear','controllers'],'Rekordbox':['rekordbox'],'Serato':['serato'],'Live Sets':['live-set'],'Transitions & Mixing':['transitions','mixing'],
 'Upcoming Events':['upcoming-events'],'Past Events':['past-events'],'Livestreams':['livestream'],'Meetups':['meetup'],
 'Site FAQ':['faq'],'Account Help':['account-help'],'Forum Help':['forum-help'],'Music Purchases':['music-purchases'],'Member Vault':['members-vault'],'Technical Support':['technical-support'],
 'Track Feedback':['track-feedback'],'Website Feedback':['website-feedback'],'Merch Feedback':['merch-feedback'],'Suggestions':['suggestions'],
 'Gaming':['gaming'],'Random':['random'],'Creative Projects':['creative-projects']
};
const KEYWORDS={ableton:'ableton',fl:'fl-studio',mix:'mixing',master:'mastering',remix:'remix',house:'house',techno:'techno',dubstep:'dubstep',bass:'bass-music',event:'events',show:'live-show',ticket:'tickets',feedback:'feedback',collab:'collaboration',youtube:'youtube',soundcloud:'soundcloud',spotify:'spotify',bug:'bug',help:'support',question:'question'};
const canStaff=()=>['owner','administrator','moderator'].includes(state.profile?.role);
const cleanTag=v=>String(v||'').toLowerCase().trim().replace(/^#/,'').replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,24);
const formatDate=v=>new Date(v).toLocaleString();

async function auth(){
 const {data}=await client().auth.getSession(); state.user=data.session?.user||null;
 if(state.user){const {data:p}=await client().from('profiles').select('*').eq('id',state.user.id).maybeSingle();state.profile=p||null;}
}
async function load(){
 if(!client())return toast('Supabase is not connected.','Forum unavailable');
 await auth();
 const [{data:cats,error:ce},{data:topics,error:te},{data:react,error:re}]=await Promise.all([
  client().from('forum_categories').select('*').eq('is_visible',true).order('sort_order'),
  client().from('forum_topics').select('*,category:forum_categories(*),author:profiles!forum_topics_author_id_fkey(id,username,display_name,avatar_url,role,rank_name)').eq('is_hidden',false).order('is_pinned',{ascending:false}).order('last_activity_at',{ascending:false}),
  client().from('forum_reactions').select('*').eq('reaction','heart')
 ]);
 if(ce||te||re){console.error(ce||te||re);return toast((ce||te||re).message,'Forum load failed');}
 state.categories=cats||[];state.topics=topics||[];state.reactions=react||[];
 const ids=state.topics.map(t=>t.id);
 if(ids.length){
  const {data,error}=await client().from('forum_replies').select('*,author:profiles!forum_replies_author_id_fkey(id,username,display_name,avatar_url,role,rank_name)').in('topic_id',ids).eq('is_hidden',false).order('created_at');
  if(error)console.error(error); else (data||[]).forEach(r=>{const a=state.replies.get(r.topic_id)||[];a.push(r);state.replies.set(r.topic_id,a)});
 }
 syncCategorySelect();draw();
}
function categoryName(){const s=$('#postCategory');return s?.selectedOptions?.[0]?.textContent?.trim()||'';}
function syncCategorySelect(){
 const select=$('#postCategory');if(!select)return;
 const previousValue=select.value;
 const previousName=select.selectedOptions?.[0]?.textContent?.trim();
 const categories=state.categories.length?state.categories:FALLBACK_CATEGORY_NAMES.map(name=>({id:name,name}));
 select.innerHTML=categories.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
 const byValue=[...select.options].find(o=>o.value===previousValue);
 const byName=[...select.options].find(o=>o.textContent.trim()===previousName);
 if(byValue)select.value=byValue.value;else if(byName)select.value=byName.value;
 syncSubcategories();syncSuggestedTags();
}
function syncSubcategories(){
 const sub=$('#postSubcategory'),name=categoryName();if(!sub)return;
 const previous=sub.value,items=SUBCATEGORIES[name]||['General'];
 sub.innerHTML=items.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
 if(items.includes(previous))sub.value=previous;
}
function suggestedTags(){
 const form=$('#postForm'),name=categoryName(),sub=$('#postSubcategory')?.value||'';
 const text=`${form?.elements?.title?.value||''} ${form?.elements?.body?.value||''}`.toLowerCase();
 const suggestions=[...(TAG_MAP[name]||[]),...(SUBCATEGORY_TAGS[sub]||[])];
 Object.entries(KEYWORDS).forEach(([word,tag])=>{if(text.includes(word))suggestions.push(tag)});
 return [...new Set(suggestions.map(cleanTag).filter(Boolean))].slice(0,16);
}
function syncSuggestedTags(){
 const box=$('#suggestedTagButtons');if(!box)return;
 const suggestions=suggestedTags();
 box.innerHTML=suggestions.map(t=>`<button type="button" class="tagChoice ${state.selectedTags.has(t)?'selected':''}" data-pick-tag="${esc(t)}" aria-pressed="${state.selectedTags.has(t)}"><span>#${esc(t)}</span><b aria-hidden="true">${state.selectedTags.has(t)?'✓':'+'}</b></button>`).join('')||'<span class="postMeta">Start typing your title or post to see suggested tags.</span>';
}
function filtered(){let list=[...state.topics];if(state.active!=='all')list=list.filter(t=>t.category_id===state.active);if(state.tag)list=list.filter(t=>(t.tags||[]).includes(state.tag));if(state.query){const q=state.query.toLowerCase();list=list.filter(t=>`${t.title} ${t.body} ${(t.tags||[]).join(' ')} ${t.author?.display_name||t.author?.username||''}`.toLowerCase().includes(q));}if(state.sort==='oldest')list.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));if(state.sort==='popular')list.sort((a,b)=>reactionCount(b.id)-reactionCount(a.id));if(state.sort==='replied')list.sort((a,b)=>(state.replies.get(b.id)?.length||0)-(state.replies.get(a.id)?.length||0));if(state.sort==='updated')list.sort((a,b)=>new Date(b.last_activity_at)-new Date(a.last_activity_at));return list;}
const reactionCount=id=>state.reactions.filter(r=>r.topic_id===id).length;
const reacted=id=>state.reactions.some(r=>r.topic_id===id&&r.user_id===state.user?.id);
function drawCats(){const el=$('#forumCategories');if(!el)return;el.innerHTML=[{id:'all',name:'All Discussions'},...state.categories].map(c=>`<button class="categoryButton ${state.active===c.id?'active':''}" data-category="${c.id}"><span>${esc(c.name)}</span><small>${c.id==='all'?state.topics.length:state.topics.filter(t=>t.category_id===c.id).length}</small></button>`).join('');}
function drawTags(){const counts={};state.topics.forEach(t=>(t.tags||[]).forEach(x=>counts[x]=(counts[x]||0)+1));$('#forumTagCloud').innerHTML=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,20).map(([t,n])=>`<button class="forumTag ${state.tag===t?'active':''}" data-tag="${esc(t)}">#${esc(t)} <small>${n}</small></button>`).join('')||'<span class="postMeta">Tags appear after members publish posts.</span>';$('#activeTagRow').innerHTML=state.tag?`<span>Filtering by <strong>#${esc(state.tag)}</strong></span><button class="smallAction" data-clear-tag>Clear tag</button>`:'';}
function replyForm(t){return state.replying===t.id?`<form class="inlineReplyComposer" data-reply-form="${t.id}"><textarea maxlength="30000" required placeholder="Write your reply..."></textarea><div class="composerActions"><button class="smallAction" type="button" data-cancel-reply>Cancel</button><button class="primaryButton">Post Reply</button></div></form>`:'';}
function media(t){let out='';if(t.image_url)out+=`<div class="postMedia"><img src="${esc(t.image_url)}" alt="Forum attachment"></div>`;if(t.media_url)out+=`<p><a class="smallAction" href="${esc(t.media_url)}" target="_blank" rel="noopener">Open shared media ↗</a></p>`;return out;}
function draw(){drawCats();drawTags();const list=filtered();$('#postList').innerHTML=list.length?list.map(t=>{const reps=state.replies.get(t.id)||[],author=t.author||{},mine=state.user?.id===t.author_id;return `<article class="forumPost ${t.is_pinned?'forumPostPinned':''} ${t.is_locked?'forumPostLocked':''}" data-post-id="${t.id}">${t.is_pinned?'<div class="pinnedRibbon"><span>📌</span><strong>Pinned Discussion</strong></div>':''}${t.is_locked?'<div class="lockedRibbon">🔒 Replies locked by staff</div>':''}<div class="postTop"><button class="forumAvatarButton" type="button"><img class="avatar" src="${esc(author.avatar_url||defaultAvatar)}" alt="${esc(author.display_name||author.username||'Member')}"></button><div class="postIdentity"><h3>${esc(t.title)}</h3><div class="postMeta">${esc(author.display_name||author.username||'Member')} • ${esc(t.category?.name||'Forum')} • ${formatDate(t.created_at)}</div></div></div><div class="postTags">${(t.tags||[]).map(x=>`<button data-tag="${esc(x)}">#${esc(x)}</button>`).join('')}</div><div class="postBody">${esc(t.body).replace(/\n/g,'<br>')}</div>${media(t)}<div class="postActions"><button class="smallAction forumHeartReaction ${reacted(t.id)?'is-reacted':''}" data-like="${t.id}"><span class="forumHeartIcon">${reacted(t.id)?'♥':'♡'}</span><span class="forumHeartCount">${reactionCount(t.id)}</span><span>${reacted(t.id)?'Loved':'Love'}</span></button><button class="smallAction" data-reply="${t.id}" ${t.is_locked&&!canStaff()?'disabled':''}>Reply (${reps.length})</button>${mine||canStaff()?`<button class="smallAction dangerAction" data-delete="${t.id}">Delete</button>`:''}${canStaff()?`<button class="smallAction" data-pin="${t.id}">${t.is_pinned?'Unpin':'Pin'}</button><button class="smallAction" data-lock="${t.id}">${t.is_locked?'Unlock':'Lock'}</button>`:''}</div>${replyForm(t)}${reps.map(r=>`<div class="forumReply"><img class="avatar" src="${esc(r.author?.avatar_url||defaultAvatar)}" alt=""><div class="forumReplyContent"><div class="forumReplyHeading"><div><button class="forumAuthorLink">${esc(r.author?.display_name||r.author?.username||'Member')}</button><span class="forumReplyDate">${formatDate(r.created_at)}</span></div>${state.user?.id===r.author_id||canStaff()?`<button class="replyDeleteButton" data-delete-reply="${r.id}">Delete reply</button>`:''}</div><p>${esc(r.body).replace(/\n/g,'<br>')}</p></div></div>`).join('')}</article>`}).join(''):'<div class="emptyState">No forum posts matched your filters.</div>';}
async function upload(file,topicId){if(!file)return null;const ext=(file.name.split('.').pop()||'jpg').toLowerCase();const path=`${state.user.id}/${topicId}/${crypto.randomUUID()}.${ext}`;const {error}=await client().storage.from('forum-attachments').upload(path,file,{contentType:file.type,upsert:false});if(error)throw error;const {data}=client().storage.from('forum-attachments').getPublicUrl(path);await client().from('attachments').insert({owner_id:state.user.id,topic_id:topicId,bucket:'forum-attachments',storage_path:path,file_name:file.name,mime_type:file.type,size_bytes:file.size});return data.publicUrl;}
async function createTopic(e){e.preventDefault();if(!state.user)return toast('Please sign in before creating a post.','Members only');const f=new FormData(e.currentTarget),title=String(f.get('title')||'').trim(),body=String(f.get('body')||'').trim();try{const {data,error}=await client().from('forum_topics').insert({category_id:f.get('category'),author_id:state.user.id,title,body,tags:[...state.selectedTags],subcategory:f.get('subcategory')||'',media_url:f.get('mediaUrl')||null}).select().single();if(error)throw error;if(state.file){const image=await upload(state.file,data.id);const {error:u}=await client().from('forum_topics').update({image_url:image}).eq('id',data.id);if(u)throw u;}localStorage.removeItem('sos_forum_draft_v2');e.currentTarget.reset();state.selectedTags.clear();state.file=null;syncSubcategories();renderSelected();syncSuggestedTags();$('#forumComposer').hidden=true;toast('Your discussion is now live.','Post published');state.replies.clear();await load();}catch(err){console.error(err);toast(err.message,'Could not publish');}}
async function act(target){const id=target.dataset.like||target.dataset.delete||target.dataset.reply||target.dataset.pin||target.dataset.lock;if(target.dataset.reply){if(!state.user)return toast('Sign in to reply.','Members only');state.replying=state.replying===id?'':id;return draw();}if(target.dataset.like){if(!state.user)return toast('Sign in to react.','Members only');const row=state.reactions.find(r=>r.topic_id===id&&r.user_id===state.user.id);const q=row?client().from('forum_reactions').delete().eq('id',row.id):client().from('forum_reactions').insert({user_id:state.user.id,topic_id:id,reaction:'heart'});const {error}=await q;if(error)return toast(error.message,'Reaction failed');return load();}if(target.dataset.delete){if(!confirm('Delete this discussion and all replies?'))return;const {error}=await client().from('forum_topics').delete().eq('id',id);if(error)return toast(error.message,'Delete failed');return load();}if(target.dataset.pin||target.dataset.lock){const topic=state.topics.find(t=>t.id===id),changes=target.dataset.pin?{is_pinned:!topic.is_pinned}:{is_locked:!topic.is_locked};const {error}=await client().rpc('forum_set_topic_moderation',{target_topic:id,pin_value:target.dataset.pin?changes.is_pinned:null,lock_value:target.dataset.lock?changes.is_locked:null});if(error)return toast(error.message,'Moderation failed');return load();}if(target.dataset.deleteReply){if(!confirm('Delete this reply?'))return;const {error}=await client().from('forum_replies').delete().eq('id',target.dataset.deleteReply);if(error)return toast(error.message,'Delete failed');state.replies.clear();return load();}}
async function submitReply(form){if(!state.user)return toast('Sign in to reply.','Members only');const topic=state.topics.find(t=>t.id===form.dataset.replyForm),body=$('textarea',form).value.trim();if(topic?.is_locked&&!canStaff())return toast('This topic is locked.','Replies unavailable');const {error}=await client().from('forum_replies').insert({topic_id:topic.id,author_id:state.user.id,body});if(error)return toast(error.message,'Reply failed');await client().from('forum_topics').update({last_activity_at:new Date().toISOString()}).eq('id',topic.id);state.replying='';state.replies.clear();toast('Your reply is now live.','Reply posted');load();}
function ensureComposerControls(){
 const form=$('#postForm');if(!form)return;
 let category=$('#postCategory');
 if(!category){
  const row=form.querySelector('.formRow');
  row?.insertAdjacentHTML('afterbegin',`<label>Forum section<select id="postCategory" name="category"></select></label>`);
  category=$('#postCategory');
 }
 let sub=$('#postSubcategory');
 if(!sub){
  const row=category?.closest('.formRow');
  row?.insertAdjacentHTML('beforeend',`<label>Subcategory<select id="postSubcategory" name="subcategory"></select></label>`);
 }
 let picker=$('#suggestedTagButtons');
 if(!picker){
  const title=form.querySelector('input[name="title"]')?.closest('label');
  title?.insertAdjacentHTML('beforebegin',`<div class="tagPicker"><div class="tagPickerHead"><strong>Suggested tags</strong><span>Tags update from your category, subcategory, title, and post.</span></div><div class="suggestedTagButtons" id="suggestedTagButtons"></div><div class="selectedTagChips" id="selectedTagChips"></div><input id="postTags" name="tags" type="hidden"></div>`);
 }
 syncCategorySelect();renderSelected();syncSuggestedTags();
}
function bind(){
 ensureComposerControls();
 $('#newPostButton').onclick=()=>{if(!state.user)return toast('Please sign in before creating a post.','Members only');$('#forumComposer').hidden=false;$('#forumComposer').scrollIntoView({behavior:'smooth'});};$('#closeComposer').onclick=()=>$('#forumComposer').hidden=true;$('#postForm').onsubmit=createTopic;
 $('#postImage').onchange=e=>{state.file=e.target.files[0]||null;const p=$('#imagePreview');if(state.file){p.hidden=false;p.innerHTML=`<strong>${esc(state.file.name)}</strong><p class="postMeta">Ready to upload securely to Supabase Storage.</p>`}else p.hidden=true;};
 $('#forumCategories').onclick=e=>{const b=e.target.closest('[data-category]');if(b){state.active=b.dataset.category;draw();}};$('#forumTagCloud').onclick=e=>{const b=e.target.closest('[data-tag]');if(b){state.tag=b.dataset.tag;draw();}};$('#activeTagRow').onclick=e=>{if(e.target.closest('[data-clear-tag]')){state.tag='';draw();}};$('#forumSearch').oninput=e=>{state.query=e.target.value;draw();};$('#forumSort').onchange=e=>{state.sort=e.target.value;draw();};
 $('#postList').onclick=e=>{const tag=e.target.closest('[data-tag]');if(tag){state.tag=tag.dataset.tag;return draw();}const a=e.target.closest('[data-like],[data-delete],[data-reply],[data-pin],[data-lock],[data-delete-reply],[data-cancel-reply]');if(a?.dataset.cancelReply!==undefined){state.replying='';return draw();}if(a)act(a);};$('#postList').onsubmit=e=>{const f=e.target.closest('[data-reply-form]');if(f){e.preventDefault();submitReply(f);}};
 const custom=$('#customTagInput');
 $('#addCustomTag').onclick=()=>{const t=cleanTag(custom.value);if(t&&state.selectedTags.size<8)state.selectedTags.add(t);custom.value='';renderSelected();syncSuggestedTags();};
 custom.onkeydown=e=>{if(e.key==='Enter'||e.key===','){e.preventDefault();$('#addCustomTag').click();}};
 $('#postCategory').onchange=()=>{syncSubcategories();syncSuggestedTags();};
 $('#postSubcategory').onchange=syncSuggestedTags;
 $('#postForm').elements.title.addEventListener('input',syncSuggestedTags);
 $('#postBody').addEventListener('input',syncSuggestedTags);
 $('#suggestedTagButtons').onclick=e=>{const b=e.target.closest('[data-pick-tag]');if(!b)return;const t=b.dataset.pickTag;state.selectedTags.has(t)?state.selectedTags.delete(t):state.selectedTags.size<8&&state.selectedTags.add(t);renderSelected();syncSuggestedTags();};
 $('#selectedTagChips').onclick=e=>{const b=e.target.closest('[data-remove-tag]');if(!b)return;state.selectedTags.delete(b.dataset.removeTag);renderSelected();syncSuggestedTags();};
 $('#saveDraftButton').onclick=()=>{const f=new FormData($('#postForm'));localStorage.setItem('sos_forum_draft_v2',JSON.stringify({category:f.get('category'),subcategory:f.get('subcategory'),title:f.get('title'),body:f.get('body'),mediaUrl:f.get('mediaUrl'),tags:[...state.selectedTags]}));toast('Draft saved in this browser.','Draft saved');};
 syncSubcategories();syncSuggestedTags();
}
function renderSelected(){$('#selectedTagChips').innerHTML=state.selectedTags.size?[...state.selectedTags].map(t=>`<span class="selectedTagChip"><span>#${esc(t)}</span><button type="button" data-remove-tag="${esc(t)}" aria-label="Remove #${esc(t)}">×</button></span>`).join(''):'<span class="postMeta">Select up to 8 tags.</span>';$('#postTags').value=[...state.selectedTags].join(',');}
document.addEventListener('DOMContentLoaded',async()=>{bind();renderSelected();await load();new MutationObserver(()=>ensureComposerControls()).observe($('#forumComposer')||document.body,{childList:true,subtree:true});client().auth.onAuthStateChange(()=>{state.replies.clear();load();});client().channel('forum-live').on('postgres_changes',{event:'*',schema:'public',table:'forum_topics'},()=>{state.replies.clear();load();}).on('postgres_changes',{event:'*',schema:'public',table:'forum_replies'},()=>{state.replies.clear();load();}).subscribe();});
})();
