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

class Downloader {
  constructor() {
    this.queue = [];
    this.activeDownloads = new Map();
  }

  async getSessionCookieHeader() {
    if (!electronSession || !electronSession.defaultSession) {
      return '';
    }
    try {
      const cookies = await electronSession.defaultSession.cookies.get({ domain: 'yandex.ru' });
      const importantNames = new Set([
        'Session_id', 'sessionid2', 'yandexuid', 'uid', 'yandex_login', 
        'L', 'mda2_beacon', 'my', 'device_id', 'yashr'
      ]);
      const unique = {};
      cookies.forEach(c => {
        if (c.name && c.value && (importantNames.has(c.name) || c.name.startsWith('Session_') || c.name.startsWith('yp'))) {
          unique[c.name] = c.value;
        }
      });
      return Object.entries(unique).map(([k, v]) => `${k}=${v}`).join('; ');
    } catch (e) {
      return '';
    }
  }

  async getUserId() {
    if (!electronSession || !electronSession.defaultSession) return null;
    try {
      const cookies = await electronSession.defaultSession.cookies.get({ domain: 'yandex.ru' });
      const uid = cookies.find(c => c.name === 'yandexuid' || c.name === 'uid' || c.name === 'Session_id');
      if (uid) return uid.value;
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
    const settings = settingsManager.getAll();
    const destDir = targetFolder || settings.downloadPath;

    if (!fs.existsSync(destDir)) {
      await fsPromises.mkdir(destDir, { recursive: true });
    }

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
    const ext = codec === 'flac' ? 'flac' : 'mp3';
    const filename = `${prefix}${safeArtist} - ${safeTitle}.${ext}`;
    const filePath = path.join(destDir, filename);

    if (!isPathInside(destDir, filePath)) {
      throw new Error('Недопустимый путь сохранения файла');
    }

    let audioBuffer;
    try {
      audioBuffer = await this.downloadStreamWithProgress(directUrl, onProgress, trackId, title, artists);
    } catch (err) {
      if (fallbackUrl) {
        console.warn(`[Downloader] Primary URL attempt failed (${err.message}), retrying with alternate salt...`);
        audioBuffer = await this.downloadStreamWithProgress(fallbackUrl, onProgress, trackId, title, artists);
      } else {
        throw err;
      }
    }

    await fsPromises.writeFile(filePath, audioBuffer);

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
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const client = parsed.protocol === 'https:' ? https : http;
      const req = client.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://music.yandex.ru/'
        },
        timeout: 60000
      }, (res) => {
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
          resolve(Buffer.concat(chunks));
        });
        res.on('error', reject);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Превышено время скачивания аудиопотока'));
      });
      req.on('error', reject);
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

    const results = [];
    for (let i = 0; i < allTracksWithMeta.length; i++) {
      const item = allTracksWithMeta[i];
      try {
        const res = await this.downloadSingleTrack(item.track, albumDir, (p) => {
          if (onProgress) {
            onProgress({
              albumTitle,
              currentTrackIndex: i + 1,
              totalTracks: allTracksWithMeta.length,
              ...p
            });
          }
        }, item.prefix);
        results.push(res);
        if (onTrackDone) onTrackDone(res, i + 1, allTracksWithMeta.length);
      } catch (err) {
        console.error(`[Downloader] Error downloading track:`, err);
      }
    }

    return {
      success: true,
      albumTitle,
      artistName,
      folderPath: albumDir,
      downloadedCount: results.length,
      totalCount: allTracksWithMeta.length
    };
  }

  async downloadPlaylist(userIdOrParams, playlistKind = null, onProgress = null, onTrackDone = null) {
    const settings = settingsManager.getAll();
    let userId = null;
    let kind = null;
    let customTitle = null;
    let preloadedTracks = null;

    if (typeof userIdOrParams === 'object' && userIdOrParams !== null) {
      userId = userIdOrParams.userId;
      kind = userIdOrParams.playlistKind || userIdOrParams.kind;
      customTitle = userIdOrParams.title || userIdOrParams.playlistTitle;
      preloadedTracks = userIdOrParams.tracks;
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
      let isLikes = (kind === 'likes' || kind === '3' || userId === 'likes' || !kind);
      let playlistUrl;

      if (isLikes) {
        const actualUid = await this.getUserId() || userId || '3';
        playlistUrl = `https://api.music.yandex.net/users/${actualUid}/playlists/3`;
      } else if (kind) {
        playlistUrl = `https://api.music.yandex.net/users/${userId}/playlists/${kind}`;
      } else {
        playlistUrl = `https://api.music.yandex.net/playlists/${userId}`;
      }

      let data;
      try {
        data = await this.fetchJson(playlistUrl);
      } catch (err) {
        if (isLikes) {
          const actualUid = await this.getUserId() || '3';
          data = await this.fetchJson(`https://api.music.yandex.net/users/${actualUid}/likes/tracks`);
        } else {
          throw err;
        }
      }

      const playlist = data?.result;
      if (!playlist) {
        throw new Error('Плейлист не найден');
      }

      playlistTitle = playlist.title || playlistTitle || 'Мне нравится';
      const rawTracks = playlist.tracks || playlist.library?.tracks || [];
      allTracks = rawTracks.map(t => t.track || t).filter(Boolean);
    }

    const safePlaylistTitle = sanitizeFilename(playlistTitle, 50);
    const playlistDir = path.join(settings.downloadPath, safePlaylistTitle);

    if (!fs.existsSync(playlistDir)) {
      await fsPromises.mkdir(playlistDir, { recursive: true });
    }

    const results = [];
    for (let i = 0; i < allTracks.length; i++) {
      const track = allTracks[i];
      const trackNum = String(i + 1).padStart(3, '0');
      try {
        const res = await this.downloadSingleTrack(track, playlistDir, (p) => {
          if (onProgress) {
            onProgress({
              playlistTitle: safePlaylistTitle,
              currentTrackIndex: i + 1,
              totalTracks: allTracks.length,
              ...p
            });
          }
        }, trackNum);
        results.push(res);
        if (onTrackDone) onTrackDone(res, i + 1, allTracks.length);
      } catch (err) {
        console.error(`[Downloader] Error downloading playlist track:`, err);
      }
    }

    return {
      success: true,
      playlistTitle: safePlaylistTitle,
      folderPath: playlistDir,
      downloadedCount: results.length,
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
