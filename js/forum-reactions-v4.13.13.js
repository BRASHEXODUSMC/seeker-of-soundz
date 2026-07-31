(() => {
  'use strict';
  if (window.__SOS_REPLY_REACTIONS_V41313__) return;
  window.__SOS_REPLY_REACTIONS_V41313__ = true;

  const REACTIONS = Object.freeze([
    { key: 'heart', emoji: '❤️', label: 'Love' },
    { key: 'fire', emoji: '🔥', label: 'Fire' },
    { key: 'clap', emoji: '👏', label: 'Applause' },
    { key: 'laugh', emoji: '😂', label: 'Laugh' },
    { key: 'wow', emoji: '😮', label: 'Wow' },
    { key: 'support', emoji: '🙌', label: 'Support' }
  ]);

  const client = () => window.SOS_SUPABASE?.client || null;
  const notify = (message, title = 'Forum reactions') => {
    if (window.SOS?.toast) window.SOS.toast(message, { title });
    else window.alert(message);
  };

  async function getCurrentUser() {
    const c = client();
    if (!c) return null;
    const { data } = await c.auth.getSession();
    return data?.session?.user || null;
  }

  async function readReplyReactions(replyId) {
    const c = client();
    if (!c) return [];
    const { data, error } = await c
      .from('forum_reactions')
      .select('user_id,reaction')
      .eq('reply_id', replyId);
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  }

  function summarize(rows, userId) {
    const counts = Object.fromEntries(REACTIONS.map(item => [item.key, 0]));
    const mine = new Set();
    rows.forEach(row => {
      const key = String(row.reaction || '').toLowerCase();
      if (Object.prototype.hasOwnProperty.call(counts, key)) counts[key] += 1;
      if (userId && row.user_id === userId) mine.add(key);
    });
    return { counts, mine };
  }

  function renderBar(bar, summary) {
    bar.replaceChildren(...REACTIONS.map(item => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'forumReplyReactionButton';
      button.dataset.replyReaction = item.key;
      button.dataset.replyId = bar.dataset.replyId;
      button.setAttribute('aria-label', `${item.label} reaction`);
      button.title = item.label;
      button.classList.toggle('is-reacted', summary.mine.has(item.key));
      button.innerHTML = `<span class="reactionEmoji" aria-hidden="true">${item.emoji}</span><span class="reactionCount">${summary.counts[item.key] || 0}</span><span class="reactionLabel">${item.label}</span>`;
      return button;
    }));
  }

  async function hydrateBar(bar) {
    if (!(bar instanceof HTMLElement) || bar.dataset.loading === '1') return;
    const replyId = bar.dataset.replyId;
    if (!replyId) return;
    bar.dataset.loading = '1';
    try {
      const [rows, user] = await Promise.all([readReplyReactions(replyId), getCurrentUser()]);
      renderBar(bar, summarize(rows, user?.id));
      bar.dataset.ready = '1';
    } catch (error) {
      console.error('Reply reaction load failed:', error);
      bar.textContent = 'Reactions unavailable';
    } finally {
      delete bar.dataset.loading;
    }
  }

  function ensureBars(root = document) {
    const replies = [];
    if (root instanceof Element && root.matches('.forumReply')) replies.push(root);
    root.querySelectorAll?.('.forumReply').forEach(reply => replies.push(reply));

    replies.forEach(reply => {
      const existingHeart = reply.querySelector('[data-like-reply]');
      const replyId = existingHeart?.dataset.likeReply;
      const actions = reply.querySelector('.forumReplyActions');
      if (!replyId || !actions) return;
      let bar = actions.querySelector('.forumReplyReactionBar');
      if (!bar) {
        bar = document.createElement('div');
        bar.className = 'forumReplyReactionBar';
        bar.dataset.replyId = replyId;
        actions.appendChild(bar);
      }
      if (bar.dataset.replyId !== replyId) {
        bar.dataset.replyId = replyId;
        delete bar.dataset.ready;
      }
      if (bar.dataset.ready !== '1') hydrateBar(bar);
    });
  }

  let frame = 0;
  function schedule(root = document) {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      ensureBars(root);
    });
  }

  document.addEventListener('click', async event => {
    const button = event.target.closest?.('[data-reply-reaction]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const c = client();
    if (!c) return notify('Supabase is not connected.');
    const user = await getCurrentUser();
    if (!user) return notify('Please sign in to react.', 'Members only');

    button.disabled = true;
    const bar = button.closest('.forumReplyReactionBar');
    try {
      const { error } = await c.rpc('forum_toggle_reaction', {
        target_topic: null,
        target_reply: button.dataset.replyId,
        reaction_value: button.dataset.replyReaction
      });
      if (error) throw error;
      const rows = await readReplyReactions(button.dataset.replyId);
      renderBar(bar, summarize(rows, user.id));
    } catch (error) {
      notify(error.message || 'The reaction could not be saved.');
    } finally {
      button.disabled = false;
    }
  }, true);

  const observer = new MutationObserver(mutations => {
    if (mutations.some(m => [...m.addedNodes].some(node => node instanceof Element && (node.matches?.('.forumReply') || node.querySelector?.('.forumReply'))))) {
      schedule(document);
    }
  });

  function boot() {
    ensureBars(document);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();

  window.addEventListener('pagehide', () => {
    observer.disconnect();
    if (frame) cancelAnimationFrame(frame);
  }, { once: true });
})();
