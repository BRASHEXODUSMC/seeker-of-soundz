(() => {
  'use strict';
  if (window.__SOS_REPLY_REACTIONS_V41315__) return;
  window.__SOS_REPLY_REACTIONS_V41315__ = true;

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
    else console.info(`[${title}] ${message}`);
  };

  function normalizeSummary(payload) {
    const source = typeof payload === 'string' ? JSON.parse(payload) : (payload || {});
    const counts = Object.fromEntries(REACTIONS.map(item => [item.key, Number(source.counts?.[item.key] || 0)]));
    const mine = new Set(Array.isArray(source.mine) ? source.mine : []);
    return { counts, mine };
  }

  function renderBar(bar, summary) {
    if (!bar) return;
    bar.replaceChildren(...REACTIONS.map(item => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'forumReplyReactionButton';
      button.dataset.replyReaction = item.key;
      button.dataset.replyId = bar.dataset.replyId;
      button.setAttribute('aria-label', `${item.label} reaction`);
      button.title = item.label;
      button.classList.toggle('is-reacted', summary.mine.has(item.key));
      button.innerHTML = `<span class="reactionEmoji" aria-hidden="true">${item.emoji}</span><span class="reactionCount">${summary.counts[item.key]}</span><span class="reactionLabel">${item.label}</span>`;
      return button;
    }));
    bar.dataset.ready = '1';
  }

  async function loadSummary(replyId) {
    const c = client();
    if (!c) throw new Error('Supabase is not connected.');
    const { data, error } = await c.rpc('forum_get_reply_reactions', { target_reply: replyId });
    if (error) throw error;
    return normalizeSummary(data);
  }

  async function hydrateBar(bar) {
    if (!(bar instanceof HTMLElement) || bar.dataset.loading === '1') return;
    const replyId = bar.dataset.replyId;
    if (!replyId) return;
    bar.dataset.loading = '1';
    try {
      renderBar(bar, await loadSummary(replyId));
    } catch (error) {
      console.error('Reply reaction load failed:', error);
      bar.innerHTML = '<span class="forumReactionStatus">Reactions unavailable</span>';
    } finally {
      delete bar.dataset.loading;
    }
  }

  function ensureBars(root = document) {
    const replies = root instanceof Element && root.matches('.forumReply') ? [root] : [];
    root.querySelectorAll?.('.forumReply').forEach(reply => replies.push(reply));
    replies.forEach(reply => {
      const actions = reply.querySelector('.forumReplyActions');
      if (!actions) return;
      const seed = reply.querySelector('[data-like-reply]');
      let bar = actions.querySelector('.forumReplyReactionBar');
      const replyId = bar?.dataset.replyId || seed?.dataset.likeReply || reply.dataset.replyId;
      if (!replyId) return;
      seed?.remove();
      if (!bar) {
        bar = document.createElement('div');
        bar.className = 'forumReplyReactionBar';
        actions.prepend(bar);
      }
      if (bar.dataset.replyId !== replyId) {
        bar.dataset.replyId = replyId;
        delete bar.dataset.ready;
      }
      if (bar.dataset.ready !== '1') hydrateBar(bar);
    });
  }

  let frame = 0;
  function schedule() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      ensureBars(document);
    });
  }

  document.addEventListener('click', async event => {
    const button = event.target.closest?.('[data-reply-reaction]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();

    const c = client();
    if (!c) return notify('Supabase is not connected.');
    const replyId = button.dataset.replyId;
    const bar = button.closest('.forumReplyReactionBar');
    bar?.querySelectorAll('button').forEach(item => { item.disabled = true; });
    try {
      const { data, error } = await c.rpc('forum_toggle_reply_reaction', {
        target_reply: replyId,
        reaction_value: button.dataset.replyReaction
      });
      if (error) throw error;
      renderBar(bar, normalizeSummary(data));
    } catch (error) {
      console.error('Reply reaction save failed:', error);
      notify(error.message || 'The reaction could not be saved.');
      try { renderBar(bar, await loadSummary(replyId)); } catch {}
    } finally {
      bar?.querySelectorAll('button').forEach(item => { item.disabled = false; });
    }
  }, true);

  const observer = new MutationObserver(schedule);
  function boot() {
    ensureBars(document);
    observer.observe(document.getElementById('postList') || document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
  window.addEventListener('pagehide', () => {
    observer.disconnect();
    if (frame) cancelAnimationFrame(frame);
  }, { once: true });
})();
