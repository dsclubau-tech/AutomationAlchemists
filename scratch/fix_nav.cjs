const fs = require('fs');
let content = fs.readFileSync('src/components/Navigation.tsx', 'utf8');

// Replace backgrounds
content = content.replace(/bg-\[#0F1219\]/g, 'bg-teal-900');
content = content.replace(/bg-\[#1C2128\]/g, 'bg-teal-900');
content = content.replace(/bg-\[#303645\]/g, 'bg-teal-800');

// Replace borders
content = content.replace(/border-\[#303645\]/g, 'border-teal-800');
content = content.replace(/border-\[#6B6DFF\]/g, 'border-teal-600');

// Replace texts
content = content.replace(/text-\[#6B6DFF\]/g, 'text-teal-600');

// Login button bg/hover
content = content.replace(/bg-\[#6B6DFF\] text-white/g, 'bg-yellow-accent text-teal-900');
content = content.replace(/hover:bg-\[#5a5ce6\]/g, 'hover:bg-yellow-accent/90');
content = content.replace(/bg-\[#6B6DFF\]/g, 'bg-yellow-accent text-teal-900'); // Remaining instances

// Clean up AvatarCircle double-text issue if it happened
content = content.replace(/text-teal-900 text-white/g, 'text-teal-900');

fs.writeFileSync('src/components/Navigation.tsx', content);
console.log('Navigation updated successfully.');
