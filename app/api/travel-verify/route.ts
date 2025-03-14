import { NextRequest, NextResponse } from 'next/server';
import { mintTravelPOAP, hasVisitedCountry } from '../../lib/blockchain';

// In a real implementation, you would import these:
// import { createPublicClient, createWalletClient, http } from 'viem'
// import { privateKeyToAccount } from 'viem/accounts'
// import { celoAlfajores } from 'viem/chains'
// import { poapABI } from '../../../abis/poapABI'

export async function POST(req: NextRequest) {
  try {
    // Get the travel verification data from the request body
    const data = await req.json();
    
    // Log the received data for debugging
    console.log('Received travel verification data:', data);
    
    // Validate required fields
    if (!data.walletAddress || !data.country || !data.countryCode || !data.coordinates) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields: walletAddress, country, countryCode, coordinates',
      }, { status: 400 });
    }
    
    try {
      // Check if the user has already minted a POAP for this country
      const alreadyVisited = await hasVisitedCountry(data.walletAddress, data.countryCode);
      
      if (alreadyVisited) {
        return NextResponse.json({ 
          success: false, 
          message: `You have already minted a POAP for ${data.country}`
        }, { status: 400 });
      }
      
      // Format coordinates for blockchain storage
      const [lat, lng] = data.coordinates;
      const formattedCoordinates = `${lat},${lng}`;
      
      // Mint the POAP
      const transactionHash = await mintTravelPOAP(
        data.walletAddress,
        data.countryCode,
        data.country,
        formattedCoordinates
      );
      
      console.log(`Transaction submitted with hash: ${transactionHash}`);
      
      // Return the transaction data and POAP info
      return NextResponse.json({ 
        success: true, 
        message: 'Travel verified and POAP minted successfully on Celo blockchain',
        poapData: {
          id: `poap_${Date.now()}`,
          country: data.country,
          countryCode: data.countryCode,
          coordinates: data.coordinates,
          timestamp: new Date().toISOString(),
          transactionHash: transactionHash,
          verificationProof: `onchain_verification_${Date.now()}`
        }
      });
    } catch (error) {
      console.error('Blockchain transaction failed:', error);
      
      // If in development mode, our utilities will return a mock transaction hash
      // so this error handler will only execute in production with real errors
      
      return NextResponse.json({ 
        success: false, 
        message: 'Blockchain transaction failed',
        error: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing travel verification:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error processing travel verification',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 