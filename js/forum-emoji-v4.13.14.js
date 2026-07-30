(() => {
  "use strict";

  if (window.__SOS_FORUM_EMOJI_PICKER_V41314__) return;
  window.__SOS_FORUM_EMOJI_PICKER_V41314__ = true;

  const groups = Object.freeze({
    Smileys: ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗","🤔","🫡","🤭","🫢","🤫","🤥","😶","😐","😑","😬","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤","😪","😵","🤐","🤢","🤮","🤧","😷","🤒","🤕"],
    Hands: ["👋","🤚","🖐️","✋","🖖","🫱","🫲","🫳","🫴","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","✍️","💅","🤳","💪"],
    Music: ["🎵","🎶","🎼","🎧","🎤","🎙️","🎚️","🎛️","🎹","🥁","🪘","🎷","🎺","🪗","🎸","🪕","🎻","📻","🔊","🔉","🔈","📢","📣","💿","📀","💽","🎞️","🎬","🎭","🎨","🎪","🪩"],
    Hearts: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝","💟","♥️","💋","🌹","🌈","✨","⭐","🌟","💫","⚡","🔥","💥","💯"],
    Objects: ["🚀","🛸","🎉","🎊","🎁","🏆","🥇","🥈","🥉","🏅","🎖️","👑","💎","🔒","🔓","🔑","🧠","💡","🧩","🧭","📌","📍","📎","🔗","📝","📚","📖","📸","📷","🎥","📱","💻","⌨️","🖱️","🕹️","🎮","🛒","🛍️","💰","💸","✅","❌","❓","❗","⚠️","🚫"],
    Nature: ["☀️","🌤️","⛅","🌥️","☁️","🌧️","⛈️","🌩️","🌨️","❄️","🌬️","🌪️","🌈","🌊","🌙","🌕","🌑","⭐","🌟","🌌","🌍","🌎","🌏","🌱","🌿","🍀","🌳","🌴","🌵","🌸","🌺","🌻","🌹","🍄","🐶","🐱","🦊","🐻","🐼","🐸","🦄","🦋","🐝"],
    Food: ["🍎","🍊","🍋","🍉","🍇","🍓","🫐","🍒","🥝","🍅","🥑","🌶️","🍕","🍔","🍟","🌭","🌮","🌯","🍿","🍩","🍪","🎂","🍰","🍫","🍬","🍭","☕","🧋","🥤","🍺","🍻","🥂","🍷"],
    Flags: ["🏁","🚩","🎌","🏴","🏳️","🏳️‍🌈","🏳️‍⚧️","🇺🇸","🇨🇦","🇲🇽","🇬🇧","🇫🇷","🇩🇪","🇮🇹","🇪🇸","🇳🇱","🇧🇪","🇸🇪","🇳🇴","🇫🇮","🇦🇺","🇯🇵","🇰🇷","🇧🇷"]
  });

  const aliases = Object.freeze({
    smile: "Smileys", happy: "Smileys", laugh: "Smileys", face: "Smileys", sad: "Smileys",
    hand: "Hands", clap: "Hands", wave: "Hands", thumb: "Hands", point: "Hands",
    music: "Music", dj: "Music", audio: "Music", sound: "Music", instrument: "Music",
    heart: "Hearts", love: "Hearts", fire: "Hearts", star: "Hearts", sparkle: "Hearts",
    object: "Objects", trophy: "Objects", rocket: "Objects", computer: "Objects", game: "Objects",
    nature: "Nature", animal: "Nature", weather: "Nature", plant: "Nature", moon: "Nature",
    food: "Food", drink: "Food", pizza: "Food", fruit: "Food", cake: "Food",
    flag: "Flags", country: "Flags", pride: "Flags"
  });

  const state = {
    targetId: "",
    activeGroup: "Smileys",
    open: false,
    closeTimer: 0,
    enhanceFrame: 0,
    lastFocusedField: null
  };

  const modal = document.createElement("div");
  modal.className = "emojiPickerModal emojiPickerModalV41314";
  modal.hidden = true;
  modal.innerHTML = `
    <section class="emojiPicker emojiPickerV41314" role="dialog" aria-modal="true" aria-label="Forum emoji library" tabindex="-1">
      <header>
        <div>
          <p class="sectionEyebrow">Forum Emoji Library</p>
          <h3>Choose an emoji</h3>
        </div>
        <button type="button" class="drawerClose emojiPickerClose" data-close-emoji aria-label="Close emoji picker">×</button>
      </header>
      <label class="emojiSearchLabel" for="forumEmojiSearchV41314">Search emojis</label>
      <input id="forumEmojiSearchV41314" class="emojiSearch" type="search" autocomplete="off" placeholder="Try music, happy, fire, food…">
      <nav class="emojiCategoryTabs" aria-label="Emoji categories"></nav>
      <div class="emojiGrid" role="listbox" aria-label="Emoji choices"></div>
      <p class="emojiEmptyState" hidden>No emojis matched that search.</p>
    </section>`;
  document.body.appendChild(modal);

  const picker = modal.querySelector(".emojiPicker");
  const search = modal.querySelector(".emojiSearch");
  const tabs = modal.querySelector(".emojiCategoryTabs");
  const grid = modal.querySelector(".emojiGrid");
  const empty = modal.querySelector(".emojiEmptyState");

  const allEmojis = [...new Set(Object.values(groups).flat())];

  function renderTabs() {
    const fragment = document.createDocumentFragment();
    Object.keys(groups).forEach((group) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.emojiGroup = group;
      button.textContent = group;
      button.classList.toggle("active", group === state.activeGroup);
      fragment.appendChild(button);
    });
    tabs.replaceChildren(fragment);
  }

  function getMatches(term = "") {
    const query = term.trim().toLowerCase();
    if (!query) return groups[state.activeGroup] || groups.Smileys;

    const matchedGroups = new Set();
    Object.keys(groups).forEach((group) => {
      if (group.toLowerCase().includes(query)) matchedGroups.add(group);
    });
    Object.entries(aliases).forEach(([alias, group]) => {
      if (alias.includes(query) || query.includes(alias)) matchedGroups.add(group);
    });

    if (matchedGroups.size) {
      return [...new Set([...matchedGroups].flatMap((group) => groups[group]))];
    }
    return allEmojis.filter((emoji) => emoji.includes(term));
  }

  function renderGrid(term = "") {
    const items = getMatches(term);
    const fragment = document.createDocumentFragment();
    items.forEach((emoji) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.emojiValue = emoji;
      button.title = `Add ${emoji}`;
      button.setAttribute("aria-label", `Add ${emoji}`);
      button.setAttribute("role", "option");
      button.textContent = emoji;
      fragment.appendChild(button);
    });
    grid.replaceChildren(fragment);
    grid.hidden = items.length === 0;
    empty.hidden = items.length !== 0;
  }

  function resolveTarget(id) {
    if (id) {
      const direct = document.getElementById(id);
      if (direct && /^(TEXTAREA|INPUT)$/.test(direct.tagName)) return direct;
    }
    if (state.lastFocusedField?.isConnected) return state.lastFocusedField;
    return null;
  }

  function insertEmoji(emoji) {
    const field = resolveTarget(state.targetId);
    if (!field) return;
    const start = Number.isInteger(field.selectionStart) ? field.selectionStart : field.value.length;
    const end = Number.isInteger(field.selectionEnd) ? field.selectionEnd : start;
    field.setRangeText(emoji, start, end, "end");
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
    try { field.focus({ preventScroll: true }); } catch { field.focus(); }
  }

  function openPicker(targetId) {
    window.clearTimeout(state.closeTimer);
    state.targetId = targetId || state.lastFocusedField?.id || "postBody";
    state.activeGroup = "Smileys";
    state.open = true;
    search.value = "";
    renderTabs();
    renderGrid();
    modal.hidden = false;
    modal.classList.remove("is-closing");
    document.documentElement.classList.add("emoji-picker-open");
    requestAnimationFrame(() => {
      picker.classList.add("is-open");
      try { search.focus({ preventScroll: true }); } catch { search.focus(); }
    });
  }

  function closePicker({ restoreFocus = true } = {}) {
    if (!state.open) return;
    state.open = false;
    picker.classList.remove("is-open");
    modal.classList.add("is-closing");
    document.documentElement.classList.remove("emoji-picker-open");
    window.clearTimeout(state.closeTimer);
    state.closeTimer = window.setTimeout(() => {
      modal.hidden = true;
      modal.classList.remove("is-closing");
      if (restoreFocus) {
        const field = resolveTarget(state.targetId);
        if (field) {
          try { field.focus({ preventScroll: true }); } catch { field.focus(); }
        }
      }
    }, 150);
  }

  function enhanceToolbar(bar) {
    if (!(bar instanceof HTMLElement)) return;
    const targetId = bar.dataset.emojiTarget || bar.closest("form")?.querySelector("textarea, input[type='text']")?.id;
    if (targetId && !bar.dataset.emojiTarget) bar.dataset.emojiTarget = targetId;

    [...bar.querySelectorAll(":scope > button:not(.emojiMoreButton)")].forEach((button) => {
      if (button.dataset.quickEmoji) return;
      const emoji = button.textContent.trim();
      if (emoji) button.dataset.quickEmoji = emoji;
    });

    if (!bar.querySelector(":scope > .emojiMoreButton")) {
      const more = document.createElement("button");
      more.type = "button";
      more.className = "emojiMoreButton";
      more.textContent = "＋ More Emojis";
      more.dataset.openEmoji = targetId || "";
      bar.appendChild(more);
    }
    bar.dataset.emojiEnhanced = "v4.13.14";
  }

  function enhance(root = document) {
    if (root instanceof Element && root.matches(".emojiToolbar")) enhanceToolbar(root);
    root.querySelectorAll?.(".emojiToolbar").forEach(enhanceToolbar);
  }

  function scheduleEnhance(root = document) {
    if (state.enhanceFrame) return;
    state.enhanceFrame = requestAnimationFrame(() => {
      state.enhanceFrame = 0;
      enhance(root);
    });
  }

  renderTabs();
  renderGrid();
  enhance();

  const observer = new MutationObserver((mutations) => {
    let needsEnhance = false;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches?.(".emojiToolbar") || node.querySelector?.(".emojiToolbar")) {
          needsEnhance = true;
          break;
        }
      }
      if (needsEnhance) break;
    }
    if (needsEnhance) scheduleEnhance(document);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  document.addEventListener("focusin", (event) => {
    if (event.target.matches?.("textarea, input[type='text']")) state.lastFocusedField = event.target;
  }, true);

  document.addEventListener("click", (event) => {
    const quick = event.target.closest?.("[data-quick-emoji]");
    if (quick) {
      event.preventDefault();
      const bar = quick.closest(".emojiToolbar");
      state.targetId = bar?.dataset.emojiTarget || state.targetId;
      insertEmoji(quick.dataset.quickEmoji);
      return;
    }

    const opener = event.target.closest?.("[data-open-emoji]");
    if (opener) {
      event.preventDefault();
      event.stopPropagation();
      openPicker(opener.dataset.openEmoji || opener.closest(".emojiToolbar")?.dataset.emojiTarget);
      return;
    }

    const emojiButton = event.target.closest?.("[data-emoji-value]");
    if (emojiButton && modal.contains(emojiButton)) {
      event.preventDefault();
      insertEmoji(emojiButton.dataset.emojiValue);
      return;
    }

    const groupButton = event.target.closest?.("[data-emoji-group]");
    if (groupButton && modal.contains(groupButton)) {
      event.preventDefault();
      state.activeGroup = groupButton.dataset.emojiGroup;
      search.value = "";
      renderTabs();
      renderGrid();
      return;
    }

    if (event.target.closest?.("[data-close-emoji]")) {
      event.preventDefault();
      closePicker();
      return;
    }

    if (state.open && event.target === modal) closePicker();
  }, true);

  let searchTimer = 0;
  search.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => renderGrid(search.value), 50);
  });

  modal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closePicker();
    } else if (event.target === search && event.key === "Enter") {
      event.preventDefault();
      const first = grid.querySelector("[data-emoji-value]");
      if (first) insertEmoji(first.dataset.emojiValue);
    }
  });

  window.addEventListener("pagehide", () => {
    observer.disconnect();
    window.clearTimeout(state.closeTimer);
    window.clearTimeout(searchTimer);
    if (state.enhanceFrame) cancelAnimationFrame(state.enhanceFrame);
  }, { once: true });
})();
