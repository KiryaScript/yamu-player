const electron = require('electron');
const path = require('path');
const fs = require('fs');
const settingsManager = require('./settings');
const downloader = require('./downloader');
const discordRpc = require('./discord');
const libraryBackup = require('./library_backup');

function initMod(mainWindow) {
  console.log('[YandexMusicMod] Initializing Enhanced Mod Engine v2.5...');

  // 1. Block Telemetry & Stream Log Trackers (Anti-Ban / Privacy)
  try {
    const blockedPatterns = [
      '*://log.strm.yandex.ru/*',
      '*://*.strm.yandex.ru/*',
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
        // Block tracking, analytics and stream logs
        callback({ cancel: true });
      }
    );
    console.log('[YandexMusicMod] Telemetry & log.strm.yandex.ru blocker activated.');
  } catch (err) {
    console.warn('[YandexMusicMod] Failed to attach webRequest blocker:', err);
  }

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

  // 7. IPC Handlers: Player State for Discord RPC
  electron.ipcMain.on('mod:update-player-state', (event, state) => {
    if (!settingsManager.get('discordRpcEnabled')) return;

    if (!state || !state.isPlaying || !state.track) {
      discordRpc.clearActivity();
      return;
    }

    const { track, position = 0, duration = 0 } = state;
    const artists = (track.artists || []).map(a => a.name || a).join(', ') || 'Unknown Artist';
    const title = track.title || 'Unknown Title';
    const album = track.albums?.[0]?.title || '';

    const nowMs = Date.now();
    const startTimestamp = Math.floor(nowMs - (position * 1000));
    const endTimestamp = duration > 0 ? Math.floor(startTimestamp + (duration * 1000)) : undefined;

    let coverUrl = 'https://cdn.rcd.gg/PreMiD/websites/Y/Yandex%20Music/assets/logo.png';
    if (track.coverUri) {
      coverUrl = track.coverUri.startsWith('http') ? track.coverUri : `https://${track.coverUri.replace('%%', '400x400')}`;
    }

    const activityPayload = {
      details: String(title).slice(0, 128),
      state: String(`от ${artists}` + (album ? ` • ${album}` : '')).slice(0, 128),
      timestamps: {
        start: startTimestamp
      },
      assets: {
        large_image: coverUrl,
        large_text: String(album || title || 'Яндекс Музыка').slice(0, 128)
      }
    };

    if (endTimestamp && endTimestamp > startTimestamp) {
      activityPayload.timestamps.end = endTimestamp;
    }

    if (track.id) {
      activityPayload.buttons = [
        { label: 'Слушать трек', url: `https://music.yandex.ru/track/${track.id}` }
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
