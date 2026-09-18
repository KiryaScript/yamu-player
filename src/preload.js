'use strict';
const node_fs = require('node:fs');
const node_path = require('node:path');
const electron = require('electron');
var IpcChannel = /* @__PURE__ */ ((IpcChannel2) => {
  IpcChannel2["BOOTSTRAP"] = "desktop:bootstrap";
  IpcChannel2["WINDOW_MINIMIZE"] = "desktop:window:minimize";
  IpcChannel2["WINDOW_MAXIMIZE"] = "desktop:window:maximize";
  IpcChannel2["WINDOW_CLOSE"] = "desktop:window:close";
  IpcChannel2["COMMON_WINDOW_CLOSE"] = "desktop:common:window:close";
  IpcChannel2["INSTALL_UPDATE"] = "desktop:application:install-update";
  IpcChannel2["APPLICATION_READY"] = "desktop:application:ready";
  IpcChannel2["APPLICATION_THEME"] = "desktop:application:theme";
  IpcChannel2["AUTH_DIAGNOSTIC"] = "desktop:authorization:diagnostic";
  IpcChannel2["GET_PASSPORT_LOGIN"] = "desktop:authorization:get-passport-login";
  IpcChannel2["GET_YANDEX_UID"] = "desktop:authorization:get-yandex-uid";
  IpcChannel2["UPDATE_AVAILABLE"] = "desktop:application:update-available";
  IpcChannel2["REFRESH_APPLICATION_DATA"] = "desktop:application:refresh-data";
  IpcChannel2["FIRST_LAUNCH"] = "desktop:application:first-launch";
  IpcChannel2["PROBABILITY_BUCKET"] = "desktop:application:probability-bucket";
  IpcChannel2["LOAD_RELEASE_NOTES"] = "desktop:application:load-release-notes";
  IpcChannel2["PLAYER_STATE"] = "desktop:player:state";
  IpcChannel2["PLAYER_ACTION"] = "desktop:player:action";
  IpcChannel2["OPEN_DEEPLINK"] = "desktop:navigation:open-deeplink";
  IpcChannel2["TRACKS_AVAILABILITY_UPDATED"] = "desktop:offline:tracks-availability-updated";
  IpcChannel2["REPOSITORY_META_UPDATED"] = "desktop:offline:repository-meta-updated";
  IpcChannel2["REFRESH_TRACKS_AVAILABILITY"] = "desktop:offline:refresh-tracks-availability";
  IpcChannel2["REFRESH_REPOSITORY_META"] = "desktop:offline:refresh-repository-meta";
  IpcChannel2["SAVE_PNG_IMAGE_TO_LOCAL_DISK"] = "desktop:files:save-png";
  return IpcChannel2;
})(IpcChannel || {});var RendererTrustProfile = /* @__PURE__ */ ((RendererTrustProfile2) => {
  RendererTrustProfile2["APPLICATION"] = "application";
  RendererTrustProfile2["AUTH"] = "auth";
  RendererTrustProfile2["UNTRUSTED"] = "untrusted";
  return RendererTrustProfile2;
})(RendererTrustProfile || {});var StorageKeys = /* @__PURE__ */ ((StorageKeys2) => {
  StorageKeys2["Theme"] = "theme";
  return StorageKeys2;
})(StorageKeys || {});var Theme = /* @__PURE__ */ ((Theme2) => {
  Theme2["Dark"] = "dark";
  Theme2["Light"] = "light";
  return Theme2;
})(Theme || {});const getLocalStorageTheme = () => {
  const item = window.localStorage.getItem(StorageKeys.Theme);
  if (!item) {
    return null;
  }
  try {
    const value = JSON.parse(item)?.value;
    if (value && typeof value === "string" && Object.values(Theme).includes(value)) {
      return value;
    }
  } catch {
  }
  return null;
};
const getSystemTheme = () => {
  const media = window.matchMedia(`(prefers-color-scheme: light)`);
  return media.matches ? Theme.Light : Theme.Dark;
};
const getInitialTheme = () => {
  const theme = getLocalStorageTheme();
  switch (theme) {
    case Theme.Dark:
    case Theme.Light:
      return theme;
    default:
      return getSystemTheme();
  }
};/** Причины, по которым URL не прошёл настроенную политику. */
var UrlPolicyRejectionReason;
(function (UrlPolicyRejectionReason) {
    UrlPolicyRejectionReason["INVALID_URL"] = "invalid-url";
    UrlPolicyRejectionReason["DISALLOWED_PROTOCOL"] = "disallowed-protocol";
    UrlPolicyRejectionReason["CREDENTIALS_NOT_ALLOWED"] = "credentials-not-allowed";
})(UrlPolicyRejectionReason || (UrlPolicyRejectionReason = {}));/**
 * Разбирает URL и применяет политику, настроенную в месте целевого действия.
 *
 * Функция использует WHATWG URL, поэтому нормализация регистра протокола и
 * управляющих ASCII-символов совпадает с поведением браузера и Electron.
 * Исходная строка не возвращается при отказе, чтобы случайно не записать в лог
 * credentials, query-параметры или fragment.
 */
