import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Package, Calendar, DollarSign, Image as ImageIcon, AlertCircle, Eye, FileText, X, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown } from "lucide-react";
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
    transporterPrice?: number | null;
    platformFee?: number | null;
    clientTotal?: number | null;
    // Handling/Manutention fields
    handlingRequired?: boolean | null;
    departureFloor?: number | null;
    departureElevator?: boolean | null;
    arrivalFloor?: number | null;
    arrivalElevator?: boolean | null;
  };
  onMakeOffer?: (requestId: string) => void;
  showOfferButton?: boolean;
  userStatus?: string | null;
  onDecline?: (requestId: string) => void;
  onTrackView?: () => void;
  // New props for interest-based workflow
  isInterested?: boolean;
  onExpressInterest?: (requestId: string) => void;
  onWithdrawInterest?: (requestId: string) => void;
  isPendingInterest?: boolean;
}

export function RequestCard({ 
  request, 
  onMakeOffer, 
  showOfferButton = true, 
  userStatus,
  onDecline,
  onTrackView,
  isInterested = false,
  onExpressInterest,
  onWithdrawInterest,
  isPendingInterest = false,
}: RequestCardProps) {
  const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
  const [showValidationWarning, setShowValidationWarning] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
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
    } else if (onMakeOffer) {
      onMakeOffer(request.id);
    }
  };

  const handleExpressInterest = () => {
    if (!isUserValidated) {
      setShowValidationWarning(true);
    } else if (onExpressInterest) {
      onExpressInterest(request.id);
    }
  };

  const handleWithdrawInterest = () => {
    if (onWithdrawInterest) {
      onWithdrawInterest(request.id);
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
    <Card className="overflow-hidden hover-elevate border border-border/50">
      <CardContent className="p-4 space-y-3">
        {/* En-tête: Type et référence */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg">{request.goodsType}</h3>
          <Badge variant="outline" className="text-xs font-mono" data-testid={`text-reference-${request.id}`}>
            {request.referenceId}
          </Badge>
        </div>

        {/* Trajet - Mise en avant moderne */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-[#17cfcf]/10 to-[#13b3b3]/10 border border-[#17cfcf]/20">
          <MapPin className="w-5 h-5 text-[#17cfcf] flex-shrink-0" />
          <div className="flex items-center gap-2 font-semibold text-base">
            <span className="truncate">{request.fromCity}</span>
            <span className="text-[#17cfcf]">→</span>
            <span className="truncate">{request.toCity}</span>
          </div>
        </div>

        {/* Date et poids */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-2 rounded-md bg-[#17cfcf]/10 border border-[#17cfcf]/30">
            <Calendar className="w-4 h-4 text-[#17cfcf]" />
            <span className="text-sm font-semibold">
              {format(dateTime, "d MMM yyyy", { locale: fr })}
            </span>
          </div>
          {request.estimatedWeight && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-border">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{request.estimatedWeight}</span>
            </div>
          )}
        </div>

        {/* Prix - Design moderne et clean */}
        {request.transporterPrice && (
          <div className="p-3 rounded-lg bg-gradient-to-br from-[#00ff88]/15 to-[#00cc88]/15 border-2 border-[#00ff88]/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Montant Fixé :</span>
              <span className="text-2xl font-bold text-[#00ff88]">{request.transporterPrice.toLocaleString()} MAD</span>
            </div>
          </div>
        )}

        {/* Show client budget if no qualified price (old workflow) */}
        {request.budget && !request.transporterPrice && (
          <div className="p-3 rounded-lg bg-gradient-to-br from-[#00ff88]/15 to-[#00cc88]/15 border-2 border-[#00ff88]/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Budget :</span>
              <span className="text-2xl font-bold text-[#00ff88]">{request.budget}</span>
            </div>
          </div>
        )}

        {/* Description */}
        {request.description && (
          <div>
            <p className={`text-sm text-muted-foreground ${showFullDescription ? '' : 'line-clamp-2'}`}>
              {request.description}
            </p>
            {request.description.length > 100 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-xs text-[#17cfcf] hover:underline mt-1 flex items-center gap-1"
                data-testid={`button-toggle-description-${request.id}`}
              >
                {showFullDescription ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Voir moins
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    Voir plus
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Infos secondaires - badges modernes */}
        <div className="flex flex-wrap gap-2">
          {/* Manutention */}
          {request.handlingRequired !== undefined && request.handlingRequired !== null && (
            <Badge 
              variant="outline" 
              className="text-xs bg-background/50"
            >
              <span className="mr-1">🏋️</span>
              Manutention : {request.handlingRequired ? 'Oui' : 'Non'}
            </Badge>
          )}
          
          {/* Photos */}
          {request.photos && request.photos.length > 0 && (
            <Badge 
              variant="outline" 
              className="text-xs cursor-pointer hover-elevate bg-background/50"
              onClick={handleViewPhotos}
              data-testid={`button-view-photos-${request.id}`}
            >
              <ImageIcon className="w-3 h-3 mr-1" />
              {request.photos.length} photo{request.photos.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {showValidationWarning && !isUserValidated && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Votre compte est en cours de validation par l'équipe CamionBack. Vous pourrez soumettre des offres dès que votre profil sera approuvé.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      {showOfferButton && (request.status === "open" || request.status === "published_for_matching") && (
        <CardFooter className="p-4 pt-0 flex flex-row gap-2">
          {/* New interest-based workflow */}
          {onExpressInterest && onWithdrawInterest ? (
            isInterested ? (
              <Button 
                onClick={handleWithdrawInterest} 
                disabled={isPendingInterest}
                className="flex-1 h-12 font-semibold bg-gradient-to-r from-[#00ff88] to-[#00cc88] hover:from-[#00ff88]/90 hover:to-[#00cc88]/90 text-white border-0 shadow-md hover:shadow-lg transition-all"
                data-testid={`button-withdraw-interest-${request.id}`}
              >
                <ThumbsUp className="w-5 h-5 mr-2" />
                {isPendingInterest ? "Retrait..." : "Intéressé"}
              </Button>
            ) : (
              <>
                {onDecline && (
                  <Button 
                    onClick={() => onDecline(request.id)} 
                    disabled={isPendingInterest}
                    variant="outline"
                    className="flex-1 h-12 font-semibold hover:bg-muted/50"
                    data-testid={`button-not-available-${request.id}`}
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    <span>Indisponible</span>
                  </Button>
                )}
                <Button 
                  onClick={handleExpressInterest} 
                  disabled={isPendingInterest}
                  className="flex-1 h-12 font-semibold bg-gradient-to-r from-[#00ff88] to-[#00cc88] hover:from-[#00ff88]/90 hover:to-[#00cc88]/90 text-white border-0 shadow-md hover:shadow-lg transition-all"
                  data-testid={`button-express-interest-${request.id}`}
                >
                  <ThumbsUp className="w-5 h-5 mr-2" />
                  <span>{isPendingInterest ? "Envoi..." : "Intéressé"}</span>
                </Button>
              </>
            )
          ) : (
            /* Old offer-based workflow (backward compatibility) */
            <>
              {onDecline && (
                <Button 
                  onClick={() => onDecline(request.id)} 
                  variant="outline"
                  className="flex-1 h-12"
                  data-testid={`button-decline-${request.id}`}
                >
                  <X className="w-4 h-4 mr-2" />
                  Décliner
                </Button>
              )}
              <Button 
                onClick={handleOfferClick} 
                className="flex-1 h-12"
                variant={!isUserValidated ? "secondary" : "default"}
                data-testid={`button-make-offer-${request.id}`}
              >
                Faire une offre
              </Button>
            </>
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
