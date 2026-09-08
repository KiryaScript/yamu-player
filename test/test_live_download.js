const assert = require('assert');
const fs = require('fs');
const path = require('path');
const downloader = require('../src/mod/downloader');
const settings = require('../src/mod/settings');

console.log('=== RUNNING LIVE DOWNLOAD INTEGRATION TEST ===\n');

async function runLiveTest() {
  const testDir = path.join(__dirname, 'test_output');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  settings.update({ downloadPath: testDir, downloadQuality: 'mp3_320', embedTags: true });

  console.log('1. Testing public track download (Track ID 100001)...');
  const progressEvents = [];
  const trackRes = await downloader.downloadSingleTrack({ id: 100001 }, testDir, (p) => {
    progressEvents.push(p.percent);
  });

  console.log('  Track download result:', trackRes);
  assert(trackRes.success, 'Track download should succeed');
  assert(fs.existsSync(trackRes.filePath), 'Downloaded file must exist on disk');
  const stat = fs.statSync(trackRes.filePath);
  assert(stat.size > 10000, `Downloaded file size (${stat.size} bytes) must be > 10KB`);
  console.log(`  -> File successfully verified on disk: ${trackRes.filename} (${Math.round(stat.size / 1024)} KB)`);
  console.log(`  -> Progress events received: ${progressEvents.length} updates (min: ${Math.min(...progressEvents)}%, max: ${Math.max(...progressEvents)}%)`);

  console.log('\n2. Testing catalog search resolution for "Diagnose Fasching" without ID...');
  const diagnoseRes = await downloader.downloadSingleTrack({ title: 'Diagnose Fasching' }, testDir);
  console.log('  Track download result:', diagnoseRes);
  assert(diagnoseRes.success, 'Track download should succeed');
  assert(fs.existsSync(diagnoseRes.filePath), 'Downloaded file must exist on disk');
  const statDiagnose = fs.statSync(diagnoseRes.filePath);
  assert(statDiagnose.size > 10000, `Downloaded file size (${statDiagnose.size} bytes) must be > 10KB`);
  console.log(`  -> File successfully verified on disk: ${diagnoseRes.filename} (${Math.round(statDiagnose.size / 1024)} KB)`);

  console.log('\n3. Testing 404 / Non-existent track error handling...');
  try {
    await downloader.downloadSingleTrack({ id: 999999999999999 }, testDir);
    assert.fail('Should have thrown an error on non-existent track');
  } catch (err) {
    console.log('  -> Correctly rejected non-existent track with error:', err.message);
    assert(err.message, 'Must contain error message');
  }

  // Cleanup test files
  try {
    fs.rmSync(testDir, { recursive: true, force: true });
  } catch (e) {}

  console.log('\n=== LIVE DOWNLOAD INTEGRATION TEST PASSED! ===');
  process.exit(0);
}

runLiveTest().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
