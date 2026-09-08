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

// 3. Target locations to update & patch
const targetDirs = [
  appSourceDir,
  path.join(process.env.LOCALAPPDATA || 'C:\\Users\\rdk30\\AppData\\Local', 'Programs', 'YandexMusic')
];

targetDirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const targetAsar = path.join(dir, 'resources', 'app.asar');
  if (targetAsar !== asarPath) {
    console.log(`Copying app.asar to ${targetAsar}...`);
    try {
      fs.copyFileSync(asarPath, targetAsar);
    } catch (e) {
      console.warn(`Could not copy to ${targetAsar}:`, e.message);
    }
  }

  const targetExes = ['Яндекс Музыка.exe', 'YandexMusic.exe'];
  targetExes.forEach(exeName => {
    const currentExePath = path.join(dir, exeName);
    if (!fs.existsSync(currentExePath)) return;
    console.log(`3. Patching integrity hash inside ${path.join(dir, exeName)}...`);
    const exeBuf = fs.readFileSync(currentExePath);
    const integrityTag = Buffer.from('resources\\\\app.asar","alg":"SHA256","value":"');
    const tagIdx = exeBuf.indexOf(integrityTag);
    if (tagIdx === -1) {
      console.warn(`   Notice: Could not find integrity JSON tag in ${exeName}, skipping.`);
      return;
    }
    const hashStart = tagIdx + integrityTag.length;
    const currentHashInExe = exeBuf.slice(hashStart, hashStart + 64).toString('utf8');
    console.log(`   Previous hash in ${exeName}:`, currentHashInExe);
    console.log(`   Writing new header hash:`, asarHeaderHash);
    exeBuf.write(asarHeaderHash, hashStart, 64, 'utf8');
    fs.writeFileSync(currentExePath, exeBuf);
    console.log(`4. Successfully patched ${exeName}!`);
  });
});

// Also update Desktop Patcher data archive if present
const patcherDataAsar = 'D:\\Desktop\\yandex\\Yandex_Music_Desktop_Patcher\\data\\app.asar';
if (fs.existsSync(path.dirname(patcherDataAsar))) {
  console.log(`Updating ${patcherDataAsar}...`);
  fs.copyFileSync(asarPath, patcherDataAsar);
}

console.log('=== BUILD & PATCH COMPLETED SUCCESSFULLY ===');
