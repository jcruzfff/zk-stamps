// scripts/check-contract.cjs
const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  console.log("Checking ZKStampsPOAP contract...");

  // Get the contract address from environment or argument
  const contractAddress = process.env.POAP_CONTRACT_ADDRESS || '0xda903F668Fb6951Fe5aeb5adA8965B5241F1bCd3';
  
  console.log(`Using contract address: ${contractAddress}`);
  
  try {
    // Get the contract instance
    const ZKStampsPOAP = await ethers.getContractFactory("ZKStampsPOAP");
    const contract = await ZKStampsPOAP.attach(contractAddress);
    
    // Try to call a simple view function, like name() which comes from ERC721
    const name = await contract.name();
    console.log(`Contract name: ${name}`);
    
    // Try to get the symbol, another view function
    const symbol = await contract.symbol();
    console.log(`Contract symbol: ${symbol}`);
    
    console.log("✅ Successfully connected to the contract!");
  } catch (error) {
    console.error("❌ Error connecting to the contract:", error.message);
    console.error(error);
  }
}

// Execute the check
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  }); 