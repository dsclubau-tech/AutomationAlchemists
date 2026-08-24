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

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Case 1: Tools.tsx CTA
  if (file.endsWith('Tools.tsx')) {
    content = content.replace(
      'bg-[AMBIGUOUS_112E81] text-white font-label-md text-sm font-semibold px-8 py-3 rounded-full hover:shadow-lg hover:-translate-y-0.5',
      'bg-yellow-accent text-teal-900 font-label-md text-sm font-semibold px-8 py-3 rounded-full hover:bg-yellow-accent/90 hover:shadow-lg hover:-translate-y-0.5'
    );
  }

  // Case 2: Company.tsx CTA (fixing hover states and shadows)
  if (file.endsWith('Company.tsx')) {
    content = content.replace(
      'px-8 py-4 bg-[AMBIGUOUS_6B6DFF] text-white rounded-lg font-semibold text-sm hover:bg-[#5a5ce6] hover:shadow-lg hover:shadow-[#6B6DFF]/20',
      'px-8 py-4 bg-yellow-accent text-teal-900 rounded-lg font-semibold text-sm hover:bg-yellow-accent/90 hover:shadow-lg hover:shadow-yellow-accent/20'
    );
  }

  // Case 3: Index.tsx CTA
  if (file.endsWith('Index.tsx')) {
    content = content.replace(
      'bg-[AMBIGUOUS_112E81] text-white hover:bg-[AMBIGUOUS_112E81]/90',
      'bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90'
    );
  }

  // General decorative rule for ALL remaining AMBIGUOUS backgrounds
  // E.g., bg-[AMBIGUOUS_112E81]/30 -> bg-teal-600/30
  // selection:bg-[AMBIGUOUS_112E81] -> selection:bg-teal-600
  content = content.replace(/bg-\[AMBIGUOUS_[0-9A-Fa-f]+\]/g, 'bg-teal-600');

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
  }
}

console.log('Cleanup complete!');
