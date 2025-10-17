import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Truck, MessageSquare } from "lucide-react";

interface OfferCardProps {
  offer: {
    id: string;
    transporterId: string;
    transporterName: string;
    amount: string;
    message?: string;
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
                      : "text-muted"
                  }`}
                />
              ))}
              <span className="text-sm text-muted-foreground ml-1">
                ({offer.totalTrips} trajets)
              </span>
            </div>

            <div className="text-2xl font-bold text-primary" data-testid={`text-amount-${offer.id}`}>
              {offer.amount} MAD
            </div>
          </div>
        </div>

        {offer.message && (
          <p className="text-sm text-muted-foreground border-l-2 border-primary pl-3">
            {offer.message}
          </p>
        )}
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
