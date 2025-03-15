'use client';

import { useState, useEffect, useRef, TouchEvent } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import Image from 'next/image';

// Existing components
import WalletConnection from './components/WalletConnection';
import PassportVerification, { PassportVerificationData } from './components/PassportVerification';
import TravelVerification from './components/TravelVerification';

// New components
import WorldGlobe from './components/WorldGlobe';
import QRProofSheet from './components/QRProofSheet';
import TravelStats from './components/TravelStats';
import POAPCollection from './components/POAPCollection';
import UpcomingTrips, { Trip } from './components/UpcomingTrips';
import TripSuggestions from './components/TripSuggestions';
import AddTripForm, { TripData } from './components/AddTripForm';

type POAP = {
  id: string;
  country: string;
  countryCode: string;
  timestamp: string;
  coordinates: [number, number];
  transactionHash: string;
  verificationProof: string;
  city?: string;
  distance?: number;
};

type ProofSettings = {
  showName: boolean;
  showNationality: boolean;
  showDateOfBirth: boolean;
  showGender: boolean;
  showPassportNumber: boolean;
  showIssuingState: boolean;
  showExpiryDate: boolean;
  showIsHuman: boolean;
  showIsAdult: boolean;
  showNotOnSanctionsList: boolean;
};

// Define a type for passport verification data
type PassportData = {
  isHuman: boolean;
  name?: string;
  nationality?: string;
  dateOfBirth?: string;
  gender?: string;
  passportNumber?: string;
  issuingState?: string;
  expiryDate?: string;
  above18?: boolean;
  fromEU?: boolean;
  notOnOFACList?: boolean;
  timestamp: string;
  verificationProof: string;
};

enum AppStep {
  ConnectWallet,
  VerifyPassport,
  Home
}

