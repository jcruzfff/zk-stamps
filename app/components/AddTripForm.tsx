'use client';

import { useState } from 'react';

export type TripData = {
  id: string;
  type: 'flight' | 'train' | 'bus' | 'car';
  from: string;
  to: string;
  date: string;
  time: string;
};

interface AddTripFormProps {
  onAddTripAction: (trip: TripData) => void;
  onCancelAction: () => void;
}

export default function AddTripForm({ onAddTripAction, onCancelAction }: AddTripFormProps) {
  const [tripType, setTripType] = useState<'flight' | 'train' | 'bus' | 'car'>('flight');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!from || !to || !date || !time) {
      setFormError('Please fill in all fields');
      return;
    }
    
    // Create new trip object
    const newTrip: TripData = {
      id: Date.now().toString(), // Simple ID generation
      type: tripType,
      from,
      to,
      date,
      time
    };
    
    // Submit to parent component
    onAddTripAction(newTrip);
    
    // Reset form
    setTripType('flight');
    setFrom('');
    setTo('');
    setDate('');
    setTime('');
    setFormError('');
  };

  return (
    <div className="pb-6 pt-4">
      <h2 className="text-[20px] font-semibold mb-6 text-[#333]">Add New Trip</h2>
      
      {formError && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {formError}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Trip Type Selection */}
        <div className="mb-6">
          <label className="block text-base font-medium text-gray-700 mb-3">
            Trip Type
          </label>
          <div className="flex space-x-3 w-full">
            {['flight', 'train', 'bus', 'car'].map((type) => (
              <button
                key={type}
                type="button"
                className={`flex-1 items-center justify-center py-4 rounded-xl ${
                  tripType === type 
                    ? 'bg-[#45A7E8] text-white' 
                    : 'bg-gray-100 text-gray-600'
                } transition-colors shadow-sm hover:shadow-md`}
                onClick={() => setTripType(type as 'flight' | 'train' | 'bus' | 'car')}
              >
                <span className="capitalize">{type}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* From/To Fields */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="from" className="block text-base font-medium text-gray-700 mb-2">
              From
            </label>
            <input
              type="text"
              id="from"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-[#45A7E8] focus:border-[#45A7E8] shadow-sm"
              placeholder="City code (e.g. SFO)"
            />
          </div>
          <div>
            <label htmlFor="to" className="block text-base font-medium text-gray-700 mb-2">
              To
            </label>
            <input
              type="text"
              id="to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-[#45A7E8] focus:border-[#45A7E8] shadow-sm"
              placeholder="City code (e.g. NYC)"
            />
          </div>
        </div>
        
        {/* Date/Time Fields */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div>
            <label htmlFor="date" className="block text-base font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-[#45A7E8] focus:border-[#45A7E8] shadow-sm"
            />
          </div>
          <div>
            <label htmlFor="time" className="block text-base font-medium text-gray-700 mb-2">
              Time
            </label>
            <input
              type="time"
              id="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-[#45A7E8] focus:border-[#45A7E8] shadow-sm"
            />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-4 mb-4">
          <button
            type="button"
            onClick={onCancelAction}
            className="flex-1 py-4 border border-gray-300 rounded-full text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-4 bg-[#45A7E8] text-white rounded-full font-medium hover:bg-[#3993d1] transition-colors shadow-md"
          >
            Add Trip
          </button>
        </div>
      </form>
    </div>
  );
} 