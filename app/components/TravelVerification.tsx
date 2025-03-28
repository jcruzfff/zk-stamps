'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import Image from 'next/image';

// Import debug file
import '../debug';

// Import the actual contract address from lib/blockchain
import { POAP_CONTRACT_ADDRESS } from '../lib/blockchain';

type Location = {
  country: string;
  countryCode: string;
  timestamp: string;
  coordinates: [number, number];
};

type POAP = {
  id: string;
  country: string;
  countryCode: string;
  timestamp: string;
  coordinates: [number, number];
  transactionHash: string;
  verificationProof: string;
};

// Contract ABI for the ZKStampsPOAP mint function
const POAP_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "countryCode",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "countryName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "coordinates",
        "type": "string"
      }
    ],
    "name": "mintPOAP",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "countryCode",
        "type": "string"
      }
    ],
    "name": "hasVisitedCountry",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export default function TravelVerification({ 
  isPassportVerified,
  onPoapMinted
}: { 
  isPassportVerified: boolean;
  onPoapMinted?: (poap: POAP) => void;
}) {
  // Use a ref to track if we've already initialized to avoid duplicate logs
  const hasInitialized = useRef(false);
  
  const { isConnected, address } = useAccount();
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'scanning' | 'verifying' | 'success' | 'error'>('idle');
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'requesting' | 'success' | 'error'>('idle');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [poaps, setPoaps] = useState<POAP[]>([]);
  const [selectedPoap, setSelectedPoap] = useState<POAP | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isNewCountry, setIsNewCountry] = useState<boolean>(false);
  const [buttonStyle, setButtonStyle] = useState<string>('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isButtonVisible, setIsButtonVisible] = useState(false);

  // Set up contract write for minting the POAP directly from the user's wallet
  const { writeContract, data: transactionHash, isPending: isWritePending, error: writeError } = useWriteContract();

  // Track transaction status once transaction is submitted
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: txError } = useWaitForTransactionReceipt({
    hash: transactionHash,
  });
  
  // Only log initialization once
  useEffect(() => {
    if (!hasInitialized.current) {
      console.log("TravelVerification component initialized");
      console.log("Wallet connection:", { isConnected, address });
      hasInitialized.current = true;
    }
  }, [isConnected, address]);
  
  // Debug log for button state - only log when relevant values change
  useEffect(() => {
    if (hasInitialized.current) {
      // Only log if there's a significant state change
      const buttonState = {
        isPassportVerified,
        isConnected,
        hasCurrentLocation: !!currentLocation,
        isWritePending,
        isConfirming,
        verificationStatus,
        buttonDisabled: !isPassportVerified || !isConnected || !currentLocation || isWritePending || isConfirming
      };
      
      console.log("Button state changed:", buttonState);
    }
  }, [isPassportVerified, isConnected, currentLocation, isWritePending, isConfirming, verificationStatus]);

  // Add new POAP to the collection
  useEffect(() => {
    // Only run this effect if we have a transaction in progress or completed
    const isTransactionInProgress = isWritePending || isConfirming;
    const isTransactionCompleted = isConfirmed && transactionHash;
    const isTransactionFailed = !!writeError || !!txError;
    
    if (!isTransactionInProgress && !isTransactionCompleted && !isTransactionFailed) {
      return; // Early return if no transaction is happening
    }
    
    if (isTransactionInProgress) {
      console.log('🔶 [TravelVerification] Transaction in progress...', { isWritePending, isConfirming });
      setVerificationStatus('verifying');
      return; // Exit early to avoid unnecessary code execution
    }
    
    if (isTransactionCompleted) {
      console.log('🔶 [TravelVerification] Transaction completed successfully:', { 
        transactionHash,
        currentLocation
      });
      
      // Run this code only once when transaction is confirmed
      // Create new POAP data based on successful transaction
      const newPoap: POAP = {
        id: `${currentLocation?.countryCode || 'unknown'}-${Date.now()}`,
        country: currentLocation?.country || 'Unknown',
        countryCode: currentLocation?.countryCode || 'XX',
        timestamp: new Date().toISOString(),
        coordinates: currentLocation?.coordinates || [0, 0],
        transactionHash: transactionHash,
        verificationProof: `proof-${Date.now()}`
      };
      
  
      
      // Use a function to update state to avoid closure issues
      setPoaps(prevPoaps => {
       
        
        // Check if this POAP already exists (based on countryCode)
        const poapExists = prevPoaps.some(p => p.countryCode.toLowerCase() === newPoap.countryCode.toLowerCase());
        
        // Only add if it doesn't exist
        const updatedPoaps = poapExists ? prevPoaps : [...prevPoaps, newPoap];
        
      
        
        // Store in localStorage for persistence
        if (typeof window !== 'undefined') {
          
          try {
            // Ensure we don't have duplicates in localStorage either
            if (!poapExists) {
              localStorage.setItem('poaps', JSON.stringify(updatedPoaps));
              console.log('🔶 [TravelVerification] Successfully stored in localStorage');
              
              // Dispatch custom events to notify other components
              setTimeout(() => {
                window.dispatchEvent(new Event('storage-updated'));
                window.dispatchEvent(new Event('poap-minted'));
              }, 0);
            } else {
             
            }
          } catch  {
           
          }
        }
        
        return updatedPoaps;
      });
      
      setSelectedPoap(newPoap);
      setVerificationStatus('success');
      setIsNewCountry(false); // Reset the new country status
      
      // Notify parent component about the new POAP
      if (onPoapMinted) {
      
        onPoapMinted(newPoap);
      }
      
      // Automatically hide the success banner after 5 seconds
      setTimeout(() => {
        setSelectedPoap(null);
      }, 5000);
      
      return; // Exit early
    }
    
    if (isTransactionFailed) {
    
      const errorMsg = (writeError || txError)?.message || 'Failed to mint POAP';
      setErrorMessage(errorMsg);
      setVerificationStatus('error');
    }
  }, [
    isWritePending, 
    isConfirming, 
    isConfirmed, 
    transactionHash, 
    writeError, 
    txError, 
    currentLocation, 
    onPoapMinted
  ]);

  // Get real GPS location
  useEffect(() => {
    if (navigator.geolocation) {
      setGpsStatus('requesting');
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Get the actual coordinates
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // Use reverse geocoding to get country information
            // For a production app, you should use a proper geocoding service
            // Here we're using a free service for demonstration
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=en`
            );
            
            if (!response.ok) {
              throw new Error('Failed to fetch location data');
            }
            
            const data = await response.json();
            
            // Extract country information
            const country = data.address?.country || 'Unknown';
            const countryCode = data.address?.country_code?.toUpperCase() || 'XX';
            
            // Create the location object
            const newLocation = {
              country,
              countryCode,
              timestamp: new Date().toISOString(),
              coordinates: [lat, lng] as [number, number]
            };
            
            // Check if this is a new country the user hasn't visited before
            // Load existing POAPs from localStorage
            let isNew = true;
            if (typeof window !== 'undefined') {
              const storedPoaps = localStorage.getItem('poaps');
              if (storedPoaps) {
                const existingPoaps = JSON.parse(storedPoaps) as POAP[];
                isNew = !existingPoaps.some(p => p.countryCode === countryCode);
              }
            }
            
            // Set the location and newness status
            setCurrentLocation(newLocation);
            setIsNewCountry(isNew);
            setGpsStatus('success');
          } catch (error) {
            console.error('Error fetching location data:', error);
            setErrorMessage('Failed to determine your country from GPS coordinates');
            setGpsStatus('error');
            
            // Fallback to a demo location if reverse geocoding fails
            setCurrentLocation({
              country: 'Unknown Location',
              countryCode: 'XX',
              timestamp: new Date().toISOString(),
              coordinates: [position.coords.latitude, position.coords.longitude]
            });
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setErrorMessage('Unable to access your location. Please enable location services and try again.');
          setGpsStatus('error');
        }
      );
    } else {
      setErrorMessage('Geolocation is not supported by your browser');
      setGpsStatus('error');
    }
  }, []);

  // Load existing POAPs and determine if this is a new country
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPoaps = localStorage.getItem('poaps');
      if (storedPoaps) {
        try {
          const parsedPoaps = JSON.parse(storedPoaps) as POAP[];
          setPoaps(parsedPoaps);
          
          // Check if we have a current location to determine if it's a new country
          if (currentLocation) {
            const isNew = !parsedPoaps.some(p => p.countryCode === currentLocation.countryCode);
            
            // Set the new country flag
            setIsNewCountry(isNew);
          }
        } catch (error) {
          console.error('Error parsing stored POAPs:', error);
        }
      } else if (currentLocation) {
        // If no stored POAPs, this must be a new country
        setIsNewCountry(true);
      }
    }
  }, [currentLocation]);

  // Setup Intersection Observer to detect when button is in viewport
  useEffect(() => {
    if (!buttonRef.current || !isNewCountry) return;
    
    // Store the ref value in a variable to use in cleanup
    const buttonElement = buttonRef.current;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !isButtonVisible) {
            // Button has entered viewport, set flag
            setIsButtonVisible(true);
          }
        });
      },
      { threshold: 0.5 } // Trigger when at least 50% of the button is visible
    );
    
    // Start observing the button
    observer.observe(buttonElement);
    
    // Cleanup
    return () => {
      if (buttonElement) {
        observer.unobserve(buttonElement);
      }
    };
  }, [buttonRef, isNewCountry, isButtonVisible]);

  // Trigger animation when button becomes visible
  useEffect(() => {
    if (isNewCountry && isButtonVisible) {
      // Set initial default style
      setButtonStyle('bg-[#03AEEC] text-white');
      
      // Start animation sequence when the button is visible
      setTimeout(() => {
        setButtonStyle('bg-[#03AEEC] text-white scale-105 shadow-md transition-all duration-400');
        
        // Then scale back with a slight bounce effect
        setTimeout(() => {
          setButtonStyle('bg-[#03AEEC] text-white scale-100 transition-all duration-400');
          
          // Final pulse effect with subtle glow
          setTimeout(() => {
            setButtonStyle('bg-[#03AEEC] text-white scale-103 shadow-sm transition-all duration-400');
            
            // End with normal state but keep a subtle hover effect
            setTimeout(() => {
              setButtonStyle('bg-[#03AEEC] text-white scale-102 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md hover:bg-[#03AEEC]/90');
            }, 500);
          }, 500);
        }, 500);
      }, 300);
    }
  }, [isNewCountry, isButtonVisible]);

  // Function to check if a POAP already exists for this country
  const hasAlreadyMintedForCountry = useCallback((countryCode: string) => {
    // Only do this check if we have a valid country code
    if (!countryCode) return false;
    
    try {
      // Normalize country code to lowercase for consistent comparison
      const normalizedCode = countryCode.toLowerCase();
      
      // Look in localStorage first
      const storedPoaps = localStorage.getItem('poaps');
      
      if (storedPoaps) {
        const parsedPoaps = JSON.parse(storedPoaps) as POAP[];
        
        if (Array.isArray(parsedPoaps) && parsedPoaps.length > 0) {
          // Check if this country code already exists
          const exists = parsedPoaps.some(p => p.countryCode.toLowerCase() === normalizedCode);
          
      
          
          return exists;
        }
      }
      
      return false;
    } catch  {
      
      return false;
    }
  }, []);

  // Check on the blockchain if this user has already minted a POAP for the detected country
  useEffect(() => {
    if (!isConnected || !address || !currentLocation) return;
    
   
    
    // Update button text based on whether the user has already minted this POAP
    setIsNewCountry(!hasAlreadyMintedForCountry(currentLocation.countryCode));
  }, [isConnected, address, currentLocation, hasAlreadyMintedForCountry]);

  // Handle storing a new POAP when minted
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleStorePOAP = useCallback((countryCode: string, country: string, coordinates: [number, number]) => {
    // Only proceed if we have valid data
    if (!countryCode) {
      console.error('Cannot store POAP: Missing country code');
      return;
    }
    
    try {
      // Normalize country code to lowercase
      const normalizedCode = countryCode.toLowerCase();
      
      // Check if this POAP already exists for this country
      const alreadyExists = hasAlreadyMintedForCountry(normalizedCode);
      
      if (alreadyExists) {
        // Only log in development mode
        if (process.env.NODE_ENV === 'development') {
          console.log(`POAP for ${country} already exists, not adding duplicate`);
        }
        return; // Don't add duplicates
      }
      
      // Create a new POAP object
      const newPOAP: POAP = {
        id: `${normalizedCode}-${Date.now()}`,
        country: country,
        countryCode: normalizedCode,
        timestamp: new Date().toISOString(),
        coordinates: coordinates,
        transactionHash: `tx-${Date.now()}`, // In a real app, this would be the actual transaction hash
        verificationProof: `proof-${Date.now()}` // Placeholder for proof
      };
      
      // Update localStorage
      const storedPoaps = localStorage.getItem('poaps');
      let updatedPoaps: POAP[] = [];
      
      if (storedPoaps) {
        const parsedPoaps = JSON.parse(storedPoaps) as POAP[];
        // Create a new array with the previous POAPs and the new one
        updatedPoaps = [...parsedPoaps, newPOAP];
      } else {
        // First POAP
        updatedPoaps = [newPOAP];
      }
      
      // Store in localStorage
      localStorage.setItem('poaps', JSON.stringify(updatedPoaps));
      
      // Dispatch storage event to notify other components
      setTimeout(() => {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('poap-minted'));
      }, 0);
      
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log(`POAP for ${country} added successfully`);
      }
      
      // Update button state to reflect the new POAP
      setIsNewCountry(false);
      
    } catch (error) {
      console.error('Error storing POAP:', error);
    }
  }, [hasAlreadyMintedForCountry]);

  /**
   * Request a POAP mint - this will now be done directly from the user's wallet
   */
  const requestPOAPMint = async () => {
    console.log("Button clicked - requestPOAPMint function called");
    
    // Only proceed if all conditions are met
    if (verificationStatus !== 'idle' || !isConnected || !currentLocation || !address || !isPassportVerified) {
    
      return;
    }

    // Check if the user already has a POAP for this country
    const alreadyMinted = hasAlreadyMintedForCountry(currentLocation.countryCode);
    if (alreadyMinted) {
      console.log(`Already minted a POAP for ${currentLocation.country}`);
      
      // Show an error message instead of allowing duplicate minting
      setErrorMessage(`You've already minted a POAP for ${currentLocation.country}`);
      return;
    }

    try {
      console.log("All conditions met - proceeding with mint");
      // Format coordinates for the contract (convert to string with 6 decimal precision)
      const formattedCoordinates = currentLocation.coordinates.map(coord => 
        coord.toFixed(6)
      ).join(',');
      
      console.log("Formatted coordinates:", formattedCoordinates);
      console.log("Initiating blockchain transaction to mint POAP");

      // Verify contract address
      if (!POAP_CONTRACT_ADDRESS || POAP_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
        throw new Error('Invalid contract address. Please configure POAP_CONTRACT_ADDRESS in your environment variables.');
      }

      // Set the verification status to verifying
      setVerificationStatus('verifying');
      
      // Call the smart contract directly from the user's wallet
      // This will prompt the wallet for transaction confirmation
      writeContract({
        abi: POAP_ABI,
        address: POAP_CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'mintPOAP',
        args: [
          currentLocation.countryCode,
          currentLocation.country,
          formattedCoordinates
        ]
      });
      
      // The useEffect hook watching for transaction states will handle success/failure
    } catch (err) {
      console.error('Minting error:', err);
      
      // Show a detailed error message
      const errorMessage = err instanceof Error ? err.message : 'Failed to mint POAP';
      setErrorMessage(`Transaction failed: ${errorMessage}`);
      setVerificationStatus('error');
    }
  };

  return (
    <div className="">
      <div className="pb-4">
        <div className="flex items-start">
          <div className="flex-1">
           
            
            {isNewCountry && (
              <div className="p-4 bg-white border border-[#E3F2FD] rounded-lg mb-8 shadow-sm relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#45A7E8] to-[#03AEEC]"></div>
                <div className="absolute top-1 right-3 w-12 h-12 rounded-full bg-blue-50 opacity-20"></div>
                <div className="absolute bottom-2 left-2 w-8 h-8 rounded-full bg-blue-50 opacity-20"></div>
                
                <div className="flex items-start space-x-3">
                  
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 text-lg flex items-center">
                      New Country Detected!
                      <span className="ml-2 inline-block animate-pulse">✨</span>
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      This is your first visit to this location. Mint a POAP below to add it to your travel collection!
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Location information */}
            <div className="bg-gray-50 mb-4 rounded-lg relative">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-16">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Current Location:</h4>
                  <h3 className="text-2xl font-semibold mb-2 text-gray-800">
                    {currentLocation?.country || 'Detecting...'}
                  </h3>
                  
                  {currentLocation && (
                    <p className="text-sm text-gray-500 mb-2">
                      Coordinates: {currentLocation.coordinates[0].toFixed(4)}, {currentLocation.coordinates[1].toFixed(4)}
                    </p>
                  )}
                  
                  {gpsStatus === 'success' && (
                    <p className="text-sm text-[#45A7E8] flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      GPS location confirmed
                    </p>
                  )}
                </div>
                
                {/* Country flag */}
                {currentLocation && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="w-16 h-16 rounded-full overflow-hidden ">
                      <Image
                        src={`/flags/${currentLocation.countryCode.toLowerCase()}.png`}
                        alt={`Flag of ${currentLocation.country}`}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          // Fallback if flag image doesn't exist
                          const target = e.target as HTMLImageElement;
                          target.src = '/flags/placeholder.svg';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          {isNewCountry ? (
            <button
              ref={buttonRef}
              onClick={requestPOAPMint}
              disabled={!isButtonVisible}
              className={`action-button ${buttonStyle} ${isButtonVisible ? '' : 'opacity-0'} w-full py-3 px-4 rounded-[42px] font-medium`}
            >
              {verificationStatus === 'idle' && "Mint Country POAP"}
              {verificationStatus === 'scanning' && "Scanning Location..."}
              {verificationStatus === 'verifying' && "Verifying..."}
              {verificationStatus === 'success' && "✅ POAP Successfully Minted!"}
              {verificationStatus === 'error' && "❌ Error - Try Again"}
            </button>
          ) : (
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <p className="font-medium text-[#45A7E8]">Already in Collection</p>
             
            </div>
          )}
        </div>
        
        {verificationStatus === 'error' && (
          <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
        )}
      </div>

      {selectedPoap && (
        <div className="success-banner bg-gradient-to-r from-[#45A7E8] to-[#03AEEC] p-4 rounded-lg shadow-md text-white mb-2">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-white text-lg">POAP Successfully Minted!</h4>
              <p className="text-sm text-white/90">Added {selectedPoap.country} to your collection</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}