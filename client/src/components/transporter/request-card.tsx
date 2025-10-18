import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Package, Calendar, DollarSign, Image as ImageIcon, AlertCircle, Eye, FileText, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PhotoGalleryDialog } from "./photo-gallery-dialog";

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
    viewCount?: number;
    createdAt?: Date | string;
  };
  onMakeOffer: (requestId: string) => void;
  showOfferButton?: boolean;
  userStatus?: string | null;
  offerCount?: number;
  onDecline?: (requestId: string) => void;
  onTrackView?: () => void;
}

export function RequestCard({ 
  request, 
  onMakeOffer, 
  showOfferButton = true, 
  userStatus,
  offerCount,
  onDecline,
  onTrackView 
}: RequestCardProps) {
  const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
  const [showValidationWarning, setShowValidationWarning] = useState(false);
  const hasTrackedView = useRef(false);
  
  const dateTime = typeof request.dateTime === 'string' 
    ? new Date(request.dateTime) 
    : request.dateTime;

  const createdAt = request.createdAt 
    ? (typeof request.createdAt === 'string' ? new Date(request.createdAt) : request.createdAt)
    : null;

  const isUserValidated = userStatus === "validated";

  const handleOfferClick = () => {
    if (!isUserValidated) {
      setShowValidationWarning(true);
    } else {
      onMakeOffer(request.id);
    }
  };

  const handleViewPhotos = () => {
    setPhotoGalleryOpen(true);
  };

  // Track view when card is mounted (only once)
  useEffect(() => {
    if (onTrackView && !hasTrackedView.current) {
      hasTrackedView.current = true;
      onTrackView();
    }
  }, [request.id, onTrackView]);

  return (
    <>
    <Card className="overflow-hidden hover-elevate">
      <CardContent className="p-4 space-y-3">
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

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          {offerCount !== undefined && (
            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              <span>{offerCount} offre{offerCount > 1 ? 's' : ''}</span>
            </div>
          )}
          {request.viewCount !== undefined && (
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{request.viewCount} vue{request.viewCount > 1 ? 's' : ''}</span>
            </div>
          )}
          {createdAt && (
            <div className="flex items-center gap-1 col-span-3">
              <Calendar className="w-3 h-3" />
              <span>Créée le {format(createdAt, "d MMM", { locale: fr })}</span>
            </div>
          )}
        </div>

        {request.photos && request.photos.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewPhotos}
            className="w-full gap-2"
            data-testid={`button-view-photos-${request.id}`}
          >
            <ImageIcon className="w-4 h-4" />
            Voir les photos ({request.photos.length})
          </Button>
        )}

        {showValidationWarning && !isUserValidated && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Votre compte est en cours de validation par l'équipe CamionBack. Vous pourrez soumettre des offres dès que votre profil sera approuvé.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      {showOfferButton && request.status === "open" && (
        <CardFooter className="p-4 pt-0 flex flex-col gap-2">
          <Button 
            onClick={handleOfferClick} 
            className="w-full"
            size="lg"
            variant={!isUserValidated ? "secondary" : "default"}
            data-testid={`button-make-offer-${request.id}`}
          >
            Faire une offre
          </Button>
          {onDecline && (
            <Button 
              onClick={() => onDecline(request.id)} 
              className="w-full bg-red-600 hover:bg-red-700"
              size="sm"
              variant="destructive"
              data-testid={`button-decline-${request.id}`}
            >
              <X className="w-4 h-4 mr-1" />
              Décliner
            </Button>
          )}
        </CardFooter>
      )}
    </Card>

    <PhotoGalleryDialog
      open={photoGalleryOpen}
      onClose={() => setPhotoGalleryOpen(false)}
      photos={request.photos || []}
      referenceId={request.referenceId}
    />
    </>
  );
}
