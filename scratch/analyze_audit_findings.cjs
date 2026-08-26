const fs = require('fs');
const path = require('path');

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'admin_full_audit_raw.json'), 'utf8'));

// Filter unique items per file + line + value
const seen = new Set();
const uniqueFindings = [];

raw.forEach(item => {
  const key = `${item.file}:${item.line}:${item.value}`;
  if (!seen.has(key)) {
    seen.add(key);
    uniqueFindings.push(item);
  }
});

function classify(item) {
  const val = item.value;
  
  // Semantic status colors
  if (
    val.includes('red-') || val.includes('green-') || val.includes('emerald-') ||
    val.includes('yellow-') || val.includes('orange-') || val.includes('amber-') ||
    val.includes('blue-') || val.includes('purple-') || val.includes('indigo-') ||
    val.includes('rose-')
  ) {
    if (
      item.context.includes('Badge') ||
      item.context.includes('status') ||
      item.context.includes('Delete') ||
      item.context.includes('destructive') ||
      item.context.includes('Alert') ||
      item.context.includes('active') ||
      item.context.includes('expired') ||
      item.context.includes('canceled') ||
      item.context.includes('past_due') ||
      item.context.includes('revoked') ||
      item.context.includes('granted') ||
      item.context.includes('renewed') ||
      item.context.includes('error') ||
      item.context.includes('warning')
    ) {
      return 'Semantic (State Indicator - Keep)';
    }
  }

  // Tokens already applied
  if (
    val.includes('teal-900') || val.includes('teal-800') || val.includes('teal-700') ||
    val.includes('teal-600') || val.includes('mint-50') || val.includes('yellow-accent') ||
    val.includes('background-dark') || val.includes('text-muted') || val === 'primary' ||
    val.includes('primary/')
  ) {
    return 'Decorative (Token Already Aligned)';
  }

  // Hardcoded generic grays or raw hex
  if (
    val.includes('gray-') || val.includes('zinc-') || val.includes('slate-') ||
    val.includes('neutral-') || val.includes('stone-') || val.startsWith('#') ||
    val === 'bg-white' || val === 'bg-black'
  ) {
    return 'Decorative (Needs Token Migration)';
  }

  return 'Decorative (Brand/Neutral)';
}

const classified = uniqueFindings.map(item => ({
  ...item,
  category: classify(item)
}));

// Group by file
const byFile = {};
classified.forEach(item => {
  if (!byFile[item.file]) byFile[item.file] = [];
  byFile[item.file].push(item);
});

console.log("Files audited:");
Object.keys(byFile).forEach(f => {
  const needsMigration = byFile[f].filter(x => x.category === 'Decorative (Needs Token Migration)');
  const semantic = byFile[f].filter(x => x.category.startsWith('Semantic'));
  const aligned = byFile[f].filter(x => x.category === 'Decorative (Token Already Aligned)');
  console.log(`- ${f}: ${byFile[f].length} colors (${needsMigration.length} need migration, ${semantic.length} semantic, ${aligned.length} aligned)`);
});

fs.writeFileSync(path.join(__dirname, 'classified_audit.json'), JSON.stringify(byFile, null, 2));
