import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Heart, Search, Home, RefreshCw, Music, Volume2, Disc, ListMusic, User, X, ArrowLeft, Radio, Sliders, Settings, LogOut, Shield, Zap, Database, Monitor } from 'lucide-react';

const FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

const EqualizerAnim = () => (
  <div className="flex items-end gap-[2px] h-4 w-4">
    <div className="w-1 bg-green-400 h-full equalizer-bar delay-1 rounded-sm"></div>
    <div className="w-1 bg-green-400 h-full equalizer-bar delay-2 rounded-sm"></div>
    <div className="w-1 bg-green-400 h-full equalizer-bar delay-3 rounded-sm"></div>
    <div className="w-1 bg-green-400 h-full equalizer-bar delay-4 rounded-sm"></div>
  </div>
);

function App() {
  const [userData, setUserData] = useState(null);
  const [activeView, setActiveView] = useState('home'); 
  const [viewTitle, setViewTitle] = useState('Главная');
  
  const [trackList, setTrackList] = useState([]);
  const [playlists, setPlaylists] = useState([]); 
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  // === ВСЕ НАСТРОЙКИ ===
  const [settings, setSettings] = useState({
      hq: true,
      normalization: false,
      discordRPC: true, // По умолчанию включено
      hardwareAccel: true
  });

  const [showEq, setShowEq] = useState(false);
  const [eqGains, setEqGains] = useState(new Array(10).fill(0));

  const audioRef = useRef(new Audio());
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const filtersRef = useRef([]);
  const compressorRef = useRef(null);

  useEffect(() => {
    if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        audioContextRef.current = ctx;
        audioRef.current.crossOrigin = "anonymous";
        
        const source = ctx.createMediaElementSource(audioRef.current);
        sourceNodeRef.current = source;

        const filters = FREQUENCIES.map((freq) => {
            const filter = ctx.createBiquadFilter();
            filter.type = 'peaking';
            filter.frequency.value = freq;
            filter.Q.value = 1.4;
            filter.gain.value = 0;
            return filter;
        });
        filtersRef.current = filters;

        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -24;
        compressor.knee.value = 30;
        compressor.ratio.value = 12;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;
        compressorRef.current = compressor;

        let prevNode = source;
        filters.forEach((filter) => {
            prevNode.connect(filter);
            prevNode = filter;
        });
        prevNode.connect(ctx.destination);
    }
  }, []);

  useEffect(() => {
    filtersRef.current.forEach((filter, index) => {
        if (filter) filter.gain.value = eqGains[index];
    });
  }, [eqGains]);

  useEffect(() => {
      if (!audioContextRef.current) return;
      const ctx = audioContextRef.current;
      const lastFilter = filtersRef.current[filtersRef.current.length - 1];
      const compressor = compressorRef.current;
      lastFilter.disconnect();
      compressor.disconnect();
      if (settings.normalization) {
          lastFilter.connect(compressor);
          compressor.connect(ctx.destination);
      } else {
          lastFilter.connect(ctx.destination);
      }
  }, [settings.normalization]);

 // === DISCORD RPC EFFECT ===
  useEffect(() => {
      if (settings.discordRPC) {
          // Упаковываем всё в один объект data
          if (currentTrack) {
              window.api.setDiscordStatus({ 
                  track: currentTrack, 
                  isPlaying: isPlaying 
              });
          } else {
              window.api.setDiscordStatus({ 
                  track: null, 
                  isPlaying: false 
              });
          }
      }
  }, [currentTrack, isPlaying, settings.discordRPC]);

  const toggleSetting = (key) => {
      setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleEqChange = (index, val) => {
      const newGains = [...eqGains];
      newGains[index] = Number(val);
      setEqGains(newGains);
  };

  const clearCache = async () => {
      await window.api.clearCache();
      alert("Кэш очищен!");
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      let user = userData;
      if (!user) {
        user = await window.api.getUserData();
        if (user && user.login) setUserData(user);
      }
      if (activeView === 'settings') { setIsLoading(false); return; }

      let data = [];
      if (isSearching) {
         data = await window.api.search(searchQuery);
         setTrackList(data || []);
      } else if (activeView === 'home') {
         setViewTitle("Чарт Яндекс Музыки");
         data = await window.api.getChart();
         setTrackList(data || []);
      } else if (activeView === 'vibe') {
         setViewTitle("Моя волна");
         if (trackList.length === 0) {
             data = await window.api.getRotor();
             setTrackList(data || []);
         }
      } else if (activeView === 'likes' && user) {
         setViewTitle("Мне нравится");
         data = await window.api.getLikes(user.login);
         setTrackList(data || []);
      } else if (activeView === 'collection' && user) {
         setViewTitle("Коллекция плейлистов");
         const pl = await window.api.getPlaylists(user.login);
         setPlaylists(pl || []);
      }
    } catch (e) { console.error("Load Error:", e); }
    setIsLoading(false);
  };

  const navigate = (view) => {
    setIsSearching(false);
    setSearchQuery("");
    setActiveView(view);
    if (view === 'settings') setViewTitle("Настройки");
    if (view !== 'settings') setTrackList([]); 
  };

  useEffect(() => { loadData(); }, [activeView, isSearching]); 

  const openPlaylist = async (playlistId, title) => {
     setIsLoading(true);
     try {
         const tracks = await window.api.getPlaylistTracks(userData.login, playlistId);
         setTrackList(tracks || []);
         setViewTitle(title);
         setActiveView('playlist');
     } catch(e) { console.error(e); }
     setIsLoading(false);
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) setIsSearching(true);
  };

  const playTrack = async (track) => {
    if (!track || !track.id) return;
    if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();

    if (currentTrack?.id === track.id) {
      if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
      else { audioRef.current.play(); setIsPlaying(true); }
      return;
    }
    try {
      setCurrentTrack(track);
      setIsPlaying(false);
      setCurrentTime(0);
      const url = await window.api.getTrackUrl(track.id, settings.hq);
      if (url) {
        audioRef.current.src = url;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (e) { console.error("Play Error:", e); }
  };

  const playNext = useCallback(() => {
    if (!currentTrack || trackList.length === 0) return;
    const idx = trackList.findIndex(t => t.id === currentTrack.id);
    const nextIdx = (idx + 1) % trackList.length;
    playTrack(trackList[nextIdx]);
  }, [currentTrack, trackList, settings.hq]);

  const playPrev = useCallback(() => {
    if (!currentTrack || trackList.length === 0) return;
    if (audioRef.current.currentTime > 3) { audioRef.current.currentTime = 0; return; }
    const idx = trackList.findIndex(t => t.id === currentTrack.id);
    const prevIdx = (idx - 1 + trackList.length) % trackList.length;
    playTrack(trackList[prevIdx]);
  }, [currentTrack, trackList, settings.hq]);

  useEffect(() => {
    const audio = audioRef.current;
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const onEnded = () => playNext();

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
    };
  }, [playNext]);

  useEffect(() => { audioRef.current.volume = volume; }, [volume]);
  
  useEffect(() => {
    const hk = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') { e.preventDefault(); if(currentTrack) isPlaying ? audioRef.current.pause() : audioRef.current.play(); setIsPlaying(!isPlaying); }
    };
    window.addEventListener('keydown', hk);
    return () => window.removeEventListener('keydown', hk);
  }, [currentTrack, isPlaying]);

  const formatTime = (t) => {
    if (!t || isNaN(t)) return "0:00";
    const m = Math.floor(t / 60); const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' + s : s}`;
  };

  return (
    <div className="h-screen w-screen flex flex-col font-sans select-none text-white overflow-hidden bg-[#0a0a0c]">
      {currentTrack && (
        <div className="fixed inset-0 -z-10 bg-cover bg-center opacity-20 blur-[50px] transition-all duration-1000" 
             style={{backgroundImage: `url(${currentTrack.cover})`}}></div>
      )}

      {/* ШАПКА */}
      <div className="h-10 w-full flex items-center justify-between px-4 z-50 bg-black/40 border-b border-white/5" style={{WebkitAppRegion: 'drag'}}>
        <div className="flex items-center gap-4">
             <span className="text-[10px] font-bold tracking-[0.2em] opacity-50 uppercase">YAMU</span>
             <div className="no-drag flex items-center gap-2">
                <button onClick={loadData} className="opacity-50 hover:opacity-100 transition hover:rotate-180 duration-500">
                    <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                </button>
             </div>
        </div>
        <div className="no-drag flex items-center gap-3 pr-2">
             <button onClick={() => window.api.windowControl('minimize')} className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 shadow-md cursor-pointer"></button>
             <button onClick={() => window.api.windowControl('maximize')} className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 shadow-md cursor-pointer"></button>
             <button onClick={() => window.api.windowControl('close')} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 shadow-md cursor-pointer"></button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 px-4 pb-4 overflow-hidden pt-2">
        {/* ЛЕВАЯ ПАНЕЛЬ */}
        <div className="w-60 glass-panel rounded-[24px] p-4 flex flex-col gap-6 z-20">
          <div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-xl border border-white/5 transition hover:bg-white/10 group focus-within:bg-white/10 focus-within:border-white/20">
            <Search size={16} className="opacity-40 group-hover:opacity-80 transition"/>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleSearch} placeholder="Поиск..." className="bg-transparent border-none outline-none text-sm w-full placeholder-white/30" />
            {isSearching && <X size={14} className="cursor-pointer opacity-50 hover:opacity-100" onClick={() => navigate('home')}/>}
          </div>
          <div className="space-y-1">
             <MenuItem icon={<Home size={20}/>} text="Главная" active={activeView === 'home' && !isSearching} onClick={() => navigate('home')} />
             <MenuItem icon={<Radio size={20}/>} text="Моя волна" active={activeView === 'vibe' && !isSearching} onClick={() => navigate('vibe')} />
             <MenuItem icon={<ListMusic size={20}/>} text="Коллекция" active={activeView === 'collection' && !isSearching} onClick={() => navigate('collection')} />
          </div>
          <div className="h-[1px] bg-white/10 mx-2"></div>
          <div className="space-y-1 overflow-y-auto custom-scroll pr-1 flex-1">
             <MenuItem icon={<Heart size={18} className="text-red-400"/>} text="Мне нравится" active={activeView === 'likes' && !isSearching} onClick={() => navigate('likes')}/>
             <MenuItem icon={<Settings size={18}/>} text="Настройки" active={activeView === 'settings'} onClick={() => navigate('settings')}/>
          </div>
          <div className="mt-auto flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition" onClick={() => window.api.login().then(loadData)}>
             <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                {userData ? userData.login[0].toUpperCase() : <User size={14}/>}
             </div>
             <div className="flex flex-col"><span className="text-xs font-medium">{userData?.name || "Войти"}</span></div>
          </div>
        </div>

        {/* ПРАВАЯ ПАНЕЛЬ */}
        <div className="flex-1 glass-panel rounded-[24px] p-0 relative flex flex-col overflow-hidden z-10">
             <div className="h-16 flex items-center px-8 border-b border-white/5 bg-white/[0.02] shrink-0">
                {activeView === 'playlist' && <button onClick={() => navigate('collection')} className="mr-4 p-2 hover:bg-white/10 rounded-full transition"><ArrowLeft size={20}/></button>}
                <h1 className="text-xl font-bold flex items-center gap-3">{viewTitle}</h1>
                <span className="ml-auto text-xs opacity-30 font-mono">
                    {activeView === 'collection' ? `${playlists.length} PLAYLISTS` : activeView === 'settings' ? 'v1.0.0' : `${trackList.length} TRACKS`}
                </span>
             </div>

             <div className="flex-1 overflow-y-auto p-4 custom-scroll">
                
                {/* --- НАСТРОЙКИ (ПОЛНЫЙ ФАРШ) --- */}
                {activeView === 'settings' && (
                    <div className="max-w-3xl mx-auto space-y-8 p-4">
                        <section className="space-y-4">
                            <h2 className="text-lg font-bold flex items-center gap-2"><User size={20}/> Аккаунт</h2>
                            <div className="bg-white/5 rounded-2xl p-6 flex items-center gap-6">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-red-500 flex items-center justify-center text-3xl font-bold text-black shadow-lg">
                                    {userData ? userData.login[0].toUpperCase() : "?"}
                                </div>
                                <div>
                                    <div className="text-xl font-bold">{userData?.name || "Гость"}</div>
                                    <div className="text-sm opacity-50">{userData?.login || "Не выполнен вход"}</div>
                                </div>
                                <button className="ml-auto px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full flex items-center gap-2 transition" onClick={() => window.api.login()}>
                                    <LogOut size={16}/> {userData ? "Сменить" : "Войти"}
                                </button>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-lg font-bold flex items-center gap-2"><Zap size={20}/> Аудио</h2>
                            <div className="bg-white/5 rounded-2xl p-1 space-y-1">
                                <SettingItem 
                                    title="Высокое качество (HQ)" 
                                    desc="Загружать треки в 320kbps (требует перезапуск трека)" 
                                    active={settings.hq}
                                    onClick={() => toggleSetting('hq')}
                                />
                                <SettingItem 
                                    title="Нормализация громкости" 
                                    desc="Автоматически выравнивать громкость разных треков" 
                                    active={settings.normalization}
                                    onClick={() => toggleSetting('normalization')}
                                />
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-lg font-bold flex items-center gap-2"><Shield size={20}/> Система</h2>
                            <div className="bg-white/5 rounded-2xl p-1 space-y-1">
                                <SettingItem 
                                    title="Discord Rich Presence" 
                                    desc="Показывать текущий трек в статусе Discord" 
                                    active={settings.discordRPC}
                                    onClick={() => toggleSetting('discordRPC')}
                                />
                                <SettingItem 
                                    title="Аппаратное ускорение" 
                                    desc="Использовать GPU для интерфейса (требует перезагрузки)" 
                                    active={settings.hardwareAccel}
                                    onClick={() => toggleSetting('hardwareAccel')}
                                />
                                <div className="flex items-center justify-between p-4 hover:bg-white/5 rounded-xl transition cursor-pointer" onClick={clearCache}>
                                    <div className="flex items-center gap-4">
                                        <Database size={20} className="opacity-50"/>
                                        <div>
                                            <div className="font-medium">Очистить кэш</div>
                                            <div className="text-xs opacity-40">Освободит место на диске</div>
                                        </div>
                                    </div>
                                    <button className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded hover:bg-red-500/30">Очистить</button>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {/* СПИСКИ (НЕ МЕНЯЛИСЬ) */}
                {activeView !== 'settings' && activeView !== 'collection' && (
                    <div className="space-y-1">
                        {trackList.map((track, index) => {
                          if (!track || !track.id) return null;
                          const isActive = currentTrack?.id === track.id;
                          return (
                            <div key={track.id} onClick={() => playTrack(track)} className={`group flex items-center gap-4 p-2 rounded-xl cursor-pointer transition duration-200 border border-transparent ${isActive ? 'bg-white/10 border-white/5 shadow-lg' : 'hover:bg-white/5 hover:border-white/5'}`}>
                               <div className="w-6 text-center text-xs opacity-30 font-mono group-hover:hidden">{isActive && isPlaying ? '' : index + 1}</div>
                               <div className="w-6 hidden group-hover:flex justify-center"><Play size={12} fill="white"/></div>
                               <div className="w-10 h-10 rounded-lg bg-gray-800 overflow-hidden relative shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
                                  {track.cover ? <img src={track.cover} className="w-full h-full object-cover" /> : <Music className="p-2"/>}
                                  {isActive && isPlaying && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><EqualizerAnim /></div>}
                               </div>
                               <div className="flex-1 min-w-0 flex flex-col justify-center">
                                  <div className={`text-sm font-medium truncate ${isActive ? 'text-green-400' : 'text-white'}`}>{track.title}</div>
                                  <div className="text-xs opacity-50 truncate group-hover:opacity-80 transition">{track.artist}</div>
                               </div>
                               <div className="text-xs opacity-40 font-mono px-2">{formatTime(track.duration / 1000)}</div>
                            </div>
                          )
                        })}
                    </div>
                )}

                {activeView === 'collection' && (
                    <div className="grid grid-cols-3 gap-4">
                        {playlists.map(p => (
                            <div key={p.id} onClick={() => openPlaylist(p.id, p.title)} className="group p-3 rounded-2xl hover:bg-white/5 cursor-pointer transition border border-transparent hover:border-white/5">
                                <div className="aspect-square bg-gray-800 rounded-xl mb-3 overflow-hidden shadow-lg group-hover:scale-[1.02] transition-transform">
                                    {p.cover ? <img src={p.cover} className="w-full h-full object-cover"/> : <Disc className="m-auto opacity-20"/>}
                                </div>
                                <div className="font-medium truncate">{p.title}</div>
                                <div className="text-xs opacity-40">{p.count} треков</div>
                            </div>
                        ))}
                    </div>
                )}
             </div>
        </div>
      </div>

      {/* НИЖНИЙ ПЛЕЕР */}
      <div className="h-24 mx-4 mb-4 glass-player rounded-[28px] flex items-center justify-between px-8 relative z-50">
        
        {/* EQ POPUP (FIXED: VERTICAL SLIDERS) */}
        {showEq && (
            <div className="absolute bottom-28 right-0 w-[400px] h-[220px] glass-panel rounded-3xl p-6 z-[100] eq-popup flex flex-col no-drag">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Equalizer</span>
                    <button onClick={() => setEqGains(new Array(10).fill(0))} className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition">Сброс</button>
                </div>
                <div className="flex-1 flex justify-between items-center px-2 gap-2">
                    {FREQUENCIES.map((freq, i) => (
                        <div key={freq} className="flex flex-col items-center h-full justify-end w-6 gap-2">
                            {/* ТУТ ИСПОЛЬЗУЕМ НОВЫЙ КЛАСС eq-range-vertical */}
                            <input 
                                type="range" 
                                min="-12" max="12" step="1"
                                value={eqGains[i]}
                                onChange={(e) => handleEqChange(i, e.target.value)}
                                className="eq-range-vertical" 
                            />
                            <span className="text-[9px] opacity-40 font-mono">{freq < 1000 ? freq : freq/1000 + 'k'}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <div className="flex items-center gap-4 w-[30%]">
           <div className={`w-14 h-14 bg-gray-800 rounded-xl shadow-2xl border border-white/10 overflow-hidden flex-shrink-0 transition-transform duration-500 ${isPlaying ? 'scale-100' : 'scale-95 opacity-80'}`}>
              {currentTrack?.cover ? <img src={currentTrack.cover} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center bg-gray-900"><Music className="opacity-20"/></div>}
           </div>
           <div className="min-w-0 flex flex-col justify-center">
             <div className="font-bold text-sm leading-tight truncate pr-4">{currentTrack?.title || "Yandex.OS Music"}</div>
             <div className="text-xs opacity-50 truncate mt-1">{currentTrack?.artist || "Готов к работе"}</div>
           </div>
           <Heart size={18} className={`cursor-pointer transition hover:scale-110 ml-2 ${currentTrack ? 'opacity-40 hover:opacity-100 hover:text-red-500' : 'opacity-0'}`} />
        </div>

        <div className="flex flex-col items-center justify-center gap-2 flex-1 max-w-xl">
           <div className="flex items-center gap-8">
              <button onClick={playPrev} className="opacity-50 hover:opacity-100 hover:scale-110 active:scale-95 transition"><SkipBack size={24} strokeWidth={1.5} /></button>
              <button onClick={() => {if(currentTrack) isPlaying ? audioRef.current.pause() : audioRef.current.play(); setIsPlaying(!isPlaying)}} className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-90 transition shadow-lg">
                {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-1"/>}
              </button>
              <button onClick={playNext} className="opacity-50 hover:opacity-100 hover:scale-110 active:scale-95 transition"><SkipForward size={24} strokeWidth={1.5} /></button>
           </div>
           <div className="w-full flex items-center gap-3 text-[10px] opacity-60 font-mono relative h-8">
              <span className="w-8 text-right pointer-events-none">{formatTime(currentTime)}</span>
              <div className="flex-1 h-full relative group flex items-center">
                 <div className="absolute left-0 right-0 h-1 bg-white/10 rounded-full pointer-events-none">
                     <div className="h-full bg-white rounded-full transition-all duration-100" style={{width: `${(currentTime/duration)*100}%`}}></div>
                 </div>
                 <input type="range" min="0" max={duration || 100} value={currentTime} onChange={(e) => {const t=Number(e.target.value); audioRef.current.currentTime=t; setCurrentTime(t)}} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"/>
              </div>
              <span className="w-8 pointer-events-none">{formatTime(duration)}</span>
           </div>
        </div>

        <div className="w-[30%] flex justify-end items-center gap-3 relative">
           <button onClick={() => setShowEq(!showEq)} className={`p-2 rounded-full transition ${showEq ? 'bg-white text-black' : 'hover:bg-white/10 text-white'}`}>
             <Sliders size={18} />
           </button>

           <Volume2 size={18} className="opacity-50"/>
           <div className="w-24 h-full flex items-center relative group">
               <div className="absolute left-0 right-0 h-1 bg-white/10 rounded-full pointer-events-none">
                  <div className="h-full bg-white transition-all" style={{width: `${volume * 100}%`}}></div>
               </div>
               <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
           </div>
        </div>
      </div>
    </div>
  );
}

const SettingItem = ({ title, desc, active, onClick }) => (
    <div className="flex items-center justify-between p-4 hover:bg-white/5 rounded-xl transition cursor-pointer" onClick={onClick}>
        <div>
            <div className="font-medium">{title}</div>
            <div className="text-xs opacity-40">{desc}</div>
        </div>
        <div className={`w-10 h-6 rounded-full relative transition ${active ? 'bg-green-500' : 'bg-white/10'}`}>
            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${active ? 'translate-x-4' : ''}`}></div>
        </div>
    </div>
);

const MenuItem = ({ icon, text, active, onClick }) => (
  <div onClick={onClick} className={`flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition select-none ${active ? 'bg-white text-black shadow-lg font-bold' : 'hover:bg-white/10 text-white'}`}>
    {icon} <span className="text-sm font-medium">{text}</span>
  </div>
);

export default App;