const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const nodeId3 = require('node-id3');
const settingsManager = require('./settings');

let electronSession = null;
try {
  const electron = require('electron');
  electronSession = electron.session;
} catch (e) {}

const YANDEX_MUSIC_SALT = 'XGRprocessCdIxappkg';
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
      const netCookies = await electronSession.defaultSession.cookies.get({ domain: 'yandex.net' });
      const allCookies = [...cookies, ...netCookies];
      return allCookies.map(c => `${c.name}=${c.value}`).join('; ');
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
        'Cookie': cookieHeader,
        ...extraHeaders
      };

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

  calculateDirectUrl(xmlText) {
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

    const signString = YANDEX_MUSIC_SALT + pathVal.substring(1) + s;
    const hash = crypto.createHash('md5').update(signString).digest('hex');

    return `https://${host}/get-mp3/${hash}/${ts}${pathVal}`;
  }

  async searchTrack(title, artist = '') {
    try {
      const query = `${artist} ${title}`.trim();
      const url = `https://api.music.yandex.net/search?text=${encodeURIComponent(query)}&type=track&page=0`;
      const data = await this.fetchJson(url);
      const tracks = data?.result?.tracks?.results;
      if (tracks && tracks.length > 0) {
        return tracks[0];
      }
    } catch (e) {}
    return null;
  }

  async getTrackDownloadUrl(trackId, preferredQuality = 'mp3_320') {
    const infoUrl = `https://api.music.yandex.net/tracks/${trackId}/download-info`;
    const response = await this.fetchJson(infoUrl);
    const sources = response?.result;

    if (!sources || !sources.length) {
      throw new Error(`Не удалось получить источники для трека ID ${trackId}`);
    }

    let chosenSource = null;
    if (preferredQuality === 'flac') {
      chosenSource = sources.find(s => s.codec === 'flac');
    }
    if (!chosenSource) {
      chosenSource = sources.find(s => s.codec === 'mp3' && s.bitrateInKbps === 320);
    }
    if (!chosenSource) {
      chosenSource = sources.find(s => s.codec === 'mp3' && s.bitrateInKbps >= 192);
    }
    if (!chosenSource) {
      chosenSource = sources[0];
    }

    if (chosenSource.direct && chosenSource.downloadInfoUrl) {
      return { url: chosenSource.downloadInfoUrl, codec: chosenSource.codec, bitrate: chosenSource.bitrateInKbps };
    }

    const xml = await this.fetchXml(chosenSource.downloadInfoUrl);
    const directUrl = this.calculateDirectUrl(xml);
    return { url: directUrl, codec: chosenSource.codec, bitrate: chosenSource.bitrateInKbps };
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

    let trackId = trackObj.id || trackObj.trackId;
    let trackMeta = trackObj;

    // Fallback: If track ID is missing, search via title and artist
    if (!trackId && (trackObj.title || trackObj.name)) {
      const titleToSearch = trackObj.title || trackObj.name;
      const artistToSearch = (trackObj.artists || []).map(a => a.name || a).join(' ');
      const searched = await this.searchTrack(titleToSearch, artistToSearch);
      if (searched) {
        trackMeta = searched;
        trackId = searched.id;
      }
    }

    if (!trackId) {
      throw new Error(`Не удалось определить ID трека "${trackObj.title || 'Неизвестный трек'}"`);
    }

    if (!trackMeta.title || !trackMeta.artists || trackMeta.artists.length === 0) {
      const fetched = await this.getTrackMeta(trackId);
      if (fetched) trackMeta = fetched;
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

    const { url: directUrl, codec, bitrate } = await this.getTrackDownloadUrl(trackId, settings.downloadQuality);
    const ext = codec === 'flac' ? 'flac' : 'mp3';
    const filename = `${prefix}${safeArtist} - ${safeTitle}.${ext}`;
    const filePath = path.join(destDir, filename);

    if (!isPathInside(destDir, filePath)) {
      throw new Error('Недопустимый путь сохранения файла');
    }

    const audioBuffer = await new Promise((resolve, reject) => {
      const parsed = new URL(directUrl);
      const client = parsed.protocol === 'https:' ? https : http;
      const req = client.get(directUrl, { timeout: 60000 }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return this.fetchBuffer(res.headers.location).then(resolve).catch(reject);
        }

        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`Ошибка скачивания трека: HTTP ${res.statusCode}`));
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
        reject(new Error('Таймаут скачивания аудиопотока'));
      });
      req.on('error', reject);
    });

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
            const coverUrl = `https://${coverUri.replace('%%', '1000x1000')}`;
            const coverBuffer = await this.fetchBuffer(coverUrl);
            tags.image = {
              mime: 'image/jpeg',
              type: { id: 3, name: 'front cover' },
              description: 'Cover',
              imageBuffer: coverBuffer
            };
          } catch (e) {}
        }

        nodeId3.write(tags, filePath);
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

  async downloadPlaylist(userId, playlistKind, onProgress = null, onTrackDone = null) {
    const settings = settingsManager.getAll();
    let playlistUrl;
    let isLikes = (playlistKind === 'likes' || playlistKind === '3' || userId === 'likes' || !playlistKind);

    if (isLikes) {
      // Likes playlist for current user
      const actualUid = await this.getUserId() || userId || '3';
      playlistUrl = `https://api.music.yandex.net/users/${actualUid}/playlists/3`;
    } else if (playlistKind) {
      playlistUrl = `https://api.music.yandex.net/users/${userId}/playlists/${playlistKind}`;
    } else {
      playlistUrl = `https://api.music.yandex.net/playlists/${userId}`;
    }

    let data;
    try {
      data = await this.fetchJson(playlistUrl);
    } catch (err) {
      // If direct playlist endpoint failed, fallback to likes/tracks
      if (isLikes) {
        const actualUid = await this.getUserId() || '3';
        data = await this.fetchJson(`https://api.music.yandex.net/users/${actualUid}/likes/tracks`);
      } else {
        throw err;
      }
    }

    const playlist = data?.result;
    if (!playlist) {
      throw new Error(`Плейлист не найден`);
    }

    const playlistTitle = sanitizeFilename(playlist.title || 'Мне нравится', 50);
    const playlistDir = path.join(settings.downloadPath, playlistTitle);

    if (!fs.existsSync(playlistDir)) {
      await fsPromises.mkdir(playlistDir, { recursive: true });
    }

    const rawTracks = playlist.tracks || playlist.library?.tracks || [];
    const allTracks = rawTracks.map(t => t.track || t).filter(Boolean);

    const results = [];
    for (let i = 0; i < allTracks.length; i++) {
      const track = allTracks[i];
      const trackNum = String(i + 1).padStart(3, '0');
      try {
        const res = await this.downloadSingleTrack(track, playlistDir, (p) => {
          if (onProgress) {
            onProgress({
              playlistTitle,
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
      playlistTitle,
      folderPath: playlistDir,
      downloadedCount: results.length,
      totalCount: allTracks.length
    };
  }
}

module.exports = new Downloader();
module.exports.sanitizeFilename = sanitizeFilename;
module.exports.isPathInside = isPathInside;
