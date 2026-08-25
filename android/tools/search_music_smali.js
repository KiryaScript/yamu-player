const fs = require('fs');
const path = require('path');

const decompiledDir = 'D:/Desktop/yandex/android_mod/decompiled';
const smaliDirs = fs.readdirSync(decompiledDir)
  .filter(d => d.startsWith('smali'))
  .map(d => path.join(decompiledDir, d));

function searchMusicSmali(keyword) {
  console.log(`\n=== SEARCHING FOR: ${keyword} ===`);
  let matches = 0;
  for (const sDir of smaliDirs) {
    function walk(dir) {
      if (matches >= 20) return;
      const list = fs.readdirSync(dir);
      for (const item of list) {
        const full = path.join(dir, item);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          walk(full);
        } else if (item.endsWith('.smali')) {
          const content = fs.readFileSync(full, 'utf8');
          if (content.includes(keyword)) {
            matches++;
            console.log(`[${path.basename(sDir)}] ${full.replace(decompiledDir, '')}`);
            const lines = content.split('\n');
            lines.forEach((l, i) => {
              if (l.includes(keyword) && l.length < 150) {
                console.log(`   L${i+1}: ${l.trim()}`);
              }
            });
          }
        }
      }
    }
    walk(sDir);
  }
}

searchMusicSmali('hasPlus');
searchMusicSmali('log.strm.yandex.ru');
searchMusicSmali('isAvailableForDownload');
searchMusicSmali('Lossless');
searchMusicSmali('HIGH_QUALITY');
