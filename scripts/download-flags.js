import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Country codes to download flags for - these match the flags in your screenshot
const countryCodes = [
  'us', 'nl', 'pt', 'ae', 'au', 'nz', 'jp', 'cl', 'br',
  'fr', 'it', 'sg', 'th', 'iq', 'de', 'be', 'gb', 'tr',
  'ir', 'in', 'hk', 'th'
];

// Flagpedia CDN for SVG flags
const flagBaseUrl = 'https://flagcdn.com/w320/';

async function downloadFlags() {
  const flagsDirectory = path.resolve(__dirname, '../public/flags');
  
  // Ensure the flags directory exists
  if (!fs.existsSync(flagsDirectory)) {
    fs.mkdirSync(flagsDirectory, { recursive: true });
    console.log('Created flags directory');
  }
  
  console.log('Starting flag downloads...');
  
  // Download each flag
  for (const code of countryCodes) {
    try {
      const flagUrl = `${flagBaseUrl}${code}.png`;
      const response = await fetch(flagUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download flag for ${code}: ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      const flagPath = path.join(flagsDirectory, `${code}.png`);
      
      fs.writeFileSync(flagPath, Buffer.from(buffer));
      console.log(`Downloaded flag for ${code}`);
    } catch (error) {
      console.error(`Error downloading flag for ${code}:`, error.message);
    }
  }
  
  console.log('Flag download complete!');
}

downloadFlags().catch(error => {
  console.error('Error in download script:', error);
  process.exit(1);
}); 