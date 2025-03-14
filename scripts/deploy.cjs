// scripts/deploy.cjs
const hre = require("hardhat");
const { ethers, run } = hre;

async function main() {
  console.log("Deploying ZKStampsPOAP contract...");

  // Get the contract factory
  const ZKStampsPOAP = await ethers.getContractFactory("ZKStampsPOAP");
  
  // Deploy the contract
  console.log("Starting deployment transaction...");
  const deploymentTransaction = await ZKStampsPOAP.deploy();
  
  // Wait for deployment to complete
  console.log("Waiting for deployment to be confirmed...");
  await deploymentTransaction.waitForDeployment();
  
  // Get the deployed contract address
  const contractAddress = await deploymentTransaction.getAddress();
  
  console.log(`ZKStampsPOAP contract deployed to: ${contractAddress}`);
  console.log("--------------------------------------------------");
  console.log("IMPORTANT: Add this address to your .env.local file:");
  console.log(`POAP_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("--------------------------------------------------");
  
  // Get the transaction hash for verification
  const tx = deploymentTransaction.deploymentTransaction();
  
  // Verify the contract on the block explorer (only works on networks that support verification)
  try {
    console.log("Waiting for block confirmations...");
    
    // Wait for a few block confirmations before verification
    await tx.wait(5);
    
    console.log("Verifying contract on block explorer...");
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
    });
    
    console.log("Contract verified successfully!");
  } catch (error) {
    console.log("Error during contract verification:", error.message);
    console.log("You can manually verify the contract on the block explorer if needed.");
  }
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  }); 