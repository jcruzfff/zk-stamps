'use client';

import { useState, useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';

// Existing components
import WalletConnection from './components/WalletConnection';
import PassportVerification, { PassportVerificationData } from './components/PassportVerification';
import ProofSettings from './components/ProofSettings';
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
  SelectPrivacySettings,
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
  const [proofSettings, setProofSettings] = useState<ProofSettings>({
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

  // Use effect for wallet connection state changes instead of during render
  useEffect(() => {
    // Don't automatically proceed to next step
    // Let user explicitly move to next step after connecting wallet
  }, [isConnected]);

  // Manual advancement to next step
  const proceedToNextStep = () => {
    setCurrentStep(prevStep => prevStep + 1);
  };

  // Handle passport verification
  const handlePassportVerified = (data: PassportVerificationData) => {
    console.log('🎯 PAGE: handlePassportVerified called with data:', data);
    console.log('🎯 PAGE: Current step before change:', 
      currentStep === AppStep.ConnectWallet ? 'ConnectWallet' :
      currentStep === AppStep.VerifyPassport ? 'VerifyPassport' :
      currentStep === AppStep.SelectPrivacySettings ? 'SelectPrivacySettings' :
      'Home'
    );
    
    // Update state with verification data
    console.log('🎯 PAGE: Setting isPassportVerified to true');
    setIsPassportVerified(true);
    
    console.log('🎯 PAGE: Setting passportData');
    setPassportData({
      isHuman: data.isHuman,
      name: data.name,
      nationality: data.nationality,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      passportNumber: data.passportNumber,
      issuingState: data.issuingState,
      expiryDate: data.expiryDate,
      above18: data.above18,
      fromEU: data.fromEU,
      notOnOFACList: data.notOnOFACList,
      timestamp: data.timestamp,
      verificationProof: data.verificationProof,
    });
    
    console.log('🎯 PAGE: Setting currentStep to SelectPrivacySettings');
    setCurrentStep(AppStep.SelectPrivacySettings);
    
    console.log('🎯 PAGE: State updates requested, rendering should update soon');
  };

  // Add new POAP to the collection
  const handlePoapMinted = (poap: POAP) => {
    setPoaps(prev => [...prev, poap]);
  };

  // Handle proof settings changes
  const handleProofSettingsChange = (settings: ProofSettings) => {
    setProofSettings(settings);
    setCurrentStep(AppStep.Home);
  };

  // Open QR sheet for displaying proof
  const handleOpenQRSheet = () => {
    setIsQRSheetOpen(true);
  };

  // Render the appropriate step
  const renderStep = () => {
    switch (currentStep) {
      case AppStep.ConnectWallet:
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
              <p className="text-gray-600">Connect your wallet to get started with Stamper</p>
            </div>
            <WalletConnection />
            
            {isConnected && (
              <button
                onClick={proceedToNextStep}
                className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
              >
                Continue to Passport Verification
              </button>
            )}
          </div>
        );
      
      case AppStep.VerifyPassport:
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Verify Your Passport</h2>
              <p className="text-gray-600">Scan the QR code with the Self app to verify your passport</p>
            </div>
            <div className="w-full max-w-md">
              <PassportVerification onVerifiedAction={handlePassportVerified} />
            </div>
          </div>
        );
      
      case AppStep.SelectPrivacySettings:
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Privacy Settings</h2>
              <p className="text-gray-600">Select what passport information you want to include in your proof</p>
            </div>
            <div className="w-full max-w-md">
              <ProofSettings 
                passportData={passportData}
                onSettingsChangeAction={handleProofSettingsChange}
              />
            </div>
          </div>
        );
      
      case AppStep.Home:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content - Globe + QR button */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md relative">
                <h2 className="text-xl font-bold mb-4">Your Global Travels</h2>
                <div className="h-[500px] w-full">
                  <WorldGlobe poaps={poaps} />
                </div>
                
                {/* QR Code Button */}
                <button 
                  onClick={handleOpenQRSheet}
                  className="absolute bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all"
                  aria-label="Show QR code"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
                  </svg>
                </button>
              </div>
              
              {/* Travel verification section */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Check In to a Location</h2>
                <TravelVerification 
                  isPassportVerified={isPassportVerified} 
                  onPoapMinted={handlePoapMinted}
                />
              </div>
              
              {/* Travel stats and POAP collection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-bold mb-4">Travel Stats</h2>
                  <TravelStats poaps={poaps} />
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-bold mb-4">Countries Visited</h2>
                  <POAPCollection poaps={poaps} />
                </div>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* User profile section */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold">Verified Traveler</h3>
                    <p className="text-sm text-gray-500">Passport verified via Self Protocol</p>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p><strong>Status:</strong> Verified via ZK Proof</p>
                  <p><strong>Time:</strong> {passportData?.timestamp ? new Date(passportData.timestamp).toLocaleString() : 'Unknown'}</p>
                  
                  <div className="mt-4 space-y-2">
                    <h3 className="font-medium">Disclosed Information:</h3>
                    <ul className="space-y-1">
                      {passportData?.isHuman && <li className="text-sm">✅ Real Human</li>}
                      {passportData?.fromEU && <li className="text-sm">✅ From EU</li>}
                      {passportData?.above18 && <li className="text-sm">✅ Above 18 years old</li>}
                      {passportData?.notOnOFACList && <li className="text-sm">✅ Not on OFAC list</li>}
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Upcoming trips */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Upcoming Trips</h2>
                <UpcomingTrips />
              </div>
              
              {/* Trip suggestions */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Trip Suggestions</h2>
                <TripSuggestions />
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
    <main className="container mx-auto px-4 py-8">
      <header className="text-center mb-8 relative">
        <h1 className="text-4xl font-bold mb-2">Stamper</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Privacy-preserving passport verification and travel POAP collector.
          Verify your identity with zero-knowledge proofs and collect POAPs for your travels.
        </p>
        
        {isConnected && (
          <div className="absolute right-0 top-0">
            <button
              onClick={() => {
                disconnect();
                // Reset to connect wallet step
                setCurrentStep(AppStep.ConnectWallet);
                // Reset verification state
                setIsPassportVerified(false);
                setPassportData(null);
              }}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Disconnect {address ? `${address.substring(0, 4)}...${address.substring(address.length - 4)}` : ''}
            </button>
          </div>
        )}
      </header>

      {renderStep()}
      {renderQRSheet()}
      
      <footer className="mt-16 text-center text-gray-500 text-sm">
        <p>
          Built with Self Protocol for zero-knowledge proofs and Celo for blockchain transactions.
        </p>
        <p className="mt-1">
          © {new Date().getFullYear()} Stamper - All rights reserved
        </p>
      </footer>
    </main>
  );
}
