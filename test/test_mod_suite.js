const assert = require('assert');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Ensure node_modules from unpacked_app is accessible for testing
module.paths.push(path.resolve(__dirname, '../../unpacked_app/node_modules'));

console.log('====================================================');
console.log('   AUTOMATED HARDENING TEST SUITE FOR YANDEX MOD    ');
console.log('====================================================\n');

// 1. TEST SANITIZATION & WINDOWS COMPATIBILITY
console.log('[TEST 1] Filename Sanitization & Windows Reserved Names...');
const { sanitizeFilename, isPathInside } = require('../src/mod/downloader');

// Reserved device names
assert.strictEqual(sanitizeFilename('CON'), '_CON', 'CON should be escaped');
assert.strictEqual(sanitizeFilename('aux.mp3'), '_aux.mp3', 'aux.mp3 should be escaped');
assert.strictEqual(sanitizeFilename('nul'), '_nul', 'nul should be escaped');
assert.strictEqual(sanitizeFilename('COM1'), '_COM1', 'COM1 should be escaped');

// Trailing dots and spaces
assert.strictEqual(sanitizeFilename('Song Name...'), 'Song Name', 'Trailing dots must be stripped');
assert.strictEqual(sanitizeFilename('Artist  -  Track   '), 'Artist - Track', 'Excess whitespace must be collapsed and trimmed');

// Illegal characters
assert.strictEqual(sanitizeFilename('AC/DC: Highway to Hell <Live> *Remastered*?'), 'AC_DC_ Highway to Hell _Live_ _Remastered__', 'Illegal chars must be replaced');

// Emojis / Surrogate pair protection
const emojiTitle = '❤️🔥 Track Title ' + 'A'.repeat(100);
const sanitizedEmoji = sanitizeFilename(emojiTitle, 30);
assert(!sanitizedEmoji.includes('\uFFFD'), 'Surrogate pairs must not be broken by length truncation');
console.log('  -> PASS: All Filename Sanitization edge cases passed!\n');

// 2. TEST PATH TRAVERSAL DEFENSE
console.log('[TEST 2] Path Traversal Boundary Checks...');
const baseMusicDir = 'D:\\Music\\YandexMusic';
assert(isPathInside(baseMusicDir, 'D:\\Music\\YandexMusic\\Artist\\Song.mp3'), 'Valid path must pass');
assert(!isPathInside(baseMusicDir, 'D:\\Music\\Song.mp3'), 'Parent dir traversal must be blocked');
assert(!isPathInside(baseMusicDir, 'D:\\Windows\\System32\\cmd.exe'), 'Outside path must be blocked');
assert(!isPathInside(baseMusicDir, 'C:\\Music\\YandexMusic\\Song.mp3'), 'Different drive must be blocked');
console.log('  -> PASS: Path boundary checks passed!\n');

// 3. TEST SETTINGS SCHEMA & CLAMPING
console.log('[TEST 3] Settings Manager Validation & Type Safety...');
const settings = require('../src/mod/settings');

// Test quality whitelist
settings.update({ downloadQuality: 'invalid_codec' });
assert.notStrictEqual(settings.get('downloadQuality'), 'invalid_codec', 'Invalid quality string must be rejected');

// Test malicious key injection
settings.update({ __proto__: { admin: true }, evilKey: 'injected' });
assert.strictEqual(settings.get('evilKey'), undefined, 'Non-whitelisted keys must be filtered out');

// Restore defaults
settings.update({ downloadQuality: 'mp3_320' });
console.log('  -> PASS: Settings schema verified!\n');

// 4. TEST DIRECT STREAM URL RESOLUTION & DUAL-SALT CALCULATION
console.log('[TEST 4] Direct URL Calculation & Dual-Salt Logic...');
const downloader = require('../src/mod/downloader');

// Verify downloadTrack alias exists
assert.strictEqual(typeof downloader.downloadTrack, 'function', 'downloader.downloadTrack must be a function');

const mockXml = `<?xml version="1.0" encoding="utf-8"?>
<download-info>
  <host>s100vla.storage.yandex.net</host>
  <path>/rmusic/U2FsdGVkX1_test/track_12345</path>
  <ts>000659cf369ca306</ts>
  <region>-1</region>
  <s>24c05499eff1be45fb0f5ae4c559c1c1bfafc43fcbcc2bdb4303d66ae87f6ceb</s>
</download-info>`;

// Primary Web Salt (yamusic-downloader-pro)
const webUrl = downloader.calculateDirectUrl(mockXml, 'mp3', 'XGRlBW9FXlekgbPrRHuSiA');
console.log('  Web Salt Resolved URL:', webUrl);
assert(webUrl.startsWith('https://s100vla.storage.yandex.net/get-mp3/'), 'Host and prefix must match mp3');
assert(webUrl.includes('/000659cf369ca306/rmusic/U2FsdGVkX1_test/track_12345'), 'Path and timestamp must be intact');

// FLAC direct URL
const flacUrl = downloader.calculateDirectUrl(mockXml, 'flac');
assert(flacUrl.startsWith('https://s100vla.storage.yandex.net/get-flac/'), 'FLAC prefix must be /get-flac/');

// App Fallback Salt
const appUrl = downloader.calculateDirectUrl(mockXml, 'mp3', 'XGRprocessCdIxappkg');
assert.notStrictEqual(webUrl, appUrl, 'Different salts must produce different MD5 hashes');
console.log('  -> PASS: Direct URL and dual-salt calculation verified!\n');

