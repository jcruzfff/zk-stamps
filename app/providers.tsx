'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { ReactNode, useEffect, useState } from 'react';
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme
} from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, http } from 'wagmi';
import { celo, celoAlfajores } from 'wagmi/chains';
import { setupWalletConnectErrorHandler } from './wallet-fix';

// Get WalletConnect Project ID from environment variables
// IMPORTANT: You must create a project at https://cloud.walletconnect.com/ and get a Project ID
const WALLET_CONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// Create a query client for React Query (required by RainbowKit v2)
const queryClient = new QueryClient();

// Configure RainbowKit with proper error handling
const createConfig = () => {
  if (!WALLET_CONNECT_PROJECT_ID) {
    console.error("No WalletConnect Project ID found. Please add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID to your .env file.");
    return null;
  }
  
  return getDefaultConfig({
    appName: 'Stamper',
    projectId: WALLET_CONNECT_PROJECT_ID,
    chains: [celoAlfajores, celo], // Use Alfajores testnet first for development
    transports: {
      [celo.id]: http(),
      [celoAlfajores.id]: http('https://alfajores-forno.celo-testnet.org'),
    },
    // Ensure we're using a proper client-side only initializer
    ssr: false, // Disable server-side rendering behaviors that might cause issues
  });
};

export default function Providers({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ReturnType<typeof createConfig>>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Apply our error handler fix on the client side
  useEffect(() => {
    setupWalletConnectErrorHandler();
    setIsClient(true);
    setConfig(createConfig());
  }, []);
  
  if (!isClient) {
    return null;
  }
  
  if (!config) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Missing WalletConnect Project ID!</strong>
          <p className="block sm:inline mt-1">
            To fix this error:
          </p>
          <ol className="list-decimal text-left pl-5 mt-2">
            <li>Go to <a href="https://cloud.walletconnect.com/" className="underline" target="_blank" rel="noopener noreferrer">WalletConnect Cloud</a></li>
            <li>Create a new project</li>
            <li>Copy your Project ID</li>
            <li>Add it to your .env.local file as NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID</li>
          </ol>
        </div>
        {children}
      </div>
    );
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
          accentColor: '#3B82F6', // blue-500
          accentColorForeground: 'white',
          borderRadius: 'medium',
        })}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 