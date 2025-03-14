'use client';

import { useState, useEffect, useRef, MutableRefObject, useCallback } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';
import { useInView } from 'react-intersection-observer';

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
  const [isLoading, setIsLoading] = useState(true);
  
  // Only render the globe when it's in view - using options that won't cause re-renders
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  });
  
  // Use useCallback to stabilize the ref merging function and prevent re-renders
  const setRefs = useCallback((el: HTMLDivElement | null) => {
    // Only update refs if the element exists and has changed
    if (el && containerRef.current !== el) {
      containerRef.current = el;
      inViewRef(el);
    }
  }, [inViewRef]);

  // Update dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      // Use window dimensions directly for proper sizing
      setDimensions({
        width: window.innerWidth,
        // Use a more reasonable height for better performance
        height: window.innerHeight * 0.9
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
  const markers = poaps.map(poap => {
    console.log(`POAP for ${poap.country}:`, poap.coordinates); // Debugging log
    
    // Check if the country is the US and provide correct coordinates if needed
    let coordinates = poap.coordinates;
    
    // If this is the US and coordinates look incorrect (in the ocean), use fallback
    if (poap.countryCode.toLowerCase() === 'us' && 
        (Math.abs(poap.coordinates[0]) < 10 || Math.abs(poap.coordinates[1]) < 20)) {
      console.log('Using fallback coordinates for US');
      coordinates = [37.0902, -95.7129]; // Geographic center of US
    }
    
    return {
      lat: coordinates[0],
      lng: coordinates[1],
      size: 3, // Increased size for better visibility
      color: '#C25B44', // 
      country: poap.country,
      countryCode: poap.countryCode
    };
  });

  // Preload globe textures to improve performance
  useEffect(() => {
    // Only start loading the textures if the component is in view
    if (!inView) return;
    
    const preloadImages = () => {
      const imageUrls = [
        '/globe/earth-blue-marble.jpg',
        '/globe/earth-topology.png',
        '/globe/night-sky.png'
      ];
      
      let loadedCount = 0;
      
      imageUrls.forEach(url => {
        const img = new Image();
        img.onload = () => {
          loadedCount++;
          if (loadedCount === imageUrls.length) {
            // All images preloaded, we can start rendering the globe
            setIsLoading(false);
          }
        };
        img.onerror = () => {
          // On error, still continue to load the globe, just log the error
          console.error(`Failed to preload image: ${url}`);
          loadedCount++;
          if (loadedCount === imageUrls.length) {
            setIsLoading(false);
          }
        };
        img.src = url;
      });
    };
    
    // Start preloading images
    preloadImages();
  }, [inView]);

  // Configure globe when it's ready - use memoized callback for stability
  const handleGlobeReady = useCallback(() => {
    setGlobeReady(true);
  }, []);

  // Setup globe controls and settings
  useEffect(() => {
    if (globeRef.current && globeReady) {
      // Auto-rotate the globe slowly
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.3;
      
      // Check if we have a US marker and adjust view accordingly
      const usMarker = markers.find(m => m.countryCode.toLowerCase() === 'us');
      if (usMarker) {
        // Adjust camera position to show US
        globeRef.current.pointOfView({
          lat: usMarker.lat,
          lng: usMarker.lng,
          altitude: 2.5
        });
      } else {
        // Default view otherwise
        globeRef.current.pointOfView({
          lat: 20,
          lng: 20,
          altitude: 2.5
        });
      }
      
      // Additional globe settings for better visuals
      if (globeRef.current.controls) {
        // Enable zoom for better interaction
        globeRef.current.controls().enableZoom = true;
        // Make rotation smoother
        globeRef.current.controls().enableDamping = true;
        globeRef.current.controls().dampingFactor = 0.2;
        
        // Set min and max zoom distance to prevent zooming too far in or out
        globeRef.current.controls().minDistance = 150;
        globeRef.current.controls().maxDistance = 400;
      }
    }
  }, [globeReady, markers]);
  
  // Pause globe rotation and rendering when not in view to save resources
  useEffect(() => {
    if (globeRef.current && globeReady) {
      if (inView) {
        // Resume auto-rotation when in view
        globeRef.current.controls().autoRotate = true;
        // Resume animation frame loop
        if (globeRef.current.resumeAnimation) {
          globeRef.current.resumeAnimation();
        }
      } else {
        // Stop auto-rotation when not in view to save resources
        globeRef.current.controls().autoRotate = false;
        // Pause animation frame loop
        if (globeRef.current.pauseAnimation) {
          globeRef.current.pauseAnimation();
        }
      }
    }
  }, [inView, globeReady]);
  
  // Prevent events from propagating to prevent bottom sheet activation
  const preventPropagation = useCallback((e: React.MouseEvent | React.TouchEvent | React.WheelEvent) => {
    e.stopPropagation();
  }, []);

  // Memoize the Globe component to prevent unnecessary re-renders
  const renderGlobe = () => {
    if (!inView) {
      return (
        <div className="globe-placeholder">
          <div className="globe-placeholder-circle"></div>
          <p>Scroll to view world map</p>
        </div>
      );
    }
    
    if (isLoading) {
      return (
        <div className="globe-loading">
          <div className="globe-loading-spinner"></div>
          <p>Loading world map...</p>
        </div>
      );
    }
    
    if (dimensions.width > 0 && dimensions.height > 0) {
      return (
        <div className="globe-wrapper">
          <Globe
            ref={globeRef as MutableRefObject<GlobeMethods | undefined>}
            width={dimensions.width}
            height={dimensions.height}
            globeImageUrl="/globe/earth-blue-marble.jpg"
            bumpImageUrl="/globe/earth-topology.png"
            backgroundImageUrl="/globe/night-sky.png"
            pointsData={markers}
            pointLabel="country"
            pointLat="lat"
            pointLng="lng"
            pointColor="color"
            pointRadius="size"
            pointAltitude={0.01}
            onGlobeReady={handleGlobeReady}
            atmosphereColor="#B3D9FF" // Light blue atmosphere
            backgroundColor="rgba(0,0,0,0)"
            pointsMerge={true} // Improve performance
            rendererConfig={{ 
              antialias: false, // Disable antialiasing for better performance
              alpha: true,
              powerPreference: 'high-performance',
              precision: 'lowp' // Use lower precision for better performance
            }}
          />
        </div>
      );
    }
    
    return null;
  };

  return (
    <div 
      ref={setRefs}
      className="globe-container"
      onClick={preventPropagation}
      onTouchStart={preventPropagation}
      onTouchMove={preventPropagation}
      onTouchEnd={preventPropagation}
      onWheel={preventPropagation}
    >
      {renderGlobe()}

      <style jsx>{`
        .globe-container {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        
        .globe-loading {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          z-index: 10;
        }
        
        .globe-loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 1s ease-in-out infinite;
          margin-bottom: 10px;
        }
        
        .globe-placeholder {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.5);
          color: white;
        }
        
        .globe-placeholder-circle {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: radial-gradient(circle, #4BB4F1 0%, #1e3a8a 100%);
          margin-bottom: 20px;
          opacity: 0.7;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}