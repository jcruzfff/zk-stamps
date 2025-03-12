'use client';

type POAP = {
  id: string;
  country: string;
  countryCode: string;
  timestamp: string;
  coordinates: [number, number];
  transactionHash: string;
  verificationProof: string;
  city?: string;
  distance?: number;
};

export default function TravelStats({ poaps }: { poaps: POAP[] }) {
  // Calculate stats
  const countriesVisited = [...new Set(poaps.map(poap => poap.countryCode))].length;
  const citiesVisited = [...new Set(poaps.map(poap => poap.city).filter(Boolean))].length;
  
  // Rough estimation for demo purposes
  const worldPercentage = Math.max(1, Math.min(Math.round((countriesVisited / 195) * 100), 100));
  const totalMiles = poaps.reduce((sum, poap) => sum + (poap.distance || 0), 0);
  
  // Use mock data if no POAPs are available
  const stats = {
    worldPercentage: poaps.length ? worldPercentage : 11,
    totalMiles: poaps.length ? totalMiles : 402193,
    countriesVisited: poaps.length ? countriesVisited : 18,
    citiesVisited: poaps.length ? citiesVisited : 121
  };
  
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-gray-100 rounded-lg p-4">
        <div className="text-3xl font-bold">{stats.worldPercentage}%</div>
        <div className="text-gray-600 text-sm">of the world</div>
      </div>
      <div className="bg-gray-100 rounded-lg p-4">
        <div className="text-3xl font-bold">{stats.totalMiles.toLocaleString()}</div>
        <div className="text-gray-600 text-sm">miles</div>
      </div>
      <div className="bg-gray-100 rounded-lg p-4">
        <div className="text-3xl font-bold">{stats.countriesVisited}</div>
        <div className="text-gray-600 text-sm">countries</div>
      </div>
      <div className="bg-gray-100 rounded-lg p-4">
        <div className="text-3xl font-bold">{stats.citiesVisited}</div>
        <div className="text-gray-600 text-sm">cities</div>
      </div>
    </div>
  );
} 