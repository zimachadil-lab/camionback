import { useRef, useEffect, forwardRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { loadGoogleMapsAPI } from "@/lib/google-maps-loader";

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (address: string, placeDetails?: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
  dataTestId?: string;
}

export const GooglePlacesAutocomplete = forwardRef<HTMLInputElement, GooglePlacesAutocompleteProps>(
  ({ value, onChange, placeholder, className, dataTestId }, ref) => {
    const { i18n } = useTranslation();
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    // Expose the input element via ref if provided
    useEffect(() => {
      if (ref && typeof ref === 'function') {
        ref(inputRef.current);
      } else if (ref && 'current' in ref) {
        (ref as any).current = inputRef.current;
      }
    }, [ref]);

    // Initialize Google Places Autocomplete using shared loader
    useEffect(() => {
      let mutationObserver: MutationObserver | null = null;
      
      const initAutocomplete = async () => {
        if (!inputRef.current) return;

        try {
          setIsLoading(true);
          setHasError(false);

          // Load Google Maps API with Morocco region
          const language = i18n.language === "ar" ? "ar" : "fr";
          await loadGoogleMapsAPI({ language });

          // Initialize autocomplete with Morocco bias
          autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
            types: ["geocode"],
            componentRestrictions: { country: "ma" },
            fields: ["address_components", "formatted_address", "geometry", "name", "place_id"],
            // Bias results towards Morocco
            bounds: new google.maps.LatLngBounds(
              new google.maps.LatLng(27.662, -13.168), // Southwest corner
              new google.maps.LatLng(35.923, -1.010)   // Northeast corner
            ),
            strictBounds: false,
          });

          // CRITICAL FIX: Listen to clicks on Google Places suggestions directly
          // This bypasses the Dialog's event blocking
          const handlePlaceSelect = () => {
            console.log("✅ [GooglePlaces] Checking for place...");
            
            // Longer delay to ensure Google has populated the place
            setTimeout(() => {
              const place = autocompleteRef.current?.getPlace();
              console.log("📍 [GooglePlaces] Place object:", place);
              
              if (place && place.address_components) {
                // Extract structured address components
                let city = "";
                let neighborhood = "";

                place.address_components.forEach((component: google.maps.GeocoderAddressComponent) => {
                  if (component.types.includes("locality")) {
                    city = component.long_name;
                  } else if (component.types.includes("sublocality") || component.types.includes("sublocality_level_1")) {
                    neighborhood = component.long_name;
                  } else if (!city && component.types.includes("administrative_area_level_1")) {
                    // Fallback to province/region if no locality found
                    city = component.long_name;
                  }
                });

                // Create formatted address with neighborhood and city
                const addressParts = [neighborhood, city].filter(Boolean);
                const formattedAddress = addressParts.join(", ");

                const finalValue = formattedAddress || city || place.formatted_address || "";
                console.log("🎯 [GooglePlaces] Valeur finale à appliquer:", finalValue);

                // Update input immediately
                if (inputRef.current) {
                  inputRef.current.value = finalValue;
                  console.log("📝 [GooglePlaces] Input DOM mis à jour avec:", inputRef.current.value);
                }

                // Pass both formatted address and place object with structured data
                console.log("🚀 [GooglePlaces] Appel onChange avec:", finalValue);
                onChange(finalValue, place);
              } else if (place && place.formatted_address) {
                // Fallback to formatted_address if no components
                if (inputRef.current) {
                  inputRef.current.value = place.formatted_address;
                }
                onChange(place.formatted_address, place);
              }
            }, 200); // Increased delay
          };

          // Listen for clicks on Google Places suggestion items
          const observeSuggestionClicks = () => {
            // Use MutationObserver to detect when suggestions appear
            const observer = new MutationObserver(() => {
              const pacContainer = document.querySelector('.pac-container');
              if (pacContainer) {
                const items = pacContainer.querySelectorAll('.pac-item');
                items.forEach((item) => {
                  item.addEventListener('mousedown', () => {
                    console.log("🖱️ [GooglePlaces] Click sur suggestion détecté!");
                    handlePlaceSelect();
                  });
                });
              }
            });

            observer.observe(document.body, {
              childList: true,
              subtree: true,
            });

            return observer;
          };

          mutationObserver = observeSuggestionClicks();
          
          // Also keep the Google Maps listener as backup
          autocompleteRef.current.addListener("place_changed", handlePlaceSelect);

          setIsLoading(false);
        } catch (error) {
          console.error("Failed to load Google Maps API:", error);
          setHasError(true);
          setIsLoading(false);
        }
      };

      initAutocomplete();

      // Cleanup
      return () => {
        if (autocompleteRef.current) {
          google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
        if (mutationObserver) {
          mutationObserver.disconnect();
        }
      };
    }, [i18n.language, onChange]);

    // Sync input value when prop changes (for dialog opening with existing value)
    useEffect(() => {
      if (inputRef.current && inputRef.current.value !== value) {
        inputRef.current.value = value;
      }
    }, [value]);

    if (hasError) {
      console.warn("Google Maps API failed to load. Using regular input.");
      return (
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={className}
          data-testid={dataTestId}
        />
      );
    }

    return (
      <Input
        ref={inputRef}
        type="text"
        defaultValue={value}
        onBlur={(e) => {
          // Sync manual typing when user leaves the field
          const currentValue = e.target.value;
          if (currentValue !== value) {
            onChange(currentValue);
          }
        }}
        placeholder={placeholder}
        className={className}
        data-testid={dataTestId}
        disabled={isLoading}
      />
    );
  }
);

GooglePlacesAutocomplete.displayName = "GooglePlacesAutocomplete";
