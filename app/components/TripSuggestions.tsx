'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

type Suggestion = {
  id: string;
  name: string;
  image: string;
  rating: number;
  description: string;
  author: string;
  postedAt: string;
  authorAvatar?: string;
};

export default function TripSuggestions() {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Only keep the setter function since we're not using the state value
  const [, setScrollPosition] = useState(0);
  
  // Mock data for trip suggestions, using Unsplash images
  const [suggestions] = useState<Suggestion[]>([
    {
      id: '1',
      name: "King + Duke",
      image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0",
      rating: 4.5,
      description: "One of EATER National and Atlanta Magazine's most anticipated new openings of 2013.This new restaurant by Ford Fry and Rocket Farm, designed by Meyer Davis and NO Architecture, is located at the corner of West Paces Ferry,",
      author: "Miley Erikson",
      postedAt: "2 weeks ago"
    },
    {
      id: '2',
      name: "Kingside Bar",
      image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092",
      rating: 4.8,
      description: "A classic French brasserie with a modern twist. Located in the heart of the city, it offers authentic French cuisine paired with an extensive wine list.",
      author: "James Wilson",
      postedAt: "3 days ago"
    },
    {
      id: '3',
      name: "The Optimist",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
      rating: 4.7,
      description: "Fresh seafood with a Southern accent in a converted warehouse space with a beach-food menu & outdoor seating.",
      author: "Emma Rodriguez",
      postedAt: "1 week ago"
    }
  ]);

  // Function to get background color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-100 text-blue-500',
      'bg-green-100 text-green-500',
      'bg-purple-100 text-purple-500',
      'bg-orange-100 text-orange-500',
      'bg-pink-100 text-pink-500',
      'bg-teal-100 text-teal-500'
    ];
    
    // Simple hash function to consistently get the same color for the same name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Handle scroll events
  const handleScroll = () => {
    if (scrollRef.current) {
      setScrollPosition(scrollRef.current.scrollLeft);
    }
  };

  return (
    <div className="trip-suggestions-container" style={{ overflow: 'hidden', marginBottom: '40px' }}>
      <style jsx>{`
        .trip-suggestions-container {
          margin-left: -20px;
          margin-right: -20px; 
          width: calc(100% + 40px);
        }
        .trip-suggestions-scroll {
          display: flex;
          overflow-x: auto;
          padding: 0 20px 16px 20px;
          scroll-padding: 0 20px;
          gap: 16px;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .trip-suggestions-scroll::-webkit-scrollbar {
          display: none;
        }
        .trip-card {
          flex: 0 0 auto;
          width: calc(100% - 80px);
          max-width: 340px;
          min-width: 280px;
          border-radius: 16px;
          overflow: hidden;
          background-color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transition: transform 0.3s ease;
        }
        .trip-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
        }
      `}</style>
      
      <div 
        ref={scrollRef}
        className="trip-suggestions-scroll"
        onScroll={handleScroll}
      >
        {suggestions.map((suggestion, index) => (
          <div 
            key={suggestion.id} 
            className="trip-card"
          >
            {/* Card image */}
            <div className="h-48 w-full relative">
              <Image
                src={suggestion.image}
                alt={suggestion.name}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 100vw, 340px"
                priority={index === 0}
              />
            </div>
            
            {/* Card content */}
            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-xl text-gray-900 line-clamp-1">{suggestion.name}</h3>
                <div className="flex items-center">
                  <span className="text-yellow-400 text-xl">★</span>
                  <span className="ml-1 font-medium text-gray-700">{suggestion.rating}</span>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm line-clamp-3">{suggestion.description}</p>
              
              <div className="flex items-center mt-4">
                <div className={`avatar-circle w-10 h-10 ${getAvatarColor(suggestion.author)} mr-3 flex items-center justify-center`}>
                  <span className="font-medium text-base">
                    {suggestion.author.charAt(0)}
                  </span>
                </div>
                <div>
                  <span className="text-blue-500 font-medium block">{suggestion.author}</span>
                  <span className="text-gray-500 text-xs block">• {suggestion.postedAt}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}