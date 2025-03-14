// Import ethers from hardhat
import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
  // Define the constructor arguments
  const name = "ZKStampsPOAP";
  const symbol = "ZKPOAP";
  const baseURI = "https://zkstamps.io/metadata/";

  // Encode the constructor arguments
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const encodedArgs = abiCoder.encode(
    ["string", "string", "string"],
    [name, symbol, baseURI]
  );

  console.log("ABI-encoded constructor arguments:");
  console.log(encodedArgs);
  
  // Remove the '0x' prefix for verification
  console.log("\nEncoded constructor arguments for verification (without 0x):");
  console.log(encodedArgs.slice(2));
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 