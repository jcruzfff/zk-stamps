import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function main() {
  try {
    // Get API key from environment variables
    const apiKey = process.env.CELOSCAN_API_KEY;
    if (!apiKey) {
      throw new Error('CELOSCAN_API_KEY not set in .env.local file');
    }

    // Get GUID from command line arguments
    const guid = process.argv[2];
    if (!guid) {
      throw new Error('Please provide the GUID as a command line argument: node scripts/check-verification.js YOUR_GUID');
    }

    console.log(`Checking verification status for GUID: ${guid}`);
    
    // API URL for Celo Alfajores testnet
    const apiUrl = `https://api-alfajores.celoscan.io/api?module=contract&action=checkverifystatus&guid=${guid}&apikey=${apiKey}`;

    // Send the request
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    console.log('Verification Status:', data);

    if (data.status === '1') {
      console.log('Verification completed successfully!');
    } else {
      console.log('Verification pending or failed. Status message:', data.result);
    }
  } catch (error) {
    console.error('Error checking verification status:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 