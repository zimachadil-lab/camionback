import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (address: string, placeDetails?: any) => void;
  placeholder?: string;
  className?: string;
  dataTestId?: string;
}

export function GooglePlacesAutocomplete({
  value,
  onChange,
  placeholder,
  className,
  dataTestId,
}: GooglePlacesAutocompleteProps) {
  const { i18n } = useTranslation();
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout>();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const fetchPredictions = async (input: string) => {
    if (!input || !apiKey || input.length < 2) {
      setPredictions([]);
      return;
    }

    try {
      // Use the new Places API (New) Autocomplete endpoint
      const response = await fetch(
        `https://places.googleapis.com/v1/places:autocomplete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
          },
          body: JSON.stringify({
            input: input,
            includedRegionCodes: ["ma"],
            languageCode: i18n.language === "ar" ? "ar" : "fr",
          }),
        }
      );

      if (!response.ok) {
        console.error("Google Places API error:", response.status);
        setPredictions([]);
        return;
      }

      const data = await response.json();

      if (data.suggestions) {
        setPredictions(data.suggestions);
        setShowPredictions(true);
      } else {
        setPredictions([]);
      }
    } catch (error) {
      console.error("Error fetching predictions:", error);
      setPredictions([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    // Debounce the API call
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      fetchPredictions(newValue);
    }, 300);
  };

  const handleSelectPrediction = async (prediction: any) => {
    const selectedText =
      prediction.placePrediction?.text?.text || prediction.description || inputValue;

    setInputValue(selectedText);
    setShowPredictions(false);
    setPredictions([]);

    // Pass the selected address and prediction details
    onChange(selectedText, prediction);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  if (!apiKey) {
    console.warn("Google Maps API key not found. Using regular input.");
    return (
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={className}
        data-testid={dataTestId}
      />
    );
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => inputValue.length >= 2 && predictions.length > 0 && setShowPredictions(true)}
        onBlur={() => setTimeout(() => setShowPredictions(false), 200)}
        placeholder={placeholder}
        className={className}
        data-testid={dataTestId}
        autoComplete="off"
      />

      {showPredictions && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {predictions.map((prediction, index) => {
            const displayText =
              prediction.placePrediction?.text?.text ||
              prediction.description ||
              `Suggestion ${index + 1}`;

            return (
              <div
                key={prediction.placePrediction?.placeId || index}
                className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm border-b last:border-b-0"
                onClick={() => handleSelectPrediction(prediction)}
                data-testid={`prediction-${index}`}
              >
                <div className="font-medium">{displayText}</div>
                {prediction.placePrediction?.structuredFormat?.mainText?.text && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {prediction.placePrediction.structuredFormat.secondaryText?.text}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
