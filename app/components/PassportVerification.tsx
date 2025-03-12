'use client';

import React, { useState, useEffect, useCallback } from 'react';

import SelfQRcodeWrapper, { SelfAppBuilder } from '@selfxyz/qrcode';
import { useAccount } from 'wagmi';
import { v4 as uuidv4 } from 'uuid';

// Add this declaration at the top of the file to extend the Window interface
declare global {
  interface Window {
    selfProofVerified?: boolean;
  }
}

export type PassportVerificationData = {
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

type PassportVerificationProps = {
  onVerifiedAction: (data: PassportVerificationData) => void;
};

// Helper function to generate a deterministic userId based on the wallet address
const generateDeterministicUserId = (address: string): string => {
  if (!address) return uuidv4();
  
  // Create a deterministic UUID v5 based on the wallet address
  // This ensures the same wallet always gets the same UUID
  // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx where x is any hex digit and y is 8, 9, a, or b
  
  // Start with a fixed prefix
  const prefix = "10000000-1000-4000-8000-100000000000";
  
  // Use the wallet address to replace characters in the UUID
  // This ensures we maintain UUID format while making it deterministic
  const addressNormalized = address.toLowerCase().replace('0x', '');
  
  // Build the UUID with parts of the address
  let deterministicUuid = '';
  let addressIndex = 0;
  
  for (let i = 0; i < prefix.length; i++) {
    // Keep the dashes and the version/variant markers (4 and 8/9/a/b)
    if (prefix[i] === '-' || i === 14 || i === 19) {
      deterministicUuid += prefix[i];
    } else if (addressIndex < addressNormalized.length) {
      // Replace UUID character with a character from the address
      deterministicUuid += addressNormalized[addressIndex];
      addressIndex++;
      // Loop back to the start of the address if we run out of characters
      if (addressIndex >= addressNormalized.length) {
        addressIndex = 0;
      }
    } else {
      // Fallback to the prefix character if needed
      deterministicUuid += prefix[i];
    }
  }
  
  return deterministicUuid;
};

export default function PassportVerification({ onVerifiedAction }: PassportVerificationProps) {
  const { address } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selfApp, setSelfApp] = useState<any>(null);

  // Get the current origin to construct the proper endpoint
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  
  // IMPORTANT: Replace with your actual ngrok URL when you get it
  // For example: https://a1b2c3d4.ngrok.io
  // You need to update this with the URL from your ngrok terminal
  const NGROK_URL = 'https://01ae-24-5-60-88.ngrok-free.app'; // Updated with current ngrok URL
  
  // Use ngrok URL for development, or your regular origin for production
  const apiEndpoint = NGROK_URL ? `${NGROK_URL}/api/verify` : `${origin}/api/verify`;
  
  // Set up the user ID when component mounts or when wallet address changes
  useEffect(() => {
    if (address) {
      const walletBasedId = generateDeterministicUserId(address);
      console.log('Using deterministic UUID based on wallet address:', walletBasedId);
      setUserId(walletBasedId);
    } else if (!userId) {
      // Fallback to random ID if no wallet connected
      const generatedId = uuidv4();
      console.log('Generated temporary userId for verification:', generatedId);
      setUserId(generatedId);
    }
  }, [address, userId]);

  // Set isReady to true after hydration
  useEffect(() => {
    setIsReady(true);
  }, []);

  // Initialize Self app once we have a userId and address
  useEffect(() => {
    if (isReady && userId && address) {
      console.log(`Using API endpoint: ${apiEndpoint}`);
      console.log(`UserId: ${userId}`);
      
      try {
        // Create the Self app configuration with recommended constructor pattern
        // Note: Using type assertion to bypass type checking issues with external library
       
        const appBuilder = new SelfAppBuilder({
          appName: "Stamper",
          scope: "stamper-travel-app",
          // Use the ngrok URL for the endpoint
          endpoint: `${apiEndpoint}?userId=${userId}`, // Pass userId in the URL
          // Must be https for Self Protocol
          endpointType: "https",
          userId: userId,
          disclosures: {
            // DG1 disclosures
            issuing_state: true,
            name: true,
            nationality: true,
            date_of_birth: true,
            passport_number: true,
            gender: true,
            expiry_date: true,
            
            // Custom verification rules
            minimumAge: 18,
            excludedCountries: ["IRN", "PRK"],
            ofac: true,
          },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        const newSelfApp = appBuilder.build();
        console.log('Self app initialized:', newSelfApp);
        setSelfApp(newSelfApp);
      } catch (err) {
        console.error('Error initializing Self app:', err);
        setError(`Self app initialization error: ${(err as Error).message}`);
      }
    }
  }, [isReady, userId, address, apiEndpoint]);

  // Handle successful verification and trigger the callback
  const completeVerification = useCallback((data: PassportVerificationData) => {
    try {
      console.log('🎉 COMPLETE VERIFICATION - Processing verification data:', data);
      
      if (!data) {
        console.error('❌ ERROR: No verification data provided to completeVerification');
        setError('Verification failed: No data available');
        setIsProcessing(false);
        return;
      }
      
      // Log the data we're about to pass to the callback
      console.log('📋 Verification data fields:');
      console.log('- userId:', data.userId);
      console.log('- name:', data.name);
      console.log('- nationality:', data.nationality);
      console.log('- isHuman:', data.isHuman);
      
      // Call the callback provided by the parent component
      console.log('👉 Calling onVerifiedAction callback with passport data');
      onVerifiedAction(data);
      
      console.log('✅ Verification complete. Flow should continue now.');
      setIsProcessing(false);
      
    } catch (error) {
      console.error('❌ ERROR in completeVerification:', error);
      setError(`Verification error: ${(error as Error).message}`);
      setIsProcessing(false);
    }
  }, [onVerifiedAction, setError]);

  // Retrieve the real verification data from API
  const fetchVerificationData = useCallback(async () => {
    console.log('Attempting to retrieve passport data from API...');
    setIsProcessing(true);
    
    try {
      const response = await fetch(`${apiEndpoint}?userId=${userId}`);
      
      if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        
        if (data.status === 'success' && data.passportData) {
          console.log('API returned verification data:', data.passportData);
          completeVerification(data.passportData);
          return true;
        }
      }
      
      // API failed or returned invalid data
      console.error('API failed or returned invalid data. Cannot continue without real verification data.');
      setError('Verification data could not be retrieved. Please try again.');
      setIsProcessing(false);
      return false;
    } catch (err) {
      console.error('Error retrieving data from API:', err);
      setError('Error retrieving verification data. Please try again.');
      setIsProcessing(false);
      return false;
    }
  }, [apiEndpoint, userId, completeVerification]);

  // Handle verification detected through WebSocket or other means
  const handleVerificationDetected = useCallback(() => {
    console.log('🎯 VERIFICATION DETECTED - Starting verification process');
    
    // Show loading indicator immediately
    setIsProcessing(true);
    
    // Clear any previous errors
    setError(null);
    
    console.log('⏱️ Waiting 3 seconds for backend to process verification...');
    
    // Try multiple times to get the verification data, in case the first attempt is too early
    const attemptFetch = (attempt = 1, maxAttempts = 3) => {
      console.log(`📡 Attempt ${attempt}/${maxAttempts} to fetch verification data...`);
      
      fetchVerificationData()
        .then(success => {
          if (!success && attempt < maxAttempts) {
            console.log(`⏱️ Attempt ${attempt} failed, retrying in 2 seconds...`);
            setTimeout(() => attemptFetch(attempt + 1, maxAttempts), 2000);
          }
        })
        .catch(err => {
          console.error('❌ Error during verification data fetch:', err);
          if (attempt < maxAttempts) {
            console.log(`⏱️ Retrying after error (attempt ${attempt}/${maxAttempts})...`);
            setTimeout(() => attemptFetch(attempt + 1, maxAttempts), 2000);
          } else {
            setError(`Failed to fetch verification data after ${maxAttempts} attempts.`);
            setIsProcessing(false);
          }
        });
    };
    
    // Wait a moment before the first attempt to give the backend time to process
    setTimeout(() => {
      attemptFetch();
    }, 3000);
    
  }, [fetchVerificationData, setError]);

  // Set up the Self QR code success handler
  const handleQRSuccess = useCallback(() => {
    console.log('🚀 QR SUCCESS CALLBACK TRIGGERED - this should lead to verification');
    handleVerificationDetected();
  }, [handleVerificationDetected]);

  // Monitor WebSocket events for verification status
  useEffect(() => {
    if (!selfApp) return;
    
    console.log('Setting up WebSocket monitoring for verification events');
    
    // Track if we've already successfully verified
    let verified = false;
    
    // Original addEventListener to restore later
    const originalAddEventListener = window.WebSocket.prototype.addEventListener;
    
    // Override the WebSocket addEventListener to monitor events
    window.WebSocket.prototype.addEventListener = function(
      type: string, 
      listener: EventListener, 
      options?: boolean | AddEventListenerOptions
    ) {
      // Log event listener types being added
      console.log(`WebSocket event listener added for: ${type}`);
      
      // Create a wrapped listener that can intercept events
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wrappedListener = (event: any) => {
        // For errors, log and set error state
        if (type === 'error') {
          console.error(`⚠️ WebSocket error:`, event);
          setError('WebSocket connection error. Please try again.');
        }
        
        // For close events, log the reason
        if (type === 'close') {
          console.log(`WebSocket connection closed:`, event);
        }
        
        // For message events, try to detect verification
        if (type === 'message' && event.data) {
          console.log(`WebSocket message received:`, event.data);
          
          try {
            const data = JSON.parse(event.data);
            
            // Log all WebSocket messages for debugging
            console.log('📩 Parsed WebSocket message:', data);
            
            // Add explicit logging for all WebSocket messages
            console.log('🔍 WebSocket message data inspection:', {
              dataType: typeof data,
              hasName: !!data?.name,
              name: data?.name,
              hasStatus: !!data?.status,
              status: data?.status,
              hasArgs: !!data?.args,
              argsStatus: data?.args?.[0]?.status,
              rawData: data
            });

            // Check for verification in multiple ways to be extra robust
            const isVerified = 
              // Case 1: Standard format with args
              (data?.name === 'mobile_status' && data?.args?.[0]?.status === 'proof_verified') ||
              // Case 2: Format with direct status in mobile_status
              (data?.name === 'mobile_status' && data?.status === 'proof_verified') ||
              // Case 3: Direct status property
              (data?.status === 'proof_verified') ||
              // Case 4: Also check 'proofVerified' property just in case
              (data?.proofVerified === true);
            
            if (isVerified) {
              console.log('🎉🎉🎉 VERIFICATION DETECTED! Triggering verification flow now!');
              
              // Set global flag
              window.selfProofVerified = true;
              
              // Force immediate verification handling, bypass debounce
              if (!verified) {
                console.log('🔄 Starting verification handling process...');
                verified = true;
                
                // Force processing state immediately to give visual feedback
                setIsProcessing(true);
                
                // Immediately start verification handling
                handleVerificationDetected();
              }
            }
          } catch (error) {
            console.warn('Error parsing WebSocket message:', error);
          }
        }
        
        // Call the original listener
        listener(event);
      };
      
      // Call the original addEventListener with our wrapped listener
      return originalAddEventListener.call(this, type, wrappedListener, options);
    };
    
    // Listen for the official verification event
    const handleVerificationEvent = () => {
      console.log('Self Protocol verification event received');
      if (!verified) {
        verified = true;
        handleVerificationDetected();
      }
    };
    
    window.addEventListener('selfProtocolVerified', handleVerificationEvent);
    
    // Set up global flag
    window.selfProofVerified = false;
    
    // Polling interval to check for verification data
    const interval = setInterval(() => {
      if (window.selfProofVerified && !verified) {
        console.log('Detected verification via polling');
        verified = true;
        handleVerificationDetected();
      }
    }, 5000);
    
    // Clean up
    return () => {
      window.WebSocket.prototype.addEventListener = originalAddEventListener;
      window.removeEventListener('selfProtocolVerified', handleVerificationEvent);
      clearInterval(interval);
    };
  }, [selfApp, handleVerificationDetected]);

  // If we're not ready or don't have a userId or address, show a loading/connect message
  if (!isReady || !userId || !address) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-600">Please connect your wallet to verify your passport.</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-md p-6 mx-auto bg-white border border-gray-200 rounded-lg shadow-md">
      <h2 className="mb-4 text-xl font-semibold text-gray-800">Passport Verification</h2>
      
      {isProcessing ? (
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-8 h-8 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
          <p className="text-gray-600">Processing verification...</p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-center text-gray-600">
            Scan the QR code with your Self app to verify your passport details.
          </p>
          
          <div className="p-4 mb-4 bg-gray-100 rounded-lg">
            {selfApp && (
              <>
                <p className="text-xs text-gray-500 mb-2">QR Code ready for scanning</p>
                <SelfQRcodeWrapper
                  selfApp={selfApp}
                  onSuccess={handleQRSuccess}
                  size={250}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Scan with Self app to verify your identity
                </p>
              </>
            )}
          </div>
          
          {error && (
            <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
              {error}
            </div>
          )}
        </>
      )}

      {/* Debugging button - only show in development */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="mt-4 border-t pt-4">
          <p className="text-xs text-gray-500 mb-2">Debugging Tools</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                console.log('🧪 TEST: Manually triggering verification process');
                console.log('1. Current userId:', userId);
                
                // Force processing state
                setIsProcessing(true);
                
                // Directly attempt to fetch verification data
                setTimeout(async () => {
                  console.log('2. Attempting to fetch verification data from API');
                  try {
                    const response = await fetch(`${apiEndpoint}?userId=${userId}`);
                    console.log('3. API Response:', response);
                    
                    if (response.ok) {
                      console.log('4. Response is OK');
                      const contentType = response.headers.get('content-type');
                      console.log('5. Content-Type:', contentType);
                      
                      if (contentType?.includes('application/json')) {
                        const data = await response.json();
                        console.log('6. Parsed JSON data:', data);
                        
                        if (data.status === 'success' && data.passportData) {
                          console.log('7. Found valid passport data');
                          // This should trigger the callback to parent component
                          console.log('8. Calling onVerifiedAction with data');
                          onVerifiedAction(data.passportData);
                          setIsProcessing(false);
                          return;
                        } else {
                          console.log('7. ERROR: Data status not success or missing passportData', data);
                        }
                      } else {
                        console.log('5. ERROR: Content-Type not application/json');
                      }
                    } else {
                      console.log('4. ERROR: Response not OK, status:', response.status);
                    }
                    
                    // If we reach here, show an error and stop processing
                    setError('Error in verification process. Check console logs.');
                    setIsProcessing(false);
                  } catch (err) {
                    console.error('API request error:', err);
                    setError(`API request error: ${(err as Error).message}`);
                    setIsProcessing(false);
                  }
                }, 1000);
              }}
              className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded border border-yellow-300"
            >
              Test Verification Process
            </button>
            
            <button
              onClick={() => {
                console.log('🔍 TEST: Simulating QR verification detection');
                console.log('Setting window.selfProofVerified = true');
                
                // Set the global verification flag
                window.selfProofVerified = true;
                
                // This should trigger the same flow as if a real QR scan completed
                handleVerificationDetected();
              }}
              className="px-3 py-1 text-sm bg-orange-100 text-orange-800 rounded border border-orange-300"
            >
              Test Verification Detection
            </button>

            <button
              onClick={() => {
                console.log('🔍 TEST: Directly calling the onVerifiedAction callback');
                // Create test data that mimics what would come back from the API
                const testData: PassportVerificationData = {
                  isHuman: true,
                  name: 'Test User',
                  nationality: 'Test Country',
                  dateOfBirth: '1990-01-01',
                  gender: 'X',
                  passportNumber: 'TEST1234',
                  issuingState: 'TST',
                  expiryDate: '2030-01-01',
                  above18: true,
                  fromEU: false,
                  notOnOFACList: true,
                  timestamp: new Date().toISOString(),
                  verificationProof: `test_${Date.now()}`,
                  userId: userId || 'unknown'
                };
                
                // This call should directly trigger the parent callback
                onVerifiedAction(testData);
              }}
              className="px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded border border-purple-300 mt-2"
            >
              Direct Callback (Bypass Flow)
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 