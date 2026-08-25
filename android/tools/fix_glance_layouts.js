const fs = require('fs');
const path = require('path');

console.log('=== FIXING GLANCE LAYOUT ATTRIBUTES ===');

// 1. Add attr to attrs.xml
const attrsPath = path.join(__dirname, '..', 'decompiled', 'res', 'values', 'attrs.xml');
if (fs.existsSync(attrsPath)) {
  let attrs = fs.readFileSync(attrsPath, 'utf8');
  if (!attrs.includes('glance_isTopLevelLayout')) {
    attrs = attrs.replace('<resources>', '<resources>\n    <attr name="glance_isTopLevelLayout" format="boolean" />');
    fs.writeFileSync(attrsPath, attrs, 'utf8');
    console.log('✓ Added glance_isTopLevelLayout to attrs.xml');
  }
}

// 2. Strip app:glance_isTopLevelLayout from glance layout files
const layoutDir = path.join(__dirname, '..', 'decompiled', 'res', 'layout');
if (fs.existsSync(layoutDir)) {
  const files = fs.readdirSync(layoutDir);
  let fixed = 0;
  for (const file of files) {
    if (file.startsWith('glance_') && file.endsWith('.xml')) {
      const full = path.join(layoutDir, file);
      let c = fs.readFileSync(full, 'utf8');
      if (c.includes('glance_isTopLevelLayout')) {
        c = c.replace(/app:glance_isTopLevelLayout="[^"]*"/g, '');
        fs.writeFileSync(full, c, 'utf8');
        fixed++;
      }
    }
  }
  console.log(`✓ Cleaned ${fixed} glance layout files`);
}

console.log('=== GLANCE FIX COMPLETE ===');
