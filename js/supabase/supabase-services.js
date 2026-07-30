(function () {
  'use strict';

  const api = () => window.SOS_SUPABASE?.requireClient();
  const unwrap = ({ data, error }) => {
    if (error) throw error;
    return data;
  };

  window.SOS_DB = {
    auth: {
      signUp: (email, password, metadata = {}) => api().auth.signUp({
        email,
        password,
        options: { data: metadata }
      }).then(unwrap),
      signIn: (email, password) => api().auth.signInWithPassword({ email, password }).then(unwrap),
      signOut: () => api().auth.signOut().then(unwrap),
      resetPassword: (email, redirectTo) => api().auth.resetPasswordForEmail(email, { redirectTo }).then(unwrap),
      session: () => api().auth.getSession().then(unwrap),
      user: () => api().auth.getUser().then(unwrap),
      onChange: (callback) => api().auth.onAuthStateChange(callback)
    },
    profiles: {
      get: (id) => api().from('profiles').select('*').eq('id', id).single().then(unwrap),
      updateOwn: (id, changes) => api().from('profiles').update(changes).eq('id', id).select().single().then(unwrap)
    },
    announcements: {
      active: () => api().from('announcements').select('*').eq('is_active', true).order('priority', { ascending: false }).order('created_at', { ascending: false }).then(unwrap)
    },
    forum: {
      categories: () => api().from('forum_categories').select('*').eq('is_visible', true).order('sort_order').then(unwrap),
      topics: (categoryId) => api().from('forum_topics').select('*, profiles!forum_topics_author_id_fkey(username,display_name,avatar_url)').eq('category_id', categoryId).eq('is_hidden', false).order('is_pinned', { ascending: false }).order('last_activity_at', { ascending: false }).then(unwrap),
      replies: (topicId) => api().from('forum_replies').select('*, profiles!forum_replies_author_id_fkey(username,display_name,avatar_url)').eq('topic_id', topicId).eq('is_hidden', false).order('created_at').then(unwrap)
    },
    music: {
      published: () => api().from('music_releases').select('*').eq('is_published', true).order('release_date', { ascending: false, nullsFirst: false }).then(unwrap)
    },
    gallery: {
      published: () => api().from('gallery_items').select('*').eq('is_published', true).order('created_at', { ascending: false }).then(unwrap)
    },
    notifications: {
      mine: () => api().from('notifications').select('*').order('created_at', { ascending: false }).limit(100).then(unwrap),
      markRead: (id) => api().from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).then(unwrap)
    }
  };
})();
