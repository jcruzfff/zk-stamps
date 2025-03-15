'use client';
import Image from 'next/image';

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
    worldPercentage: poaps.length ? worldPercentage : 1,
    totalMiles: poaps.length ? totalMiles : 0,
    countriesVisited: poaps.length ? countriesVisited : 1,
    citiesVisited: poaps.length ? citiesVisited : 1
  };
  
  return (
    <div className="grid grid-cols-2 gap-[6px]">
      {/* World Percentage Card */}
      <div className="rounded-xl overflow-hidden relative h-[180px]">
        <Image 
          src="/world-image.png"
          alt="World map background"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
        <div className="absolute top-6 left-6 text-white">
          <div className="text-5xl font-bold">{stats.worldPercentage}%</div>
          <div className="text-white text-xl mt-1">of the world</div>
        </div>
      </div>
      
      {/* Miles Card */}
      <div className="rounded-xl overflow-hidden relative h-[180px]">
        <Image 
          src="/road-image.png"
          alt="Road background"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
        <div className="absolute top-6 left-6 text-black">
          <div className="text-5xl font-bold">{stats.totalMiles.toLocaleString()}</div>
          <div className="text-black text-xl mt-1">miles</div>
        </div>
      </div>
      
      {/* Countries Card */}
      <div className="rounded-xl overflow-hidden relative h-[180px]">
        <Image 
          src="/countries-image.png"
          alt="Countries background"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
        <div className="absolute top-6 left-6 text-black">
          <div className="text-5xl font-bold">{stats.countriesVisited}</div>
          <div className="text-black text-xl mt-1">country</div>
        </div>
      </div>
      
      {/* Cities Card */}
      <div className="rounded-xl overflow-hidden relative h-[180px]">
        <Image 
          src="/cities-image.png"
          alt="Cities background"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
        <div className="absolute top-6 left-6 text-black">
          <div className="text-5xl font-bold">{stats.citiesVisited}</div>
          <div className="text-black text-xl mt-1">city</div>
        </div>
      </div>
    </div>
  );
} 