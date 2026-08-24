const fs = require('fs');
const path = require('path');
const srcDir = path.join(__dirname, '..', 'src');

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findFiles(fullPath, fileList);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const files = findFiles(srcDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('-mint-50')) {
    // Replace incorrectly generated "-mint-50" with "bg-mint-50"
    content = content.replace(/ -mint-50/g, ' bg-mint-50');
    content = content.replace(/\"-mint-50/g, '\"bg-mint-50');
    // For to-[#aaccd6], it would have become "to-mint-50" if the regex matched, 
    // wait, the regex was /([a-z0-9\-]+)-\[#[aA][aA][cC][cC][dD]6\]/g
    // If it was to-[#aaccd6], $1 would be "to", so the replacement string "$1-mint-50" became "-mint-50" (because $1 evaluated to empty in PowerShell). 
    // Wait, if it was to-[#aaccd6], it ALSO became "-mint-50"!
    // But since it's only in one file (ToolDetail.tsx gradient), let's just use bg-mint-50 for now, then manually check.
    
    fs.writeFileSync(file, content);
    console.log('Fixed', path.basename(file));
  }
});
