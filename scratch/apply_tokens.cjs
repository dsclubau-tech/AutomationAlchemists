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

// Excluded files
const EXCLUDED = [
  'Admin', 'Dashboard', 'Account', 'Auth', 'Navigation.tsx', 'Billing.tsx'
];

let report = `# Token Replacement Verification Report\n\n`;
report += `| File | Line | Original Class | New Class | Reasoning/Trigger |\n`;
report += `| :--- | :--- | :--- | :--- | :--- |\n`;

let manualReviews = 0;

for (const file of files) {
  const relativePath = path.relative(path.join(__dirname, '..'), file).replace(/\\/g, '/');
  
  // Skip excluded files and raw HTML assets
  if (relativePath.startsWith('src/assets/')) continue;
  if (EXCLUDED.some(ex => relativePath.includes(ex))) continue;

  let content = fs.readFileSync(file, 'utf8');
  let lines = content.split('\n');
  let modified = false;

  lines.forEach((line, index) => {
    let newLine = line;
    // We only process className strings to be safe
    // Since classNames can span multiple lines, simple regex replacement on bg-[...] text-[...] is safer, 
    // but we need context of the *entire* line at minimum to detect CTA vs Card.
    // Most classNames in this codebase are single-line.
    
    // Find all Tailwind arbitrary values in the line
    const arbitraryRegex = /([a-z0-9\-]+)-\[#([0-9a-fA-F]+)\]/gi;
    const matches = [...newLine.matchAll(arbitraryRegex)];
    
    for (const match of matches) {
      const fullClass = match[0];
      const prop = match[1];
      const hex = match[2].toUpperCase();
      
      let replacement = null;
      let trigger = null;

      // Double-duty background accents
      const doubleDutyAccents = ['112E81', '6B6DFF', '5152B9', '4259AC', 'D4AF37'];

      if (prop === 'bg' && doubleDutyAccents.includes(hex)) {
        // Disambiguate context
        const isCTA = /(hover:bg-|text-center).*?(px-[0-9]+|py-[0-9]+)/.test(line) || /flex-1 text-center/.test(line);
        const isCard = /(p-[89]|p-1[0-9]|rounded-3xl|shadow-2xl)/.test(line);

        if (isCTA && !isCard) {
          replacement = `bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90`;
          trigger = 'Matched CTA signals (padding + hover/center), no card signals';
          // Strip conflicting text-white if replacing with text-teal-900
          newLine = newLine.replace(/\btext-white\b/g, '');
        } else if (isCard && !isCTA) {
          replacement = `bg-teal-800`;
          trigger = 'Matched Card signals (p-8+, rounded-3xl, etc), no CTA signals';
        } else {
          // AMBIGUOUS!
          replacement = `bg-[AMBIGUOUS_${hex}]`;
          trigger = `MANUAL_REVIEW (isCTA: ${isCTA}, isCard: ${isCard})`;
          manualReviews++;
        }
      } 
      // Safe defaults for others
      else if (prop === 'bg') {
        if (['0A0C10', '1C1B1B', '000000', '0F0F0F', '0A0A0A', '111', '222'].includes(hex)) {
          replacement = 'bg-teal-900'; trigger = 'Deep Dark Mapping';
        } else if (['1C2128', '0F1219', '303645', '1A1A1A', '2A2A2A'].includes(hex)) {
          replacement = 'bg-teal-800'; trigger = 'Elevated Surface Mapping';
        } else if (['EBF4F4', 'FFFFFF', 'FFF', 'F6F3F2', 'E5E2E1'].includes(hex)) {
          replacement = 'bg-mint-50'; trigger = 'Light Mapping';
        }
      }
      else if (prop === 'text') {
        if (doubleDutyAccents.includes(hex)) {
          replacement = 'text-teal-600'; trigger = 'Accent Text Mapping';
        } else if (['FFFFFF', 'FFF', 'EAEAEA'].includes(hex)) {
          replacement = 'text-white'; trigger = 'White Text Mapping';
        } else if (['0A0C10', '1C1B1B'].includes(hex)) {
          replacement = 'text-teal-900'; trigger = 'Dark Text Mapping';
        }
      }
      else if (prop === 'border') {
        if (doubleDutyAccents.includes(hex) || ['303645'].includes(hex)) {
          replacement = 'border-teal-800'; trigger = 'Dark Border Mapping';
        }
      }

      if (replacement) {
        newLine = newLine.replace(fullClass, replacement);
        // Clean up any double spaces from stripping text-white
        newLine = newLine.replace(/\s{2,}/g, ' '); 
        
        report += `| ${relativePath} | ${index + 1} | \`${fullClass}\` | \`${replacement}\` | ${trigger} |\n`;
        modified = true;
      }
    }
    
    lines[index] = newLine;
  });

  if (modified) {
    fs.writeFileSync(file, lines.join('\n'));
  }
}

fs.writeFileSync(path.join(__dirname, 'verification_report.md'), report);
console.log(`Done. Ambiguous cases requiring manual review: ${manualReviews}`);
