// Add environment variable for contract address
export const POAP_CONTRACT_ADDRESS = process.env.POAP_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';



// Initialize cached country data
let cachedCountryData: {
  countries: string[];
  timestamp: number;
} | null = null;

// Get countries visited by a user from the blockchain
export async function getCountriesVisitedByUser(address: string): Promise<string[]> {
  
  
  // Check if we have cached data less than 5 minutes old
  const now = Date.now();
  if (cachedCountryData && (now - cachedCountryData.timestamp) < 5 * 60 * 1000) {
    // Only log in development mode
   
    return cachedCountryData.countries;
  }
  
  try {
    // In a real app, this would make a contract call to get the countries
    // For now, we'll return dummy data based on the address
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For testing, return different countries based on the address
    // This is just to simulate different users having different POAPs
    // We're not using these conversion variables anymore
    // const addressHash = address.toLowerCase().slice(2, 10);
    
    // For deterministic testing, assign specific countries to specific addresses
    // This makes testing more predictable
    let countries: string[] = [];
    
    // Use parts of the address to determine which countries
    if (address.toLowerCase().includes('a')) countries.push('US');
    if (address.toLowerCase().includes('b')) countries.push('GB');
    if (address.toLowerCase().includes('c')) countries.push('FR');
    if (address.toLowerCase().includes('d')) countries.push('DE');
    if (address.toLowerCase().includes('e')) countries.push('JP');
    if (address.toLowerCase().includes('f')) countries.push('CA');
    
    // Default to at least one country for demo purposes
    if (countries.length === 0) {
      countries = ['US'];
    }
    
    // Cache the result
    cachedCountryData = {
      countries,
      timestamp: now
    };
    
    // Only log in development mode (and only when not using cache)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 [Blockchain] Fetched country data from API:', countries);
    }
    
    return countries;
  } catch (error) {
    console.error('🔴 [Blockchain] Error fetching countries:', error);
    return [];
  }
} 