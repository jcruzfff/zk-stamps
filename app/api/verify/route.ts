import { NextRequest, NextResponse } from 'next/server';
// Commenting out the import since we're not using it in our demo
// import { SelfBackendVerifier } from '@selfxyz/core';

// Define a type for our passport verification data
type PassportVerificationData = {
  isHuman: boolean;
  name: string;
  nationality: string;
  dateOfBirth: string;
  gender: string;
  passportNumber: string;
  issuingState: string;
  expiryDate: string;
  above18: boolean;
  fromEU: boolean;
  notOnOFACList: boolean;
  timestamp: string;
  verificationProof: string;
  userId: string;
};

// In a real implementation, this would be a database
// For demo purposes, we'll store verified proofs in memory
const verifiedProofs: Record<string, PassportVerificationData> = {};

/*
// In a production environment, you would use this configuration:
const CELO_RPC_URL = process.env.CELO_RPC_URL || 'https://forno.celo.org';
const SCOPE = process.env.SCOPE || 'stamper-travel-app';

// Create the verifier according to Self Protocol docs
const selfBackendVerifier = new SelfBackendVerifier(
  CELO_RPC_URL, // Celo RPC url
  SCOPE // the scope that identifies your app
);
*/

// Handle POST requests for proof verification
export async function POST(req: NextRequest) {
  console.log('Received POST verification request to /api/verify');
  
  try {
    // Get the proof data from the request body
    const data = await req.json();
    
    // Log the received data for debugging
    console.log('Received verification data:', JSON.stringify(data, null, 2));
    
    // Extract Self protocol specific data
    const { proof, publicSignals } = data;
    
    // Get userId from either the request body or URL parameters
    const url = new URL(req.url);
    const urlUserId = url.searchParams.get('userId');
    const userId = data.userId || urlUserId;
    
    console.log(`Processing verification with userId: ${userId || 'none provided'}`);
    
    // Check if we have the required data
    if (!proof || !publicSignals) {
      console.warn('Missing proof or publicSignals in request');
      // For Self Protocol verification, we need to respond with success even if verification fails
      // The Self app needs a 200 response to consider the verification completed
      return NextResponse.json({ 
        status: 'success',
        result: false,
        message: 'Verification data incomplete'
      });
    }
    
    // For demo purposes, we're assuming the verification is successful
    // In a real implementation, you would verify the proof with the Self Protocol
    // const isValid = await selfBackendVerifier.verify(proof, publicSignals);
    const isValid = true;
    
    console.log('Verification result:', isValid ? 'Valid' : 'Invalid');
    
    // Generate a proof id
    const proofId = `zkp_proof_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    // Create passport data that would come from the Self Protocol verification
    const passportData: PassportVerificationData = {
      isHuman: true,
      name: 'Anonymous Traveler',
      nationality: 'United States',
      dateOfBirth: '1990-01-01',
      gender: 'X',
      passportNumber: 'XXXXX1234',
      issuingState: 'USA',
      expiryDate: '2030-01-01',
      above18: true,
      fromEU: true,
      notOnOFACList: true,
      timestamp: new Date().toISOString(),
      verificationProof: proofId,
      userId: userId || 'unknown'
    };
    
    // Store the passport data in our memory storage with userId as the key for easier retrieval
    if (userId) {
      verifiedProofs[userId] = passportData;
      console.log(`Stored verification data for userId: ${userId}`);
    } else {
      // Store by proofId but still maintain a way to look it up in GET requests
      verifiedProofs[proofId] = passportData;
      console.log(`No userId provided, storing with proofId: ${proofId}`);
    }
    
    // Return success response with the passport data - use the format Self expects
    return NextResponse.json({ 
      status: 'success',
      result: true,
      message: 'Verification successful',
      passportData
    });
  } catch (error) {
    console.error('Error processing verification:', error);
    
    // Return success response even on error, but mark result as false
    // The Self app needs a 200 response to consider the verification completed
    return NextResponse.json({ 
      status: 'success',
      result: false,
      message: 'Error processing verification',
      error: (error as Error).message
    });
  }
}

// Handle GET requests to retrieve verification data
export async function GET(req: NextRequest) {
  console.log('Received GET request to /api/verify');
  
  try {
    // Get the userId from the query parameters
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    
    console.log('Searching for verification data for userId:', userId);
    
    if (!userId) {
      return NextResponse.json({ 
        status: 'error',
        message: 'userId parameter is required'
      }, { status: 400 });
    }

    // Log available verifications for debugging
    console.log('Currently available verifications:', Object.keys(verifiedProofs));

    // Check if we have a direct match for this userId
    if (verifiedProofs[userId]) {
      console.log(`Found direct verification match for userId: ${userId}`);
      return NextResponse.json({
        status: 'success',
        message: 'Verification data found',
        passportData: verifiedProofs[userId]
      });
    }
    
    // If not, try to find by iterating through all proofs
    const matchingProofs = Object.values(verifiedProofs).filter(
      proof => proof.userId === userId
    );
    
    if (matchingProofs.length === 0) {
      return NextResponse.json({ 
        status: 'error',
        message: 'No verification found for this userId',
        debug: {
          searchedFor: userId,
          availableProofs: Object.keys(verifiedProofs)
        }
      }, { status: 404 });
    }
    
    // Get the most recent proof
    const latestProof = matchingProofs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
    
    return NextResponse.json({ 
      status: 'success',
      message: 'Verification data found',
      passportData: latestProof
    });
  } catch (error) {
    console.error('Error retrieving verification data:', error);
    
    return NextResponse.json({ 
      status: 'error',
      message: 'Error retrieving verification data',
      error: (error as Error).message
    }, { status: 500 });
  }
} 