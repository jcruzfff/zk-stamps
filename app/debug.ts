// Debug utility functions
// This file can be used to add debugging helpers without cluttering the main codebase

// Control log verbosity globally
export const DEBUG_LEVEL = process.env.NODE_ENV === 'development' ? 3 : 0; // 0=none, 1=errors, 2=warnings, 3=info, 4=verbose

// Debug logger that respects environment
export const debug = {
  error: (message: string, ...args: unknown[]) => {
    if (DEBUG_LEVEL >= 1) console.error(`🔴 [Error] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    if (DEBUG_LEVEL >= 2) console.warn(`🟡 [Warning] ${message}`, ...args);
  },
  info: (message: string, ...args: unknown[]) => {
    if (DEBUG_LEVEL >= 3) console.log(`🔵 [Info] ${message}`, ...args);
  },
  verbose: (message: string, ...args: unknown[]) => {
    if (DEBUG_LEVEL >= 4) console.log(`⚪ [Verbose] ${message}`, ...args);
  }
};

// Export default for convenience
export default debug;
