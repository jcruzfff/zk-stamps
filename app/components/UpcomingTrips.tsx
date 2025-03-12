'use client';

import { useState } from 'react';

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
        <div key={trip.id} className="bg-gray-100 rounded-lg p-4 flex items-center">
          <div className="w-16 h-16 bg-gray-300 rounded-lg mr-4 flex items-center justify-center text-gray-600">
            {trip.type === 'flight' && 
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 17h14M5 12h14m-7-5l7 5-7 5" />
              </svg>
            }
          </div>
          <div className="flex-1">
            <div className="font-medium">
              {trip.type === 'flight' ? 'Flight' : trip.type} {trip.from} - {trip.to}
            </div>
            <div className="text-gray-600 flex justify-between">
              <span>{trip.date}</span>
              <span>{trip.time}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 