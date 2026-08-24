const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, '..', 'src', 'assets', 'l1.png');
const outputPath = path.join(__dirname, '..', 'src', 'assets', 'logo.png');

async function cropAndRemoveBackground() {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    console.log(`Input: ${metadata.width}x${metadata.height}`);
    
    // Step 1: Crop to remove the watermark in bottom-right.
    // The watermark star is roughly in the bottom 12% and right 12% of the image.
    // Crop generously from all sides to also remove the excess black padding.
    const cropLeft = Math.round(metadata.width * 0.08);
    const cropTop = Math.round(metadata.height * 0.05);
    const cropWidth = Math.round(metadata.width * 0.82);
    const cropHeight = Math.round(metadata.height * 0.82);
    
    console.log(`Cropping to: left=${cropLeft}, top=${cropTop}, ${cropWidth}x${cropHeight}`);
    
    const { data, info } = await sharp(inputPath)
        .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
        .raw()
        .toBuffer({ resolveWithObject: true });
    
    const width = info.width;
    const height = info.height;
    const channels = info.channels;
    
    console.log(`Cropped: ${width}x${height}, ${channels} channels`);
    
    // Step 2: Remove black background using saturation-aware approach
    const newData = Buffer.alloc(width * height * 4);
    
    for (let i = 0; i < width * height; i++) {
        const srcIdx = i * channels;
        const dstIdx = i * 4;
        
        const r = data[srcIdx];
        const g = data[srcIdx + 1];
        const b = data[srcIdx + 2];
        
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const saturation = maxC === 0 ? 0 : (maxC - minC) / maxC;
        
        // Black background: very dark AND neutral (no color saturation)
        const isBlackBg = (maxC < 30) || (maxC < 55 && saturation < 0.15);
        
        if (isBlackBg) {
            newData[dstIdx] = 0;
            newData[dstIdx + 1] = 0;
            newData[dstIdx + 2] = 0;
            newData[dstIdx + 3] = 0;
        } else if (maxC < 70 && saturation < 0.2) {
            // Anti-aliased edge transition
            const alpha = Math.min(255, Math.round(((maxC - 30) / 40) * 255));
            newData[dstIdx] = r;
            newData[dstIdx + 1] = g;
            newData[dstIdx + 2] = b;
            newData[dstIdx + 3] = Math.max(0, alpha);
        } else {
            newData[dstIdx] = r;
            newData[dstIdx + 1] = g;
            newData[dstIdx + 2] = b;
            newData[dstIdx + 3] = 255;
        }
    }
    
    // Step 3: Save as PNG with transparency
    await sharp(newData, {
        raw: { width, height, channels: 4 }
    })
    .png()
    .toFile(outputPath);
    
    console.log(`Output saved to: ${outputPath}`);
    console.log('Cropped + background removed successfully!');
}

cropAndRemoveBackground().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
