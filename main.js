const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const crypto = require('crypto');

// Подключаем Discord
let DiscordRPC;
try { DiscordRPC = require('discord-rpc'); } catch (e) { console.log("Discord RPC module not found"); }

require('events').EventEmitter.defaultMaxListeners = 50;

let mainWindow;
let currentUserUid = null;
let rpcClient = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, height: 800,
    frame: false, transparent: false, backgroundColor: '#0a0a0c',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, webSecurity: false
    }
  });
  mainWindow.loadURL('http://localhost:5173');
}

// === DISCORD RPC ===
// !!! ВСТАВЬ СЮДА СВОЙ НАСТОЯЩИЙ CLIENT ID ИЗ DISCORD DEVELOPER PORTAL !!!
const clientId = '1451704699173470382'; 

ipcMain.handle('set-discord-status', async (event, payload) => {
    // payload - это объект { track, isPlaying }
    if (!DiscordRPC) return;

    try {
        const { track, isPlaying } = payload || {};

        if (!rpcClient) {
            rpcClient = new DiscordRPC.Client({ transport: 'ipc' });
            await rpcClient.login({ clientId }).catch(() => { rpcClient = null; });
        }

        if (!rpcClient) return;

        if (!track) {
            await rpcClient.clearActivity().catch(() => {});
            return;
        }

        // === ДЕБАГ ===
        // Если снова undefined - посмотри, что выведет эта строка в терминале
        // console.log("Пришел трек:", JSON.stringify(track));

        console.log(`[Discord] ${track.artist} - ${track.title}`);

        let details = (track.title && String(track.title).trim()) ? String(track.title) : 'Трек';
        let state = (track.artist && String(track.artist).trim()) ? String(track.artist) : 'Исполнитель';

        if (details.length < 2) details += " ";
        if (state.length < 2) state += " ";

        await rpcClient.setActivity({
            details: details.substring(0, 127),
            state: state.substring(0, 127),
            //largeImageKey: 'YAMU_Player_logo', // Должно совпадать с именем в Discord Assets
            //largeImageText: 'YAMU Player',
            smallImageKey: isPlaying ? 'play' : 'pause',
            smallImageText: isPlaying ? 'Playing' : 'Paused',
            instance: false,
        });

    } catch (e) {
        // console.error("RPC Error:", e.message);
        rpcClient = null;
    }
});

// === СЕТЬ ===
const getHeaders = (cookieString) => ({
  'Cookie': cookieString,
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://music.yandex.ru/',
  'X-Retpath-Y': 'https://music.yandex.ru',
  'X-Current-UID': currentUserUid || '',
});

async function getCookies() {
    try {
        const cookies = await session.defaultSession.cookies.get({ url: 'https://music.yandex.ru' });
        return cookies.map(c => `${c.name}=${c.value}`).join('; ');
    } catch { return ""; }
}

// === API ===
ipcMain.handle('login-yandex', async () => {
  return new Promise((resolve) => {
    const authWindow = new BrowserWindow({ width: 600, height: 800, parent: mainWindow, modal: true, autoHideMenuBar: true });
    authWindow.loadURL('https://passport.yandex.ru/auth?retpath=https%3A%2F%2Fmusic.yandex.ru');
    const check = async () => {
      if (authWindow.isDestroyed()) return;
      if (authWindow.webContents.getURL().includes('music.yandex.ru')) {
        const cookies = await session.defaultSession.cookies.get({ url: 'https://music.yandex.ru' });
        if (cookies.find(c => c.name === 'Session_id')) {
          authWindow.close();
          resolve({ status: 'success' });
        }
      }
    };
    authWindow.webContents.on('did-navigate', check);
    authWindow.webContents.on('did-navigate-in-page', check);
  });
});

ipcMain.handle('get-user-data', async () => {
  try {
    const cookieString = await getCookies();
    const response = await fetch(`https://music.yandex.ru/handlers/auth.jsx?__t=${Date.now()}`, { headers: getHeaders(cookieString) });
    const data = await response.json();
    if (data.user && data.user.uid) currentUserUid = data.user.uid;
    return { name: data.user.name || data.user.login, login: data.user.login };
  } catch (e) { return { error: e.message }; }
});

ipcMain.handle('get-likes', async (event, login) => {
  try {
    const cookieString = await getCookies();
    const response = await fetch(`https://music.yandex.ru/handlers/playlist.jsx?owner=${login}&kinds=3`, { headers: getHeaders(cookieString) });
    const data = await response.json();
    return (data.playlist ? data.playlist.tracks : []).map(mapTrack).filter(t => t && t.id);
  } catch (e) { return []; }
});

ipcMain.handle('get-playlists', async (event, login) => {
  try {
    const cookieString = await getCookies();
    const response = await fetch(`https://music.yandex.ru/handlers/library.jsx?owner=${login}&filter=playlists`, { headers: getHeaders(cookieString) });
    const data = await response.json();
    return data.playlists.map(p => {
        let coverUrl = null;
        if (p.cover && p.cover.itemsUri && p.cover.itemsUri.length > 0) coverUrl = `https://${p.cover.itemsUri[0].replace('%%', '200x200')}`;
        else if (p.cover && p.cover.uri) coverUrl = `https://${p.cover.uri.replace('%%', '200x200')}`;
        return { id: p.kind, title: p.title, count: p.trackCount, cover: coverUrl };
    }).filter(p => p);
  } catch (e) { return []; }
});

