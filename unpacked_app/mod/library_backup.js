let electron = null;
try {
  electron = require('electron');
} catch (e) {}

const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

class LibraryBackupManager {
  constructor() {
    let userData = null;
    try {
      if (electron && electron.app && typeof electron.app.getPath === 'function') {
        userData = electron.app.getPath('userData');
      }
    } catch (e) {}
    if (!userData) {
      userData = process.env.APPDATA ? path.join(process.env.APPDATA, 'YandexMusic') : process.cwd();
    }
    this.appDataDir = path.join(userData, 'ModData');
    if (!fs.existsSync(this.appDataDir)) {
      try { fs.mkdirSync(this.appDataDir, { recursive: true }); } catch (e) {}
    }
    this.autoBackupFile = path.join(this.appDataDir, 'liked_tracks_auto_backup.json');
  }

  async getSessionCookies() {
    try {
      if (!electron?.session?.defaultSession) return [];
      const cookies = await electron.session.defaultSession.cookies.get({});
      return cookies.filter(c => c.domain && (c.domain.includes('yandex') || c.domain.includes('music')));
    } catch (e) {
      return [];
    }
  }

  async getSessionCookieHeader() {
    try {
      const cookies = await this.getSessionCookies();
      const importantNames = new Set([
        'Session_id', 'sessionid2', 'yandexuid', 'uid', 'yandex_login', 
        'L', 'mda2_beacon', 'my', 'device_id', 'yashr'
      ]);
      const unique = {};
      cookies.forEach(c => {
        if (c.name && c.value && (importantNames.has(c.name) || c.name.startsWith('Session_') || c.name.startsWith('yp') || c.name.startsWith('ys'))) {
          unique[c.name] = c.value;
        }
      });
      return Object.entries(unique).map(([k, v]) => `${k}=${v}`).join('; ');
    } catch (e) {
      return '';
    }
  }


