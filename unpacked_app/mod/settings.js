const fs = require('fs');
const path = require('path');
const os = require('os');
let electron = null;
try {
  electron = require('electron');
} catch (e) {}

const DEFAULT_DOWNLOAD_DIR = path.join(os.homedir(), 'Music', 'YandexMusic');

const defaultSettings = {
  // Volume booster
  volumeBoostEnabled: true,
  volumeBoost: 1.25, // 1.25 = +25% boost (range: 1.0 - 2.0)
  
  // Downloader
  downloadPath: DEFAULT_DOWNLOAD_DIR,
  downloadQuality: 'mp3_320', // 'mp3_320' | 'flac' | 'mp3_192'
  embedCover: true,
  embedTags: true,
  createArtistFolder: false,
  createAlbumFolder: true,
  showTrackListButtons: false,
  
  // Discord Rich Presence
  discordRpcEnabled: true,
  
  // Developer & System
  preventAutoUpdate: true,
  enableDevTools: true,
  oledTheme: false,
  closeToTray: false
};

const ALLOWED_SETTING_KEYS = new Set([
  'volumeBoostEnabled', 'volumeBoost', 'downloadPath', 'downloadQuality',
  'embedCover', 'embedTags', 'createArtistFolder', 'createAlbumFolder',
  'showTrackListButtons', 'discordRpcEnabled', 'preventAutoUpdate',
  'enableDevTools', 'oledTheme', 'closeToTray'
]);

class SettingsManager {
  constructor() {
    let baseDir;
    try {
      baseDir = electron.app ? electron.app.getPath('userData') : path.join(os.homedir(), 'AppData', 'Roaming', 'YandexMusicMod');
    } catch (e) {
      baseDir = path.join(os.homedir(), 'AppData', 'Roaming', 'YandexMusicMod');
    }
    this.configDir = baseDir;
    this.configFile = path.join(this.configDir, 'mod-settings.json');
    this.settings = { ...defaultSettings };
    this.load();
  }

  load() {
    try {
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true });
      }
      if (fs.existsSync(this.configFile)) {
        const raw = fs.readFileSync(this.configFile, 'utf8');
        const parsed = JSON.parse(raw);
        this.settings = { ...defaultSettings, ...parsed };
      } else {
        this.save();
      }
    } catch (e) {
      console.error('[ModSettings] Failed to load settings:', e);
      this.settings = { ...defaultSettings };
    }
    
    // Ensure download dir exists
    try {
      if (!fs.existsSync(this.settings.downloadPath)) {
        fs.mkdirSync(this.settings.downloadPath, { recursive: true });
      }
    } catch (e) {}
  }

  save() {
    try {
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true });
      }
      fs.writeFileSync(this.configFile, JSON.stringify(this.settings, null, 2), 'utf8');
    } catch (e) {
      console.error('[ModSettings] Failed to save settings:', e);
    }
  }

  get(key) {
    return this.settings[key];
  }

  getAll() {
    return { ...this.settings };
  }

  set(key, value) {
    if (ALLOWED_SETTING_KEYS.has(key)) {
      this.settings[key] = value;
      this.save();
    }
  }

  update(newSettings) {
    if (!newSettings || typeof newSettings !== 'object') return this.getAll();

    for (const [key, value] of Object.entries(newSettings)) {
      if (!ALLOWED_SETTING_KEYS.has(key)) continue;

      if (key === 'volumeBoost' && typeof value === 'number') {
        this.settings[key] = Math.min(Math.max(value, 1.0), 2.0);
      } else if (key === 'downloadQuality' && ['mp3_320', 'flac', 'mp3_192'].includes(value)) {
        this.settings[key] = value;
      } else if (key === 'downloadPath' && typeof value === 'string' && path.isAbsolute(value)) {
        this.settings[key] = path.normalize(value);
      } else if (typeof defaultSettings[key] === 'boolean' && typeof value === 'boolean') {
        this.settings[key] = value;
      }
    }

    this.save();
    return this.getAll();
  }
}

module.exports = new SettingsManager();
