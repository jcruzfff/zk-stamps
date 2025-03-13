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
    <div className="flex flex-col items-center justify-center w-full">
      {error ? (
        <div className="p-3 bg-red-100 text-red-800 rounded-md mb-3 text-sm w-full max-w-md">
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
        <div className="p-3 bg-yellow-100 text-yellow-800 rounded-md mb-3 text-sm w-full max-w-md">
          <p>WalletConnect Project ID missing. Wallet connections may not work properly.</p>
        </div>
      ) : null}
      
      {/* Custom styled connect button for simpler UI */}
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openConnectModal,
          mounted: mountedButton,
        }) => {
          const ready = mounted && mountedButton;
          const connected = ready && account && chain;
          
          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                style: {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
              className="flex justify-center w-full"
            >
              {(() => {
                if (!connected) {
                  return (
                    <button 
                      onClick={openConnectModal} 
                      type="button"
                      className="connect-wallet-btn"
                    >
                      Connect wallet
                    </button>
                  );
                }

                return (
                  <div className="flex items-center justify-center w-full">
                    <button
                      onClick={openAccountModal}
                      type="button"
                      className="connect-wallet-btn"
                    >
                      {account.displayName}
                    </button>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
      
      {isConnected && (
        <div className="mt-2 text-sm text-white font-medium text-center">
          ✅ Wallet connected
        </div>
      )}
    </div>
  );
} 