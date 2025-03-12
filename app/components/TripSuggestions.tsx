'use client';

import { useState } from 'react';
import Image from 'next/image';

type Suggestion = {
  id: string;
  name: string;
  image: string;
  rating: number;
  description: string;
  author: string;
  postedAt: string;
};

export default function TripSuggestions() {
  // Mock data for trip suggestions
  const [suggestions] = useState<Suggestion[]>([
    {
      id: '1',
      name: "King + Duke",
      image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0",
      rating: 4.5,
      description: "One of EATER National and Atlanta Magazine's most anticipated new openings of 2013. This new restaurant by Ford Fry and Rocket Farm, designed by Meyer Davis and NO Architecture, is located at the corner of West Paces Ferry.",
      author: "Miley Erickson",
      postedAt: "2 weeks ago"
    },
    {
      id: '2',
      name: "Brasserie Antoinette",
      image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092",
      rating: 4.8,
      description: "A classic French brasserie with a modern twist. Located in the heart of the city, it offers authentic French cuisine paired with an extensive wine list.",
      author: "James Wilson",
      postedAt: "3 days ago"
    }
  ]);

  return (
    <div className="space-y-4">
      {suggestions.map(suggestion => (
        <div key={suggestion.id} className="rounded-lg overflow-hidden shadow-sm">
          <div className="h-48 bg-gray-200 w-full relative">
            {/* Image */}
            <Image
              src={suggestion.image}
              alt={suggestion.name}
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div className="p-3">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg">{suggestion.name}</h3>
              <div className="flex items-center">
                <span className="text-yellow-400">★</span>
                <span className="ml-1">{suggestion.rating}</span>
              </div>
            </div>
            <p className="text-sm text-gray-700 mt-1 line-clamp-2">{suggestion.description}</p>
            <div className="flex items-center mt-3">
              <div className="w-6 h-6 rounded-full bg-gray-300 mr-2"></div>
              <span className="text-blue-500 text-sm">{suggestion.author}</span>
              <span className="text-gray-400 text-xs ml-2">• {suggestion.postedAt}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 