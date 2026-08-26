const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, '..', 'src', 'pages');
const targetFiles = [
  'AdminServices.tsx',
  'AdminPricing.tsx',
  'AdminLearn.tsx',
  'AdminContact.tsx',
  'AdminContactSubmissions.tsx',
  'AdminNewsletter.tsx',
  'AdminContent.tsx',
  'AdminAuditLog.tsx'
];

targetFiles.forEach(fileName => {
  const filePath = path.join(adminDir, fileName);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace DialogContent dark classes
  content = content.replace(/DialogContent className="([^"]*?)bg-teal-900([^"]*?)"/g, (match, p1, p2) => {
    let cls = `DialogContent className="${p1}bg-white text-teal-900 border border-teal-600/20 shadow-2xl${p2}"`;
    return cls.replace(/border-teal-600\/30/g, 'border-teal-600/20').replace(/text-white/g, 'text-teal-900');
  });

  // Replace SelectContent dark classes
  content = content.replace(/SelectContent className="([^"]*?)bg-teal-900([^"]*?)"/g, 'SelectContent className="bg-white border-teal-600/20 text-teal-900 shadow-xl"');

  // Replace SelectTrigger dark classes
  content = content.replace(/SelectTrigger className="([^"]*?)bg-background-dark([^"]*?)"/g, (match, p1, p2) => {
    return `SelectTrigger className="${p1}bg-white border-teal-600/20 text-teal-900${p2}"`;
  });

  // Replace Input / Textarea bg-background-dark
  content = content.replace(/className="([^"]*?)bg-background-dark([^"]*?)"/g, (match, p1, p2) => {
    let replaced = `${p1}bg-white border-teal-600/20 text-teal-900${p2}`
      .replace(/border-teal-600\/30/g, 'border-teal-600/20')
      .replace(/text-white/g, 'text-teal-900');
    return `className="${replaced}"`;
  });

  // Replace Card dark classes
  content = content.replace(/className="([^"]*?)bg-teal-800([^"]*?)"/g, (match, p1, p2) => {
    let replaced = `${p1}bg-white border border-teal-600/20 shadow-sm${p2}`
      .replace(/border-teal-600\/30/g, 'border-teal-600/20')
      .replace(/text-white/g, 'text-teal-900');
    return `className="${replaced}"`;
  });

  // Replace Label text-white
  content = content.replace(/<Label([^>]*)className="([^"]*?)text-white([^"]*?)"/g, '<Label$1className="$2text-teal-900 font-semibold$3"');
  content = content.replace(/<Label([^>]*)htmlFor="([^"]*)" className="text-white"/g, '<Label$1htmlFor="$2" className="text-teal-900 font-semibold"');
  content = content.replace(/<Label className="text-white"/g, '<Label className="text-teal-900 font-semibold"');

  // Replace CardTitle text-white
  content = content.replace(/<CardTitle className="([^"]*?)text-white([^"]*?)"/g, '<CardTitle className="$1text-teal-900 font-display$2"');
  content = content.replace(/<CardTitle className="text-white"/g, '<CardTitle className="text-teal-900 font-display"');
  content = content.replace(/<DialogTitle className="text-white"/g, '<DialogTitle className="text-teal-900 font-display"');

  // Replace primary CTA Buttons
  content = content.replace(/className="([^"]*?)bg-primary hover:bg-primary\/90 text-background-dark([^"]*?)"/g, 'className="$1bg-yellow-accent hover:bg-yellow-accent/90 text-teal-900 font-semibold shadow-sm$2"');
  content = content.replace(/className="([^"]*?)bg-primary text-background-dark hover:bg-primary\/90([^"]*?)"/g, 'className="$1bg-yellow-accent text-teal-900 font-semibold hover:bg-yellow-accent/90 shadow-sm$2"');

  // Replace Outline button text-white
  content = content.replace(/className="([^"]*?)border-teal-600\/30 text-white hover:bg-primary\/10([^"]*?)"/g, 'className="$1border-teal-600/30 text-teal-900 hover:bg-teal-600/10$2"');
  content = content.replace(/className="border-teal-600\/30 hover:bg-primary\/10 text-white"/g, 'className="border-teal-600/30 hover:bg-teal-600/10 text-teal-900"');

  // Replace table header / cell styles
  content = content.replace(/<TableHeader>/g, '<TableHeader className="bg-mint-50/50">');
  content = content.replace(/<TableRow className="border-teal-600\/30 hover:bg-primary\/5">/g, '<TableRow className="border-b border-teal-600/10 hover:bg-teal-600/5 transition-colors">');
  content = content.replace(/<TableHead className="text-text-muted">/g, '<TableHead className="text-teal-900 font-bold">');
  content = content.replace(/<TableCell className="font-medium text-white">/g, '<TableCell className="font-medium text-teal-900">');
  content = content.replace(/<TableCell className="text-white">/g, '<TableCell className="text-teal-900 font-medium">');

  // Replace text-text-muted
  content = content.replace(/text-text-muted/g, 'text-teal-900/70');
  content = content.replace(/text-primary/g, 'text-teal-600');

  // Clean duplicate spaces in className
  content = content.replace(/className="([^"]+)"/g, (m, p) => `className="${p.replace(/\s+/g, ' ').trim()}"`);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${fileName}`);
});
