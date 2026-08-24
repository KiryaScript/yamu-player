'use strict';

// ---------------------------------------------------------
// YANDEX PLUS SUBSCRIPTION UNLOCKER (PRO FEATURES & HQ AUDIO)
// ---------------------------------------------------------
try {
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

      if (url.includes('/account/status') || url.includes('/status')) {
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
    if (this._url && (this._url.includes('/account/status') || this._url.includes('/status'))) {
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

const electron=require('electron'),uuid=require('uuid'),Store=require('electron-store'),node_crypto=require('node:crypto'),node_os=require('node:os');const appConfig={appHostname:"desktop"};const buildInfo={VERSION:"5.116.3",BRANCH:"9514e66969bd27e00a6f2403bbaf4675da866692"};const config = {
  app: appConfig,
  buildInfo};var StorageKeys = /* @__PURE__ */ ((StorageKeys2) => {
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
};const UNIVERSAL_DIGIT_REGEX = /[014589cd]/;
const ZERO_MAC_REGEX = /(?:[0]{1,2}[:-]){5}[0]{1,2}/;
const isGloballyUniqueMacAddress = (mac) => {
  const digit = mac[1];
  if (!digit) {
    return false;
  }
  return UNIVERSAL_DIGIT_REGEX.test(digit.toLowerCase());
};
const getMac = () => {
  for (const config of Object.values(node_os.networkInterfaces())) {
    if (!config) {
      continue;
    }
    for (const iface of config) {
      if (ZERO_MAC_REGEX.test(iface.mac)) {
        continue;
      }
      if (isGloballyUniqueMacAddress(iface.mac)) {
        return iface.mac;
      }
    }
  }
  return;
};
const generateDeviceId = () => {
  const data = [node_os.hostname(), node_os.platform(), node_os.machine(), node_os.totalmem(), getMac()].join();
  return node_crypto.createHash("sha256").update(data).digest("hex");
};var StoreKeys = /* @__PURE__ */ ((StoreKeys2) => {
  StoreKeys2["VERSION"] = "version";
  StoreKeys2["HAS_RECENTLY_LAUNCHED"] = "hasRecentlyLaunched";
  StoreKeys2["UUID"] = "uuid";
  StoreKeys2["DEVICE_ID"] = "deviceId";
  StoreKeys2["DEVICE_SOFTWARE_REVISION"] = "deviceSoftwareRevision";
  StoreKeys2["DEVICE_CPU_REVISION"] = "deviceCpuRevision";
  StoreKeys2["TRACKS_AVAILABILITY_UPDATED_AT"] = "tracksAvailabilityUpdatedAt";
  StoreKeys2["REPOSITORY_META_UPDATED_AT"] = "repositoryMetaUpdatedAt";
  return StoreKeys2;
})(StoreKeys || {});const store = new Store();
const useCachedValue = (key) => {
  let cachedValue = null;
  const get = () => {
    if (cachedValue) {
      return cachedValue;
    }
    cachedValue = store.get(key);
    return cachedValue;
  };
  const set = (value) => {
    cachedValue = value;
    store.set(key, value);
  };
  return [get, set];
};
const getUuid = () => {
  let uuid$1 = store.get(StoreKeys.UUID);
  if (!uuid$1) {
    uuid$1 = uuid.v4();
    store.set(StoreKeys.UUID, uuid$1);
  }
  return uuid$1;
};
const deviceId = useCachedValue(StoreKeys.DEVICE_ID);
const getDeviceId = () => {
  const [get, set] = deviceId;
  let deviceIdValue = get();
  if (deviceIdValue) {
    return String(deviceIdValue);
  }
  deviceIdValue = generateDeviceId();
  set(deviceIdValue);
  return String(deviceIdValue);
};const devicePlatform = node_os.platform();const getDeviceInfo = () => {
  return {
    manufacturer: "",
    model: "",
    uuid: getUuid(),
    os: devicePlatform,
    os_version: "",
    device_id: getDeviceId(),
    clid: 0
  };
};const getDeviceHostname = () => {
  return node_os.hostname().slice(0, 50).trim();
};const isApplicationHostname = (hostname) => {
  return hostname === config.app.appHostname;
};const deviceInfo = getDeviceInfo();
electron.contextBridge.exposeInMainWorld("VERSION", String(config.buildInfo.VERSION));
electron.contextBridge.exposeInMainWorld("BRANCH", String(config.buildInfo.BRANCH));
electron.contextBridge.exposeInMainWorld("PLATFORM", deviceInfo.os);
electron.contextBridge.exposeInMainWorld("DEVICE_INFO", deviceInfo);
electron.contextBridge.exposeInMainWorld("DEVICE_HOSTNAME", getDeviceHostname());
electron.contextBridge.exposeInMainWorld("desktopEvents", {
  send(name, ...args) {
    electron.ipcRenderer.send(name, ...args);
  },
  on(name, listener) {
    electron.ipcRenderer.on(name, listener);
  },
  off(name, listener) {
    electron.ipcRenderer.off(name, listener);
  },
  invoke(name, ...args) {
    return electron.ipcRenderer.invoke(name, ...args);
  }
});

// Mod IPC Bridge
electron.contextBridge.exposeInMainWorld("yandexMod", {
  getSettings: () => electron.ipcRenderer.invoke('mod:get-settings'),
  saveSettings: (s) => electron.ipcRenderer.invoke('mod:save-settings', s),
  selectFolder: () => electron.ipcRenderer.invoke('mod:select-download-folder'),
  openFolder: () => electron.ipcRenderer.invoke('mod:open-download-folder'),
  downloadTrack: (track) => electron.ipcRenderer.invoke('mod:download-track', track),
  downloadAlbum: (albumId) => electron.ipcRenderer.invoke('mod:download-album', albumId),
  downloadPlaylist: (playlistData) => electron.ipcRenderer.invoke('mod:download-playlist', playlistData),
  exportBackup: (format, clientTracks) => electron.ipcRenderer.invoke('mod:export-backup', format, clientTracks),
  restoreBackup: () => electron.ipcRenderer.invoke('mod:restore-backup'),
  getBackupCount: () => electron.ipcRenderer.invoke('mod:get-backup-count'),
  toggleDevTools: () => electron.ipcRenderer.invoke('mod:toggle-devtools'),
  updatePlayerState: (state) => electron.ipcRenderer.send('mod:update-player-state', state),
  
  onTogglePanel: (cb) => {
    const handler = () => cb();
    electron.ipcRenderer.on('mod:toggle-panel', handler);
    return () => electron.ipcRenderer.removeListener('mod:toggle-panel', handler);
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

const node_fs = require('node:fs');
const node_path = require('node:path');

window.document.addEventListener("DOMContentLoaded", () => {
  const theme = getInitialTheme();
  if (isApplicationHostname(window.location.hostname)) {
    window.document.documentElement.style.backgroundColor = theme === Theme.Light ? "#FFFFFF" : "#000000";
  }

  // Inject Mod Styles and Client Script Safely
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