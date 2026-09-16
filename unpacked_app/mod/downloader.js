const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
let nodeId3 = null;
try {
  nodeId3 = require('node-id3');
} catch (e) {
  try {
    nodeId3 = require(path.join(__dirname, '../../../unpacked_app/node_modules/node-id3'));
  } catch (e2) {}
}
const settingsManager = require('./settings');

let electronSession = null;
try {
  const electron = require('electron');
  electronSession = electron.session;
} catch (e) {}

// Salts used by Yandex Music:
// 1. Web client salt (used by yamusic-downloader-pro & web player)
const YANDEX_WEB_SALT = 'XGRlBW9FXlekgbPrRHuSiA';
// 2. Native client salt
const YANDEX_APP_SALT = 'XGRprocessCdIxappkg';
const YANDEX_MUSIC_SALT = YANDEX_WEB_SALT;
const WINDOWS_RESERVED_NAMES = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\..*)?$/i;

function sanitizeFilename(name, maxLen = 60) {
  let clean = String(name || 'Unknown')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\.+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean || clean === '.' || clean === '..') {
    clean = 'Unknown';
  }

  if (WINDOWS_RESERVED_NAMES.test(clean)) {
    clean = `_${clean}`;
  }

  return Array.from(clean).slice(0, maxLen).join('').trim();
}

