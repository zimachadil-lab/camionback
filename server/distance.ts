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
