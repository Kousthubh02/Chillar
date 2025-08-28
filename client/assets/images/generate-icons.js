const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Function to create a dollar icon
function createDollarIcon(size, filename) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background circle with gradient effect
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.4;
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#2E8B57');
    gradient.addColorStop(0.5, '#32CD32');
    gradient.addColorStop(1, '#90EE90');
    
    // Draw background circle
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add border
    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = size * 0.02;
    ctx.stroke();
    
    // Draw dollar sign
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add shadow effect
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = size * 0.01;
    ctx.shadowOffsetX = size * 0.008;
    ctx.shadowOffsetY = size * 0.008;
    
    ctx.fillText('$', centerX, centerY);
    
    // Save the image
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filename, buffer);
    console.log(`✅ Created ${filename} (${size}x${size})`);
}

// Create the icons
try {
    const assetsPath = path.join(__dirname);
    
    // Main app icon (512x512)
    createDollarIcon(512, path.join(assetsPath, 'icon.png'));
    
    // Adaptive icon (108x108)
    createDollarIcon(108, path.join(assetsPath, 'adaptive-icon.png'));
    
    // Favicon (32x32)
    createDollarIcon(32, path.join(assetsPath, 'favicon.png'));
    
    // Splash icon (200x200)
    createDollarIcon(200, path.join(assetsPath, 'splash-icon.png'));
    
    console.log('🎉 All dollar icons created successfully!');
    console.log('📱 Restart your Expo development server to see the new icons.');
    
} catch (error) {
    console.error('❌ Error creating icons:', error.message);
    console.log('💡 Make sure to install the canvas package:');
    console.log('   npm install canvas');
    console.log('');
    console.log('🔧 Alternative: Use the HTML file method:');
    console.log('   1. Open generate-dollar-icon.html in your browser');
    console.log('   2. Right-click on each icon and save as PNG');
    console.log('   3. Replace the existing icon files');
}
