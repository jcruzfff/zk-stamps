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
  const [activeTab, setActiveTab] = useState<'home' | 'rewards'>('home');
  const sheetRef = useRef<HTMLDivElement>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  // New state for trip management
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showAddTripForm, setShowAddTripForm] = useState(false);

  // Rewards data - categories and their perks
  const rewardsCategories = [
    {
      id: 'flight',
      title: 'Flight Perks',
      image: '/baggage.png',
      icon: '✈️',
      perks: [
        { name: 'Priority Boarding', points: 5000 },
        { name: 'Free Checked Baggage', points: 10000 },
        { name: 'Lounge Access', points: 15000 },
        { name: 'Seat Upgrade', points: 20000 },
        { name: 'Discount on Flight', points: 25000 }
      ]
    },
    {
      id: 'connectivity',
      title: 'Connectivity',
      image: '/connect.png',
      icon: '📱',
      perks: [
        { name: 'eSIM (7-Day Plan)', points: 5000 },
        { name: 'eSIM (5GB)', points: 8000 },
        { name: 'Airport WiFi', points: 2000 },
        { name: 'Power Bank Airports', points: 3000 },
        { name: 'VPN Deal (1 Month)', points: 5000 }
      ]
    },
    {
      id: 'transportation',
      title: 'Transportation',
      image: '/taxi.png',
      icon: '🚕',
      perks: [
        { name: 'Airport Taxi', points: 5000 },
        { name: 'Ride-Sharing Credit', points: 10000 },
        { name: 'Rental Discount (5-10% off)', points: 15000 },
        { name: 'Travel Pass', points: 12000 },
        { name: 'Free Bike / Scooter (1 Day)', points: 8000 }
      ]
    },
    {
      id: 'activities',
      title: 'Experiences',
      image: '/amusement.png',
      icon: '🎟️',
      perks: [
        { name: 'City Tour Pass', points: 15000 },
        { name: 'Amusement Park Ticket', points: 20000 },
        { name: 'Food & Dining (10-20% Off)', points: 10000 },
        { name: 'Museum Entry Ticket', points: 8000 },
        { name: 'Live Event Ticket', points: 25000 }
      ]
    },
    {
      id: 'hotel',
      title: 'Lodging',
      image: '/hotel.png',
      icon: '🏨',
      perks: [
        { name: 'Hotel Room Discount', points: 10000 },
        { name: 'Free Night', points: 50000 },
        { name: 'Airbnb Rental Credit', points: 30000 },
        { name: 'Resort / Spa Day Pass', points: 15000 },
        { name: 'Early Check-In Perk', points: 8000 }
      ]
    },
    {
      id: 'shopping',
      title: 'Duty-Free',
      image: '/dutyfree.png',
      icon: '🛍️',
      perks: [
        { name: 'Store Discount (5-10%)', points: 10000 },
        { name: 'Gift Card for Partner Stores', points: 20000 },
        { name: 'Custom NFT', points: 5000 },
        { name: 'Luggage Discount', points: 12000 },
        { name: 'Free Travel Insurance', points: 18000 }
      ]
    }
  ];

  // New state for rewards category sheet
  const [activeRewardsCategory, setActiveRewardsCategory] = useState<string | null>(null);
  const [isRewardsSheetOpen, setIsRewardsSheetOpen] = useState(false);
  const rewardsSheetRef = useRef<HTMLDivElement>(null);

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
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new Event('poap-minted'));
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

  // Points display component with dynamic styling based on active tab
  const PointsDisplay = () => {
    // Styles for the container
    const containerStyle = activeTab === 'rewards'
      ? "bg-white border border-gray-200 shadow-sm"
      : "border-white/10 border-1";
    
    // Styles for the text
    const textStyle = activeTab === 'rewards'
      ? "text-gray-800 font-medium"
      : "text-white";
      
    return (
      <div className={`nav-logo h-[40px] pl-3 rounded-full p-2 ${containerStyle}`}>
        <Image src="/points-plane.svg" alt="zkStamps" width={32} height={32} />
        <span className={textStyle}>10,400</span>
      </div>
    );
  };

  // In the rewards page component, we'll create a simple variant that always shows black text
  const RewardsPointsDisplay = () => {
    return (
      <div className="nav-logo h-[40px] pl-3 rounded-full p-2 bg-white border border-gray-200 shadow-sm rewards-points-container">
        <Image src="/points-plane.svg" alt="zkStamps" width={32} height={32} />
        <span className="text-gray-800 font-medium rewards-points-text">10,400</span>
      </div>
    );
  };

  // Avatar Menu Component
  const AvatarMenu = () => {
    if (!isConnected || !address) return null;
    
    // Determine styles based on active tab
    const bgColor = activeTab === 'rewards' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/10 hover:bg-white/30';
    const textColor = activeTab === 'rewards' ? 'text-gray-700' : 'text-white';
    
    return (
      <div className="relative">
        <button 
          onClick={toggleAvatarMenu}
          className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center transition-all`}
          aria-label="User menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 ${textColor}`}>
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

  // New function to handle opening reward category sheet
  const openRewardsCategorySheet = (categoryId: string) => {
    // First set the active category
    setActiveRewardsCategory(categoryId);
    
    // Then use requestAnimationFrame to ensure the sheet is rendered before animating
    requestAnimationFrame(() => {
      setIsRewardsSheetOpen(true);
    });
  };

  // Function to close rewards sheet
  const closeRewardsSheet = () => {
    setIsRewardsSheetOpen(false);
    setActiveRewardsCategory(null);
  };

  // Handle touch events for rewards sheet
  const handleRewardsSheetTouchStart = (e: TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleRewardsSheetTouchMove = (e: TouchEvent) => {
    if (touchStartY === null || !rewardsSheetRef.current) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;

    // If dragging down, animate the sheet moving down
    if (diff > 0) {
      const translateY = Math.min(diff, 300); // Limit max drag
      rewardsSheetRef.current.style.transform = `translateY(${translateY}px)`;
      rewardsSheetRef.current.style.transition = 'none';
    }
  };

  const handleRewardsSheetTouchEnd = (e: TouchEvent) => {
    if (touchStartY === null || !rewardsSheetRef.current) return;
    
    const currentY = e.changedTouches[0].clientY;
    const diff = currentY - touchStartY;
    
    // Reset styles for animation
    rewardsSheetRef.current.style.transition = 'transform 0.3s ease-out';
    
    // If dragged more than threshold, close the sheet
    if (diff > 100) {
      rewardsSheetRef.current.style.transform = 'translateY(100%)';
      
      // Wait for animation to complete before updating state
      setTimeout(() => {
        closeRewardsSheet();
      }, 300);
    } else {
      // Snap back
      rewardsSheetRef.current.style.transform = 'translateY(0)';
    }
    
    setTouchStartY(null);
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
            {activeTab === 'home' ? (
              <>
                {/* Navigation bar */}
                <div className="main-nav">
                  <PointsDisplay />
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
                    ) : (
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
                    )}
                  </div>
                </div>
              </>
            ) : (
              // Separate rewards page
              <div className="rewards-page">
                {/* Rewards Page Header - Updated with white background and black text */}
                <div className="main-nav rewards-nav">
                  <RewardsPointsDisplay />
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={handleOpenQRSheet}
                      className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                      </svg>
                    </button>
                    <AvatarMenu />
                  </div>
                </div>
                
                {/* Rewards Page Content */}
                <div className="rewards-page-content">
                  <div className="bg-white min-h-screen p-6 pt-22">
                    <div className="mb-8">
                     
                      <p className="text-gray-600 mb-6">Use your travel points to redeem rewards and special offers.</p>
                      
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl p-5 text-white mb-6 shadow-md">
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <h3 className="text-lg font-medium">SkyMiles Card</h3>
                            <p className="text-sm opacity-80">Premium Member</p>
                          </div>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 opacity-80">
                            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                          </svg>
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-xs opacity-70 mb-1">Available Points</p>
                            <p className="text-2xl font-bold">10,400<span className="text-[10px] pl-1 opacity-70">Celo</span></p>
                          </div>
                          <p className="text-xs opacity-70">Valid until 12/2025</p>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="font-medium text-gray-800 mb-4">Elevate your experience</h3>
                    
                    <div className="grid grid-cols-2 gap-1.5 mb-8">
                      {rewardsCategories.map((category) => (
                        <div 
                          key={category.id}
                          className="relative aspect-square overflow-hidden rounded-lg shadow-md cursor-pointer"
                          onClick={() => openRewardsCategorySheet(category.id)}
                        >
                          <Image 
                            src={category.image} 
                            alt={category.title}
                            fill
                            className="object-cover transition-transform hover:scale-105"
                          />
                          <div 
                            className="absolute inset-0 flex flex-col justify-end p-3"
                            style={{
                              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 25%, rgba(0,0,0,0) 50%)'
                            }}
                          >
                            <span className="text-lg text-white font-medium">{category.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Bottom Navigation Bar */}
            <div className="bottom-nav-bar">
              <button 
                className={`bottom-nav-item ${activeTab === 'home' ? 'active' : ''}`} 
                onClick={() => setActiveTab('home')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                  <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
                </svg>
                <span>Home</span>
              </button>
              <button 
                className={`bottom-nav-item ${activeTab === 'rewards' ? 'active' : ''}`} 
                onClick={() => setActiveTab('rewards')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 20" fill="currentColor" className="w-6 h-6">
                  <path d="M8.25 11.0007V20.0007H4.25C3.8232 20.0007 3.40059 19.9166 3.00628 19.7533C2.61197 19.5899 2.25369 19.3505 1.9519 19.0487C1.65011 18.747 1.41072 18.3887 1.24739 17.9944C1.08406 17.6001 1 17.1774 1 16.7507V11.0007H8.25ZM17 11.0007V16.7507C17 17.1774 16.9159 17.6001 16.7526 17.9944C16.5893 18.3887 16.3499 18.747 16.0481 19.0487C15.7463 19.3505 15.388 19.5899 14.9937 19.7533C14.5994 19.9166 14.1768 20.0007 13.75 20.0007H9.75V11.0007H17ZM11.5 0.00065019C12.0832 0.000530633 12.6556 0.157321 13.1573 0.454579C13.659 0.751837 14.0715 1.17861 14.3515 1.69015C14.6315 2.20169 14.7687 2.77914 14.7488 3.36196C14.7288 3.94477 14.5524 4.51148 14.238 5.00265L16.75 5.00065C17.44 5.00065 18 5.46665 18 6.04265V8.95865C18 9.53465 17.44 10.0007 16.75 10.0007L9.75 9.99965V5.00065H8.25V9.99965L1.25 10.0007C0.56 10.0007 0 9.53465 0 8.95865V6.04265C0 5.46665 0.56 5.00065 1.25 5.00065L3.762 5.00265C3.31583 4.30591 3.15218 3.46523 3.30441 2.652C3.45665 1.83877 3.91331 1.11422 4.58129 0.626044C5.24928 0.137871 6.0783 -0.0771655 6.89935 0.0247727C7.72041 0.126711 8.47167 0.537948 9 1.17465C9.30446 0.806844 9.68645 0.510875 10.1186 0.307919C10.5508 0.104964 11.0225 3.82545e-05 11.5 0.00065019ZM6.5 1.50065C6.04848 1.50085 5.61452 1.67556 5.28881 1.98826C4.96311 2.30097 4.77086 2.72745 4.75227 3.17859C4.73368 3.62972 4.89017 4.07058 5.18904 4.40902C5.48792 4.74747 5.90603 4.95729 6.356 4.99465L6.5 5.00065H8.25V3.25065L8.244 3.10665C8.20786 2.66895 8.00846 2.26084 7.68539 1.96333C7.36232 1.66582 6.93919 1.50067 6.5 1.50065ZM11.5 1.50065C11.0359 1.50065 10.5908 1.68502 10.2626 2.01321C9.93437 2.3414 9.75 2.78652 9.75 3.25065V5.00065H11.5C11.9641 5.00065 12.4092 4.81628 12.7374 4.48809C13.0656 4.1599 13.25 3.71478 13.25 3.25065C13.25 2.78652 13.0656 2.3414 12.7374 2.01321C12.4092 1.68502 11.9641 1.50065 11.5 1.50065Z" fill="currentColor"/>
                </svg>
                <span>Rewards</span>
              </button>
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
      
      {/* Rewards Category Sheet */}
      {activeRewardsCategory && (
        <div 
          className={`rewards-sheet-overlay ${isRewardsSheetOpen ? 'open' : ''}`} 
          onClick={closeRewardsSheet}
        >
          <div 
            ref={rewardsSheetRef}
            className="rewards-sheet" 
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleRewardsSheetTouchStart}
            onTouchMove={handleRewardsSheetTouchMove}
            onTouchEnd={handleRewardsSheetTouchEnd}
          >
            <div className="rewards-sheet-header">
              <div className="sheet-handle"></div>
              <div className="flex items-center justify-between px-4 py-3">
                <h3 className="text-lg font-semibold">
                  {rewardsCategories.find(c => c.id === activeRewardsCategory)?.title}
                </h3>
                <button 
                  onClick={closeRewardsSheet}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="rewards-sheet-content">
              <div className="px-4 pb-20">
             
                {rewardsCategories.find(c => c.id === activeRewardsCategory)?.perks.map((perk, index) => (
                  <div 
                    key={index}
                    className="bg-white rounded-xl shadow-sm mb-4 flex overflow-hidden"
                  >
                    <div className="w-[64px] relative min-h-[100px]">
                      <Image 
                        src={rewardsCategories.find(c => c.id === activeRewardsCategory)?.image || ''}
                        alt={perk.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4 flex-1">
                      <h4 className="font-medium text-gray-800">{perk.name}</h4>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mt-2 mb-2">
                        <div 
                          className="h-full bg-[#03AEEC] rounded-full"
                          style={{ width: `${Math.min(100, (10400 / perk.points) * 100)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">
                          {Math.min(10400, perk.points)}/{perk.points} Points
                        </span>
                        {10400 >= perk.points && 
                          <span className="text-xs text-white bg-[#03AEEC] px-2 py-1 rounded-full">
                            Ready
                          </span>
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        .bottom-nav-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          width: 100%;
          height: 64px;
          background-color: white;
          display: flex;
          justify-content: space-around;
          align-items: center;
          z-index: 45;
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
          padding: 0 10px;
        }
        
        .bottom-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #333333;
          transition: all 0.2s ease;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }
        
        .bottom-nav-item.active {
          color: #03AEEC;
        }
        
        .bottom-nav-item svg {
          margin-bottom: 4px;
          width: 24px;
          height: 24px;
        }
        
        .bottom-nav-item span {
          font-size: 12px;
          font-weight: 500;
        }
        
        /* Adjust bottom sheet to account for navigation bar */
        .bottom-sheet {
          padding-bottom: 70px;
        }
        
        /* Rewards Page Styles */
        .rewards-page {
          min-height: 100vh;
          padding-bottom: 64px; /* Account for navigation bar */
          background: white;
          display: flex;
          flex-direction: column;
        }
        
        .rewards-nav {
          background-color: white;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        
        .rewards-page-content {
          flex: 1;
        }
        
        /* Rewards Sheet Styles */
        .rewards-sheet-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: transparent;
          z-index: 40; /* Make sure it's below the navigation bar (45) */
          display: flex;
          align-items: flex-end;
          pointer-events: none;
          transition: visibility 0.3s ease;
          visibility: hidden;
        }
        
        .rewards-sheet-overlay.open {
          visibility: visible;
          pointer-events: auto;
        }
        
        .rewards-sheet {
          width: 100%;
          background-color: white;
          border-top-left-radius: 20px;
          border-top-right-radius: 20px;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.25);
          transform: translateY(100%);
          transition: transform 0.3s cubic-bezier(0.19, 1, 0.22, 1);
          will-change: transform;
          pointer-events: auto;
        }
        
        .rewards-sheet-overlay.open .rewards-sheet {
          transform: translateY(0);
        }
        
        .rewards-sheet-header {
          position: sticky;
          top: 0;
          background-color: white;
          border-bottom: 1px solid #f0f0f0;
          z-index: 2;
        }
        
        .rewards-sheet .sheet-handle {
          width: 40px;
          height: 4px;
          background-color: #e2e2e2;
          border-radius: 2px;
          margin: 8px auto 0;
          cursor: grab;
        }
        
        .rewards-sheet-content {
          padding: 10px 0;
          max-height: calc(85vh - 60px); /* Subtract header height */
          overflow-y: auto;
        }
        
        /* Rewards points specific styling to ensure text is black */
        .rewards-points-container {
          color: #1f2937 !important; /* Using text-gray-800 equivalent hex */
        }
        
        .rewards-points-text {
          color: #1f2937 !important;
          font-weight: 500;
        }
      `}</style>
    </main>
  );
}
