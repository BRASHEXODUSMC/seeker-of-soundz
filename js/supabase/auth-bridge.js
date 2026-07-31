(function () {
  'use strict';

  const client = window.SOS_SUPABASE?.client;
  if (!client) return;

  const roleForLegacyUi = (role) => ['owner', 'administrator'].includes(role) ? 'admin' : (role || 'member');
  const publicSession = (user, profile) => ({
    id: user.id,
    email: user.email || '',
    username: profile?.username || user.user_metadata?.username || '',
    displayName: profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'Member',
    avatar: profile?.avatar_url || 'assets/images/sos-logo.png',
    banner: profile?.banner_url || '',
    bio: profile?.biography || '',
    location: profile?.location || '',
    socials: profile?.social_links || {},
    websites: profile?.website_links || {},
    role: roleForLegacyUi(profile?.role),
    dbRole: profile?.role || 'member',
    rank: profile?.rank_name || 'New Listener',
    reputation: profile?.reputation || 0,
    activityStatus: profile?.activity_status || 'Exploring the frequency',
    lastSeenAt: profile?.last_seen_at || null,
    collaborationAccess: Boolean(profile?.collaboration_access) || ['owner','administrator'].includes(profile?.role),
    isBanned: Boolean(profile?.is_banned),
    banReason: profile?.ban_reason || '',
    joinedAt: profile?.created_at || user.created_at,
    emailConfirmed: Boolean(user.email_confirmed_at),
    supabase: true
  });


  let presenceTimer = null;
  async function touchPresence(user) {
    if (!user || document.visibilityState === 'hidden') return;
    try {
      await client.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id);
    } catch (error) {
      console.debug('[Seeker Presence] Activity heartbeat skipped.', error);
    }
  }

  function startPresence(user) {
    if (presenceTimer) clearInterval(presenceTimer);
    if (!user) return;
    touchPresence(user);
    presenceTimer = setInterval(() => touchPresence(user), 60000);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      client.auth.getUser().then(({ data }) => touchPresence(data?.user));
    }
  });

  async function loadProfile(user) {
    if (!user) return null;
    const { data, error } = await client.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) throw error;
    return data;
  }

  async function sync(session) {
    const user = session?.user;
    if (!user) {
      if (presenceTimer) { clearInterval(presenceTimer); presenceTimer = null; }
      if (window.SOS) window.SOS.setSession(null);
      window.dispatchEvent(new CustomEvent('sos:supabase-session', { detail: null }));
      return null;
    }

    try {
      startPresence(user);
      const profile = await loadProfile(user);
      const mapped = publicSession(user, profile);
      if (window.SOS) window.SOS.setSession(mapped);
      window.dispatchEvent(new CustomEvent('sos:supabase-session', { detail: mapped }));
      return mapped;
    } catch (error) {
      console.error('[Seeker Auth] Could not load profile.', error);
      const mapped = publicSession(user, null);
      if (window.SOS) window.SOS.setSession(mapped);
      window.dispatchEvent(new CustomEvent('sos:supabase-session', { detail: mapped }));
      return mapped;
    }
  }

  async function boot() {
    for (let tries = 0; tries < 80 && !window.SOS; tries += 1) {
      await new Promise(resolve => setTimeout(resolve, 25));
    }

    if (window.SOS) {
      window.SOS.logout = async function () {
        const previous = window.SOS.getSession();
        window.dispatchEvent(new CustomEvent('sos:before-logout', { detail: previous }));
        const { error } = await client.auth.signOut();
        if (error) {
          window.SOS.toast(error.message, { title: 'Sign-out failed' });
          return;
        }
        localStorage.removeItem(window.SOS.K.session);
        window.SOSExperience?.applyDefault?.();
        window.dispatchEvent(new CustomEvent('sos:session', { detail: null }));
        window.SOS.toast('You have been securely signed out.', { title: 'Signed out' });
        setTimeout(() => { location.href = 'members.html'; }, 500);
      };
    }

    const { data } = await client.auth.getSession();
    const mapped = await sync(data.session);

    const path = location.pathname.toLowerCase();
    if (path.endsWith('/admin.html') || path.endsWith('admin.html')) {
      const allowed = mapped && ['owner', 'administrator'].includes(mapped.dbRole) && !mapped.isBanned;
      if (!allowed) {
        document.documentElement.classList.add('auth-access-denied');
        location.replace('members.html?notice=admin-required');
      }
    }
  }

  client.auth.onAuthStateChange((_event, session) => {
    setTimeout(() => sync(session), 0);
  });

  window.SOS_AUTH_BRIDGE = { sync, loadProfile, publicSession };
  boot().catch(error => console.error('[Seeker Auth] Boot failed.', error));
})();
