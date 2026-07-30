(() => {
  "use strict";

  const session = window.SOS?.getSession();
  const gate = document.getElementById("collabGate");
  const app = document.getElementById("collabApp");

  if (!session) {
    gate.hidden = false;
    return;
  }

  if (session.role !== "admin" && !session.collaborationAccess) {
    gate.hidden = false;
    gate.innerHTML = `
      <h2>Private collaboration access</h2>
      <p>This studio is invitation-only. Send a collaboration request through the contact page and an admin can approve your account.</p>
      <a class="primaryButton" href="contact.html?type=Collaboration">Request Access</a>
    `;
    return;
  }

  app.hidden = false;

  async function initializeStorageStatus() {
    if (!navigator.storage) return;
    try {
      let persistent = false;
      if (navigator.storage.persisted) persistent = await navigator.storage.persisted();
      if (!persistent && navigator.storage.persist) persistent = await navigator.storage.persist();

      const estimate = navigator.storage.estimate ? await navigator.storage.estimate() : null;
      const notice = app.querySelector(".backendNotice");
      if (!notice || !estimate) return;

      const used = Number(estimate.usage || 0);
      const quota = Number(estimate.quota || 0);
      const percent = quota ? Math.min(100, (used / quota) * 100) : 0;
      notice.insertAdjacentHTML("beforeend", `
        <div class="collabStorageStatus">
          <strong>Browser audio storage: ${formatBytes(used)} of ${formatBytes(quota)}</strong>
          <div class="collabStorageMeter" aria-label="Browser storage used"><span style="width:${percent.toFixed(2)}%"></span></div>
          <span>${persistent ? "Persistent storage is enabled, so the browser is less likely to remove your local audio." : "Storage is browser-managed. Keep backup copies because local files can still be cleared."}</span>
        </div>`);
    } catch (error) {
      console.warn("Could not read browser storage status", error);
    }
  }

  const KEYS = {
    threads: "sos_collab_threads_v1",
    projects: "sos_collab_projects_v1"
  };

  const stages = [
    { name: "Idea", progress: 0 },
    { name: "Writing", progress: 10 },
    { name: "Recording", progress: 20 },
    { name: "Production", progress: 35 },
    { name: "Sound Design", progress: 45 },
    { name: "Arrangement", progress: 55 },
    { name: "Mixing", progress: 70 },
    { name: "Mastering", progress: 82 },
    { name: "Review", progress: 90 },
    { name: "Approved", progress: 95 },
    { name: "Ready for Release", progress: 98 },
    { name: "Released", progress: 100 },
    { name: "On Hold", progress: null },
    { name: "Archived", progress: 100 }
  ];

  const audioExtensions = [
    ".mp3", ".wav", ".wave", ".flac", ".ogg", ".oga", ".m4a", ".aac",
    ".aiff", ".aif", ".opus", ".wma", ".alac", ".mid", ".midi"
  ];


  const AUDIO_DB = "sos_collab_audio_v1";
  const AUDIO_STORE = "files";
  const objectUrls = new Map();

  function openAudioDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(AUDIO_DB, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(AUDIO_STORE)) db.createObjectStore(AUDIO_STORE, { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function saveAudioBlob(file) {
    const id = uid();
    const db = await openAudioDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(AUDIO_STORE, "readwrite");
      tx.objectStore(AUDIO_STORE).put({ id, blob: file, name: file.name, type: file.type, size: file.size, createdAt: Date.now() });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return id;
  }

  async function getAudioBlob(id) {
    if (!id) return null;
    const db = await openAudioDB();
    const row = await new Promise((resolve, reject) => {
      const request = db.transaction(AUDIO_STORE, "readonly").objectStore(AUDIO_STORE).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return row;
  }

  async function deleteAudioBlob(id) {
    if (!id) return;
    if (objectUrls.has(id)) {
      URL.revokeObjectURL(objectUrls.get(id));
      objectUrls.delete(id);
    }
    const db = await openAudioDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(AUDIO_STORE, "readwrite");
      tx.objectStore(AUDIO_STORE).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }

  function formatBytes(bytes = 0) {
    if (!bytes) return "0 KB";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / Math.pow(1024, index)).toFixed(index ? 1 : 0)} ${units[index]}`;
  }

  initializeStorageStatus();

  function canPreviewAudio(attachment) {
    const name = String(attachment?.name || "").toLowerCase();
    return /audio\/(mpeg|mp3|wav|wave|ogg|aac|mp4|x-m4a|flac|opus)/i.test(attachment?.type || "") ||
      [".mp3", ".wav", ".wave", ".ogg", ".oga", ".m4a", ".aac", ".flac", ".opus"].some(ext => name.endsWith(ext));
  }

  // Audio blobs are loaded only when a player or download link is close to the viewport.
  // Loading every stored file at page startup caused large projects to freeze the tab.
  const audioHydrationTasks = new Map();
  let audioObserver = null;

  async function hydrateAudioNode(node) {
    if (!node || node.dataset.audioHydrated === "true") return;
    const id = node.dataset.audioBlob;
    if (!id) return;

    try {
      let url = objectUrls.get(id);
      if (!url) {
        let task = audioHydrationTasks.get(id);
        if (!task) {
          task = getAudioBlob(id).then(row => {
            if (!row?.blob) throw new Error("Audio data is missing");
            const createdUrl = URL.createObjectURL(row.blob);
            objectUrls.set(id, createdUrl);
            return createdUrl;
          }).finally(() => audioHydrationTasks.delete(id));
          audioHydrationTasks.set(id, task);
        }
        url = await task;
      }

      if (!node.isConnected) return;
      if (node.tagName === "A") node.href = url;
      else node.src = url;
      node.dataset.audioHydrated = "true";
      node.removeAttribute("data-audio-pending");
    } catch (error) {
      node.setAttribute("data-audio-error", "true");
      if (node.tagName === "A") node.removeAttribute("href");
    }
  }

  function hydrateAudioElements(scope = document) {
    const nodes = [...scope.querySelectorAll("[data-audio-blob]:not([data-audio-hydrated='true'])")];
    if (!nodes.length) return;

    if (!("IntersectionObserver" in window)) {
      nodes.slice(0, 6).forEach(node => hydrateAudioNode(node));
      return;
    }

    if (!audioObserver) {
      audioObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          audioObserver.unobserve(entry.target);
          hydrateAudioNode(entry.target);
        });
      }, { rootMargin: "240px 0px" });
    }

    nodes.forEach(node => audioObserver.observe(node));
  }

  const uid = () => crypto.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const esc = value => String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);

  const users = SOS.read(SOS.K.users, []);
  const contacts = users.filter(user =>
    user.id !== session.id && (user.role === "admin" || user.collaborationAccess)
  );

  let selectedUser = contacts[0] || null;
  let selectedProject = null;
  let pendingFile = null;
  let projectSort = localStorage.getItem("sos_collab_sort_v1") || "updated";
  const MAX_CHAT_MESSAGES = 80;
  const MAX_AUDIO_HISTORY = 30;
  let projectsCache = SOS.read(KEYS.projects, []);
  let threadsCache = {};
  let threadsReady = false;
  let oversizedThreadBackup = null;
  const threadIndex = new Map();

  function parseJsonOffMainThread(raw) {
    if (!raw) return Promise.resolve({});
    if (raw.length < 250000 || !("Worker" in window)) {
      try { return Promise.resolve(JSON.parse(raw)); }
      catch { return Promise.resolve({}); }
    }

    return new Promise(resolve => {
      const workerSource = `self.onmessage = event => { try { self.postMessage({ok:true,value:JSON.parse(event.data)}); } catch (error) { self.postMessage({ok:false}); } };`;
      const workerUrl = URL.createObjectURL(new Blob([workerSource], { type: "text/javascript" }));
      const worker = new Worker(workerUrl);
      const finish = value => { worker.terminate(); URL.revokeObjectURL(workerUrl); resolve(value); };
      worker.onmessage = event => finish(event.data?.ok ? event.data.value : {});
      worker.onerror = () => finish({});
      worker.postMessage(raw);
    });
  }

  function rebuildThreadIndex() {
    threadIndex.clear();
    Object.entries(threadsCache || {}).forEach(([key, value]) => {
      if (!Array.isArray(value)) return;
      if (key.startsWith("project::")) {
        threadIndex.set(key.slice(9), value);
        return;
      }
      value.forEach(message => {
        if (!message?.projectId) return;
        const rows = threadIndex.get(message.projectId) || [];
        rows.push(message);
        threadIndex.set(message.projectId, rows);
      });
    });
  }

  async function loadThreadsCache() {
    const raw = localStorage.getItem(KEYS.threads);
    // Older builds stored entire audio files as base64 inside localStorage. Parsing one of
    // those multi-megabyte records can lock Firefox's main thread before the page finishes.
    // Keep that data untouched and open the studio in recovery mode instead.
    if (raw && raw.length > 4000000) {
      oversizedThreadBackup = raw;
      threadsCache = {};
      threadsReady = true;
      rebuildThreadIndex();
      showOversizedRecoveryNotice();
      return;
    }
    threadsCache = await parseJsonOffMainThread(raw);
    if (!threadsCache || typeof threadsCache !== "object" || Array.isArray(threadsCache)) threadsCache = {};
    threadsReady = true;
    rebuildThreadIndex();
  }

  function showOversizedRecoveryNotice() {
    const notice = app.querySelector(".backendNotice");
    if (!notice || notice.querySelector(".collabRecoveryNotice")) return;
    const panel = document.createElement("div");
    panel.className = "collabRecoveryNotice";
    panel.innerHTML = `
      <strong>Performance recovery mode is active</strong>
      <span>An older version saved very large audio data inside the chat record. It has been left untouched, but it is not being parsed automatically because that is what freezes the browser.</span>
      <div class="collabRecoveryActions">
        <button class="smallAction" type="button" data-download-collab-backup>Download old chat backup</button>
        <button class="smallAction dangerAction" type="button" data-reset-collab-history>Reset old chat history</button>
      </div>`;
    notice.appendChild(panel);
  }

  const contactList = document.getElementById("contactList");
  const projectList = document.getElementById("projectList");
  if (projectList && !document.getElementById("collabProjectSort")) {
    const tools=document.createElement("div"); tools.className="collabSortTools";
    tools.innerHTML=`<label>Project order<select id="collabProjectSort"><option value="updated">Recently updated</option><option value="newest">Newest created</option><option value="oldest">Oldest created</option><option value="az">Name A–Z</option><option value="za">Name Z–A</option></select></label></div>`;
    projectList.parentNode.insertBefore(tools, projectList);
    const sortSelect=tools.querySelector("select"); sortSelect.value=projectSort;
    sortSelect.addEventListener("change",()=>{projectSort=sortSelect.value;localStorage.setItem("sos_collab_sort_v1",projectSort);renderProjects();});
  }
  const messagesHost = document.getElementById("collabMessages");
  const inspector = document.querySelector(".collabInspector");

  function readThreads() {
    return threadsCache;
  }

  function saveThreads(value) {
    threadsCache = value;
    rebuildThreadIndex();
    SOS.write(KEYS.threads, value);
  }

  function readProjects() {
    return projectsCache;
  }

  function saveProjects(value) {
    projectsCache = value;
    SOS.write(KEYS.projects, value);
    if (document.getElementById("collabAccessRosterList")) renderAccessRoster();
  }

  function threadKey(projectId) {
    return `project::${projectId}`;
  }

  function seed() {
    if (readProjects().length || !contacts[0]) return;

    saveProjects([{
      id: uid(),
      title: "First Collaboration",
      ownerId: session.id,
      memberIds: [session.id, contacts[0].id],
      status: "Idea",
      progress: 0,
      notes: "Use this space for arrangement ideas, mix revisions, deadlines, and release plans.",
      createdAt: Date.now()
    }]);
  }

  seed();

  const accessRoster = document.createElement("section");
  accessRoster.className = "collabAccessRoster";
  accessRoster.innerHTML = `
    <div class="collabManagerHead">
      <div>
        <p class="sectionEyebrow">Studio Directory</p>
        <h3>People with collaboration access</h3>
      </div>
      <span class="statusPill" id="collabAccessCount">0 people</span>
    </div>
    <div id="collabAccessRosterList" class="collabAccessRosterList"></div>
  `;
  inspector.prepend(accessRoster);

  function renderAccessRoster() {
    const currentUsers = SOS.read(SOS.K.users, []);
    const approved = currentUsers.filter(user => user.role === "admin" || user.collaborationAccess);
    const host = document.getElementById("collabAccessRosterList");
    const count = document.getElementById("collabAccessCount");
    if (count) count.textContent = `${approved.length} ${approved.length === 1 ? "person" : "people"}`;
    if (!host) return;
    host.innerHTML = approved.length ? approved.map(user => {
      const projects = readProjects().filter(project => (project.memberIds || []).includes(user.id)).length;
      const isYou = user.id === session.id;
      return `
        <button class="collabRosterPerson ${isYou ? "isYou" : ""}" type="button" data-directory-user="${esc(user.id)}" aria-label="View ${esc(user.displayName)} collaboration work">
          <img src="${esc(user.avatar || "assets/images/sos-logo.png")}" alt="">
          <div>
            <strong>${esc(user.displayName)}${isYou ? " (You)" : ""}</strong>
            <small>${esc(user.role === "admin" ? "Administrator" : "Approved collaborator")} • ${projects} project${projects === 1 ? "" : "s"}</small>
          </div>
          <span class="collabOnlineDot" title="Has studio access"></span>
        </button>`;
    }).join("") : '<div class="emptyState">No members currently have Collaboration Studio access.</div>';
  }

  renderAccessRoster();

  const manager = document.createElement("section");
  manager.className = "collabMemberManager";
  manager.innerHTML = `
    <div class="collabManagerHead">
      <div>
        <p class="sectionEyebrow">Project Access</p>
        <h3>Manage collaborators</h3>
      </div>
      <span class="statusPill">Owner / Admin</span>
    </div>
    <div id="collabMemberChoices" class="collabMemberChoices"></div>
  `;
  inspector.prepend(manager);
  manager.after(accessRoster);

  const progressPanel = document.createElement("section");
  progressPanel.className = "collabProgressPanel";
  progressPanel.innerHTML = `
    <div class="collabProgressHead">
      <div>
        <p class="sectionEyebrow">Completion</p>
        <h3>Project progression</h3>
      </div>
      <strong id="collabProgressValue">0%</strong>
    </div>
    <div class="collabProgressTrack"><i id="collabProgressFill"></i></div>
    <input id="collabProgressRange" type="range" min="0" max="100" step="1" value="0">
    <div id="collabProgressMilestones" class="collabProgressMilestones"></div>
    <div id="collabProgressState" class="collabProgressState">Idea</div>
  `;
  accessRoster.after(progressPanel);

  const projectActions = document.createElement("div");
  projectActions.className = "collabProjectActions";
  projectActions.innerHTML = `
    <button class="smallAction dangerAction" id="deleteProjectButton" type="button">Remove Project</button>
  `;
  inspector.append(projectActions);

  const modal = document.createElement("div");
  modal.className = "collabModal";
  modal.id = "collabProjectModal";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="collabModalBackdrop" data-close-project-modal></div>
    <section class="collabModalCard" role="dialog" aria-modal="true" aria-labelledby="collabProjectModalTitle">
      <button class="collabModalClose" type="button" aria-label="Close project creator" data-close-project-modal>×</button>
      <div class="collabModalGlow"></div>
      <p class="sectionEyebrow">New Creative Workspace</p>
      <h2 id="collabProjectModalTitle">Create a collaboration project</h2>
      <p class="collabModalIntro">Give every release its own private conversation, team, notes, audio versions, and production progression.</p>
      <form id="newCollabProjectForm" class="collabProjectForm">
        <label>
          Project name
          <input name="title" maxlength="80" placeholder="Midnight Frequency" required>
        </label>
        <label>
          First collaborator
          <select name="collaboratorId" required></select>
        </label>
        <label>
          Starting stage
          <select name="status"></select>
        </label>
        <label class="collabFormWide">
          Project notes
          <textarea name="notes" maxlength="1200" placeholder="Describe the idea, key, BPM, deadline, or first production goal..."></textarea>
        </label>
        <div class="collabModalActions collabFormWide">
          <button class="smallAction" type="button" data-close-project-modal>Cancel</button>
          <button class="primaryButton" type="submit">Create Project</button>
        </div>
      </form>
    </section>
  `;
  document.body.appendChild(modal);

  function relevantProjects() {
    return readProjects().filter(project =>
      (project.memberIds || []).includes(session.id) || session.role === "admin"
    );
  }

  function projectMembers(project) {
    return (project?.memberIds || []).map(id => users.find(user => user.id === id) || (id === session.id ? session : null)).filter(Boolean);
  }

  function projectMessages(projectId = selectedProject?.id) {
    if (!projectId) return [];
    return threadIndex.get(projectId) || [];
  }

  function statusForProgress(value) {
    const available = stages.filter(stage => stage.progress !== null && !["Archived"].includes(stage.name));
    return available.reduce((closest, stage) => {
      return Math.abs(stage.progress - value) < Math.abs(closest.progress - value) ? stage : closest;
    }, available[0]);
  }

  function statusClass(status) {
    return status === "On Hold" ? "isOnHold" : status === "Released" ? "isReleased" : "";
  }

  function renderContacts() {
    contactList.innerHTML = contacts.length
      ? contacts.map(user => `
          <button class="collabContact ${selectedUser?.id === user.id ? "active" : ""}" data-contact="${user.id}" type="button">
            <img src="${esc(user.avatar || "assets/images/sos-logo.png")}" alt="">
            <span>
              <strong>${esc(user.displayName)}</strong>
              <small>${esc(user.role || "member")}${user.paidMember ? " • VIP" : ""}</small>
            </span>
          </button>
        `).join("")
      : '<div class="emptyState">No approved collaborators are available yet.</div>';
  }

  function renderProjects() {
    const projects = relevantProjects().slice(0, 60);
    projects.sort((a,b) => {
      if (projectSort === "oldest") return new Date(a.createdAt||a.date||0)-new Date(b.createdAt||b.date||0);
      if (projectSort === "newest") return new Date(b.createdAt||b.date||0)-new Date(a.createdAt||a.date||0);
      if (projectSort === "az") return String(a.title||"").localeCompare(String(b.title||""));
      if (projectSort === "za") return String(b.title||"").localeCompare(String(a.title||""));
      return new Date(b.updatedAt||b.createdAt||b.date||0)-new Date(a.updatedAt||a.createdAt||a.date||0);
    });

    projectList.innerHTML = projects.length
      ? projects.map(project => {
          const count = projectMessages(project.id).length;
          const members = projectMembers(project).length;
          return `
            <button class="projectCard ${selectedProject?.id === project.id ? "active" : ""} ${statusClass(project.status)}" data-project="${project.id}" type="button">
              <span class="projectCardTop">
                <strong>${esc(project.title)}</strong>
                <small>${count} message${count === 1 ? "" : "s"}</small>
              </span>
              <div class="projectMiniProgress"><i style="width:${Number(project.progress || 0)}%"></i></div>
              <div class="projectCardMeta">
                <span class="statusPill ${statusClass(project.status)}">${esc(project.status)}</span>
                <small>${Number(project.progress || 0)}% • ${members} member${members === 1 ? "" : "s"}</small>
              </div>
            </button>
          `;
        }).join("")
      : '<div class="emptyState">No projects yet. Create one to open a private project chat.</div>';
  }

  function attachmentHtml(attachment, messageId = "") {
    if (!attachment) return "";

    const safeName = esc(attachment.name);
    const preview = canPreviewAudio(attachment);
    const blobAttr = attachment.blobId ? `data-audio-blob="${esc(attachment.blobId)}" data-audio-pending="true"` : "";
    const isLegacy = !attachment.blobId && Boolean(attachment.dataUrl || attachment.url);

    return `
      <div class="collabAttachment">
        <div class="collabAttachmentHeading">
          <span>Audio Version</span>
          <strong>${safeName}</strong>
          <small>${formatBytes(attachment.size)} • ${esc((attachment.type || "audio file").replace("audio/", "").toUpperCase())}</small>
        </div>
        ${attachment.blobId && preview ? `<audio controls preload="none" ${blobAttr}></audio>` : isLegacy ? `<div class="collabUnsupportedPreview">Legacy browser audio is kept unloaded so the page stays responsive.</div>` : `<div class="collabUnsupportedPreview">Preview is not supported by this browser, but the file is stored.</div>`}
        <div class="collabAttachmentActions">
          ${attachment.blobId ? `<a class="smallAction" ${blobAttr} download="${safeName}">Download Audio</a>` : isLegacy ? `<button class="smallAction" type="button" data-migrate-legacy-audio="${esc(messageId)}">Load / Convert Audio</button>` : ""}
          ${messageId && canManage() ? `<button class="smallAction dangerAction" type="button" data-delete-audio-message="${esc(messageId)}">Delete Version</button>` : ""}
        </div>
      </div>
    `;
  }

  function renderConversation() {
    const title = document.getElementById("conversationTitle");
    const subtitle = document.getElementById("conversationSubtitle");

    if (!selectedProject) {
      if (selectedUser) {
        const shared = relevantProjects().filter(project => (project.memberIds || []).includes(selectedUser.id));
        title.textContent = selectedUser.id === session.id ? "Your collaboration work" : selectedUser.displayName;
        subtitle.textContent = shared.length
          ? `${shared.length} accessible workspace${shared.length === 1 ? "" : "s"} — choose one below to open it.`
          : "This collaborator has studio access, but there are no shared workspaces available to you yet.";
        messagesHost.innerHTML = `
          <section class="collabPersonWorkspace">
            <div class="collabPersonIdentity">
              <img src="${esc(selectedUser.avatar || "assets/images/sos-logo.png")}" alt="">
              <div><p class="sectionEyebrow">Collaborator Workspace</p><h3>${esc(selectedUser.displayName)}${selectedUser.id === session.id ? " (You)" : ""}</h3><small>${esc(selectedUser.role === "admin" ? "Administrator" : "Approved collaborator")}</small></div>
            </div>
            <div class="collabPersonProjects">
              ${shared.length ? shared.map(project => `
                <button class="collabSharedProjectCard ${statusClass(project.status)}" type="button" data-open-shared-project="${esc(project.id)}">
                  <span><strong>${esc(project.title)}</strong><small>${esc(project.status)} • ${Number(project.progress || 0)}%</small></span>
                  <span>Open workspace →</span>
                </button>`).join("") : '<div class="emptyState">No shared projects are available. You do not need to create a project just to view the collaborator directory.</div>'}
            </div>
          </section>`;
      } else {
        title.textContent = "Choose a collaborator";
        subtitle.textContent = "Select a person from Artists or Studio Directory to view accessible work.";
        messagesHost.innerHTML = '<div class="collabEmpty">Choose a collaborator to view their accessible projects.</div>';
      }
      return;
    }

    const members = projectMembers(selectedProject);
    title.textContent = selectedProject.title;
    subtitle.textContent = `${members.length} collaborator${members.length === 1 ? "" : "s"} • Separate project conversation`;

    const allRows = projectMessages();
    const rows = allRows.slice(-MAX_CHAT_MESSAGES);
    const hiddenCount = Math.max(0, allRows.length - rows.length);
    messagesHost.innerHTML = rows.length
      ? `${hiddenCount ? `<div class="collabPerformanceNotice">Showing the newest ${MAX_CHAT_MESSAGES} messages for smooth performance. ${hiddenCount} older message${hiddenCount === 1 ? " is" : "s are"} safely stored.</div>` : ""}${rows.map(message => {
          const sender = users.find(user => user.id === message.senderId) || (message.senderId === session.id ? session : null);
          return `
            <article class="collabBubble ${message.senderId === session.id ? "mine" : ""}" data-collab-message-id="${esc(message.id)}">
              <header>
                <strong>${esc(message.senderId === session.id ? "You" : sender?.displayName || "Collaborator")}</strong>
                <time>${new Date(message.createdAt).toLocaleString()}</time>
              </header>
              ${message.text ? `<p>${esc(message.text)}</p>` : ""}
              ${attachmentHtml(message.attachment, message.id)}
            </article>
          `;
        }).join("")}`
      : '<div class="collabEmpty">This project chat is empty. Share an idea, update, or audio version.</div>';

    hydrateAudioElements(messagesHost);
    messagesHost.scrollTop = messagesHost.scrollHeight;
  }

  function canManage() {
    return selectedProject && (session.role === "admin" || selectedProject.ownerId === session.id);
  }

  function renderManager() {
    const host = document.getElementById("collabMemberChoices");

    if (!selectedProject) {
      host.innerHTML = '<div class="emptyState">Select a project to manage its team.</div>';
      return;
    }

    const editable = canManage();
    host.innerHTML = users
      .filter(user => user.role === "admin" || user.collaborationAccess || user.id === session.id)
      .map(user => {
        const added = (selectedProject.memberIds || []).includes(user.id);
        const locked = user.id === selectedProject.ownerId;
        return `
          <article class="collabMemberChoice ${added ? "isAdded" : ""}">
            <img src="${esc(user.avatar || "assets/images/sos-logo.png")}" alt="">
            <div>
              <strong>${esc(user.displayName)}</strong>
              <small>${esc(user.role || "member")}</small>
            </div>
            <button
              type="button"
              class="smallAction ${added && !locked ? "dangerAction" : ""}"
              data-member-toggle="${user.id}"
              ${!editable || locked ? "disabled" : ""}
            >${locked ? "Owner" : added ? "Remove" : "Add"}</button>
          </article>
        `;
      }).join("");
  }

  function renderMilestones() {
    const host = document.getElementById("collabProgressMilestones");
    host.innerHTML = stages
      .filter(stage => stage.progress !== null && !["Archived"].includes(stage.name))
      .map(stage => `<span class="collabMilestoneTick" style="left:${stage.progress}%" title="${esc(stage.name)}" aria-label="${esc(stage.name)}"></span>`)
      .join("");
  }

  function renderProgress() {
    const value = Math.max(0, Math.min(100, Number(selectedProject?.progress || 0)));
    const onHold = selectedProject?.status === "On Hold";
    const currentStage = onHold ? { name: "On Hold" } : statusForProgress(value);
    const state = document.getElementById("collabProgressState");
    const fill = document.getElementById("collabProgressFill");

    document.getElementById("collabProgressValue").textContent = `${value}%`;
    fill.style.width = `${value}%`;
    document.getElementById("collabProgressRange").value = value;
    document.getElementById("collabProgressRange").disabled = !canManage() || onHold;
    state.textContent = currentStage.name;

    progressPanel.classList.toggle("isOnHold", onHold);
    state.classList.toggle("isOnHold", onHold);
    fill.classList.toggle("isOnHold", onHold);
    renderMilestones();
  }

  function renderInspector() {
    const project = selectedProject;
    const activeStatus = document.getElementById("activeProjectStatus");

    document.getElementById("projectTitle").textContent = project?.title || "Project Details";
    activeStatus.textContent = project ? `${project.status} • ${Number(project.progress || 0)}%` : "No project selected";
    activeStatus.className = `statusPill ${project ? statusClass(project.status) : ""}`;

    document.getElementById("statusGrid").innerHTML = stages.map(stage => `
      <button
        type="button"
        class="statusButton ${project?.status === stage.name ? "active" : ""} ${statusClass(stage.name)}"
        data-status="${esc(stage.name)}"
        data-stage-progress="${stage.progress ?? ""}"
        ${project && canManage() ? "" : "disabled"}
      >${esc(stage.name)}</button>
    `).join("");

    const notes = document.getElementById("projectNotes");
    notes.value = project?.notes || "";
    notes.disabled = !project || !canManage();

    document.getElementById("projectMembers").innerHTML = projectMembers(project)
      .map(user => `<span class="memberChip">${esc(user.displayName || "Member")}</span>`)
      .join("") || '<span class="memberChip">No collaborators selected</span>';

    const allFiles = projectMessages().filter(message => message.attachment);
    const files = allFiles.slice(-MAX_AUDIO_HISTORY);
    const filesHost = document.getElementById("projectFiles");
    filesHost.innerHTML = files.length
      ? `${allFiles.length > files.length ? `<div class="collabPerformanceNotice">Showing the newest ${MAX_AUDIO_HISTORY} audio versions to keep this page responsive.</div>` : ""}${files.slice().reverse().map((message, index) => {
          const attachment = message.attachment;
          const isLegacy = !attachment.blobId && Boolean(attachment.dataUrl || attachment.url);
          const blobAttr = attachment.blobId ? `data-audio-blob="${esc(attachment.blobId)}" data-audio-pending="true"` : "";
          return `
          <article class="adminListItem collabAudioHistoryItem">
            <div class="collabVersionMeta">
              <span class="collabVersionBadge">v${files.length - index}</span>
              <div><strong>${esc(attachment.name)}</strong><small>${formatBytes(attachment.size)} • ${new Date(message.createdAt).toLocaleString()}</small></div>
            </div>
            ${attachment.blobId && canPreviewAudio(attachment) ? `<audio controls preload="none" ${blobAttr}></audio>` : isLegacy ? `<div class="collabUnsupportedPreview">Legacy audio is unloaded until requested.</div>` : `<div class="collabUnsupportedPreview">Download-only format in this browser.</div>`}
            <div class="collabAttachmentActions">
              ${attachment.blobId ? `<a class="smallAction" ${blobAttr} download="${esc(attachment.name)}">Download</a>` : isLegacy ? `<button class="smallAction" type="button" data-migrate-legacy-audio="${esc(message.id)}">Load / Convert</button>` : ""}
              ${canManage() ? `<button class="smallAction dangerAction" type="button" data-delete-audio-message="${esc(message.id)}">Delete</button>` : ""}
            </div>
          </article>`;
        }).join("")}`
      : '<div class="emptyState">No audio versions yet. Drag an audio file into the reply composer to begin version history.</div>';
    hydrateAudioElements(filesHost);

    document.getElementById("deleteProjectButton").hidden = !canManage();
    renderManager();
    renderProgress();
  }

  function renderAll() {
    renderContacts();
    renderProjects();
    renderConversation();
    renderInspector();
  }

  function openProjectModal() {
    if (!contacts.length) {
      SOS.toast("An admin must approve another collaborator first.", { title: "No collaborator available" });
      return;
    }

    const form = modal.querySelector("#newCollabProjectForm");
    form.elements.collaboratorId.innerHTML = contacts.map(user => `
      <option value="${user.id}" ${selectedUser?.id === user.id ? "selected" : ""}>${esc(user.displayName)}</option>
    `).join("");
    form.elements.status.innerHTML = stages
      .filter(stage => stage.progress !== null && !["Archived", "Released"].includes(stage.name))
      .map(stage => `<option value="${esc(stage.name)}">${esc(stage.name)} • ${stage.progress}%</option>`)
      .join("");

    modal.hidden = false;
    document.body.classList.add("collabModalOpen");
    requestAnimationFrame(() => modal.classList.add("open"));
    setTimeout(() => form.elements.title.focus(), 80);
  }

  function closeProjectModal() {
    modal.classList.remove("open");
    document.body.classList.remove("collabModalOpen");
    setTimeout(() => {
      modal.hidden = true;
      modal.querySelector("#newCollabProjectForm").reset();
    }, 260);
  }

  contactList.addEventListener("click", event => {
    const button = event.target.closest("[data-contact]");
    if (!button) return;

    selectedUser = contacts.find(user => user.id === button.dataset.contact) || null;
    selectedProject = selectedUser
      ? relevantProjects().find(project => (project.memberIds || []).includes(selectedUser.id)) || null
      : null;
    renderAll();
  });


  accessRoster.addEventListener("click", event => {
    const button = event.target.closest("[data-directory-user]");
    if (!button) return;

    const currentUsers = SOS.read(SOS.K.users, []);
    selectedUser = currentUsers.find(user => user.id === button.dataset.directoryUser)
      || (button.dataset.directoryUser === session.id ? session : null);
    selectedProject = selectedUser
      ? relevantProjects().find(project => (project.memberIds || []).includes(selectedUser.id)) || null
      : null;
    renderAll();
  });

  messagesHost.addEventListener("click", event => {
    const button = event.target.closest("[data-open-shared-project]");
    if (!button) return;
    selectedProject = relevantProjects().find(project => project.id === button.dataset.openSharedProject) || null;
    if (selectedProject) renderAll();
  });

  projectList.addEventListener("click", event => {
    const button = event.target.closest("[data-project]");
    if (!button) return;

    selectedProject = readProjects().find(project => project.id === button.dataset.project) || null;
    const other = projectMembers(selectedProject).find(user => user.id !== session.id);
    selectedUser = contacts.find(user => user.id === other?.id) || contacts[0] || null;
    renderAll();
  });

  document.getElementById("newProjectButton").addEventListener("click", openProjectModal);

  modal.addEventListener("click", event => {
    if (event.target.closest("[data-close-project-modal]")) closeProjectModal();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.hidden) closeProjectModal();
  });

  modal.querySelector("#newCollabProjectForm").addEventListener("submit", event => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(event.currentTarget));
    const collaborator = contacts.find(user => user.id === data.collaboratorId);
    const stage = stages.find(item => item.name === data.status) || stages[0];
    if (!collaborator || !data.title.trim()) return;

    const projects = readProjects();
    const project = {
      id: uid(),
      title: data.title.trim(),
      ownerId: session.id,
      memberIds: [session.id, collaborator.id],
      status: stage.name,
      progress: stage.progress ?? 0,
      notes: data.notes.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    projects.push(project);
    saveProjects(projects);
    selectedProject = project;
    selectedUser = collaborator;
    closeProjectModal();
    SOS.toast("Your private project workspace is ready.", { title: "Collaboration created" });
    renderAll();
  });

  document.getElementById("statusGrid").addEventListener("click", event => {
    const button = event.target.closest("[data-status]");
    if (!button || !selectedProject || !canManage()) return;

    const projects = readProjects();
    const project = projects.find(item => item.id === selectedProject.id);
    const stage = stages.find(item => item.name === button.dataset.status);
    if (!project || !stage) return;

    project.status = stage.name;
    if (stage.progress !== null) project.progress = stage.progress;
    project.updatedAt = Date.now();
    saveProjects(projects);
    selectedProject = project;
    renderAll();
  });

  manager.addEventListener("click", event => {
    const button = event.target.closest("[data-member-toggle]");
    if (!button || !selectedProject || !canManage()) return;

    const id = button.dataset.memberToggle;
    const projects = readProjects();
    const project = projects.find(item => item.id === selectedProject.id);
    project.memberIds = project.memberIds || [];

    if (project.memberIds.includes(id)) {
      project.memberIds = project.memberIds.filter(memberId => memberId !== id);
    } else {
      project.memberIds.push(id);
    }

    project.updatedAt = Date.now();
    saveProjects(projects);
    selectedProject = project;
    SOS.toast(project.memberIds.includes(id) ? "Collaborator added." : "Collaborator removed.", {
      title: "Project team updated"
    });
    renderAll();
  });

  const range = document.getElementById("collabProgressRange");
  range.addEventListener("input", event => {
    const value = Number(event.target.value);
    const stage = statusForProgress(value);
    document.getElementById("collabProgressValue").textContent = `${value}%`;
    document.getElementById("collabProgressFill").style.width = `${value}%`;
    document.getElementById("collabProgressState").textContent = stage.name;
  });

  range.addEventListener("change", event => {
    if (!selectedProject || !canManage()) return;

    const projects = readProjects();
    const project = projects.find(item => item.id === selectedProject.id);
    const value = Number(event.target.value);
    const stage = statusForProgress(value);

    project.progress = value;
    project.status = stage.name;
    project.updatedAt = Date.now();
    saveProjects(projects);
    selectedProject = project;
    renderAll();
  });

  document.getElementById("saveNotes").addEventListener("click", () => {
    if (!selectedProject || !canManage()) return;

    const projects = readProjects();
    const project = projects.find(item => item.id === selectedProject.id);
    project.notes = document.getElementById("projectNotes").value;
    project.updatedAt = Date.now();
    saveProjects(projects);
    selectedProject = project;
    SOS.toast("Project notes saved.", { title: "Collaboration Studio" });
  });

  const deleteModal = document.createElement("div");
  deleteModal.className = "collabModal collabDeleteModal";
  deleteModal.hidden = true;
  deleteModal.innerHTML = `
    <div class="collabModalBackdrop" data-close-delete-modal></div>
    <section class="collabModalCard collabDeleteCard" role="alertdialog" aria-modal="true" aria-labelledby="collabDeleteTitle">
      <button class="collabModalClose" type="button" aria-label="Close remove project dialog" data-close-delete-modal>×</button>
      <p class="sectionEyebrow">Remove Workspace</p>
      <h2 id="collabDeleteTitle">Remove this collaboration?</h2>
      <p id="collabDeleteCopy" class="collabModalIntro"></p>
      <div class="collabDeleteWarning">The project's local conversation and audio history will be removed from this browser.</div>
      <div class="collabModalActions">
        <button class="smallAction" type="button" data-close-delete-modal>Keep Project</button>
        <button class="primaryButton collabDangerButton" id="confirmDeleteProject" type="button">Remove Project</button>
      </div>
    </section>
  `;
  document.body.appendChild(deleteModal);

  function closeDeleteModal() {
    deleteModal.classList.remove("open");
    document.body.classList.remove("collabModalOpen");
    setTimeout(() => { deleteModal.hidden = true; }, 260);
  }

  document.getElementById("deleteProjectButton").addEventListener("click", () => {
    if (!selectedProject || !canManage()) return;
    document.getElementById("collabDeleteCopy").textContent = `You are about to remove “${selectedProject.title}”.`;
    deleteModal.hidden = false;
    document.body.classList.add("collabModalOpen");
    requestAnimationFrame(() => deleteModal.classList.add("open"));
  });

  deleteModal.addEventListener("click", event => {
    if (event.target.closest("[data-close-delete-modal]")) closeDeleteModal();
  });

  document.getElementById("confirmDeleteProject").addEventListener("click", () => {
    if (!selectedProject || !canManage()) return;
    const projectId = selectedProject.id;
    saveProjects(readProjects().filter(project => project.id !== projectId));
    const threads = readThreads();
    delete threads[threadKey(projectId)];
    saveThreads(threads);
    closeDeleteModal();

    selectedProject = relevantProjects()[0] || null;
    selectedUser = selectedProject ? projectMembers(selectedProject).find(user => user.id !== session.id) || contacts[0] || null : contacts[0] || null;
    SOS.toast("Project removed from this browser.", { title: "Collaboration removed" });
    renderAll();
  });

  const fileInput = document.getElementById("messageFile");
  const attachmentPreview = document.getElementById("attachmentPreview");
  const composer = document.getElementById("messageForm");

  function setPendingAudio(file) {
    pendingFile = null;
    if (!file) {
      attachmentPreview.textContent = "No audio selected";
      composer.classList.remove("hasAudio", "isUploading");
      return false;
    }

    const lowerName = file.name.toLowerCase();
    const validAudio = file.type.startsWith("audio/") || audioExtensions.some(extension => lowerName.endsWith(extension));
    if (!validAudio) {
      SOS.toast("Choose an audio file such as MP3, WAV, FLAC, OGG, M4A, AAC, AIFF, ALAC, OPUS, WMA, or MIDI.", { title: "Audio files only" });
      fileInput.value = "";
      attachmentPreview.textContent = "No audio selected";
      return false;
    }

    pendingFile = file;
    attachmentPreview.innerHTML = `<strong>${esc(file.name)}</strong><span>${formatBytes(file.size)} • ready to upload</span>`;
    composer.classList.add("hasAudio");
    return true;
  }

  fileInput.addEventListener("change", () => setPendingAudio(fileInput.files[0]));

  ["dragenter", "dragover"].forEach(type => composer.addEventListener(type, event => {
    event.preventDefault();
    composer.classList.add("isDraggingAudio");
  }));
  ["dragleave", "drop"].forEach(type => composer.addEventListener(type, event => {
    event.preventDefault();
    composer.classList.remove("isDraggingAudio");
  }));
  composer.addEventListener("drop", event => {
    const file = [...event.dataTransfer.files].find(candidate => candidate.type.startsWith("audio/") || audioExtensions.some(ext => candidate.name.toLowerCase().endsWith(ext)));
    if (file) setPendingAudio(file);
    else SOS.toast("Drop a supported audio file into the composer.", { title: "Audio files only" });
  });

  composer.addEventListener("submit", async event => {
    event.preventDefault();

    if (!selectedProject) {
      SOS.toast("Choose or create a project first.", { title: "No project chat selected" });
      return;
    }

    const text = event.currentTarget.elements.message.value.trim();
    if (!text && !pendingFile) return;

    const submitButton = event.currentTarget.querySelector('button[type="submit"]');
    const originalLabel = submitButton.textContent;
    submitButton.disabled = true;
    composer.classList.add("isUploading");
    submitButton.textContent = pendingFile ? "Uploading…" : "Sending…";

    let savedBlobId = null;
    let uploadCommitted = false;

    try {
      let attachment = null;
      if (pendingFile) {
        savedBlobId = await saveAudioBlob(pendingFile);
        attachment = {
          blobId: savedBlobId,
          name: pendingFile.name,
          type: pendingFile.type || "application/octet-stream",
          size: pendingFile.size,
          uploadedAt: Date.now()
        };
      }

      const threads = readThreads();
      const key = threadKey(selectedProject.id);
      threads[key] = Array.isArray(threads[key]) ? threads[key] : [];
      threads[key].push({
        id: uid(),
        senderId: session.id,
        text,
        attachment,
        projectId: selectedProject.id,
        createdAt: Date.now()
      });
      saveThreads(threads);
      uploadCommitted = true;

      event.currentTarget.reset();
      pendingFile = null;
      attachmentPreview.textContent = "No audio selected";
      composer.classList.remove("hasAudio");

      SOS.toast(attachment ? "Audio version uploaded and added to the project history." : "Collaboration message sent.", {
        title: attachment ? "Audio upload complete" : "Message sent"
      });

      // Rendering is intentionally isolated from storage. A display refresh issue must
      // never replace a successful upload notice with a false "Upload failed" toast.
      try {
        renderAll();
      } catch (renderError) {
        console.error("Collaboration refresh failed after a successful save", renderError);
        setTimeout(() => {
          try { renderAll(); } catch (retryError) { console.error("Collaboration refresh retry failed", retryError); }
        }, 80);
      }
    } catch (error) {
      console.error(error);

      // Remove an orphaned IndexedDB blob when the message record itself could not be saved.
      if (!uploadCommitted && savedBlobId) {
        try { await deleteAudioBlob(savedBlobId); } catch (cleanupError) { console.warn("Could not clean up incomplete audio upload", cleanupError); }
      }

      SOS.toast(
        pendingFile
          ? "The audio file was not saved. Check available browser storage and try again."
          : "The collaboration message could not be saved. Please try again.",
        { title: pendingFile ? "Upload failed" : "Message failed" }
      );
    } finally {
      composer.classList.remove("isUploading");
      submitButton.disabled = false;
      submitButton.textContent = originalLabel;
    }
  });

  async function migrateLegacyAttachment(messageId) {
    const projectId = selectedProject?.id;
    if (!projectId) return;
    const threads = readThreads();
    const key = threadKey(projectId);
    const message = (threads[key] || projectMessages(projectId)).find(item => item.id === messageId);
    const attachment = message?.attachment;
    const source = attachment?.dataUrl || attachment?.url;
    if (!message || !source) return;

    const response = await fetch(source);
    const blob = await response.blob();
    const file = new File([blob], attachment.name || "collaboration-audio", { type: attachment.type || blob.type || "application/octet-stream" });
    const blobId = await saveAudioBlob(file);
    attachment.blobId = blobId;
    attachment.size = attachment.size || blob.size;
    attachment.type = attachment.type || blob.type;
    delete attachment.dataUrl;
    delete attachment.url;

    if (!Array.isArray(threads[key])) threads[key] = projectMessages(projectId).slice();
    saveThreads(threads);
    SOS.toast("Legacy audio converted to faster browser storage.", { title: "Audio ready" });
    renderAll();
  }

  document.addEventListener("click", async event => {
    const backupButton = event.target.closest("[data-download-collab-backup]");
    if (backupButton && oversizedThreadBackup) {
      const blob = new Blob([oversizedThreadBackup], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `seeker-collaboration-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }

    const resetButton = event.target.closest("[data-reset-collab-history]");
    if (resetButton) {
      const approved = window.confirm("Reset the oversized local collaboration chat history? Download a backup first if you need the old messages or audio.");
      if (!approved) return;
      localStorage.removeItem(KEYS.threads);
      oversizedThreadBackup = null;
      threadsCache = {};
      rebuildThreadIndex();
      document.querySelector(".collabRecoveryNotice")?.remove();
      renderAll();
      SOS.toast("The oversized local chat history was reset. The Collaboration Studio will now load normally.", { title: "Recovery complete" });
      return;
    }

    const migrateButton = event.target.closest("[data-migrate-legacy-audio]");
    if (migrateButton) {
      migrateButton.disabled = true;
      const label = migrateButton.textContent;
      migrateButton.textContent = "Loading…";
      try { await migrateLegacyAttachment(migrateButton.dataset.migrateLegacyAudio); }
      catch (error) { console.error(error); SOS.toast("This legacy audio could not be converted.", { title: "Audio load failed" }); }
      finally { if (migrateButton.isConnected) { migrateButton.disabled = false; migrateButton.textContent = label; } }
      return;
    }

    const button = event.target.closest("[data-delete-audio-message]");
    if (!button || !selectedProject || !canManage()) return;
    const messageId = button.dataset.deleteAudioMessage;
    const threads = readThreads();
    const key = threadKey(selectedProject.id);
    const message = (threads[key] || []).find(item => item.id === messageId);
    if (!message) return;
    await deleteAudioBlob(message.attachment?.blobId);
    threads[key] = (threads[key] || []).filter(item => item.id !== messageId);
    saveThreads(threads);
    SOS.toast("Audio version removed from the project history.", { title: "Version deleted" });
    renderAll();
  });

  // Open existing collaboration work immediately when the page loads.
  // Previously this initialization was accidentally nested inside the audio-delete handler,
  // so project files and workspace details stayed blank until a new project was created.
  const initialProjects = relevantProjects();
  let adminTarget = null;
  try { adminTarget = JSON.parse(localStorage.getItem("sos_collab_admin_target_v1") || "null"); } catch {}
  if (initialProjects.length) {
    selectedProject = (adminTarget?.projectId && initialProjects.find(project => project.id === adminTarget.projectId)) || initialProjects[0];
    const other = projectMembers(selectedProject).find(user => user.id !== session.id);
    selectedUser = (other && users.find(user => user.id === other.id)) || selectedUser || session;
  } else if (!selectedUser) {
    selectedUser = session;
  }

  messagesHost.innerHTML = '<div class="collabEmpty">Loading collaboration workspace…</div>';
  renderContacts();
  renderProjects();

  loadThreadsCache().then(() => {
    renderAll();
    if (adminTarget?.messageId) {
      requestAnimationFrame(() => {
        const target = document.querySelector(`[data-collab-message-id="${CSS.escape(adminTarget.messageId)}"]`);
        target?.scrollIntoView({ behavior: "smooth", block: "center" });
        target?.classList.add("collabAdminTarget");
        setTimeout(() => target?.classList.remove("collabAdminTarget"), 2400);
        localStorage.removeItem("sos_collab_admin_target_v1");
      });
    }
  }).catch(error => {
    console.error("Collaboration data could not be loaded", error);
    threadsCache = {};
    threadsReady = true;
    rebuildThreadIndex();
    renderAll();
    SOS.toast("The workspace opened without older local messages because their saved data could not be read.", { title: "Recovery mode" });
  });

  window.addEventListener("pagehide", () => {
    if (audioObserver) audioObserver.disconnect();
    objectUrls.forEach(url => URL.revokeObjectURL(url));
    objectUrls.clear();
  }, { once: true });

})();
