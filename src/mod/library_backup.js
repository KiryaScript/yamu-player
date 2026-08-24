const electron = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

class LibraryBackupManager {
  constructor() {
    this.appDataDir = path.join(electron.app.getPath('userData'), 'ModData');
    if (!fs.existsSync(this.appDataDir)) {
      try { fs.mkdirSync(this.appDataDir, { recursive: true }); } catch (e) {}
    }
    this.autoBackupFile = path.join(this.appDataDir, 'liked_tracks_auto_backup.json');
  }

  async getSessionCookieHeader() {
    try {
      // Get all cookies from session across all domains
      const cookies = await electron.session.defaultSession.cookies.get({});
      const unique = {};
      cookies.forEach(c => {
        if (c.name && c.value) {
          unique[c.name] = c.value;
        }
      });
      return Object.entries(unique).map(([k, v]) => `${k}=${v}`).join('; ');
    } catch (e) {
      return '';
    }
  }

  fetchJson(url, cookieHeader = '', extraHeaders = {}) {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const client = parsed.protocol === 'https:' ? https : http;
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://music.yandex.ru/',
        'Accept': 'application/json, text/plain, */*',
        'X-Retpath-Y': 'https://music.yandex.ru',
        ...extraHeaders
      };
      if (cookieHeader) headers['Cookie'] = cookieHeader;

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
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ raw: data });
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
    
    // Attempt 1: account/status
    try {
      const statusData = await this.fetchJson('https://api.music.yandex.net/account/status', cookieHeader);
      if (statusData?.result?.account?.uid) {
        return {
          uid: statusData.result.account.uid,
          login: statusData.result.account.login || String(statusData.result.account.uid),
          name: statusData.result.account.displayName || statusData.result.account.login
        };
      }
    } catch (e) {}

    // Attempt 2: handlers/auth.jsx
    try {
      const authData = await this.fetchJson(`https://music.yandex.ru/handlers/auth.jsx?__t=${Date.now()}`, cookieHeader);
      if (authData?.user?.uid) {
        return {
          uid: authData.user.uid,
          login: authData.user.login || String(authData.user.uid),
          name: authData.user.name || authData.user.login
        };
      }
    } catch (e) {}

    return null;
  }

  async fetchLikedTracks(clientTracks = []) {
    const cookieHeader = await this.getSessionCookieHeader();
    const user = await this.getCurrentUser();
    const login = user?.login || 'me';
    const uid = user?.uid;

    let rawTracks = [];

    // Attempt 1: playlist.jsx?owner=...&kinds=3
    if (login) {
      try {
        const data = await this.fetchJson(`https://music.yandex.ru/handlers/playlist.jsx?owner=${encodeURIComponent(login)}&kinds=3`, cookieHeader);
        if (data?.playlist?.tracks && data.playlist.tracks.length > 0) {
          rawTracks = data.playlist.tracks;
          console.log(`[Backup] Retrieved ${rawTracks.length} tracks via playlist.jsx`);
        }
      } catch (e) {
        console.warn('[Backup] playlist.jsx failed:', e.message);
      }
    }

    // Attempt 2: api.music.yandex.net/users/{uid}/playlists/3
    if (rawTracks.length === 0 && uid) {
      try {
        const data = await this.fetchJson(`https://api.music.yandex.net/users/${uid}/playlists/3`, cookieHeader);
        if (data?.result?.tracks && data.result.tracks.length > 0) {
          rawTracks = data.result.tracks;
          console.log(`[Backup] Retrieved ${rawTracks.length} tracks via /users/${uid}/playlists/3`);
        }
      } catch (e) {}
    }

    // Attempt 3: api.music.yandex.net/users/{uid}/likes/tracks
    if (rawTracks.length === 0 && uid) {
      try {
        const data = await this.fetchJson(`https://api.music.yandex.net/users/${uid}/likes/tracks`, cookieHeader);
        const tracks = data?.result?.library?.tracks || data?.result?.tracks;
        if (tracks && tracks.length > 0) {
          rawTracks = tracks;
          console.log(`[Backup] Retrieved ${rawTracks.length} tracks via /users/${uid}/likes/tracks`);
        }
      } catch (e) {}
    }

    // Attempt 4: Fallback to client-side passed tracks
    if (rawTracks.length === 0 && Array.isArray(clientTracks) && clientTracks.length > 0) {
      rawTracks = clientTracks;
      console.log(`[Backup] Using ${rawTracks.length} tracks from client DOM`);
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

  async exportBackup(format = 'json', clientTracks = []) {
    const result = await this.fetchLikedTracks(clientTracks);
    if (!result.success || result.tracks.length === 0) {
      return { success: false, error: result.error || 'Коллекция пуста или не удалось получить список треков' };
    }

    const defaultFilename = `yandex_music_backup_${result.user}_${new Date().toISOString().slice(0, 10)}.${format}`;
    const { filePath, canceled } = await electron.dialog.showSaveDialog({
      title: 'Сохранить резервную копию "Мне нравится"',
      defaultPath: defaultFilename,
      filters: format === 'json' 
        ? [{ name: 'JSON Backup', extensions: ['json'] }]
        : [{ name: 'Text File', extensions: ['txt'] }]
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    if (format === 'json') {
      fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf8');
    } else {
      const lines = result.tracks.map(t => `${t.artist} - ${t.title}`);
      fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    }

    return {
      success: true,
      filePath,
      count: result.tracks.length
    };
  }

  async importAndRestore(sender) {
    const { filePaths, canceled } = await electron.dialog.showOpenDialog({
      title: 'Выберите файл резервной копии (JSON или TXT)',
      filters: [
        { name: 'Backup Files', extensions: ['json', 'txt'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const filePath = filePaths[0];
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let tracksToRestore = [];

    if (filePath.endsWith('.json')) {
      try {
        const parsed = JSON.parse(fileContent);
        tracksToRestore = parsed.tracks || (Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        return { success: false, error: 'Файл повреждён или имеет неверный формат JSON' };
      }
    } else {
      const lines = fileContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      tracksToRestore = lines.map(line => {
        const parts = line.split(' - ');
        if (parts.length >= 2) {
          return { artist: parts[0].trim(), title: parts.slice(1).join(' - ').trim() };
        }
        return { artist: '', title: line };
      });
    }

    if (tracksToRestore.length === 0) {
      return { success: false, error: 'В выбранном файле не найдено треков' };
    }

    const cookieHeader = await this.getSessionCookieHeader();
    let restoredCount = 0;
    let failedCount = 0;
    const total = tracksToRestore.length;

    console.log(`[Backup] Starting restore of ${total} tracks...`);

    for (let i = 0; i < total; i++) {
      const item = tracksToRestore[i];
      let trackId = item.id;

      if (!trackId) {
        try {
          const query = `${item.artist || ''} ${item.title || ''}`.trim();
          const searchData = await this.fetchJson(`https://api.music.yandex.net/search?text=${encodeURIComponent(query)}&type=track&page=0`, cookieHeader);
          const found = searchData?.result?.tracks?.results?.[0];
          if (found?.id) trackId = found.id;
        } catch (e) {}
      }

      if (trackId) {
        try {
          const postBody = `action=add-like&track-id=${trackId}`;
          await this.postJson('https://music.yandex.ru/handlers/like-tracks.jsx', postBody, cookieHeader);
          restoredCount++;
        } catch (e) {
          failedCount++;
        }
      } else {
        failedCount++;
      }

      if (sender && (i % 5 === 0 || i === total - 1)) {
        sender.send('mod:restore-progress', {
          current: i + 1,
          total,
          restoredCount,
          failedCount,
          trackName: `${item.artist || ''} — ${item.title || ''}`
        });
      }

      await new Promise(r => setTimeout(r, 150));
    }

    return {
      success: true,
      total,
      restoredCount,
      failedCount
    };
  }
}

module.exports = new LibraryBackupManager();
