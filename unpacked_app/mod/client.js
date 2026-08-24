// Yandex Music Enhanced Mod - Renderer Script v2.5
(function() {
  console.log('[YandexMusicMod] Injecting Mod Client v2.5...');

  const GITHUB_CHANGELOG_URL = 'https://raw.githubusercontent.com/KiryaScript/yamu-player/refs/heads/main/CHANGELOG.md';

  // ---------------------------------------------------------
  // 1. MAIN-WORLD YANDEX PLUS UNLOCKER (UNLIMITED PLAYBACK & HQ)
  // ---------------------------------------------------------
  try {
    const plusData = {
      serviceAvailable: true,
      hasSubscription: true,
      hasPlus: true,
      plus: { hasPlus: true, isAvailable: true, isTutorialCompleted: true },
      subeditor: false,
      subeditorLevel: 0
    };

    const plusPerms = {
      until: "2099-01-01T00:00:00+00:00",
      values: [
        "landing", "feed", "radio", "mixes", "play-audio", "play-video",
        "play-radio", "user-music", "user-radio", "user-mixes", "user-playlists",
        "non-stop", "high-quality", "tracks-availability", "download-tracks",
        "premium", "lossless", "hq-audio", "offline", "skip-track", "ads-free"
      ],
      default: [
        "landing", "feed", "radio", "mixes", "play-audio", "play-video",
        "play-radio", "user-music", "user-radio", "user-mixes", "user-playlists",
        "non-stop", "high-quality", "tracks-availability", "download-tracks",
        "premium", "lossless", "hq-audio", "offline", "skip-track", "ads-free"
      ]
    };

    const origFetch = window.fetch;
    if (origFetch) {
      window.fetch = async function(...args) {
        const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
        const res = await origFetch.apply(this, args);

        if (url.includes('/account/status') || url.includes('/status')) {
          try {
            const clone = res.clone();
            const json = await clone.json();
            if (json && json.result) {
              json.result.account = { ...(json.result.account || {}), ...plusData };
              json.result.permissions = plusPerms;
              json.result.plus = { hasPlus: true, isAvailable: true, isTutorialCompleted: true };
              json.result.subscription = {
                canStartTrial: false,
                mcdonalds: false,
                autoRenewable: [{
                  expires: "2099-01-01T00:00:00+00:00",
                  vendor: "Yandex",
                  product: { productId: "plus", type: "subscription" },
                  finished: false
                }],
                hadAnySubscription: true
              };
              return new Response(JSON.stringify(json), {
                status: res.status,
                statusText: res.statusText,
                headers: res.headers
              });
            }
          } catch (e) {}
        }

        return res;
      };
    }

    const origXhrOpen = window.XMLHttpRequest.prototype.open;
    const origXhrSend = window.XMLHttpRequest.prototype.send;
    window.XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      this._url = url;
      return origXhrOpen.apply(this, [method, url, ...rest]);
    };
    window.XMLHttpRequest.prototype.send = function(...sendArgs) {
      if (this._url && (this._url.includes('/account/status') || this._url.includes('/status'))) {
        this.addEventListener('readystatechange', () => {
          if (this.readyState === 4 && this.status === 200) {
            try {
              const data = JSON.parse(this.responseText);
              if (data && data.result) {
                data.result.account = { ...(data.result.account || {}), ...plusData };
                data.result.permissions = plusPerms;
                data.result.plus = { hasPlus: true, isAvailable: true, isTutorialCompleted: true };
                Object.defineProperty(this, 'responseText', { value: JSON.stringify(data) });
                Object.defineProperty(this, 'response', { value: JSON.stringify(data) });
              }
            } catch (e) {}
          }
        });
      }
      return origXhrSend.apply(this, sendArgs);
    };
  } catch (err) {
    console.warn('[PlusUnlock] Client hook error:', err);
  }

  let settings = {
    downloadPath: '',
    downloadQuality: 'mp3_320',
    embedCover: true,
    embedTags: true,
    discordRpcEnabled: true,
    preventAutoUpdate: true,
    enableDevTools: true,
    oledTheme: false,
    closeToTray: false
  };

  function debounce(fn, ms) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  }

  const debouncedSaveSettings = debounce((s) => {
    if (window.yandexMod && window.yandexMod.saveSettings) {
      window.yandexMod.saveSettings(s);
    }
  }, 250);

  // ---------------------------------------------------------
  // 2. SAFE TOAST NOTIFICATIONS
  // ---------------------------------------------------------
  function initToasts() {
    let container = document.getElementById('ym-mod-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'ym-mod-toast-container';
      document.body.appendChild(container);
    }
  }

  function showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('ym-mod-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `ym-mod-toast ${type}`;

    const iconEl = document.createElement('div');
    iconEl.style.fontSize = '16px';
    iconEl.textContent = type === 'success' ? '✅' : type === 'error' ? '❌' : '🎵';

    const textEl = document.createElement('div');
    textEl.style.flex = '1';
    textEl.style.wordBreak = 'break-word';
    textEl.textContent = String(message || '');

    toast.appendChild(iconEl);
    toast.appendChild(textEl);
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);

    return toast;
  }

  // ---------------------------------------------------------
  // 3. TRACK & PLAYBACK STATE DETECTION (MULTI-SOURCE)
  // ---------------------------------------------------------
  function isPlayerPlaying() {
    // Check 1: MediaSession
    if (navigator.mediaSession && navigator.mediaSession.playbackState === 'playing') {
      return true;
    }

    // Check 2: Audio elements
    const audios = document.querySelectorAll('audio');
    for (const a of audios) {
      if (!a.paused && !a.ended && a.currentTime > 0) return true;
    }

    // Check 3: Play/Pause button state in DOM (Pause icon displayed means track is active & playing)
    const playerBar = document.querySelector('[class*="PlayerBar"], [class*="playerBar"], [class*="Player_root"], [data-test-id*="PLAYER"], footer');
    if (playerBar) {
      const pauseIcon = playerBar.querySelector('[data-test-id*="PAUSE"], [aria-label*="Пауза"], [aria-label*="Pause"], [class*="pause"], [class*="Pause"]');
      if (pauseIcon) return true;

      // Check SVG pause bars
      const svgs = playerBar.querySelectorAll('svg');
      for (const svg of svgs) {
        if (svg.innerHTML.includes('rect') || svg.innerHTML.includes('pause') || svg.getAttribute('data-icon') === 'pause') {
          return true;
        }
      }
    }

    return false;
  }

  function getAudioPositionAndDuration() {
    const audio = document.querySelector('audio');
    if (audio) {
      return {
        position: isFinite(audio.currentTime) ? audio.currentTime : 0,
        duration: isFinite(audio.duration) ? audio.duration : 0
      };
    }
    return { position: 0, duration: 0 };
  }

  function getCurrentPlayingTrack() {
    try {
      let trackId = null;
      let title = '';
      let artist = '';
      let coverUri = '';
      let album = '';

      // Layer 1: MediaSession (accurate in Chromium during playback)
      if (navigator.mediaSession && navigator.mediaSession.metadata) {
        const meta = navigator.mediaSession.metadata;
        if (meta.title) title = meta.title.trim();
        if (meta.artist) artist = meta.artist.trim();
        if (meta.album) album = meta.album.trim();
        if (meta.artwork && meta.artwork.length > 0) {
          coverUri = meta.artwork[meta.artwork.length - 1].src;
        }
      }

      // Layer 2: PlayerBar DOM nodes
      const playerBar = document.querySelector('[class*="PlayerBar"], [class*="playerBar"], [class*="Player_root"], [data-test-id*="PLAYER"], footer');
      if (playerBar) {
        const titleEl = playerBar.querySelector('[class*="trackTitle"], [class*="TrackTitle"], [class*="title"], [data-test-id*="TITLE"], a[href*="/album/"]');
        if (!title && titleEl && titleEl.textContent.trim()) {
          title = titleEl.textContent.trim();
        }

        const artistEl = playerBar.querySelector('[class*="trackArtists"], [class*="TrackArtists"], [class*="artists"], [class*="artist"], [data-test-id*="ARTIST"], a[href*="/artist/"]');
        if (!artist && artistEl && artistEl.textContent.trim()) {
          artist = artistEl.textContent.trim();
        }

        const imgEl = playerBar.querySelector('img');
        if (!coverUri && imgEl && imgEl.src) {
          coverUri = imgEl.src;
        }

        const trackLink = playerBar.querySelector('a[href*="/track/"]');
        if (trackLink) {
          const match = trackLink.href.match(/\/track\/(\d+)/);
          if (match) trackId = match[1];
        }
      }

      // Layer 3: Active row in playlist or wave
      if (!trackId) {
        const activeRow = document.querySelector('[class*="isPlaying"], [class*="playing"], [data-is-playing="true"], [aria-selected="true"]');
        if (activeRow) {
          const link = activeRow.querySelector('a[href*="/track/"]');
          if (link) {
            const match = link.href.match(/\/track\/(\d+)/);
            if (match) trackId = match[1];
          }
          if (activeRow.dataset?.trackId) {
            trackId = activeRow.dataset.trackId;
          }
        }
      }

      if (title || trackId) {
        return {
          id: trackId,
          trackId: trackId,
          title: title || 'Неизвестный трек',
          artists: [{ name: artist || 'Яндекс Музыка' }],
          albums: [{ title: album || '' }],
          coverUri: coverUri || ''
        };
      }
    } catch (e) {}
    return null;
  }

  function getEntityFromUrl() {
    const path = window.location.pathname;

    const albumMatch = path.match(/\/album\/(\d+)/);
    if (albumMatch) return { type: 'album', id: albumMatch[1] };

    const playlistMatch = path.match(/\/users\/([^/]+)\/playlists\/(\d+)/);
    if (playlistMatch) return { type: 'playlist', userId: playlistMatch[1], kind: playlistMatch[2] };

    const playlistUuidMatch = path.match(/\/playlist\/([^/]+)/);
    if (playlistUuidMatch) return { type: 'playlist', uuid: playlistUuidMatch[1] };

    if (path.includes('/collection') || path.includes('/mymusic') || path.includes('/likes')) {
      return { type: 'playlist', kind: 'likes', userId: 'likes' };
    }

    return null;
  }

  // ---------------------------------------------------------
  // 4. DISCORD RPC SYNCHRONIZATION LOOP
  // ---------------------------------------------------------
  function initDiscordRpcSync() {
    let lastTrackKey = null;
    let lastPlaying = null;

    setInterval(() => {
      if (!settings.discordRpcEnabled || !window.yandexMod?.updatePlayerState) return;

      const isPlaying = isPlayerPlaying();
      const track = getCurrentPlayingTrack();
      const { position, duration } = getAudioPositionAndDuration();

      if (!track || !isPlaying) {
        if (lastPlaying) {
          window.yandexMod.updatePlayerState(null);
          lastPlaying = false;
          lastTrackKey = null;
        }
        return;
      }

      const trackKey = `${track.id || track.title}:${track.artists?.[0]?.name}:${isPlaying}`;
      if (trackKey !== lastTrackKey || isPlaying !== lastPlaying) {
        lastTrackKey = trackKey;
        lastPlaying = isPlaying;

        window.yandexMod.updatePlayerState({
          isPlaying: true,
          track,
          position,
          duration
        });
        console.log('[DiscordRPC] Sent player state update:', track.title, 'by', track.artists?.[0]?.name);
      }
    }, 1000);
  }

  // ---------------------------------------------------------
  // 5. GITHUB CHANGELOG VIEWER MODAL
  // ---------------------------------------------------------
  function renderMarkdownToHtml(mdText) {
    let html = mdText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^---$/gim, '<hr>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/^\s*\*\s+(.*$)/gim, '<li>$1</li>')
      .replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" style="color: #ffcc00; text-decoration: underline;">$1</a>')
      .replace(/\n\n/gim, '<br><br>');

    html = html.replace(/(<li>[\s\S]*?<\/li>)/gim, '<ul>$1</ul>');
    html = html.replace(/<\/ul>\s*<ul>/gim, '');
    return html;
  }

  async function openChangelogModal() {
    let overlay = document.getElementById('ym-changelog-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'ym-changelog-overlay';
      overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
      };

      overlay.innerHTML = `
        <div id="ym-changelog-modal">
          <div class="ym-changelog-header">
            <div class="ym-changelog-title">
              <span>📜 История изменений Yandex Music Mod</span>
              <span class="badge" style="background: #2563eb; color: #fff; padding: 2px 8px; border-radius: 6px; font-size: 11px;">GitHub Live</span>
            </div>
            <button class="ym-mod-close-btn" id="ym-changelog-close">&times;</button>
          </div>
          <div class="ym-changelog-body" id="ym-changelog-content">
            <div style="text-align: center; padding: 40px; color: #aaa;">
              ⏳ Загрузка списка обновлений с GitHub...
            </div>
          </div>
          <div class="ym-changelog-footer">
            <a href="https://github.com/KiryaScript/yamu-player" target="_blank" style="color: #ffcc00; text-decoration: none; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              🔗 GitHub Репозиторий
            </a>
            <button class="ym-mod-btn ym-mod-btn-primary" id="ym-changelog-ok">Понятно</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      document.getElementById('ym-changelog-close').onclick = () => overlay.remove();
      document.getElementById('ym-changelog-ok').onclick = () => overlay.remove();
    }

    const contentEl = document.getElementById('ym-changelog-content');

    try {
      const res = await fetch(GITHUB_CHANGELOG_URL + '?t=' + Date.now());
      if (res.ok) {
        const text = await res.text();
        contentEl.innerHTML = renderMarkdownToHtml(text);
      } else {
        throw new Error('HTTP ' + res.status);
      }
    } catch (err) {
      contentEl.innerHTML = `
        <div style="color: #ef4444; margin-bottom: 12px;">⚠️ Не удалось загрузить историю с GitHub (${err.message}).</div>
        <div style="color: #888;">Проверьте подключение к интернету или откройте <a href="https://github.com/KiryaScript/yamu-player" target="_blank" style="color: #ffcc00;">страницу репозитория</a>.</div>
      `;
    }
  }

  function collectVisibleDomTracks() {
    const tracks = [];
    const seen = new Set();
    const rows = document.querySelectorAll('[data-index], [class*="Track_root"], [class*="track_root"], [class*="TrackItem"], [data-test-id*="TRACK"]');
    rows.forEach(row => {
      const titleEl = row.querySelector('[class*="title" i], a[href*="/album/"]');
      const title = titleEl ? titleEl.textContent.trim() : '';
      let artist = 'Unknown';
      const artistEl = row.querySelector('[class*="artist" i]');
      if (artistEl) {
        artist = artistEl.textContent.trim();
      } else {
        const links = Array.from(row.querySelectorAll('a[href*="/artist/"]'));
        if (links.length > 0) artist = links.map(a => a.textContent.trim()).join(', ');
      }
      let trackId = null;
      const trackLink = row.querySelector('a[href*="/track/"]');
      if (trackLink) {
        const m = trackLink.href.match(/\/track\/(\d+)/);
        if (m) trackId = m[1];
      }
      if (row.dataset?.trackId) trackId = row.dataset.trackId;

      const key = `${trackId || ''}:${artist}:${title}`;
      if (title && !seen.has(key)) {
        seen.add(key);
        tracks.push({ id: trackId, title, artist, artists: [{ name: artist }] });
      }
    });
    return tracks;
  }

  function hookVersionButton() {
    // Only search specifically for the bottom-right version badge element
    const versionBadges = document.querySelectorAll('[class*="Version_root"], [class*="version_root"], [class*="Version_version"], [class*="versionText"], [class*="ReleaseNotes"]');
    versionBadges.forEach(el => {
      if (el.closest('#ym-mod-modal') || el.closest('#ym-changelog-modal') || el.closest('#ym-mod-toast-container')) return;
      if (!el.dataset.ymChangelogHooked) {
        el.dataset.ymChangelogHooked = 'true';
        el.title = 'Открыть историю изменений мода (Changelog)';
        el.style.cursor = 'pointer';
        el.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          openChangelogModal();
        };
      }
    });

    // Fallback: Leaf span with exact text '5.116.3' (outside our modals)
    const spans = document.querySelectorAll('footer span, aside span, [class*="desktop"] span, [class*="layout"] span');
    spans.forEach(el => {
      if (el.children.length === 0 && el.textContent.trim() === '5.116.3') {
        if (!el.closest('#ym-mod-modal') && !el.closest('#ym-changelog-modal') && !el.closest('#ym-mod-toast-container')) {
          if (!el.dataset.ymChangelogHooked) {
            el.dataset.ymChangelogHooked = 'true';
            el.title = 'Открыть историю изменений мода (Changelog)';
            el.style.cursor = 'pointer';
            el.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              openChangelogModal();
            };
          }
        }
      }
    });
  }

  // ---------------------------------------------------------
  // 6. INJECTED UI & MOD CENTER PANEL
  // ---------------------------------------------------------
  function injectNavButton() {
    if (document.getElementById('ym-mod-open-btn')) return;

    const targetNav = document.querySelector('aside') ||
                      document.querySelector('nav') ||
                      document.querySelector('[class*="Sidebar_"]') ||
                      document.querySelector('[class*="navigation"]');
    
    const btn = document.createElement('button');
    btn.id = 'ym-mod-open-btn';
    btn.className = 'ym-mod-nav-btn';
    btn.innerHTML = `⚡ <span>Настройки мода</span>`;
    btn.title = 'Открыть Центр настроек мода (Ctrl+M)';
    btn.onclick = toggleModModal;

    if (targetNav) {
      targetNav.appendChild(btn);
    } else {
      btn.style.position = 'fixed';
      btn.style.top = '10px';
      btn.style.right = '120px';
      btn.style.zIndex = '9999';
      document.body.appendChild(btn);
    }
  }

  function injectPlayerDownloadButton() {
    if (document.getElementById('ym-mod-player-dl')) return;

    const playerControls = document.querySelector('[class*="PlayerControls_root"]') || 
                           document.querySelector('[class*="player-controls"]') ||
                           document.querySelector('[class*="playerActions"]') ||
                           document.querySelector('footer');

    if (!playerControls) return;

    const dlBtn = document.createElement('button');
    dlBtn.id = 'ym-mod-player-dl';
    dlBtn.className = 'ym-mod-player-dl-btn';
    dlBtn.title = 'Скачать текущий трек с обложкой и тегами в MP3/FLAC';
    dlBtn.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/>
      </svg>
    `;

    dlBtn.onclick = async () => {
      const track = getCurrentPlayingTrack();
      if (!track || (!track.title && !track.id)) {
        showToast('Включите трек, чтобы скачать его', 'error');
        return;
      }

      showToast(`Начало скачивания: ${track.artists[0]?.name} — ${track.title}...`, 'info');
      try {
        const res = await window.yandexMod.downloadTrack(track);
        if (res && res.success) {
          showToast(`✅ Скачано: ${res.filename}`, 'success', 4500);
        } else {
          showToast(`Ошибка скачивания: ${res?.error || 'Неизвестная ошибка'}`, 'error');
        }
      } catch (e) {
        showToast(`Ошибка: ${e.message}`, 'error');
      }
    };

    playerControls.appendChild(dlBtn);
  }

  function injectHeaderDownloadButton() {
    const entity = getEntityFromUrl();
    const existingBtn = document.getElementById('ym-mod-header-dl');

    if (!entity) {
      if (existingBtn) existingBtn.remove();
      return;
    }

    const entityKey = `${entity.type}:${entity.id || entity.userId + '_' + entity.kind || entity.uuid}`;
    if (existingBtn && existingBtn.dataset.entityKey === entityKey) return;
    if (existingBtn) existingBtn.remove();

    const headerActions = document.querySelector('[class*="MetaActions_root"]') ||
                          document.querySelector('[class*="headerActions"]') ||
                          document.querySelector('[class*="ActionButtons"]') ||
                          document.querySelector('main h1')?.parentElement;

    if (!headerActions) return;

    const dlBtn = document.createElement('button');
    dlBtn.id = 'ym-mod-header-dl';
    dlBtn.dataset.entityKey = entityKey;
    dlBtn.className = 'ym-mod-header-dl-btn';
    
    if (entity.type === 'album') {
      dlBtn.textContent = '⬇️ Скачать весь альбом в MP3';
      dlBtn.onclick = async () => {
        showToast('Загрузка списка треков альбома...', 'info');
        const res = await window.yandexMod.downloadAlbum(entity.id);
        if (res && res.success) {
          showToast(`✅ Альбом "${res.albumTitle}" скачан (${res.downloadedCount}/${res.totalCount} треков)!`, 'success', 5000);
        }
      };
    } else if (entity.type === 'playlist') {
      dlBtn.textContent = '⬇️ Скачать всю коллекцию / плейлист в MP3';
      dlBtn.onclick = async () => {
        showToast('Загрузка списка треков...', 'info');
        const res = await window.yandexMod.downloadPlaylist({ userId: entity.userId, playlistKind: entity.kind, uuid: entity.uuid });
        if (res && res.success) {
          showToast(`✅ Скачано (${res.downloadedCount}/${res.totalCount} треков)!`, 'success', 5000);
        }
      };
    }

    headerActions.appendChild(dlBtn);
  }

  function createModModal() {
    let overlay = document.getElementById('ym-mod-overlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'ym-mod-overlay';
    overlay.style.display = 'none';

    overlay.onclick = (e) => {
      if (e.target === overlay) toggleModModal();
    };

    overlay.innerHTML = `
      <div id="ym-mod-modal">
        <div class="ym-mod-header">
          <div class="ym-mod-title">
            <span>⚡ Yandex Music Mod Center</span>
            <span class="badge">PRO v5.116 PLUS UNLOCKED</span>
          </div>
          <button class="ym-mod-close-btn" id="ym-mod-close">&times;</button>
        </div>

        <div class="ym-mod-tabs">
          <button class="ym-mod-tab active" data-tab="tab-download">📥 Загрузка Музыки</button>
          <button class="ym-mod-tab" data-tab="tab-backup">📦 Бэкап и Перенос ("Мне нравится")</button>
          <button class="ym-mod-tab" data-tab="tab-system">✨ Оформление и Опции</button>
        </div>

        <div class="ym-mod-body">
          <!-- TAB 1: DOWNLOAD -->
          <div class="ym-tab-content" id="tab-download">
            <div class="ym-mod-section">
              <div class="ym-mod-section-title">📥 Настройки сохранения музыки в файлы</div>

              <div class="ym-mod-label">
                <div class="ym-mod-label-title">Папка для загрузок</div>
                <div class="ym-mod-label-desc">Куда сохранять треки, альбомы и плейлисты</div>
              </div>
              <div class="ym-mod-input-group">
                <input type="text" class="ym-mod-input" id="ym-dl-path" value="${settings.downloadPath}" readonly>
                <button class="ym-mod-btn" id="ym-dl-choose">Обзор...</button>
                <button class="ym-mod-btn ym-mod-btn-primary" id="ym-dl-open">Открыть папку</button>
              </div>

              <div class="ym-mod-row" style="margin-top: 10px;">
                <div class="ym-mod-label">
                  <div class="ym-mod-label-title">Качество аудио</div>
                  <div class="ym-mod-label-desc">Битрейт скачиваемых файлов</div>
                </div>
                <select class="ym-mod-select" id="ym-dl-quality">
                  <option value="mp3_320" ${settings.downloadQuality === 'mp3_320' ? 'selected' : ''}>MP3 (320 kbps - Высокое качество)</option>
                  <option value="flac" ${settings.downloadQuality === 'flac' ? 'selected' : ''}>FLAC (Lossless - Без потерь)</option>
                  <option value="mp3_192" ${settings.downloadQuality === 'mp3_192' ? 'selected' : ''}>MP3 (192 kbps - Стандартное)</option>
                </select>
              </div>

              <div class="ym-mod-row">
                <div class="ym-mod-label">
                  <div class="ym-mod-label-title">Вшивать ID3-теги и HD-обложки</div>
                  <div class="ym-mod-label-desc">Название, артист, альбом, год и обложка прямо в файл</div>
                </div>
                <label class="ym-mod-switch">
                  <input type="checkbox" id="ym-embed-tags" ${settings.embedTags ? 'checked' : ''}>
                  <span class="ym-mod-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <!-- TAB 2: BACKUP & RESTORE -->
          <div class="ym-tab-content" id="tab-backup" style="display: none;">
            <div class="ym-mod-section">
              <div class="ym-mod-section-title">📦 Сохранение и перенос коллекции "Мне нравится"</div>
              <div class="ym-mod-label-desc" style="margin-bottom: 12px;">
                Экспортируйте все ваши любимые треки в файл на случай блокировки аккаунта. В случае регистрации нового аккаунта вы сможете мгновенно восстановить всю библиотеку лайков одной кнопкой!
              </div>

              <div class="ym-mod-row" style="gap: 10px; margin-top: 8px;">
                <button class="ym-mod-btn ym-mod-btn-primary" id="ym-backup-export-json" style="flex: 1; padding: 10px;">
                  📦 Экспорт в JSON (Полный бэкап)
                </button>
                <button class="ym-mod-btn" id="ym-backup-export-txt" style="flex: 1; padding: 10px;">
                  📄 Экспорт в TXT (Артист - Трек)
                </button>
              </div>

              <div class="ym-mod-row" style="margin-top: 14px;">
                <button class="ym-mod-btn" id="ym-backup-restore-btn" style="width: 100%; justify-content: center; padding: 12px; background: #2563eb; color: #fff; border-color: #3b82f6; font-weight: 600;">
                  📥 Восстановить треки в "Мне нравится" (Импорт JSON/TXT)
                </button>
              </div>

              <div id="ym-restore-progress-card" style="display: none; margin-top: 14px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px;">
                <div style="font-size: 13px; font-weight: 600; color: #ffcc00; margin-bottom: 6px;" id="ym-restore-title">
                  ⏳ Восстановление треков...
                </div>
                <div style="font-size: 12px; color: #ccc;" id="ym-restore-status">
                  Обработка треков...
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 3: SYSTEM -->
          <div class="ym-tab-content" id="tab-system" style="display: none;">
            <div class="ym-mod-section">
              <div class="ym-mod-section-title">✨ Оформление и интеграции</div>

              <div class="ym-mod-row">
                <div class="ym-mod-label">
                  <div class="ym-mod-label-title">OLED True Black тема</div>
                  <div class="ym-mod-label-desc">Глубокий чёрный фон #000000 для всех страниц (AMOLED)</div>
                </div>
                <label class="ym-mod-switch">
                  <input type="checkbox" id="ym-oled-toggle" ${settings.oledTheme ? 'checked' : ''}>
                  <span class="ym-mod-slider"></span>
                </label>
              </div>

              <div class="ym-mod-row">
                <div class="ym-mod-label">
                  <div class="ym-mod-label-title">Discord Rich Presence (RPC)</div>
                  <div class="ym-mod-label-desc">Отображать текущую песню и обложку в статусе Discord</div>
                </div>
                <label class="ym-mod-switch">
                  <input type="checkbox" id="ym-discord-toggle" ${settings.discordRpcEnabled ? 'checked' : ''}>
                  <span class="ym-mod-slider"></span>
                </label>
              </div>

              <div class="ym-mod-row">
                <div class="ym-mod-label">
                  <div class="ym-mod-label-title">Инструменты разработчика (DevTools)</div>
                  <div class="ym-mod-label-desc">Открытие консоли разработчика по клавише F12</div>
                </div>
                <label class="ym-mod-switch">
                  <input type="checkbox" id="ym-devtools-toggle" ${settings.enableDevTools ? 'checked' : ''}>
                  <span class="ym-mod-slider"></span>
                </label>
              </div>

              <div class="ym-mod-row">
                <div class="ym-mod-label">
                  <div class="ym-mod-label-title">Защита от перезаписи (No Auto-Update)</div>
                  <div class="ym-mod-label-desc">Блокирует автоматическое обновление клиентом, сохраняя ваши моды</div>
                </div>
                <label class="ym-mod-switch">
                  <input type="checkbox" id="ym-update-toggle" ${settings.preventAutoUpdate ? 'checked' : ''}>
                  <span class="ym-mod-slider"></span>
                </label>
              </div>

              <div class="ym-mod-row">
                <div class="ym-mod-label">
                  <div class="ym-mod-label-title">Сворачивать в трей при закрытии</div>
                  <div class="ym-mod-label-desc">При нажатии на крестик окно сворачивается в фоновый режим</div>
                </div>
                <label class="ym-mod-switch">
                  <input type="checkbox" id="ym-tray-toggle" ${settings.closeToTray ? 'checked' : ''}>
                  <span class="ym-mod-slider"></span>
                </label>
              </div>

              <div class="ym-mod-row" style="margin-top: 15px;">
                <button class="ym-mod-btn" id="ym-open-changelog-btn" style="width: 100%; justify-content: center; padding: 10px;">
                  📜 Открыть историю изменений (Changelog с GitHub)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelectorAll('.ym-mod-tab').forEach(tab => {
      tab.onclick = () => {
        overlay.querySelectorAll('.ym-mod-tab').forEach(t => t.classList.remove('active'));
        overlay.querySelectorAll('.ym-tab-content').forEach(c => c.style.display = 'none');
        tab.classList.add('active');
        const contentId = tab.dataset.tab;
        document.getElementById(contentId).style.display = 'flex';
      };
    });

    document.getElementById('ym-mod-close').onclick = toggleModModal;

    document.getElementById('ym-dl-choose').onclick = async () => {
      const newPath = await window.yandexMod.selectFolder();
      if (newPath) {
        document.getElementById('ym-dl-path').value = newPath;
      }
    };
    document.getElementById('ym-dl-open').onclick = () => window.yandexMod.openFolder();
    document.getElementById('ym-dl-quality').onchange = (e) => {
      debouncedSaveSettings({ downloadQuality: e.target.value });
    };
    document.getElementById('ym-embed-tags').onchange = (e) => {
      debouncedSaveSettings({ embedTags: e.target.checked, embedCover: e.target.checked });
    };

    const oledToggle = document.getElementById('ym-oled-toggle');
    oledToggle.onchange = (e) => {
      document.body.classList.toggle('ym-oled-theme', e.target.checked);
      debouncedSaveSettings({ oledTheme: e.target.checked });
    };

    document.getElementById('ym-discord-toggle').onchange = (e) => {
      debouncedSaveSettings({ discordRpcEnabled: e.target.checked });
    };
    document.getElementById('ym-devtools-toggle').onchange = (e) => {
      debouncedSaveSettings({ enableDevTools: e.target.checked });
    };
    document.getElementById('ym-update-toggle').onchange = (e) => {
      debouncedSaveSettings({ preventAutoUpdate: e.target.checked });
    };
    document.getElementById('ym-tray-toggle').onchange = (e) => {
      debouncedSaveSettings({ closeToTray: e.target.checked });
    };
    document.getElementById('ym-backup-export-json').onclick = async () => {
      showToast('Сбор треков для резервной копии...', 'info');
      try {
        const domTracks = collectVisibleDomTracks();
        const res = await window.yandexMod.exportBackup('json', domTracks);
        if (res && res.success) {
          showToast(`✅ Бэкап сохранён: ${res.count} треков!`, 'success', 5000);
        } else if (!res?.canceled) {
          showToast(`Ошибка экспорта: ${res?.error || 'Не удалось сохранить'}`, 'error');
        }
      } catch (e) {
        showToast(`Ошибка: ${e.message}`, 'error');
      }
    };

    document.getElementById('ym-backup-export-txt').onclick = async () => {
      showToast('Сбор треков для TXT списка...', 'info');
      try {
        const domTracks = collectVisibleDomTracks();
        const res = await window.yandexMod.exportBackup('txt', domTracks);
        if (res && res.success) {
          showToast(`✅ Список сохранён: ${res.count} треков!`, 'success', 5000);
        } else if (!res?.canceled) {
          showToast(`Ошибка экспорта: ${res?.error || 'Не удалось сохранить'}`, 'error');
        }
      } catch (e) {
        showToast(`Ошибка: ${e.message}`, 'error');
      }
    };

    document.getElementById('ym-backup-restore-btn').onclick = async () => {
      const progressCard = document.getElementById('ym-restore-progress-card');
      const progressTitle = document.getElementById('ym-restore-title');
      const progressStatus = document.getElementById('ym-restore-status');
      
      progressCard.style.display = 'block';
      progressTitle.textContent = '⏳ Выберите файл бэкапа (JSON или TXT)...';
      progressStatus.textContent = 'Ожидание выбора файла...';

      try {
        const res = await window.yandexMod.restoreBackup();
        if (res && res.success) {
          progressTitle.textContent = '🎉 Восстановление успешно завершено!';
          progressStatus.textContent = `Добавлено в "Мне нравится": ${res.restoredCount} из ${res.total} треков.`;
          showToast(`✅ Восстановлено ${res.restoredCount} треков! Обновите страницу.`, 'success', 6000);
        } else if (res?.canceled) {
          progressCard.style.display = 'none';
        } else {
          progressTitle.textContent = '❌ Ошибка восстановления';
          progressStatus.textContent = res?.error || 'Не удалось восстановить треки.';
          showToast(`Ошибка: ${res?.error || 'Сбой восстановления'}`, 'error');
        }
      } catch (e) {
        progressTitle.textContent = '❌ Ошибка восстановления';
        progressStatus.textContent = e.message;
        showToast(`Ошибка: ${e.message}`, 'error');
      }
    };

    if (window.yandexMod && window.yandexMod.onRestoreProgress) {
      window.yandexMod.onRestoreProgress((p) => {
        const progressCard = document.getElementById('ym-restore-progress-card');
        const progressTitle = document.getElementById('ym-restore-title');
        const progressStatus = document.getElementById('ym-restore-status');
        if (progressCard) progressCard.style.display = 'block';
        if (progressTitle) progressTitle.textContent = `⏳ Восстановление: ${p.current}/${p.total} треков (${p.restoredCount} добавлено)`;
        if (progressStatus) progressStatus.textContent = `Текущий трек: ${p.trackName || ''}`;
      });
    }

    document.getElementById('ym-open-changelog-btn').onclick = () => {
      toggleModModal();
      openChangelogModal();
    };

    return overlay;
  }

  function toggleModModal() {
    let overlay = document.getElementById('ym-mod-overlay');
    if (!overlay) {
      overlay = createModModal();
    }
    const isHidden = overlay.style.display === 'none';
    overlay.style.display = isHidden ? 'flex' : 'none';
  }

  async function init() {
    initToasts();
    initDiscordRpcSync();

    try {
      if (window.yandexMod && window.yandexMod.getSettings) {
        settings = await window.yandexMod.getSettings();
        if (settings.oledTheme) {
          document.body.classList.add('ym-oled-theme');
        }
      }
    } catch (e) {
      console.warn('[ModClient] Failed to load settings from main:', e);
    }

    createModModal();

    setInterval(() => {
      injectNavButton();
      injectPlayerDownloadButton();
      injectHeaderDownloadButton();
      hookVersionButton();
    }, 1200);

    if (window.yandexMod && window.yandexMod.onTogglePanel) {
      window.yandexMod.onTogglePanel(() => toggleModModal());
    }

    console.log('[YandexMusicMod] Mod Client v2.5 initialized successfully.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
