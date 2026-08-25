const fs = require('fs');
const path = require('path');
const https = require('https');

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${path.basename(destPath)} from ${url}...`);
    const file = fs.createWriteStream(destPath);
    
    function get(currentUrl) {
      https.get(currentUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Failed to download ${url}: status ${res.statusCode}`));
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close(() => {
            console.log(`✓ Finished ${path.basename(destPath)} (${fs.statSync(destPath).size} bytes)`);
            resolve();
          });
        });
      }).on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    }

    get(url);
  });
}

(async () => {
  const toolsDir = __dirname;
  const apktoolJar = path.join(toolsDir, 'apktool.jar');
  const signerJar = path.join(toolsDir, 'uber-apk-signer.jar');

  try {
    if (!fs.existsSync(apktoolJar) || fs.statSync(apktoolJar).size < 1000000) {
      await downloadFile('https://github.com/iBotPeaches/Apktool/releases/download/v2.9.3/apktool_2.9.3.jar', apktoolJar);
    } else {
      console.log('✓ apktool.jar already present.');
    }

    if (!fs.existsSync(signerJar) || fs.statSync(signerJar).size < 1000000) {
      await downloadFile('https://github.com/patrickfav/uber-apk-signer/releases/download/v1.3.0/uber-apk-signer-1.3.0.jar', signerJar);
    } else {
      console.log('✓ uber-apk-signer.jar already present.');
    }

    console.log('\nAll Android modding tools are ready!');
  } catch (err) {
    console.error('Download error:', err.message);
    process.exit(1);
  }
})();
