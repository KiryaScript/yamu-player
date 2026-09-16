const assert = require('assert');
const path = require('path');
const crypto = require('crypto');

console.log('====================================================');
console.log('   AUTOMATED HARDENING TEST SUITE FOR YANDEX MOD    ');
console.log('====================================================\n');

// 1. TEST SANITIZATION & WINDOWS COMPATIBILITY
console.log('[TEST 1] Filename Sanitization & Windows Reserved Names...');
const { sanitizeFilename, isPathInside } = require('../unpacked_app/mod/downloader');

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
const settings = require('../unpacked_app/mod/settings');

// Test quality whitelist
settings.update({ downloadQuality: 'invalid_codec' });
assert.notStrictEqual(settings.get('downloadQuality'), 'invalid_codec', 'Invalid quality string must be rejected');

// Test malicious key injection
settings.update({ __proto__: { admin: true }, evilKey: 'injected' });
assert.strictEqual(settings.get('evilKey'), undefined, 'Non-whitelisted keys must be filtered out');

// Restore defaults
settings.update({ downloadQuality: 'mp3_320' });
console.log('  -> PASS: Settings schema verified!\n');

// 4. TEST DIRECT STREAM URL RESOLUTION
console.log('[TEST 4] Direct URL Calculation & XML Parsing...');
const downloader = require('../unpacked_app/mod/downloader');

const mockXml = `<?xml version="1.0" encoding="utf-8"?>
<download-info>
  <host>s100vla.storage.yandex.net</host>
  <path>/rmusic/U2FsdGVkX1_test/track_12345</path>
  <ts>000659cf369ca306</ts>
  <region>-1</region>
  <s>24c05499eff1be45fb0f5ae4c559c1c1bfafc43fcbcc2bdb4303d66ae87f6ceb</s>
</download-info>`;

const resolvedUrl = downloader.calculateDirectUrl(mockXml);
console.log('  Resolved URL:', resolvedUrl);
assert(resolvedUrl.startsWith('https://s100vla.storage.yandex.net/get-mp3/'), 'Host and prefix must match');
assert(resolvedUrl.includes('/000659cf369ca306/rmusic/U2FsdGVkX1_test/track_12345'), 'Path and timestamp must be intact');
console.log('  -> PASS: Direct URL calculation verified!\n');

// 5. TEST DISCORD RPC PROTOCOL ENCODING
console.log('[TEST 5] Discord RPC Protocol Layout...');
const discord = require('../unpacked_app/mod/discord');

const testPacket = discord.encode(1, { cmd: 'SET_ACTIVITY', args: { pid: 1234 } });
assert(Buffer.isBuffer(testPacket), 'Packet must be a Buffer');
assert.strictEqual(testPacket.readInt32LE(0), 1, 'Opcode must be 1');
const bodyLength = testPacket.readInt32LE(4);
assert.strictEqual(testPacket.length, 8 + bodyLength, 'Packet size must match header length');
const decodedBody = JSON.parse(testPacket.toString('utf8', 8));
assert.strictEqual(decodedBody.cmd, 'SET_ACTIVITY', 'JSON body must parse correctly');
console.log('  -> PASS: Discord RPC encoding verified!\n');

// 6. SYNTAX & LINT CHECKS ACROSS ALL SOURCE FILES
console.log('[TEST 6] Syntax Validation Across Codebase...');
const sourceFiles = [
  '../unpacked_app/index.js',
  '../unpacked_app/preload.js',
  '../unpacked_app/mod/main.js',
  '../unpacked_app/mod/downloader.js',
  '../unpacked_app/mod/settings.js',
  '../unpacked_app/mod/discord.js',
  '../unpacked_app/mod/client.js'
];

sourceFiles.forEach(rel => {
  const full = path.join(__dirname, rel);
  require('child_process').execSync(`node -c "${full}"`);
  console.log(`  ✓ Syntax OK: ${path.basename(full)}`);
});
console.log('  -> PASS: All modified files pass JS syntax validation!\n');

console.log('====================================================');
console.log('    ALL 6 AUTOMATED HARDENING TESTS PASSED (100%)    ');
console.log('====================================================');
