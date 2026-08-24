const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src', 'pages');
const filesToMigrate = fs.readdirSync(srcDir)
  .filter(file => file.startsWith('Admin') || file === 'Dashboard.tsx' || file === 'Account.tsx' || file === 'AccountNotifications.tsx' || file === 'Billing.tsx' || file === 'Auth.tsx');

// Add AdminLayout.tsx
const adminLayout = path.join(__dirname, '..', 'src', 'components', 'AdminLayout.tsx');
if (fs.existsSync(adminLayout)) filesToMigrate.push('../components/AdminLayout.tsx');

const rules = [
  // #111 -> bg-teal-900 (Card background)
  { regex: /bg-\[#111\]/gi, replace: 'bg-teal-900' },
  { regex: /bg-\[#000\]/gi, replace: 'bg-teal-900' },
  { regex: /bg-\[#0A0A0A\]/gi, replace: 'bg-teal-900' },
  { regex: /bg-\[#1C1B1B\]/gi, replace: 'bg-teal-900' },

  // #1A1A1A -> bg-teal-800 (Nested Item background)
  { regex: /bg-\[#1[aA]1[aA]1[aA]\]/gi, replace: 'bg-teal-800' },
  
  // #2A2A2A -> border-teal-600/30 or bg-teal-600/30 (Borders, skeleton backgrounds, disabled buttons)
  { regex: /border-\[#2[aA]2[aA]2[aA]\]/gi, replace: 'border-teal-600/30' },
  { regex: /bg-\[#2[aA]2[aA]2[aA]\]/gi, replace: 'bg-teal-600/30' },
  
  // Gradients (Decorative) -> solid teal-800 to keep it clean, or map to tailwind gradient
  // Let's just remove the gradient and use bg-teal-800
  { regex: /bg-gradient-to-[a-z]+ from-\[#[a-zA-Z0-9]+\] to-\[#[a-zA-Z0-9]+\]/gi, replace: 'bg-teal-800' },
  { regex: /from-\[#1[aA]1[aA]1[aA]\] to-\[#222\]/gi, replace: 'bg-teal-800' },
  { regex: /from-\[#1[aA]1200\] to-\[#2[aA]1[fF]00\]/gi, replace: 'bg-teal-800' },

  // #4CAF50 -> emerald-500 (Semantic Success)
  { regex: /bg-\[#4[cC][aA][fF]50\]/gi, replace: 'bg-emerald-500' },
  { regex: /text-\[#4[cC][aA][fF]50\]/gi, replace: 'text-emerald-500' },
  { regex: /border-\[#4[cC][aA][fF]50\]/gi, replace: 'border-emerald-500' },

  // Semantic Destructive (Red) - keep as is, but if they use hardcoded hex like #FF4444 or #ef4444, leave them, or map to red-500
  { regex: /text-\[#ff4444\]/gi, replace: 'text-red-500' },
  { regex: /bg-\[#ff4444\]/gi, replace: 'bg-red-500' },
  { regex: /border-\[#ff4444\]/gi, replace: 'border-red-500' },

  // #D4AF37 (Gold)
  // For Buttons: bg-[#D4AF37] -> bg-yellow-accent text-teal-900
  { regex: /bg-\[#[dD]4[aA][fF]37\] text-white/gi, replace: 'bg-yellow-accent text-teal-900' },
  { regex: /bg-\[#[dD]4[aA][fF]37\]/gi, replace: 'bg-yellow-accent text-teal-900' },
  { regex: /hover:bg-\[#[cC]29[fF]2[fF]\]/gi, replace: 'hover:bg-yellow-accent/90' },
  
  // For Borders & Links: border-[#D4AF37], text-[#D4AF37] -> teal-600
  { regex: /border-\[#[dD]4[aA][fF]37\]/gi, replace: 'border-teal-600' },
  { regex: /text-\[#[dD]4[aA][fF]37\]/gi, replace: 'text-teal-600' },
  { regex: /text-\[#[cC]29[fF]2[fF]\]/gi, replace: 'text-teal-600' },
  
  // Same for any hover states on gold borders
  { regex: /hover:border-\[#[dD]4[aA][fF]37\]/gi, replace: 'hover:border-teal-600' },
  { regex: /hover:text-\[#[dD]4[aA][fF]37\]/gi, replace: 'hover:text-teal-600' },
];

filesToMigrate.forEach(file => {
  const fullPath = path.join(srcDir, file);
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;

  rules.forEach(rule => {
    if (rule.regex.test(content)) {
      content = content.replace(rule.regex, rule.replace);
      changed = true;
    }
  });

  // Clean up any double-text definitions from the replacement
  if (changed) {
     content = content.replace(/text-teal-900 text-white/g, 'text-teal-900');
     content = content.replace(/text-white text-teal-900/g, 'text-teal-900');
     content = content.replace(/text-teal-900 text-\[#\w+\]/g, 'text-teal-900');
     fs.writeFileSync(fullPath, content);
     console.log('Migrated', file);
  }
});
