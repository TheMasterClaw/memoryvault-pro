import axios from 'axios';
import fs from 'fs';
import path from 'path';

const COMFYUI_API_KEY = 'comfyui-13552044d642ad129e7f69ffb50bc077b759ce7912b18ff9a777923d5515e4d7';
const COMFYUI_ENDPOINT = 'https://api.comfyui.com/v1/generate';

// Generate cyberpunk hero image for MemoryVault
async function generateHeroImage() {
  console.log('🎨 Generating hero image...');
  
  try {
    const response = await axios.post(COMFYUI_ENDPOINT, {
      prompt: 'Cyberpunk vault, neon blue and purple lights, digital memory storage, futuristic secure vault with holographic interfaces, dark background with glowing circuit patterns, high tech data center aesthetic, cinematic lighting, 4k quality',
      width: 1920,
      height: 1080,
      seed: Math.floor(Math.random() * 1000000),
      model: 'sd-xl'
    }, {
      headers: {
        'Authorization': `Bearer ${COMFYUI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'
    });
    
    const outputPath = path.join(process.cwd(), 'public', 'hero.png');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, Buffer.from(response.data));
    console.log('✅ Hero image saved to public/hero.png');
    return 'public/hero.png';
  } catch (error) {
    console.error('❌ Failed to generate hero image:', error.message);
    // Return a placeholder
    return null;
  }
}

// Generate NFT card design
async function generateNFTCard() {
  console.log('🎨 Generating NFT card design...');
  
  try {
    const response = await axios.post(COMFYUI_ENDPOINT, {
      prompt: 'Digital NFT access card, cyberpunk style, holographic badge, neon cyan and magenta gradient, blockchain elements, secure access credential design, futuristic ID card with glowing edges, premium metallic finish',
      width: 1024,
      height: 1024,
      seed: Math.floor(Math.random() * 1000000),
      model: 'sd-xl'
    }, {
      headers: {
        'Authorization': `Bearer ${COMFYUI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'
    });
    
    const outputPath = path.join(process.cwd(), 'public', 'nft-card.png');
    fs.writeFileSync(outputPath, Buffer.from(response.data));
    console.log('✅ NFT card saved to public/nft-card.png');
    return 'public/nft-card.png';
  } catch (error) {
    console.error('❌ Failed to generate NFT card:', error.message);
    return null;
  }
}

// Generate logo
async function generateLogo() {
  console.log('🎨 Generating logo...');
  
  try {
    const response = await axios.post(COMFYUI_ENDPOINT, {
      prompt: 'MemoryVault Pro logo, minimalist design, brain with digital circuits, shield for security, gradient from cyan to purple, clean vector style, modern tech logo, simple geometric shapes',
      width: 512,
      height: 512,
      seed: Math.floor(Math.random() * 1000000),
      model: 'sd-xl'
    }, {
      headers: {
        'Authorization': `Bearer ${COMFYUI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'
    });
    
    const outputPath = path.join(process.cwd(), 'public', 'logo.png');
    fs.writeFileSync(outputPath, Buffer.from(response.data));
    console.log('✅ Logo saved to public/logo.png');
    return 'public/logo.png';
  } catch (error) {
    console.error('❌ Failed to generate logo:', error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting artwork generation...');
  console.log('================================');
  
  // Try to generate all images
  const results = await Promise.all([
    generateHeroImage(),
    generateNFTCard(),
    generateLogo()
  ]);
  
  console.log('================================');
  console.log('✨ Artwork generation complete!');
  console.log('');
  
  // Create placeholder SVGs if generation failed
  const publicDir = path.join(process.cwd(), 'public');
  fs.mkdirSync(publicDir, { recursive: true });
  
  if (!results[0]) {
    // Create placeholder hero
    const heroSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a1a;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#1a1a3e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#162244;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#00ffff;stop-opacity:0.8" />
      <stop offset="50%" style="stop-color:#ff00ff;stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:#00ffff;stop-opacity:0.8" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <text x="50%" y="45%" font-family="monospace" font-size="72" fill="url(#glow)" text-anchor="middle" font-weight="bold">MemoryVault Pro</text>
  <text x="50%" y="55%" font-family="monospace" font-size="32" fill="#00ffff" text-anchor="middle">Decentralized AI Memory on Base Sepolia</text>
  <circle cx="200" cy="200" r="150" fill="none" stroke="#00ffff" stroke-width="2" opacity="0.3"/>
  <circle cx="1720" cy="880" r="200" fill="none" stroke="#ff00ff" stroke-width="2" opacity="0.3"/>
</svg>`;
    fs.writeFileSync(path.join(publicDir, 'hero.svg'), heroSVG);
    console.log('✅ Placeholder hero.svg created');
  }
  
  if (!results[1]) {
    // Create placeholder NFT card
    const nftSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a0a2e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2d1b4e;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="border" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff0080;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8000ff;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#cardBg)" rx="50"/>
  <rect x="20" y="20" width="984" height="984" fill="none" stroke="url(#border)" stroke-width="8" rx="40"/>
  <text x="50%" y="40%" font-family="monospace" font-size="48" fill="#ff0080" text-anchor="middle" font-weight="bold">MVAULT ACCESS</text>
  <text x="50%" y="55%" font-family="monospace" font-size="36" fill="#ffffff" text-anchor="middle">Credential #001</text>
  <circle cx="512" cy="750" r="80" fill="none" stroke="#ff0080" stroke-width="4"/>
  <text x="512" y="765" font-family="monospace" font-size="24" fill="#ff0080" text-anchor="middle">🔐</text>
</svg>`;
    fs.writeFileSync(path.join(publicDir, 'nft-card.svg'), nftSVG);
    console.log('✅ Placeholder nft-card.svg created');
  }
  
  if (!results[2]) {
    // Create placeholder logo
    const logoSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00ffff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ff0080;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="256" cy="256" r="240" fill="none" stroke="url(#logoGrad)" stroke-width="16"/>
  <path d="M 256 80 L 256 200 M 256 312 L 256 432 M 120 256 L 240 256 M 272 256 L 392 256" stroke="url(#logoGrad)" stroke-width="24" stroke-linecap="round"/>
  <circle cx="256" cy="256" r="40" fill="url(#logoGrad)"/>
</svg>`;
    fs.writeFileSync(path.join(publicDir, 'logo.svg'), logoSVG);
    console.log('✅ Placeholder logo.svg created');
  }
}

main().catch(console.error);
