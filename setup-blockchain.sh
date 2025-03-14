#!/bin/bash

echo "=== Setting up blockchain integration for zkStamps App ==="
echo "This script will install required dependencies and set up the configuration."

# Install required dependencies using pnpm
echo "Installing required packages with pnpm..."
pnpm add viem @celo/contractkit ethers

# Create necessary directories if they don't exist
echo "Creating necessary directories..."
mkdir -p contracts/abi
mkdir -p lib

# Check for environment file
if [ ! -f .env.local ]; then
  echo "Creating .env.local file with placeholder values..."
  cat > .env.local << EOL
# Blockchain Configuration
MINTER_PRIVATE_KEY=your_private_key_here_without_0x_prefix
POAP_CONTRACT_ADDRESS=your_contract_address_after_deployment

# Application Environment
NODE_ENV=development
EOL
  echo ".env.local file created with placeholder values."
else
  echo ".env.local file already exists. Make sure it has the following keys:"
  echo "- MINTER_PRIVATE_KEY"
  echo "- POAP_CONTRACT_ADDRESS"
  echo "- NODE_ENV"
fi

# Copy template files if they don't exist
if [ ! -f hardhat.config.js ]; then
  if [ -f hardhat.config.js.sample ]; then
    echo "Copying hardhat.config.js.sample to hardhat.config.js..."
    cp hardhat.config.js.sample hardhat.config.js
  fi
fi

echo "Setup completed!"
echo ""
echo "Next steps:"
echo "1. Update your .env.local file with your actual private key and contract address"
echo "2. Deploy the POAP smart contract using Hardhat or another framework"
echo "3. Start the development server with 'pnpm dev'"
echo ""
echo "See BLOCKCHAIN_SETUP.md for more detailed instructions." 