import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingTruck } from "@/components/ui/loading-truck";
import { X, Check, Star, Truck, MapPin, Phone, Award, Calendar, Heart, Info, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TransporterPortfolioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Transporter {
  id: string;
  name: string;
  city: string;
  phoneNumber: string;
  hasPhoto: boolean; // PERFORMANCE: Photo loaded on-demand via separate endpoint
  rating: string;
  totalRatings: number;
  totalTrips: number;
  isVerified: boolean;
  createdAt: string;
}

export function TransporterPortfolio({ open, onOpenChange }: TransporterPortfolioProps) {
  const [cityFilter, setCityFilter] = useState<string | undefined>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [savedTransporters, setSavedTransporters] = useState<string[]>([]);
  const [photoCache, setPhotoCache] = useState<Record<string, string>>({});  // Cache for loaded photos

  // Fetch all cities for filter dropdown (unfiltered source)
  const { data: allCities = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/cities"],
    enabled: open,
  });

  // Fetch transporters
  const { data: transporters = [], isLoading } = useQuery<Transporter[]>({
    queryKey: ["/api/coordinator/transporters-portfolio", cityFilter],
    queryFn: async () => {
      const url = cityFilter 
        ? `/api/coordinator/transporters-portfolio?city=${encodeURIComponent(cityFilter)}`
        : "/api/coordinator/transporters-portfolio";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch transporters');
      }
      return response.json();
    },
    enabled: open,
  });

  // Reset currentIndex when city filter changes
  useEffect(() => {
    setCurrentIndex(0);
    setSavedTransporters([]);
  }, [cityFilter]);

  const currentTransporter = transporters[currentIndex];

  const handleSwipe = (direction: "left" | "right") => {
    if (!currentTransporter) return;

    setSwipeDirection(direction);

    if (direction === "right") {
      // Save transporter
      setSavedTransporters(prev => [...prev, currentTransporter.id]);
    }

    // Wait for animation
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setSwipeDirection(null);
    }, 300);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSavedTransporters([]);
  };

  const getStarDisplay = (rating: string, totalRatings: number) => {
    const ratingNum = parseFloat(rating);
    if (isNaN(ratingNum) || totalRatings === 0) {
      return <span className="text-muted-foreground">Nouveau transporteur</span>;
    }
    return (
      <div className="flex items-center gap-1.5">
        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        <span className="font-semibold text-lg">{ratingNum.toFixed(1)}</span>
        <span className="text-sm text-muted-foreground">({totalRatings})</span>
      </div>
    );
  };

  // Lazy load transporter photo on-demand
  const loadTransporterPhoto = async (transporterId: string) => {
    // Check cache first
    if (photoCache[transporterId]) {
      return photoCache[transporterId];
    }

    try {
      const response = await fetch(`/api/coordinator/transporters/${transporterId}/photo`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      if (data.photo) {
        setPhotoCache(prev => ({ ...prev, [transporterId]: data.photo }));
        return data.photo;
      }
    } catch (error) {
      console.error('Failed to load photo for transporter:', transporterId, error);
    }
    return null;
  };

  // Preload photos for current and next 2 transporters
  useEffect(() => {
    if (!transporters.length || currentIndex >= transporters.length) return;

    const preloadCount = 3; // Current + next 2
    for (let i = currentIndex; i < Math.min(currentIndex + preloadCount, transporters.length); i++) {
      const transporter = transporters[i];
      if (transporter.hasPhoto && !photoCache[transporter.id]) {
        loadTransporterPhoto(transporter.id);
      }
    }
  }, [currentIndex, transporters]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] md:max-w-2xl h-[90vh] p-0 gap-0 bg-background/95 backdrop-blur-md">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-[#17cfcf] to-[#0ea5a5] shadow-md">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  Portefeuille Transporteurs
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {transporters.length} transporteur{transporters.length !== 1 ? 's' : ''} validé{transporters.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            {/* City Filter */}
            <Select value={cityFilter || "all"} onValueChange={(v) => setCityFilter(v === "all" ? undefined : v)}>
              <SelectTrigger className="w-[180px]" data-testid="select-city-filter-portfolio">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Toutes les villes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les villes</SelectItem>
                {allCities.map(city => (
                  <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <LoadingTruck />
            </div>
          ) : transporters.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted">
                <Truck className="w-10 h-10 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-1">Aucun transporteur trouvé</h3>
                <p className="text-sm text-muted-foreground">
                  {cityFilter ? "Essayez de sélectionner une autre ville" : "Aucun transporteur validé disponible"}
                </p>
              </div>
            </div>
          ) : currentIndex >= transporters.length ? (
            // End of stack - Show saved transporters
            <div className="flex flex-col h-full gap-4 px-6 py-4 overflow-y-auto">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#17cfcf] to-[#0ea5a5]">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">C'est tout !</h3>
                  <p className="text-sm text-muted-foreground">Vous avez vu tous les transporteurs</p>
                </div>
              </div>

              {savedTransporters.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg flex items-center gap-2">
                    <Heart className="w-5 h-5 text-[#17cfcf]" />
                    Transporteurs sauvegardés ({savedTransporters.length})
                  </h4>
                  {transporters
                    .filter(t => savedTransporters.includes(t.id))
                    .map(transporter => (
                      <Card key={transporter.id} className="p-4" data-testid={`saved-transporter-${transporter.id}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {photoCache[transporter.id] ? (
                              <img src={photoCache[transporter.id]} alt={transporter.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <Truck className="w-8 h-8 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-semibold truncate">{transporter.name}</h5>
                              {transporter.isVerified && (
                                <Badge variant="secondary" className="text-xs">
                                  <Award className="w-3 h-3 mr-1" />
                                  Vérifié
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {transporter.city}
                              </span>
                              <span className="flex items-center gap-1">
                                <Truck className="w-3 h-3" />
                                {transporter.totalTrips} voyage{transporter.totalTrips !== 1 ? 's' : ''}
                              </span>
                              <span>{getStarDisplay(transporter.rating, transporter.totalRatings)}</span>
                            </div>
                          </div>
                          <a
                            href={`tel:${transporter.phoneNumber}`}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg",
                              "bg-gradient-to-br from-[#17cfcf] to-[#0ea5a5]",
                              "text-white font-medium text-sm",
                              "hover-elevate active-elevate-2"
                            )}
                            data-testid={`button-call-${transporter.id}`}
                          >
                            <Phone className="w-4 h-4" />
                            Appeler
                          </a>
                        </div>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Aucun transporteur sauvegardé</p>
                </div>
              )}

              <Button 
                onClick={handleReset} 
                variant="outline" 
                size="lg" 
                className="mt-4"
                data-testid="button-reset-portfolio"
              >
                <Info className="w-5 h-5 mr-2" />
                Recommencer
              </Button>
            </div>
          ) : (
            // Tinder-style card stack
            <div className="relative h-full flex items-center justify-center p-6">
              <AnimatePresence mode="popLayout">
                {currentTransporter && (
                  <motion.div
                    key={currentTransporter.id}
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ 
                      scale: 1, 
                      opacity: 1, 
                      y: 0,
                      x: swipeDirection === "left" ? -400 : swipeDirection === "right" ? 400 : 0,
                      rotate: swipeDirection === "left" ? -20 : swipeDirection === "right" ? 20 : 0,
                    }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.3, type: "spring" }}
                    className="absolute w-full max-w-md"
                  >
                    <Card className="overflow-hidden shadow-2xl border-2">
                      {/* Truck Photo */}
                      <div className="relative h-80 bg-gradient-to-br from-[#17cfcf]/10 to-[#0ea5a5]/10">
                        {photoCache[currentTransporter.id] ? (
                          <img
                            src={photoCache[currentTransporter.id]}
                            alt={currentTransporter.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Truck className="w-24 h-24 text-muted-foreground/30" />
                          </div>
                        )}
                        
                        {/* Verified Badge */}
                        {currentTransporter.isVerified && (
                          <div className="absolute top-4 right-4">
                            <Badge className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                              <Award className="w-3 h-3 mr-1" />
                              Vérifié
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Info Section */}
                      <div className="p-6 space-y-4">
                        {/* Name & Rating */}
                        <div>
                          <h3 className="text-2xl font-bold mb-2">{currentTransporter.name || 'Transporteur'}</h3>
                          {getStarDisplay(currentTransporter.rating, currentTransporter.totalRatings)}
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-[#17cfcf]" />
                            <span className="font-medium">{currentTransporter.city || 'Non spécifié'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Truck className="w-4 h-4 text-[#17cfcf]" />
                            <span className="font-medium">{currentTransporter.totalTrips} voyage{currentTransporter.totalTrips !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm col-span-2">
                            <Calendar className="w-4 h-4 text-[#17cfcf]" />
                            <span className="font-medium">
                              Depuis {format(new Date(currentTransporter.createdAt), 'MMM yyyy', { locale: fr })}
                            </span>
                          </div>
                        </div>

                        {/* Phone Section - Highly Visible */}
                        <div className="pt-3 border-t">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-1">
                              <Phone className="w-5 h-5 text-[#17cfcf]" />
                              <span className="font-semibold text-lg">{currentTransporter.phoneNumber}</span>
                            </div>
                            <a
                              href={`tel:${currentTransporter.phoneNumber}`}
                              className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg",
                                "bg-gradient-to-br from-[#17cfcf] to-[#0ea5a5]",
                                "text-white font-semibold",
                                "hover-elevate active-elevate-2 shadow-md"
                              )}
                              data-testid={`button-call-card-${currentTransporter.id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone className="w-4 h-4" />
                              Appeler
                            </a>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {currentTransporter && currentIndex < transporters.length && (
          <div className="p-6 border-t bg-background/50 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-6">
              {/* Pass Button */}
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleSwipe("left")}
                className={cn(
                  "w-16 h-16 rounded-full border-2 hover:border-red-500 hover:bg-red-50 hover:text-red-500 transition-all shadow-lg",
                  "active:scale-90"
                )}
                data-testid="button-pass-transporter"
              >
                <X className="w-8 h-8" />
              </Button>

              {/* Info Badge */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground font-medium">
                  {currentIndex + 1} / {transporters.length}
                </p>
              </div>

              {/* Save Button */}
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleSwipe("right")}
                className={cn(
                  "w-16 h-16 rounded-full border-2 hover:border-green-500 hover:bg-green-50 hover:text-green-500 transition-all shadow-lg",
                  "active:scale-90"
                )}
                data-testid="button-save-transporter"
              >
                <Heart className="w-8 h-8" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
