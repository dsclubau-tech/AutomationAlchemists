const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, '..', 'src', 'pages');
const files = fs.readdirSync(adminDir).filter(f => f.startsWith('Admin') && f.endsWith('.tsx'));

console.log(`Auditing ${files.length} Admin pages for bg-teal-800/900 dark styling:`);

files.forEach(file => {
  const filePath = path.join(adminDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const count800 = (content.match(/bg-teal-800/g) || []).length;
  const count900 = (content.match(/bg-teal-900/g) || []).length;
  console.log(`- ${file}: bg-teal-800 (${count800}), bg-teal-900 (${count900})`);
});
