import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celoAlfajores, celo } from 'viem/chains';



// Environment variable for the private key (in production, use secure environment variables)
// NEVER hardcode private keys in your code
const PRIVATE_KEY = process.env.MINTER_PRIVATE_KEY || '';

// POAP Contract address (this should be your deployed contract address)
export const POAP_CONTRACT_ADDRESS = process.env.POAP_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

// Default to using Alfajores testnet in development
// Use NEXT_PUBLIC_ENV instead of NODE_ENV to avoid Next.js restrictions
const isProduction = process.env.NEXT_PUBLIC_ENV === 'production';
const currentChain = isProduction ? celo : celoAlfajores;

// RPC URLs
const RPC_URL = isProduction 
  ? 'https://forno.celo.org' 
  : 'https://alfajores-forno.celo-testnet.org';

// Create an account from the private key
export const account = PRIVATE_KEY 
  ? privateKeyToAccount(`0x${PRIVATE_KEY}`) 
  : undefined;

// Create a public client for reading blockchain data
export const publicClient = createPublicClient({
  chain: currentChain,
  transport: http(RPC_URL)
});

// Function to create a wallet client for sending transactions
export const createWalletClientWithAccount = () => {
  if (!account) {
    throw new Error('No private key provided for wallet client');
  }
  
  return createWalletClient({
    account,
    chain: currentChain,
    transport: http(RPC_URL)
  });
};

// Function to format coordinates from floating point to scaled integers for blockchain storage
export const formatCoordinates = (lat: number, lng: number) => {
  // Scale by 10^7 to preserve precision while using integers
  // This allows for accuracy to ~1.1cm at the equator
  const scale = 10000000;
  return [
    Math.round(lat * scale),
    Math.round(lng * scale)
  ];
};

// Define interface for transaction data
interface TransactionData {
  walletAddress: string;
  countryCode: string;
  country: string;
  coordinates: number[];
  [key: string]: unknown; // Allow for additional properties
}

// Function to check if a transaction is valid before sending
export const validateTransaction = (data: TransactionData) => {
  if (!data.walletAddress || !data.countryCode || !data.country) {
    throw new Error('Missing required transaction data');
  }
  
  if (!Array.isArray(data.coordinates) || data.coordinates.length !== 2) {
    throw new Error('Invalid coordinates format');
  }
  
  return true;
};

// Default ABI for the ZKStampsPOAP contract
const poapABI = [
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
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getCountriesVisitedByUser",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

/**
 * Mints a POAP for a user's travel verification
 * 
 * @param userAddress - The user's wallet address (unused with new contract, mint goes to msg.sender)
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
    // Check if a contract address is configured
    if (!POAP_CONTRACT_ADDRESS) {
      throw new Error('No POAP_CONTRACT_ADDRESS set. Please add a valid contract address to .env.local');
    }

    // Create wallet client for transaction
    console.log('Creating wallet client for transaction...');
    const wallet = createWalletClientWithAccount();
    
    // Send the transaction to mint the POAP
    console.log('Sending transaction to mint POAP with args:', {countryCode, countryName, coordinates});
    console.log('Contract address:', POAP_CONTRACT_ADDRESS);
    
    const hash = await wallet.writeContract({
      address: POAP_CONTRACT_ADDRESS as `0x${string}`,
      abi: poapABI,
      functionName: 'mintPOAP',
      args: [countryCode, countryName, coordinates],
    });
    
    console.log('Transaction sent successfully! Hash:', hash);
    return hash;
  } catch (error) {
    console.error('Error minting travel POAP:', error);
    alert(`Failed to mint POAP: ${error instanceof Error ? error.message : String(error)}`);
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
    // Verify parameters
    if (!userAddress || !countryCode) {
      console.error('Missing parameters for hasVisitedCountry', { userAddress, countryCode });
      return false;
    }

    // Check if contract address is configured
    if (!POAP_CONTRACT_ADDRESS) {
      console.error('No POAP_CONTRACT_ADDRESS set');
      return false;
    }

    console.log(`Checking if address ${userAddress} has visited country ${countryCode}`);
    
    // Read from the contract to check if the user has visited the country
    const hasVisited = await publicClient.readContract({
      address: POAP_CONTRACT_ADDRESS as `0x${string}`,
      abi: poapABI,
      functionName: 'hasVisitedCountry',
      args: [userAddress, countryCode],
    });
    
    console.log(`Result from contract: ${hasVisited}`);
    return hasVisited as boolean;
  } catch (error) {
    console.error('Error checking country visit:', error);
    // In case of error, return false to allow the user to try minting
    return false;
  }
};

/**
 * Gets all countries a user has visited according to the blockchain
 * 
 * @param userAddress - The user's wallet address
 * @returns Array of country codes the user has visited
 */
export const getCountriesVisitedByUser = async (
  userAddress: string
): Promise<string[]> => {
  console.log('🔄 [Blockchain] getCountriesVisitedByUser called with address:', userAddress);
  
  try {
    // Check if wallet address is provided
    if (!userAddress) {
      console.error('🔴 [Blockchain] No user address provided');
      return [];
    }

    // Check if contract address is configured
    if (!POAP_CONTRACT_ADDRESS) {
      console.error('🔴 [Blockchain] No POAP_CONTRACT_ADDRESS set. Unable to fetch country data from blockchain.');
      return [];
    }

    // Use localStorage as a cache, but only if we have recent blockchain data
    let cachedData: { timestamp: number; countryCodes: string[] } | null = null;
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    if (typeof window !== 'undefined') {
      const cachedDataStr = localStorage.getItem(`blockchain_countries_${userAddress}`);
      if (cachedDataStr) {
        try {
          cachedData = JSON.parse(cachedDataStr);
          // Use cached data only if it's recent
          if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
            console.log('🔄 [Blockchain] Using cached country data (less than 5 min old):', cachedData.countryCodes);
            return cachedData.countryCodes;
          }
          console.log('🔄 [Blockchain] Cached data expired, fetching from blockchain');
        } catch (e) {
          console.error('🔴 [Blockchain] Error parsing cached country data', e);
        }
      }
    }

    // Create a public client for the appropriate chain
    const chainToUse = process.env.NEXT_PUBLIC_ENV === 'production' ? celo : celoAlfajores;
    console.log(`🔄 [Blockchain] Creating public client for chain: ${chainToUse.name}`);
    
    const client = createPublicClient({
      chain: chainToUse,
      transport: http(),
    });
    
    // Call the smart contract to get countries visited by the user
   
    
    const countriesVisited = await client.readContract({
      address: POAP_CONTRACT_ADDRESS as `0x${string}`,
      abi: poapABI,
      functionName: 'getCountriesVisitedByUser',
      args: [userAddress],
    }) as string[];
    
    console.log('🔄 [Blockchain] Retrieved countries from blockchain:', countriesVisited);
    
    // Cache the results in localStorage for future use
    if (typeof window !== 'undefined') {
      try {
        const cacheData = {
          timestamp: Date.now(),
          countryCodes: countriesVisited
        };
        localStorage.setItem(`blockchain_countries_${userAddress}`, JSON.stringify(cacheData));
        console.log('🔄 [Blockchain] Cached country data in localStorage');
      } catch (e) {
        console.error('🔴 [Blockchain] Error caching country data', e);
      }
    }
    
    return countriesVisited;
  } catch (error) {
    console.error('🔴 [Blockchain] Error getting countries visited by user:', error);
    // In case of error, return empty array
    return [];
  }
}; 