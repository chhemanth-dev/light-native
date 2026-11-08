/**
 * Icon generator script - converts SVG to required PNG formats
 * Run with: node generate-icons.js
 */

const fs = require('fs');
const {exec} = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const sizes = {
  'icon.png': 1024,
  'adaptive-icon.png': 1024,
  'notification-icon.png': 96,
  'splash.png': 1284
};

async function generateIcons() {
  console.log('📱 Generating app icons...');
  
  const svgPath = './assets/icon-light-rays.svg';
  
  if (!fs.existsSync(svgPath)) {
    console.error('❌ SVG file not found:', svgPath);
    process.exit(1);
  }

  // Try using @resvg/resvg-js (pure JS, no native deps)
  try {
    console.log('Installing @resvg/resvg-js...');
    await execPromise('npm install --no-save @resvg/resvg-js');
    
    const { Resvg } = require('@resvg/resvg-js');
    const svgData = fs.readFileSync(svgPath);
    
    for (const [filename, size] of Object.entries(sizes)) {
      console.log(`Generating ${filename} (${size}x${size})...`);
      
      const resvg = new Resvg(svgData, {
        fitTo: {
          mode: 'width',
          value: size,
        },
      });
      
      const pngData = resvg.render();
      const pngBuffer = pngData.asPng();
      
      const outputPath = `./assets/${filename}`;
      fs.writeFileSync(outputPath, pngBuffer);
      console.log(`✅ Created ${filename}`);
    }
    
    console.log('✨ All icons generated successfully!');
  } catch (error) {
    console.error('❌ Failed to generate icons:', error.message);
    console.log('\n📝 Alternative: Use an online SVG to PNG converter:');
    console.log('   1. Go to https://cloudconvert.com/svg-to-png');
    console.log('   2. Upload assets/icon-new.svg');
    console.log('   3. Set dimensions to 1024x1024');
    console.log('   4. Download and save as assets/icon.png');
    console.log('   5. Repeat for other sizes');
    process.exit(1);
  }
}

generateIcons();
