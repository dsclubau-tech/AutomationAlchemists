const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (file.endsWith('.tsx')) {
      results.push(filePath);
    }
  });
  return results;
}

const targetHexes = ['#00195c', '#444651', '#c5c5d3', '#3354f4', '#dce1ff', '#a1a1aa'];
const files = walk(path.join(__dirname, '..', 'src'));

console.log(`Checking ${files.length} .tsx files for legacy target hexes:`, targetHexes);

let foundCount = 0;
files.forEach(filePath => {
  const relPath = path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    targetHexes.forEach(target => {
      if (line.toLowerCase().includes(target)) {
        foundCount++;
        console.log(`[LEAK FOUND] ${relPath}:${idx + 1} -> ${line.trim()}`);
      }
    });
  });
});

console.log(`\n=======================================================`);
console.log(`TOTAL LEAK OCCURRENCES REMAINING: ${foundCount}`);
console.log(`=======================================================`);
