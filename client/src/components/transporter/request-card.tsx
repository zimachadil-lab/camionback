import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface RequestCardProps {
  request: {
    id: string;
    referenceId: string;
    clientName?: string;
    fromCity: string;
    toCity: string;
    description: string;
    goodsType: string;
    estimatedWeight?: string;
    dateTime: Date | string;
    budget?: string;
    photos?: string[];
    status: string;
  };
  onMakeOffer: (requestId: string) => void;
  showOfferButton?: boolean;
}

export function RequestCard({ request, onMakeOffer, showOfferButton = true }: RequestCardProps) {
  const dateTime = typeof request.dateTime === 'string' 
    ? new Date(request.dateTime) 
    : request.dateTime;

  return (
    <Card className="overflow-hidden hover-elevate">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Badge variant="outline" className="mb-2" data-testid={`text-reference-${request.id}`}>
              {request.referenceId}
            </Badge>
            <h3 className="font-semibold text-lg mb-1">{request.goodsType}</h3>
          </div>
          {request.status === "open" && (
            <Badge variant="default" className="bg-green-600">Disponible</Badge>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="font-medium truncate">{request.fromCity}</span>
          <span className="text-muted-foreground">→</span>
          <span className="font-medium truncate">{request.toCity}</span>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {request.description}
        </p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="truncate">
              {format(dateTime, "d MMM yyyy", { locale: fr })}
            </span>
          </div>
          {request.estimatedWeight && (
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="truncate">{request.estimatedWeight}</span>
            </div>
          )}
        </div>

        {request.budget && (
          <div className="flex items-center gap-2 text-primary font-semibold">
            <DollarSign className="w-4 h-4" />
            <span>Budget: {request.budget}</span>
          </div>
        )}

        {request.photos && request.photos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {request.photos.map((photo, idx) => (
              <img
                key={idx}
                src={photo}
                alt={`Photo ${idx + 1}`}
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
              />
            ))}
          </div>
        )}
      </CardContent>

      {showOfferButton && request.status === "open" && (
        <CardFooter className="p-4 pt-0">
          <Button 
            onClick={() => onMakeOffer(request.id)} 
            className="w-full"
            size="lg"
            data-testid={`button-make-offer-${request.id}`}
          >
            Faire une offre
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
