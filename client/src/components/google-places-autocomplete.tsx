import { useRef, useEffect, forwardRef } from "react";
import Autocomplete from "react-google-autocomplete";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

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

    // Expose the input element via ref if provided
    useEffect(() => {
      if (ref && typeof ref === 'function') {
        ref(inputRef.current);
      } else if (ref && 'current' in ref) {
        (ref as any).current = inputRef.current;
      }
    }, [ref]);

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

    if (!apiKey) {
      console.warn("Google Maps API key not found. Using regular input.");
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
      <Autocomplete
        ref={inputRef}
        apiKey={apiKey}
        className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        placeholder={placeholder}
        defaultValue={value}
        data-testid={dataTestId}
        options={{
          types: ["(cities)"],
          componentRestrictions: { country: "ma" },
          language: i18n.language === "ar" ? "ar" : "fr",
          fields: ["address_components", "formatted_address", "geometry", "name", "place_id"],
        }}
        onPlaceSelected={(place) => {
          if (place && place.address_components) {
            // Extract city and neighborhood from place
            let city = "";
            let neighborhood = "";
            let fullAddress = place.formatted_address || "";

            place.address_components.forEach((component: google.maps.GeocoderAddressComponent) => {
              if (component.types.includes("locality")) {
                city = component.long_name;
              } else if (component.types.includes("sublocality") || component.types.includes("sublocality_level_1")) {
                neighborhood = component.long_name;
              } else if (!city && component.types.includes("administrative_area_level_1")) {
                city = component.long_name;
              }
            });

            // Create formatted address string with city and optional neighborhood
            const addressParts = [neighborhood, city].filter(Boolean);
            const formattedAddress = addressParts.join(", ");

            onChange(formattedAddress || fullAddress, place);
          } else {
            onChange("");
          }
        }}
        onChange={(e) => {
          // Handle manual typing
          const target = e.target as HTMLInputElement;
          onChange(target.value);
        }}
      />
    );
  }
);

GooglePlacesAutocomplete.displayName = "GooglePlacesAutocomplete";
