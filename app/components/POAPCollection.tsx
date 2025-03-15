'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<string>('');
  
  // Add a ref to track if a refresh is in progress
  const isRefreshing = useRef(false);
  // Add a ref to track if we've already logged the fetch
  const hasFetched = useRef(false);

  // Function to refresh POAPs from localStorage
  const refreshFromLocalStorage = useCallback(() => {
    // Only log once at component mount, not on every refresh
    // if (process.env.NODE_ENV === 'development' && !isRefreshing.current) {
    //   console.log('[POAPCollection] Refreshing from localStorage');
    // }
    
    isRefreshing.current = true;
    setIsLoading(true);
    
    // Get POAPs from localStorage
    try {
      const storedPoaps = localStorage.getItem('poaps');
      if (storedPoaps) {
        const parsedPoaps = JSON.parse(storedPoaps) as POAP[];
        
        // Create a deduplicated array
        const uniquePoaps: POAP[] = [];
        const addedCountryCodes = new Set<string>();
        
        for (const poap of parsedPoaps) {
          const countryCode = poap.countryCode.toLowerCase();
          // Deduplicate by countryCode
          if (!addedCountryCodes.has(countryCode)) {
            uniquePoaps.push(poap);
            addedCountryCodes.add(countryCode);
          }
        }

        // Only log in development and when POAPs are actually found
        // if (process.env.NODE_ENV === 'development' && uniquePoaps.length > 0) {
        //   console.log('[POAPCollection] Updating display with POAPs from localStorage:', uniquePoaps);
        // }
        
        setTimeout(() => {
          setDisplayedPoaps(uniquePoaps);
          setIsLoading(false);
          isRefreshing.current = false;
          setLastUpdateTimestamp(new Date().toISOString());
        }, 0);
      } else {
        setIsLoading(false);
        isRefreshing.current = false;
      }
    } catch (err) {
      console.error('[POAPCollection] Error refreshing from localStorage:', err);
      setIsLoading(false);
      isRefreshing.current = false;
    }
  }, []);

  // Fetch poaps from blockchain for the connected wallet
  const fetchPoapsFromBlockchain = useCallback(async (address: string) => {
    if (!address) return;
    
    // Only log the first fetch attempt during component lifecycle
    if (process.env.NODE_ENV === 'development' && !hasFetched.current) {
      // console.log('[POAPCollection] Starting POAP fetch for address:', address);
      hasFetched.current = true;
    }
    
    try {
      // Get list of countries the user has visited from the blockchain
      const countryCodes = await getCountriesVisitedByUser(address);
      
      // Only log country codes in development mode
      if (process.env.NODE_ENV === 'development' && countryCodes.length > 0) {
        // console.log('[POAPCollection] Country codes from blockchain:', countryCodes);
      }
      
      if (countryCodes.length === 0) {
        return; // No POAPs to display
      }
      
      // Create POAP objects from the country codes
      const poaps = countryCodes.map(countryCode => {
        // Get the country name and coordinates for this country code
        const countryInfo = getCountryInfo(countryCode);
        
        return {
          id: `blockchain-${countryCode}`,
          country: countryInfo?.name || 'Unknown',
          countryCode: countryCode,
          timestamp: new Date().toISOString(),
          coordinates: countryInfo?.coordinates || [0, 0],
          transactionHash: 'blockchain', // Marker for blockchain-sourced POAPs
        };
      });

      // Only log in development mode
      // if (process.env.NODE_ENV === 'development' && poaps.length > 0) {
      //   console.log('[POAPCollection] Created POAP objects from blockchain data:', poaps);
      // }
      
      // Cache these in localStorage
      localStorage.setItem('poaps', JSON.stringify(poaps));
      
      // Only log in development mode
      // if (process.env.NODE_ENV === 'development') {
      //   console.log('[POAPCollection] Cached blockchain POAPs in localStorage');
      // }
      
      // Refresh the display
      refreshFromLocalStorage();
      
    } catch (err) {
      console.error('[POAPCollection] Error fetching POAPs from blockchain:', err);
    }
  }, [refreshFromLocalStorage]);

  // Use effect to fetch poaps when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      fetchPoapsFromBlockchain(address);
    }
  }, [isConnected, address, fetchPoapsFromBlockchain]);

  // Listen for updates from localStorage
  useEffect(() => {
    // Define a handler for storage events
    const handleStorageChange = () => {
      refreshFromLocalStorage();
    };
    
    // Also refresh initially
    refreshFromLocalStorage();
    
    // Add event listener for storage events
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('poap-minted', handleStorageChange);
    
    // Clean up
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('poap-minted', handleStorageChange);
    };
  }, [refreshFromLocalStorage]);

  // Add a one-time cleanup function to run on component mount
  useEffect(() => {
    // Wrap in a function to run once
    const cleanupDuplicates = () => {

      
      try {
        const storedPoaps = localStorage.getItem('poaps');
        if (!storedPoaps) return;
        
        const parsedPoaps = JSON.parse(storedPoaps) as POAP[];
        
        // Create a deduplicated array
        const uniquePoaps: POAP[] = [];
        const addedCountryCodes = new Set<string>();
        let duplicatesFound = 0;
        
        for (const poap of parsedPoaps) {
          const countryCode = poap.countryCode.toLowerCase();
          // Deduplicate by countryCode
          if (!addedCountryCodes.has(countryCode)) {
            uniquePoaps.push(poap);
            addedCountryCodes.add(countryCode);
          } else {
            duplicatesFound++;
          }
        }
        
        // Only update localStorage if duplicates were found
        if (duplicatesFound > 0) {
          // console.log(`[POAPCollection] Found and removed ${duplicatesFound} duplicate POAPs`);
          localStorage.setItem('poaps', JSON.stringify(uniquePoaps));
        } else {
          // console.log('[POAPCollection] No duplicates found in localStorage');
        }
      } catch (err) {
        console.error('[POAPCollection] Error cleaning up duplicates:', err);
      }
    };
    
    cleanupDuplicates();
  }, []);

  // Add implementation for getCountryInfo function
  const getCountryInfo = (countryCode: string) => {
    const code = countryCode.toLowerCase();
    // Map country codes to names and default coordinates
    const countryMap: Record<string, { name: string, coordinates: [number, number] }> = {
      us: { name: 'United States', coordinates: [37.0902, -95.7129] },
      jp: { name: 'Japan', coordinates: [36.2048, 138.2529] },
      fr: { name: 'France', coordinates: [46.2276, 2.2137] },
      de: { name: 'Germany', coordinates: [51.1657, 10.4515] },
      gb: { name: 'United Kingdom', coordinates: [55.3781, -3.4360] },
      ca: { name: 'Canada', coordinates: [56.1304, -106.3468] },
      // Add more countries as needed
    };
    
    return countryMap[code] || { 
      name: countryNames[code] || code.toUpperCase(), 
      coordinates: [0, 0] 
    };
  };

  return (
    <div className="w-full relative">
     
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
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

