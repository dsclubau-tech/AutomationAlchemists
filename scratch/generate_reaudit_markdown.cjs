const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'classified_audit.json'), 'utf8'));

let output = '';

output += '# Full Re-Audit of Admin Panel Components & Color Tokens\n\n';
output += '## 1. Structural Shades & Interactive Elevation Roles\n\n';
output += '| Original Shade | UI Role | Token Mapping | Purpose & Distinction |\n';
output += '|:---|:---|:---|:---|\n';
output += '| `#111` / `#0a0a0a` | **Layer 0: Page Root & Inputs** | `bg-background-dark` | Deepest backdrop behind cards; inner input fields (`bg-background-dark border-teal-600/30`). |\n';
output += '| `#1A1A1A` | **Layer 1: Card & Panel Surface** | `bg-teal-800` | Primary container cards, section panels, and modal content bodies (`bg-teal-800 border-teal-600/30`). |\n';
output += '| `#2A2A2A` | **Layer 2: Hover, Floating & Sub-surfaces** | `hover:bg-primary/5`, `bg-teal-950`, `hover:bg-primary/20` | Interactive elevation — table row hover (`hover:bg-primary/5`), floating dropdowns (`bg-teal-950 border-teal-600/50`), and nested timeline cards (`bg-background-dark/70`). **Never collapsed into Layer 1.** |\n\n';

output += '## 2. Hardcoded & Semantic Colors by File\n\n';

Object.keys(data).forEach(file => {
  output += `### \`${file}\`\n\n`;
  output += '| Line | Value | Where Used / Context | Category |\n';
  output += '|:---:|:---|:---|:---|\n';
  
  data[file].forEach(item => {
    output += `| ${item.line} | \`${item.value}\` | \`${item.context.slice(0, 60).replace(/\|/g, '\\|')}\` | ${item.category} |\n`;
  });
  
  output += '\n';
});

fs.writeFileSync(path.join(__dirname, 'full_admin_reaudit_table.md'), output);
console.log('Written full_admin_reaudit_table.md');
