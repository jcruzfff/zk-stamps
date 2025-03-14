// scripts/test-mint.cjs
const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  console.log("Testing ZKStampsPOAP mint function...");

  // Get the contract address from environment
  const contractAddress = process.env.POAP_CONTRACT_ADDRESS || '0xda903F668Fb6951Fe5aeb5adA8965B5241F1bCd3';
  console.log(`Using contract address: ${contractAddress}`);
  
  try {
    // Get the contract instance
    const ZKStampsPOAP = await ethers.getContractFactory("ZKStampsPOAP");
    const contract = await ZKStampsPOAP.attach(contractAddress);
    
    // Get signer information (whoever is sending the transaction)
    const [signer] = await ethers.getSigners();
    const signerAddress = await signer.getAddress();
    console.log(`Using signer address: ${signerAddress}`);
    
    // Test data for the POAP
    const testCountryCode = "JP";
    const testCountryName = "Japan";
    // Coordinates for Tokyo
    const scale = 10000000;
    const testLat = Math.round(35.6762 * scale);  // Tokyo latitude
    const testLng = Math.round(139.6503 * scale); // Tokyo longitude
    const testCoordinates = [testLat, testLng];
    const recipientAddress = signerAddress; // Mint to ourselves for testing
    const timestamp = Math.floor(Date.now() / 1000); // Current timestamp in seconds
    
    console.log(`\nMinting POAP with data:`);
    console.log(`- Country: ${testCountryName} (${testCountryCode})`);
    console.log(`- Coordinates: [${testLat}, ${testLng}] (scaled from [35.6762, 139.6503])`);
    console.log(`- Recipient: ${recipientAddress}`);
    console.log(`- Timestamp: ${timestamp} (${new Date(timestamp * 1000).toISOString()})`);
    
    // Check if user already has a POAP for this country
    const alreadyHasPOAP = await contract.hasVisitedCountry(recipientAddress, testCountryCode);
    
    if (alreadyHasPOAP) {
      console.log(`\n⚠️ User already has a POAP for ${testCountryName}!`);
      
      // Get user POAPs
      const tokenIds = await contract.getPOAPsByOwner(recipientAddress);
      console.log(`User has ${tokenIds.length} POAPs in total.`);
      
      // Continue with new country to test mint
      console.log(`\nTrying with a different country...`);
      const newTestCountryCode = "US";
      const newTestCountryName = "United States";
      
      const alreadyHasUSPOAP = await contract.hasVisitedCountry(recipientAddress, newTestCountryCode);
      
      if (alreadyHasUSPOAP) {
        console.log(`\n⚠️ User already has a POAP for ${newTestCountryName} too!`);
        console.log(`Please modify the script to use a country you haven't minted yet.`);
        return;
      }
      
      console.log(`Minting POAP for ${newTestCountryName} (${newTestCountryCode})...`);
      const tx = await contract.mintPOAP(
        recipientAddress,
        newTestCountryCode,
        newTestCountryName,
        testCoordinates,
        timestamp
      );
      
      console.log(`Transaction sent! Waiting for confirmation...`);
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
      console.log(`Gas used: ${receipt.gasUsed.toString()}`);
      
      // Get the token ID from the event
      const mintEvents = receipt.logs.filter(log => {
        try {
          const parsedLog = contract.interface.parseLog(log);
          return parsedLog && parsedLog.name === 'POAPMinted';
        } catch (e) {
          return false;
        }
      });
      
      if (mintEvents.length > 0) {
        // Parse event logs to get token ID
        const parsedLog = contract.interface.parseLog(mintEvents[0]);
        // This assumes the token ID is the 2nd parameter in the event
        const tokenId = parsedLog.args[1];
        console.log(`\n✅ POAP minted successfully!`);
        console.log(`Token ID: ${tokenId.toString()}`);
      } else {
        console.log(`\n✅ POAP minted successfully!`);
        console.log(`(Couldn't extract token ID from event)`);
      }
    } else {
      // Perform the mint transaction
      console.log(`\nMinting POAP for ${testCountryName}...`);
      const tx = await contract.mintPOAP(
        recipientAddress,
        testCountryCode,
        testCountryName,
        testCoordinates,
        timestamp
      );
      
      console.log(`Transaction sent! Waiting for confirmation...`);
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
      console.log(`Gas used: ${receipt.gasUsed.toString()}`);
      
      // Get the token ID from the event
      const mintEvents = receipt.logs.filter(log => {
        try {
          const parsedLog = contract.interface.parseLog(log);
          return parsedLog && parsedLog.name === 'POAPMinted';
        } catch (e) {
          return false;
        }
      });
      
      if (mintEvents.length > 0) {
        // Parse event logs to get token ID
        const parsedLog = contract.interface.parseLog(mintEvents[0]);
        // This assumes the token ID is the 2nd parameter in the event
        const tokenId = parsedLog.args[1];
        console.log(`\n✅ POAP minted successfully!`);
        console.log(`Token ID: ${tokenId.toString()}`);
      } else {
        console.log(`\n✅ POAP minted successfully!`);
        console.log(`(Couldn't extract token ID from event)`);
      }
    }
    
    // Check the user's new token balance
    const updatedTokenIds = await contract.getPOAPsByOwner(recipientAddress);
    console.log(`\nUser now has ${updatedTokenIds.length} POAPs in total.`);
    
    // Try to get token URI for visualization
    try {
      if (updatedTokenIds.length > 0) {
        const latestTokenId = updatedTokenIds[updatedTokenIds.length - 1];
        const tokenURI = await contract.tokenURI(latestTokenId);
        console.log(`\nToken URI for latest POAP (ID ${latestTokenId}):`);
        console.log(tokenURI);
        
        // If URI is a Base64 encoded JSON, try to decode it
        if (tokenURI.startsWith('data:application/json;base64,')) {
          const base64Data = tokenURI.split(',')[1];
          const decodedData = Buffer.from(base64Data, 'base64').toString();
          console.log(`\nDecoded token metadata:`);
          console.log(JSON.parse(decodedData));
        }
      }
    } catch (error) {
      console.log(`\nCouldn't retrieve token URI: ${error.message}`);
    }
    
  } catch (error) {
    console.error("\n❌ Error during mint test:", error.message);
    console.error(error);
  }
}

// Execute the test
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  }); 