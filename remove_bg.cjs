const Jimp = require('jimp');
const inputPath = 'C:/Users/dsclu/.gemini/antigravity-ide/brain/1468a4d9-e0b2-4980-9cba-98d10cc7f1c9/letter_a_logo_1786440349445.png';
const outputPath = 'C:/AutomationAlchemists/src/assets/logo.png';

Jimp.read(inputPath)
  .then(image => {
    // Make the white background transparent
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      // If the pixel is very light/white (r, g, b > 230)
      if (r > 230 && g > 230 && b > 230) {
        this.bitmap.data[idx + 3] = 0; // Set alpha to 0 (transparent)
      }
    });
    return image.writeAsync(outputPath);
  })
  .then(() => {
    console.log('Background removed successfully! Saved to:', outputPath);
  })
  .catch(err => {
    console.error('Error removing background:', err);
  });
