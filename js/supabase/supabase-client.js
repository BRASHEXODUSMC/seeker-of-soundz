(function () {
  'use strict';

  const config = window.SOS_BACKEND || {};
  const url = String(config.supabaseUrl || '').trim();
  const anonKey = String(config.supabaseAnonKey || '').trim();
  const configured = /^https:\/\/.+\.supabase\.co$/i.test(url) && anonKey.length > 40;

  const state = {
    configured,
    connected: false,
    client: null,
    error: null
  };

  if (configured && window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      state.client = window.supabase.createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'sos_supabase_auth'
        },
        realtime: { params: { eventsPerSecond: 10 } }
      });
      state.connected = true;
    } catch (error) {
      state.error = error;
      console.error('[Seeker Supabase] Client initialization failed.', error);
    }
  }

  window.SOS_SUPABASE = Object.freeze({
    get configured() { return state.configured; },
    get connected() { return state.connected; },
    get client() { return state.client; },
    get error() { return state.error; },
    requireClient() {
      if (!state.client) {
        throw new Error('Supabase is not configured. Add the public project URL and anon key in js/backend-config.js.');
      }
      return state.client;
    }
  });

  document.dispatchEvent(new CustomEvent('sos:supabase-ready', {
    detail: { configured: state.configured, connected: state.connected }
  }));
})();
