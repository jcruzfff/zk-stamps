import { NextRequest, NextResponse } from 'next/server';
// Import the Self SDK for backend verification
import { SelfBackendVerifier, getUserIdentifier, countryCodes } from '@selfxyz/core';

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
const SCOPE = 'zkStamps-travel-app'; // Must match the scope in PassportVerification.tsx

// Create the verifier according to Self Protocol docs
let selfBackendVerifier: SelfBackendVerifier | null;
try {
  selfBackendVerifier = new SelfBackendVerifier(
    CELO_RPC_URL, // Celo RPC url
    SCOPE // the scope that identifies your app
  );
  
  // Configure verification options
  selfBackendVerifier.setMinimumAge(18);
  selfBackendVerifier.excludeCountries(
    countryCodes.IRN,   // Iran
    countryCodes.PRK    // North Korea
  );
  selfBackendVerifier.enableNameAndDobOfacCheck();
  
  console.log('Self Protocol backend verifier initialized successfully');
} catch (error) {
  console.error('Failed to initialize Self Protocol backend verifier:', error);
  // Initialize with null to avoid runtime errors
  selfBackendVerifier = null;
}

// Helper function to add CORS headers - ensure it works with HTTPS
function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  return response;
}

// Add a health check endpoint to verify the API is accessible through ngrok
export async function GET(req: NextRequest) {
  console.log('Received GET request to /api/verify');
  
  try {
    // Check if this is a health check request
    const url = new URL(req.url);
    const path = url.pathname;
    
    if (path.endsWith('/health-check')) {
      console.log('Received health check request');
      return addCorsHeaders(
        NextResponse.json({
          status: 'success',
          message: 'API is functioning correctly',
          timestamp: new Date().toISOString()
        }, { status: 200 })
      );
    }
    
    // Get the userId from the query parameters
    const userId = url.searchParams.get('userId');
    
    console.log('Searching for verification data for userId:', userId);
    
    if (!userId) {
      return addCorsHeaders(
        NextResponse.json({ 
          status: 'error',
          message: 'userId parameter is required'
        }, { status: 400 })
      );
    }

    // Check if we have verified data for this userId
    if (verifiedProofs[userId]) {
      console.log(`Found verification data for userId: ${userId}`);
      return addCorsHeaders(
        NextResponse.json({ 
          status: 'success',
          message: 'Verification data found',
          passportData: verifiedProofs[userId]
        }, { status: 200 })
      );
    } else {
      console.log(`No verification data found for userId: ${userId}`);
      return addCorsHeaders(
        NextResponse.json({ 
          status: 'error',
          message: 'No verification data found for this userId'
        }, { status: 404 })
      );
    }
  } catch (error) {
    console.error('Error retrieving verification data:', error);
    
    return addCorsHeaders(
      NextResponse.json({ 
        status: 'error',
        message: 'Error retrieving verification data',
        error: (error as Error).message
      }, { status: 500 })
    );
  }
}

// Handle OPTIONS request for CORS preflight - critical for secure origins
export async function OPTIONS(req: NextRequest) {
  console.log('Received OPTIONS request for CORS preflight');
  
  // Need to check if this is a health check request
  const url = new URL(req.url);
  const path = url.pathname;
  
  if (path.endsWith('/health-check')) {
    console.log('Health check preflight request');
  }
  
  // Always return 200 OK for OPTIONS requests with appropriate CORS headers
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

// Handle POST requests for proof verification
export async function POST(req: NextRequest) {
  console.log('Received POST verification request to /api/verify');
  
  try {
    // Get the proof data from the request body
    const rawBody = await req.text();
    
    let data;
    try {
      data = JSON.parse(rawBody);
    } catch (e) {
      console.error('Failed to parse request body as JSON:', e);
      return addCorsHeaders(
        NextResponse.json({ 
          status: 'error',
          result: false,
          message: 'Invalid JSON payload'
        }, { status: 400 })
      );
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
      return addCorsHeaders(
        NextResponse.json({ 
          status: 'error',
          result: false,
          message: 'Verification data incomplete - proof and publicSignals are required'
        }, { status: 400 })
      );
    }
    
    // Check if selfBackendVerifier is initialized
    if (!selfBackendVerifier) {
      console.error('Self Protocol backend verifier not initialized');
      return addCorsHeaders(
        NextResponse.json({ 
          status: 'error',
          result: false,
          message: 'Self Protocol backend verifier not initialized'
        }, { status: 500 })
      );
    }
    
    // Verify the proof using the Self Protocol backend verifier
    console.log('Verifying proof with Self Protocol backend verifier');
    
    try {
      // Extract user ID from the proof
      const proofUserId = await getUserIdentifier(publicSignals);
      console.log("Extracted userId from proof:", proofUserId);
      
      // Verify the proof
      const result = await selfBackendVerifier.verify(proof, publicSignals);
      
      console.log('Verification result:', result);
      
      if (result.isValid) {
        console.log('Proof verification successful');
        
        // Extract information from the credentialSubject
        const credentialSubject = result.credentialSubject;
        
        // Create passport data from verified credentials
        const passportData: PassportVerificationData = {
          isHuman: true,
          name: credentialSubject.name || 'Not disclosed',
          nationality: credentialSubject.nationality || 'Not disclosed',
          dateOfBirth: credentialSubject.date_of_birth || 'Not disclosed',
          gender: credentialSubject.gender || 'Not disclosed',
          passportNumber: credentialSubject.passport_number || 'Not disclosed',
          issuingState: credentialSubject.issuing_state || 'Not disclosed',
          expiryDate: credentialSubject.expiry_date || 'Not disclosed',
          above18: credentialSubject.older_than === '18' || false,
          fromEU: false, // This would need to be determined based on nationality
          notOnOFACList: credentialSubject.name_and_dob_ofac || false,
          timestamp: new Date().toISOString(),
          verificationProof: result.nullifier,
          userId: userId || proofUserId || 'unknown'
        };
        
        // Store the verified data
        if (userId) {
          verifiedProofs[userId] = passportData;
          console.log(`Stored verified passport data for userId: ${userId}`);
        }
        
        // Return success response with the verified data
        return addCorsHeaders(
          NextResponse.json({ 
            status: 'success',
            result: true,
            message: 'Verification successful',
            passportData
          }, { status: 200 })
        );
      } else {
        console.warn('Proof verification failed:', result.isValidDetails);
        return addCorsHeaders(
          NextResponse.json({ 
            status: 'error',
            result: false,
            message: 'Verification failed',
            details: result.isValidDetails
          }, { status: 400 })
        );
      }
    } catch (verifyError) {
      console.error('Error during verification:', verifyError);
      return addCorsHeaders(
        NextResponse.json({ 
          status: 'error',
          result: false,
          message: 'Error during verification',
          error: (verifyError as Error).message
        }, { status: 500 })
      );
    }
  } catch (error) {
    console.error('Error processing verification:', error);
    
    // Return error response
    return addCorsHeaders(
      NextResponse.json({ 
        status: 'error',
        result: false,
        message: 'Error processing verification',
        error: (error as Error).message
      }, { status: 500 })
    );
  }
} 