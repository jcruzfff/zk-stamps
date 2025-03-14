require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Get private key from environment variables
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const ALFAJORES_RPC_URL = process.env.ALFAJORES_RPC_URL || "https://alfajores-forno.celo-testnet.org";
const CELO_MAINNET_RPC_URL = process.env.CELO_MAINNET_RPC_URL || "https://forno.celo.org";
const CELOSCAN_API_KEY = process.env.CELOSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // For local development
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    // Celo Alfajores testnet
    alfajores: {
      url: ALFAJORES_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 44787,
      gasPrice: 5000000000 // 5 Gwei
    },
    // Celo mainnet (for when you're ready to deploy to production)
    celo: {
      url: CELO_MAINNET_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 42220,
      gasPrice: 5000000000 // 5 Gwei
    }
  },
  etherscan: {
    apiKey: {
      alfajores: CELOSCAN_API_KEY,
      celo: CELOSCAN_API_KEY
    },
    customChains: [
      {
        network: "alfajores",
        chainId: 44787,
        urls: {
          apiURL: "https://api-alfajores.celoscan.io/api",
          browserURL: "https://alfajores.celoscan.io"
        }
      },
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://celoscan.io"
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
}; 