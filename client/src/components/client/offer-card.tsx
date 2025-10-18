import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Truck, MessageSquare, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface OfferCardProps {
  offer: {
    id: string;
    transporterId: string;
    transporterName: string;
    amount: string;
    clientAmount?: string;
    pickupDate?: string;
    loadType?: string;
    truckPhoto?: string;
    rating: number;
    totalTrips: number;
    status: string;
  };
  onAccept: (offerId: string) => void;
  onChat: () => void;
}

export function OfferCard({ offer, onAccept, onChat }: OfferCardProps) {
  const isAccepted = offer.status === "accepted";
  const isPending = offer.status === "pending";

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return format(date, "d MMMM yyyy", { locale: fr });
    } catch {
      return dateStr;
    }
  };

  const getLoadTypeLabel = (loadType: string | undefined) => {
    if (loadType === "return") return "Retour (camion vide qui rentre)";
    if (loadType === "shared") return "Groupage / Partagé";
    return "";
  };

  return (
    <Card className="overflow-hidden hover-elevate">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {offer.truckPhoto ? (
              <img 
                src={offer.truckPhoto} 
                alt="Camion" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Truck className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate" data-testid={`text-transporter-${offer.id}`}>
                {offer.transporterName || "Transporteur"}
              </h3>
              {isAccepted && (
                <Badge variant="default" className="bg-green-600">Acceptée</Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(offer.rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
              <span className="text-sm font-medium text-foreground ml-1">
                {offer.rating > 0 ? offer.rating.toFixed(1) : "0.0"}
              </span>
              <span className="text-sm text-muted-foreground">
                ({offer.totalTrips} {offer.totalTrips === 1 ? "course réalisée" : "courses réalisées"})
              </span>
            </div>

            <div className="text-2xl font-bold text-primary mb-3" data-testid={`text-amount-${offer.id}`}>
              {offer.clientAmount || offer.amount} MAD
            </div>

            <div className="space-y-1.5 text-sm">
              {offer.pickupDate && (
                <div className="flex items-center gap-2 text-foreground" data-testid={`text-pickup-date-${offer.id}`}>
                  <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span>Date de prise en charge : <span className="font-medium">{formatDate(offer.pickupDate)}</span></span>
                </div>
              )}
              {offer.loadType && (
                <div className="flex items-center gap-2 text-foreground" data-testid={`text-load-type-${offer.id}`}>
                  <Truck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span>Type de chargement : <span className="font-medium">{getLoadTypeLabel(offer.loadType)}</span></span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 gap-2 flex-col sm:flex-row">
        {!isAccepted && (
          <Button 
            onClick={() => onAccept(offer.id)} 
            className="w-full sm:flex-1"
            size="lg"
            disabled={!isPending}
            data-testid={`button-accept-${offer.id}`}
          >
            Choisir cette offre
          </Button>
        )}
        <Button 
          onClick={onChat} 
          variant={isAccepted ? "default" : "outline"}
          className={isAccepted ? "w-full gap-2" : "w-full sm:flex-1"}
          size="lg"
          data-testid={`button-chat-${offer.id}`}
        >
          <MessageSquare className="h-5 w-5" />
          Envoyer un message
        </Button>
      </CardFooter>
    </Card>
  );
}