const resolveUrlByPolicy = (value, config) => {
    let url;
    try {
        url = typeof config.baseUrl === 'undefined' ? new URL(value) : new URL(value, config.baseUrl);
    }
    catch {
        return {
            isAllowed: false,
            reason: UrlPolicyRejectionReason.INVALID_URL,
        };
    }
    if (!config.allowedProtocols.has(url.protocol)) {
        return {
            isAllowed: false,
            reason: UrlPolicyRejectionReason.DISALLOWED_PROTOCOL,
        };
    }
    if (!config.allowCredentials && (url.username !== '' || url.password !== '')) {
        return {
            isAllowed: false,
            reason: UrlPolicyRejectionReason.CREDENTIALS_NOT_ALLOWED,
        };
    }
    return {
        isAllowed: true,
        url,
    };
};/** Стандартные URL-протоколы, которые могут использовать локальные политики потребителей. */
var UrlProtocol;
(function (UrlProtocol) {
    UrlProtocol["HTTP"] = "http:";
    UrlProtocol["HTTPS"] = "https:";
    UrlProtocol["MAILTO"] = "mailto:";
    UrlProtocol["TEL"] = "tel:";
})(UrlProtocol || (UrlProtocol = {}));const appConfig={appProtocol:"music-application",appHostname:"desktop"};const config = {
  app: appConfig};const DESKTOP_APPLICATION_URL = `${config.app.appProtocol}://${config.app.appHostname}`;
