import pkg from 'hardhat';
const { ethers, network, run } = pkg;

async function main() {
  console.log("Deploying ZKStampsPOAP contract...");

  // Get the contract factory - use fully qualified name
  const ZKStampsPOAP = await ethers.getContractFactory("contracts/ZKStampsPOAP.sol:ZKStampsPOAP");

  // Deploy the contract with constructor arguments
  const zkstampsPoap = await ZKStampsPOAP.deploy(
    "ZKStampsPOAP",            // Name
    "ZKPOAP",                  // Symbol
    "https://zkstamps.io/metadata/" // Base URI
  );

  // Wait for the contract to be deployed
  await zkstampsPoap.waitForDeployment();

  // Get the contract address
  const contractAddress = await zkstampsPoap.getAddress();
  
  console.log("ZKStampsPOAP deployed to:", contractAddress);
  console.log("Remember to update your frontend with this new contract address!");
  
  // Verify the contract on the block explorer (if on a public testnet/mainnet)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    
    // Wait for some confirmations
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30s for block confirmations
    
    console.log("Verifying contract on block explorer...");
    
    // Run verification
    try {
      await run("verify:verify", {
        address: contractAddress,
        constructorArguments: [
          "ZKStampsPOAP",
          "ZKPOAP",
          "https://zkstamps.io/metadata/"
        ],
      });
      console.log("Contract verified!");
    } catch (error) {
      console.error("Error verifying contract:", error.message);
    }
  }
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 