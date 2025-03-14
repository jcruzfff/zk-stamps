'use client';

import { useState, useEffect, useRef, MutableRefObject } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';

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

export default function WorldGlobe({ poaps }: { poaps: POAP[] }) {
  const globeRef = useRef<GlobeMethods | null>(null);
  const [globeReady, setGlobeReady] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Update dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      // Use window dimensions directly for proper sizing
      setDimensions({
        width: window.innerWidth,
        // Calculate height based on viewport - add extra to ensure fullness
        height: window.innerHeight * 1.2
      });
    };

    updateDimensions();

    const handleResize = () => {
      updateDimensions();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Convert POAPs to markers
  const markers = poaps.map(poap => ({
    lat: poap.coordinates[0],
    lng: poap.coordinates[1],
    size: 2, // Larger marker size for better visibility
    color: '#4BB4F1',
    country: poap.country,
    countryCode: poap.countryCode
  }));

  useEffect(() => {
    if (globeRef.current && globeReady) {
      // Auto-rotate the globe slowly
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.3;
      
      // Adjust camera position to show more land mass and fill screen better
      globeRef.current.pointOfView({
        lat: 20,  // More north-facing view to show continents
        lng: 20,   // Centered longitude
        altitude: 3  // Closer view to fill more of the screen
      });
      
      // Additional globe settings for better visuals
      if (globeRef.current.controls) {
        // Disable zoom to maintain the perfect view
        globeRef.current.controls().enableZoom = false;
        // Make rotation smoother
        globeRef.current.controls().enableDamping = true;
        globeRef.current.controls().dampingFactor = 0.2;
      }
    }
  }, [globeReady]);

  return (
    <div ref={containerRef} className="globe-container">
      {dimensions.width > 0 && dimensions.height > 0 && (
        <div className="globe-wrapper">
          <Globe
            ref={globeRef as MutableRefObject<GlobeMethods | undefined>}
            width={dimensions.width}
            height={dimensions.height}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
            backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
            pointsData={markers}
            pointLabel="country"
            pointLat="lat"
            pointLng="lng"
            pointColor="color"
            pointRadius="size"
            pointAltitude={0.01}
            onGlobeReady={() => setGlobeReady(true)}
            atmosphereColor="#B3D9FF" // Light blue atmosphere
            backgroundColor="rgba(0,0,0,0)"
            pointsMerge={true} // Improve performance
          />
        </div>
      )}
    </div>
  );
}