const DESKTOP_APPLICATION_PROTOCOL = new URL(DESKTOP_APPLICATION_URL).protocol;const SUPPORTED_TLDS = ["ru", "com", "kz", "by", "uz"];const TLD_PATTERN = `(?:${SUPPORTED_TLDS.join("|")})`;
const isApplicationHostname = (hostname) => {
  return hostname === config.app.appHostname;
};
const oAuthHostnamePattern = new RegExp(`^oauth\\.yandex\\.${TLD_PATTERN}$`);
const passportYandexHostnamePattern = new RegExp(`^passport\\.yandex\\.${TLD_PATTERN}$`);
const ssoPassportYandexHostnamePattern = new RegExp(
  `^sso\\.passport\\.yandex\\.${TLD_PATTERN}$`
);
const ssoPassportYaHostnamePattern = new RegExp(`^sso\\.ya\\.${TLD_PATTERN}$`);
const AUTH_HOSTNAME_PATTERNS = [
  oAuthHostnamePattern,
  passportYandexHostnamePattern,
  ssoPassportYandexHostnamePattern,
  ssoPassportYaHostnamePattern
];const RENDERER_URL_POLICY = {
  allowedProtocols: /* @__PURE__ */ new Set([DESKTOP_APPLICATION_PROTOCOL, UrlProtocol.HTTPS])
};
const classifyRendererUrl = (rawUrl) => {
  const result = resolveUrlByPolicy(rawUrl, RENDERER_URL_POLICY);
  if (!result.isAllowed || result.url.port !== "") {
    return RendererTrustProfile.UNTRUSTED;
  }
  const { url } = result;
  if (url.protocol === DESKTOP_APPLICATION_PROTOCOL && isApplicationHostname(url.hostname)) {
    return RendererTrustProfile.APPLICATION;
  }
  if (url.protocol === UrlProtocol.HTTPS && AUTH_HOSTNAME_PATTERNS.some((pattern) => pattern.test(url.hostname))) {
    return RendererTrustProfile.AUTH;
  }
  return RendererTrustProfile.UNTRUSTED;
};const isRecord = (value) => {
  return typeof value === "object" && value !== null;
};const isDesktopRuntimeInfo = (value) => {
  if (!isRecord(value) || !isRecord(value.deviceInfo)) {
    return false;
  }
  const { deviceInfo } = value;
  return typeof value.version === "string" && typeof value.branch === "string" && (value.platform === "darwin" || value.platform === "win32" || value.platform === "linux") && typeof value.deviceHostname === "string" && typeof deviceInfo.manufacturer === "string" && typeof deviceInfo.model === "string" && typeof deviceInfo.uuid === "string" && typeof deviceInfo.os === "string" && typeof deviceInfo.os_version === "string" && typeof deviceInfo.device_id === "string" && typeof deviceInfo.clid === "number";
};const subscribe = (channel, listener) => {
  const wrappedListener = (_event, ...args) => {
    listener(...args);
  };
  electron.ipcRenderer.on(channel, wrappedListener);
  return () => {
    electron.ipcRenderer.removeListener(channel, wrappedListener);
  };
};
const createMusicDesktopBridge = (runtime) => ({
  runtime,
  window: {
    minimize: () => electron.ipcRenderer.send(IpcChannel.WINDOW_MINIMIZE),
    maximize: () => electron.ipcRenderer.send(IpcChannel.WINDOW_MAXIMIZE),
    close: () => electron.ipcRenderer.send(IpcChannel.WINDOW_CLOSE)
  },
  app: {
    ready: (language) => electron.ipcRenderer.send(IpcChannel.APPLICATION_READY, language),
    setTheme: (theme) => electron.ipcRenderer.send(IpcChannel.APPLICATION_THEME, theme),
    installUpdate: () => electron.ipcRenderer.send(IpcChannel.INSTALL_UPDATE),
    onUpdateAvailable: (listener) => subscribe(IpcChannel.UPDATE_AVAILABLE, listener),
    onRefreshData: (listener) => subscribe(IpcChannel.REFRESH_APPLICATION_DATA, listener),
    onFirstLaunch: (listener) => subscribe(IpcChannel.FIRST_LAUNCH, listener),
    onProbabilityBucket: (listener) => subscribe(IpcChannel.PROBABILITY_BUCKET, listener),
    onLoadReleaseNotes: (listener) => subscribe(IpcChannel.LOAD_RELEASE_NOTES, listener)
  },
  authorization: {
    getPassportLogin: () => electron.ipcRenderer.invoke(IpcChannel.GET_PASSPORT_LOGIN),
    getYandexUid: () => electron.ipcRenderer.invoke(IpcChannel.GET_YANDEX_UID),
    reportDiagnostic: (payload) => electron.ipcRenderer.send(IpcChannel.AUTH_DIAGNOSTIC, payload)
  },
  player: {
    reportState: (state) => electron.ipcRenderer.send(IpcChannel.PLAYER_STATE, state),
    onAction: (listener) => subscribe(IpcChannel.PLAYER_ACTION, listener)
  },
  navigation: {
    onOpenDeeplink: (listener) => subscribe(IpcChannel.OPEN_DEEPLINK, listener)
  },
  offline: {
    notifyTracksAvailabilityUpdated: () => electron.ipcRenderer.send(IpcChannel.TRACKS_AVAILABILITY_UPDATED),
    notifyRepositoryMetaUpdated: () => electron.ipcRenderer.send(IpcChannel.REPOSITORY_META_UPDATED),
    onRefreshTracksAvailability: (listener) => subscribe(IpcChannel.REFRESH_TRACKS_AVAILABILITY, listener),
    onRefreshRepositoryMeta: (listener) => subscribe(IpcChannel.REFRESH_REPOSITORY_META, listener)
  },
  files: {
    savePng: (defaultPath, buffer) => electron.ipcRenderer.send(IpcChannel.SAVE_PNG_IMAGE_TO_LOCAL_DISK, { defaultPath, buffer })
  }
});
const exposeYandexModBridge = () => {
  electron.contextBridge.exposeInMainWorld("yandexMod", {
    getSettings: () => electron.ipcRenderer.invoke('mod:get-settings'),
    saveSettings: (s) => electron.ipcRenderer.invoke('mod:save-settings', s),
    selectFolder: () => electron.ipcRenderer.invoke('mod:select-download-folder'),
    openFolder: () => electron.ipcRenderer.invoke('mod:open-download-folder'),
    downloadTrack: (track) => electron.ipcRenderer.invoke('mod:download-track', track),
    downloadAlbum: (albumId) => electron.ipcRenderer.invoke('mod:download-album', albumId),
    downloadPlaylist: (playlistData) => electron.ipcRenderer.invoke('mod:download-playlist', playlistData),
    cancelDownload: () => electron.ipcRenderer.invoke('mod:cancel-download'),
    getInstallType: () => electron.ipcRenderer.invoke('mod:get-install-type'),
    exportBackup: (format, clientTracks) => electron.ipcRenderer.invoke('mod:export-backup', format, clientTracks),
    exportPlaylist: (playlistData, format) => electron.ipcRenderer.invoke('mod:export-playlist', playlistData, format),
    getUserPlaylists: () => electron.ipcRenderer.invoke('mod:get-user-playlists'),
    createPlaylist: (title) => electron.ipcRenderer.invoke('mod:create-playlist', title),
    getCurrentUser: () => electron.ipcRenderer.invoke('mod:get-current-user'),
    restoreBackup: (options) => electron.ipcRenderer.invoke('mod:restore-backup', options),
    getBackupCount: () => electron.ipcRenderer.invoke('mod:get-backup-count'),
    toggleDevTools: () => electron.ipcRenderer.invoke('mod:toggle-devtools'),
    updatePlayerState: (state) => electron.ipcRenderer.send('mod:update-player-state', state),
    
    onTogglePanel: (cb) => {
      const handler = () => cb();
      electron.ipcRenderer.on('mod:toggle-panel', handler);
      return () => electron.ipcRenderer.removeListener('mod:toggle-panel', handler);
    },
    onQuickDownload: (cb) => {
      const handler = () => cb();
      electron.ipcRenderer.on('mod:quick-download', handler);
      return () => electron.ipcRenderer.removeListener('mod:quick-download', handler);
    },
    onDownloadProgress: (cb) => {
      const handler = (_, p) => cb(p);
      electron.ipcRenderer.on('mod:download-progress', handler);
      return () => electron.ipcRenderer.removeListener('mod:download-progress', handler);
    },
    onDownloadCompleted: (cb) => {
      const handler = (_, r) => cb(r);
      electron.ipcRenderer.on('mod:download-completed', handler);
      return () => electron.ipcRenderer.removeListener('mod:download-completed', handler);
    },
    onRestoreProgress: (cb) => {
      const handler = (_, r) => cb(r);
      electron.ipcRenderer.on('mod:restore-progress', handler);
      return () => electron.ipcRenderer.removeListener('mod:restore-progress', handler);
    },
    onDownloadError: (cb) => {
      const handler = (_, e) => cb(e);
      electron.ipcRenderer.on('mod:download-error', handler);
      return () => electron.ipcRenderer.removeListener('mod:download-error', handler);
    }
  });

  window.document.addEventListener("DOMContentLoaded", () => {
    try {
      const cssPath = node_path.join(__dirname, 'mod', 'client.css');
      if (node_fs.existsSync(cssPath)) {
        const cssContent = node_fs.readFileSync(cssPath, 'utf8');
        const styleEl = document.createElement('style');
        styleEl.id = 'ym-mod-injected-styles';
        styleEl.textContent = cssContent;
        document.head.appendChild(styleEl);
      }

      const jsPath = node_path.join(__dirname, 'mod', 'client.js');
      if (node_fs.existsSync(jsPath)) {
        const jsContent = node_fs.readFileSync(jsPath, 'utf8');
        const scriptEl = document.createElement('script');
        scriptEl.id = 'ym-mod-injected-script';
        scriptEl.textContent = jsContent;
        document.body.appendChild(scriptEl);
      }
    } catch (err) {
      console.error('[Preload] Failed to inject Mod client:', err);
    }
  });
};