ipcMain.handle('get-playlist-tracks', async (event, { login, kind }) => {
  try {
    const cookieString = await getCookies();
    const response = await fetch(`https://music.yandex.ru/handlers/playlist.jsx?owner=${login}&kinds=${kind}`, { headers: getHeaders(cookieString) });
    const data = await response.json();
    return (data.playlist ? data.playlist.tracks : []).map(mapTrack).filter(t => t && t.id);
  } catch (e) { return []; }
});

ipcMain.handle('get-chart', async () => {
  try {
    const cookieString = await getCookies();
    const response = await fetch(`https://music.yandex.ru/handlers/main.jsx?what=chart`, { headers: getHeaders(cookieString) });
    const data = await response.json();
    const tracks = data.chart ? data.chart.tracks : [];
    return tracks.map(t => mapTrack(t.track)).filter(t => t && t.id);
  } catch (e) { return []; }
});

ipcMain.handle('get-rotor', async () => {
  try {
    const cookieString = await getCookies();
    const url = `https://music.yandex.ru/handlers/main.jsx?what=feed`;
    const response = await fetch(url, { headers: getHeaders(cookieString) });
    const data = await response.json();
    if (data.days) {
        for (const day of data.days) {
            if (!day.events) continue;
            for (const event of day.events) {
                if (event.type === 'personal-playlists' && event.tracks && event.tracks.length > 0) return event.tracks.map(mapTrack).filter(t => t && t.id);
                if (event.type === 'tracks' && event.tracks && event.tracks.length > 0) return event.tracks.map(mapTrack).filter(t => t && t.id);
            }
        }
    }
    const chartRes = await fetch(`https://music.yandex.ru/handlers/main.jsx?what=chart`, { headers: getHeaders(cookieString) });
    const chartData = await chartRes.json();
    return chartData.chart.tracks.map(t => mapTrack(t.track)).filter(t => t && t.id);
  } catch (e) { return []; }
});

ipcMain.handle('search', async (event, query) => {
  try {
    const cookieString = await getCookies();
    const url = `https://music.yandex.ru/handlers/music-search.jsx?text=${encodeURIComponent(query)}&type=tracks&lang=ru`;
    const response = await fetch(url, { headers: getHeaders(cookieString) });
    const data = await response.json();
    return (data.tracks ? data.tracks.items : []).map(mapTrack).filter(t => t && t.id);
  } catch (e) { return []; }
});

ipcMain.handle('get-track-url', async (event, { trackId, hq }) => {
  try {
    const cookieString = await getCookies();
    const hqParam = hq ? 1 : 0;
    const infoRes = await fetch(`https://music.yandex.ru/api/v2.1/handlers/track/${trackId}/web-album_track-track-track-main/download/m?hq=${hqParam}`, { headers: getHeaders(cookieString) });
    const infoData = await infoRes.json();
    const storageUrl = infoData.src.startsWith('//') ? 'https:' + infoData.src : infoData.src;
    const srcRes = await fetch(storageUrl + '&format=json');
    const srcData = await srcRes.json();
    const hash = crypto.createHash('md5').update('XGRlBW9FXlekgbPrRHuSiA' + srcData.path.substr(1) + srcData.s).digest('hex');
    return `https://${srcData.host}/get-mp3/${hash}/${srcData.ts}/${srcData.path}`;
  } catch (e) { return null; }
});

ipcMain.handle('window-control', (event, action) => {
    if (action === 'close') mainWindow.close();
    if (action === 'minimize') mainWindow.minimize();
    if (action === 'maximize') {
        if (mainWindow.isMaximized()) mainWindow.unmaximize();
        else mainWindow.maximize();
    }
});

ipcMain.handle('clear-cache', async () => {
    await session.defaultSession.clearCache();
    return true;
});

function mapTrack(t) {
    if (!t || !t.id) return null;

    let title = t.title;
    if (t.version) title += ` (${t.version})`;

    let artists = [];
    if (Array.isArray(t.artists) && t.artists.length > 0) {
        artists = t.artists.map(a => a.name);
    } else if (t.artists && t.artists.name) {
        artists = [t.artists.name];
    } else if (t.albums && Array.isArray(t.albums) && t.albums[0] && t.albums[0].artists) {
        artists = t.albums[0].artists.map(a => a.name);
    } else if (t.channel) {
        artists = [t.channel];
    }

    const artistString = artists.length > 0 ? artists.join(', ') : "Яндекс Музыка";

    return {
      id: t.id, 
      title: title, 
      duration: t.durationMs,
      artist: artistString, 
      cover: t.coverUri ? `https://${t.coverUri.replace('%%', '200x200')}` : null
    };
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });