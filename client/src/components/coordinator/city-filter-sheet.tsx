import { MapPin, ListFilter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface CityWithCount {
  city: string;
  count: number;
}

interface CityFilterSheetProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
  availableCities: CityWithCount[];
  totalCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerLabel?: string;
}

export function CityFilterSheet({
  selectedCity,
  onCityChange,
  availableCities,
  totalCount,
  open,
  onOpenChange,
  triggerLabel = "Filtrer par ville"
}: CityFilterSheetProps) {
  const displayCity = selectedCity === "allCities" ? "Toutes les villes" : selectedCity;
  const currentCount = selectedCity === "allCities" 
    ? totalCount 
    : availableCities.find(c => c.city === selectedCity)?.count || 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <button
          className="w-full flex items-center justify-between p-2.5 sm:p-4 rounded-xl bg-gradient-to-br from-[#0d9488]/10 via-[#0f766e]/10 to-[#115e59]/10 border-2 border-[#0d9488]/30 hover-elevate active-elevate-2 transition-all duration-300"
          data-testid="button-city-filter"
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-[#0d9488] via-[#0f766e] to-[#115e59] shadow-lg shadow-teal-500/20 flex-shrink-0">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
            <div className="flex flex-col items-start min-w-0 flex-1">
              <span className="text-[10px] sm:text-xs text-muted-foreground font-medium hidden sm:block">
                {triggerLabel}
              </span>
              <span className="font-bold text-sm sm:text-base text-foreground truncate w-full">
                {displayCity}
              </span>
            </div>
          </div>
          <Badge 
            className="bg-gradient-to-br from-[#0d9488] via-[#0f766e] to-[#115e59] text-white border-0 text-sm sm:text-base font-bold px-2 sm:px-3 py-1 sm:py-1.5 flex-shrink-0"
          >
            {currentCount}
          </Badge>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] pt-4">
        <SheetHeader className="pb-3">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#0d9488] via-[#0f766e] to-[#115e59] shadow-lg">
              <ListFilter className="h-5 w-5 text-white" />
            </div>
            {triggerLabel}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2 overflow-y-auto max-h-[calc(85vh-80px)] pb-4">
          {/* All Cities Option */}
          <button
            onClick={() => {
              onCityChange("allCities");
              onOpenChange(false);
            }}
            data-testid="filter-city-all"
            className={`
              w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300
              ${selectedCity === "allCities" 
                ? "bg-gradient-to-br from-[#0d9488] via-[#0f766e] to-[#115e59] text-white shadow-lg" 
                : "bg-card hover-elevate"
              }
            `}
          >
            <div className="flex items-center gap-3">
              <MapPin className={`h-5 w-5 ${selectedCity === "allCities" ? "text-white" : "text-[#0d9488]"}`} />
              <span className="font-semibold">Toutes les villes</span>
            </div>
            <Badge 
              variant="secondary" 
              className={selectedCity === "allCities" ? "bg-white/20 text-white" : ""}
            >
              {totalCount}
            </Badge>
          </button>

          {/* Individual Cities */}
          {availableCities.map(({ city, count }) => (
            <button
              key={city}
              onClick={() => {
                onCityChange(city);
                onOpenChange(false);
              }}
              data-testid={`filter-city-${city}`}
              className={`
                w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300
                ${selectedCity === city 
                  ? "bg-gradient-to-br from-[#0d9488] via-[#0f766e] to-[#115e59] text-white shadow-lg" 
                  : "bg-card hover-elevate"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <MapPin className={`h-5 w-5 ${selectedCity === city ? "text-white" : "text-[#0d9488]"}`} />
                <span className="font-semibold">{city}</span>
              </div>
              <Badge 
                variant="secondary" 
                className={selectedCity === city ? "bg-white/20 text-white" : ""}
              >
                {count}
              </Badge>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
