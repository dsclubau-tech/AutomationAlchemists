const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, '..', 'src', 'pages');
const compDir = path.join(__dirname, '..', 'src', 'components');

const adminFiles = [
  ...fs.readdirSync(adminDir).filter(f => f.startsWith('Admin')).map(f => path.join(adminDir, f)),
  path.join(compDir, 'AdminLayout.tsx')
];

console.log(`Auditing ${adminFiles.length} Admin files...`);

const colorRegex = /(?:bg-|text-|border-|from-|to-|via-|stroke-|fill-|ring-)(?:(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)-[0-9]+(?:\/[0-9]+)?|#[0-9a-fA-F]{3,8}|white|black|primary|background-dark|teal-900|teal-800|teal-700|teal-600|mint-50|yellow-accent)/g;

const results = [];

adminFiles.forEach(filePath => {
  const relPath = path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    
    // Check for hex codes
    const hexMatches = line.match(/#[0-9a-fA-F]{3,8}/g);
    if (hexMatches) {
      hexMatches.forEach(hex => {
        results.push({
          file: relPath,
          line: lineNum,
          value: hex,
          context: line.trim(),
          type: 'hex'
        });
      });
    }

    // Check for tailwind color classes
    const classMatches = line.match(/(?:className|class)\s*=\s*["'`]([^"'`]+)["'`]/g);
    if (classMatches) {
      classMatches.forEach(cm => {
        const tokens = cm.split(/\s+/);
        tokens.forEach(tok => {
          // Clean token
          const cleaned = tok.replace(/["'`]/g, '').replace(/^className=/, '').replace(/^class=/, '');
          
          // Detect specific colors
          if (
            cleaned.match(/^(?:bg|text|border)-(?:gray|zinc|slate|neutral|stone|red|green|blue|yellow|orange|purple|emerald|amber|indigo|rose|teal)-/) ||
            cleaned.match(/^#[0-9a-fA-F]{3,8}/) ||
            cleaned === 'text-white' ||
            cleaned === 'text-black' ||
            cleaned === 'bg-white' ||
            cleaned === 'bg-black' ||
            cleaned.includes('teal-') ||
            cleaned.includes('mint-') ||
            cleaned.includes('yellow-accent') ||
            cleaned.includes('background-dark') ||
            cleaned.includes('text-muted')
          ) {
            results.push({
              file: relPath,
              line: lineNum,
              value: cleaned,
              context: line.trim(),
              type: 'class'
            });
          }
        });
      });
    }
  });
});

console.log(`Total findings: ${results.length}`);
fs.writeFileSync(path.join(__dirname, 'admin_full_audit_raw.json'), JSON.stringify(results, null, 2));
