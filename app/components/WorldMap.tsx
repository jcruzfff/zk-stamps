'use client';

import { useState } from 'react';

type POAP = {
  id: string;
  country: string;
  countryCode: string;
  timestamp: string;
  coordinates: [number, number];
  transactionHash: string;
  verificationProof: string;
};

export default function WorldMap({ poaps }: { poaps: POAP[] }) {
  const [selectedPoapId, setSelectedPoapId] = useState<string | null>(null);
  
  // Get the selected POAP details
  const selectedPoap = poaps.find(poap => poap.id === selectedPoapId);
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full mt-8">
      <h2 className="text-2xl font-bold mb-4">Your Global Travels</h2>
      
      <div className="relative w-full h-[300px] bg-blue-50 rounded-lg overflow-hidden mb-4">
        {/* This is a simplified world map representation */}
        <div className="absolute inset-0 bg-[url('https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json')] bg-center bg-no-repeat bg-contain opacity-20"></div>
        
        <div className="absolute inset-0 p-4">
          <div className="text-center text-gray-400 italic">
            {poaps.length === 0 ? (
              <span>No travels recorded yet. Verify your location to add pins to the map.</span>
            ) : (
              <span>Interactive map is simulated. {poaps.length} location(s) recorded.</span>
            )}
          </div>
          
          {/* Display POAP pins on the map */}
          {poaps.map(poap => {
            // Convert coordinates to percentage positions (simplified)
            const x = (180 + poap.coordinates[1]) / 360 * 100;
            const y = (90 - poap.coordinates[0]) / 180 * 100;
            
            return (
              <div 
                key={poap.id}
                className={`absolute w-4 h-4 rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all ${
                  selectedPoapId === poap.id 
                    ? 'bg-red-500 scale-150 z-20' 
                    : 'bg-blue-500 hover:bg-blue-600 z-10'
                }`}
                style={{ left: `${x}%`, top: `${y}%` }}
                onClick={() => setSelectedPoapId(poap.id)}
                title={poap.country}
              />
            );
          })}
        </div>
      </div>
      
      {selectedPoap && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-bold mb-2">Selected Location: {selectedPoap.country}</h3>
          <p className="text-sm"><strong>Date:</strong> {new Date(selectedPoap.timestamp).toLocaleString()}</p>
          <p className="text-sm"><strong>Coordinates:</strong> {selectedPoap.coordinates[0].toFixed(4)}, {selectedPoap.coordinates[1].toFixed(4)}</p>
          <p className="text-sm"><strong>Transaction:</strong> {selectedPoap.transactionHash.substring(0, 6)}...{selectedPoap.transactionHash.substring(selectedPoap.transactionHash.length - 4)}</p>
          <button className="mt-2 text-sm text-blue-600">View POAP Details</button>
        </div>
      )}
      
      <div className="mt-4">
        <h3 className="font-bold mb-2">Countries Visited ({poaps.length})</h3>
        {poaps.length === 0 ? (
          <p className="text-gray-500 italic">No countries visited yet</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {poaps.map(poap => (
              <div 
                key={poap.id}
                className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer ${
                  selectedPoapId === poap.id 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                }`}
                onClick={() => setSelectedPoapId(poap.id)}
              >
                {poap.country}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 