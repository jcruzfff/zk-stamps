'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAccount } from 'wagmi';
import { getCountriesVisitedByUser } from '../lib/blockchain';

type POAP = {
  id: string;
  country: string;
  countryCode: string;
  timestamp: string;
  coordinates: [number, number];
  transactionHash: string;
  verificationProof: string;
};

// Map of country codes to names
const countryNames: Record<string, string> = {
  us: 'United States',
  jp: 'Japan',
  fr: 'France',
  de: 'Germany',
  br: 'Brazil',
  nl: 'Netherlands',
  pt: 'Portugal',
  ae: 'United Arab Emirates',
  au: 'Australia',
  nz: 'New Zealand',
  cl: 'Chile',
  it: 'Italy',
  sg: 'Singapore',
  th: 'Thailand',
  iq: 'Iraq',
  be: 'Belgium',
  gb: 'United Kingdom',
  tr: 'Turkey',
  ir: 'Iran',
  in: 'India',
  hk: 'Hong Kong'
};

const countryCodeToFlag = (countryCode: string): string => {
  // Convert 2-letter country code to lowercase for flag image
  const lowerCode = countryCode.toLowerCase();
  
  // First try to load a PNG flag
  return `/flags/${lowerCode}.png`;
};

export default function POAPCollection() {
  const { isConnected, address } = useAccount();
  const [displayedPoaps, setDisplayedPoaps] = useState<POAP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  
  // Function to refresh POAPs from localStorage
  const refreshFromLocalStorage = () => {
    // Don't refresh too frequently (at most once every 500ms)
    const now = Date.now();
    if (now - lastRefreshTime < 500) {
      return;
    }
    
    setLastRefreshTime(now);
    console.log('[POAPCollection] Refreshing from localStorage');
    
    if (typeof window !== 'undefined') {
      const storedPoapsString = localStorage.getItem('poaps');
      
      if (storedPoapsString) {
        try {
          const storedPoaps = JSON.parse(storedPoapsString) as POAP[];
          
          if (Array.isArray(storedPoaps) && storedPoaps.length > 0) {
            // Normalize all country codes to lowercase 
            const normalizedPoaps = storedPoaps.map(poap => ({
              ...poap,
              countryCode: poap.countryCode.toLowerCase()
            }));
            
            console.log('[POAPCollection] Updating display with POAPs from localStorage:', normalizedPoaps);
            setDisplayedPoaps(normalizedPoaps);
          }
        } catch (error) {
          console.error('[POAPCollection] Error parsing localStorage data:', error);
        }
      }
    }
  };

  // Fetch POAPs from blockchain if connected
  useEffect(() => {
    async function fetchPoaps() {
      if (!isConnected || !address) {
        console.log('[POAPCollection] Not connected to wallet, skipping fetch');
        setIsLoading(false);
        return;
      }
      
      try {
        console.log(`[POAPCollection] Starting POAP fetch for address: ${address}`);
        setIsLoading(true);
        
        // Get data directly from the blockchain
        const countryCodes = await getCountriesVisitedByUser(address);
        console.log('[POAPCollection] Country codes from blockchain:', countryCodes);
        
        if (countryCodes && countryCodes.length > 0) {
          // Convert country codes to POAP objects
          const blockchainPoaps = countryCodes.map(countryCode => {
            const lowerCode = countryCode.toLowerCase();
            return {
              id: `${lowerCode}-blockchain-${Date.now()}`,
              country: countryNames[lowerCode] || countryCode,
              countryCode: lowerCode,
              timestamp: new Date().toISOString(),
              coordinates: [0, 0] as [number, number], // Default coordinates
              transactionHash: 'blockchain-verified',
              verificationProof: 'blockchain-verified'
            };
          });
          
          console.log('[POAPCollection] Created POAP objects from blockchain data:', blockchainPoaps);
          setDisplayedPoaps(blockchainPoaps);
          
          // Also store in localStorage as a cache
          if (typeof window !== 'undefined') {
            localStorage.setItem('poaps', JSON.stringify(blockchainPoaps));
            console.log('[POAPCollection] Cached blockchain POAPs in localStorage');
          }
        } else {
          // First check localStorage before showing empty state
          refreshFromLocalStorage();
          
          if (displayedPoaps.length === 0) {
            console.log('[POAPCollection] No POAPs found on blockchain or localStorage, showing empty state');
          }
        }
      } catch (error) {
        console.error('[POAPCollection] Error fetching POAPs from blockchain:', error);
        
        // Try to load from localStorage as fallback
        refreshFromLocalStorage();
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPoaps();
    
    // Remove the polling interval - we'll rely on events instead
    return () => {};
  }, [isConnected, address]);
  
  // Add a listener for localStorage changes to update POAPs when minted
  useEffect(() => {
    // Function to handle storage changes
    const handleStorageChange = (event: StorageEvent) => {
      // Only react to poaps changes
      if (event.key === 'poaps' || event.key === null) { // null is when localStorage is cleared
        console.log('[POAPCollection] Storage change detected, refreshing data');
        refreshFromLocalStorage();
      }
    };
    
    // Function to handle custom event for internal updates
    const handleInternalStorageChange = () => {
      console.log('[POAPCollection] Internal storage change detected');
      refreshFromLocalStorage();
    };
    
    // Function to handle custom POAP minted event
    const handlePoapMinted = () => {
      console.log('[POAPCollection] POAP minted event detected');
      // Give it a slight delay to ensure all state updates have settled
      setTimeout(refreshFromLocalStorage, 100);
    };
    
    // Add event listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('storage-updated', handleInternalStorageChange);
      window.addEventListener('poap-minted', handlePoapMinted);
      
      // Force a refresh immediately but only if we haven't refreshed recently
      if (Date.now() - lastRefreshTime > 1000) {
        refreshFromLocalStorage();
      }
      
      // Cleanup
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('storage-updated', handleInternalStorageChange);
        window.removeEventListener('poap-minted', handlePoapMinted);
      };
    }
  }, [lastRefreshTime]);

  return (
    <div className="w-full relative">
      {isLoading ? (
        <div className="py-6 text-center">
          <div className="w-10 h-10 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-700">Loading your POAPs...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-3">
            {displayedPoaps.length > 0 ? displayedPoaps.map((poap) => (
              <Link 
                key={poap.id}
                href={`/poap/${poap.countryCode.toLowerCase()}`}
                className="country-flag-item"
              >
                <div className="relative w-14 h-14 overflow-hidden rounded-full border-2 border-white shadow-sm hover:shadow-md transition-all">
                  <Image
                    src={countryCodeToFlag(poap.countryCode)}
                    alt={`Flag of ${poap.country}`}
                    fill
                    sizes="56px"
                    style={{ objectFit: 'cover' }}
                    className="country-flag"
                    onError={(e) => {
                      // Fallback if flag image doesn't exist
                      const target = e.target as HTMLImageElement;
                      target.src = '/flags/placeholder.svg';
                    }}
                  />
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg w-full">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h2a2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2v1.5" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2v1.5M20.488 11h-2.488m-2 2h-2m-2 2h-2" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium text-lg">No POAPs in your collection yet</p>
                <p className="text-gray-500 text-sm mt-2 mb-4">
                  Start your journey by minting a POAP for your current location
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .country-flag-item:hover .country-flag {
          transform: scale(1.05);
          transition: transform 0.3s ease;
        }
      `}</style>
    </div>
  );
} 