// 5. TEST DISCORD RPC PROTOCOL ENCODING
console.log('[TEST 5] Discord RPC Protocol Layout...');
const discord = require('../src/mod/discord');

const testPacket = discord.encode(1, { cmd: 'SET_ACTIVITY', args: { pid: 1234 } });
assert(Buffer.isBuffer(testPacket), 'Packet must be a Buffer');
assert.strictEqual(testPacket.readInt32LE(0), 1, 'Opcode must be 1');
const bodyLength = testPacket.readInt32LE(4);
assert.strictEqual(testPacket.length, 8 + bodyLength, 'Packet size must match header length');
const decodedBody = JSON.parse(testPacket.toString('utf8', 8));
assert.strictEqual(decodedBody.cmd, 'SET_ACTIVITY', 'JSON body must parse correctly');
console.log('  -> PASS: Discord RPC encoding verified!\n');

// 6. TEST PLAYLIST EXPORT FORMATS (JSON, TXT, M3U8, CSV)
console.log('[TEST 6] Library Backup & Export Formats...');
const libraryBackup = require('../src/mod/library_backup');

const sampleTracks = [
  { id: '101', title: 'Song One', artist: 'Artist A', album: 'Album X', year: 2022, durationMs: 180000 },
  { id: '202', title: 'Song Two (Remix)', artist: 'Artist B', album: 'Album Y', year: 2023, durationMs: 240000 }
];

// JSON format
const jsonOut = libraryBackup.formatTracks(sampleTracks, 'json', 'My Test Playlist');
const parsedJson = JSON.parse(jsonOut);
assert.strictEqual(parsedJson.count, 2, 'JSON count must be 2');
assert.strictEqual(parsedJson.tracks[0].title, 'Song One', 'JSON first track title must match');

// TXT format
const txtOut = libraryBackup.formatTracks(sampleTracks, 'txt', 'My Test Playlist');
assert(txtOut.includes('Artist A - Song One'), 'TXT must contain Artist - Title');
assert(txtOut.includes('Artist B - Song Two (Remix)'), 'TXT must contain second track');

// M3U8 format
const m3uOut = libraryBackup.formatTracks(sampleTracks, 'm3u8', 'My Test Playlist');
assert(m3uOut.startsWith('#EXTM3U'), 'M3U8 must begin with #EXTM3U');
assert(m3uOut.includes('#EXTINF:180,Artist A - Song One'), 'M3U8 must have EXTINF with duration in seconds');
assert(m3uOut.includes('Artist A - Song One.mp3'), 'M3U8 must contain filename');

// CSV format
const csvOut = libraryBackup.formatTracks(sampleTracks, 'csv', 'My Test Playlist');
assert(csvOut.includes('"Title","Artist","Album","Year","DurationSec","TrackId"'), 'CSV header must be present');
assert(csvOut.includes('"Song One","Artist A","Album X","2022","180","101"'), 'CSV row must match');
console.log('  -> PASS: All 4 export formats verified!\n');

// 7. TEST IMPORT FILE PARSING (JSON, TXT, M3U8, CSV)
console.log('[TEST 7] Import Parsing Across All Formats...');

// Parse JSON import
const parsedFromJson = libraryBackup.parseImportFile('backup.json', jsonOut);
assert.strictEqual(parsedFromJson.length, 2, 'Parsed JSON must yield 2 tracks');
assert.strictEqual(parsedFromJson[0].title, 'Song One');

// Parse TXT import
const parsedFromTxt = libraryBackup.parseImportFile('list.txt', 'The Beatles - Let It Be\nQueen - Bohemian Rhapsody\n');
assert.strictEqual(parsedFromTxt.length, 2, 'Parsed TXT must yield 2 tracks');
assert.strictEqual(parsedFromTxt[0].artist, 'The Beatles');
assert.strictEqual(parsedFromTxt[0].title, 'Let It Be');

// Parse M3U8 import
const parsedFromM3u = libraryBackup.parseImportFile('playlist.m3u8', m3uOut);
assert.strictEqual(parsedFromM3u.length, 2, 'Parsed M3U8 must yield 2 tracks');
assert.strictEqual(parsedFromM3u[0].title, 'Song One');
assert.strictEqual(parsedFromM3u[0].artist, 'Artist A');

// Parse CSV import
const parsedFromCsv = libraryBackup.parseImportFile('sheet.csv', csvOut);
assert.strictEqual(parsedFromCsv.length, 2, 'Parsed CSV must yield 2 tracks');
assert.strictEqual(parsedFromCsv[0].title, 'Song One');
assert.strictEqual(parsedFromCsv[0].id, '101');
console.log('  -> PASS: All 4 import formats parsed successfully!\n');

// 8. SYNTAX & LINT CHECKS ACROSS ALL SOURCE FILES
console.log('[TEST 8] Syntax Validation Across Codebase (src/)...');
const sourceFiles = [
  '../src/index.js',
  '../src/preload.js',
  '../src/mod/main.js',
  '../src/mod/downloader.js',
  '../src/mod/settings.js',
  '../src/mod/discord.js',
  '../src/mod/library_backup.js',
  '../src/mod/client.js'
];

sourceFiles.forEach(rel => {
  const full = path.join(__dirname, rel);
  require('child_process').execSync(`node -c "${full}"`);
  console.log(`  ✓ Syntax OK: ${path.basename(full)}`);
});
console.log('  -> PASS: All source files pass JS syntax validation!\n');

console.log('====================================================');
console.log('    ALL 8 AUTOMATED HARDENING TESTS PASSED (100%)    ');
console.log('====================================================');
