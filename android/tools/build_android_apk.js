const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('=== ANDROID APK BUILD & SIGN PIPELINE ===\n');

const baseDir = path.join(__dirname, '..');
const toolsDir = path.join(baseDir, 'tools');
const decompiledDir = path.join(baseDir, 'decompiled');
const outputDir = path.join(baseDir, 'output_apk');
const unsignedApk = path.join(outputDir, 'unsigned.apk');
const finalApkName = 'Yandex_Music_Mod_v2026.08.2.apk';
const finalApkPath = path.join(baseDir, finalApkName);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 1. Rebuild APK with apktool
console.log('1. Building APK with apktool...');
const apktoolJar = path.join(toolsDir, 'apktool.jar');
const buildCmd = `java -jar "${apktoolJar}" b "${decompiledDir}" -o "${unsignedApk}" --use-aapt2`;
execSync(buildCmd, { stdio: 'inherit', cwd: baseDir });
console.log('✓ Rebuild finished successfully!');

// 2. Sign and Align APK with uber-apk-signer
console.log('\n2. Aligning (zipalign) and Signing (v1/v2/v3) APK with uber-apk-signer...');
const signerJar = path.join(toolsDir, 'uber-apk-signer.jar');
const signCmd = `java -jar "${signerJar}" --apks "${unsignedApk}" -o "${outputDir}" --allowResign --overwrite`;
execSync(signCmd, { stdio: 'inherit', cwd: baseDir });

// 3. Copy to root release location
const signedApk = path.join(outputDir, 'unsigned-aligned-debugSigned.apk');
if (fs.existsSync(signedApk)) {
  fs.copyFileSync(signedApk, finalApkPath);
  console.log(`\n🎉 SUCCESS! Release APK built and signed:\n   -> ${finalApkPath} (${(fs.statSync(finalApkPath).size / 1024 / 1024).toFixed(2)} MB)`);
} else {
  console.log('\n⚠️ Signed APK not found in expected path, checking output directory:');
  console.log(fs.readdirSync(outputDir));
}
