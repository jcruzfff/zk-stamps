'use client';

type POAP = {
  id: string;
  country: string;
  countryCode: string;
  timestamp: string;
  coordinates: [number, number];
  transactionHash: string;
  verificationProof: string;
};

// Helper function to convert country code to flag emoji
const getCountryFlag = (countryCode: string) => {
  // Convert country code to regional indicator symbols
  // These are used in Unicode to represent flag emojis
  const regionalIndicators = [...countryCode.toUpperCase()]
    .map(char => String.fromCodePoint(char.charCodeAt(0) + 127397))
    .join('');
  return regionalIndicators;
};

export default function POAPCollection({ poaps }: { poaps: POAP[] }) {
  // Extract unique countries from POAPs
  const uniqueCountryCodes = [...new Set(poaps.map(poap => poap.countryCode))];
  
  // Add some mock data if no POAPs are available
  if (uniqueCountryCodes.length === 0) {
    // Sample country codes for demonstration
    uniqueCountryCodes.push('US', 'JP', 'FR', 'DE', 'GB', 'IT', 'BR', 'AU', 'CA', 'ES');
  }
  
  return (
    <div className="flex flex-wrap gap-2">
      {uniqueCountryCodes.map(countryCode => (
        <div 
          key={countryCode} 
          className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shadow-sm border border-gray-200"
          title={countryCode}
        >
          <div className="text-2xl">
            {getCountryFlag(countryCode)}
          </div>
        </div>
      ))}
      {uniqueCountryCodes.length === 0 && (
        <p className="text-gray-500 italic">Verify your passport and check in to locations to collect POAPs</p>
      )}
    </div>
  );
} 