function isPathInside(baseDir, targetPath) {
  const rel = path.relative(path.resolve(baseDir), path.resolve(targetPath));
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

let libraryBackup = null;
try {
  libraryBackup = require('./library_backup');
} catch (e) {}

class Downloader {
  constructor() {
    this.queue = [];
    this.activeRequests = new Set();
    this.isCancelled = false;
  }

  cancelDownload() {
    this.isCancelled = true;
    console.log(`[Downloader] cancelDownload requested. Aborting ${this.activeRequests.size} active download streams...`);
    for (const req of this.activeRequests) {
      try {
        if (req && typeof req.destroy === 'function') {
          req.destroy(new Error('DOWNLOAD_CANCELLED'));
        }
      } catch (e) {}
    }
    this.activeRequests.clear();
    console.log('[Downloader] All active download streams aborted.');
  }

  async getSessionCookieHeader() {
    if (!electronSession || !electronSession.defaultSession) return '';
    try {
      const cookies = await electronSession.defaultSession.cookies.get({});
      const importantNames = new Set([
        'Session_id', 'sessionid2', 'yandex_login', 'i-cookie', 'yandexuid', 'uid',
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

  async getUserId() {
    if (libraryBackup && typeof libraryBackup.getCurrentUser === 'function') {
      try {
        const u = await libraryBackup.getCurrentUser();
        if (u && u.uid) return String(u.uid);
      } catch (e) {}
    }
    if (!electronSession || !electronSession.defaultSession) return null;
    try {
      const cookies = await electronSession.defaultSession.cookies.get({});
      const uidCookie = cookies.find(c => c.name === 'uid');
      if (uidCookie && uidCookie.value) return String(uidCookie.value);
    } catch (e) {}
    return null;
  }

  async fetchJson(url, extraHeaders = {}, redirectCount = 0) {
    if (redirectCount > 5) {
      throw new Error('Слишком много перенаправлений (Redirect loop)');
    }

    const cookieHeader = await this.getSessionCookieHeader();
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const client = parsed.protocol === 'https:' ? https : http;
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        ...extraHeaders
      };
      if (!extraHeaders.noCookie && cookieHeader) {
        headers['Cookie'] = cookieHeader;
      }
      delete headers.noCookie;

      const req = client.get(url, { headers, timeout: 20000 }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const nextUrl = new URL(res.headers.location, url).href;
          return this.fetchJson(nextUrl, extraHeaders, redirectCount + 1).then(resolve).catch(reject);
        }

        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`HTTP Ошибка ${res.statusCode}: ${res.statusMessage}`));
        }

        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve(data);
          } catch (err) {
            resolve({ raw: body, status: res.statusCode });
          }
        });
        res.on('error', reject);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Превышено время ожидания ответа сервера (Timeout)'));
      });
      req.on('error', reject);
    });
  }

  fetchBuffer(url, extraHeaders = {}, redirectCount = 0) {
    if (redirectCount > 5) {
      throw new Error('Слишком много перенаправлений (Redirect loop)');
    }

    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const client = parsed.protocol === 'https:' ? https : http;
      const req = client.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ...extraHeaders
        },
        timeout: 25000
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const nextUrl = new URL(res.headers.location, url).href;
          return this.fetchBuffer(nextUrl, extraHeaders, redirectCount + 1).then(resolve).catch(reject);
        }

        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`Ошибка скачивания: HTTP ${res.statusCode}`));
        }

        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Превышено время скачивания данных'));
      });
      req.on('error', reject);
    });
  }

  fetchXml(url, redirectCount = 0) {
    if (redirectCount > 5) {
      throw new Error('Слишком много перенаправлений в XML');
    }

    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const client = parsed.protocol === 'https:' ? https : http;
      const req = client.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const nextUrl = new URL(res.headers.location, url).href;
          return this.fetchXml(nextUrl, redirectCount + 1).then(resolve).catch(reject);
        }

        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`Ошибка получения XML источника: HTTP ${res.statusCode}`));
        }

        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
        res.on('error', reject);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Таймаут получения XML источника'));
      });
      req.on('error', reject);
    });
  }

  calculateDirectUrl(xmlText, codec = 'mp3', customSalt = null) {
    const hostMatch = xmlText.match(/<host>(.*?)<\/host>/);
    const pathMatch = xmlText.match(/<path>(.*?)<\/path>/);
    const tsMatch = xmlText.match(/<ts>(.*?)<\/ts>/);
    const sMatch = xmlText.match(/<s>(.*?)<\/s>/);

    if (!hostMatch || !pathMatch || !tsMatch || !sMatch) {
      throw new Error('Не удалось разобрать XML структуры источника трека');
    }

    const host = hostMatch[1].trim();
    const pathVal = pathMatch[1].trim();
    const ts = tsMatch[1].trim();
    const s = sMatch[1].trim();
    const cleanPath = pathVal.startsWith('/') ? pathVal.substring(1) : pathVal;

    const salt = customSalt || YANDEX_WEB_SALT;
    const signString = salt + cleanPath + s;
    const hash = crypto.createHash('md5').update(signString).digest('hex');

    const prefix = (codec === 'flac') ? 'get-flac' : 'get-mp3';
    return `https://${host}/${prefix}/${hash}/${ts}${pathVal}`;
  }

  async searchTrack(title, artist = '') {
    try {
      const cleanArtist = (artist === 'Яндекс Музыка' || artist === 'Unknown Artist') ? '' : artist;
      const query = `${cleanArtist} ${title}`.trim();
      if (!query) return null;

      // 1. Primary: Search query without cookies (public, reliable, prevents HTTP 400 header bloat)
      for (const host of ['https://api.music.yandex.ru', 'https://api.music.yandex.net']) {
        try {
          const url = `${host}/search?text=${encodeURIComponent(query)}&type=track&page=0`;
          const data = await this.fetchJson(url, { noCookie: true });
          const tracks = data?.result?.tracks?.results;
          if (tracks && tracks.length > 0) return tracks[0];
        } catch (e) {}
      }

      // 2. Secondary: Search by title alone if combined query had artist
      if (cleanArtist && title) {
        for (const host of ['https://api.music.yandex.ru', 'https://api.music.yandex.net']) {
          try {
            const urlTitle = `${host}/search?text=${encodeURIComponent(title.trim())}&type=track&page=0`;
            const dataT = await this.fetchJson(urlTitle, { noCookie: true });
            const tracksT = dataT?.result?.tracks?.results;
            if (tracksT && tracksT.length > 0) return tracksT[0];
          } catch (e) {}
        }
      }

      // 3. Tertiary: Fallback with session cookies
      try {
        const urlRu = `https://api.music.yandex.ru/search?text=${encodeURIComponent(query)}&type=track&page=0`;
        const dataRu = await this.fetchJson(urlRu);
        const tracksRu = dataRu?.result?.tracks?.results;
        if (tracksRu && tracksRu.length > 0) return tracksRu[0];
      } catch (errRu) {}
    } catch (e) {
      console.warn('[Downloader] searchTrack error:', e.message);
    }
    return null;
  }

  async getTrackDownloadUrl(trackId, preferredQuality = 'mp3_320') {
    let response = null;
    const extraHeaders = {
      'Referer': 'https://music.yandex.ru/',
      'Origin': 'https://music.yandex.ru'
    };

    // 1. Try with session cookies (api.music.yandex.ru first)
    for (const host of ['https://api.music.yandex.ru', 'https://api.music.yandex.net']) {
      try {
        const infoUrl = `${host}/tracks/${trackId}/download-info`;
        response = await this.fetchJson(infoUrl, extraHeaders);
        if (response?.result?.length) break;
      } catch (e) {}
    }

    // 2. If rejected or failed (e.g. 401 Unauthorized), retry WITHOUT cookies!
    if (!response?.result?.length) {
      for (const host of ['https://api.music.yandex.ru', 'https://api.music.yandex.net']) {
        try {
          const infoUrl = `${host}/tracks/${trackId}/download-info`;
          response = await this.fetchJson(infoUrl, { ...extraHeaders, noCookie: true });
          if (response?.result?.length) break;
        } catch (e) {}
      }
    }

    const sources = response?.result;
    if (!sources || !sources.length) {
      throw new Error(`Не удалось получить источники для трека ID ${trackId}`);
    }

    let chosenSource = null;
    if (preferredQuality === 'flac') {
      chosenSource = sources.find(s => s.codec === 'flac' && !s.preview);
    }
    if (!chosenSource && (preferredQuality === 'flac' || preferredQuality === 'mp3_320')) {
      chosenSource = sources.find(s => s.codec === 'mp3' && s.bitrateInKbps === 320 && !s.preview);
    }
    if (!chosenSource) {
      chosenSource = sources.find(s => s.codec === 'mp3' && s.bitrateInKbps >= 192 && !s.preview);
    }
    if (!chosenSource) {
      // Fallback to any non-preview source
      chosenSource = sources.find(s => !s.preview);
    }
    if (!chosenSource) {
      // Last resort: any source
      chosenSource = sources[0];
    }

    if (chosenSource.direct && chosenSource.downloadInfoUrl) {
      return { 
        url: chosenSource.downloadInfoUrl, 
        fallbackUrl: null, 
        codec: chosenSource.codec, 
        bitrate: chosenSource.bitrateInKbps 
      };
    }

    const xml = await this.fetchXml(chosenSource.downloadInfoUrl);
    const directUrl = this.calculateDirectUrl(xml, chosenSource.codec, YANDEX_WEB_SALT);
    const fallbackUrl = this.calculateDirectUrl(xml, chosenSource.codec, YANDEX_APP_SALT);
    return { 
      url: directUrl, 
      fallbackUrl, 
      codec: chosenSource.codec, 
      bitrate: chosenSource.bitrateInKbps 
    };
  }

  async getTrackMeta(trackId) {
    try {
      const metaUrl = `https://api.music.yandex.net/tracks/${trackId}`;
      const res = await this.fetchJson(metaUrl);
      if (res?.result && res.result[0]) {
        return res.result[0];
      }
    } catch (e) {}
    return null;
  }

  async downloadSingleTrack(trackObj, targetFolder = null, onProgress = null, discPrefix = '') {
    if (this.isCancelled) return { success: false, cancelled: true };
    const settings = settingsManager.getAll();
    const destDir = targetFolder || settings.downloadPath;

    if (!fs.existsSync(destDir)) {
      await fsPromises.mkdir(destDir, { recursive: true });
    }
    if (this.isCancelled) return { success: false, cancelled: true };

    let trackId = trackObj.id || trackObj.trackId || trackObj.realId;
    let trackMeta = trackObj;

    // Check link for track ID
    if (!trackId && trackObj.link) {
      const match = String(trackObj.link).match(/\/track\/(\d+)/);
      if (match) trackId = match[1];
    }

    // Fallback: If track ID is missing, search via title and artist in Yandex Music catalog
    if (!trackId && (trackObj.title || trackObj.name)) {
      const titleToSearch = trackObj.title || trackObj.name;
      const artistToSearch = (trackObj.artists || []).map(a => a.name || a).join(' ');
      console.log(`[Downloader] Track ID missing for "${titleToSearch}", searching catalog...`);
      const searched = await this.searchTrack(titleToSearch, artistToSearch);
      if (searched && searched.id) {
        trackMeta = searched;
        trackId = searched.id;
        console.log(`[Downloader] Successfully resolved track ID: ${trackId} for "${titleToSearch}"`);
      }
    }

    if (!trackId) {
      throw new Error(`Не удалось определить ID трека "${trackObj.title || 'Неизвестный трек'}"`);
    }

    if (this.isCancelled) return { success: false, cancelled: true };

    // Safety check: ensure metadata corresponds to the actual trackId
    if (trackId) {
      try {
        const fetched = await this.getTrackMeta(trackId);
        if (fetched && fetched.title) {
          const t1 = (trackObj.title || '').toLowerCase().trim();
          const t2 = (fetched.title || '').toLowerCase().trim();
          if (t1 && t2 && !t1.includes(t2) && !t2.includes(t1)) {
            console.warn(`[Downloader] Desync detected: provided title "${trackObj.title}" does not match track ${trackId} ("${fetched.title}"). Syncing metadata to downloaded track.`);
            trackMeta = fetched;
          } else if (!trackMeta.title || !trackMeta.artists || trackMeta.artists.length === 0) {
            trackMeta = fetched;
          }
        }
      } catch (e) {}
    }

    if (this.isCancelled) return { success: false, cancelled: true };

    let title = trackMeta.title || 'Unknown Title';
    if (trackMeta.version) {
      title += ` (${trackMeta.version})`;
    }
    
    let artists = 'Unknown Artist';
    if (Array.isArray(trackMeta.artists) && trackMeta.artists.length > 0) {
      artists = trackMeta.artists.map(a => a.name || a).join(', ');
    } else if (trackMeta.artists && trackMeta.artists.name) {
      artists = trackMeta.artists.name;
    }
    
    const album = trackMeta.albums?.[0]?.title || '';
    const year = trackMeta.albums?.[0]?.year || '';
    const trackNumber = trackMeta.albums?.[0]?.trackPosition?.index || '';
    const coverUri = trackMeta.coverUri || trackMeta.albums?.[0]?.coverUri || '';

    const safeArtist = sanitizeFilename(artists, 50);
    const safeTitle = sanitizeFilename(title, 60);
    const prefix = discPrefix ? `${discPrefix} - ` : '';

    let directUrl = trackObj.directUrl;
    let fallbackUrl = null;
    let codec = trackObj.codec || 'mp3';
    let bitrate = trackObj.bitrate;

    if (!directUrl) {
      const urlInfo = await this.getTrackDownloadUrl(trackId, settings.downloadQuality);
      directUrl = urlInfo.url;
      fallbackUrl = urlInfo.fallbackUrl;
      codec = urlInfo.codec;
      bitrate = urlInfo.bitrate;
    }

    if (this.isCancelled) return { success: false, cancelled: true };

    const ext = codec === 'flac' ? 'flac' : 'mp3';
    const filename = `${prefix}${safeArtist} - ${safeTitle}.${ext}`;
    const filePath = path.join(destDir, filename);

    if (!isPathInside(destDir, filePath)) {
      throw new Error('Недопустимый путь сохранения файла');
    }

    // Smart Skip: If file already exists and size > 100KB, skip downloading!
    if (settings.skipExistingTracks !== false && fs.existsSync(filePath)) {
      try {
        const stats = fs.statSync(filePath);
        if (stats.size > 100 * 1024) {
          console.log(`[Downloader] Skipping existing track: ${filename} (${Math.round(stats.size / 1024)} KB)`);
          if (onProgress) {
            onProgress({ percent: 100, downloadedBytes: stats.size, totalBytes: stats.size, speed: 0 });
          }
          return {
            success: true,
            skipped: true,
            trackId,
            title,
            artists,
            album,
            filePath,
            filename,
            codec,
            bitrate: bitrate || 320
          };
        }
      } catch (e) {}
    }

    if (this.isCancelled) return { success: false, cancelled: true };

    let audioBuffer;
    try {
      audioBuffer = await this.downloadStreamWithProgress(directUrl, onProgress, trackId, title, artists);
    } catch (err) {
      if (this.isCancelled || err.message === 'DOWNLOAD_CANCELLED') {
        return { success: false, cancelled: true };
      }
      if (fallbackUrl) {
        console.warn(`[Downloader] Primary URL attempt failed (${err.message}), retrying with alternate salt...`);
        audioBuffer = await this.downloadStreamWithProgress(fallbackUrl, onProgress, trackId, title, artists);
      } else {
        throw err;
      }
    }

    if (this.isCancelled) return { success: false, cancelled: true };

    await fsPromises.writeFile(filePath, audioBuffer);

    if (this.isCancelled) return { success: false, cancelled: true };

    if (settings.embedTags && ext === 'mp3') {
      try {
        const tags = {
          title,
          artist: artists,
          album,
          year: year ? String(year) : undefined,
          trackNumber: trackNumber ? String(trackNumber) : undefined
        };

        if (settings.embedCover && coverUri) {
          try {
            const coverUrl = coverUri.startsWith('http')
              ? coverUri.replace(/\d+x\d+$/, '1000x1000')
              : `https://${coverUri.replace('%%', '1000x1000')}`;
            const coverBuffer = await this.fetchBuffer(coverUrl);
            tags.image = {
              mime: 'image/jpeg',
              type: { id: 3, name: 'front cover' },
              description: 'Cover',
              imageBuffer: coverBuffer
            };
          } catch (e) {}
        }

        if (nodeId3) {
          nodeId3.write(tags, filePath);
        }
      } catch (err) {
        console.error('[Downloader] Failed to write ID3 tags:', err);
      }
    }

    return {
      success: true,
      trackId,
      title,
      artists,
      album,
      filePath,
      filename,
      codec,
      bitrate
    };
  }

  async downloadStreamWithProgress(url, onProgress, trackId, title, artists) {
    if (this.isCancelled) {
      throw new Error('DOWNLOAD_CANCELLED');
    }

    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const client = parsed.protocol === 'https:' ? https : http;
      let isReqAborted = false;

      const req = client.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://music.yandex.ru/'
        },
        timeout: 60000
      }, (res) => {
        if (this.isCancelled || isReqAborted) {
          req.destroy();
          return reject(new Error('DOWNLOAD_CANCELLED'));
        }

        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return this.fetchBuffer(res.headers.location).then(resolve).catch(reject);
        }

        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }

        const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
        let downloadedBytes = 0;
        const chunks = [];

        res.on('data', (chunk) => {
          if (this.isCancelled || isReqAborted) {
            req.destroy();
            return reject(new Error('DOWNLOAD_CANCELLED'));
          }
          chunks.push(chunk);
          downloadedBytes += chunk.length;
          if (onProgress && totalBytes > 0) {
            const percent = Math.round((downloadedBytes / totalBytes) * 100);
            onProgress({
              trackId,
              title,
              artists,
              percent,
              downloaded: downloadedBytes,
              total: totalBytes
            });
          }
        });

        res.on('end', () => {
          if (this.isCancelled || isReqAborted) {
            return reject(new Error('DOWNLOAD_CANCELLED'));
          }
          resolve(Buffer.concat(chunks));
        });
        res.on('error', (err) => {
          if (this.isCancelled || isReqAborted) {
            reject(new Error('DOWNLOAD_CANCELLED'));
          } else {
            reject(err);
          }
        });
      });

      this.activeRequests.add(req);
      const cleanup = () => this.activeRequests.delete(req);
      req.on('close', cleanup);
      req.on('error', cleanup);

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Превышено время скачивания аудиопотока'));
      });
      req.on('error', (err) => {
        cleanup();
        if (this.isCancelled || isReqAborted) {
          reject(new Error('DOWNLOAD_CANCELLED'));
        } else {
          reject(err);
        }
      });
    });
  }

  // Alias for downloadSingleTrack
  async downloadTrack(trackObj, targetFolder = null, onProgress = null, discPrefix = '') {
    return await this.downloadSingleTrack(trackObj, targetFolder, onProgress, discPrefix);
  }

  async downloadAlbum(albumId, onProgress = null, onTrackDone = null) {
    const settings = settingsManager.getAll();
    const albumUrl = `https://api.music.yandex.net/albums/${albumId}/with-tracks`;
    const data = await this.fetchJson(albumUrl);
    const album = data?.result;

    if (!album) {
      throw new Error(`Альбом с ID ${albumId} не найден`);
    }

    const artistName = sanitizeFilename((album.artists || []).map(a => a.name).join(', ') || 'Unknown Artist', 50);
    const albumTitle = sanitizeFilename(album.title || 'Unknown Album', 50);
    const year = album.year ? ` (${album.year})` : '';
    const folderName = `${artistName} - ${albumTitle}${year}`;
    const albumDir = path.join(settings.downloadPath, folderName);

    if (!fs.existsSync(albumDir)) {
      await fsPromises.mkdir(albumDir, { recursive: true });
    }

    const volumes = album.volumes || [];
    const allTracksWithMeta = [];

    volumes.forEach((vol, volIdx) => {
      const isMultiDisc = volumes.length > 1;
      vol.forEach((tr, trIdx) => {
        const discNum = String(volIdx + 1).padStart(2, '0');
        const trackNum = String(trIdx + 1).padStart(2, '0');
        const prefix = isMultiDisc ? `${discNum}-${trackNum}` : trackNum;
        allTracksWithMeta.push({ track: tr, prefix });
      });
    });

    this.isCancelled = false;
    const concurrency = Math.max(1, Math.min(10, parseInt(settings.downloadConcurrency, 10) || 3));
    const results = [];
    let completedCount = 0;
    let skippedCount = 0;
    let activeTrackIndex = 0;
    const activeTracks = new Map();

    let lastProgressEmit = 0;
    const emitBatchProgress = (force = false) => {
      if (this.isCancelled) return;
      const now = Date.now();
      if (!force && now - lastProgressEmit < 250) return;
      lastProgressEmit = now;

      if (onProgress) {
        const currentTitles = Array.from(activeTracks.values()).filter(Boolean);
        onProgress({
          albumTitle,
          artistName,
          completedTracks: completedCount,
          currentTrackIndex: Math.min(completedCount + 1, allTracksWithMeta.length),
          totalTracks: allTracksWithMeta.length,
          downloadedCount: results.length - skippedCount,
          skippedCount,
          percent: Math.min(100, Math.round((completedCount / allTracksWithMeta.length) * 100)),
          activeWorkers: currentTitles.length,
          currentTracks: currentTitles,
          trackTitle: currentTitles[0] || ''
        });
      }
    };

    const worker = async (workerId) => {
      if (workerId > 0) {
        await new Promise(r => setTimeout(r, workerId * 150));
      }

      while (activeTrackIndex < allTracksWithMeta.length) {
        if (this.isCancelled) {
          activeTracks.delete(workerId);
          break;
        }

        const currentIndex = activeTrackIndex++;
        if (currentIndex >= allTracksWithMeta.length) {
          activeTracks.delete(workerId);
          break;
        }

        const item = allTracksWithMeta[currentIndex];
        const trackTitle = item.track?.title || item.track?.name || `Трек #${currentIndex + 1}`;
        activeTracks.set(workerId, trackTitle);
        emitBatchProgress();

        try {
          const res = await this.downloadSingleTrack(item.track, albumDir, () => {
            emitBatchProgress();
          }, item.prefix);

          activeTracks.delete(workerId);
          if (this.isCancelled || res?.cancelled) {
            break;
          }

          if (res?.skipped) skippedCount++;
          results.push(res);
          completedCount++;
          emitBatchProgress(true);
          if (onTrackDone) onTrackDone(res, completedCount, allTracksWithMeta.length);
        } catch (err) {
          activeTracks.delete(workerId);
          if (this.isCancelled || err.message === 'DOWNLOAD_CANCELLED') {
            break;
          }
          completedCount++;
          emitBatchProgress(true);
          console.error(`[Downloader] Error downloading album track #${currentIndex + 1}:`, err.message);
        }

        if (this.isCancelled) break;
        const jitter = 50 + Math.floor(Math.random() * 100);
        await new Promise(r => setTimeout(r, jitter));
      }
      activeTracks.delete(workerId);
    };

    const workers = [];
    for (let i = 0; i < Math.min(concurrency, allTracksWithMeta.length); i++) {
      workers.push(worker(i));
    }
    await Promise.all(workers);

    if (this.isCancelled && onProgress) {
      onProgress({
        cancelled: true,
        status: 'cancelled',
        albumTitle,
        completedTracks: completedCount,
        totalTracks: allTracksWithMeta.length
      });
    }

    return {
      success: !this.isCancelled,
      cancelled: this.isCancelled,
      albumTitle,
      artistName,
      folderPath: albumDir,
      downloadedCount: results.length - skippedCount,
      skippedCount,
      totalCount: allTracksWithMeta.length
    };
  }

  async downloadPlaylist(userIdOrParams, playlistKind = null, onProgress = null, onTrackDone = null) {
    const settings = settingsManager.getAll();
    let userId = null;
    let kind = null;
    let customTitle = null;
    let preloadedTracks = null;
    let uuid = null;

    if (typeof userIdOrParams === 'object' && userIdOrParams !== null) {
      userId = userIdOrParams.userId;
      kind = userIdOrParams.playlistKind || userIdOrParams.kind;
      customTitle = userIdOrParams.title || userIdOrParams.playlistTitle;
      preloadedTracks = userIdOrParams.tracks;
      uuid = userIdOrParams.uuid;
      if (typeof playlistKind === 'function') {
        onProgress = playlistKind;
        playlistKind = null;
      }
    } else {
      userId = userIdOrParams;
      kind = playlistKind;
    }

    let allTracks = [];
    let playlistTitle = customTitle || 'Плейлист';

    if (Array.isArray(preloadedTracks) && preloadedTracks.length > 0) {
      allTracks = preloadedTracks;
    } else {
      let isLikes = (kind === 'likes' || kind === '3' || userId === 'likes' || !kind ||
                     String(customTitle).toLowerCase().includes('мне нравится') ||
                     String(customTitle).toLowerCase().includes('коллекция'));

      if (isLikes) {
        playlistTitle = 'Мне нравится';
        if (libraryBackup) {
          try {
            const likedRes = await libraryBackup.fetchLikedTracks();
            if (likedRes && likedRes.tracks && likedRes.tracks.length > 0) {
              allTracks = likedRes.tracks;
            }
          } catch (e) {
            console.warn('[Downloader] fetchLikedTracks error:', e.message);
          }
        }
      } else if (uuid && libraryBackup) {
        try {
          const cookieHeader = await this.getSessionCookieHeader();
          const uRes = await libraryBackup.fetchJson(`https://api.music.yandex.ru/playlists/${encodeURIComponent(uuid)}`, { Cookie: cookieHeader });
          if (uRes?.result?.tracks) {
            allTracks = uRes.result.tracks;
            if (uRes.result.title) playlistTitle = uRes.result.title;
          }
        } catch (e) {}
      } else if (userId && kind && libraryBackup) {
        try {
          const cookieHeader = await this.getSessionCookieHeader();
          const pRes = await libraryBackup.fetchJson(`https://api.music.yandex.ru/users/${encodeURIComponent(userId)}/playlists/${encodeURIComponent(kind)}`, { Cookie: cookieHeader });
          if (pRes?.result?.tracks) {
            allTracks = pRes.result.tracks;
            if (pRes.result.title) playlistTitle = pRes.result.title;
          }
        } catch (e) {}
      }

      // Fallback: Web player handler for likes
      if (allTracks.length === 0 && isLikes) {
        try {
          const cookieHeader = await this.getSessionCookieHeader();
          const hData = await this.fetchJson('https://music.yandex.ru/handlers/playlist.jsx?owner=me&kinds=3', { Cookie: cookieHeader });
          if (hData?.playlist?.tracks && hData.playlist.tracks.length > 0) {
            allTracks = hData.playlist.tracks;
            if (hData.playlist.title) playlistTitle = hData.playlist.title;
          }
        } catch (e) {}
      }

      // If tracks are bare IDs (e.g. from likes without metadata), batch resolve metadata in chunks of 100
      if (allTracks.length > 0 && !allTracks[0]?.title && !allTracks[0]?.track?.title && (allTracks[0]?.id || allTracks[0]?.trackId)) {
        console.log(`[Downloader] Resolving metadata for ${allTracks.length} tracks in batches of 100...`);
        const trackIds = allTracks.map(t => t.id || t.trackId || t.track?.id).filter(Boolean);
        const resolved = [];
        for (let i = 0; i < trackIds.length; i += 100) {
          const batch = trackIds.slice(i, i + 100);
          try {
            const bData = await this.fetchJson(`https://api.music.yandex.ru/tracks?trackIds=${batch.join(',')}`);
            if (bData?.result && Array.isArray(bData.result)) {
              resolved.push(...bData.result);
            }
          } catch (e) {}
        }
        if (resolved.length > 0) {
          allTracks = resolved;
        }
      }
    }

    if (!allTracks || allTracks.length === 0) {
      throw new Error(`В плейлисте "${playlistTitle}" не найдено треков для скачивания`);
    }

    const safePlaylistTitle = sanitizeFilename(playlistTitle, 50);
    const playlistDir = path.join(settings.downloadPath, safePlaylistTitle);

    if (!fs.existsSync(playlistDir)) {
      await fsPromises.mkdir(playlistDir, { recursive: true });
    }

    this.isCancelled = false;
    const concurrency = Math.max(1, Math.min(10, parseInt(settings.downloadConcurrency, 10) || 3));
    console.log(`[Downloader] Starting multi-worker download for ${allTracks.length} tracks with ${concurrency} workers...`);

    const results = [];
    let completedCount = 0;
    let skippedCount = 0;
    let activeTrackIndex = 0;
    const activeTracks = new Map();

    let lastProgressEmit = 0;
    const emitBatchProgress = (force = false) => {
      if (this.isCancelled) return;
      const now = Date.now();
      if (!force && now - lastProgressEmit < 250) return;
      lastProgressEmit = now;

      if (onProgress) {
        const currentTitles = Array.from(activeTracks.values()).filter(Boolean);
        onProgress({
          playlistTitle: safePlaylistTitle,
          completedTracks: completedCount,
          currentTrackIndex: Math.min(completedCount + 1, allTracks.length),
          totalTracks: allTracks.length,
          downloadedCount: results.length - skippedCount,
          skippedCount,
          percent: Math.min(100, Math.round((completedCount / allTracks.length) * 100)),
          activeWorkers: currentTitles.length,
          currentTracks: currentTitles,
          trackTitle: currentTitles[0] || ''
        });
      }
    };

    const worker = async (workerId) => {
      if (workerId > 0) {
        await new Promise(r => setTimeout(r, workerId * 150));
      }

      while (activeTrackIndex < allTracks.length) {
        if (this.isCancelled) {
          activeTracks.delete(workerId);
          console.log(`[Downloader] Worker #${workerId + 1} stopped due to cancellation.`);
          break;
        }

        const currentIndex = activeTrackIndex++;
        if (currentIndex >= allTracks.length) {
          activeTracks.delete(workerId);
          break;
        }

        const rawTrack = allTracks[currentIndex];
        const track = rawTrack.track || rawTrack;
        const trackNum = String(currentIndex + 1).padStart(3, '0');
        const trackTitle = track.title || track.name || `Трек #${currentIndex + 1}`;
        activeTracks.set(workerId, trackTitle);
        emitBatchProgress();

        try {
          const res = await this.downloadSingleTrack(track, playlistDir, () => {
            emitBatchProgress();
          }, trackNum);

          activeTracks.delete(workerId);
          if (this.isCancelled || res?.cancelled) {
            break;
          }

          if (res?.skipped) skippedCount++;
          results.push(res);
          completedCount++;
          emitBatchProgress(true);
          if (onTrackDone) onTrackDone(res, completedCount, allTracks.length);
        } catch (err) {
          activeTracks.delete(workerId);
          if (this.isCancelled || err.message === 'DOWNLOAD_CANCELLED') {
            break;
          }
          completedCount++;
          emitBatchProgress(true);
          console.error(`[Downloader] Error downloading playlist track #${currentIndex + 1}:`, err.message);
        }

        if (this.isCancelled) break;
        const jitter = 50 + Math.floor(Math.random() * 100);
        await new Promise(r => setTimeout(r, jitter));
      }
      activeTracks.delete(workerId);
    };

    const workers = [];
    for (let i = 0; i < Math.min(concurrency, allTracks.length); i++) {
      workers.push(worker(i));
    }
    await Promise.all(workers);

    if (this.isCancelled && onProgress) {
      onProgress({
        cancelled: true,
        status: 'cancelled',
        playlistTitle: safePlaylistTitle,
        completedTracks: completedCount,
        totalTracks: allTracks.length
      });
    }

    return {
      success: !this.isCancelled,
      cancelled: this.isCancelled,
      playlistTitle: safePlaylistTitle,
      folderPath: playlistDir,
      downloadedCount: results.length - skippedCount,
      skippedCount,
      totalCount: allTracks.length
    };
  }
}

const downloaderInstance = new Downloader();
module.exports = downloaderInstance;
module.exports.sanitizeFilename = sanitizeFilename;
module.exports.isPathInside = isPathInside;
module.exports.YANDEX_WEB_SALT = YANDEX_WEB_SALT;
module.exports.YANDEX_APP_SALT = YANDEX_APP_SALT;