const installApplicationMod = () => {
  // 1. Audio element tracker
  try {
    window.__ymActiveAudio = null;
    const origPlay = HTMLMediaElement.prototype.play;
    if (origPlay) {
      HTMLMediaElement.prototype.play = function(...args) {
        window.__ymActiveAudio = this;
        return origPlay.apply(this, args);
      };
    }
    const origCreateEl = document.createElement.bind(document);
    document.createElement = function(tagName, options) {
      const el = origCreateEl(tagName, options);
      if (tagName && String(tagName).toLowerCase() === 'audio') {
        window.__ymActiveAudio = el;
        el.addEventListener('play', () => { window.__ymActiveAudio = el; });
        el.addEventListener('playing', () => { window.__ymActiveAudio = el; });
      }
      return el;
    };
  } catch (e) {}

  // 2. Yandex Plus Unlocker (Strictly for music application, NEVER for passport / auth)
  try {
    const isAccountStatusUrl = (u) => {
      if (!u || typeof u !== 'string') return false;
      if (u.includes('passport.yandex') || u.includes('oauth.yandex') || u.includes('/auth/')) return false;
      return u.includes('/account/status') || u.includes('/api/v2.1/account/status');
    };

    const plusAccountData = {
      serviceAvailable: true,
      hasSubscription: true,
      hasPlus: true,
      plus: { hasPlus: true, isAvailable: true, isTutorialCompleted: true },
      subeditor: false,
      subeditorLevel: 0
    };

    const plusPermissions = {
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

        if (isAccountStatusUrl(url)) {
          try {
            const clone = res.clone();
            const json = await clone.json();
            if (json && json.result) {
              json.result.account = { ...(json.result.account || {}), ...plusAccountData };
              json.result.permissions = plusPermissions;
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

    const origOpen = window.XMLHttpRequest.prototype.open;
    const origSend = window.XMLHttpRequest.prototype.send;
    window.XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      this._url = url;
      return origOpen.apply(this, [method, url, ...rest]);
    };
    window.XMLHttpRequest.prototype.send = function(...sendArgs) {
      if (isAccountStatusUrl(this._url)) {
        this.addEventListener('readystatechange', () => {
          if (this.readyState === 4 && this.status === 200) {
            try {
              const data = JSON.parse(this.responseText);
              if (data && data.result) {
                data.result.account = { ...(data.result.account || {}), ...plusAccountData };
                data.result.permissions = plusPermissions;
                data.result.plus = { hasPlus: true, isAvailable: true, isTutorialCompleted: true };
                Object.defineProperty(this, 'responseText', { value: JSON.stringify(data) });
                Object.defineProperty(this, 'response', { value: JSON.stringify(data) });
              }
            } catch (e) {}
          }
        });
      }
      return origSend.apply(this, sendArgs);
    };
  } catch (err) {
    console.warn('[PlusUnlock] Failed to install network hooks:', err);
  }
};

const exposeApplicationBridge = () => {
  const runtimeInfo = electron.ipcRenderer.sendSync(IpcChannel.BOOTSTRAP);
  if (!isDesktopRuntimeInfo(runtimeInfo)) {
    return;
  }
  installApplicationMod();
  electron.contextBridge.exposeInMainWorld("musicDesktop", createMusicDesktopBridge(runtimeInfo));
  exposeYandexModBridge();
  window.document.addEventListener("DOMContentLoaded", () => {
    const theme = getInitialTheme();
    window.document.documentElement.style.backgroundColor = theme === Theme.Light ? "#FFFFFF" : "#000000";
  });
};
const exposeCommonBridge = () => {
  const bridge = {
    window: {
      close: () => electron.ipcRenderer.send(IpcChannel.COMMON_WINDOW_CLOSE)
    }
  };
  electron.contextBridge.exposeInMainWorld("musicDesktopCommon", bridge);
};
const exposeBridge = () => {
  if (window !== window.top) {
    return;
  }
  const profile = classifyRendererUrl(window.location.href);
  if (profile === RendererTrustProfile.APPLICATION) {
    exposeApplicationBridge();
  }
  if (profile === RendererTrustProfile.AUTH) {
    exposeCommonBridge();
  }
};
exposeBridge();