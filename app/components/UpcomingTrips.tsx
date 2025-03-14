'use client';

import { useState } from 'react';
import Image from 'next/image';

type Trip = {
  id: string;
  type: 'flight' | 'train' | 'bus' | 'car';
  from: string;
  to: string;
  date: string;
  time: string;
};

export default function UpcomingTrips() {
  // Mock data for upcoming trips
  const [trips] = useState<Trip[]>([
    {
      id: '1',
      type: 'flight',
      from: 'SFO',
      to: 'BOS',
      date: '04/15/2025',
      time: '6:30pm'
    }
  ]);

  if (trips.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center">
        <p className="text-gray-500">No upcoming trips</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {trips.map(trip => (
        <div key={trip.id} className="bg-gray-100 rounded-[20px] overflow-hidden flex relative">
          {/* Left blue section with plane icon */}
          <div className="w-[64px] h-[102px] bg-[#45A7E8] flex items-center justify-center">
            {trip.type === 'flight' && (
              <div className="relative w-[42px] h-[42px]">
                <Image 
                  src="airplace.svg" 
                  alt="Airplane" 
                  fill
                  style={{ filter: 'brightness(0) invert(1)' }} // Make the icon white
                />
              </div>
            )}
          </div>
          
          {/* Right section with trip details */}
          <div className="flex-1 pl-4 flex flex-col justify-center">
            <h3 className="text-[16px] font-semibold mb-1">
              Flight {trip.from} - {trip.to}
            </h3>
            <div className="flex justify-between items-center pr-6">
              <span className="text-[16px] font-regular text-gray-700">{trip.date}</span>
              <span className="text-[16px] font-regular text-gray-700">{trip.time}</span>
            </div>
          </div>
          
          {/* Menu button on the top right */}
          <div className="absolute top-6 right-6">
            <button className="w-4 h-4 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 