  fetchJson(url, options = {}) {
    return new Promise(async (resolve, reject) => {
      let cookieHeader = '';
      let extraHeaders = {};

      if (typeof options === 'string') {
        cookieHeader = options;
      } else if (typeof options === 'object' && options !== null) {
        if (options.Cookie || options.cookie) {
          cookieHeader = options.Cookie || options.cookie;
        }
        extraHeaders = { ...options };
        delete extraHeaders.Cookie;
        delete extraHeaders.cookie;
      }

      if (!cookieHeader) {
        cookieHeader = await this.getSessionCookieHeader();
      }

      const parsed = new URL(url);
      const client = parsed.protocol === 'https:' ? https : http;
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://music.yandex.ru/',
        'Accept': 'application/json, text/plain, */*',
        'X-Retpath-Y': 'https://music.yandex.ru',
        ...extraHeaders
      };
      if (cookieHeader && typeof cookieHeader === 'string') {
        headers['Cookie'] = cookieHeader;
      }

      const req = client.get(url, { headers, timeout: 20000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            resolve({ raw: data, statusCode: res.statusCode });
          }
        });
        res.on('error', reject);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Таймаут запроса к библиотеке'));
      });
      req.on('error', reject);
    });
  }

  postJson(url, postData, cookieHeader = '') {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://music.yandex.ru/',
        'Origin': 'https://music.yandex.ru',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Content-Length': Buffer.byteLength(postData),
        'X-Retpath-Y': 'https://music.yandex.ru'
      };
      if (cookieHeader) headers['Cookie'] = cookieHeader;

      const req = client.request({
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers,
        timeout: 15000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 400) {
              console.warn(`[Mod PostJson] ${url} HTTP ${res.statusCode}:`, data.slice(0, 300));
              parsed.statusCode = res.statusCode;
            }
            resolve(parsed);
          } catch (e) {
            if (res.statusCode >= 400) {
              console.warn(`[Mod PostJson] ${url} HTTP ${res.statusCode}:`, data.slice(0, 300));
            }
            resolve({ raw: data, statusCode: res.statusCode });
          }
        });
        res.on('error', reject);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Таймаут POST запроса'));
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  async getCurrentUser() {
    const cookieHeader = await this.getSessionCookieHeader();
    
    // Attempt 1: account/status via api.music.yandex.ru / net
    for (const host of ['https://api.music.yandex.ru', 'https://api.music.yandex.net']) {
      try {
        const statusData = await this.fetchJson(`${host}/account/status`, cookieHeader);
        if (statusData?.result?.account?.uid) {
          return {
            uid: String(statusData.result.account.uid),
            login: statusData.result.account.login || String(statusData.result.account.uid),
            name: statusData.result.account.displayName || statusData.result.account.fullName || statusData.result.account.login
          };
        }
      } catch (e) {}
    }

    // Attempt 2: Extract directly from session cookies
    try {
      const cookies = await this.getSessionCookies();
      const uidCookie = cookies.find(c => c.name === 'uid');
      const loginCookie = cookies.find(c => c.name === 'yandex_login');
      if (uidCookie?.value) {
        return {
          uid: String(uidCookie.value),
          login: loginCookie?.value || String(uidCookie.value),
          name: loginCookie?.value || 'User'
        };
      }
    } catch (e) {}

    return null;
  }

  async fetchLikedTracks(clientTracks = []) {
    const cookieHeader = await this.getSessionCookieHeader();
    const user = await this.getCurrentUser();
    const uid = user?.uid;
    const extraHeaders = cookieHeader ? { 'Cookie': cookieHeader } : {};

    let rawTracks = [];

    // Priority 1: api.music.yandex.ru/users/{uid}/likes/tracks (Returns ALL track IDs in user's library!)
    if (uid) {
      for (const host of ['https://api.music.yandex.ru', 'https://api.music.yandex.net']) {
        try {
          const data = await this.fetchJson(`${host}/users/${uid}/likes/tracks`, extraHeaders);
          const tracks = data?.result?.library?.tracks || data?.result?.tracks;
          if (Array.isArray(tracks) && tracks.length > 0) {
            rawTracks = tracks;
            console.log(`[Backup] Retrieved ${rawTracks.length} liked tracks via ${host}/users/${uid}/likes/tracks`);
            break;
          }
        } catch (e) {
          console.warn(`[Backup] Failed to fetch likes from ${host}:`, e.message);
        }
      }
    }

    // If rawTracks contains bare IDs or lacks full metadata, batch resolve via /tracks?trackIds=...
    if (rawTracks.length > 0 && !rawTracks[0]?.title && !rawTracks[0]?.track?.title && (rawTracks[0]?.id || rawTracks[0]?.trackId)) {
      console.log(`[Backup] Resolving metadata for ${rawTracks.length} liked tracks in batches of 100...`);
      const trackIds = rawTracks.map(t => t.id || t.trackId || t.track?.id).filter(Boolean);
      const resolved = [];
      for (let i = 0; i < trackIds.length; i += 100) {
        const batch = trackIds.slice(i, i + 100);
        try {
          const bData = await this.fetchJson(`https://api.music.yandex.ru/tracks?trackIds=${batch.join(',')}`);
          if (bData?.result && Array.isArray(bData.result)) {
            resolved.push(...bData.result);
          }
        } catch (e) {
          console.warn(`[Backup] Batch resolution failed at offset ${i}:`, e.message);
        }
      }
      if (resolved.length > 0) {
        rawTracks = resolved;
        console.log(`[Backup] Successfully resolved metadata for ${resolved.length} tracks!`);
      }
    }

    // Priority 2: Fallback to /users/{uid}/playlists/3 ONLY if likes/tracks returned nothing
    if (rawTracks.length === 0 && uid) {
      for (const host of ['https://api.music.yandex.ru', 'https://api.music.yandex.net']) {
        try {
          const data = await this.fetchJson(`${host}/users/${uid}/playlists/3`, extraHeaders);
          if (data?.result?.tracks && data.result.tracks.length > 0) {
            rawTracks = data.result.tracks;
            console.log(`[Backup] Retrieved ${rawTracks.length} tracks via ${host}/users/${uid}/playlists/3 fallback`);
            break;
          }
        } catch (e) {}
      }
    }

    // Priority 3: Fallback to client-side passed tracks
    if (rawTracks.length === 0 && Array.isArray(clientTracks) && clientTracks.length > 0) {
      rawTracks = clientTracks;
      console.log(`[Backup] Using ${rawTracks.length} tracks from client`);
    }

    const cleanTracks = rawTracks.map(t => {
      const trackObj = t.track || t;
      const title = trackObj.title || 'Unknown Title';
      const version = trackObj.version || '';
      const artists = (trackObj.artists || []).map(a => a.name || a).join(', ') || 'Unknown Artist';
      const album = trackObj.albums?.[0]?.title || '';
      const year = trackObj.albums?.[0]?.year || '';
      const coverUri = trackObj.coverUri || trackObj.albums?.[0]?.coverUri || '';

      return {
        id: trackObj.id,
        title: version ? `${title} (${version})` : title,
        rawTitle: title,
        version: version,
        artist: artists,
        artists: trackObj.artists || [{ name: artists }],
        album: album,
        year: year,
        coverUri: coverUri,
        durationMs: trackObj.durationMs || 0
      };
    }).filter(t => t.title && (t.artist || t.id));

    // Save auto-backup
    if (cleanTracks.length > 0) {
      try {
        fs.writeFileSync(this.autoBackupFile, JSON.stringify({
          updatedAt: new Date().toISOString(),
          user: user?.login || 'unknown',
          count: cleanTracks.length,
          tracks: cleanTracks
        }, null, 2), 'utf8');
      } catch (e) {}
    }

    return {
      success: cleanTracks.length > 0,
      user: user?.login || 'unknown',
      count: cleanTracks.length,
      tracks: cleanTracks,
      error: cleanTracks.length === 0 ? 'Не удалось получить треки (возможно, требуется авторизация в клиенте)' : undefined
    };
  }

  formatTracks(tracks, format = 'json', title = 'Playlist') {
    if (format === 'json') {
      return JSON.stringify({
        title,
        exportedAt: new Date().toISOString(),
        count: tracks.length,
        tracks
      }, null, 2);
    }
    
    if (format === 'txt') {
      return tracks.map(t => `${t.artist || 'Unknown Artist'} - ${t.title || 'Unknown Title'}`).join('\n');
    }

    if (format === 'm3u8' || format === 'm3u') {
      const lines = ['#EXTM3U', `#PLAYLIST:${title}`];
      tracks.forEach(t => {
        const durSec = Math.round((t.durationMs || 0) / 1000);
        const name = `${t.artist || 'Unknown Artist'} - ${t.title || 'Unknown Title'}`;
        lines.push(`#EXTINF:${durSec},${name}`);
        lines.push(`${name}.mp3`);
      });
      return lines.join('\n');
    }

    if (format === 'csv') {
      const rows = ['"Title","Artist","Album","Year","DurationSec","TrackId"'];
      tracks.forEach(t => {
        const safeT = String(t.title || '').replace(/"/g, '""');
        const safeA = String(t.artist || '').replace(/"/g, '""');
        const safeAl = String(t.album || '').replace(/"/g, '""');
        const safeY = String(t.year || '').replace(/"/g, '""');
        const dur = Math.round((t.durationMs || 0) / 1000);
        const id = t.id || '';
        rows.push(`"${safeT}","${safeA}","${safeAl}","${safeY}","${dur}","${id}"`);
      });
      return rows.join('\n');
    }

    return JSON.stringify(tracks, null, 2);
  }

  getFiltersForFormat(format) {
    switch (format) {
      case 'json':
        return [{ name: 'JSON Backup', extensions: ['json'] }];
      case 'txt':
        return [{ name: 'Текстовый список (TXT)', extensions: ['txt'] }];
      case 'm3u8':
      case 'm3u':
        return [{ name: 'M3U8 Плейлист', extensions: ['m3u8', 'm3u'] }];
      case 'csv':
        return [{ name: 'CSV Таблица', extensions: ['csv'] }];
      default:
        return [{ name: 'Все файлы', extensions: ['*'] }];
    }
  }

  async exportPlaylist(playlistData, format = 'json') {
    let title = playlistData?.title || 'Плейлист';
    let tracks = [];
    const cookieHeader = await this.getSessionCookieHeader();
    const extraHeaders = cookieHeader ? { 'Cookie': cookieHeader } : {};

    // Priority 1: If album, fetch complete album from API
    if (playlistData?.type === 'album' || playlistData?.albumId || playlistData?.id) {
      const albumId = playlistData.albumId || playlistData.id;
      try {
        const albumData = await this.fetchJson(`https://api.music.yandex.ru/albums/${albumId}/with-tracks`);
        if (albumData?.result?.volumes) {
          const flat = albumData.result.volumes.flat();
          if (flat.length > 0) {
            tracks = flat;
            if (albumData.result.title) title = albumData.result.title;
            console.log(`[Export] Retrieved ${tracks.length} tracks for album "${title}"`);
          }
        }
      } catch (e) {
        console.warn('[Export] Album fetch failed:', e.message);
      }
    }

    // Priority 2: If likes / collection, fetch 100% of liked tracks via API
    const isLikes = playlistData?.kind === 'likes' || playlistData?.kind === '3' || playlistData?.owner === 'likes' || String(title).toLowerCase().includes('мне нравится') || String(playlistData?.title).toLowerCase().includes('мне нравится');
    if (isLikes) {
      const liked = await this.fetchLikedTracks(playlistData?.tracks);
      if (liked.tracks && liked.tracks.length > 0) {
        tracks = liked.tracks;
        title = 'Мне нравится';
      }
    }

    // Priority 3: Custom user playlist
    if (tracks.length === 0 && (playlistData?.owner || playlistData?.userId) && playlistData?.kind) {
      const owner = playlistData.owner || playlistData.userId;
      for (const host of ['https://api.music.yandex.ru', 'https://api.music.yandex.net']) {
        try {
          const pUrl = `${host}/users/${encodeURIComponent(owner)}/playlists/${playlistData.kind}`;
          const pData = await this.fetchJson(pUrl, extraHeaders);
          if (pData?.result?.tracks && pData.result.tracks.length > 0) {
            tracks = pData.result.tracks;
            if (pData.result.title) title = pData.result.title;
            console.log(`[Export] Retrieved ${tracks.length} tracks via ${host} for playlist "${title}"`);
            break;
          }
        } catch (e) {}
      }
    }

    // Priority 3: Fallback to client-side tracks (DOM/React) if server fetch was empty
    if (tracks.length === 0 && Array.isArray(playlistData?.tracks) && playlistData.tracks.length > 0) {
      tracks = playlistData.tracks;
      console.log(`[Export] Using ${tracks.length} tracks passed from client`);
    }

    if (tracks.length === 0) {
      return { success: false, error: 'В выбранном плейлисте не найдено треков для сохранения' };
    }

    const cleanTracks = tracks.map(t => {
      const trackObj = t.track || t;
      const title = trackObj.title || 'Unknown Title';
      const version = trackObj.version || '';
      const artists = (trackObj.artists || []).map(a => a.name || a).join(', ') || (typeof trackObj.artist === 'string' ? trackObj.artist : 'Unknown Artist');
      const album = trackObj.albums?.[0]?.title || trackObj.album?.title || '';
      const year = trackObj.albums?.[0]?.year || trackObj.album?.year || '';

      return {
        id: trackObj.id,
        title: version ? `${title} (${version})` : title,
        artist: artists,
        album,
        year,
        durationMs: trackObj.durationMs || 0
      };
    }).filter(t => t.title && (t.artist || t.id));

    const safeTitle = String(title).replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim() || 'Плейлист';
    const defaultFilename = `${safeTitle}_${new Date().toISOString().slice(0, 10)}.${format}`;

    const { filePath, canceled } = await electron.dialog.showSaveDialog({
      title: `Экспорт плейлиста: ${title}`,
      defaultPath: defaultFilename,
      filters: this.getFiltersForFormat(format)
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    const formattedContent = this.formatTracks(cleanTracks, format, title);
    fs.writeFileSync(filePath, formattedContent, 'utf8');

    return {
      success: true,
      filePath,
      count: cleanTracks.length,
      title
    };
  }

  async exportBackup(format = 'json', clientTracks = []) {
    const result = await this.fetchLikedTracks(clientTracks);
    if (!result.success || result.tracks.length === 0) {
      return { success: false, error: result.error || 'Коллекция пуста или не удалось получить список треков' };
    }

    const userStr = result.user || 'user';
    const defaultFilename = `yandex_music_liked_${userStr}_${new Date().toISOString().slice(0, 10)}.${format}`;
    const { filePath, canceled } = await electron.dialog.showSaveDialog({
      title: 'Сохранить резервную копию "Мне нравится"',
      defaultPath: defaultFilename,
      filters: this.getFiltersForFormat(format)
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    const formattedContent = this.formatTracks(result.tracks, format, 'Мне нравится');
    fs.writeFileSync(filePath, formattedContent, 'utf8');

    return {
      success: true,
      filePath,
      count: result.tracks.length
    };
  }

  async getUserPlaylists() {
    const cookieHeader = await this.getSessionCookieHeader();
    const user = await this.getCurrentUser();
    const uid = user?.uid;
    if (!uid) return [];

    try {
      const data = await this.fetchJson(`https://api.music.yandex.net/users/${uid}/playlists/list`, cookieHeader);
      return data?.result || [];
    } catch (e) {
      return [];
    }
  }

  async createPlaylist(title, cookieHeader) {
    const safeTitle = String(title || 'Новый плейлист').trim();
    const user = await this.getCurrentUser();
    if (!user?.uid) return null;

    const postData = `title=${encodeURIComponent(safeTitle)}&visibility=public`;
    for (const host of ['https://api.music.yandex.ru', 'https://api.music.yandex.net']) {
      try {
        const res = await this.postJson(`${host}/users/${user.uid}/playlists/create`, postData, cookieHeader);
        if (res?.result?.kind) return res.result;
      } catch (e) {}
    }

    return null;
  }

  async likeTracksBatch(uid, trackIds, cookieHeader) {
    if (!uid || !Array.isArray(trackIds) || trackIds.length === 0) return 0;
    const postDataList = [
      trackIds.map(id => `track-ids=${encodeURIComponent(id)}`).join('&'),
      `track-ids=${encodeURIComponent(trackIds.join(','))}`
    ];
    for (const host of ['https://api.music.yandex.ru', 'https://api.music.yandex.net']) {
      for (const postData of postDataList) {
        try {
          const url = `${host}/users/${uid}/likes/tracks/add-multiple`;
          const res = await this.postJson(url, postData, cookieHeader);
          if (res?.revision !== undefined || res?.result?.revision !== undefined || res?.result || res?.status === 'ok') {
            return trackIds.length;
          }
        } catch (e) {}
      }
    }
    return 0;
  }

  async likeTrack(uid, trackId, cookieHeader) {
    if (!uid || !trackId) return false;
    for (const host of ['https://api.music.yandex.ru', 'https://api.music.yandex.net']) {
      try {
        const res = await this.postJson(`${host}/users/${uid}/likes/tracks/add-multiple`, `track-ids=${encodeURIComponent(trackId)}`, cookieHeader);
        if (res?.revision !== undefined || res?.result?.revision !== undefined || res?.result || res?.status === 'ok') {
          return true;
        }
      } catch (e) {}
      try {
        const url = `${host}/users/${uid}/likes/tracks/add?track-id=${encodeURIComponent(trackId)}`;
        const res = await this.postJson(url, `track-id=${encodeURIComponent(trackId)}`, cookieHeader);
        if (res?.result?.revision !== undefined || res?.revision !== undefined || res?.result) {
          return true;
        }
      } catch (e) {}
    }
    return false;
  }

  async addTracksToPlaylist(uid, kind, trackItems, cookieHeader, initialRevision = 0, onProgress = null) {
    if (!uid || !kind || !Array.isArray(trackItems) || trackItems.length === 0) {
      return { restoredCount: 0, failedCount: 0 };
    }

    let currentRevision = Number(initialRevision) || 0;
    try {
      const pInfo = await this.fetchJson(`https://api.music.yandex.ru/users/${uid}/playlists/${kind}`, cookieHeader);
      if (pInfo?.result?.revision !== undefined) {
        currentRevision = Number(pInfo.result.revision);
      }
    } catch (e) {}

    let restoredCount = 0;
    let failedCount = 0;
    const total = trackItems.length;
    const BATCH_SIZE = 50;

    console.log(`[Backup] Adding ${total} tracks in batches of ${BATCH_SIZE} to playlist ${kind} (starting rev: ${currentRevision})...`);

    for (let i = 0; i < total; i += BATCH_SIZE) {
      const chunk = trackItems.slice(i, i + BATCH_SIZE);

      // Resolve missing track IDs via search if needed
      for (const item of chunk) {
        if (!item.id) {
          try {
            const query = `${item.artist || ''} ${item.title || ''}`.trim();
            if (query) {
              const searchData = await this.fetchJson(`https://api.music.yandex.ru/search?text=${encodeURIComponent(query)}&type=track&page=0`, cookieHeader);
              const found = searchData?.result?.tracks?.results?.[0];
              if (found?.id) item.id = String(found.id);
            }
          } catch (e) {}
        }
      }

      const validInChunk = chunk.filter(t => t.id);
      const invalidCount = chunk.length - validInChunk.length;

      if (validInChunk.length === 0) {
        failedCount += chunk.length;
        if (onProgress) {
          const lastTrack = chunk[chunk.length - 1];
          onProgress(Math.min(i + chunk.length, total), total, restoredCount, failedCount, `${lastTrack?.artist || ''} - ${lastTrack?.title || ''}`);
        }
        continue;
      }

      // Build diff: only pass albumId if it is a valid positive number, never 0!
      const tracksPayload = validInChunk.map(t => {
        const entry = { id: String(t.id) };
        if (t.albumId && Number(t.albumId) > 0) {
          entry.albumId = Number(t.albumId);
        }
        return entry;
      });

      const diff = JSON.stringify([{
        op: 'insert',
        at: 0,
        tracks: tracksPayload
      }]);

      let batchSuccess = false;

      for (const host of ['https://api.music.yandex.ru', 'https://api.music.yandex.net']) {
        try {
          const postData = `diff=${encodeURIComponent(diff)}&revision=${currentRevision}`;
          const res = await this.postJson(`${host}/users/${uid}/playlists/${kind}/change-relative`, postData, cookieHeader);

          if (res?.result?.revision !== undefined) {
            currentRevision = Number(res.result.revision);
            restoredCount += validInChunk.length;
            failedCount += invalidCount;
            batchSuccess = true;
            console.log(`[Backup] Batch ${Math.floor(i / BATCH_SIZE) + 1} added (${validInChunk.length} tracks). New rev: ${currentRevision}`);
            break;
          }

          // If precondition failed (412), refresh revision and retry
          if (res?.statusCode === 412 || res?.error === 'precondition-failed') {
            console.warn(`[Backup] Revision mismatch (412). Refreshing playlist revision from server...`);
            const pInfo = await this.fetchJson(`${host}/users/${uid}/playlists/${kind}`, cookieHeader);
            if (pInfo?.result?.revision !== undefined) {
              currentRevision = Number(pInfo.result.revision);
              const retryData = `diff=${encodeURIComponent(diff)}&revision=${currentRevision}`;
              const retryRes = await this.postJson(`${host}/users/${uid}/playlists/${kind}/change-relative`, retryData, cookieHeader);
              if (retryRes?.result?.revision !== undefined) {
                currentRevision = Number(retryRes.result.revision);
                restoredCount += validInChunk.length;
                failedCount += invalidCount;
                batchSuccess = true;
                console.log(`[Backup] Batch retry succeeded! New rev: ${currentRevision}`);
                break;
              }
            }
          }
        } catch (e) {
          console.warn(`[Backup] Batch insert failed on ${host}:`, e.message);
        }
      }

      // Fallback: If batch failed, try tracks 1-by-1
      if (!batchSuccess) {
        console.warn(`[Backup] Batch failed, falling back to 1-by-1 for chunk ${Math.floor(i / BATCH_SIZE) + 1}...`);
        for (const single of validInChunk) {
          const singleDiff = JSON.stringify([{
            op: 'insert',
            at: 0,
            tracks: [{ id: String(single.id) }]
          }]);

          let singleSuccess = false;
          for (const host of ['https://api.music.yandex.ru', 'https://api.music.yandex.net']) {
            try {
              const singleData = `diff=${encodeURIComponent(singleDiff)}&revision=${currentRevision}`;
              const sRes = await this.postJson(`${host}/users/${uid}/playlists/${kind}/change-relative`, singleData, cookieHeader);
              if (sRes?.result?.revision !== undefined) {
                currentRevision = Number(sRes.result.revision);
                restoredCount++;
                singleSuccess = true;
                break;
              } else if (sRes?.statusCode === 412) {
                const pInfo = await this.fetchJson(`${host}/users/${uid}/playlists/${kind}`, cookieHeader);
                if (pInfo?.result?.revision !== undefined) currentRevision = Number(pInfo.result.revision);
                const rData = `diff=${encodeURIComponent(singleDiff)}&revision=${currentRevision}`;
                const rRes = await this.postJson(`${host}/users/${uid}/playlists/${kind}/change-relative`, rData, cookieHeader);
                if (rRes?.result?.revision !== undefined) {
                  currentRevision = Number(rRes.result.revision);
                  restoredCount++;
                  singleSuccess = true;
                  break;
                }
              }
            } catch (e) {}
          }
          if (!singleSuccess) failedCount++;
          await new Promise(r => setTimeout(r, 60));
        }
        failedCount += invalidCount;
      }

      if (onProgress) {
        const lastTrack = chunk[chunk.length - 1];
        const trackName = `${lastTrack?.artist || ''} — ${lastTrack?.title || ''}`.trim() || `Трек #${lastTrack?.id || i + 1}`;
        onProgress(Math.min(i + chunk.length, total), total, restoredCount, failedCount, trackName);
      }

      await new Promise(r => setTimeout(r, 100));
    }

    return { restoredCount, failedCount };
  }

  async addTrackToPlaylist(uid, kind, trackId, cookieHeader) {
    if (!uid || !kind || !trackId) return false;
    let rev = 0;
    try {
      const pInfo = await this.fetchJson(`https://api.music.yandex.ru/users/${uid}/playlists/${kind}`, cookieHeader);
      if (pInfo?.result?.revision !== undefined) rev = Number(pInfo.result.revision);
    } catch (e) {}

    const diff = JSON.stringify([{
      op: 'insert',
      at: 0,
      tracks: [{ id: String(trackId) }]
    }]);
    const postData = `diff=${encodeURIComponent(diff)}&revision=${rev}`;

    for (const host of ['https://api.music.yandex.ru', 'https://api.music.yandex.net']) {
      try {
        const res = await this.postJson(`${host}/users/${uid}/playlists/${kind}/change-relative`, postData, cookieHeader);
        if (res?.result?.revision !== undefined || res?.result) return true;
      } catch (e) {}
    }
    return false;
  }

  parseImportFile(filePath, fileContent) {
    const ext = path.extname(filePath).toLowerCase();
    let tracks = [];

    if (ext === '.json') {
      try {
        const parsed = JSON.parse(fileContent);
        tracks = parsed.tracks || (Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        throw new Error('Файл повреждён или имеет неверный формат JSON');
      }
    } else if (ext === '.m3u' || ext === '.m3u8') {
      const lines = fileContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      lines.forEach(line => {
        if (line.startsWith('#EXTINF:')) {
          const commaIdx = line.indexOf(',');
          if (commaIdx !== -1) {
            const rawTitle = line.substring(commaIdx + 1).trim();
            const parts = rawTitle.split(' - ');
            if (parts.length >= 2) {
              tracks.push({ artist: parts[0].trim(), title: parts.slice(1).join(' - ').trim() });
            } else {
              tracks.push({ artist: '', title: rawTitle });
            }
          }
        } else if (!line.startsWith('#') && line.endsWith('.mp3')) {
          const raw = line.replace(/\.mp3$/i, '').trim();
          const parts = raw.split(' - ');
          if (parts.length >= 2 && !tracks.some(t => t.title.includes(parts[1]))) {
            tracks.push({ artist: parts[0].trim(), title: parts.slice(1).join(' - ').trim() });
          }
        }
      });
    } else if (ext === '.csv') {
      const lines = fileContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const dataLines = lines.slice(1); // skip header
      dataLines.forEach(line => {
        const tokens = line.match(/(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g);
        if (tokens) {
          const cells = tokens.map(t => {
            let str = t.startsWith(',') ? t.substring(1) : t;
            if (str.startsWith('"') && str.endsWith('"')) {
              str = str.slice(1, -1).replace(/""/g, '"');
            }
            return str.trim();
          });
          if (cells.length >= 2 && cells[0]) {
            tracks.push({
              title: cells[0],
              artist: cells[1] || '',
              album: cells[2] || '',
              year: cells[3] || '',
              id: cells[5] || undefined
            });
          }
        }
      });
    } else {
      // Default: TXT (Artist - Title)
      const lines = fileContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      tracks = lines.map(line => {
        const parts = line.split(' - ');
        if (parts.length >= 2) {
          return { artist: parts[0].trim(), title: parts.slice(1).join(' - ').trim() };
        }
        return { artist: '', title: line };
      });
    }

    return tracks;
  }

  async importAndRestore(sender, options = {}) {
    const { filePaths, canceled } = await electron.dialog.showOpenDialog({
      title: 'Выберите файл со списком треков (JSON, TXT, M3U8, CSV)',
      filters: [
        { name: 'Списки музыки (JSON, TXT, M3U8, CSV)', extensions: ['json', 'txt', 'm3u8', 'm3u', 'csv'] },
        { name: 'Все файлы', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const filePath = filePaths[0];
    let fileContent = fs.readFileSync(filePath, 'utf8');
    if (fileContent.charCodeAt(0) === 0xFEFF) {
      fileContent = fileContent.slice(1);
    }

    let tracksToRestore = [];
    try {
      tracksToRestore = this.parseImportFile(filePath, fileContent);
    } catch (err) {
      return { success: false, error: err.message };
    }

    if (tracksToRestore.length === 0) {
      return { success: false, error: 'В выбранном файле не найдено треков' };
    }

    const cookieHeader = await this.getSessionCookieHeader();
    const currentUser = await this.getCurrentUser();
    if (!currentUser?.uid) {
      return { 
        success: false, 
        error: 'Не удалось определить аккаунт. Пожалуйста, убедитесь, что вы авторизованы в приложении Яндекс Музыка.' 
      };
    }

    const targetType = options.targetType || 'likes'; // 'likes' | 'new_playlist'
    let targetPlaylistKind = options.existingKind || null;
    let targetPlaylistTitle = 'Мне нравится';

    // If target is a new playlist, create it first
    if (targetType === 'new_playlist') {
      const baseName = path.basename(filePath, path.extname(filePath));
      const newName = options.newPlaylistName || baseName || 'Импортированная коллекция';
      const created = await this.createPlaylist(newName, cookieHeader);
      if (created?.kind) {
        targetPlaylistKind = created.kind;
        targetPlaylistTitle = created.title || newName;
      } else {
        return { success: false, error: 'Не удалось создать новый плейлист на аккаунте. Проверьте авторизацию.' };
      }

      console.log(`[Backup] Created playlist "${targetPlaylistTitle}" (kind: ${targetPlaylistKind}, rev: ${created.revision || 0}). Adding ${tracksToRestore.length} tracks...`);

      const result = await this.addTracksToPlaylist(
        currentUser.uid,
        targetPlaylistKind,
        tracksToRestore,
        cookieHeader,
        Number(created.revision) || 0,
        (current, total, restored, failed, trackName) => {
          if (sender) {
            sender.send('mod:restore-progress', {
              current,
              total,
              percent: Math.round((current / total) * 100),
              restoredCount: restored,
              failedCount: failed,
              trackName,
              targetTitle: targetPlaylistTitle
            });
          }
        }
      );

      return {
        success: result.restoredCount > 0,
        total: tracksToRestore.length,
        restoredCount: result.restoredCount,
        failedCount: result.failedCount,
        targetTitle: targetPlaylistTitle,
        playlistTitle: targetPlaylistTitle,
        error: result.restoredCount === 0 ? 'Не удалось добавить треки в плейлист. Проверьте соединение с сетью.' : undefined
      };
    }

    // Target is Likes
    let restoredCount = 0;
    let failedCount = 0;
    const total = tracksToRestore.length;
    const BATCH_SIZE = 50;

    console.log(`[Backup] Starting batch transfer of ${total} tracks to "Мне нравится" for user ${currentUser.uid}...`);

    for (let i = 0; i < total; i += BATCH_SIZE) {
      const chunk = tracksToRestore.slice(i, i + BATCH_SIZE);
      const validIds = [];

      for (const item of chunk) {
        let trackId = item.id;
        if (!trackId) {
          try {
            const query = `${item.artist || ''} ${item.title || ''}`.trim();
            if (query) {
              const searchData = await this.fetchJson(`https://api.music.yandex.ru/search?text=${encodeURIComponent(query)}&type=track&page=0`, cookieHeader);
              const found = searchData?.result?.tracks?.results?.[0];
              if (found?.id) trackId = String(found.id);
            }
          } catch (e) {}
        }
        if (trackId) {
          validIds.push(trackId);
        } else {
          failedCount++;
        }
      }

      if (validIds.length > 0) {
        const added = await this.likeTracksBatch(currentUser.uid, validIds, cookieHeader);
        if (added > 0) {
          restoredCount += added;
        } else {
          for (const sId of validIds) {
            try {
              const singleOk = await this.likeTrack(currentUser.uid, sId, cookieHeader);
              if (singleOk) restoredCount++;
              else failedCount++;
            } catch (e) {
              failedCount++;
            }
            await new Promise(r => setTimeout(r, 40));
          }
        }
      }

      const current = Math.min(i + chunk.length, total);
      const percent = Math.round((current / total) * 100);
      const lastTrack = chunk[chunk.length - 1];
      const trackName = `${lastTrack?.artist || ''} — ${lastTrack?.title || ''}`.trim() || `Трек #${current}`;

      if (sender) {
        sender.send('mod:restore-progress', {
          current,
          total,
          percent,
          restoredCount,
          failedCount,
          trackName,
          targetTitle: 'Мне нравится'
        });
      }

      await new Promise(r => setTimeout(r, 80));
    }

    return {
      success: restoredCount > 0,
      total,
      restoredCount,
      failedCount,
      targetTitle: 'Мне нравится',
      playlistTitle: 'Мне нравится',
      error: restoredCount === 0 ? 'Не удалось добавить треки в коллекцию «Мне нравится».' : undefined
    };
  }
}

module.exports = new LibraryBackupManager();
