const fs = require('fs');
const path = require('path');
const srcDir = path.join(__dirname, '..', 'src');
const adminFiles = ['Admin', 'Dashboard', 'Account', 'Auth', 'Billing'];

function findAdminFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findAdminFiles(fullPath, fileList);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const rel = fullPath.replace(__dirname, '');
      if (adminFiles.some(af => rel.includes(af))) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

const files = findAdminFiles(srcDir);
let report = '# Admin Panel Hardcoded Styles Audit\n\n| File | Line | Hardcoded value | Property |\n| :--- | :--- | :--- | :--- |\n';
const uniqueHexes = new Set();

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const regex = /([a-z0-9\-]+)-\[#([0-9A-Fa-f]{3,6})\]/gi;
  
  lines.forEach((line, index) => {
    let match;
    while ((match = regex.exec(line)) !== null) {
      report += `| ${path.basename(file)} | ${index + 1} | \`${match[0]}\` | ${match[1]} |\n`;
      uniqueHexes.add(match[2].toUpperCase());
    }
  });
});

fs.writeFileSync(path.join(__dirname, 'admin_audit_report.md'), report);
console.log('Unique hexes in Admin:', [...uniqueHexes]);
