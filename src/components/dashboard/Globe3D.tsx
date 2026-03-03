import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Globe } from 'lucide-react';

interface ThreatMarker {
  id: string;
  coordinates: [number, number];
  severity: string;
  title: string;
  country: string;
}

const countryCoordinates: Record<string, [number, number]> = {
  "United States": [-95, 38], "USA": [-95, 38], "Russia": [100, 60],
  "China": [105, 35], "Nigeria": [8, 10], "Brazil": [-55, -10],
  "India": [78, 22], "Germany": [10, 51], "United Kingdom": [-2, 54],
  "UK": [-2, 54], "France": [2, 47], "Japan": [138, 36],
  "Australia": [134, -25], "Canada": [-106, 56], "Iran": [53, 32],
  "North Korea": [127, 40],
};

const defaultCoords: [number, number][] = [
  [-74, 40], [0, 51], [139, 35], [-122, 37], [2, 48],
  [37, 55], [-43, -22], [151, -33], [13, 52], [121, 31],
];

const Globe3D = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [threats, setThreats] = useState<ThreatMarker[]>([]);
  const markersRef = useRef<any[]>([]);
  const [mapboxLoaded, setMapboxLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapboxRef = useRef<any>(null);

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
      critical: '#ef4444', high: '#f97316', medium: '#3b82f6', low: '#22c55e'
    };
    return colors[severity] || '#3b82f6';
  };

  // Load mapbox dynamically
  useEffect(() => {
    if (!mapContainer.current) return;

    const token = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
    if (!token) {
      setError('Mapbox token not configured. Add VITE_MAPBOX_PUBLIC_TOKEN to your .env file.');
      return;
    }

    let cancelled = false;

    import('mapbox-gl').then((mapboxgl) => {
      if (cancelled) return;
      
      import('mapbox-gl/dist/mapbox-gl.css');
      mapboxRef.current = mapboxgl.default || mapboxgl;
      mapboxRef.current.accessToken = token;

      try {
        map.current = new mapboxRef.current.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/dark-v11',
          projection: 'globe' as any,
          zoom: 1.5,
          center: [30, 20],
          pitch: 45,
        });

        map.current.addControl(
          new mapboxRef.current.NavigationControl({ visualizePitch: true }),
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

        // Globe spinning
        const secondsPerRevolution = 180;
        const maxSpinZoom = 5;
        const slowSpinZoom = 3;
        let userInteracting = false;

        function spinGlobe() {
          if (!map.current) return;
          const zoom = map.current.getZoom();
          if (!userInteracting && zoom < maxSpinZoom) {
            let distancePerSecond = 360 / secondsPerRevolution;
            if (zoom > slowSpinZoom) {
              distancePerSecond *= (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
            }
            const center = map.current.getCenter();
            center.lng -= distancePerSecond;
            map.current.easeTo({ center, duration: 1000, easing: (n: number) => n });
          }
        }

        map.current.on('mousedown', () => { userInteracting = true; });
        map.current.on('dragstart', () => { userInteracting = true; });
        map.current.on('mouseup', () => { userInteracting = false; spinGlobe(); });
        map.current.on('touchend', () => { userInteracting = false; spinGlobe(); });
        map.current.on('moveend', () => { spinGlobe(); });

        map.current.on('load', () => {
          setMapboxLoaded(true);
          spinGlobe();
        });
      } catch (e) {
        setError('Failed to initialize 3D globe. Check your Mapbox token.');
      }
    }).catch(() => {
      if (!cancelled) setError('Failed to load Mapbox GL library.');
    });

    return () => {
      cancelled = true;
      markersRef.current.forEach(marker => marker.remove());
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update markers when threats change
  useEffect(() => {
    if (!map.current || !mapboxLoaded || !mapboxRef.current) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    threats.forEach((threat) => {
      const color = getSeverityColor(threat.severity);
      
      const el = document.createElement('div');
      el.className = 'threat-marker';
      el.innerHTML = `
        <div style="
          width: 16px; height: 16px; background: ${color}; border-radius: 50%;
          box-shadow: 0 0 20px ${color}, 0 0 40px ${color}80, 0 0 60px ${color}40;
          animation: pulse 2s infinite; cursor: pointer;
        "></div>
      `;

      const popup = new mapboxRef.current.Popup({ offset: 25, closeButton: false })
        .setHTML(`
          <div style="background: #1a1a2e; padding: 8px 12px; border-radius: 8px; border: 1px solid ${color}40;">
            <p style="font-weight: 600; color: #fff; margin: 0 0 4px 0; font-size: 12px;">${threat.title}</p>
            <p style="color: #94a3b8; margin: 0; font-size: 10px;">
              ${threat.country} • <span style="color: ${color}; text-transform: uppercase;">${threat.severity}</span>
            </p>
          </div>
        `);

      const marker = new mapboxRef.current.Marker(el)
        .setLngLat(threat.coordinates)
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [threats, mapboxLoaded]);

  if (error) {
    return (
      <div className="relative w-full h-full min-h-[400px] flex items-center justify-center bg-[hsl(220,50%,4%)] rounded-lg">
        <div className="text-center space-y-3 p-6">
          <Globe className="h-12 w-12 text-cyan-400/30 mx-auto" />
          <p className="text-sm text-cyan-200/60">{error}</p>
          <p className="text-xs text-cyan-200/30">Switch to 2D Map view for full functionality</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px]">
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
        .mapboxgl-popup-tip { display: none !important; }
      `}</style>
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-background/20 rounded-lg" />
      
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border">
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        <span className="text-xs font-medium">3D Globe View</span>
      </div>

      <div className="absolute bottom-4 left-4 flex gap-3 text-xs bg-background/80 backdrop-blur-sm p-3 rounded-lg border border-border">
        {[
          { label: "Critical", color: "#ef4444" },
          { label: "High", color: "#f97316" },
          { label: "Medium", color: "#3b82f6" },
          { label: "Low", color: "#22c55e" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color, boxShadow: `0 0 10px ${s.color}` }} />
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Globe3D;
