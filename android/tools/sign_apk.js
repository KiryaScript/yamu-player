const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('=== ANDROID APK SIGN PIPELINE ===\n');

const baseDir = path.join(__dirname, '..');
const toolsDir = path.join(baseDir, 'tools');
const outputDir = path.join(baseDir, 'output_apk');
const unsignedApk = path.join(outputDir, 'unsigned.apk');
const finalApkName = 'Yandex_Music_Mod_v2026.08.2.apk';
const finalApkPath = path.join(baseDir, finalApkName);

console.log('Aligning and Signing (v1/v2/v3) APK with uber-apk-signer...');
const signerJar = path.join(toolsDir, 'uber-apk-signer.jar');
const signCmd = `java -jar "${signerJar}" --apks "${unsignedApk}" -o "${outputDir}" --allowResign`;
execSync(signCmd, { stdio: 'inherit', cwd: baseDir });

// Find signed APK in output directory
const files = fs.readdirSync(outputDir);
const signedFile = files.find(f => f.includes('aligned-debugSigned.apk') || (f.endsWith('.apk') && f !== 'unsigned.apk'));

if (signedFile) {
  const signedApkPath = path.join(outputDir, signedFile);
  fs.copyFileSync(signedApkPath, finalApkPath);
  console.log(`\n🎉 SUCCESS! Release APK built and signed:\n   -> ${finalApkPath} (${(fs.statSync(finalApkPath).size / 1024 / 1024).toFixed(2)} MB)`);
} else {
  console.log('\nOutput directory contents:', files);
}
