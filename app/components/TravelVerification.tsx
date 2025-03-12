'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

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

export default function TravelVerification({ 
  isPassportVerified,
  onPoapMinted
}: { 
  isPassportVerified: boolean;
  onPoapMinted?: (poap: POAP) => void;
}) {
  const { isConnected, address } = useAccount();
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'scanning' | 'verifying' | 'success' | 'error'>('idle');
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'requesting' | 'success' | 'error'>('idle');
  const [poaps, setPoaps] = useState<POAP[]>([]);
  const [selectedPoap, setSelectedPoap] = useState<POAP | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

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
            
            setCurrentLocation({
              country,
              countryCode,
              timestamp: new Date().toISOString(),
              coordinates: [lat, lng]
            });
            
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
          setGpsStatus('error');
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setErrorMessage('Location access was denied. Please enable location services for this site.');
              break;
            case error.POSITION_UNAVAILABLE:
              setErrorMessage('Location information is unavailable.');
              break;
            case error.TIMEOUT:
              setErrorMessage('The request to get location timed out.');
              break;
            default:
              setErrorMessage('An unknown error occurred while retrieving location.');
          }
          
          // Fallback to demo data if geolocation fails
          const demoLocations = [
            { country: 'France', countryCode: 'FR', coordinates: [48.8566, 2.3522] },
            { country: 'Germany', countryCode: 'DE', coordinates: [52.5200, 13.4050] },
            { country: 'Italy', countryCode: 'IT', coordinates: [41.9028, 12.4964] }
          ];
          
          const randomLocation = demoLocations[Math.floor(Math.random() * demoLocations.length)];
          
          setCurrentLocation({
            ...randomLocation,
            timestamp: new Date().toISOString(),
            coordinates: randomLocation.coordinates as [number, number]
          });
        }
      );
    } else {
      setGpsStatus('error');
      setErrorMessage('Geolocation is not supported by this browser.');
      
      // Fallback to demo data if geolocation is not supported
      const fallbackLocation = {
        country: 'Unknown',
        countryCode: 'XX',
        coordinates: [0, 0],
        timestamp: new Date().toISOString()
      };
      
      setCurrentLocation(fallbackLocation as Location);
    }
  }, []);

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
        
        if (!response.ok) {
          throw new Error('Travel verification failed');
        }
        
        const data = await response.json();
        
        if (data.success && data.poapData) {
          const newPoap: POAP = data.poapData;
          
          setPoaps(prev => [...prev, newPoap]);
          setSelectedPoap(newPoap);
          setVerificationStatus('success');
          
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

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4 text-center">Travel Verification</h2>
      
      {gpsStatus === 'requesting' && (
        <div className="text-center py-4">
          <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-700">Detecting your location...</p>
        </div>
      )}
      
      {gpsStatus === 'error' && errorMessage && (
        <div className="p-4 bg-red-50 rounded-lg mb-4">
          <p className="text-red-600 text-sm">{errorMessage}</p>
          <p className="text-xs text-gray-500 mt-1">Using fallback location data.</p>
        </div>
      )}
      
      {verificationStatus === 'idle' && (
        <div className="space-y-4">
          {currentLocation && (
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-sm font-medium mb-2">Current Location:</p>
              <p className="text-lg font-bold">{currentLocation.country}</p>
              <p className="text-sm text-gray-600">Coordinates: {currentLocation.coordinates[0].toFixed(4)}, {currentLocation.coordinates[1].toFixed(4)}</p>
              {gpsStatus === 'success' && (
                <p className="text-xs text-green-600 mt-1">✓ GPS location confirmed</p>
              )}
            </div>
          )}
          
          <button
            onClick={startVerification}
            disabled={!isPassportVerified || !isConnected || !currentLocation}
            className={`w-full py-2 px-4 font-semibold rounded-md transition duration-300 ${
              isPassportVerified && isConnected && currentLocation
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Verify Travel & Mint POAP
          </button>
          
          {!isPassportVerified && (
            <p className="text-xs text-center text-red-500 mt-2">
              Please verify your passport first
            </p>
          )}
          
          {!isConnected && (
            <p className="text-xs text-center text-red-500 mt-2">
              Please connect your wallet first
            </p>
          )}
          
          {!currentLocation && (
            <p className="text-xs text-center text-red-500 mt-2">
              Waiting for location data...
            </p>
          )}
        </div>
      )}
      
      {verificationStatus === 'scanning' && (
        <div className="text-center py-8">
          <div className="w-48 h-48 mx-auto border-4 border-dashed border-blue-500 rounded-lg flex items-center justify-center mb-4 animate-pulse">
            <div className="text-blue-500">Scanning Passport...</div>
          </div>
          <p className="text-sm text-gray-600">Please hold your phone near your passport&apos;s NFC chip</p>
        </div>
      )}
      
      {verificationStatus === 'verifying' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">Generating travel proof & minting POAP...</p>
          <p className="text-xs text-gray-500 mt-2">This may take a moment</p>
        </div>
      )}
      
      {verificationStatus === 'success' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
            <span className="text-green-600 text-2xl">✓</span>
          </div>
          <h3 className="text-xl font-semibold text-green-600 mb-2">POAP Minted Successfully!</h3>
          <p className="text-gray-600 text-sm">
            You&apos;ve earned a POAP for visiting {selectedPoap?.country}
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Transaction:</strong> {selectedPoap?.transactionHash.substring(0, 6)}...{selectedPoap?.transactionHash.substring(selectedPoap.transactionHash.length - 4)}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Time:</strong> {selectedPoap ? new Date(selectedPoap.timestamp).toLocaleString() : ''}
            </p>
          </div>
          <button
            onClick={() => setVerificationStatus('idle')}
            className="mt-4 py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition duration-300"
          >
            Verify Another Location
          </button>
        </div>
      )}
      
      {verificationStatus === 'error' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-4">
            <span className="text-red-600 text-2xl">✗</span>
          </div>
          <h3 className="text-xl font-semibold text-red-600 mb-2">Verification Failed</h3>
          <p className="text-gray-600 text-sm">There was an issue verifying your travel</p>
          {errorMessage && (
            <p className="text-sm text-red-500 mt-1">{errorMessage}</p>
          )}
          <button
            onClick={() => setVerificationStatus('idle')}
            className="mt-4 py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition duration-300"
          >
            Try Again
          </button>
        </div>
      )}
      
      {poaps.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Your POAP Collection</h3>
          <div className="grid grid-cols-2 gap-4">
            {poaps.map(poap => (
              <div 
                key={poap.id}
                className="p-3 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors"
                onClick={() => setSelectedPoap(poap)}
              >
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="font-bold text-blue-600">{poap.countryCode}</span>
                </div>
                <p className="text-center text-sm font-medium">{poap.country}</p>
                <p className="text-center text-xs text-gray-500">{new Date(poap.timestamp).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {selectedPoap && poaps.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-bold mb-2">POAP Details</h4>
          <p className="text-sm"><strong>Country:</strong> {selectedPoap.country}</p>
          <p className="text-sm"><strong>Date:</strong> {new Date(selectedPoap.timestamp).toLocaleString()}</p>
          <p className="text-sm"><strong>Transaction:</strong> {selectedPoap.transactionHash.substring(0, 6)}...{selectedPoap.transactionHash.substring(selectedPoap.transactionHash.length - 4)}</p>
          <p className="text-sm"><strong>Proof:</strong> {selectedPoap.verificationProof.substring(0, 6)}...{selectedPoap.verificationProof.substring(selectedPoap.verificationProof.length - 4)}</p>
          <div className="mt-2">
            <button className="text-sm text-blue-600">Share on Social Media</button>
          </div>
        </div>
      )}
    </div>
  );
} 