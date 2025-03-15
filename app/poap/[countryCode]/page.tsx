'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Import types
type Media = {
  id: string;
  url: string;
  type: 'image' | 'video';
};

type POAPMemory = {
  country: string;
  countryCode: string;
  transactionHash: string;
  memories: string;
  media: Media[];
  lastUpdated: string;
};

// Mock data for country names when country code is provided
const countryNames: Record<string, string> = {
  'us': 'United States',
  'jp': 'Japan',
  'fr': 'France',
  'de': 'Germany',
  'gb': 'United Kingdom',
  'it': 'Italy',
  'br': 'Brazil',
  'au': 'Australia',
  'ca': 'Canada',
  'es': 'Spain'
};

// Mock POAPs based on country code
const getMockPOAP = (countryCode: string) => {
  const countryName = countryNames[countryCode] || 'Unknown Country';
  return {
    id: `mock-${countryCode}`,
    country: countryName,
    countryCode: countryCode.toUpperCase(),
    timestamp: new Date().toISOString(),
    coordinates: [0, 0] as [number, number],
    transactionHash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    verificationProof: `mock-proof-${countryCode}`,
    city: 'Major City'
  };
};

export default function POAPMemoryPage() {
  const params = useParams();
  const countryCode = params.countryCode as string;
  
  // State
  const [memory, setMemory] = useState<string>('');
  const [media, setMedia] = useState<Media[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSavedContent, setHasSavedContent] = useState(false);
  const [poap, setPOAP] = useState(getMockPOAP(countryCode));
  
  // Load data on component mount
  useEffect(() => {
    // Mock POAP based on country code
    setPOAP(getMockPOAP(countryCode));
    
    // Check local storage for existing memories
    if (typeof window !== 'undefined') {
      const storedMemories = localStorage.getItem('poapMemories');
      if (storedMemories) {
        const memories = JSON.parse(storedMemories) as POAPMemory[];
        const foundMemory = memories.find(m => m.countryCode.toLowerCase() === countryCode.toLowerCase());
        if (foundMemory) {
          setMemory(foundMemory.memories);
          setMedia(foundMemory.media);
          // If we found existing content, we're not in editing mode but we have saved content
          setIsEditing(false);
          setHasSavedContent(true);
        } else {
          // No existing memory found for this country, enable editing mode
          // But this is new content, not editing existing content
          setIsEditing(true);
          setHasSavedContent(false);
        }
      } else {
        // No stored memories at all, enable editing mode for new content
        setIsEditing(true);
        setHasSavedContent(false);
      }
    }
  }, [countryCode]);
  
  // Check if there is content to save
  const hasContent = memory.trim().length > 0 || media.length > 0;
  
  // Format transaction hash for display
  const formatTransactionHash = (hash: string) => {
    if (!hash) return '';
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };
  
  // Handle media upload
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newMedia: Media[] = [...media];
      
      Array.from(e.target.files).forEach(file => {
        const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;
        
        if (fileType) {
          const url = URL.createObjectURL(file);
          newMedia.push({
            id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            url,
            type: fileType as 'image' | 'video'
          });
        }
      });
      
      setMedia(newMedia);
    }
  };
  
  // Toggle media edit mode without affecting the main edit mode
  const handleAddMedia = () => {
    // Just open a file picker directly without changing edit state
    document.getElementById('media-upload-input')?.click();
  };
  
  // Remove media item
  const removeMedia = (id: string) => {
    setMedia(media.filter(item => item.id !== id));
  };
  
  // Handle save
  const saveMemory = () => {
    const updatedMemory: POAPMemory = {
      country: poap.country,
      countryCode: poap.countryCode,
      transactionHash: poap.transactionHash,
      memories: memory,
      media: media,
      lastUpdated: new Date().toISOString()
    };
    
    // Save to local storage (in a real app, this would go to a database)
    if (typeof window !== 'undefined') {
      const storedMemories = localStorage.getItem('poapMemories');
      const memories: POAPMemory[] = storedMemories ? JSON.parse(storedMemories) : [];
      
      // Update or add the memory
      const existingIndex = memories.findIndex(m => m.countryCode.toLowerCase() === countryCode.toLowerCase());
      if (existingIndex >= 0) {
        memories[existingIndex] = updatedMemory;
      } else {
        memories.push(updatedMemory);
      }
      
      localStorage.setItem('poapMemories', JSON.stringify(memories));
    }
    
    // Exit edit mode and mark that we now have saved content
    setIsEditing(false);
    setHasSavedContent(true);
  };
  
  // Get a placeholder image for the country
  const getCountryImage = (code: string) => {
    // Use specific images for US and Japan
    const lowerCode = code.toLowerCase();
    if (lowerCode === 'us') {
      return '/countries/america.png'; // Use the specific America image
    } else if (lowerCode === 'jp') {
      return '/countries/japan.png'; // Use the specific Japan image
    }
    
    // Fall back to the country code-based images for other countries
    return `/countries/${lowerCode}.jpg`;
  };
  
  return (
    <div className="bg-white min-h-screen">
      <div className="flex flex-col min-h-full">
        {/* Header with back button */}
        <header className="memory-header">
          <div className="flex items-center h-16 px-4">
            <Link 
              href="/"
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100"
              aria-label="Back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </Link>
          </div>
        </header>
        
        {/* Main content */}
        <main className="flex-grow px-4 py-4 mb-2 max-w-2xl mx-auto w-full">
          {/* Country flag and info */}
          <div className="flex flex-col items-center mb-2">
          
            
            <div className="relative w-full max-w-[356px] aspect-[356/502] mb-6 rounded-xl overflow-hidden memory-card">
              {/* POAP image */}
              <Image 
                src={getCountryImage(countryCode)}
                alt={`${countryNames[countryCode] || countryCode} POAP`}
                fill
                sizes="356px"
                className="rounded-xl object-contain"
                priority
              />
              
              {/* Stamp overlay - conditionally show US seal for USA */}
              {countryCode.toLowerCase() === 'us' ? (
                <div className="absolute bottom-[10px] right-[10px] w-[92px] h-[92px]">
                  <Image
                    src="/unitedstates-seal.png"
                    alt="United States Seal"
                    fill
                   
                  />
                </div>
              ) : (
                <div className="absolute bottom-4 right-4 p-2 rounded-full">
                  <Image
                    src="/stamper-stamp.svg"
                    alt="Verified Stamp"
                    width={60}
                    height={60}
                  />
                </div>
              )}
            </div>
            
            <h2 className="text-3xl font-bold mt-4 mb-2">{countryNames[countryCode] || countryCode}</h2>
            
            <div className="flex items-center text-sm text-gray-500 mb-6">
              <span className="font-mono">{formatTransactionHash(poap.transactionHash)}</span>
              <a 
                href={`https://explorer.celo.org/mainnet/tx/${poap.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            </div>
          </div>
          
          {/* Media section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Media</h3>
              
              {/* Always show Add Media button, regardless of edit mode */}
              <button
                onClick={handleAddMedia}
                className="text-[#4BB4F1] font-semibold text-sm"
              >
                +Add media
              </button>
            </div>
            
            {/* Hidden file input that's always available */}
            <input
              id="media-upload-input"
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleMediaUpload}
              className="sr-only"
            />
            
            {isEditing ? (
              <>
                <div className="memory-media-grid">
                  {media.map(item => (
                    <div key={item.id} className="memory-media-item">
                      {item.type === 'image' ? (
                        <Image src={item.url} alt="Memory media" fill style={{ objectFit: 'cover' }} sizes="200px" />
                      ) : (
                        <video src={item.url} controls />
                      )}
                      <button 
                        onClick={() => removeMedia(item.id)}
                        className="memory-media-item-remove"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  <label className="upload-zone">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleMediaUpload}
                      className="sr-only"
                    />
                    <svg className="upload-zone-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
                      <line x1="16" y1="5" x2="22" y2="5" />
                      <line x1="19" y1="2" x2="19" y2="8" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                    <span>Click to add photos or videos</span>
                  </label>
                </div>
              </>
            ) : (
              // Only show view-only grid when we're not in edit mode
              <>
                {media.length > 0 ? (
                  <div className="memory-media-grid">
                    {media.map(item => (
                      <div key={item.id} className="memory-media-item">
                        {item.type === 'image' ? (
                          <Image src={item.url} alt="Memory media" fill style={{ objectFit: 'cover' }} sizes="200px" />
                        ) : (
                          <video src={item.url} controls />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No media added yet. Click &quot;+Add media&quot; to add photos or videos.</p>
                )}
              </>
            )}
          </div>
          
          {/* Memories section */}
          <div className="memory-section">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Memories
              </h2>
              
              {/* Only show Edit button when not in edit mode and there's saved content */}
              {!isEditing && hasSavedContent ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-[#4BB4F1] font-semibold text-sm"
                >
                  Edit
                </button>
              ) : (
                /* Show Cancel button only when editing existing saved content */
                isEditing && hasSavedContent ? (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-[#4BB4F1] font-semibold text-sm"
                  >
                    Cancel
                  </button>
                ) : null
              )}
            </div>

            {/* Show textarea by default if editing or not saved yet */}
            {isEditing || !hasSavedContent ? (
              <textarea
                className="memory-text-area"
                value={memory}
                onChange={(e) => setMemory(e.target.value)}
                placeholder="Write about your experiences in this country..."
              />
            ) : (
              /* Display memories directly without container styling for a seamless look */
              memory ? (
                <p className="whitespace-pre-wrap">{memory}</p>
              ) : (
                <p className="text-gray-500 italic">No memories added yet.</p>
              )
            )}
          </div>
          
          {/* Add a save button at the bottom when in editing mode */}
          {(isEditing || !hasSavedContent) && (
            <div className="memory-action-buttons mb-6">
              <button
                onClick={saveMemory}
                className={`memory-action-button primary w-full ${!hasContent ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!hasContent}
              >
                Save Memory
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
} 