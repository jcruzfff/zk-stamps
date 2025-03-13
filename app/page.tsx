'use client';

import { useState, useEffect, useRef, TouchEvent } from 'react';
import { useAccount, useDisconnect } from 'wagmi';

// Existing components
import WalletConnection from './components/WalletConnection';
import PassportVerification, { PassportVerificationData } from './components/PassportVerification';
import TravelVerification from './components/TravelVerification';

// New components
import WorldGlobe from './components/WorldGlobe';
import QRProofSheet from './components/QRProofSheet';
import TravelStats from './components/TravelStats';
import POAPCollection from './components/POAPCollection';
import UpcomingTrips from './components/UpcomingTrips';
import TripSuggestions from './components/TripSuggestions';

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

  // Use effect for wallet connection state changes
  useEffect(() => {
    // Automatically proceed to next step when wallet is connected
    if (isConnected && currentStep === AppStep.ConnectWallet) {
      // Add a small delay to make the transition feel smoother
      const timer = setTimeout(() => {
        setCurrentStep(AppStep.VerifyPassport);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, currentStep]);

  // Handle passport verification
  const handlePassportVerified = (data: PassportVerificationData) => {
    console.log('Passport verification successful, data received:', data);
    
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
      
      // Go directly to Home step
      setCurrentStep(AppStep.Home);
      console.log('Moving to Home step');
      
    } catch (error) {
      console.error('Error handling passport verification:', error);
    }
  };

  // Add new POAP to the collection
  const handlePoapMinted = (poap: POAP) => {
    setPoaps(prev => [...prev, poap]);
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

  // Avatar Menu Component
  const AvatarMenu = () => {
    if (!isConnected || !address) return null;
    
    return (
      <div className="relative">
        <button 
          onClick={toggleAvatarMenu}
          className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all"
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    Real Human
                  </li>}
                  {passportData?.above18 && <li className="text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    Above 18 years old
                  </li>}
                  {passportData?.notOnOFACList && <li className="text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    Not on OFAC list
                  </li>}
                </ul>
              </div>
            </div>
            
            <button
              onClick={() => {
                disconnect();
                setCurrentStep(AppStep.ConnectWallet);
                setIsPassportVerified(false);
                setPassportData(null);
                setIsAvatarMenuOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Disconnect Wallet
            </button>
          </div>
        )}
      </div>
    );
  };

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
                  <img src="/logo.svg" alt="zkStamps Logo" className="app-logo mb-0 mr-3" />
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
                <img src="/logo.svg" alt="zkStamps" />
                <span>zkStamps</span>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleOpenQRSheet}
                  className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all"
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
              className={`bottom-sheet ${isBottomSheetExpanded ? 'expanded' : ''}`}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div 
                className="sheet-header" 
                onClick={toggleBottomSheet}
              >
                <div className="sheet-handle"></div>
                <div className="text-center text-xs text-gray-400 mt-1 mb-2">
                  {isBottomSheetExpanded ? 'Swipe down to minimize' : 'Swipe up for more'}
                </div>
              </div>
              <div className="sheet-content">
                {/* Upcoming Trips - Using the UpcomingTrips component */}
                <h2 className="section-title">Upcoming Trip</h2>
                <UpcomingTrips />
                
                {/* Trip Suggestions - Using the TripSuggestions component */}
                <h2 className="section-title">Trip Suggestions</h2>
                <TripSuggestions />
                
                {/* POAPs Collected - Using the POAPCollection component */}
                <h2 className="section-title">POAPs Collected</h2>
                <POAPCollection poaps={poaps} />
                
                {/* Travel Verification - Using the TravelVerification component */}
                <h2 className="section-title">Travel Verification</h2>
                <TravelVerification 
                  isPassportVerified={isPassportVerified} 
                  onPoapMinted={handlePoapMinted}
                />
                
                {/* Stats - Using the TravelStats component */}
                <h2 className="section-title">Places you&apos;ve seen</h2>
                <TravelStats poaps={poaps} />
                
                {/* Add Trip Button */}
                <button className="add-trip-button">
                  + Add Trip
                </button>
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
        onClose={() => setIsQRSheetOpen(false)}
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
