(() => {
  "use strict";

  const groups = {
    Smileys: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🫡", "🤭", "🫢", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🤢", "🤮", "🤧", "😷", "🤒", "🤕"],
    Hands: ["👋", "🤚", "🖐️", "✋", "🖖", "🫱", "🫲", "🫳", "🫴", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪"],
    Music: ["🎵", "🎶", "🎼", "🎧", "🎤", "🎙️", "🎚️", "🎛️", "🎹", "🥁", "🪘", "🎷", "🎺", "🪗", "🎸", "🪕", "🎻", "📻", "🔊", "🔉", "🔈", "📢", "📣", "💿", "📀", "💽", "🎞️", "🎬", "🎭", "🎨", "🎪", "🪩"],
    Hearts: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️", "💋", "🌹", "🌈", "✨", "⭐", "🌟", "💫", "⚡", "🔥", "💥", "💯"],
    Objects: ["🚀", "🛸", "🎉", "🎊", "🎁", "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "👑", "💎", "🔒", "🔓", "🔑", "🧠", "💡", "🧩", "🧭", "📌", "📍", "📎", "🔗", "📝", "📚", "📖", "📸", "📷", "🎥", "📱", "💻", "⌨️", "🖱️", "🕹️", "🎮", "🛒", "🛍️", "💰", "💸", "✅", "❌", "❓", "❗", "⚠️", "🚫"],
    Nature: ["☀️", "🌤️", "⛅", "🌥️", "☁️", "🌧️", "⛈️", "🌩️", "🌨️", "❄️", "🌬️", "🌪️", "🌈", "🌊", "🌙", "🌕", "🌑", "⭐", "🌟", "🌌", "🌍", "🌎", "🌏", "🌱", "🌿", "🍀", "🌳", "🌴", "🌵", "🌸", "🌺", "🌻", "🌹", "🍄", "🐶", "🐱", "🦊", "🐻", "🐼", "🐸", "🦄", "🦋", "🐝"],
    Food: ["🍎", "🍊", "🍋", "🍉", "🍇", "🍓", "🫐", "🍒", "🥝", "🍅", "🥑", "🌶️", "🍕", "🍔", "🍟", "🌭", "🌮", "🌯", "🍿", "🍩", "🍪", "🎂", "🍰", "🍫", "🍬", "🍭", "☕", "🧋", "🥤", "🍺", "🍻", "🥂", "🍷"],
    Flags: ["🏁", "🚩", "🎌", "🏴", "🏳️", "🏳️‍🌈", "🏳️‍⚧️", "🇺🇸", "🇨🇦", "🇲🇽", "🇬🇧", "🇫🇷", "🇩🇪", "🇮🇹", "🇪🇸", "🇳🇱", "🇧🇪", "🇸🇪", "🇳🇴", "🇫🇮", "🇦🇺", "🇯🇵", "🇰🇷", "🇧🇷"]
  };

  const searchAliases = {
    smile: "Smileys", happy: "Smileys", laugh: "Smileys", face: "Smileys", sad: "Smileys",
    hand: "Hands", clap: "Hands", wave: "Hands", thumb: "Hands", point: "Hands",
    music: "Music", dj: "Music", audio: "Music", sound: "Music", instrument: "Music",
    heart: "Hearts", love: "Hearts", fire: "Hearts", star: "Hearts", sparkle: "Hearts",
    object: "Objects", trophy: "Objects", rocket: "Objects", computer: "Objects", game: "Objects",
    nature: "Nature", animal: "Nature", weather: "Nature", plant: "Nature", moon: "Nature",
    food: "Food", drink: "Food", pizza: "Food", fruit: "Food", cake: "Food",
    flag: "Flags", country: "Flags", pride: "Flags"
  };

  let target = "";
  let anchorButton = null;
  let activeGroup = Object.keys(groups)[0];

  const modal = document.createElement("div");
  modal.className = "emojiPickerModal";
  modal.hidden = true;
  document.body.appendChild(modal);

  function emojiButtons(items) {
    return items.map((emoji) => (
      `<button type="button" data-emoji-value="${emoji}" title="Add ${emoji}" aria-label="Add ${emoji}">${emoji}</button>`
    )).join("");
  }

  function matchingEmojis(searchTerm) {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return groups[activeGroup];

    const matchedGroups = new Set();
    Object.keys(groups).forEach((group) => {
      if (group.toLowerCase().includes(query)) matchedGroups.add(group);
    });
    Object.entries(searchAliases).forEach(([alias, group]) => {
      if (alias.includes(query) || query.includes(alias)) matchedGroups.add(group);
    });

    if (matchedGroups.size) {
      return [...matchedGroups].flatMap((group) => groups[group]);
    }

    return Object.values(groups).flat().filter((emoji) => emoji.includes(searchTerm));
  }

  function updateGrid(searchTerm = "") {
    const grid = modal.querySelector(".emojiGrid");
    if (!grid) return;
    const items = matchingEmojis(searchTerm);
    grid.innerHTML = items.length
      ? emojiButtons(items)
      : '<p class="emojiEmptyState">No emojis matched that search.</p>';
  }

  function buildPicker() {
    modal.innerHTML = `
      <section class="emojiPicker" role="dialog" aria-modal="false" aria-label="Forum emoji library">
        <header>
          <div>
            <p class="sectionEyebrow">Forum Emoji Library</p>
            <h3>Choose an emoji</h3>
          </div>
          <button type="button" class="drawerClose emojiPickerClose" data-close-emoji aria-label="Close emoji picker">×</button>
        </header>
        <label class="emojiSearchLabel" for="forumEmojiSearch">Search emojis</label>
        <input id="forumEmojiSearch" class="emojiSearch" type="search" autocomplete="off" placeholder="Try music, happy, fire, food…">
        <nav aria-label="Emoji categories">
          ${Object.keys(groups).map((group) => (
            `<button type="button" class="${group === activeGroup ? "active" : ""}" data-emoji-group="${group}">${group}</button>`
          )).join("")}
        </nav>
        <div class="emojiGrid">${emojiButtons(groups[activeGroup])}</div>
      </section>
    `;
  }

  function insert(emoji) {
    const field = document.getElementById(target);
    if (!field) return;

    const x = window.scrollX;
    const y = window.scrollY;
    const start = field.selectionStart ?? field.value.length;
    const end = field.selectionEnd ?? start;

    field.value = field.value.slice(0, start) + emoji + field.value.slice(end);
    try {
      field.focus({ preventScroll: true });
    } catch {
      field.focus();
    }
    field.selectionStart = field.selectionEnd = start + emoji.length;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    window.scrollTo(x, y);
  }

  function positionPicker() {
    const picker = modal.querySelector(".emojiPicker");
    if (!picker || !anchorButton) return;

    const rect = anchorButton.getBoundingClientRect();
    const gap = 10;
    const width = Math.min(560, window.innerWidth - 24);
    const measuredHeight = Math.min(picker.offsetHeight || 390, window.innerHeight - 24);
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
    let top = rect.bottom + gap;

    if (top + measuredHeight > window.innerHeight - 12) {
      top = Math.max(12, rect.top - measuredHeight - gap);
    }

    picker.style.left = `${left}px`;
    picker.style.top = `${top}px`;
    picker.style.width = `${width}px`;
  }

  function closePicker() {
    const picker = modal.querySelector(".emojiPicker");
    if (!picker) {
      modal.hidden = true;
      anchorButton = null;
      return;
    }

    picker.classList.add("is-closing");
    window.setTimeout(() => {
      modal.hidden = true;
      picker.classList.remove("is-closing");
      anchorButton = null;
    }, 240);
  }

  function open(id, button) {
    const x = window.scrollX;
    const y = window.scrollY;
    target = id;
    anchorButton = button;
    activeGroup = Object.keys(groups)[0];
    buildPicker();
    modal.hidden = false;
    positionPicker();
    requestAnimationFrame(() => window.scrollTo(x, y));
  }

  function enhance(root = document) {
    root.querySelectorAll(".emojiToolbar").forEach((bar) => {
      if (bar.dataset.enhanced) return;
      bar.dataset.enhanced = "true";
      const more = document.createElement("button");
      more.type = "button";
      more.className = "emojiMoreButton";
      more.textContent = "＋ More Emojis";
      more.dataset.openEmoji = bar.dataset.emojiTarget;
      bar.appendChild(more);
    });
  }

  enhance();
  const postList = document.getElementById("postList");
  if (postList) {
    new MutationObserver(() => enhance()).observe(postList, { childList: true, subtree: true });
  }

  document.addEventListener("click", (event) => {
    const openButton = event.target.closest("[data-open-emoji]");
    if (openButton) {
      event.preventDefault();
      event.stopPropagation();
      open(openButton.dataset.openEmoji, openButton);
      return;
    }

    const value = event.target.closest("[data-emoji-value]");
    if (value) {
      event.preventDefault();
      insert(value.dataset.emojiValue);
      return;
    }

    const group = event.target.closest("[data-emoji-group]");
    if (group) {
      event.preventDefault();
      activeGroup = group.dataset.emojiGroup;
      modal.querySelectorAll("[data-emoji-group]").forEach((button) => {
        button.classList.toggle("active", button.dataset.emojiGroup === activeGroup);
      });
      const search = modal.querySelector(".emojiSearch");
      if (search) search.value = "";
      updateGrid();
      return;
    }

    if (event.target.closest("[data-close-emoji]")) {
      event.preventDefault();
      closePicker();
    }
  });

  modal.addEventListener("input", (event) => {
    if (!event.target.matches(".emojiSearch")) return;
    updateGrid(event.target.value);
  });

  modal.addEventListener("keydown", (event) => {
    if (event.target.matches(".emojiSearch") && event.key === "Enter") {
      event.preventDefault();
      modal.querySelector("[data-emoji-value]")?.click();
    }
  });

  window.addEventListener("resize", positionPicker);
  window.addEventListener("scroll", positionPicker, true);

  document.addEventListener("pointerdown", (event) => {
    if (!modal.hidden && !event.target.closest(".emojiPicker") && !event.target.closest("[data-open-emoji]")) {
      closePicker();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closePicker();
  });
})();
