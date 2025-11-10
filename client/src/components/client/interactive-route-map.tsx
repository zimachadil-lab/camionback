/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

declare global {
  interface Window {
    google: any;
  }
}

interface InteractiveRouteMapProps {
  fromCity: string;
  toCity: string;
  onFromCityChange?: (address: string, location: { lat: number; lng: number }) => void;
  onToCityChange?: (address: string, location: { lat: number; lng: number }) => void;
  className?: string;
}

export function InteractiveRouteMap({
  fromCity,
  toCity,
  onFromCityChange,
  onToCityChange,
  className = "",
}: InteractiveRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const fromMarkerRef = useRef<any>(null);
  const toMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const { t, i18n } = useTranslation();

  // Wait for Google Maps to load with retry logic
  const waitForGoogleMaps = async (maxAttempts = 10, delayMs = 500): Promise<boolean> => {
    for (let i = 0; i < maxAttempts; i++) {
      if (window.google?.maps) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    return false;
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = async () => {
      try {
        // Wait for Google Maps to load with retry
        const loaded = await waitForGoogleMaps();
        if (!loaded) {
          console.error("Google Maps failed to load after retries");
          setMapError(true);
          setIsLoading(false);
          return;
        }

        // Initialize geocoder
        geocoderRef.current = new google.maps.Geocoder();

        // Create map centered on Morocco
        const map = new google.maps.Map(mapRef.current!, {
          center: { lat: 31.7917, lng: -7.0926 }, // Morocco center
          zoom: 6,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          gestureHandling: 'greedy',
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });

        mapInstanceRef.current = map;
        setIsLoading(false);
      } catch (error) {
        console.error("Error initializing map:", error);
        setMapError(true);
        setIsLoading(false);
      }
    };

    initMap();
  }, []);

  // Clean up markers and polyline
  const cleanupMapElements = () => {
    // Remove from marker
    if (fromMarkerRef.current) {
      fromMarkerRef.current.setMap(null);
      fromMarkerRef.current = null;
    }
    
    // Remove to marker
    if (toMarkerRef.current) {
      toMarkerRef.current.setMap(null);
      toMarkerRef.current = null;
    }
    
    // Remove polyline
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }
  };

  // Update markers and route when cities change
  useEffect(() => {
    if (!mapInstanceRef.current || !geocoderRef.current) return;
    
    // If either city is empty, cleanup and return
    if (!fromCity || !toCity) {
      cleanupMapElements();
      return;
    }

    const updateMapWithCities = async () => {
      const geocoder = geocoderRef.current!;
      const map = mapInstanceRef.current!;
      
      // Clean up existing elements before creating new ones
      cleanupMapElements();

      try {
        // Geocode from city
        if (fromCity) {
          const fromResult = await new Promise<google.maps.GeocoderResult>((resolve, reject) => {
            geocoder.geocode(
              { 
                address: fromCity,
                componentRestrictions: { country: 'MA' }
              },
              (results: any, status: any) => {
                if (status === 'OK' && results?.[0]) {
                  resolve(results[0]);
                } else {
                  reject(new Error(`Geocoding failed for ${fromCity}`));
                }
              }
            );
          });

          const fromLocation = fromResult.geometry.location;
          
          // Create custom marker element for departure
          const fromMarkerElement = document.createElement('div');
          fromMarkerElement.innerHTML = `
            <div class="relative animate-bounce-slow">
              <div class="absolute -inset-2 bg-teal-400 rounded-full blur-md opacity-60"></div>
              <div class="relative bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-full p-3 shadow-xl border-2 border-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-teal-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg font-medium">
                ${t('interactiveMap.departure')}
              </div>
            </div>
          `;

          // Create advanced marker with AdvancedMarkerElement
          const fromMarker = new google.maps.marker.AdvancedMarkerElement({
            map,
            position: fromLocation,
            content: fromMarkerElement,
            gmpDraggable: true,
          });

          // Add drag listener
          fromMarker.addListener('dragend', async (event: any) => {
            const newPos = event.latLng;
            try {
              const result = await new Promise<any>((resolve, reject) => {
                geocoder.geocode({ location: newPos }, (results: any, status: any) => {
                  if (status === 'OK' && results?.[0]) {
                    resolve(results[0]);
                  } else {
                    reject(new Error('Reverse geocoding failed'));
                  }
                });
              });
              
              const newAddress = result.formatted_address;
              onFromCityChange?.(newAddress, { lat: newPos.lat(), lng: newPos.lng() });
            } catch (error) {
              console.error('Error reverse geocoding:', error);
            }
          });

          fromMarkerRef.current = fromMarker;
        }

        // Geocode to city
        if (toCity) {
          const toResult = await new Promise<any>((resolve, reject) => {
            geocoder.geocode(
              { 
                address: toCity,
                componentRestrictions: { country: 'MA' }
              },
              (results: any, status: any) => {
                if (status === 'OK' && results?.[0]) {
                  resolve(results[0]);
                } else {
                  reject(new Error(`Geocoding failed for ${toCity}`));
                }
              }
            );
          });

          const toLocation = toResult.geometry.location;
          
          // Create custom marker element for arrival
          const toMarkerElement = document.createElement('div');
          toMarkerElement.innerHTML = `
            <div class="relative animate-bounce-slow" style="animation-delay: 0.2s;">
              <div class="absolute -inset-2 bg-orange-400 rounded-full blur-md opacity-60"></div>
              <div class="relative bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full p-3 shadow-xl border-2 border-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-orange-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg font-medium">
                ${t('interactiveMap.arrival')}
              </div>
            </div>
          `;

          const toMarker = new google.maps.marker.AdvancedMarkerElement({
            map,
            position: toLocation,
            content: toMarkerElement,
            gmpDraggable: true,
          });

          // Add drag listener
          toMarker.addListener('dragend', async (event: any) => {
            const newPos = event.latLng;
            try {
              const result = await new Promise<any>((resolve, reject) => {
                geocoder.geocode({ location: newPos }, (results: any, status: any) => {
                  if (status === 'OK' && results?.[0]) {
                    resolve(results[0]);
                  } else {
                    reject(new Error('Reverse geocoding failed'));
                  }
                });
              });
              
              const newAddress = result.formatted_address;
              onToCityChange?.(newAddress, { lat: newPos.lat(), lng: newPos.lng() });
            } catch (error) {
              console.error('Error reverse geocoding:', error);
            }
          });

          toMarkerRef.current = toMarker;
        }

        // Draw route if both cities exist
        if (fromCity && toCity && fromMarkerRef.current && toMarkerRef.current) {
          const fromPos = fromMarkerRef.current.position as google.maps.LatLng;
          const toPos = toMarkerRef.current.position as google.maps.LatLng;

          // Create curved path
          const path = [fromPos, toPos];
          
          const polyline = new google.maps.Polyline({
            path,
            geodesic: true,
            strokeColor: '#14b8a6',
            strokeOpacity: 0.8,
            strokeWeight: 4,
            map,
            icons: [
              {
                icon: {
                  path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  scale: 3,
                  strokeColor: '#0d9488',
                  fillColor: '#14b8a6',
                  fillOpacity: 1,
                },
                offset: '50%',
              },
            ],
          });

          routePolylineRef.current = polyline;

          // Fit bounds to show both markers
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(fromPos);
          bounds.extend(toPos);
          map.fitBounds(bounds, { top: 80, bottom: 80, left: 80, right: 80 });
        }
      } catch (error) {
        console.error("Error updating map with cities:", error);
      }
    };

    updateMapWithCities();
  }, [fromCity, toCity, onFromCityChange, onToCityChange, t]);

  if (mapError) {
    return (
      <Card className={`p-6 border-destructive/50 bg-destructive/5 ${className}`}>
        <div className="text-center text-destructive">
          <Navigation className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('interactiveMap.error')}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <Card className="overflow-hidden border-2 shadow-lg">
        <div 
          ref={mapRef} 
          className="w-full h-[400px] bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-950 dark:to-blue-950"
          data-testid="interactive-route-map"
        />
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {t('interactiveMap.loading')}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Interactive Instructions */}
      {!isLoading && (fromCity || toCity) && (
        <div className="mt-4 flex items-start gap-3 p-4 bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-950/50 dark:to-blue-950/50 border border-teal-200 dark:border-teal-800 rounded-lg">
          <Navigation className="h-5 w-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-teal-900 dark:text-teal-100">
              {t('interactiveMap.dragToAdjust')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
