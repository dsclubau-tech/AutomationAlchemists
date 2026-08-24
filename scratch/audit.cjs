const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function findFiles(dir, extList, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findFiles(fullPath, extList, fileList);
    } else {
      if (extList.some(ext => fullPath.endsWith(ext))) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

const files = findFiles(srcDir, ['.tsx', '.ts']);
let markdown = `# Hardcoded Styles Audit Report\n\n`;
markdown += `| File | Line | Hardcoded value | Should reference |\n`;
markdown += `| :--- | :--- | :--- | :--- |\n`;

for (const file of files) {
  const relativePath = path.relative(__dirname, file).replace(/\\/g, '/');
  if (relativePath.startsWith('src/assets/')) continue; // Skip raw HTML themes

  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Match Tailwind arbitrary values like bg-[#0A0C10], w-[400px], text-[15px]
    const arbitraryMatches = [...line.matchAll(/(?:\s|['"`])([a-z0-9\-]+)-\[([^\]]+)\]/g)];
    
    // Match inline styles like style={{ color: '#FFF' }}
    const inlineMatches = [...line.matchAll(/style=\{\{([^}]+)\}\}/g)];

    arbitraryMatches.forEach(match => {
        const fullClass = match[1] + '-[' + match[2] + ']';
        const prop = match[1];
        const val = match[2];
        
        let rec = "Semantic token (e.g. teal-900, section-y, spacing scale)";
        if (val.toUpperCase() === '#0A0C10' && prop.includes('bg')) rec = "bg-teal-900";
        if (val.toUpperCase() === '#1C2128' && prop.includes('bg')) rec = "bg-teal-800";
        if (val.toUpperCase() === '#6B6DFF' && prop.includes('text')) rec = "text-teal-600";
        if (val.toUpperCase() === '#6B6DFF' && prop.includes('bg')) rec = "bg-teal-600";
        if (val.toUpperCase() === '#303645' && prop.includes('border')) rec = "border-teal-800 (or new border token)";
        
        markdown += `| ${relativePath} | ${index + 1} | \`${fullClass}\` | \`${rec}\` |\n`;
    });

    inlineMatches.forEach(match => {
        markdown += `| ${relativePath} | ${index + 1} | \`style={{${match[1]}}}\` | Tailwind utility classes |\n`;
    });
  });
}

fs.writeFileSync(path.join(__dirname, 'audit_report.md'), markdown);
console.log('Done');
