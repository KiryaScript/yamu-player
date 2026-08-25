const fs = require('fs');
const path = require('path');

const decompiledDir = 'D:/Desktop/yandex/android_mod/decompiled';
const smaliDirs = fs.readdirSync(decompiledDir)
  .filter(d => d.startsWith('smali'))
  .map(d => path.join(decompiledDir, d));

console.log(`Searching across ${smaliDirs.length} smali directories...`);

function searchFiles(dirs, predicate) {
  const matches = [];
  function walk(dir) {
    const list = fs.readdirSync(dir);
    for (const item of list) {
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (item.endsWith('.smali')) {
        predicate(full, item, matches);
      }
    }
  }
  dirs.forEach(walk);
  return matches;
}

// 1. Search for Plus / Subscription classes
console.log('\n--- 1. SUBSCRIPTION & PLUS SMALI CLASSES ---');
const subMatches = searchFiles(smaliDirs, (full, item, matches) => {
  if (item.toLowerCase().includes('subscription') || item.toLowerCase().includes('plus') || item.toLowerCase().includes('accountstatus')) {
    if (!item.includes('$') && matches.length < 25) {
      matches.push(full.replace('D:\\Desktop\\yandex\\android_mod\\decompiled\\', ''));
    }
  }
});
subMatches.forEach(m => console.log(' ', m));

// 2. Search for method definitions .method public hasPlus() or isPlus
console.log('\n--- 2. METHODS: hasPlus / isPlus / hasSubscription ---');
let methodCount = 0;
searchFiles(smaliDirs, (full, item, matches) => {
  if (methodCount >= 20) return;
  const content = fs.readFileSync(full, 'utf8');
  if (content.includes('hasPlus()Z') || content.includes('isPlus()Z') || content.includes('hasSubscription()Z') || content.includes('isPlusSubscribed()Z')) {
    methodCount++;
    console.log('  Found in:', path.basename(full));
    const lines = content.split('\n');
    lines.forEach((l, idx) => {
      if (l.includes('hasPlus()Z') || l.includes('isPlus()Z') || l.includes('hasSubscription()Z')) {
        console.log(`    L${idx+1}: ${l.trim()}`);
      }
    });
  }
});
