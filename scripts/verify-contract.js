import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    // Get API key from environment variables
    const apiKey = process.env.CELOSCAN_API_KEY;
    if (!apiKey) {
      throw new Error('CELOSCAN_API_KEY not set in .env.local file');
    }

    console.log('Starting contract verification process...');

    // Contract information
    const contractAddress = '0x67566E669137185f932f380283F8CA40bC1CEc8F';
    const contractName = 'ZKStampsPOAP';
    const compilerVersion = 'v0.8.17+commit.8df45f5f';
    
    // Read the source code from the contract file
    const contractFilePath = path.resolve(__dirname, '../contracts/ZKStampsPOAP.sol');
    const sourceCode = fs.readFileSync(contractFilePath, 'utf8');
    
    // Constructor arguments from our previous script
    const constructorArguments = '000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000c5a4b5374616d7073504f415000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006504f4150000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000019687474703a2f2f7a6b7374616d70732e696f2f6d657461646174612f0000';

    console.log(`Using API key: ${apiKey.substring(0, 6)}...`);
    console.log(`Contract address: ${contractAddress}`);
    console.log(`Contract name: ${contractName}`);
    
    // Prepare form data for the API request
    const formData = new URLSearchParams();
    formData.append('apikey', apiKey);
    formData.append('module', 'contract');
    formData.append('action', 'verifysourcecode');
    formData.append('contractaddress', contractAddress);
    formData.append('sourceCode', sourceCode);
    formData.append('codeformat', 'solidity-single-file');
    formData.append('contractname', contractName);
    formData.append('compilerversion', compilerVersion);
    formData.append('optimizationUsed', '1');
    formData.append('runs', '200');
    formData.append('constructorArguments', constructorArguments);
    formData.append('licenseType', '3'); // MIT License

    // API URL for Celo Alfajores testnet
    const apiUrl = 'https://api-alfajores.celoscan.io/api';

    console.log('Sending verification request...');
    
    // Send the verification request
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Parse the response
    const data = await response.json();
    console.log('Response:', data);

    if (data.status === '1') {
      console.log('Contract verification submitted successfully!');
      console.log('GUID:', data.result);
      console.log(`Check verification status at: https://alfajores.celoscan.io/address/${contractAddress}#code`);
    } else {
      console.error('Contract verification failed:', data.result);
    }
  } catch (error) {
    console.error('Error during contract verification:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 