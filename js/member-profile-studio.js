(() => {
  'use strict';

  const host = document.getElementById('profileStudio');
  if (!host) return;

  const client = window.SOS_SUPABASE?.client;
  const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
  const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

  const esc = value => String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[character]);

  const cacheBust = url => {
    if (!url || url.startsWith('data:')) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${Date.now()}`;
  };

  const setAvatarEverywhere = avatarUrl => {
    if (!avatarUrl) return;
    const freshUrl = cacheBust(avatarUrl);
    const dashboardAvatar = document.getElementById('dashboardAvatar');
    if (dashboardAvatar) dashboardAvatar.src = freshUrl;

    document.querySelectorAll('.profilePreview .avatar').forEach(image => {
      image.src = freshUrl;
    });
  };

  const saveLegacyCompatibility = mapped => {
    if (!mapped || !window.SOS) return;
    const users = window.SOS.read(window.SOS.K.users, []);
    const index = users.findIndex(user => user.id === mapped.id || String(user.email || '').toLowerCase() === String(mapped.email || '').toLowerCase());
    const compatible = {
      id: mapped.id,
      email: mapped.email,
      username: mapped.username,
      displayName: mapped.displayName,
      avatar: mapped.avatar,
      bio: mapped.bio,
      location: mapped.location,
      socials: mapped.socials,
      role: mapped.role,
      joinedAt: mapped.joinedAt,
      supabase: true
    };

    if (index >= 0) users[index] = { ...users[index], ...compatible };
    else users.push(compatible);
    window.SOS.write(window.SOS.K.users, users);
  };

  async function uploadAvatar(file, userId) {
    if (!file || !file.size) return null;
    if (file.size > MAX_AVATAR_BYTES) throw new Error('Avatar must be 5 MB or smaller.');
    if (!ALLOWED_AVATAR_TYPES.has(file.type)) throw new Error('Please use a JPG, PNG, or WebP image.');

    const extensionByType = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp'
    };
    const extension = extensionByType[file.type] || 'webp';
    const path = `${userId}/avatar.${extension}`;

    const { error: uploadError } = await client.storage
      .from('avatars')
      .upload(path, file, {
        upsert: true,
        cacheControl: '0',
        contentType: file.type
      });

    if (uploadError) throw uploadError;

    const { data: publicData } = client.storage.from('avatars').getPublicUrl(path);
    const publicUrl = publicData?.publicUrl;
    if (!publicUrl) throw new Error('The avatar uploaded, but Supabase did not return a public image URL.');

    return publicUrl;
  }

  async function render() {
    const session = window.SOS?.getSession?.();
    if (!session?.supabase) {
      host.innerHTML = '';
      return;
    }

    host.innerHTML = `
      <div class="adminSectionHead">
        <div>
          <p class="sectionEyebrow">Custom Profile Module</p>
          <h2>Edit your public member profile</h2>
        </div>
      </div>
      <form class="appForm" id="publicProfileForm">
        <div class="profileStudioGrid">
          <label>Display name
            <input name="displayName" maxlength="30" value="${esc(session.displayName)}" required>
          </label>
          <label>Username
            <input value="${esc(session.username)}" disabled>
            <small>Usernames are permanent for now.</small>
          </label>
        </div>
        <div class="profileStudioGrid">
          <label>Location
            <input name="location" maxlength="60" value="${esc(session.location || '')}" placeholder="City, region, or Online">
          </label>
          <label>Avatar image
            <input type="file" name="avatar" accept="image/jpeg,image/png,image/webp">
            <small>JPG, PNG, or WebP. Maximum size: 5 MB.</small>
          </label>
          <label class="profileStatusEditor">Online activity status
            <input name="activityStatus" maxlength="80" value="${esc(session.activityStatus || 'Exploring the frequency')}" placeholder="Building a new track">
            <small>This appears beside your green online indicator while you are active.</small>
            <span class="profileStatusPreview"><i></i> Online — ${esc(session.activityStatus || 'Exploring the frequency')}</span>
          </label>
          <label class="profileStatusEditor">Presence visibility
            <select name="presenceVisibility">
              <option value="automatic" ${session.presenceVisibility === 'automatic' || !session.presenceVisibility ? 'selected' : ''}>Automatic — show online when active</option>
              <option value="offline" ${session.presenceVisibility === 'offline' ? 'selected' : ''}>Always appear offline</option>
              <option value="hidden" ${session.presenceVisibility === 'hidden' ? 'selected' : ''}>Hidden — conceal activity and status</option>
            </select>
            <small>This changes how your presence appears in the forums and member lists.</small>
          </label>
        </div>
        <label>Bio
          <textarea name="bio" maxlength="600" placeholder="Tell the community about yourself...">${esc(session.bio || '')}</textarea>
        </label>
        <div class="profileStudioGrid">
          <label>YouTube URL<input name="youtube" type="url" value="${esc(session.socials?.YouTube || '')}"></label>
          <label>SoundCloud URL<input name="soundcloud" type="url" value="${esc(session.socials?.SoundCloud || '')}"></label>
          <label>Instagram URL<input name="instagram" type="url" value="${esc(session.socials?.Instagram || '')}"></label>
          <label>Twitch URL<input name="twitch" type="url" value="${esc(session.socials?.Twitch || '')}"></label>
        </div>
        <button class="primaryButton">Save Public Profile</button>
        <p class="formMessage" id="profileSaveMessage"></p>
      </form>
      <section class="profileSecurityCard">
        <div><p class="sectionEyebrow">Account Security</p><h3>Change your password</h3><p>Send a secure password-reset link to <strong>${esc(session.email || '')}</strong>.</p></div>
        <button class="secondaryButton" id="profileResetPassword" type="button">Send Password Reset Email</button>
        <p class="formMessage" id="profileResetMessage"></p>
      </section>`;

    const resetProfileButton = document.getElementById('profileResetPassword');
    resetProfileButton?.addEventListener('click', async () => {
      const output = document.getElementById('profileResetMessage');
      if (typeof window.SOS_REQUEST_PASSWORD_RESET !== 'function') {
        output.textContent = 'Password recovery is still loading. Refresh this page and try again.';
        output.dataset.state = 'error';
        return;
      }
      await window.SOS_REQUEST_PASSWORD_RESET(session.email, output, resetProfileButton);
    });

    const form = document.getElementById('publicProfileForm');
    form?.elements.activityStatus?.addEventListener('input', event => {
      const preview = form.querySelector('.profileStatusPreview');
      if (preview) preview.innerHTML = `<i></i> Online — ${esc(event.target.value.trim() || 'Exploring the frequency')}`;
    });
    form.onsubmit = async event => {
      event.preventDefault();
      const output = document.getElementById('profileSaveMessage');
      const submitButton = form.querySelector('button');
      const fields = new FormData(form);
      submitButton.disabled = true;
      output.textContent = 'Saving your profile…';
      output.dataset.state = '';

      try {
        if (!client) throw new Error('Supabase is not connected.');

        const { data: userData, error: userError } = await client.auth.getUser();
        if (userError) throw userError;
        const user = userData?.user;
        if (!user) throw new Error('Your login session expired. Please sign in again.');

        let avatarUrl = session.avatar;
        const avatarFile = fields.get('avatar');
        const uploadedUrl = await uploadAvatar(avatarFile, user.id);
        if (uploadedUrl) avatarUrl = uploadedUrl;

        const profileValues = {
          id: user.id,
          username: session.username || user.user_metadata?.username || `member_${user.id.slice(0, 8)}`,
          display_name: String(fields.get('displayName') || '').trim(),
          location: String(fields.get('location') || '').trim(),
          biography: String(fields.get('bio') || '').trim(),
          avatar_url: avatarUrl,
          activity_status: String(fields.get('activityStatus') || 'Exploring the frequency').trim().slice(0,80),
          presence_visibility: String(fields.get('presenceVisibility') || 'automatic'),
          last_seen_at: new Date().toISOString(),
          social_links: {
            YouTube: String(fields.get('youtube') || '').trim(),
            SoundCloud: String(fields.get('soundcloud') || '').trim(),
            Instagram: String(fields.get('instagram') || '').trim(),
            Twitch: String(fields.get('twitch') || '').trim()
          },
          updated_at: new Date().toISOString()
        };

        const { data: savedProfile, error: saveError } = await client
          .from('profiles')
          .upsert(profileValues, { onConflict: 'id' })
          .select('*')
          .single();

        if (saveError) throw saveError;
        if (!savedProfile) throw new Error('The profile was not returned after saving.');

        const { data: sessionData, error: sessionError } = await client.auth.getSession();
        if (sessionError) throw sessionError;
        const mapped = await window.SOS_AUTH_BRIDGE.sync(sessionData.session);

        setAvatarEverywhere(mapped.avatar);
        saveLegacyCompatibility(mapped);

        const dashboardName = document.getElementById('dashboardName');
        if (dashboardName) dashboardName.textContent = mapped.displayName;

        output.textContent = 'Profile saved. Your new avatar and member information are now live.';
        output.dataset.state = 'success';
        window.SOS.toast('Your profile image and information were updated.', { title: 'Profile saved' });
      } catch (error) {
        console.error('[Seeker Profile] Save failed.', error);
        output.textContent = error?.message || 'Profile could not be saved.';
        output.dataset.state = 'error';
      } finally {
        submitButton.disabled = false;
      }
    };
  }

  render();
  window.addEventListener('sos:supabase-session', render);
})();
