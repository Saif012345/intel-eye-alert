import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';

interface ThreatMarker {
  id: string;
  coordinates: [number, number];
  severity: string;
  title: string;
  country: string;
}

const countryCoordinates: Record<string, [number, number]> = {
  "United States": [-95, 38],
  "USA": [-95, 38],
  "Russia": [100, 60],
  "China": [105, 35],
  "Nigeria": [8, 10],
  "Brazil": [-55, -10],
  "India": [78, 22],
  "Germany": [10, 51],
  "United Kingdom": [-2, 54],
  "UK": [-2, 54],
  "France": [2, 47],
  "Japan": [138, 36],
  "Australia": [134, -25],
  "Canada": [-106, 56],
  "Iran": [53, 32],
  "North Korea": [127, 40],
};

const defaultCoords: [number, number][] = [
  [-74, 40], [0, 51], [139, 35], [-122, 37], [2, 48],
  [37, 55], [-43, -22], [151, -33], [13, 52], [121, 31],
];

const Globe3D = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [threats, setThreats] = useState<ThreatMarker[]>([]);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    fetchThreats();
    const interval = setInterval(fetchThreats, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchThreats = async () => {
    const { data } = await supabase
      .from('threats')
      .select('id, title, severity, country')
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      const markers: ThreatMarker[] = data.map((threat) => ({
        id: threat.id,
        coordinates: countryCoordinates[threat.country || "Unknown"] || 
          defaultCoords[Math.floor(Math.random() * defaultCoords.length)],
        severity: threat.severity,
        title: threat.title,
        country: threat.country || 'Unknown'
      }));
      setThreats(markers);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: '#ef4444',
      high: '#f97316',
      medium: '#3b82f6',
      low: '#22c55e'
    };
    return colors[severity] || '#3b82f6';
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || '';

    if (!mapboxgl.accessToken) {
      console.error('Mapbox token not configured');
      return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      projection: 'globe',
      zoom: 1.5,
      center: [30, 20],
      pitch: 45,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.current.scrollZoom.disable();

    map.current.on('style.load', () => {
      map.current?.setFog({
        color: 'rgb(10, 10, 20)',
        'high-color': 'rgb(20, 30, 60)',
        'horizon-blend': 0.3,
        'space-color': 'rgb(5, 5, 15)',
        'star-intensity': 0.6
      });
    });

    // Globe spinning animation
    const secondsPerRevolution = 180;
    const maxSpinZoom = 5;
    const slowSpinZoom = 3;
    let userInteracting = false;
    let spinEnabled = true;

    function spinGlobe() {
      if (!map.current) return;
      
      const zoom = map.current.getZoom();
      if (spinEnabled && !userInteracting && zoom < maxSpinZoom) {
        let distancePerSecond = 360 / secondsPerRevolution;
        if (zoom > slowSpinZoom) {
          const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
          distancePerSecond *= zoomDif;
        }
        const center = map.current.getCenter();
        center.lng -= distancePerSecond;
        map.current.easeTo({ center, duration: 1000, easing: (n) => n });
      }
    }

    map.current.on('mousedown', () => { userInteracting = true; });
    map.current.on('dragstart', () => { userInteracting = true; });
    map.current.on('mouseup', () => { userInteracting = false; spinGlobe(); });
    map.current.on('touchend', () => { userInteracting = false; spinGlobe(); });
    map.current.on('moveend', () => { spinGlobe(); });

    spinGlobe();

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, []);

  // Update markers when threats change
  useEffect(() => {
    if (!map.current) return;

    // Remove old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    threats.forEach((threat) => {
      const color = getSeverityColor(threat.severity);
      
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'threat-marker';
      el.innerHTML = `
        <div style="
          width: 16px;
          height: 16px;
          background: ${color};
          border-radius: 50%;
          box-shadow: 0 0 20px ${color}, 0 0 40px ${color}80, 0 0 60px ${color}40;
          animation: pulse 2s infinite;
          cursor: pointer;
        "></div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(`
          <div style="background: #1a1a2e; padding: 8px 12px; border-radius: 8px; border: 1px solid ${color}40;">
            <p style="font-weight: 600; color: #fff; margin: 0 0 4px 0; font-size: 12px;">${threat.title}</p>
            <p style="color: #94a3b8; margin: 0; font-size: 10px;">
              ${threat.country} • <span style="color: ${color}; text-transform: uppercase;">${threat.severity}</span>
            </p>
          </div>
        `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat(threat.coordinates)
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [threats]);

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        .mapboxgl-popup-content {
          background: transparent !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
        .mapboxgl-popup-tip {
          display: none !important;
        }
      `}</style>
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-background/20 rounded-lg" />
      
      {/* Live indicator */}
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border">
        <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
        <span className="text-xs font-medium">3D Globe View</span>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex gap-3 text-xs bg-background/80 backdrop-blur-sm p-3 rounded-lg border border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-destructive rounded-full shadow-[0_0_10px_#ef4444]" />
          <span>Critical</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-warning rounded-full shadow-[0_0_10px_#f97316]" />
          <span>High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_#3b82f6]" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-success rounded-full shadow-[0_0_10px_#22c55e]" />
          <span>Low</span>
        </div>
      </div>
    </div>
  );
};

export default Globe3D;