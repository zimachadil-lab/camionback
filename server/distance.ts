/**
 * Google Distance Matrix API integration
 * Calculates road distance between two addresses in Morocco
 */

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const DISTANCE_MATRIX_API_URL = "https://maps.googleapis.com/maps/api/distancematrix/json";

interface DistanceResult {
  distance: number | null; // Distance in kilometers
  error?: string;
}

interface EnhancedDistanceResult {
  distanceKm: number | null;
  source: 'address' | 'city' | null;
  error?: string;
  wasCached?: boolean;
}

// Simple in-memory cache for city-to-city distances
const distanceCache = new Map<string, { km: number; timestamp: number }>();

// Normalize city name for cache key (remove accents, trim, lowercase)
function normalizeCityName(city: string): string {
  return city
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Generate cache key for city pair
function getCacheKey(fromCity: string, toCity: string): string {
  const from = normalizeCityName(fromCity);
  const to = normalizeCityName(toCity);
  return `${from}|${to}`;
}

/**
 * Calculate road distance between two addresses using Google Distance Matrix API
 * @param origin - Origin address (e.g., "Hay Hassani, Casablanca")
 * @param destination - Destination address (e.g., "Hay Riad, Rabat")
 * @returns Distance in kilometers, or null if calculation fails
 */
export async function calculateDistance(
  origin: string,
  destination: string
): Promise<DistanceResult> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error("GOOGLE_MAPS_API_KEY not configured");
    return { distance: null, error: "API key not configured" };
  }

  if (!origin || !destination) {
    return { distance: null, error: "Missing origin or destination" };
  }

  try {
    const params = new URLSearchParams({
      origins: origin,
      destinations: destination,
      mode: "driving", // Use driving mode for road distance
      region: "ma", // Morocco
      language: "fr",
      key: GOOGLE_MAPS_API_KEY,
    });

    const url = `${DISTANCE_MATRIX_API_URL}?${params.toString()}`;
    console.log(`[Distance API] Calculating distance: ${origin} → ${destination}`);

    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`[Distance API] HTTP error: ${response.status}`);
      return { distance: null, error: `HTTP ${response.status}` };
    }

    const data = await response.json();

    // Check API status
    if (data.status !== "OK") {
      console.error(`[Distance API] API error: ${data.status}`, data.error_message);
      return { distance: null, error: data.error_message || data.status };
    }

    // Extract distance from first result
    const element = data.rows?.[0]?.elements?.[0];
    
    if (!element || element.status !== "OK") {
      console.error(`[Distance API] No route found:`, element?.status);
      return { distance: null, error: element?.status || "No route found" };
    }

    // Convert meters to kilometers and round to nearest integer
    const distanceInMeters = element.distance?.value;
    if (!distanceInMeters) {
      return { distance: null, error: "Distance value missing" };
    }

    const distanceInKm = Math.round(distanceInMeters / 1000);
    console.log(`[Distance API] ✓ Distance calculated: ${distanceInKm} km`);

    return { distance: distanceInKm };

  } catch (error) {
    console.error("[Distance API] Request failed:", error);
    return { 
      distance: null, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Calculate distance for a transport request with fallback to city-level calculation
 * @param request - Transport request with addresses and cities
 * @returns Enhanced distance result with source tracking and caching
 */
export async function calculateDistanceForRequest(request: {
  fromCity: string;
  toCity: string;
  departureAddress?: string | null;
  arrivalAddress?: string | null;
  referenceId?: string;
}): Promise<EnhancedDistanceResult> {
  const { fromCity, toCity, departureAddress, arrivalAddress, referenceId } = request;

  // Try address-level calculation first if both addresses available
  if (departureAddress && arrivalAddress) {
    const origin = `${departureAddress}, ${fromCity}`;
    const destination = `${arrivalAddress}, ${toCity}`;
    
    const result = await calculateDistance(origin, destination);
    
    if (result.distance !== null) {
      console.log(`[Distance] ${referenceId || 'Request'}: ✓ Address-level distance: ${result.distance} km`);
      return {
        distanceKm: result.distance,
        source: 'address',
        wasCached: false
      };
    }
    
    console.warn(`[Distance] ${referenceId || 'Request'}: Address-level failed, falling back to city-level`);
  }

  // Fallback to city-level calculation
  const cacheKey = getCacheKey(fromCity, toCity);
  
  // Check cache first
  const cached = distanceCache.get(cacheKey);
  if (cached) {
    // Cache valid for 30 days
    const age = Date.now() - cached.timestamp;
    if (age < 30 * 24 * 60 * 60 * 1000) {
      console.log(`[Distance] ${referenceId || 'Request'}: ✓ Cached city distance: ${cached.km} km`);
      return {
        distanceKm: cached.km,
        source: 'city',
        wasCached: true
      };
    }
  }

  // Calculate city-to-city distance
  const result = await calculateDistance(fromCity, toCity);
  
  if (result.distance !== null) {
    // Store in cache
    distanceCache.set(cacheKey, {
      km: result.distance,
      timestamp: Date.now()
    });
    
    console.log(`[Distance] ${referenceId || 'Request'}: ✓ City-level distance: ${result.distance} km (cached)`);
    return {
      distanceKm: result.distance,
      source: 'city',
      wasCached: false
    };
  }

  // All attempts failed
  console.error(`[Distance] ${referenceId || 'Request'}: ✗ All distance calculations failed:`, result.error);
  return {
    distanceKm: null,
    source: null,
    error: result.error
  };
}
