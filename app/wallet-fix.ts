'use client';

/**
 * This file provides a temporary fix for the WalletConnect initialization issue
 * that causes "Cannot convert undefined or null to object" errors in the console.
 * 
 * The issue occurs in WalletConnect's ExplorerCtrl.ts when Object.values() is called
 * on undefined or null data during wallet recommendations loading.
 */

export function setupWalletConnectErrorHandler() {
  if (typeof window !== 'undefined') {
    // Save the original Object.values function
    const originalObjectValues = Object.values;
    
    // Override Object.values to handle null/undefined safely
    Object.values = function safeObjectValues(obj: any) {
      if (obj === null || obj === undefined) {
        console.warn('WalletConnect fix: Object.values called with null/undefined');
        return [];
      }
      return originalObjectValues(obj);
    };
    
    // Setup a global error handler for WalletConnect issues
    const originalOnError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
      // Filter out the specific WalletConnect error to prevent it from being displayed
      if (message && (
        message.toString().includes('undefined or null to object') || 
        message.toString().includes('explorerCtrl')
      )) {
        console.log('Intercepted WalletConnect error:', { message, source });
        return true; // Prevents the error from propagating
      }
      
      // Call the original handler for other errors
      if (originalOnError) {
        return originalOnError.apply(this, arguments as any);
      }
      return false;
    };
  }
} 