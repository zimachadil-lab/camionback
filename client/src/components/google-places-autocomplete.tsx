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
      const initAutocomplete = async () => {
        if (!inputRef.current) return;

        try {
          setIsLoading(true);
          setHasError(false);

          // Load Google Maps API with Morocco region
          const language = i18n.language === "ar" ? "ar" : "fr";
          await loadGoogleMapsAPI({ language });

          // Initialize autocomplete
          autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
            types: ["geocode"],
            componentRestrictions: { country: "ma" },
            fields: ["address_components", "formatted_address", "geometry", "name", "place_id"],
          });

          // Listen for place selection
          autocompleteRef.current.addListener("place_changed", () => {
            const place = autocompleteRef.current?.getPlace();
            
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

              // Update input value immediately for controlled behavior
              if (inputRef.current) {
                inputRef.current.value = formattedAddress || city || place.formatted_address || "";
              }

              // Pass both formatted address and place object with structured data
              onChange(formattedAddress || city || place.formatted_address || "", place);
            } else {
              if (inputRef.current) {
                inputRef.current.value = "";
              }
              onChange("", undefined);
            }
          });

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
      };
    }, [i18n.language, onChange]);

    // Update input value when prop changes
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
        placeholder={placeholder}
        className={className}
        data-testid={dataTestId}
        disabled={isLoading}
      />
    );
  }
);

GooglePlacesAutocomplete.displayName = "GooglePlacesAutocomplete";
