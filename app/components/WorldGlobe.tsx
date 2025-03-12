'use client';

import { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';

type POAP = {
  id: string;
  country: string;
  countryCode: string;
  timestamp: string;
  coordinates: [number, number];
  transactionHash: string;
  verificationProof: string;
};

export default function WorldGlobe({ poaps }: { poaps: POAP[] }) {
  const globeRef = useRef<any>();
  const [globeReady, setGlobeReady] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 300 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Update dimensions on mount and resize
  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: 300,
      });
    }

    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: 300,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Convert POAPs to markers
  const markers = poaps.map(poap => ({
    lat: poap.coordinates[0],
    lng: poap.coordinates[1],
    size: 0.8,
    color: '#4B56DB', // Blue color from mockup
    country: poap.country,
    countryCode: poap.countryCode
  }));

  useEffect(() => {
    if (globeRef.current && globeReady) {
      // Auto-rotate the globe slowly
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.5;
      
      // Position camera
      globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });
    }
  }, [globeReady]);

  return (
    <div ref={containerRef} className="w-full h-[300px] relative">
      {dimensions.width > 0 && (
        <Globe
          ref={globeRef}
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
          backgroundColor="rgba(255,255,255,0)"
        />
      )}
    </div>
  );
} 