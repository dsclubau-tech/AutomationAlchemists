const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, '..', 'src'));
console.log(`Scanning ${files.length} TypeScript files in src/...`);

const findings = [];

files.forEach(filePath => {
  const relPath = path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Check for hardcoded hex codes like #00195c, #444651, #4647AE, #c5c5d3, #A1A1AA, #0A0C10, #...
    const hexes = line.match(/#[0-9a-fA-F]{3,8}/g);
    if (hexes) {
      hexes.forEach(h => {
        findings.push({
          file: relPath,
          line: idx + 1,
          hex: h,
          text: line.trim()
        });
      });
    }
  });
});

console.log(`Found ${findings.length} hex code occurrences.`);

const unapprovedHexes = findings.filter(f => {
  const h = f.hex.toLowerCase();
  // Approved palette: #0A363D, #104B54, #18606B, #207680, #2A8E9A, #EBF4F4, #D6E8E8, #B5D6D6, #FFD200, #FFE04D, #FFFFFF, #000000, #FFF, #000
  const approved = ['#0a363d', '#104b54', '#18606b', '#207680', '#2a8e9a', '#ebf4f4', '#d6e8e8', '#b5d6d6', '#ffd200', '#ffe04d', '#ffffff', '#000000', '#fff', '#000'];
  return !approved.includes(h);
});

console.log(`Unapproved hex occurrences: ${unapprovedHexes.length}`);
const byFile = {};
unapprovedHexes.forEach(u => {
  if (!byFile[u.file]) byFile[u.file] = [];
  byFile[u.file].push(u);
});

Object.keys(byFile).forEach(f => {
  console.log(`\n--- ${f} (${byFile[f].length} occurrences) ---`);
  byFile[f].slice(0, 10).forEach(x => {
    console.log(`  Line ${x.line}: ${x.hex} => ${x.text.slice(0, 80)}`);
  });
});

fs.writeFileSync(path.join(__dirname, 'unapproved_hexes.json'), JSON.stringify(byFile, null, 2));
