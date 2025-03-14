require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config({ path: '.env.local' });

// Check if the private key is available
const MINTER_PRIVATE_KEY = process.env.MINTER_PRIVATE_KEY || '0000000000000000000000000000000000000000000000000000000000000000';
if (!process.env.MINTER_PRIVATE_KEY) {
  console.warn('Warning: MINTER_PRIVATE_KEY is not set in .env.local file. Using dummy key for local development.');
}

// Get API key for Etherscan from .env.local
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || process.env.CELOSCAN_API_KEY || '';
if (!ETHERSCAN_API_KEY) {
  console.warn('Warning: ETHERSCAN_API_KEY is not set in .env.local file. Contract verification will not work.');
} else {
  console.log('Using API key:', ETHERSCAN_API_KEY.substring(0, 6) + '...');
}

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: {
    version: "0.8.17",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // Celo Alfajores Testnet
    celoAlfajores: {
      url: "https://alfajores-forno.celo-testnet.org",
      accounts: [MINTER_PRIVATE_KEY],
      chainId: 44787,
      // Let Hardhat determine the appropriate gas price automatically
    },
    // Celo Mainnet
    celo: {
      url: "https://forno.celo.org",
      accounts: [MINTER_PRIVATE_KEY],
      chainId: 42220,
      gasPrice: 1000000000, // 1 gwei
    },
    // Hardhat local network for testing
    hardhat: {
      chainId: 1337
    }
  },
  // For contract verification on block explorers
  etherscan: {
    // Your API key for Etherscan - This API key can work for all Etherscan-powered explorers
    apiKey: ETHERSCAN_API_KEY,
    customChains: [
      {
        network: "celoAlfajores",
        chainId: 44787,
        urls: {
          apiURL: "https://api-alfajores.celoscan.io/api",
          browserURL: "https://alfajores.celoscan.io/",
        },
      },
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://celoscan.io/",
        },
      },
    ],
  },
  // Default network is hardhat's built-in development network
  defaultNetwork: "hardhat",
  // Enable source verification debug logs
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  }
};

module.exports = config; 