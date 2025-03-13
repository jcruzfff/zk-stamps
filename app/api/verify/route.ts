import { NextRequest, NextResponse } from 'next/server';
// Uncomment the import for the SelfBackendVerifier
import { SelfBackendVerifier } from '@selfxyz/core';

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

// Set up the Self Protocol verifier with proper configuration
const CELO_RPC_URL = process.env.CELO_RPC_URL || 'https://forno.celo.org';
const SCOPE = 'stamper-travel-app'; // Must match the scope in PassportVerification.tsx

// Create the verifier according to Self Protocol docs
let selfBackendVerifier: SelfBackendVerifier | null;
try {
  selfBackendVerifier = new SelfBackendVerifier(
    CELO_RPC_URL, // Celo RPC url
    SCOPE // the scope that identifies your app
  );
  console.log('Self Protocol backend verifier initialized successfully');
} catch (error) {
  console.error('Failed to initialize Self Protocol backend verifier:', error);
  // Initialize with null to avoid runtime errors
  selfBackendVerifier = null;
}

// Handle POST requests for proof verification
export async function POST(req: NextRequest) {
  console.log('Received POST verification request to /api/verify');
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  
  try {
    // Get the proof data from the request body
    const rawBody = await req.text();
    console.log('Raw request body:', rawBody);
    
    let data;
    try {
      data = JSON.parse(rawBody);
    } catch (e) {
      console.error('Failed to parse request body as JSON:', e);
      return NextResponse.json({ 
        status: 'error',
        result: false,
        message: 'Invalid JSON payload'
      }, { status: 400 });
    }
    
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
      return NextResponse.json({ 
        status: 'error',
        result: false,
        message: 'Verification data incomplete - proof and publicSignals are required'
      }, { status: 400 });
    }
    
    // Verify the proof with the Self Protocol verifier
    if (!selfBackendVerifier) {
      console.error('Self backend verifier not initialized');
      return NextResponse.json({ 
        status: 'error',
        result: false,
        message: 'Verification service unavailable'
      }, { status: 500 });
    }
    
    // Perform the verification
    console.log('Attempting to verify proof with Self Protocol verifier');
    const verificationResult = await selfBackendVerifier.verify(proof, publicSignals);
    
    if (!verificationResult) {
      console.error('Verification failed - invalid proof');
      return NextResponse.json({ 
        status: 'error',
        result: false,
        message: 'Verification failed - invalid proof'
      }, { status: 400 });
    }
    
    console.log('Verification successful:', verificationResult);
    
    // Extract passport data from the verification result
    // In a real implementation, parse the verification result to get the actual user data
    // For now, use placeholder data with the verification result's proof ID
    const proofId = `zkp_proof_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    // Create passport data from the verification result
    // In a production implementation, you would extract actual data from verificationResult
    const passportData: PassportVerificationData = {
      isHuman: true,
      name: 'Verified Traveler', // These would be extracted from verificationResult
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
    
    // Log successful verification
    console.log(`🎉 Verification successful for userId: ${userId}`);
    
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
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    });
  } catch (error) {
    console.error('Error processing verification:', error);
    
    // Return error response
    return NextResponse.json({ 
      status: 'error',
      result: false,
      message: 'Error processing verification',
      error: (error as Error).message
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
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
      }, { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        }
      });
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
      }, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        }
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
          searchedFor: userId
        }
      }, { 
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        }
      });
    }
    
    // Get the most recent proof
    const latestProof = matchingProofs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
    
    return NextResponse.json({ 
      status: 'success',
      message: 'Verification data found',
      passportData: latestProof
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    });
  } catch (error) {
    console.error('Error retrieving verification data:', error);
    
    return NextResponse.json({ 
      status: 'error',
      message: 'Error retrieving verification data',
      error: (error as Error).message
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    });
  }
} 