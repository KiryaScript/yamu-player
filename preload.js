const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  login: () => ipcRenderer.invoke('login-yandex'),
  getUserData: () => ipcRenderer.invoke('get-user-data'),
  getLikes: (login) => ipcRenderer.invoke('get-likes', login),
  getTrackUrl: (trackId, hq) => ipcRenderer.invoke('get-track-url', { trackId, hq }),
  search: (query) => ipcRenderer.invoke('search', query),
  
  getPlaylists: (login) => ipcRenderer.invoke('get-playlists', login),
  getPlaylistTracks: (login, kind) => ipcRenderer.invoke('get-playlist-tracks', { login, kind }),
  getChart: () => ipcRenderer.invoke('get-chart'),
  getRotor: () => ipcRenderer.invoke('get-rotor'),

  windowControl: (action) => ipcRenderer.invoke('window-control', action),
  clearCache: () => ipcRenderer.invoke('clear-cache'),
  
  // ФИКС: Принимаем один аргумент (объект) и передаем его дальше
  setDiscordStatus: (data) => ipcRenderer.invoke('set-discord-status', data)
});