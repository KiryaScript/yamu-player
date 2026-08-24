const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

console.log('=== BUILD & ASAR INTEGRITY PATCH PIPELINE ===');

const unpackedDir = 'D:\\Desktop\\yandex\\unpacked_app';
const appSourceDir = 'D:\\Desktop\\yandex\\app_source';
const asarPath = path.join(appSourceDir, 'resources', 'app.asar');
const exePath = path.join(appSourceDir, 'Яндекс Музыка.exe');

// 1. Pack asar
console.log('1. Packing app.asar with @electron/asar...');
execSync(`npx --yes @electron/asar pack "${unpackedDir}" "${asarPath}"`, { stdio: 'inherit' });

// 2. Compute exact ASAR Header SHA-256 Hash
const asarBuf = fs.readFileSync(asarPath);
const jsonSize = asarBuf.readUInt32LE(12);
const headerBuf = asarBuf.subarray(16, 16 + jsonSize);
const asarHeaderHash = crypto.createHash('sha256').update(headerBuf).digest('hex');

console.log('2. Computed ASAR Header SHA-256 Hash:', asarHeaderHash);

// 3. Patch the hash inside the executable
console.log('3. Patching integrity hash inside Яндекс Музыка.exe...');
const exeBuf = fs.readFileSync(exePath);

const integrityTag = Buffer.from('resources\\\\app.asar","alg":"SHA256","value":"');
const tagIdx = exeBuf.indexOf(integrityTag);

if (tagIdx === -1) {
  console.error('ERROR: Could not find integrity JSON tag in executable!');
  process.exit(1);
}

const hashStart = tagIdx + integrityTag.length;
const currentHashInExe = exeBuf.slice(hashStart, hashStart + 64).toString('utf8');
console.log('   Previous hash in exe:', currentHashInExe);
console.log('   Writing new header hash:', asarHeaderHash);

exeBuf.write(asarHeaderHash, hashStart, 64, 'utf8');
fs.writeFileSync(exePath, exeBuf);
console.log('4. Successfully patched executable integrity signature!');

console.log('=== BUILD & PATCH COMPLETED SUCCESSFULLY ===');
