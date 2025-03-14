import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo, celoAlfajores } from 'viem/chains';
import * as ContractKit from '@celo/contractkit';
import zkStampsPOAPAbi from '../contracts/abi/zkStampsPOAP.json'; // This file will need to be created after contract compilation

// Default ABI - replace with the actual ABI after contract compilation
const DEFAULT_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "countryCode",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "countryName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "coordinates",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      }
    ],
    "name": "mintPOAP",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "countryCode",
        "type": "string"
      }
    ],
    "name": "hasVisitedCountry",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Environment variables
const MINTER_PRIVATE_KEY = process.env.MINTER_PRIVATE_KEY || '';
const POAP_CONTRACT_ADDRESS = process.env.POAP_CONTRACT_ADDRESS || '';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Select the appropriate chain based on environment
const chain = IS_PRODUCTION ? celo : celoAlfajores;

/**
 * Creates a Viem public client for reading from the blockchain
 */
export const createClient = () => {
  return createPublicClient({
    chain,
    transport: http(),
  });
};

/**
 * Creates a wallet client for sending transactions
 */
export const createWallet = () => {
  // Check if we have a private key
  if (!MINTER_PRIVATE_KEY) {
    throw new Error('Missing MINTER_PRIVATE_KEY environment variable');
  }

  // Create an account from private key
  const account = privateKeyToAccount(`0x${MINTER_PRIVATE_KEY}`);

  // Create and return the wallet client
  return createWalletClient({
    account,
    chain,
    transport: http(),
  });
};

/**
 * Creates a ContractKit connection to Celo
 */
export const createKitConnection = () => {
  // Use the appropriate network URL based on environment
  const networkUrl = IS_PRODUCTION 
    ? 'https://forno.celo.org' 
    : 'https://alfajores-forno.celo-testnet.org';
  
  // Create and return the connection
  const kit = ContractKit.newKit(networkUrl);
  
  // Add the account if we have a private key
  if (MINTER_PRIVATE_KEY) {
    kit.addAccount(`0x${MINTER_PRIVATE_KEY}`);
  }
  
  return kit;
};

/**
 * Mints a POAP for a user's travel verification
 * 
 * @param userAddress - The user's wallet address
 * @param countryCode - ISO country code (e.g., "US")
 * @param countryName - Full country name (e.g., "United States")
 * @param coordinates - String representation of coordinates (e.g., "37.7749,-122.4194")
 * @returns Transaction hash if successful
 */
export const mintTravelPOAP = async (
  userAddress: string,
  countryCode: string,
  countryName: string,
  coordinates: string
): Promise<string> => {
  try {
    // Check if we're in development mode without contract setup
    if (!POAP_CONTRACT_ADDRESS || process.env.NODE_ENV !== 'production') {
      console.log('Running in development mode - returning mock transaction');
      // Return a mock transaction hash for development
      return `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    }

    // Create wallet client
    const wallet = createWallet();
    
    // Use the default ABI if the imported one isn't available
    const abi = zkStampsPOAPAbi || DEFAULT_ABI;
    
    // Send the transaction to mint the POAP
    const hash = await wallet.writeContract({
      address: POAP_CONTRACT_ADDRESS as `0x${string}`,
      abi,
      functionName: 'mintPOAP',
      args: [countryCode, countryName, coordinates, userAddress],
    });
    
    return hash;
  } catch (error) {
    console.error('Error minting travel POAP:', error);
    throw new Error(`Failed to mint POAP: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Checks if a user has already visited a country
 * 
 * @param userAddress - The user's wallet address
 * @param countryCode - ISO country code (e.g., "US")
 * @returns Boolean indicating if the user has visited the country
 */
export const hasVisitedCountry = async (
  userAddress: string,
  countryCode: string
): Promise<boolean> => {
  try {
    // Check if we're in development mode without contract setup
    if (!POAP_CONTRACT_ADDRESS || process.env.NODE_ENV !== 'production') {
      // In development mode, just return false to always allow minting
      return false;
    }

    // Create public client
    const client = createClient();
    
    // Use the default ABI if the imported one isn't available
    const abi = zkStampsPOAPAbi || DEFAULT_ABI;
    
    // Read from the contract to check if the user has visited the country
    const hasVisited = await client.readContract({
      address: POAP_CONTRACT_ADDRESS as `0x${string}`,
      abi,
      functionName: 'hasVisitedCountry',
      args: [userAddress, countryCode],
    });
    
    return hasVisited as boolean;
  } catch (error) {
    console.error('Error checking country visit:', error);
    // In case of error, return false to allow the user to try minting
    return false;
  }
};

/**
 * Utility function to create an ABI directory with placeholder file
 * This helps avoid import errors before contract compilation
 */
export const ensureAbiDirectoryExists = async (): Promise<void> => {
  // This would be implemented in a Node.js context, not in the browser
  // For client-side, this function would do nothing
  return Promise.resolve();
}; 