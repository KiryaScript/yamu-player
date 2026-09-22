const electron = require('electron');
const path = require('path');
const fs = require('fs');
const settingsManager = require('./settings');
const downloader = require('./downloader');
const discordRpc = require('./discord');
const libraryBackup = require('./library_backup');

function initMod(mainWindow) {
  console.log('[YandexMusicMod] Initializing Enhanced Mod Engine v2.5...');

  // 1. Block Telemetry & Stream Log Trackers (Anti-Ban / Privacy with Whitelist)
  try {
    const blockedPatterns = [
      '*://log.strm.yandex.ru/*',
      '*://metrika.yandex.ru/*',
      '*://*.metrika.yandex.ru/*',
      '*://mc.yandex.ru/*',
      '*://*.mc.yandex.ru/*',
      '*://an.yandex.ru/*',
      '*://*.an.yandex.ru/*',
      '*://clck.yandex.ru/*',
      '*://yandex.ru/clck/*'
    ];

    electron.session.defaultSession.webRequest.onBeforeRequest(
      { urls: blockedPatterns },
      (details, callback) => {
        const url = details.url || '';
        const initiator = details.initiator || '';
        const referrer = details.referrer || '';
        
        // CRITICAL ANTI-BAN WHITELIST: NEVER block any passport, login, oauth, sso, or captcha requests!
        if (
          initiator.includes('passport.yandex') ||
          initiator.includes('oauth.yandex') ||
          initiator.includes('sso.passport') ||
          initiator.includes('captcha') ||
          url.includes('passport.yandex') ||
          url.includes('oauth.yandex') ||
          url.includes('smartcaptcha') ||
          referrer.includes('passport.yandex') ||
          referrer.includes('oauth.yandex')
        ) {
          callback({});
          return;
        }
        // Block tracking, analytics and stream logs
        callback({ cancel: true });
      }
    );
    console.log('[YandexMusicMod] Telemetry & log.strm.yandex.ru blocker activated (Anti-Ban Whitelist active).');
  } catch (err) {
    console.warn('[YandexMusicMod] Failed to attach webRequest blocker:', err);
  }

  // 1.1 Dynamic User Account Cache (Prevents Session Desync & Ghost Session Bans)
  let currentUserAccountCache = null;

  async function extractUserAccountFromCookies() {
    try {
      const cookiesRu = await electron.session.defaultSession.cookies.get({ domain: '.yandex.ru' });
      const cookiesCom = await electron.session.defaultSession.cookies.get({ domain: '.yandex.com' });
      const allCookies = cookiesRu.concat(cookiesCom);
      let uid = null;
      let login = null;
      let displayName = null;

      for (const c of allCookies) {
        if (c.name === 'Session_id' && c.value) {
          const m = c.value.match(/\|(\d{6,12})\./);
          if (m) uid = m[1];
        }
        if (c.name === 'yandex_login' && c.value) {
          login = c.value;
        }
        if (c.name === 'yp' && c.value) {
          const m = c.value.match(/udn\.([^#]+)/);
          if (m) {
            try {
              displayName = Buffer.from(m[1], 'base64').toString('utf8');
            } catch (err) {}
          }
        }
      }

      if (uid) {
        currentUserAccountCache = {
          uid: Number(uid),
          login: login || 'user',
          displayName: displayName || login || 'Пользователь',
          hasPlus: true,
          options: ['plus']
        };
        console.log(`[YandexMusicMod] Active session: UID=${uid}, Name=${currentUserAccountCache.displayName}`);
      } else {
        currentUserAccountCache = null;
      }
    } catch (e) {
      console.warn('[YandexMusicMod] Error extracting user account:', e);
    }
    return currentUserAccountCache;
  }

  try {
    electron.session.defaultSession.cookies.on('changed', () => {
      extractUserAccountFromCookies().catch(() => {});
    });
  } catch (e) {}
  extractUserAccountFromCookies().catch(() => {});

  electron.ipcMain.on('mod:get-user-account-sync', (event) => {
    event.returnValue = currentUserAccountCache;
  });

  electron.ipcMain.handle('mod:get-user-account', async () => {
    return await extractUserAccountFromCookies();
  });

  // 2. Start Discord RPC
  if (settingsManager.get('discordRpcEnabled')) {
    discordRpc.start();
  }

  // 3. Shortcuts and Window Events
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.type === 'keyDown') {
        // F12 or Ctrl+Shift+I for DevTools
        if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
          if (settingsManager.get('enableDevTools')) {
            mainWindow.webContents.toggleDevTools();
            event.preventDefault();
          }
        }
        // Ctrl+M or F2 for Mod Settings
        if ((input.control && input.key.toLowerCase() === 'm') || input.key === 'F2') {
          mainWindow.webContents.send('mod:toggle-panel');
          event.preventDefault();
        }
        // Ctrl+D for Quick Download of current track
        if (input.control && input.key.toLowerCase() === 'd') {
          mainWindow.webContents.send('mod:quick-download');
          event.preventDefault();
        }
      }
    });

    mainWindow.on('close', (event) => {
      if (settingsManager.get('closeToTray') && !electron.app.isQuitting) {
        event.preventDefault();
        mainWindow.hide();
      }
    });
  }

  // 4. IPC Handlers: Settings
  electron.ipcMain.handle('mod:get-settings', async () => {
    return settingsManager.getAll();
  });

  electron.ipcMain.handle('mod:save-settings', async (event, newSettings) => {
    try {
      const updated = settingsManager.update(newSettings);
      if (newSettings.discordRpcEnabled !== undefined) {
        if (newSettings.discordRpcEnabled) {
          discordRpc.start();
        } else {
          discordRpc.stop();
        }
      }
      return updated;
    } catch (err) {
      console.error('[Mod] Error saving settings:', err);
      return settingsManager.getAll();
    }
  });

  electron.ipcMain.handle('mod:select-download-folder', async () => {
    try {
      const result = await electron.dialog.showOpenDialog(mainWindow, {
        title: 'Выберите папку для сохранения музыки',
        defaultPath: settingsManager.get('downloadPath'),
        properties: ['openDirectory', 'createDirectory']
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const selected = result.filePaths[0];
        settingsManager.set('downloadPath', selected);
        return selected;
      }
      return null;
    } catch (err) {
      console.error('[Mod] Error selecting folder:', err);
      return null;
    }
  });

  electron.ipcMain.handle('mod:open-download-folder', async () => {
    try {
      const folderPath = settingsManager.get('downloadPath');
      if (fs.existsSync(folderPath)) {
        electron.shell.openPath(folderPath);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[Mod] Error opening folder:', err);
      return false;
    }
  });

  // 5. IPC Handlers: Downloader
  electron.ipcMain.handle('mod:download-track', async (event, trackMeta) => {
    return await downloader.downloadTrack(trackMeta);
  });

  electron.ipcMain.handle('mod:download-album', async (event, albumId) => {
    return await downloader.downloadAlbum(albumId, (progress) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('mod:download-progress', progress);
      }
    });
  });

  electron.ipcMain.handle('mod:download-playlist', async (event, playlistParams) => {
    return await downloader.downloadPlaylist(playlistParams, (progress) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('mod:download-progress', progress);
      }
    });
  });

  electron.ipcMain.handle('mod:cancel-download', () => {
    downloader.cancelDownload();
    return { success: true };
  });

  electron.ipcMain.handle('mod:get-install-type', () => {
    try {
      const exePath = electron.app.getPath('exe').toLowerCase();
      if (exePath.includes('programs\\yandexmusic') || exePath.includes('program files')) {
        return 'patched';
      }
    } catch (e) {}
    return 'standalone';
  });

  // 6. IPC Handlers: Library Backup, Playlist Export & Transfer
  electron.ipcMain.handle('mod:export-backup', async (event, format = 'json', clientTracks = []) => {
    return await libraryBackup.exportBackup(format, clientTracks);
  });

  electron.ipcMain.handle('mod:export-playlist', async (event, playlistData, format = 'json') => {
    return await libraryBackup.exportPlaylist(playlistData, format);
  });

  electron.ipcMain.handle('mod:restore-backup', async (event, options = {}) => {
    const sender = event.sender;
    return await libraryBackup.importAndRestore(sender, options);
  });

  electron.ipcMain.handle('mod:get-user-playlists', async () => {
    return await libraryBackup.getUserPlaylists();
  });

  electron.ipcMain.handle('mod:create-playlist', async (event, title) => {
    const cookieHeader = await libraryBackup.getSessionCookieHeader();
    return await libraryBackup.createPlaylist(title, cookieHeader);
  });

  electron.ipcMain.handle('mod:get-current-user', async () => {
    return await libraryBackup.getCurrentUser();
  });

  electron.ipcMain.handle('mod:get-backup-count', async () => {
    try {
      if (fs.existsSync(libraryBackup.autoBackupFile)) {
        const data = JSON.parse(fs.readFileSync(libraryBackup.autoBackupFile, 'utf8'));
        return { count: data.count || (data.tracks ? data.tracks.length : 0), updatedAt: data.updatedAt };
      }
    } catch (e) {}
    return { count: 0, updatedAt: null };
  });

  // 7. IPC Handlers: Player State for Discord RPC (With Debounce & Native Asset)
  let lastRpcState = {
    trackId: null,
    isPlaying: false,
    startTimestamp: 0,
    endTimestamp: 0,
    lastSentTime: 0
  };

  electron.ipcMain.on('mod:update-player-state', (event, state) => {
    if (!settingsManager.get('discordRpcEnabled')) return;

    if (!state || !state.isPlaying || !state.track) {
      if (lastRpcState.isPlaying) {
        lastRpcState.isPlaying = false;
        lastRpcState.trackId = null;
        discordRpc.clearActivity();
      }
      return;
    }

    const { track, position = 0, duration = 0 } = state;
    const trackId = String(track.id || track.title);
    const nowMs = Date.now();
    const posSec = Math.max(0, position);
    const durSec = Math.max(0, duration || (track.durationMs ? track.durationMs / 1000 : 0));

    const calculatedStart = Math.floor(nowMs - (posSec * 1000));
    const calculatedEnd = durSec > 0 ? Math.floor(calculatedStart + (durSec * 1000)) : undefined;

    // Debounce: only update if track changed, playback toggled, seeked > 3s, or 60s periodic sync
    const isSameTrack = lastRpcState.trackId === trackId && lastRpcState.isPlaying;
    const expectedCurrentPosSec = (nowMs - lastRpcState.startTimestamp) / 1000;
    const isSeeked = Math.abs(expectedCurrentPosSec - posSec) > 3;
    const isPeriodicResync = (nowMs - lastRpcState.lastSentTime) > 60000;

    if (isSameTrack && !isSeeked && !isPeriodicResync) {
      return;
    }

    lastRpcState.trackId = trackId;
    lastRpcState.isPlaying = true;
    lastRpcState.startTimestamp = calculatedStart;
    lastRpcState.endTimestamp = calculatedEnd;
    lastRpcState.lastSentTime = nowMs;

    const artists = (track.artists || []).map(a => a.name || a).join(', ') || 'Неизвестный исполнитель';
    const title = track.title || 'Без названия';
    const album = track.albums?.[0]?.title || '';

    let coverUrl = 'og-image';
    if (track.coverUri) {
      coverUrl = track.coverUri.startsWith('http') ? track.coverUri : `https://${track.coverUri.replace('%%', '400x400')}`;
    }

    const isSingle = album && album.trim().toLowerCase() === title.trim().toLowerCase();
    const stateText = `от ${artists}` + (album && !isSingle ? ` • ${album}` : '');

    const activityPayload = {
      type: 2,
      details: String(title).slice(0, 128),
      state: String(stateText).slice(0, 128),
      timestamps: {
        start: calculatedStart
      },
      assets: {
        large_image: coverUrl,
        large_text: String(album ? `Альбом: ${album}` : (title || 'Яндекс Музыка')).slice(0, 128),
        small_image: 'og-image',
        small_text: 'Яндекс Музыка'
      }
    };

    if (calculatedEnd && calculatedEnd > calculatedStart) {
      activityPayload.timestamps.end = calculatedEnd;
    }

    if (track.id) {
      activityPayload.buttons = [
        { label: 'Слушать в Яндекс Музыке', url: `https://music.yandex.ru/track/${track.id}` }
      ];
    }

    discordRpc.setActivity(activityPayload);
  });

  console.log('[YandexMusicMod] Enhanced Mod Engine initialized successfully.');
}

module.exports = {
  initMod,
  settings: settingsManager,
  downloader,
  discordRpc,
  libraryBackup
};
