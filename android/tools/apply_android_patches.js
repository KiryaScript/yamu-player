const fs = require('fs');
const path = require('path');

console.log('=== APPLYING COMPREHENSIVE ANDROID MOD PATCHES ===\n');

const decompiledDir = path.join(__dirname, '..', 'decompiled');

// -------------------------------------------------------------
// 1. PATCH ANDROID MANIFEST (Universal APK, Standalone Install)
// -------------------------------------------------------------
const manifestPath = path.join(decompiledDir, 'AndroidManifest.xml');
let manifest = fs.readFileSync(manifestPath, 'utf8');

manifest = manifest.replace(/android:requiredSplitTypes="[^"]*"/g, '');
manifest = manifest.replace(/android:splitTypes="[^"]*"/g, '');
manifest = manifest.replace(/android:isSplitRequired="true"/g, 'android:isSplitRequired="false"');

fs.writeFileSync(manifestPath, manifest, 'utf8');
console.log('✓ [Manifest] Universal Standalone install patched in AndroidManifest.xml');

// -------------------------------------------------------------
// 2. PATCH ACCOUNT & PLUS SUBSCRIPTION MODELS
// -------------------------------------------------------------

// A. AccountAboutDto.smali (Shared DTO Model)
const accountAboutSmali = path.join(decompiledDir, 'smali_classes3', 'com', 'yandex', 'music', 'shared', 'dto', 'account', 'AccountAboutDto.smali');
if (fs.existsSync(accountAboutSmali)) {
  let content = fs.readFileSync(accountAboutSmali, 'utf8');
  
  // Patch method d() (hasMusicSubscription)
  content = content.replace(/\.method public final d\(\)Ljava\/lang\/Boolean;[\s\S]*?\.end method/, 
`.method public final d()Ljava/lang/Boolean;
    .locals 1

    sget-object v0, Ljava/lang/Boolean;->TRUE:Ljava/lang/Boolean;

    return-object v0
.end method`);

  // Patch method e() (hasPlus)
  content = content.replace(/\.method public final e\(\)Ljava\/lang\/Boolean;[\s\S]*?\.end method/, 
`.method public final e()Ljava/lang/Boolean;
    .locals 1

    sget-object v0, Ljava/lang/Boolean;->TRUE:Ljava/lang/Boolean;

    return-object v0
.end method`);

  // Patch method j() (isServiceAvailable)
  content = content.replace(/\.method public final j\(\)Ljava\/lang\/Boolean;[\s\S]*?\.end method/, 
`.method public final j()Ljava/lang/Boolean;
    .locals 1

    sget-object v0, Ljava/lang/Boolean;->TRUE:Ljava/lang/Boolean;

    return-object v0
.end method`);

  fs.writeFileSync(accountAboutSmali, content, 'utf8');
  console.log('✓ [Plus] AccountAboutDto.smali (hasPlus & hasMusicSubscription) patched.');
}

// B. hd.smali (Core Account Status Model)
const hdSmali = path.join(decompiledDir, 'smali_classes4', 'hd.smali');
if (fs.existsSync(hdSmali)) {
  let content = fs.readFileSync(hdSmali, 'utf8');

  // Patch d() (hasMusicSubscription)
  content = content.replace(/\.method public final d\(\)Z[\s\S]*?\.end method/,
`.method public final d()Z
    .locals 1

    const/4 v0, 0x1

    return v0
.end method`);

  // Patch f() (hasPlus)
  content = content.replace(/\.method public final f\(\)Z[\s\S]*?\.end method/,
`.method public final f()Z
    .locals 1

    const/4 v0, 0x1

    return v0
.end method`);

  // Patch j() (isServiceAvailable)
  content = content.replace(/\.method public final j\(\)Z[\s\S]*?\.end method/,
`.method public final j()Z
    .locals 1

    const/4 v0, 0x1

    return v0
.end method`);

  fs.writeFileSync(hdSmali, content, 'utf8');
  console.log('✓ [Plus] hd.smali (hasPlus & hasMusicSubscription boolean getters) patched.');
}

// C. PlusPayUserStatus.smali (PlusPay User Status)
const plusPaySmali = path.join(decompiledDir, 'smali_classes5', 'com', 'yandex', 'plus', 'pay', 'api', 'model', 'PlusPayUserStatus.smali');
if (fs.existsSync(plusPaySmali)) {
  let content = fs.readFileSync(plusPaySmali, 'utf8');

  content = content.replace(/\.method public final hasPlus\(\)Z[\s\S]*?\.end method/,
`.method public final hasPlus()Z
    .locals 1

    const/4 v0, 0x1

    return v0
.end method`);

  fs.writeFileSync(plusPaySmali, content, 'utf8');
  console.log('✓ [Plus] PlusPayUserStatus.smali (hasPlus) patched.');
}

// -------------------------------------------------------------
// 3. BLOCK TELEMETRY & log.strm.yandex.ru (Anti-Ban)
// -------------------------------------------------------------
const bqdSmali = path.join(decompiledDir, 'smali_classes5', 'bqd.smali');
if (fs.existsSync(bqdSmali)) {
  let content = fs.readFileSync(bqdSmali, 'utf8');
  content = content.replace(/https:\/\/log\.strm\.yandex\.ru\/perf/g, 'http://127.0.0.1/blocked');
  fs.writeFileSync(bqdSmali, content, 'utf8');
  console.log('✓ [Privacy] log.strm.yandex.ru/perf redirect patched in bqd.smali.');
}

const ftrSmali = path.join(decompiledDir, 'smali_classes6', 'ftr.smali');
if (fs.existsSync(ftrSmali)) {
  let content = fs.readFileSync(ftrSmali, 'utf8');
  content = content.replace(/log\.strm\.yandex\.ru/g, '127.0.0.1');
  fs.writeFileSync(ftrSmali, content, 'utf8');
  console.log('✓ [Privacy] log.strm.yandex.ru host redirect patched in ftr.smali.');
}

// -------------------------------------------------------------
// 4. AMOLED TRUE BLACK THEME IN RESOURCES
// -------------------------------------------------------------
function patchColors(xmlPath) {
  if (!fs.existsSync(xmlPath)) return;
  let content = fs.readFileSync(xmlPath, 'utf8');
  
  // Replace dark grey background colors with #000000
  content = content.replace(/<color name="([^"]*background[^"]*)">#[0-9a-fA-F]{6,8}<\/color>/gi, '<color name="$1">#ff000000</color>');
  content = content.replace(/<color name="([^"]*surface[^"]*)">#[0-9a-fA-F]{6,8}<\/color>/gi, '<color name="$1">#ff000000</color>');
  content = content.replace(/<color name="([^"]*black[^"]*)">#[0-9a-fA-F]{6,8}<\/color>/gi, '<color name="$1">#ff000000</color>');

  fs.writeFileSync(xmlPath, content, 'utf8');
  console.log(`✓ [AMOLED] Color palette patched in ${path.basename(xmlPath)}`);
}

patchColors(path.join(decompiledDir, 'res', 'values', 'colors.xml'));
patchColors(path.join(decompiledDir, 'res', 'values-night', 'colors.xml'));

console.log('\n=== ALL ANDROID PATCHES SUCCESSFULLY APPLIED ===');
