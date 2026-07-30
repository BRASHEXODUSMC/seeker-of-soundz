/* Seeker Of SoundZ v4.13.9 — server-synchronized forum presets and topic creation */
(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const toast=(message,title='Forums')=>window.SOS?.toast?.(message,{title})||alert(message);
const supa=()=>window.SOS_SUPABASE?.client||null;
const CATEGORIES=['All','General Discussion','EDM Community','Music Production','DJ Tips','Events','Help & FAQ','Feedback','Off Topic'];
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
const state={categories:[],subcategories:[],tagPresets:[],topics:[],profiles:new Map(),replies:new Map(),reactions:[],active:'All',tag:'',query:'',sort:'newest',selectedTags:new Set(),imageFile:null,user:null,profile:null,replying:''};
const cleanTag=v=>String(v||'').toLowerCase().trim().replace(/^#/,'').replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,24);
const staff=()=>['owner','administrator','moderator'].includes(String(state.profile?.role||'').toLowerCase());
const fmt=v=>{try{return new Date(v).toLocaleString()}catch{return ''}};
const avatar=p=>p?.avatar_url||'assets/images/sos-logo.png';
const display=p=>p?.display_name||p?.username||'Community Member';
function safeUrl(v){try{if(!v)return '';const u=new URL(v,location.href);return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return ''}}
async function getAuth(){const c=supa();if(!c)return;const {data}=await c.auth.getSession();state.user=data.session?.user||null;if(state.user){const {data:p}=await c.from('profiles').select('*').eq('id',state.user.id).maybeSingle();state.profile=p||null}}
async function loadCategories(){
 const c=supa();if(!c)return;
 // v4.13.9: fetch the complete preset tree through one server-side function so
 // category IDs, subcategories and tags always come from the same snapshot.
 const rpc=await c.rpc('forum_get_presets');
 if(!rpc.error&&rpc.data){
   const payload=typeof rpc.data==='string'?JSON.parse(rpc.data):rpc.data;
   state.categories=Array.isArray(payload.categories)?payload.categories:[];
   state.subcategories=Array.isArray(payload.subcategories)?payload.subcategories:[];
   state.tagPresets=Array.isArray(payload.tags)?payload.tags:[];
   populateCategorySelect();
   return;
 }
 // Compatibility fallback for projects that have not installed the v4.13.9 patch yet.
 const {data,error}=await c.from('forum_categories').select('*').eq('is_visible',true).order('sort_order');
 if(error){console.warn('Forum categories could not be loaded:',error);state.categories=[];state.subcategories=[];state.tagPresets=[];populateCategorySelect();return}
 state.categories=data||[];
 const subQuery=await c.from('forum_subcategories').select('*').eq('is_visible',true).order('sort_order');
 state.subcategories=subQuery.error?[]:(subQuery.data||[]);
 const tagQuery=await c.from('forum_tag_presets').select('*').eq('is_visible',true).order('sort_order');
 state.tagPresets=tagQuery.error?[]:(tagQuery.data||[]);
 populateCategorySelect();
}
async function loadTopics(){
 const c=supa();if(!c)return;
 // v4.13.11: one server-side feed avoids partial refresh failures after publish.
 const feed=await c.rpc('forum_get_feed');
 if(!feed.error&&feed.data){
   const payload=typeof feed.data==='string'?JSON.parse(feed.data):feed.data;
   state.topics=Array.isArray(payload.topics)?payload.topics:[];
   state.profiles.clear();
   (Array.isArray(payload.profiles)?payload.profiles:[]).forEach(x=>state.profiles.set(x.id,x));
   state.replies.clear();
   (Array.isArray(payload.replies)?payload.replies:[]).forEach(x=>{const a=state.replies.get(x.topic_id)||[];a.push(x);state.replies.set(x.topic_id,a)});
   state.reactions=Array.isArray(payload.reactions)?payload.reactions:[];
   return;
 }
 // Compatibility fallback until the v4.13.11 patch is installed.
 const {data,error}=await c.from('forum_topics').select('*').eq('is_hidden',false).order('is_pinned',{ascending:false}).order('last_activity_at',{ascending:false});
 if(error)throw error;
 state.topics=data||[];
 const ids=[...new Set(state.topics.map(t=>t.author_id).filter(Boolean))];
 if(ids.length){const {data:p}=await c.from('profiles').select('*').in('id',ids);(p||[]).forEach(x=>state.profiles.set(x.id,x))}
 const topicIds=state.topics.map(t=>t.id);
 state.replies.clear();
 if(topicIds.length){
   const {data:r,error:replyError}=await c.from('forum_replies').select('*').in('topic_id',topicIds).eq('is_hidden',false).order('created_at');
   if(replyError)throw replyError;
   const replyAuthors=[...new Set((r||[]).map(x=>x.author_id).filter(Boolean))];
   if(replyAuthors.length){const missing=replyAuthors.filter(id=>!state.profiles.has(id));if(missing.length){const {data:p2}=await c.from('profiles').select('*').in('id',missing);(p2||[]).forEach(x=>state.profiles.set(x.id,x))}}
   ;(r||[]).forEach(x=>{const a=state.replies.get(x.topic_id)||[];a.push(x);state.replies.set(x.topic_id,a)})
 }
 const {data:rx,error:reactionError}=await c.from('forum_reactions').select('*').in('topic_id',topicIds.length?topicIds:['00000000-0000-0000-0000-000000000000']);
 if(reactionError)throw reactionError;
 state.reactions=rx||[];
}
function categoryName(topic){return state.categories.find(c=>c.id===topic.category_id)?.name||'General Discussion'}
function normalize(v){return String(v||'').trim().toLowerCase().replace(/&amp;/g,'&').replace(/\s+/g,' ')}
function categoryByValue(v){const raw=String(v||'').trim();const n=normalize(raw);const db=state.categories.find(c=>normalize(c.name)===n||normalize(c.slug)===n.replace(/\s+/g,'-'));if(db)return db;const fallback=Object.keys(SUBCATEGORIES).find(name=>normalize(name)===n);return fallback?{id:null,name:fallback,slug:fallback.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}:null}
function populateCategorySelect(){const select=$('#postCategory');if(!select)return;const current=select.value;const source=state.categories.length?state.categories:Object.keys(SUBCATEGORIES).map(name=>({name,icon:''}));select.innerHTML=source.map(c=>`<option value="${esc(c.name)}">${esc(c.icon?c.icon+' ':'')}${esc(c.name)}</option>`).join('');const match=categoryByValue(current)||categoryByValue('General Discussion');if(match)select.value=match.name;ensureSubcategoryField();syncSubs()}
function dbSubs(category){if(!category)return SUBCATEGORIES['General Discussion'];const rows=category.id?state.subcategories.filter(x=>x.category_id===category.id).map(x=>x.name):[];return rows.length?rows:(SUBCATEGORIES[category.name]||SUBCATEGORIES['General Discussion'])}
function dbTags(category,subcategory){const catRows=state.tagPresets.filter(x=>x.category_id===category?.id&&!x.subcategory_id).map(x=>x.tag);const sub=state.subcategories.find(x=>x.category_id===category?.id&&normalize(x.name)===normalize(subcategory));const subRows=state.tagPresets.filter(x=>sub&&x.subcategory_id===sub.id).map(x=>x.tag);return [...catRows,...subRows]}

function filtered(){let list=state.topics.filter(t=>state.active==='All'||categoryName(t)===state.active);if(state.tag)list=list.filter(t=>(t.tags||[]).includes(state.tag));if(state.query){const q=state.query.toLowerCase();list=list.filter(t=>[t.title,t.body,categoryName(t),t.subcategory,...(t.tags||[]),display(state.profiles.get(t.author_id))].join(' ').toLowerCase().includes(q))}const score=t=>(state.replies.get(t.id)||[]).length;return [...list].sort((a,b)=>state.sort==='oldest'?new Date(a.created_at)-new Date(b.created_at):state.sort==='updated'?new Date(b.last_activity_at)-new Date(a.last_activity_at):state.sort==='popular'?reactionCount(b.id)-reactionCount(a.id):state.sort==='replied'?score(b)-score(a):new Date(b.created_at)-new Date(a.created_at))}
function reactionCount(id){return state.reactions.filter(r=>r.topic_id===id&&r.reaction==='heart').length}
function liked(id){return !!state.user&&state.reactions.some(r=>r.topic_id===id&&r.user_id===state.user.id&&r.reaction==='heart')}
function drawCats(){const box=$('#forumCategories');if(!box)return;box.innerHTML=CATEGORIES.map(name=>`<button type="button" class="${state.active===name?'active':''}" data-category="${esc(name)}"><span>${esc(name)}</span><b>${name==='All'?state.topics.length:state.topics.filter(t=>categoryName(t)===name).length}</b></button>`).join('')}
function drawTags(){const counts={};state.topics.forEach(t=>(t.tags||[]).forEach(tag=>counts[tag]=(counts[tag]||0)+1));const tags=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,24);const cloud=$('#forumTagCloud');if(cloud)cloud.innerHTML=tags.map(([tag,n])=>`<button type="button" data-tag="${esc(tag)}" class="${state.tag===tag?'active':''}">#${esc(tag)} <small>${n}</small></button>`).join('')||'<span class="postMeta">Tags appear as discussions are published.</span>';const row=$('#activeTagRow');if(row)row.innerHTML=state.tag?`<span>Filtering by <b>#${esc(state.tag)}</b></span><button type="button" class="smallAction" data-clear-tag>Clear tag</button>`:''}
function replyForm(topic){if(state.replying!==topic.id)return '';return `<form class="inlineReplyComposer" data-reply-form="${topic.id}"><div class="replyComposerHeader"><strong>Write a reply</strong><button type="button" class="replyCloseButton" data-cancel-reply>×</button></div><textarea maxlength="30000" required placeholder="Share feedback, ideas, or support..."></textarea><div class="inlineReplyActions"><button type="button" class="smallAction" data-cancel-reply>Discard</button><button class="primaryButton" type="submit"><span>Post Reply</span><b>→</b></button></div></form>`}
function render(){const list=filtered(),box=$('#postList');if(!box)return;box.innerHTML=list.length?list.map(t=>{const p=state.profiles.get(t.author_id),replies=state.replies.get(t.id)||[],canDelete=state.user&&(state.user.id===t.author_id||staff());return `<article class="forumPost ${t.is_pinned?'forumPostPinned':''} ${t.is_locked?'forumPostLocked':''}" data-post-id="${t.id}">${t.is_pinned?'<div class="pinnedRibbon"><span>📌</span><strong>Pinned Discussion</strong></div>':''}${t.is_locked?'<div class="lockedRibbon">🔒 Replies locked by staff</div>':''}<div class="postTop"><button class="forumAvatarButton" type="button"><img class="avatar" src="${esc(avatar(p))}" alt="${esc(display(p))}"></button><div class="postIdentity"><h3>${esc(t.title)}</h3><div class="postMeta">${esc(display(p))} • ${esc(categoryName(t))}${t.subcategory?` / ${esc(t.subcategory)}`:''} • ${fmt(t.created_at)}</div></div></div><div class="postTags">${(t.tags||[]).map(tag=>`<button type="button" data-tag="${esc(tag)}">#${esc(tag)}</button>`).join('')}</div><div class="postBody">${esc(t.body).replace(/\n/g,'<br>')}</div>${t.image_url?`<div class="postMedia"><img src="${esc(t.image_url)}" alt="Forum attachment"></div>`:''}${t.media_url?`<p><a href="${esc(t.media_url)}" target="_blank" rel="noopener">Open attached link ↗</a></p>`:''}<div class="postActions"><button class="smallAction forumHeartReaction ${liked(t.id)?'is-reacted':''}" type="button" data-like="${t.id}"><span>${liked(t.id)?'♥':'♡'}</span><span>${reactionCount(t.id)}</span><span>${liked(t.id)?'Loved':'Love'}</span></button><button class="smallAction" type="button" data-reply="${t.id}" ${t.is_locked&&!staff()?'disabled':''}>Reply (${replies.length})</button>${staff()?`<button class="smallAction" type="button" data-pin="${t.id}">${t.is_pinned?'Unpin':'Pin'}</button><button class="smallAction" type="button" data-lock="${t.id}">${t.is_locked?'Unlock':'Lock'}</button>`:''}${canDelete?`<button class="smallAction dangerAction" type="button" data-delete="${t.id}">Delete</button>`:''}</div>${replyForm(t)}${replies.map(r=>{const rp=state.profiles.get(r.author_id),canRDelete=state.user&&(state.user.id===r.author_id||staff());return `<div class="forumReply"><img class="avatar" src="${esc(avatar(rp))}" alt="${esc(display(rp))}"><div class="forumReplyContent"><div class="forumReplyHeading"><div><button class="forumAuthorLink" type="button">${esc(display(rp))}</button><span class="forumReplyDate">${fmt(r.created_at)}</span></div>${canRDelete?`<button type="button" class="replyDeleteButton" data-delete-reply="${r.id}">Delete reply</button>`:''}</div><p>${esc(r.body).replace(/\n/g,'<br>')}</p></div></div>`}).join('')}</article>`}).join(''):'<div class="emptyState">No forum posts matched your filters.</div>';drawCats();drawTags()}
function suggestions(){const catValue=$('#postCategory')?.value||'General Discussion',cat=categoryByValue(catValue),sub=$('#postSubcategory')?.value||'',text=`${$('#postForm [name=title]')?.value||''} ${$('#postBody')?.value||''}`.toLowerCase();const db=dbTags(cat,sub),out=db.length?[...db]:[...(TAG_MAP[cat?.name||catValue]||[]),...(SUBCATEGORY_TAGS[sub]||[])];Object.entries(KEYWORDS).forEach(([word,tag])=>{if(text.includes(word))out.push(tag)});return [...new Set(out.map(cleanTag).filter(Boolean))].slice(0,24)}
function syncTags(){const hidden=$('#postTags');if(hidden)hidden.value=[...state.selectedTags].join(',');const sug=$('#suggestedTagButtons');if(sug)sug.innerHTML=suggestions().map(t=>`<button type="button" class="tagChoice ${state.selectedTags.has(t)?'selected':''}" data-pick-tag="${t}"><span class="tagChoiceSignal"></span><span>#${t}</span><b>${state.selectedTags.has(t)?'✓':'+'}</b></button>`).join('');const chips=$('#selectedTagChips');if(chips)chips.innerHTML=state.selectedTags.size?`<span class="selectedTagsLabel">Selected tags</span>${[...state.selectedTags].map(t=>`<span class="selectedTagChip"><span class="selectedTagName">#${t}</span><button type="button" class="selectedTagRemove" data-remove-selected-tag="${t}">×</button></span>`).join('')}`:'<span class="postMeta tagPickerEmpty">Select up to 8 tags or create your own.</span>'}
function addTag(v){const t=cleanTag(v);if(!t)return;if(state.selectedTags.size>=8&&!state.selectedTags.has(t))return toast('You can select up to 8 tags.','Tag limit');state.selectedTags.add(t);syncTags()}
function ensureSubcategoryField(){const form=$('#postForm');if(!form)return null;let sub=$('#postSubcategory');if(sub)return sub;const category=$('#postCategory');const row=category?.closest('.formRow');if(!row)return null;const label=document.createElement('label');label.className='forumSubcategoryField';label.innerHTML='Subcategory<select id="postSubcategory" name="subcategory"></select>';row.appendChild(label);sub=label.querySelector('select');sub.addEventListener('change',syncTags);return sub}
function syncSubs(){const catSelect=$('#postCategory'),sub=ensureSubcategoryField();if(!catSelect||!sub)return;const category=categoryByValue(catSelect.value),current=sub.value,items=dbSubs(category);sub.innerHTML=items.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');if([...sub.options].some(o=>normalize(o.value)===normalize(current)))sub.value=[...sub.options].find(o=>normalize(o.value)===normalize(current)).value;syncTags()}
function openComposer(){if(!state.user){toast('Please sign in before creating a discussion.','Members only');location.href='members.html';return}const c=$('#forumComposer');if(c){c.hidden=false;c.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>$('#postForm [name=title]')?.focus(),300)}}
async function uploadImage(topicId){if(!state.imageFile)return '';const c=supa(),ext=(state.imageFile.name.split('.').pop()||'jpg').toLowerCase(),path=`${state.user.id}/topics/${topicId}.${ext}`;const {error}=await c.storage.from('forum-attachments').upload(path,state.imageFile,{upsert:true,contentType:state.imageFile.type});if(error)throw error;return c.storage.from('forum-attachments').getPublicUrl(path).data.publicUrl}
async function publish(e){
 e.preventDefault();
 const form=e.currentTarget;
 if(!form||!state.user)return openComposer();
 const c=supa(),f=new FormData(form);let category=categoryByValue(f.get('category'));
 if(!category){await loadCategories();category=categoryByValue(f.get('category'))}
 if(!category)return toast('Please choose a valid forum category.','Forum category');
 const selectedSub=String(f.get('subcategory')||'').trim();
 const validSubs=dbSubs(category);if(selectedSub&&!validSubs.some(x=>normalize(x)===normalize(selectedSub)))return toast('That subcategory is not available for this forum section.','Forum subcategory');
 const categorySlug=category.slug||String(category.name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const title=String(f.get('title')||'').trim(),body=String(f.get('body')||'').trim();
 try{
   // The database resolves the category/subcategory by slug and creates the topic
   // atomically. This removes the old local-ID synchronization failure entirely.
   const created=await c.rpc('forum_create_topic',{category_slug_input:categorySlug,subcategory_name_input:selectedSub,title_input:title,body_input:body,tags_input:[...state.selectedTags].slice(0,8),media_url_input:safeUrl(f.get('mediaUrl'))});
   if(created.error)throw created.error;
   const topicId=typeof created.data==='string'?created.data:(created.data?.id||created.data);
   if(!topicId)throw new Error('Supabase created the discussion but did not return its ID.');
   let imageUrl='';
   if(state.imageFile){imageUrl=await uploadImage(topicId);const {error:u}=await c.from('forum_topics').update({image_url:imageUrl}).eq('id',topicId);if(u)throw u}
   const optimistic={id:topicId,category_id:category.id||null,author_id:state.user.id,title,body,tags:[...state.selectedTags].slice(0,8),subcategory:selectedSub,media_url:safeUrl(f.get('mediaUrl')),image_url:imageUrl,is_pinned:false,is_locked:false,is_solved:false,is_featured:false,is_hidden:false,view_count:0,last_activity_at:new Date().toISOString(),created_at:new Date().toISOString(),updated_at:new Date().toISOString()};
   if(!state.topics.some(t=>t.id===topicId))state.topics.unshift(optimistic);
   render();
   form.reset();state.selectedTags.clear();state.imageFile=null;$('#imagePreview').hidden=true;$('#imagePreview').innerHTML='';populateCategorySelect();$('#forumComposer').hidden=true;
   await refresh();
   if(!state.topics.some(t=>t.id===topicId))throw new Error('The discussion was saved, but the forum feed could not retrieve it. Install the v4.13.11 forum feed patch.');
   toast('Your discussion is now live.','Post published')}catch(err){toast(err.message||'Could not publish this discussion.','Forum error')}
}
async function refresh(){try{await Promise.all([getAuth(),loadCategories()]);await loadTopics();render()}catch(err){console.error(err);toast(err.message||'The forum could not load.','Forum connection')}}
function bind(){
 $('#newPostButton')?.addEventListener('click',openComposer);$('#closeComposer')?.addEventListener('click',()=>$('#forumComposer').hidden=true);
 $('#forumSearch')?.addEventListener('input',e=>{state.query=e.target.value;render()});$('#forumSort')?.addEventListener('change',e=>{state.sort=e.target.value;render()});
 $('#forumCategories')?.addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;state.active=b.dataset.category;render()});
 $('#forumTagCloud')?.addEventListener('click',e=>{const b=e.target.closest('[data-tag]');if(!b)return;state.tag=b.dataset.tag;render()});$('#activeTagRow')?.addEventListener('click',e=>{if(e.target.closest('[data-clear-tag]')){state.tag='';render()}});
 $('#postCategory')?.addEventListener('change',syncSubs);$('#postSubcategory')?.addEventListener('change',syncTags);$('#postForm [name=title]')?.addEventListener('input',syncTags);$('#postBody')?.addEventListener('input',syncTags);
 $('#suggestedTagButtons')?.addEventListener('click',e=>{const b=e.target.closest('[data-pick-tag]');if(!b)return;const t=b.dataset.pickTag;state.selectedTags.has(t)?state.selectedTags.delete(t):addTag(t);syncTags()});
 $('#selectedTagChips')?.addEventListener('click',e=>{const b=e.target.closest('[data-remove-selected-tag]');if(!b)return;state.selectedTags.delete(b.dataset.removeSelectedTag);syncTags()});
 $('#addCustomTag')?.addEventListener('click',()=>{addTag($('#customTagInput').value);$('#customTagInput').value=''});$('#customTagInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===','){e.preventDefault();addTag(e.target.value);e.target.value=''}});
 $('#postImage')?.addEventListener('change',e=>{state.imageFile=e.target.files?.[0]||null;const box=$('#imagePreview');if(!state.imageFile){box.hidden=true;box.innerHTML='';return}const url=URL.createObjectURL(state.imageFile);box.hidden=false;box.innerHTML=`<img src="${url}" alt="Post preview"><button type="button" class="smallAction" data-remove-image>Remove image</button>`});$('#imagePreview')?.addEventListener('click',e=>{if(!e.target.closest('[data-remove-image]'))return;state.imageFile=null;$('#postImage').value='';e.currentTarget.hidden=true;e.currentTarget.innerHTML=''});
 $('#saveDraftButton')?.addEventListener('click',()=>{const f=new FormData($('#postForm'));localStorage.setItem('sos_forum_draft_v3',JSON.stringify({category:f.get('category'),subcategory:f.get('subcategory'),title:f.get('title'),body:f.get('body'),mediaUrl:f.get('mediaUrl'),tags:[...state.selectedTags]}));toast('Your draft was saved in this browser.','Draft saved')});
 $('#postForm')?.addEventListener('submit',publish);
 $('#postList')?.addEventListener('click',async e=>{const tag=e.target.closest('[data-tag]');if(tag){state.tag=tag.dataset.tag;render();return}const reply=e.target.closest('[data-reply]');if(reply){if(!state.user)return toast('Please sign in to reply.','Members only');state.replying=state.replying===reply.dataset.reply?'':reply.dataset.reply;render();return}if(e.target.closest('[data-cancel-reply]')){state.replying='';render();return}const like=e.target.closest('[data-like]');if(like){if(!state.user)return toast('Please sign in to react.','Members only');const topicId=like.dataset.like,existing=state.reactions.find(r=>r.topic_id===topicId&&r.user_id===state.user.id&&r.reaction==='heart');const q=existing?await supa().from('forum_reactions').delete().eq('id',existing.id):await supa().from('forum_reactions').insert({user_id:state.user.id,topic_id:topicId,reaction:'heart'});if(q.error)return toast(q.error.message,'Reaction');await refresh();return}const pin=e.target.closest('[data-pin]');if(pin){const t=state.topics.find(x=>x.id===pin.dataset.pin);const {error}=await supa().rpc('forum_set_topic_moderation',{target_topic:t.id,pin_value:!t.is_pinned,lock_value:null});if(error)return toast(error.message,'Moderation');await refresh();return}const lock=e.target.closest('[data-lock]');if(lock){const t=state.topics.find(x=>x.id===lock.dataset.lock);const {error}=await supa().rpc('forum_set_topic_moderation',{target_topic:t.id,pin_value:null,lock_value:!t.is_locked});if(error)return toast(error.message,'Moderation');await refresh();return}const del=e.target.closest('[data-delete]');if(del&&confirm('Delete this discussion and all replies?')){const {error}=await supa().from('forum_topics').delete().eq('id',del.dataset.delete);if(error)return toast(error.message,'Delete');await refresh();return}const dr=e.target.closest('[data-delete-reply]');if(dr&&confirm('Delete this reply?')){const {error}=await supa().from('forum_replies').delete().eq('id',dr.dataset.deleteReply);if(error)return toast(error.message,'Delete');await refresh()}});
 $('#postList')?.addEventListener('submit',async e=>{const form=e.target.closest('[data-reply-form]');if(!form)return;e.preventDefault();const body=form.querySelector('textarea').value.trim();if(!body)return;const {error}=await supa().from('forum_replies').insert({topic_id:form.dataset.replyForm,author_id:state.user.id,body});if(error)return toast(error.message,'Reply');await supa().from('forum_topics').update({last_activity_at:new Date().toISOString()}).eq('id',form.dataset.replyForm);state.replying='';await refresh();toast('Your reply is now live.','Reply posted')});
}
async function boot(){ensureSubcategoryField();bind();syncSubs();if(!supa()){toast('Supabase is not connected. The built-in forum presets remain available, but posting requires Supabase.','Forum setup');return}const draft=JSON.parse(localStorage.getItem('sos_forum_draft_v3')||'null');if(draft){const f=$('#postForm');['category','title','body','mediaUrl'].forEach(k=>{if(f.elements[k])f.elements[k].value=draft[k]||''});syncSubs();if(draft.subcategory)$('#postSubcategory').value=draft.subcategory;state.selectedTags=new Set((draft.tags||[]).map(cleanTag).filter(Boolean));syncTags()}await refresh();const channel=supa().channel('sos-forums-v4137').on('postgres_changes',{event:'*',schema:'public',table:'forum_topics'},refresh).on('postgres_changes',{event:'*',schema:'public',table:'forum_replies'},refresh).subscribe();window.addEventListener('beforeunload',()=>supa()?.removeChannel(channel),{once:true});window.addEventListener('sos:session',refresh)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
