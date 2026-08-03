
(function () {
  'use strict';

  const ROLES = [
    ['owner', 'Owner'],
    ['administrator', 'Administrator'],
    ['moderator', 'Moderator'],
    ['dj', 'DJ'],
    ['artist', 'Artist'],
    ['premium_member', 'Premium Member'],
    ['member', 'Member']
  ];

  const RANKS = [
    'New Listener','Frequency Seeker','Sound Explorer','Beat Scout','Bass Traveler',
    'Rhythm Apprentice','Mix Apprentice','Studio Regular','Community Supporter',
    'Track Curator','Playlist Architect','Sound Designer','Visual Artist','Producer',
    'DJ','Resident DJ','Featured Artist','Verified Artist','Event Performer',
    'Community Veteran','Forum Guide','Frequency Mentor','Premium Member','VIP Member',
    'Moderator','Administrator','Founder','Owner'
  ];

  const state = { members: [], loading: false, query: '', filter: 'all' };
  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));

  const client = () => window.SOS_SUPABASE?.client || null;
  const panel = () => document.getElementById('adminPanel');
  const membersButton = () => document.querySelector('.adminMenu [data-panel="members"]');
  const isMembersPanel = () => membersButton()?.classList.contains('active');

  function toast(message, title = 'Member Management') {
    if (window.SOS?.toast) window.SOS.toast(message, { title });
    else console.info(`[${title}] ${message}`);
  }

  function timeLabel(value) {
    if (!value) return 'Never';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit'
    }).format(date);
  }

  function isOnline(member) {
    if (!member.last_seen_at) return false;
    return Date.now() - new Date(member.last_seen_at).getTime() < 150000;
  }

  function relativeTime(value) {
    if (!value) return 'No website activity recorded';
    const time = new Date(value).getTime();
    if (!Number.isFinite(time)) return 'Unknown';
    const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
    if (seconds < 60) return 'Active moments ago';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Active ${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Active ${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `Active ${days} day${days === 1 ? '' : 's'} ago`;
    return `Last active ${timeLabel(value)}`;
  }

  function rankOptions(current) {
    const ranks = RANKS.includes(current) || !current ? RANKS : [current, ...RANKS];
    return ranks.map(rank => `<option value="${esc(rank)}"${rank === current ? ' selected' : ''}>${esc(rank)}</option>`).join('');
  }

  function roleOptions(current) {
    return ROLES.map(([value, label]) =>
      `<option value="${value}"${value === current ? ' selected' : ''}>${label}</option>`
    ).join('');
  }

  function filteredMembers() {
    const q = state.query.trim().toLowerCase();
    return state.members.filter((member) => {
      const matchesFilter =
        state.filter === 'all' ||
        (state.filter === 'online' && isOnline(member)) ||
        (state.filter === 'banned' && member.is_banned) ||
        member.role === state.filter;
      const haystack = [
        member.email, member.username, member.display_name,
        member.role, member.rank_name, member.location
      ].join(' ').toLowerCase();
      return matchesFilter && (!q || haystack.includes(q));
    });
  }

  function memberCard(member) {
    const online = isOnline(member);
    const name = member.display_name || member.username || member.email || 'Member';
    const avatar = member.avatar_url || 'assets/images/sos-logo.png';
    return `
      <article class="supabaseMemberCard" data-member-id="${esc(member.id)}">
        <header class="supabaseMemberHead">
          <div class="supabaseMemberIdentity">
            <div class="supabaseMemberAvatarWrap">
              <img class="supabaseMemberAvatar" src="${esc(avatar)}" alt="">
              <span class="memberPresence ${online ? 'online' : 'offline'}" title="${online ? 'Online now' : 'Offline'}"></span>
            </div>
            <div>
              <h3>${esc(name)}</h3>
              <p>@${esc(member.username || 'profile-pending')}</p>
              <a href="mailto:${esc(member.email || '')}">${esc(member.email || 'No email available')}</a>
            </div>
          </div>
          <div class="supabaseMemberBadges">
            <span class="statusPill role-${esc(member.role || 'member')}">${esc((member.role || 'member').replaceAll('_', ' '))}</span>
            <span class="statusPill ${member.is_banned ? 'danger' : online ? 'success' : ''}">
              ${member.is_banned ? 'Banned' : online ? 'Online' : 'Offline'}
            </span>
          </div>
        </header>

        <div class="supabaseMemberFacts">
          <div class="websiteActivityFact"><strong>Last website activity</strong><span>${esc(relativeTime(member.last_seen_at))}</span><small>${esc(timeLabel(member.last_seen_at))}</small></div>
          <div><strong>Last Supabase sign-in</strong><span>${esc(timeLabel(member.last_sign_in_at))}</span></div>
          <div><strong>Account created</strong><span>${esc(timeLabel(member.auth_created_at))}</span></div>
          <div><strong>Email</strong><span>${member.email_confirmed_at ? 'Verified' : 'Not verified'}</span></div>
          <div><strong>Forum topics</strong><span>${Number(member.topic_count || 0)}</span></div>
          <div><strong>Forum replies</strong><span>${Number(member.reply_count || 0)}</span></div>
        </div>

        <details class="supabaseMemberEditor">
          <summary>Edit this member</summary>
          <div class="adminMemberEditGrid">
            <label>Role
              <select data-member-field="role">${roleOptions(member.role || 'member')}</select>
            </label>
            <label>Rank
              <select data-member-field="rank">${rankOptions(member.rank_name || 'New Listener')}</select>
              <small>Choose the public community rank shown on profiles and forum cards.</small>
            </label>
            <label>Reputation
              <input data-member-field="reputation" type="number" min="0" max="100000000" value="${Number(member.reputation || 0)}">
            </label>
            <label class="adminBanToggle founderToggleV417">
              <input data-member-field="founder" type="checkbox"${member.rank_name === 'Founder' ? ' checked' : ''}>
              <span><strong>Founder status</strong><small>Enable or remove the Founder badge without changing this member’s account role.</small></span>
            </label>
            <label class="adminBanToggle">
              <input data-member-field="collaborationAccess" type="checkbox"${member.collaboration_access ? ' checked' : ''}>
              Allow Collaboration Studio access
            </label>
            <label class="adminBanToggle">
              <input data-member-field="banned" type="checkbox"${member.is_banned ? ' checked' : ''}>
              Block this member from participating
            </label>
            <label class="adminBanReason">Ban reason
              <textarea data-member-field="banReason" maxlength="500" placeholder="Visible to administrators">${esc(member.ban_reason || '')}</textarea>
            </label>
          </div>
          <div class="adminMemberActions">
            <button class="primaryButton" type="button" data-save-supabase-member="${esc(member.id)}">Save member changes</button>
          </div>
        </details>
      </article>`;
  }

  function render() {
    const target = panel();
    if (!target || !isMembersPanel()) return;

    const members = filteredMembers();
    const onlineCount = state.members.filter(isOnline).length;
    const bannedCount = state.members.filter((m) => m.is_banned).length;

    target.innerHTML = `
      <div class="adminSectionHead supabaseAdminHeader">
        <div>
          <p class="sectionEyebrow">Supabase Access Control</p>
          <h2>Member Directory</h2>
          <p class="adminLead">View every registered Supabase account, recent website activity, sign-in history, forum activity, roles, ranks, reputation, and participation restrictions.</p>
        </div>
        <button class="smallAction" type="button" data-refresh-supabase-members>Refresh members</button>
      </div>

      <div class="supabaseMemberStats">
        <div><strong>${state.members.length}</strong><span>Registered accounts</span></div>
        <div><strong>${onlineCount}</strong><span>Online recently</span></div>
        <div><strong>${bannedCount}</strong><span>Restricted accounts</span></div>
        <div><strong>${state.members.filter((m) => m.email_confirmed_at).length}</strong><span>Verified emails</span></div>
      </div>

      <div class="supabaseMemberToolbar">
        <label class="adminMemberSearch">
          <span>Search members</span>
          <input type="search" data-supabase-member-search value="${esc(state.query)}" placeholder="Name, email, username, role…">
        </label>
        <label>
          <span>Filter</span>
          <select data-supabase-member-filter>
            <option value="all"${state.filter === 'all' ? ' selected' : ''}>All members</option>
            <option value="online"${state.filter === 'online' ? ' selected' : ''}>Online recently</option>
            <option value="banned"${state.filter === 'banned' ? ' selected' : ''}>Banned</option>
            ${ROLES.map(([value, label]) => `<option value="${value}"${state.filter === value ? ' selected' : ''}>${label}</option>`).join('')}
          </select>
        </label>
      </div>

      <div class="adminSupabaseNotice">
        <strong>Live Supabase data</strong>
        <span>“Online” means the account sent activity from the website within roughly the last 2½ minutes. Passwords and secret authentication data are never shown.</span>
      </div>

      <div class="supabaseMemberList">
        ${members.length ? members.map(memberCard).join('') : '<div class="emptyState"><h3>No members matched</h3><p>Try another search or filter.</p></div>'}
      </div>`;
  }

  async function loadMembers() {
    if (state.loading) return;
    const target = panel();
    if (!target || !isMembersPanel()) return;

    const supabase = client();
    if (!supabase) {
      target.innerHTML = '<div class="emptyState"><h2>Supabase is not connected</h2><p>Check js/backend-config.js and reload the page.</p></div>';
      return;
    }

    state.loading = true;
    target.innerHTML = '<div class="emptyState adminLoadingState"><h2>Loading Supabase members…</h2><p>Retrieving registered accounts and activity.</p></div>';

    const { data, error } = await supabase.rpc('admin_list_members');
    state.loading = false;

    if (error) {
      target.innerHTML = `<div class="emptyState"><h2>Member directory needs its Supabase patch</h2><p>${esc(error.message)}</p><p>Run <code>patch-v4.13.17-admin-members.sql</code> once, then refresh this panel.</p></div>`;
      return;
    }

    state.members = Array.isArray(data) ? data : [];
    render();
  }

  async function saveMember(button) {
    const id = button.dataset.saveSupabaseMember;
    const card = button.closest('[data-member-id]');
    const supabase = client();
    if (!id || !card || !supabase) return;

    const role = card.querySelector('[data-member-field="role"]').value;
    const rankSelect = card.querySelector('[data-member-field="rank"]');
    const founderEnabled = card.querySelector('[data-member-field="founder"]')?.checked || false;
    let rank = rankSelect.value.trim();
    if (founderEnabled) rank = 'Founder';
    else if (rank === 'Founder') rank = 'New Listener';
    const reputation = Number(card.querySelector('[data-member-field="reputation"]').value || 0);
    const collaborationAccess = card.querySelector('[data-member-field="collaborationAccess"]')?.checked || false;
    const banned = card.querySelector('[data-member-field="banned"]').checked;
    const banReason = card.querySelector('[data-member-field="banReason"]').value.trim();

    button.disabled = true;
    button.textContent = 'Saving…';

    const { error } = await supabase.rpc('admin_update_member', {
      target_user_id: id,
      new_role: role,
      new_rank_name: rank,
      new_reputation: reputation,
      new_is_banned: banned,
      new_ban_reason: banReason,
      new_collaboration_access: collaborationAccess
    });

    button.disabled = false;
    button.textContent = 'Save member changes';

    if (error) {
      toast(error.message, 'Member update failed');
      return;
    }

    toast('The member account was updated in Supabase.', 'Member updated');
    await loadMembers();
  }

  document.addEventListener('click', (event) => {
    const menu = event.target.closest('.adminMenu [data-panel="members"]');
    if (menu) setTimeout(loadMembers, 0);

    const refresh = event.target.closest('[data-refresh-supabase-members]');
    if (refresh) loadMembers();

    const save = event.target.closest('[data-save-supabase-member]');
    if (save) saveMember(save);
  });

  document.addEventListener('input', (event) => {
    if (!event.target.matches('[data-supabase-member-search]')) return;
    state.query = event.target.value;
    render();
    const input = document.querySelector('[data-supabase-member-search]');
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  });

  document.addEventListener('change', (event) => {
    if (!event.target.matches('[data-supabase-member-filter]')) return;
    state.filter = event.target.value;
    render();
  });


  document.addEventListener('change', (event) => {
    if (event.target.matches('[data-member-field="founder"]')) {
      const card = event.target.closest('[data-member-id]');
      const rank = card?.querySelector('[data-member-field="rank"]');
      if (rank) {
        if (event.target.checked) rank.value = 'Founder';
        else if (rank.value === 'Founder') rank.value = 'New Listener';
      }
    }
    if (event.target.matches('[data-member-field="rank"]')) {
      const card = event.target.closest('[data-member-id]');
      const founder = card?.querySelector('[data-member-field="founder"]');
      if (founder) founder.checked = event.target.value === 'Founder';
    }
  });

  const observer = new MutationObserver(() => {
    const target = panel();
    if (!target || !isMembersPanel() || state.loading) return;
    if (target.querySelector('#accountForm') || target.textContent.includes('Multiple Accounts')) {
      loadMembers();
    }
  });

  function boot() {
    const target = panel();
    if (!target) return;
    observer.observe(target, { childList: true, subtree: false });
    if (isMembersPanel()) loadMembers();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.SOS_ADMIN_MEMBERS = { refresh: loadMembers };
})();