export default function Home() {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.ConnectWallet);
  const [isPassportVerified, setIsPassportVerified] = useState(false);
  const [passportData, setPassportData] = useState<PassportData | null>(null);
  const [poaps, setPoaps] = useState<POAP[]>([]);
  const [isQRSheetOpen, setIsQRSheetOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);
  const [proofSettings] = useState<ProofSettings>({
    showName: false,
    showNationality: true,
    showDateOfBirth: false,
    showGender: false,
    showPassportNumber: false,
    showIssuingState: true,
    showExpiryDate: false,
    showIsHuman: true,
    showIsAdult: true,
    showNotOnSanctionsList: true,
  });
  const sheetRef = useRef<HTMLDivElement>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  // New state for trip management
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showAddTripForm, setShowAddTripForm] = useState(false);

  // Load POAPs from localStorage on component mount
  useEffect(() => {
    // Only run this on the client side
    if (typeof window === 'undefined') return;
    
    try {
      // Check for stored POAPs
      const storedPoaps = localStorage.getItem('poaps');
      
      if (storedPoaps) {
        const parsedPoaps = JSON.parse(storedPoaps) as POAP[];
        
        // Validate the data has required fields
        if (Array.isArray(parsedPoaps)) {
          // Filter out any potentially corrupted data
          const validPoaps = parsedPoaps.filter(poap => 
            poap && poap.id && poap.countryCode && poap.coordinates && 
            Array.isArray(poap.coordinates) && poap.coordinates.length === 2
          );
          
          if (validPoaps.length > 0) {
            // Update state with stored POAPs
            setPoaps(validPoaps);
          }
        }
      }
    } catch (error) {
      console.error('🔴 [Home] Error retrieving stored POAPs:', error);
      // If there's an error, clear the stored data to prevent future issues
      localStorage.removeItem('poaps');
    }
  }, []);

  // Check for saved verification data on component mount
  useEffect(() => {
    // Only run this on the client side
    if (typeof window === 'undefined') return;
    
    try {
      // Check if we have stored passport verification data
      const storedPassportData = localStorage.getItem('passportData');
      const storedVerificationStatus = localStorage.getItem('isPassportVerified');
      
      if (storedPassportData && storedVerificationStatus === 'true') {
        const parsedData = JSON.parse(storedPassportData) as PassportData;
        
        // Validate the data has required fields
        if (parsedData && parsedData.verificationProof) {
          // Update state with stored data
          setPassportData(parsedData);
          setIsPassportVerified(true);
          
          // If wallet is connected, skip to home page
          if (isConnected) {
            setCurrentStep(AppStep.Home);
          }
        }
      }
    } catch (error) {
      console.error('Error retrieving stored passport data:', error);
      // If there's an error, clear the stored data to prevent future issues
      localStorage.removeItem('passportData');
      localStorage.removeItem('isPassportVerified');
    }
  }, [isConnected]);

  // Use effect for wallet connection state changes
  useEffect(() => {
    // Automatically proceed to next step when wallet is connected
    if (isConnected && currentStep === AppStep.ConnectWallet) {
      // If already verified, skip to Home
      if (isPassportVerified && passportData) {
        setCurrentStep(AppStep.Home);
      } else {
        // Otherwise, go to verification step
        // Add a small delay to make the transition feel smoother
        const timer = setTimeout(() => {
          setCurrentStep(AppStep.VerifyPassport);
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isConnected, currentStep, isPassportVerified, passportData]);

  // Handle passport verification
  const handlePassportVerified = (data: PassportVerificationData) => {
    if (!data) {
      console.error('Verification data is null or undefined');
      return;
    }
    
    try {
      // Update state with verification data
      setIsPassportVerified(true);
      
      // Clone the data to ensure it's a new reference
      const newPassportData = {
        isHuman: data.isHuman || true,
        name: data.name || 'Verified User',
        nationality: data.nationality || 'Unknown',
        dateOfBirth: data.dateOfBirth || '1990-01-01',
        gender: data.gender || 'X',
        passportNumber: data.passportNumber || 'XXXXX',
        issuingState: data.issuingState || 'Unknown',
        expiryDate: data.expiryDate || '2030-01-01',
        above18: data.above18 || true,
        fromEU: data.fromEU || false,
        notOnOFACList: data.notOnOFACList || true,
        timestamp: data.timestamp || new Date().toISOString(),
        verificationProof: data.verificationProof || `fallback_${Date.now()}`,
      };
      
      setPassportData(newPassportData);
      
      // Store verification data in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('passportData', JSON.stringify(newPassportData));
        localStorage.setItem('isPassportVerified', 'true');
      }
      
      // Go directly to Home step
      setCurrentStep(AppStep.Home);
    } catch (error) {
      console.error('Error handling passport verification:', error);
    }
  };

  // Add new POAP to the collection
  const handlePoapMinted = (poap: POAP) => {
    // Update state with new POAP
    setPoaps(prevPoaps => {
      // Check if this POAP already exists to avoid duplicates
      const isDuplicate = prevPoaps.some(p => 
        p.countryCode.toLowerCase() === poap.countryCode.toLowerCase() && 
        p.transactionHash === poap.transactionHash
      );
      
      if (isDuplicate) {
        return prevPoaps;
      }
      
      // Create a new array with the previous POAPs and the new one
      const updatedPoaps = [...prevPoaps, poap];
      
      // Store the updated POAPs in localStorage for persistence
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('poaps', JSON.stringify(updatedPoaps));
          
          // Force trigger any components that might be listening for localStorage changes
          // Move to next event loop tick to avoid React render phase setState errors
          setTimeout(() => {
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('poap-minted'));
          }, 0);
        } catch (err) {
          console.error('🔴 [Home] Failed to save POAPs to localStorage:', err);
        }
      }
      
      return updatedPoaps;
    });
  };

  // Open QR sheet for displaying proof
  const handleOpenQRSheet = () => {
    setIsQRSheetOpen(true);
  };

  // Toggle avatar menu
  const toggleAvatarMenu = () => {
    setIsAvatarMenuOpen(!isAvatarMenuOpen);
  };

  // Toggle bottom sheet expansion
  const toggleBottomSheet = () => {
    setIsBottomSheetExpanded(!isBottomSheetExpanded);
  };

  // Handle touch interactions for the bottom sheet
  const handleTouchStart = (e: TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (touchStartY === null || !sheetRef.current) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;

    // If dragging down and sheet is expanded, or dragging up and sheet is collapsed
    if ((diff > 50 && isBottomSheetExpanded) || (diff < -50 && !isBottomSheetExpanded)) {
      setTouchStartY(null); // Reset touch position
      setIsBottomSheetExpanded(!isBottomSheetExpanded);
    }
  };

  const handleTouchEnd = () => {
    setTouchStartY(null);
  };

  // Update the disconnect button to also clear localStorage
  const handleDisconnect = () => {
    disconnect();
    setCurrentStep(AppStep.ConnectWallet);
    setIsPassportVerified(false);
    setPassportData(null);
    setIsAvatarMenuOpen(false);
    
    // Clear stored verification data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('passportData');
      localStorage.removeItem('isPassportVerified');
    }
  };

  // Avatar Menu Component
  const AvatarMenu = () => {
    if (!isConnected || !address) return null;
    
    return (
      <div className="relative">
        <button 
          onClick={toggleAvatarMenu}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/30 transition-all"
          aria-label="User menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
            <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clipRule="evenodd" />
          </svg>
        </button>
        
        {isAvatarMenuOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-1 z-20">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#45A7E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium">Verified Traveler</div>
                  <div className="text-xs text-gray-500">Passport verified via Self Protocol</div>
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p><span className="font-medium">Status:</span> Verified via ZK Proof</p>
                <p className="mb-2"><span className="font-medium">Time:</span> {passportData?.timestamp ? new Date(passportData.timestamp).toLocaleString() : 'Unknown'}</p>
                
                <p className="font-medium mb-1">Disclosed Information:</p>
                <ul className="space-y-1">
                  {passportData?.isHuman && <li className="text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1 text-[#45A7E8]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    Real Human
                  </li>}
                  {passportData?.above18 && <li className="text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1 text-[#45A7E8]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    Above 18 years old
                  </li>}
                  {passportData?.notOnOFACList && <li className="text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1 text-[#45A7E8]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    Not on OFAC list
                  </li>}
                </ul>
              </div>
            </div>
            
            <button
              onClick={handleDisconnect}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Disconnect Wallet
            </button>
          </div>
        )}
      </div>
    );
  };

  // Add trip to state and localStorage
  const handleAddTrip = (newTrip: TripData) => {
    setTrips(prevTrips => {
      const updatedTrips = [...prevTrips, newTrip];
      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('trips', JSON.stringify(updatedTrips));
      }
      return updatedTrips;
    });
    setShowAddTripForm(false);
  };
  
  // Show Add Trip Form and expand sheet
  const showAddTripFormHandler = () => {
    setShowAddTripForm(true);
    setIsBottomSheetExpanded(true);
  };
  
  // Handle cancel from AddTripForm
  const handleCancelAddTrip = () => {
    setShowAddTripForm(false);
    setIsBottomSheetExpanded(false);
  };
  
  // Delete trip from state and localStorage
  const handleDeleteTrip = (tripId: string) => {
    setTrips(prevTrips => {
      const updatedTrips = prevTrips.filter(trip => trip.id !== tripId);
      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('trips', JSON.stringify(updatedTrips));
      }
      return updatedTrips;
    });
  };
  
  // Load trips from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTrips = localStorage.getItem('trips');
      if (savedTrips) {
        try {
          const parsedTrips = JSON.parse(savedTrips);
          if (Array.isArray(parsedTrips)) {
            setTrips(parsedTrips);
          }
        } catch (error) {
          console.error('Error loading trips from localStorage:', error);
        }
      }
    }
  }, []);

  // Render the appropriate step
  const renderStep = () => {
    switch (currentStep) {
      case AppStep.ConnectWallet:
        return (
          <div className="app-background">
            <div className="flex flex-col items-center justify-center w-full h-full mx-auto">
              {/* Logo and name container */}
              <div className="flex items-center justify-center mb-8 w-full px-4">
                <div className="flex items-center w-[85%] max-w-[400px] justify-center">
                  <Image src="/logo.svg" alt="zkStamps Logo" width={60} height={60} className="app-logo mb-0 mr-3" />
                  <h1 className="text-5xl font-bold text-white">zkStamps</h1>
                </div>
              </div>
              <div className="w-full max-w-md flex justify-center px-4">
                <WalletConnection />
              </div>
            </div>
          </div>
        );
      
      case AppStep.VerifyPassport:
        return (
          <div className="app-background">
            <div className="absolute top-4 right-4 z-10">
              <AvatarMenu />
            </div>
            <div className="flex flex-col items-center justify-center w-full h-full mx-auto">
              <div className="verification-card">
                <h2 className="text-2xl font-bold mb-4 text-white">Welcome to zkStamps</h2>
                <p className="text-white/80 mb-8">
                  Scan the QR code with your Self app to verify your passport.
                </p>
                <div className="flex-1 flex items-center justify-center w-full">
                  <PassportVerification 
                    onVerifiedAction={handlePassportVerified} 
                    simplified={true}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      
      case AppStep.Home:
        return (
          <div className="home-page-container">
            {/* Navigation bar */}
            <div className="main-nav">
              <div className="nav-logo">
                <Image src="/logo.svg" alt="zkStamps" width={40} height={40} />
                <span>zkStamps</span>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleOpenQRSheet}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/30 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                  </svg>
                </button>
                <AvatarMenu />
              </div>
            </div>
            
            {/* Full-screen map */}
            <div className="map-container">
              <WorldGlobe poaps={poaps} />
            </div>
            
            {/* Bottom sheet */}
            <div 
              ref={sheetRef}
              className={`bottom-sheet ${isBottomSheetExpanded ? 'expanded' : ''} ${showAddTripForm ? 'has-form' : ''}`}
            >
              <div 
                className="sheet-header" 
                onClick={toggleBottomSheet}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="sheet-handle"></div>
                <div className="text-center text-xs text-gray-400 mt-1 mb-1">
                  {isBottomSheetExpanded ? 'Swipe down to minimize' : 'Swipe up for more'}
                </div>
              </div>
              <div className="sheet-content">
                {showAddTripForm ? (
                  <AddTripForm 
                    onAddTripAction={handleAddTrip} 
                    onCancelAction={() => handleCancelAddTrip()} 
                  />
                ) :
                  <>
                    {/* Only show Upcoming Trips and Trip Suggestions if there are trips */}
                    {trips.length > 0 && (
                      <>
                        {/* Upcoming Trips - Using the UpcomingTrips component */}
                        <h2 className="section-title">Upcoming Trip</h2>
                        <UpcomingTrips trips={trips} onDeleteTrip={handleDeleteTrip} />
                        
                        {/* Trip Suggestions - Using the TripSuggestions component */}
                        <h2 className="text-base pt-4 pb-4">Trip Suggestions</h2>
                        <TripSuggestions />
                      </>
                    )}
                    
                    {/* Travel Verification - Using the TravelVerification component */}
                    <h2 className="section-title">Travel Verification</h2>
                    <div id="travel-verification">
                      <TravelVerification 
                        isPassportVerified={isPassportVerified} 
                        onPoapMinted={handlePoapMinted}
                      />
                    </div>
                    
                    {/* POAPs Collected - Using the POAPCollection component */}
                    <h2 className="section-title">POAPs Collected</h2>
                    <POAPCollection />
                    
                    {/* Stats - Using the TravelStats component */}
                    <h2 className="section-title">Places you&apos;ve seen</h2>
                    <TravelStats poaps={poaps} />
                    
                    {/* Add Trip Button */}
                    <button 
                      className="w-full py-3 mt-6 rounded-full bg-[#03AEEC] text-white font-medium flex items-center justify-center hover:bg-[#3A8AC2] transition-colors"
                      onClick={() => showAddTripFormHandler()}
                    >
                      + Add Trip
                    </button>
                  </>
                }
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // QR Sheet for displaying proof
  const renderQRSheet = () => {
    if (!isQRSheetOpen || !passportData) return null;
    
    return (
      <QRProofSheet
        isOpen={isQRSheetOpen}
        onCloseAction={() => setIsQRSheetOpen(false)}
        passportData={passportData}
        proofSettings={proofSettings}
      />
    );
  };

  return (
    <main className="w-full h-full">
      {renderStep()}
      {renderQRSheet()}
    </main>
  );
}
