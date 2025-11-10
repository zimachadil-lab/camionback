import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { Truck } from 'lucide-react';

// Fix for default marker icons in Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface RouteMapProps {
  departureCity: string;
  arrivalCity: string;
  departureAddress?: string;
  arrivalAddress?: string;
  distance?: number;
  className?: string;
  variant?: 'default' | 'compact';
}

// Moroccan cities coordinates (approximate centers)
const CITY_COORDINATES: Record<string, [number, number]> = {
  // Major cities
  'casablanca': [33.5731, -7.5898],
  'rabat': [34.0209, -6.8416],
  'marrakech': [31.6295, -7.9811],
  'fès': [34.0181, -5.0078],
  'fez': [34.0181, -5.0078],
  'tanger': [35.7595, -5.8340],
  'tangier': [35.7595, -5.8340],
  'meknès': [33.8935, -5.5473],
  'meknes': [33.8935, -5.5473],
  'agadir': [30.4278, -9.5981],
  'oujda': [34.6814, -1.9086],
  'kenitra': [34.2610, -6.5802],
  'tétouan': [35.5889, -5.3626],
  'tetouan': [35.5889, -5.3626],
  'safi': [32.2994, -9.2372],
  'mohammedia': [33.6866, -7.3833],
  'el jadida': [33.2316, -8.5007],
  'khouribga': [32.8811, -6.9063],
  'beni mellal': [32.3373, -6.3498],
  'nador': [35.1681, -2.9333],
  'settat': [32.9919, -7.6167],
  'larache': [35.1933, -6.1561],
  'ksar el kebir': [35.0017, -5.9050],
};

// Fallback to Morocco center if city not found
const MOROCCO_CENTER: [number, number] = [31.7917, -7.0926];

function getCityCoordinates(cityName: string): [number, number] {
  const normalized = cityName.toLowerCase().trim();
  
  // Try exact match first
  if (CITY_COORDINATES[normalized]) {
    return CITY_COORDINATES[normalized];
  }
  
  // Try partial match
  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return coords;
    }
  }
  
  // Return center of Morocco as fallback
  return MOROCCO_CENTER;
}

// Component to fit bounds automatically
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  
  useEffect(() => {
    if (positions.length >= 2) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [map, positions]);
  
  return null;
}

// Hook to measure container width with ResizeObserver
function useContainerWidth() {
  const [width, setWidth] = useState(0);
  const [element, setElement] = useState<HTMLDivElement | null>(null);

  // Callback ref to get the element when it mounts
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) return;

    const updateWidth = () => {
      setWidth(element.offsetWidth);
    };

    // Initial measurement
    updateWidth();

    // Observe resize
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, [element]);

  return { containerRef, width };
}

export function RouteMap({ departureCity, arrivalCity, departureAddress, arrivalAddress, distance, className = '', variant = 'default' }: RouteMapProps) {
  const { t } = useTranslation();
  const mapRef = useRef<L.Map | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { containerRef, width: containerWidth } = useContainerWidth();
  
  const departureCoords = getCityCoordinates(departureCity);
  const arrivalCoords = getCityCoordinates(arrivalCity);
  
  // Calculate truck animation distance (clamped to avoid negative values)
  const truckSize = 20; // Icon size in pixels
  const travelDistance = Math.max(0, containerWidth - truckSize);
  
  // Conditional dimensions based on variant
  const mapHeight = variant === 'compact' ? '360px' : '200px';
  const mapWidth = variant === 'compact' ? '360px' : '100%';
  const showDistanceBadge = variant === 'default';
  
  // Create custom markers with teal color
  const createCustomIcon = (color: string) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 24px;
          height: 24px;
          background-color: ${color};
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        ">
          <div style="
            width: 10px;
            height: 10px;
            background-color: white;
            border-radius: 50%;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          "></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 24],
    });
  };
  
  const departureIcon = createCustomIcon('#10b981'); // Green for departure
  const arrivalIcon = createCustomIcon('#ef4444'); // Red for arrival
  
  return (
    <div className={variant === 'compact' ? className : `space-y-3 ${className}`}>
      {/* Map container */}
      <div className={`rounded-lg overflow-hidden border border-border/40 ${variant === 'compact' ? 'shadow-md' : 'shadow-lg'}`}>
        <MapContainer
          center={MOROCCO_CENTER}
          zoom={6}
          style={{ height: mapHeight, width: mapWidth }}
          zoomControl={true}
          scrollWheelZoom={false}
          dragging={true}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Departure marker */}
          <Marker position={departureCoords} icon={departureIcon} />
          
          {/* Arrival marker */}
          <Marker position={arrivalCoords} icon={arrivalIcon} />
          
          {/* Route line */}
          <Polyline
            positions={[departureCoords, arrivalCoords]}
            pathOptions={{
              color: '#17cfcf',
              weight: 3,
              opacity: 0.8,
              dashArray: '10, 5',
            }}
          />
          
          {/* Fit bounds to show both markers */}
          <FitBounds positions={[departureCoords, arrivalCoords]} />
        </MapContainer>
      </div>
      
      {/* Distance badge with animated truck - only shown in default mode */}
      {showDistanceBadge && distance && (
        <div className="flex items-center justify-center">
          <div className="px-4 py-2 bg-[#17cfcf]/10 border border-[#17cfcf]/30 rounded-lg">
            {/* Route visualization with animated truck */}
            <div 
              ref={containerRef}
              className="relative flex items-center justify-between gap-2 min-h-[24px]"
              aria-label={`${departureCity} vers ${arrivalCity}, ${distance} kilomètres`}
            >
              {/* Departure city with neighborhood */}
              <div className="flex items-center gap-1.5 z-10">
                <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
                <div className="text-xs whitespace-nowrap">
                  {departureAddress ? (
                    <>
                      <span className="font-bold">{departureAddress.split(',')[0]}</span>
                      {departureAddress.includes(',') && (
                        <span className="text-muted-foreground">, {departureAddress.split(',').slice(1).join(',').trim()}</span>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground">{departureCity}</span>
                  )}
                </div>
              </div>
              
              {/* Animated truck traveling from departure to arrival */}
              <motion.div
                className="absolute left-0 z-20"
                style={{ 
                  width: truckSize,
                  height: truckSize,
                }}
                animate={shouldReduceMotion ? {
                  // Reduced motion: truck stays in the middle
                  x: containerWidth > 0 ? containerWidth / 2 - truckSize / 2 : 0,
                } : {
                  // Full animation: truck travels from start to end (one-way trip)
                  x: travelDistance,
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  repeatType: "loop", // Truck reappears at start instead of going backwards
                  ease: "easeInOut",
                  repeatDelay: 0.8,
                }}
              >
                <Truck 
                  className="text-[#17cfcf]" 
                  size={truckSize}
                  strokeWidth={2.5}
                />
              </motion.div>
              
              {/* Arrival city with neighborhood */}
              <div className="flex items-center gap-1.5 z-10">
                <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
                <div className="text-xs whitespace-nowrap">
                  {arrivalAddress ? (
                    <>
                      <span className="font-bold">{arrivalAddress.split(',')[0]}</span>
                      {arrivalAddress.includes(',') && (
                        <span className="text-muted-foreground">, {arrivalAddress.split(',').slice(1).join(',').trim()}</span>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground">{arrivalCity}</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Distance display */}
            <div className="text-center mt-1.5">
              <span className="text-lg font-bold text-[#17cfcf]">{distance} km</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
