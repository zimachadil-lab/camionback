/**
 * Shared Google Maps JavaScript API loader
 * Ensures single script load with Morocco region (region=MA)
 * to display Western Sahara as part of Morocco
 */

let loadPromise: Promise<typeof google> | null = null;

export interface GoogleMapsLoaderOptions {
  language?: string; // 'fr' or 'ar'
}

/**
 * Load Google Maps JavaScript API with Morocco region setting
 * Returns cached promise if already loading/loaded
 */
export async function loadGoogleMapsAPI(
  options: GoogleMapsLoaderOptions = {}
): Promise<typeof google> {
  // Return cached promise if already loading/loaded
  if (loadPromise) {
    return loadPromise;
  }

  // Check if already loaded globally
  if (window.google?.maps) {
    loadPromise = Promise.resolve(window.google);
    return loadPromise;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    throw new Error('VITE_GOOGLE_MAPS_API_KEY not configured');
  }

  // Create and cache the load promise
  loadPromise = new Promise<typeof google>((resolve, reject) => {
    // Build script URL with Morocco region
    const params = new URLSearchParams({
      key: apiKey,
      libraries: 'places',
      region: 'MA', // Morocco - displays Western Sahara as part of Morocco
      language: options.language || 'fr',
    });

    const scriptUrl = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;

    // Create and inject script tag
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google);
      } else {
        reject(new Error('Google Maps API loaded but window.google.maps not available'));
      }
    };

    script.onerror = () => {
      loadPromise = null; // Clear cache on error to allow retry
      reject(new Error('Failed to load Google Maps API script'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * Wait for Google Maps API to be loaded
 * Useful for components that need to ensure API is available
 */
export async function waitForGoogleMaps(
  options: GoogleMapsLoaderOptions = {},
  maxRetries = 10,
  retryInterval = 500
): Promise<typeof google> {
  // Try loading via loader first
  try {
    return await loadGoogleMapsAPI(options);
  } catch (error) {
    console.warn('Google Maps loader failed, attempting polling:', error);
  }

  // Fallback: poll for window.google (in case script loaded externally)
  for (let i = 0; i < maxRetries; i++) {
    if (window.google?.maps) {
      return window.google;
    }
    await new Promise(resolve => setTimeout(resolve, retryInterval));
  }

  throw new Error(`Google Maps API not available after ${maxRetries} attempts`);
}
