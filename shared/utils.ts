/**
 * Utility functions shared between client and server
 */

/**
 * Extract only the city name from a full address string
 * For transporter privacy - shows only city, not neighborhood/street
 * @param fullAddress - Complete address like "Hay Riad, Rabat, Maroc" or "Casablanca"
 * @returns Just the city name like "Rabat" or "Casablanca"
 */
export function extractCityFromAddress(fullAddress: string | null | undefined): string {
  if (!fullAddress) return "";
  
  // Split by comma and trim each part
  const parts = fullAddress.split(',').map(part => part.trim());
  
  // Known country/region names to exclude (in French and Arabic)
  const excludedSuffixes = [
    'Maroc', 
    'Morocco', 
    'المغرب',
    'Royaume du Maroc',
    'Kingdom of Morocco'
  ];
  
  if (parts.length === 1) {
    // Single part - return as is (already just a city)
    return fullAddress.trim();
  }
  
  // Multiple parts - filter out country names and take the last valid part
  const filteredParts = parts.filter(part => 
    !excludedSuffixes.some(excluded => 
      part.toLowerCase() === excluded.toLowerCase()
    )
  );
  
  if (filteredParts.length > 0) {
    // Return the last filtered part (should be the city)
    return filteredParts[filteredParts.length - 1];
  }
  
  // Fallback: return the penultimate part if last was filtered
  return parts.length > 1 ? parts[parts.length - 2] : fullAddress;
}
