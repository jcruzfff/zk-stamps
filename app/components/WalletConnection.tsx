'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';

export default function WalletConnection() {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasProjectId, setHasProjectId] = useState(false);

  // This is necessary to prevent hydration errors with RainbowKit
  useEffect(() => {
    setMounted(true);
    
    // Check if WalletConnect Project ID is available
    setHasProjectId(!!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID);
    
    // Adding global error handler for WalletConnect issues
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('undefined or null')) {
        console.log('Caught WalletConnect error:', event.error);
        // Don't show this error to users, just log it
        event.preventDefault();
      } else if (event.error?.message?.includes('Project not found')) {
        setError('WalletConnect Project ID is invalid or not configured correctly');
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center">
      {error ? (
        <div className="p-3 bg-red-100 text-red-800 rounded-md mb-3 text-sm">
          <p>Error connecting wallet: {error}</p>
          <button 
            onClick={() => setError(null)} 
            className="text-blue-600 underline mt-1"
          >
            Try Again
          </button>
        </div>
      ) : null}
      
      {!hasProjectId ? (
        <div className="p-3 bg-yellow-100 text-yellow-800 rounded-md mb-3 text-sm">
          <p>WalletConnect Project ID missing. Wallet connections may not work properly.</p>
        </div>
      ) : null}
      
      <ConnectButton 
        chainStatus="icon" 
        showBalance={false}
        accountStatus={{
          smallScreen: 'avatar',
          largeScreen: 'full',
        }}
      />
      
      {isConnected && (
        <div className="mt-2 text-sm text-green-600">
          ✅ Wallet connected
        </div>
      )}
    </div>
  );
} 