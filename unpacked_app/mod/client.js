// Yandex Music Enhanced Mod - Renderer Script v2.5
(function() {
  console.log('[YandexMusicMod] Injecting Mod Client v2.5...');

  const GITHUB_CHANGELOG_URL = 'https://raw.githubusercontent.com/KiryaScript/yamu-player/refs/heads/main/CHANGELOG.md';

  // Global mod-level variables and non-intercepting fetch (accessible everywhere in client.js)
  const origFetch = typeof window !== 'undefined' && window.fetch ? window.fetch.bind(window) : null;
  const safeFetch = (url, opts) => (origFetch ? origFetch(url, opts) : fetch(url, opts));
  const _recentTrackHistory = [];
  const _trackMetaCache = {};

  function recordTrackId(id) {
    if (!id) return;
    const sId = String(id);
    const idx = _recentTrackHistory.indexOf(sId);
    if (idx !== -1) {
      _recentTrackHistory.splice(idx, 1);
    }
    _recentTrackHistory.push(sId);
    if (_recentTrackHistory.length > 30) _recentTrackHistory.shift();
  }
  window.__ymModRecordTrackId = recordTrackId;
  window.__ymModGetRecentTrackHistory = () => _recentTrackHistory;
  window.__ymModGetTrackMetaCache = () => _trackMetaCache;
  window.__ymModSafeFetch = safeFetch;

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

    if (origFetch) {
      window.fetch = async function(...args) {
        const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');

        // 1. Intercept track IDs from any player network requests (Vibe, Wave, Radio, Playlist)
        const mTrack = url.match(/\/tracks\/(\d+)/i) || url.match(/trackIds?=(\d+)/i);
        if (mTrack && mTrack[1]) {
          recordTrackId(mTrack[1]);
        }

        const res = await origFetch.apply(this, args);

        // Passively cache metadata if this was already a /tracks/{id} call from the player
        if (mTrack && mTrack[1] && url.includes('/tracks/') && !url.includes('/download-info')) {
          try {
            const clone = res.clone();
            clone.json().then(data => {
              const tr = data?.result?.[0];
              if (tr && tr.id) {
                _trackMetaCache[String(tr.id)] = tr;
              }
            }).catch(() => {});
          } catch (e) {}
        }

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
      const mTrack = typeof url === 'string' && (url.match(/\/tracks\/(\d+)/i) || url.match(/trackIds?=(\d+)/i));
      if (mTrack && mTrack[1]) {
        recordTrackId(mTrack[1]);
      }
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

    // Continuous poller for externalAPI (catches track ID when playback switches)
    setInterval(() => {
      try {
        if (window.externalAPI && typeof window.externalAPI.getCurrentTrack === 'function') {
          const t = window.externalAPI.getCurrentTrack();
          if (t && (t.id || t.realId || t.trackId)) {
            recordTrackId(t.id || t.realId || t.trackId);
          }
        }
      } catch (e) {}
    }, 1000);
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

  function getTrackFromExternalApi() {
    try {
      if (window.externalAPI && typeof window.externalAPI.getCurrentTrack === 'function') {
        const t = window.externalAPI.getCurrentTrack();
        if (t && (t.id || t.title)) {
          let artists = [{ name: 'Unknown Artist' }];
          if (Array.isArray(t.artists) && t.artists.length > 0) {
            artists = t.artists.map(a => ({ name: typeof a === 'string' ? a : (a.name || 'Unknown') }));
          } else if (typeof t.artist === 'string' && t.artist) {
            artists = [{ name: t.artist }];
          }

          let albumTitle = '';
          if (t.album && typeof t.album === 'object') albumTitle = t.album.title || '';
          else if (typeof t.album === 'string') albumTitle = t.album;
          else if (Array.isArray(t.albums) && t.albums[0]) albumTitle = t.albums[0].title || '';

          let cover = t.cover || '';
          if (cover && !cover.startsWith('http')) {
            cover = `https://${cover.replace('%%', '400x400')}`;
          }

          let trackId = t.id || t.trackId || t.realId;
          if (!trackId && t.link) {
            const m = String(t.link).match(/\/track\/(\d+)/);
            if (m) trackId = m[1];
          }

          return {
            id: trackId ? String(trackId) : null,
            trackId: trackId ? String(trackId) : null,
            title: t.title || 'Unknown Title',
            version: t.version || '',
            artists,
            albums: [{ title: albumTitle }],
            coverUri: cover,
            duration: typeof t.duration === 'number' ? t.duration : 0
          };
        }
      }
    } catch (e) {}
    return null;
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
      const playerBar = document.querySelector('[class*="PlayerBar"], [class*="playerBar"], [class*="Player_root"], [class*="VibePlayerBar"], [data-test-id*="PLAYER"], footer');
      if (playerBar) {
        const titleEl = playerBar.querySelector('[class*="trackTitle"], [class*="TrackTitle"], [class*="title"], [class*="trackName"], [data-test-id*="TITLE"], a[href*="/album/"]');
        if (!title && titleEl && titleEl.textContent.trim()) {
          title = titleEl.textContent.trim();
        }

        const artistEl = playerBar.querySelector('[class*="trackArtists"], [class*="TrackArtists"], [class*="artists"], [class*="artist"], [class*="author"], [data-test-id*="ARTIST"], a[href*="/artist/"]');
        if (!artist && artistEl && artistEl.textContent.trim()) {
          artist = artistEl.textContent.trim();
        }

        const imgEl = playerBar.querySelector('img');
        if (!coverUri && imgEl && imgEl.src) {
          coverUri = imgEl.src;
        }

        // React Fiber on playerBar (extract currently rendered track from Virtual DOM)
        const candidates = [playerBar, titleEl, playerBar.querySelector('[class*="track"]'), playerBar.querySelector('[class*="item"]')].filter(Boolean);
        for (const el of candidates) {
          const fKey = Object.keys(el).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactProps'));
          if (fKey && el[fKey]) {
            let cur = el[fKey];
            for (let depth = 0; depth < 15 && cur; depth++) {
              const p = cur.memoizedProps || cur.props;
              const tr = p?.track || p?.currentTrack || p?.entity;
              if (tr && (tr.id || tr.realId || tr.trackId)) {
                const fTitle = (tr.title || '').toLowerCase().trim();
                const dTitle = (title || '').toLowerCase().trim();
                if (!dTitle || !fTitle || fTitle === dTitle || fTitle.includes(dTitle) || dTitle.includes(fTitle)) {
                  trackId = String(tr.id || tr.realId || tr.trackId);
                  if (!title && tr.title) title = tr.title;
                  if (!artist && tr.artists?.[0]?.name) artist = tr.artists[0].name;
                  if (!coverUri && tr.coverUri) coverUri = `https://${tr.coverUri.replace('%%', '400x400')}`;
                  break;
                }
              }
              cur = cur.return;
            }
            if (trackId) break;
          }
        }

        // Scan playerBar links for track ID
        if (!trackId) {
          const allLinks = playerBar.querySelectorAll('a[href]');
          for (const a of allLinks) {
            const m = a.href.match(/\/track\/(\d+)/);
            if (m) {
              trackId = m[1];
              break;
            }
          }
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

      // Priority fallback: legacy externalAPI if present
      if (!title || !trackId) {
        const apiTrack = getTrackFromExternalApi();
        if (apiTrack) {
          if (!trackId && apiTrack.id) trackId = apiTrack.id;
          if (!title && apiTrack.title) title = apiTrack.title;
          if (!artist && apiTrack.artists?.[0]?.name) artist = apiTrack.artists[0].name;
          if (!coverUri && apiTrack.coverUri) coverUri = apiTrack.coverUri;
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

  // Smart client-side resolver based on intercepted player network requests and Chromium fetch
  // Compares cover and title to strictly reject preloaded upcoming tracks!
  async function resolveTrackIdClientSide(title, artist = '', coverUri = '') {
    const recent = window.__ymModGetRecentTrackHistory ? window.__ymModGetRecentTrackHistory() : [];
    const metaCache = window.__ymModGetTrackMetaCache ? window.__ymModGetTrackMetaCache() : {};
    const searchTitle = (title || '').toLowerCase().trim();

    // 1. Check intercepted recent track IDs from the player's own requests
    if (recent.length > 0) {
      const ids = [...recent].reverse();
      for (const id of ids) {
        try {
          let meta = metaCache[id];
          if (!meta) {
            const res = await safeFetch(`https://api.music.yandex.ru/tracks/${id}`, { credentials: 'include' });
            if (res.ok) {
              const data = await res.json();
              meta = data?.result?.[0];
              if (meta) metaCache[id] = meta;
            }
          }
          if (meta) {
            // A. BULLETPROOF: Compare covers (cleanly rejects preloaded next tracks!)
            if (coverUri && meta.coverUri) {
              const cleanCover = meta.coverUri.replace('%%', '');
              if (coverUri.includes(cleanCover)) {
                console.log(`[Mod Resolver] Matched track ID ${id} via cover ("${meta.title}")`);
                return { id: String(id), meta };
              }
            }
            // B. Exact or substring title match
            const metaTitle = (meta.title || '').toLowerCase().trim();
            if (searchTitle && (metaTitle === searchTitle || metaTitle.includes(searchTitle) || searchTitle.includes(metaTitle))) {
              console.log(`[Mod Resolver] Matched track ID ${id} via title ("${meta.title}")`);
              return { id: String(id), meta };
            }
          }
        } catch (e) {}
      }
    }

    // 2. Client-side Search API (runs with native Chromium session & origin)
    try {
      const cleanArtist = (artist === 'Яндекс Музыка' || artist === 'Unknown Artist') ? '' : artist;
      const query = `${cleanArtist} ${title}`.trim();
      if (query) {
        const sRes = await safeFetch(`https://api.music.yandex.ru/search?text=${encodeURIComponent(query)}&type=track&page=0`, { credentials: 'include' });
        if (sRes.ok) {
          const sData = await sRes.json();
          const results = sData?.result?.tracks?.results || [];
          for (const tr of results) {
            if (coverUri && tr.coverUri) {
              const cleanCover = tr.coverUri.replace('%%', '');
              if (coverUri.includes(cleanCover)) {
                console.log(`[Mod Resolver] Matched track ID ${tr.id} via search + cover ("${tr.title}")`);
                return { id: String(tr.id), meta: tr };
              }
            }
            if (searchTitle && (tr.title || '').toLowerCase().trim() === searchTitle) {
              console.log(`[Mod Resolver] Matched track ID ${tr.id} via search title ("${tr.title}")`);
              return { id: String(tr.id), meta: tr };
            }
          }
          if (results[0] && results[0].id) {
            console.log(`[Mod Resolver] Resolved track ID ${results[0].id} via first search result ("${results[0].title}")`);
            return { id: String(results[0].id), meta: results[0] };
          }
        }
      }
      if (title) {
        const sRes2 = await safeFetch(`https://api.music.yandex.ru/search?text=${encodeURIComponent(title.trim())}&type=track&page=0`, { credentials: 'include' });
        if (sRes2.ok) {
          const sData2 = await sRes2.json();
          const results2 = sData2?.result?.tracks?.results || [];
          if (results2[0] && results2[0].id) {
            console.log(`[Mod Resolver] Resolved track ID ${results2[0].id} for title "${title}" via client search`);
            return { id: String(results2[0].id), meta: results2[0] };
          }
        }
      }
    } catch (e) {
      console.warn('[Mod Resolver] Error during client resolution:', e);
    }

    return null;
  }

  // Directly resolves direct audio URL from Chromium with active browser session & web salt
  async function resolveDirectDownloadUrlClientSide(trackId) {
    if (!trackId) return null;
    try {
      const infoRes = await safeFetch(`https://api.music.yandex.ru/tracks/${trackId}/download-info`, { credentials: 'include' });
      if (!infoRes.ok) return null;
      const infoData = await infoRes.json();
      const variants = infoData?.result || [];
      if (!variants.length) return null;

      // Prefer non-preview with highest bitrate, or any highest bitrate variant
      const pool = variants.filter(v => v.codec === 'mp3' && !v.preview);
      const chosen = pool.length > 0 
        ? pool.sort((a, b) => b.bitrateInKbps - a.bitrateInKbps)[0] 
        : variants.sort((a, b) => b.bitrateInKbps - a.bitrateInKbps)[0];

      if (!chosen || !chosen.downloadInfoUrl) return null;

      const xmlRes = await safeFetch(chosen.downloadInfoUrl);
      if (!xmlRes.ok) return null;
      const xmlText = await xmlRes.text();
      const xmlDoc = new DOMParser().parseFromString(xmlText, 'text/xml');
      const host = xmlDoc.querySelector('host')?.textContent;
      const path = xmlDoc.querySelector('path')?.textContent;
      const ts   = xmlDoc.querySelector('ts')?.textContent;
      const s    = xmlDoc.querySelector('s')?.textContent;
      if (!host || !path || !ts || !s) return null;

      const MD5_SALT = 'XGRlBW9FXlekgbPrRHuSiA';
      const cleanPath = path.startsWith('/') ? path.substring(1) : path;
      const signString = MD5_SALT + cleanPath + s;

      function md5(string) {
        function safeAdd(x, y) { const lsw = (x & 0xFFFF) + (y & 0xFFFF); const msw = (x >> 16) + (y >> 16) + (lsw >> 16); return (msw << 16) | (lsw & 0xFFFF); }
        function bitRotateLeft(num, cnt) { return (num << cnt) | (num >>> (32 - cnt)); }
        function md5cmn(q, a, b, x, s, t) { return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b); }
        function md5ff(a,b,c,d,x,s,t){ return md5cmn((b&c)|((~b)&d),a,b,x,s,t); }
        function md5gg(a,b,c,d,x,s,t){ return md5cmn((b&d)|(c&(~d)),a,b,x,s,t); }
        function md5hh(a,b,c,d,x,s,t){ return md5cmn(b^c^d,a,b,x,s,t); }
        function md5ii(a,b,c,d,x,s,t){ return md5cmn(c^(b|(~d)),a,b,x,s,t); }
        const M = new Array(Math.ceil((string.length + 8) / 64) * 64 / 4).fill(0);
        for (let i=0; i<string.length; i++) M[i >> 2] |= string.charCodeAt(i) << ((i%4)*8);
        M[string.length >> 2] |= 0x80 << ((string.length%4)*8); M[M.length-2] = string.length*8;
        let a=1732584193, b=-271733879, c=-1732584194, d=271733878;
        for (let i=0; i<M.length; i+=16) {
          const [oa,ob,oc,od]=[a,b,c,d];
          a=md5ff(a,b,c,d,M[i+ 0], 7,-680876936); d=md5ff(d,a,b,c,M[i+ 1],12,-389564586); c=md5ff(c,d,a,b,M[i+ 2],17, 606105819); b=md5ff(b,c,d,a,M[i+ 3],22,-1044525330);
          a=md5ff(a,b,c,d,M[i+ 4], 7,-176418897); d=md5ff(d,a,b,c,M[i+ 5],12, 1200080426); c=md5ff(c,d,a,b,M[i+ 6],17,-1473231341);b=md5ff(b,c,d,a,M[i+ 7],22,-45705983);
          a=md5ff(a,b,c,d,M[i+ 8], 7, 1770035416); d=md5ff(d,a,b,c,M[i+ 9],12,-1958414417); c=md5ff(c,d,a,b,M[i+10],17,-42063);      b=md5ff(b,c,d,a,M[i+11],22,-1990404162);
          a=md5ff(a,b,c,d,M[i+12], 7, 1804603682); d=md5ff(d,a,b,c,M[i+13],12,-40341101); c=md5ff(c,d,a,b,M[i+14],17,-1502002290);b=md5ff(b,c,d,a,M[i+15],22, 1236535329);
          a=md5gg(a,b,c,d,M[i+ 1], 5,-165796510); d=md5gg(d,a,b,c,M[i+ 6], 9,-1069501632); c=md5gg(c,d,a,b,M[i+11],14, 643717713); b=md5gg(b,c,d,a,M[i+ 0],20,-373897302);
          a=md5gg(a,b,c,d,M[i+ 5], 5,-701558691); d=md5gg(d,a,b,c,M[i+10], 9, 38016083); c=md5gg(c,d,a,b,M[i+15],14,-660478335); b=md5gg(b,c,d,a,M[i+ 4],20,-405537848);
          a=md5gg(a,b,c,d,M[i+ 9], 5, 568446438); d=md5gg(d,a,b,c,M[i+14], 9,-1019803690); c=md5gg(c,d,a,b,M[i+ 3],14,-187363961); b=md5gg(b,c,d,a,M[i+ 8],20,1163531501);
          a=md5gg(a,b,c,d,M[i+13], 5,-1444681467);d=md5gg(d,a,b,c,M[i+ 2], 9,-51403784); c=md5gg(c,d,a,b,M[i+ 7],14,1735328473); b=md5gg(b,c,d,a,M[i+12],20,-1926607734);
          a=md5hh(a,b,c,d,M[i+ 5], 4,-378558);    d=md5hh(d,a,b,c,M[i+ 8],11,-2022574463); c=md5hh(c,d,a,b,M[i+11],16, 1839030562);b=md5hh(b,c,d,a,M[i+14],23,-35309556);
          a=md5hh(a,b,c,d,M[i+ 1], 4,-1530992060);d=md5hh(d,a,b,c,M[i+ 4],11, 1272893353); c=md5hh(c,d,a,b,M[i+ 7],16,-155497632); b=md5hh(b,c,d,a,M[i+10],23,-1094730640);
          a=md5hh(a,b,c,d,M[i+13], 4, 681279174); d=md5hh(d,a,b,c,M[i+ 0],11,-358537222); c=md5hh(c,d,a,b,M[i+ 3],16,-722521979); b=md5hh(b,c,d,a,M[i+ 6],23, 76029189);
          a=md5hh(a,b,c,d,M[i+ 9], 4,-640364487); d=md5hh(d,a,b,c,M[i+12],11,-421815835); c=md5hh(c,d,a,b,M[i+15],16, 530742520); b=md5hh(b,c,d,a,M[i+ 2],23,-995338651);
          a=md5ii(a,b,c,d,M[i+ 0], 6,-198630844); d=md5ii(d,a,b,c,M[i+ 7],10,1126891415); c=md5ii(c,d,a,b,M[i+14],15,-1416354905);b=md5ii(b,c,d,a,M[i+ 5],21,-57434055);
          a=md5ii(a,b,c,d,M[i+12], 6, 1700485571); d=md5ii(d,a,b,c,M[i+ 3],10,-1894986606); c=md5ii(c,d,a,b,M[i+10],15,-1051523);   b=md5ii(b,c,d,a,M[i+ 1],21,-2054922799);
          a=md5ii(a,b,c,d,M[i+ 8], 6, 1873313359); d=md5ii(d,a,b,c,M[i+15],10,-30611744); c=md5ii(c,d,a,b,M[i+ 6],15,-1560198380);b=md5ii(b,c,d,a,M[i+13],21, 1309151649);
          a=md5ii(a,b,c,d,M[i+ 4], 6,-145523070);  d=md5ii(d,a,b,c,M[i+11],10,-1120210379); c=md5ii(c,d,a,b,M[i+ 2],15, 718787259);  b=md5ii(b,c,d,a,M[i+ 9],21,-343485551);
          a=safeAdd(a,oa); b=safeAdd(b,ob); c=safeAdd(c,oc); d=safeAdd(d,od);
        }
        const out=[]; [a,b,c,d].forEach(n=>{ for(let j=0;j<4;j++) out.push((n>>>(j*8))&0xFF); });
        return out.map(b=>('0'+b.toString(16)).slice(-2)).join('');
      }

      const sign = md5(signString);
      const codecPrefix = (chosen.codec === 'flac') ? 'get-flac' : 'get-mp3';
      const directUrl = `https://${host}/${codecPrefix}/${sign}/${ts}${path}`;

      return {
        directUrl,
        codec: chosen.codec || 'mp3',
        bitrate: chosen.bitrateInKbps || 320
      };
    } catch (err) {
      console.warn('[Mod DirectResolver] Error resolving direct URL client-side:', err);
      return null;
    }
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

  // Fetches 100% of all tracks for any album, playlist or collection directly from Chromium
  async function fetchAllTracksForExport(entity) {
    // 1. Album (with-tracks returns 100% of tracks across all volumes)
    if (entity?.type === 'album' && entity.id) {
      try {
        const res = await safeFetch(`https://api.music.yandex.ru/albums/${entity.id}/with-tracks`, { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          const volumes = json?.result?.volumes || [];
          const tracks = volumes.flat();
          if (tracks && tracks.length > 0) return tracks;
        }
      } catch (e) {}
    }

    // 2. Playlists / Collection / Likes
    try {
      let uid = entity?.userId;
      let kind = entity?.kind;
      const isCollection = !uid || uid === 'likes' || kind === 'likes' || kind === '3' ||
                           window.location.pathname.includes('/collection') || 
                           window.location.pathname.includes('/mymusic');

      if (!uid || uid === 'likes') {
        if (window.yandexMod && typeof window.yandexMod.getCurrentUser === 'function') {
          try {
            const u = await window.yandexMod.getCurrentUser();
            if (u?.uid) uid = String(u.uid);
          } catch (e) {}
        }
      }

      if (!uid) {
        if (window.externalAPI && typeof window.externalAPI.getUser === 'function') {
          const u = window.externalAPI.getUser();
          if (u && u.uid) uid = String(u.uid);
        }
      }

      if (!uid) {
        try {
          const stRes = await safeFetch('https://api.music.yandex.ru/account/status', { credentials: 'include' });
          if (stRes.ok) {
            const stJson = await stRes.json();
            if (stJson?.result?.account?.uid) {
              uid = String(stJson.result.account.uid);
            }
          }
        } catch (e) {}
      }

      // Priority A: Collection / Likes ("Мне нравится")
      if (isCollection || kind === '3' || kind === 'likes') {
        kind = '3';
        if (uid) {
          try {
            const lRes = await safeFetch(`https://api.music.yandex.ru/users/${encodeURIComponent(uid)}/likes/tracks`, { credentials: 'include' });
            if (lRes.ok) {
              const lJson = await lRes.json();
              const lTracks = lJson?.result?.library?.tracks || lJson?.result?.tracks || [];
              if (Array.isArray(lTracks) && lTracks.length > 0) {
                console.log(`[Mod Export] Retrieved ${lTracks.length} liked tracks via likes/tracks`);
                // Batch resolve metadata in chunks of 100
                const ids = lTracks.map(t => t.id || t.trackId || t.track?.id).filter(Boolean);
                const fullTracks = [];
                for (let i = 0; i < ids.length; i += 100) {
                  const chunk = ids.slice(i, i + 100);
                  try {
                    const bRes = await safeFetch(`https://api.music.yandex.ru/tracks?trackIds=${chunk.join(',')}`);
                    if (bRes.ok) {
                      const bJson = await bRes.json();
                      if (Array.isArray(bJson?.result)) {
                        fullTracks.push(...bJson.result);
                      }
                    }
                  } catch (e) {}
                }
                if (fullTracks.length > 0) return fullTracks;
                return lTracks;
              }
            }
          } catch (e) {}
        }
      }

      // Priority B: Custom playlist by UID and kind
      if (uid && kind && kind !== '3' && kind !== 'likes') {
        try {
          const pRes = await safeFetch(`https://api.music.yandex.ru/users/${encodeURIComponent(uid)}/playlists/${encodeURIComponent(kind)}`, { credentials: 'include' });
          if (pRes.ok) {
            const pJson = await pRes.json();
            if (pJson?.result?.tracks && pJson.result.tracks.length > 0) {
              console.log(`[Mod Export] Retrieved ${pJson.result.tracks.length} tracks via users/${uid}/playlists/${kind}`);
              return pJson.result.tracks;
            }
          }
        } catch (e) {}
      }

      // Priority C: Playlist with UUID
      if (entity?.uuid) {
        try {
          const uRes = await safeFetch(`https://api.music.yandex.ru/playlists/${encodeURIComponent(entity.uuid)}`, { credentials: 'include' });
          if (uRes.ok) {
            const uJson = await uRes.json();
            if (uJson?.result?.tracks && uJson.result.tracks.length > 0) {
              return uJson.result.tracks;
            }
          }
        } catch (e) {}
      }
    } catch (err) {
      console.warn('[Mod Export] fetchAllTracksForExport error:', err);
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

  function openExportMenu(entity, defaultTitle = 'Плейлист', tracks = []) {
    let overlay = document.getElementById('ym-export-menu-overlay');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.id = 'ym-export-menu-overlay';
    overlay.className = 'ym-export-menu-overlay';
    overlay.onclick = (e) => {
      if (e.target === overlay) overlay.remove();
    };

    overlay.innerHTML = `
      <div class="ym-export-menu-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0; font-size: 17px; font-weight: 700; color: #ffcc00;">📄 Экспорт списка: ${defaultTitle}</h3>
          <button class="ym-mod-close-btn" id="ym-export-close">&times;</button>
        </div>
        <p style="font-size: 13px; color: #aaa; margin-top: 0; margin-bottom: 16px;">
          Выберите формат сохранения списка треков для экспорта или переноса на другой аккаунт:
        </p>
        <div>
          <button class="ym-export-option-btn" data-fmt="json">
            <span style="font-size: 20px;">📦</span>
            <div>
              <div style="font-weight: 600;">JSON (Полный бэкап)</div>
              <div style="font-size: 12px; color: #888;">Все метаданные, ID треков, альбомы и обложки</div>
            </div>
          </button>
          <button class="ym-export-option-btn" data-fmt="txt">
            <span style="font-size: 20px;">📄</span>
            <div>
              <div style="font-weight: 600;">TXT (Текстовый список)</div>
              <div style="font-size: 12px; color: #888;">Простой текстовый файл "Исполнитель - Название"</div>
            </div>
          </button>
          <button class="ym-export-option-btn" data-fmt="m3u8">
            <span style="font-size: 20px;">🎵</span>
            <div>
              <div style="font-weight: 600;">M3U8 (Стандартный плейлист)</div>
              <div style="font-size: 12px; color: #888;">Для плееров VLC, AIMP, Foobar2000, Winamp</div>
            </div>
          </button>
          <button class="ym-export-option-btn" data-fmt="csv">
            <span style="font-size: 20px;">📊</span>
            <div>
              <div style="font-weight: 600;">CSV (Таблица)</div>
              <div style="font-size: 12px; color: #888;">Для Excel, Google Таблиц и баз данных</div>
            </div>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.getElementById('ym-export-close').onclick = () => overlay.remove();

    overlay.querySelectorAll('.ym-export-option-btn').forEach(btn => {
      btn.onclick = async () => {
        const fmt = btn.dataset.fmt;
        overlay.remove();
        showToast(`Формирование ${fmt.toUpperCase()} файла (получение полного списка треков)...`, 'info');
        try {
          // Fetch complete server tracks list directly from Chromium session
          let serverTracks = await fetchAllTracksForExport(entity);
          const domTracks = collectVisibleDomTracks();
          const allTracks = (serverTracks && serverTracks.length > 0) ? serverTracks : (tracks.length > 0 ? tracks : domTracks);

          showToast(`Сохранение ${allTracks.length} треков...`, 'info');
          const res = await window.yandexMod.exportPlaylist({
            title: defaultTitle,
            owner: entity?.userId,
            kind: entity?.kind,
            tracks: allTracks
          }, fmt);

          if (res && res.success) {
            showToast(`✅ Список "${defaultTitle}" сохранён (${res.count} треков)!`, 'success', 5000);
          } else if (!res?.canceled) {
            showToast(`Ошибка экспорта: ${res?.error || 'Не удалось сохранить'}`, 'error');
          }
        } catch (err) {
          showToast(`Ошибка: ${err.message}`, 'error');
        }
      };
    });
  }

  function getTrackIdFromRow(row) {
    if (!row) return null;
    const trackLink = row.querySelector('a[href*="/track/"]');
    if (trackLink) {
      const m = trackLink.href.match(/\/track\/(\d+)/);
      if (m) return m[1];
    }
    if (row.dataset?.trackId) return String(row.dataset.trackId);
    if (row.getAttribute('data-track-id')) return String(row.getAttribute('data-track-id'));
    const dataB = row.getAttribute('data-b');
    if (dataB) {
      const m = dataB.match(/track[:_](\d+)/);
      if (m) return m[1];
    }
    // React Fiber extraction
    try {
      const key = Object.keys(row).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactProps'));
      if (key && row[key]) {
        let cur = row[key];
        for (let depth = 0; depth < 10 && cur; depth++) {
          const p = cur.memoizedProps || cur.props;
          if (p?.track?.id) return String(p.track.id);
          if (p?.trackId) return String(p.trackId);
          if (p?.id && (typeof p.id === 'number' || typeof p.id === 'string')) return String(p.id);
          if (p?.item?.id) return String(p.item.id);
          cur = cur.return;
        }
      }
    } catch (e) {}
    return null;
  }

  function injectTrackListButtons() {
    // If setting is disabled (default), remove any existing buttons to preserve 100% native UI
    if (!settings.showTrackListButtons) {
      const existingButtons = document.querySelectorAll('.ym-mod-track-dl-btn');
      if (existingButtons.length > 0) {
        existingButtons.forEach(b => b.remove());
      }
      return;
    }

    const trackSelectors = [
      '[class*="Track_root"]',
      '[class*="track_root"]',
      '[class*="TrackItem"]',
      '[class*="Entity_root"]'
    ];

    const rows = document.querySelectorAll(trackSelectors.join(', '));
    rows.forEach(row => {
      if (row.querySelector('.ym-mod-track-dl-btn')) return;

      const trackId = getTrackIdFromRow(row);
      const titleEl = row.querySelector('[class*="title" i], [class*="TrackTitle"], a[href*="/album/"]');
      if (!titleEl) return;

      const btn = document.createElement('button');
      btn.className = 'ym-mod-track-dl-btn';
      btn.title = 'Скачать этот трек в MP3/FLAC';
      btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>`;

      btn.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (btn.dataset.loading === 'true') return;
        btn.dataset.loading = 'true';
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `<span class="ym-mod-spin" style="font-size: 14px;">⏳</span>`;

        const titleText = titleEl.textContent.trim();
        let artistText = '';
        const artistEl = row.querySelector('[class*="artist" i]');
        if (artistEl) artistText = artistEl.textContent.trim();

        let currentId = trackId || getTrackIdFromRow(row);
        if (!currentId && titleText) {
          const res = await resolveTrackIdClientSide(titleText, artistText);
          currentId = res?.id || (typeof res === 'string' ? res : null);
        }

        let directUrl = null;
        let codec = 'mp3';
        let bitrate = 320;
        if (currentId) {
          try {
            const streamInfo = await resolveDirectDownloadUrlClientSide(currentId);
            if (streamInfo && streamInfo.directUrl) {
              directUrl = streamInfo.directUrl;
              codec = streamInfo.codec;
              bitrate = streamInfo.bitrate;
            }
          } catch (e) {}
        }

        showToast(`Начало скачивания: ${artistText ? artistText + ' — ' : ''}${titleText}...`, 'info');

        try {
          const res = await window.yandexMod.downloadTrack({
            id: currentId,
            directUrl,
            codec,
            bitrate,
            title: titleText,
            artists: [{ name: artistText || 'Unknown Artist' }]
          });

          if (res && res.success) {
            btn.innerHTML = `<span style="color: #22c55e; font-weight: bold;">✓</span>`;
            showToast(`✅ Скачано: ${res.filename}`, 'success', 4000);
            setTimeout(() => {
              btn.innerHTML = originalHtml;
              btn.dataset.loading = 'false';
            }, 3000);
          } else {
            throw new Error(res?.error || 'Не удалось скачать трек');
          }
        } catch (err) {
          btn.innerHTML = `<span style="color: #ef4444;">✕</span>`;
          showToast(`Ошибка: ${err.message}`, 'error');
          setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.dataset.loading = 'false';
          }, 3000);
        }
      };

      const actionsContainer = row.querySelector('[class*="actions" i], [class*="Actions"], [class*="buttons" i]');
      if (actionsContainer) {
        actionsContainer.prepend(btn);
      }
    });
  }

  async function downloadCurrentPlayingTrack(source = 'player') {
    let track = getCurrentPlayingTrack();
    if (!track || (!track.title && !track.id)) {
      showToast(source === 'quick' ? 'Включите трек, чтобы скачать его (Ctrl+D)' : 'Включите трек, чтобы скачать его', 'error');
      return;
    }

    const metaCache = window.__ymModGetTrackMetaCache ? window.__ymModGetTrackMetaCache() : {};
    let verifiedTrackId = null;

    // 1. If we already have a candidate track.id, verify it matches the current title or cover
    if (track.id) {
      let meta = metaCache[track.id];
      if (!meta) {
        try {
          const res = await safeFetch(`https://api.music.yandex.ru/tracks/${track.id}`, { credentials: 'include' });
          if (res.ok) {
            const json = await res.json();
            meta = json?.result?.[0];
            if (meta) metaCache[track.id] = meta;
          }
        } catch (e) {}
      }
      if (meta) {
        const metaTitle = (meta.title || '').toLowerCase().trim();
        const searchTitle = (track.title || '').toLowerCase().trim();
        const coverMatch = track.coverUri && meta.coverUri && track.coverUri.includes(meta.coverUri.replace('%%', ''));
        const titleMatch = searchTitle && (metaTitle === searchTitle || metaTitle.includes(searchTitle) || searchTitle.includes(metaTitle));
        if (coverMatch || titleMatch) {
          verifiedTrackId = String(track.id);
          if (meta.title) track.title = meta.title;
          if (meta.artists && meta.artists.length > 0) track.artists = meta.artists;
          if (meta.albums && meta.albums.length > 0) track.albums = meta.albums;
          if (meta.coverUri) track.coverUri = `https://${meta.coverUri.replace('%%', '400x400')}`;
        }
      }
    }

    // 2. If unverified or ID was missing (common in 'Моя волна'), resolve via smart resolver
    if (!verifiedTrackId) {
      showToast('Определение трека...', 'info', 1500);
      const resolved = await resolveTrackIdClientSide(track.title, track.artists?.[0]?.name, track.coverUri);
      if (resolved && resolved.id) {
        verifiedTrackId = String(resolved.id);
        track.id = verifiedTrackId;
        track.trackId = verifiedTrackId;
        if (resolved.meta) {
          if (resolved.meta.title) track.title = resolved.meta.title;
          if (resolved.meta.artists && resolved.meta.artists.length > 0) track.artists = resolved.meta.artists;
          if (resolved.meta.albums && resolved.meta.albums.length > 0) track.albums = resolved.meta.albums;
          if (resolved.meta.coverUri) track.coverUri = `https://${resolved.meta.coverUri.replace('%%', '400x400')}`;
        }
      } else if (resolved && typeof resolved === 'string') {
        verifiedTrackId = resolved;
        track.id = verifiedTrackId;
        track.trackId = verifiedTrackId;
      }
    }

    if (!verifiedTrackId && !track.id) {
      showToast(`Не удалось определить ID трека "${track.title}"`, 'error');
      return;
    }

    const currentTrackId = verifiedTrackId || track.id;

    // 3. Pre-resolve direct stream URL from Chromium context (100% bypasses 401 Unauthorized)
    try {
      const streamInfo = await resolveDirectDownloadUrlClientSide(currentTrackId);
      if (streamInfo && streamInfo.directUrl) {
        track.directUrl = streamInfo.directUrl;
        track.codec = streamInfo.codec;
        track.bitrate = streamInfo.bitrate;
      }
    } catch (e) {
      console.warn('[Mod Download] Client-side stream resolution failed:', e);
    }

    const artistName = track.artists?.[0]?.name || 'Яндекс Музыка';
    const prefix = source === 'quick' ? 'Быстрое скачивание (Ctrl+D)' : 'Начало скачивания';
    showToast(`${prefix}: ${artistName} — ${track.title}...`, 'info');
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
    dlBtn.title = 'Скачать текущий трек с обложкой и тегами в MP3/FLAC (Ctrl+D)';
    dlBtn.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/>
      </svg>
    `;

    dlBtn.onclick = async () => {
      await downloadCurrentPlayingTrack('player');
    };

    playerControls.appendChild(dlBtn);
  }

  function injectHeaderDownloadButton() {
    const entity = getEntityFromUrl();
    const existingGroup = document.getElementById('ym-mod-header-group');

    if (!entity) {
      if (existingGroup) existingGroup.remove();
      return;
    }

    const entityKey = `${entity.type}:${entity.id || (entity.userId + '_' + entity.kind) || entity.uuid}`;
    if (existingGroup && existingGroup.dataset.entityKey === entityKey) return;
    if (existingGroup) existingGroup.remove();

    const headerActions = document.querySelector('[class*="MetaActions_root"]') ||
                          document.querySelector('[class*="headerActions"]') ||
                          document.querySelector('[class*="ActionButtons"]') ||
                          document.querySelector('main h1')?.parentElement;

    if (!headerActions) return;

    const group = document.createElement('div');
    group.id = 'ym-mod-header-group';
    group.dataset.entityKey = entityKey;
    group.style.display = 'inline-flex';
    group.style.alignItems = 'center';
    group.style.gap = '8px';
    group.style.marginLeft = '12px';

    const titleEl = document.querySelector('main h1, [class*="Header_title"], [class*="Title_root"]');
    const pageTitle = titleEl ? titleEl.textContent.trim() : (entity.type === 'album' ? 'Альбом' : 'Плейлист');

    const dlBtn = document.createElement('button');
    dlBtn.id = 'ym-mod-header-dl';
    dlBtn.className = 'ym-mod-header-dl-btn';

    const exportBtn = document.createElement('button');
    exportBtn.id = 'ym-mod-header-export';
    exportBtn.className = 'ym-mod-header-export-btn';
    exportBtn.innerHTML = `📄 <span>Сохранить список</span>`;
    exportBtn.title = 'Экспортировать этот список в TXT, JSON, M3U8 или CSV';
    exportBtn.onclick = () => openExportMenu(entity, pageTitle);

    if (entity.type === 'album') {
      dlBtn.innerHTML = `⬇️ <span>Скачать альбом</span>`;
      dlBtn.onclick = async () => {
        showToast('Загрузка списка треков альбома...', 'info');
        const res = await window.yandexMod.downloadAlbum(entity.id);
        if (res && res.success) {
          showToast(`✅ Альбом "${res.albumTitle}" скачан (${res.downloadedCount}/${res.totalCount} треков)!`, 'success', 5000);
        }
      };
    } else {
      dlBtn.innerHTML = `⬇️ <span>Скачать плейлист</span>`;
      dlBtn.onclick = async () => {
        showToast('Загрузка списка треков...', 'info');
        const res = await window.yandexMod.downloadPlaylist({ 
          userId: entity.userId, 
          playlistKind: entity.kind, 
          uuid: entity.uuid,
          title: pageTitle
        });
        if (res && res.success) {
          showToast(`✅ Плейлист скачан (${res.downloadedCount}/${res.totalCount} треков)!`, 'success', 5000);
        }
      };
    }

    group.appendChild(dlBtn);
    group.appendChild(exportBtn);
    headerActions.appendChild(group);
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

              <div class="ym-mod-row">
                <div class="ym-mod-label">
                  <div class="ym-mod-label-title">Кнопки скачивания в списках треков</div>
                  <div class="ym-mod-label-desc">Показывать иконку загрузки на каждой строке трека (по умолчанию выкл для чистоты интерфейса)</div>
                </div>
                <label class="ym-mod-switch">
                  <input type="checkbox" id="ym-track-buttons-toggle" ${settings.showTrackListButtons ? 'checked' : ''}>
                  <span class="ym-mod-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <!-- TAB 2: BACKUP & PLAYLISTS -->
          <div class="ym-tab-content" id="tab-backup" style="display: none;">
            <div class="ym-mod-section">
              <div class="ym-mod-section-title">📦 Экспорт коллекций и плейлистов в списки</div>
              <div class="ym-mod-label-desc" style="margin-bottom: 12px;">
                Сохраняйте ваши списки воспроизведения в любых форматах (JSON, TXT, M3U8, CSV) для резервного копирования или переноса на другой аккаунт.
              </div>

              <div style="margin-bottom: 14px;">
                <div style="font-size: 13px; font-weight: 600; color: #ffcc00; margin-bottom: 8px;">Коллекция «Мне нравится»:</div>
                <div class="ym-mod-row" style="gap: 8px; flex-wrap: wrap;">
                  <button class="ym-mod-btn ym-mod-btn-primary" id="ym-backup-export-json" style="flex: 1; padding: 9px; min-width: 120px;">
                    📦 JSON (Полный)
                  </button>
                  <button class="ym-mod-btn" id="ym-backup-export-txt" style="flex: 1; padding: 9px; min-width: 120px;">
                    📄 TXT (Список)
                  </button>
                  <button class="ym-mod-btn" id="ym-backup-export-m3u" style="flex: 1; padding: 9px; min-width: 120px;">
                    🎵 M3U8 (Плейлист)
                  </button>
                  <button class="ym-mod-btn" id="ym-backup-export-csv" style="flex: 1; padding: 9px; min-width: 120px;">
                    📊 CSV (Таблица)
                  </button>
                </div>
              </div>

              <div style="margin-bottom: 16px;">
                <button class="ym-mod-btn" id="ym-export-current-page-btn" style="width: 100%; justify-content: center; padding: 10px; background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.15);">
                  📋 Сохранить текущий открытый плейлист / альбом
                </button>
              </div>

              <hr style="border: 0; height: 1px; background: rgba(255, 255, 255, 0.1); margin: 18px 0;">

              <div class="ym-mod-section-title">🔄 Импорт и перенос библиотеки (между аккаунтами)</div>
              <div class="ym-mod-label-desc" style="margin-bottom: 12px;">
                Загрузите сохранённый список (JSON, TXT, M3U8, CSV). Мод автоматически найдёт треки в каталоге и перенесёт их на текущий аккаунт.
              </div>

              <div style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px; margin-bottom: 14px;">
                <div style="font-size: 13px; font-weight: 600; color: #ddd; margin-bottom: 8px;">Куда перенести треки:</div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px;">
                    <input type="radio" name="ym-import-target" value="likes" checked id="ym-import-target-likes">
                    <span>❤️ Добавить в «Мне нравится» (Любимые треки)</span>
                  </label>
                  <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px;">
                    <input type="radio" name="ym-import-target" value="new_playlist" id="ym-import-target-new">
                    <span>📁 Создать новый плейлист с названием:</span>
                  </label>
                  <input type="text" class="ym-mod-input" id="ym-import-playlist-name" placeholder="Название нового плейлиста..." style="margin-left: 24px; width: calc(100% - 24px); display: none;">
                </div>
              </div>

              <div>
                <button class="ym-mod-btn" id="ym-backup-restore-btn" style="width: 100%; justify-content: center; padding: 12px; background: #2563eb; color: #fff; border-color: #3b82f6; font-weight: 600;">
                  📥 Выбрать файл (JSON, TXT, M3U8, CSV) и начать перенос
                </button>
              </div>

              <div id="ym-restore-progress-card" style="display: none; margin-top: 14px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 14px;">
                <div style="font-size: 13px; font-weight: 600; color: #ffcc00; margin-bottom: 4px;" id="ym-restore-title">
                  ⏳ Перенос треков...
                </div>
                <div class="ym-restore-bar-bg">
                  <div class="ym-restore-bar-fill" id="ym-restore-bar"></div>
                </div>
                <div style="font-size: 12px; color: #bbb; display: flex; justify-content: space-between; margin-top: 4px;">
                  <span id="ym-restore-status">Обработка...</span>
                  <span id="ym-restore-percent" style="font-weight: 600; color: #ffcc00;">0%</span>
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

    const trackBtnToggle = document.getElementById('ym-track-buttons-toggle');
    if (trackBtnToggle) {
      trackBtnToggle.onchange = (e) => {
        settings.showTrackListButtons = e.target.checked;
        debouncedSaveSettings({ showTrackListButtons: e.target.checked });
        injectTrackListButtons();
      };
    }

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

    const exportM3uBtn = document.getElementById('ym-backup-export-m3u');
    if (exportM3uBtn) {
      exportM3uBtn.onclick = async () => {
        showToast('Сбор треков для M3U8 плейлиста...', 'info');
        try {
          const domTracks = collectVisibleDomTracks();
          const res = await window.yandexMod.exportBackup('m3u8', domTracks);
          if (res && res.success) {
            showToast(`✅ M3U8 плейлист сохранён: ${res.count} треков!`, 'success', 5000);
          } else if (!res?.canceled) {
            showToast(`Ошибка экспорта: ${res?.error || 'Не удалось сохранить'}`, 'error');
          }
        } catch (e) {
          showToast(`Ошибка: ${e.message}`, 'error');
        }
      };
    }

    const exportCsvBtn = document.getElementById('ym-backup-export-csv');
    if (exportCsvBtn) {
      exportCsvBtn.onclick = async () => {
        showToast('Сбор треков для CSV таблицы...', 'info');
        try {
          const domTracks = collectVisibleDomTracks();
          const res = await window.yandexMod.exportBackup('csv', domTracks);
          if (res && res.success) {
            showToast(`✅ CSV таблица сохранена: ${res.count} треков!`, 'success', 5000);
          } else if (!res?.canceled) {
            showToast(`Ошибка экспорта: ${res?.error || 'Не удалось сохранить'}`, 'error');
          }
        } catch (e) {
          showToast(`Ошибка: ${e.message}`, 'error');
        }
      };
    }

    const exportCurrentBtn = document.getElementById('ym-export-current-page-btn');
    if (exportCurrentBtn) {
      exportCurrentBtn.onclick = () => {
        const entity = getEntityFromUrl();
        const titleEl = document.querySelector('main h1, [class*="Header_title"], [class*="Title_root"]');
        const pageTitle = titleEl ? titleEl.textContent.trim() : (entity?.type === 'album' ? 'Альбом' : 'Плейлист');
        const domTracks = collectVisibleDomTracks();
        openExportMenu(entity, pageTitle, domTracks);
      };
    }

    const targetLikesRadio = document.getElementById('ym-import-target-likes');
    const targetNewRadio = document.getElementById('ym-import-target-new');
    const playlistNameInput = document.getElementById('ym-import-playlist-name');

    if (targetLikesRadio && targetNewRadio && playlistNameInput) {
      const updateTargetVisibility = () => {
        playlistNameInput.style.display = targetNewRadio.checked ? 'block' : 'none';
        if (targetNewRadio.checked) playlistNameInput.focus();
      };
      targetLikesRadio.onchange = updateTargetVisibility;
      targetNewRadio.onchange = updateTargetVisibility;
    }

    document.getElementById('ym-backup-restore-btn').onclick = async () => {
      const isNew = targetNewRadio && targetNewRadio.checked;
      const newPlaylistName = playlistNameInput ? (playlistNameInput.value.trim() || 'Импортированная коллекция') : 'Импортированная коллекция';

      const progressCard = document.getElementById('ym-restore-progress-card');
      const progressTitle = document.getElementById('ym-restore-title');
      const progressStatus = document.getElementById('ym-restore-status');
      const progressBar = document.getElementById('ym-restore-bar');
      const progressPercent = document.getElementById('ym-restore-percent');
      
      progressCard.style.display = 'block';
      if (progressBar) progressBar.style.width = '0%';
      if (progressPercent) progressPercent.textContent = '0%';
      progressTitle.textContent = '⏳ Выберите файл списка (JSON, TXT, M3U8, CSV)...';
      progressStatus.textContent = 'Ожидание выбора файла...';

      try {
        const res = await window.yandexMod.restoreBackup({
          targetType: isNew ? 'new_playlist' : 'likes',
          newPlaylistName: newPlaylistName || 'Импортированный плейлист'
        });
        if (res && res.success) {
          if (progressBar) progressBar.style.width = '100%';
          if (progressPercent) progressPercent.textContent = '100%';
          const targetName = isNew ? `новый плейлист "${res.playlistTitle || newPlaylistName}"` : '«Мне нравится»';
          progressTitle.textContent = '🎉 Перенос успешно завершён!';
          progressStatus.textContent = `Добавлено в ${targetName}: ${res.restoredCount} из ${res.total} треков.`;
          showToast(`✅ Успешно перенесено ${res.restoredCount} треков в ${targetName}!`, 'success', 6000);
        } else if (res?.canceled) {
          progressCard.style.display = 'none';
        } else {
          progressTitle.textContent = '❌ Ошибка переноса';
          progressStatus.textContent = res?.error || 'Не удалось перенести треки.';
          showToast(`Ошибка: ${res?.error || 'Сбой переноса'}`, 'error');
        }
      } catch (e) {
        progressTitle.textContent = '❌ Ошибка переноса';
        progressStatus.textContent = e.message;
        showToast(`Ошибка: ${e.message}`, 'error');
      }
    };

    if (window.yandexMod && window.yandexMod.onRestoreProgress) {
      window.yandexMod.onRestoreProgress((p) => {
        const progressCard = document.getElementById('ym-restore-progress-card');
        const progressTitle = document.getElementById('ym-restore-title');
        const progressStatus = document.getElementById('ym-restore-status');
        const progressBar = document.getElementById('ym-restore-bar');
        const progressPercent = document.getElementById('ym-restore-percent');
        if (progressCard) progressCard.style.display = 'block';
        const pct = p.total > 0 ? Math.min(100, Math.round((p.current / p.total) * 100)) : 0;
        if (progressBar) progressBar.style.width = `${pct}%`;
        if (progressPercent) progressPercent.textContent = `${pct}%`;
        if (progressTitle) progressTitle.textContent = `⏳ Перенос: ${p.current}/${p.total} треков (${p.restoredCount} добавлено)`;
        if (progressStatus) progressStatus.textContent = p.trackName ? `Текущий трек: ${p.trackName}` : 'Обработка...';
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
      injectTrackListButtons();
      hookVersionButton();
    }, 1200);

    if (window.yandexMod && window.yandexMod.onTogglePanel) {
      window.yandexMod.onTogglePanel(() => toggleModModal());
    }

    if (window.yandexMod && window.yandexMod.onQuickDownload) {
      window.yandexMod.onQuickDownload(async () => {
        await downloadCurrentPlayingTrack('quick');
      });
    }

    console.log('[YandexMusicMod] Mod Client v2.5 initialized successfully.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
