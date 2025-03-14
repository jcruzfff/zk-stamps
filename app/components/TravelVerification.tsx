'use client';

import React, { useState, useEffect, useRef } from 'react';
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
      
      console.log('🔶 [TravelVerification] Created new POAP object:', newPoap);
      
      // Use a function to update state to avoid closure issues
      setPoaps(prevPoaps => {
        console.log('🔶 [TravelVerification] Previous POAPs:', prevPoaps);
        const updatedPoaps = [...prevPoaps, newPoap];
        console.log('🔶 [TravelVerification] Updated POAPs array:', updatedPoaps);
        
        // Store in localStorage for persistence
        if (typeof window !== 'undefined') {
          console.log('🔶 [TravelVerification] Storing POAPs in localStorage');
          try {
            localStorage.setItem('poaps', JSON.stringify(updatedPoaps));
            console.log('🔶 [TravelVerification] Successfully stored in localStorage');
            
            // Dispatch custom events to notify other components
            window.dispatchEvent(new Event('storage-updated'));
            window.dispatchEvent(new Event('poap-minted'));
          } catch (storageError) {
            console.error('🔴 [TravelVerification] Error storing in localStorage:', storageError);
          }
        }
        
        return updatedPoaps;
      });
      
      setSelectedPoap(newPoap);
      setVerificationStatus('success');
      setIsNewCountry(false); // Reset the new country status
      
      // Notify parent component about the new POAP
      if (onPoapMinted) {
        console.log('🔶 [TravelVerification] Notifying parent component of new POAP');
        onPoapMinted(newPoap);
      }
      
      // Automatically hide the success banner after 5 seconds
      setTimeout(() => {
        setSelectedPoap(null);
      }, 5000);
      
      return; // Exit early
    }
    
    if (isTransactionFailed) {
      console.error('🔴 [TravelVerification] Transaction failed:', { writeError, txError });
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

  // Function to check if user has already minted a POAP for the current country
  const hasAlreadyMintedForCountry = async (countryCode: string | undefined): Promise<boolean> => {
    console.log('🔍 [hasAlreadyMintedForCountry] Checking if POAP exists for', countryCode);
    if (!countryCode || typeof window === 'undefined') return false;
    
    try {
      // Get POAPs from localStorage
      const storedPoaps = localStorage.getItem('poaps');
      if (!storedPoaps) {
        console.log('🔍 [hasAlreadyMintedForCountry] No POAPs found in localStorage');
        return false;
      }
      
      // Parse the stored POAPs
      const poaps = JSON.parse(storedPoaps);
      if (!Array.isArray(poaps) || poaps.length === 0) {
        console.log('🔍 [hasAlreadyMintedForCountry] No valid POAPs array in localStorage');
        return false;
      }
      
      // Check if any POAP matches the current country code (case insensitive)
      const found = poaps.some(poap => 
        poap.countryCode && poap.countryCode.toLowerCase() === countryCode.toLowerCase()
      );
      
      if (found) {
        console.log(`🔍 [hasAlreadyMintedForCountry] Found existing POAP for ${countryCode}`);
      }
      
      return found;
    } catch (error) {
      console.error('🔴 [hasAlreadyMintedForCountry] Error checking for existing POAP:', error);
      return false;
    }
  };

  // Check blockchain for already minted POAPs
  useEffect(() => {
    // Only run if we have a wallet address
    if (!isConnected || !address) return;
    
    const checkBlockchainPoaps = async () => {
      try {
        console.log('🔍 [TravelVerification] Checking blockchain for POAPs minted by', address);
        
        // If we have a current location, check if this user has already minted a POAP for this country
        if (currentLocation) {
          // Use the same function we use during minting to check for existing POAPs
          const hasVisited = await hasAlreadyMintedForCountry(currentLocation.countryCode);
          console.log(`🔍 [TravelVerification] Has visited ${currentLocation.country}:`, hasVisited);
          
          // Update the new country flag based on the check
          setIsNewCountry(!hasVisited);
        }
      } catch (error) {
        console.error('🔴 [TravelVerification] Error checking blockchain POAPs:', error);
      }
    };
    
    // Only run once when component mounts or when location changes
    if (currentLocation) {
      checkBlockchainPoaps();
    }
  }, [isConnected, address, currentLocation]);

  // Legacy server-side verification method kept as fallback
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const startVerification = async () => {
    if (!isPassportVerified || !isConnected || !currentLocation) {
      return;
    }
    
    setVerificationStatus('scanning');
    
    // In a real app, this would be another Self Protocol QR code scan
    // that would verify the passport again along with the location
    setTimeout(async () => {
      setVerificationStatus('verifying');
      
      try {
        // Send the location data to the travel verification API
        const response = await fetch('/api/travel-verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress: address,
            ...currentLocation,
            isPassportVerified,
          }),
        });
        
        // Parse the response as text first to handle non-JSON errors
        const rawText = await response.text();
        let data;
        
        try {
          data = JSON.parse(rawText);
        } catch (error) {
          console.error('Failed to parse response:', error, rawText);
          throw new Error(`Server returned invalid JSON: ${rawText.substring(0, 100)}...`);
        }
        
        if (!response.ok) {
          throw new Error(data.message || `Server returned ${response.status}: ${response.statusText}`);
        }
        
        if (data.success && data.poapData) {
          // Store the POAP data
          const newPoap: POAP = data.poapData;
          
          // Check if this is a simulated transaction in development
          if (data.development) {
            console.log('Using simulated transaction in development mode');
          } else {
            console.log('Real blockchain transaction confirmed:', data.poapData.transactionHash);
          }
          
          // Store in localStorage for persistence
          const updatedPoaps = [...poaps, newPoap];
          if (typeof window !== 'undefined') {
            localStorage.setItem('poaps', JSON.stringify(updatedPoaps));
          }
          
          setPoaps(updatedPoaps);
          setSelectedPoap(newPoap);
          setVerificationStatus('success');
          setIsNewCountry(false); // Reset the new country status
          
          // Notify parent component about the new POAP
          if (onPoapMinted) {
            onPoapMinted(newPoap);
          }
        } else {
          throw new Error(data.message || 'Failed to mint POAP');
        }
      } catch (error) {
        console.error('Error verifying travel:', error);
        setErrorMessage((error as Error).message);
        setVerificationStatus('error');
      }
    }, 3000);
  };

  /**
   * Request a POAP mint - this will now be done directly from the user's wallet
   */
  const requestPOAPMint = async () => {
    console.log("Button clicked - requestPOAPMint function called");
    
    // Only proceed if all conditions are met
    if (verificationStatus !== 'idle' || !isConnected || !currentLocation || !address || !isPassportVerified) {
      console.log("Conditions not met - returning early");
      return;
    }

    // Check if the user already has a POAP for this country
    const alreadyMinted = await hasAlreadyMintedForCountry(currentLocation.countryCode);
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
    <div className="travel-verification shadow-sm rounded-lg overflow-hidden">
      <div className="p-6 pb-4">
        <div className="flex items-start">
          <div className="flex-1">
            {/* Simplified welcome message */}
            <h3 className="text-xl font-semibold mb-4">
              {currentLocation ? `Welcome to ${currentLocation.country}!` : 'Detecting location...'}
            </h3>
            
            {isNewCountry && (
              <div className="p-3 bg-blue-50 rounded-lg mb-4">
                <p className="font-medium text-blue-800">✨ New Country Detected!</p>
                <p className="text-sm text-blue-700 mt-1">
                  This is your current location. Mint a POAP to add it to your collection!
                </p>
              </div>
            )}
            
            {/* Location information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Current Location:</h4>
              <h3 className="text-lg font-medium mb-2">
                {currentLocation?.country || 'Detecting...'}
              </h3>
              
              {currentLocation && (
                <p className="text-sm text-gray-500 mb-2">
                  Coordinates: {currentLocation.coordinates[0].toFixed(4)}, {currentLocation.coordinates[1].toFixed(4)}
                </p>
              )}
              
              {gpsStatus === 'success' && (
                <p className="text-sm text-green-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  GPS location confirmed
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          {isNewCountry ? (
            <button
              ref={buttonRef}
              onClick={requestPOAPMint}
              disabled={!isButtonVisible}
              className={`action-button ${buttonStyle} ${isButtonVisible ? '' : 'opacity-0'} w-full py-3 px-4 rounded-lg font-medium`}
            >
              {verificationStatus === 'idle' && "Mint Country POAP"}
              {verificationStatus === 'scanning' && "Scanning Location..."}
              {verificationStatus === 'verifying' && "Verifying..."}
              {verificationStatus === 'success' && "✅ POAP Successfully Minted!"}
              {verificationStatus === 'error' && "❌ Error - Try Again"}
            </button>
          ) : (
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <p className="font-medium text-green-800">✅ Already in Collection</p>
              <p className="text-sm text-green-700 mt-1">
                You&apos;ve already minted a POAP for {currentLocation?.country || 'this country'}!
              </p>
            </div>
          )}
        </div>
        
        {verificationStatus === 'error' && (
          <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
        )}
      </div>

      {selectedPoap && (
        <div className="success-banner">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full overflow-hidden mr-4 border-2 border-white">
              <Image
                src={`/flags/${selectedPoap.countryCode.toLowerCase()}.png`}
                alt={`Flag of ${selectedPoap.country}`}
                width={40}
                height={40}
                className="object-cover w-full h-full"
              />
            </div>
            <div>
              <h4 className="font-medium text-white">POAP Minted!</h4>
              <p className="text-xs text-white/80">You&apos;ve added {selectedPoap.country} to your collection.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}