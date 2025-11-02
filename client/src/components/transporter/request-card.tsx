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

        <div>
          <p className={`text-sm text-muted-foreground ${showFullDescription ? '' : 'line-clamp-2'}`}>
            {request.description}
          </p>
          {request.description && request.description.length > 100 && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-xs text-primary hover:underline mt-1 flex items-center gap-1"
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

        {/* Show qualified price if available (new workflow) */}
        {request.transporterPrice && (
          <div className="p-3 bg-green-600/10 dark:bg-green-500/20 rounded-md border border-green-600/30 dark:border-green-500/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Montant Fixé :</span>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">{request.transporterPrice} MAD</span>
            </div>
          </div>
        )}

        {/* Show client budget if no qualified price (old workflow) */}
        {request.budget && !request.transporterPrice && (
          <div className="flex items-center gap-2 text-primary font-semibold">
            <DollarSign className="w-4 h-4" />
            <span>Budget: {request.budget}</span>
          </div>
        )}

        {/* Handling/Manutention Information */}
        {request.handlingRequired !== undefined && request.handlingRequired !== null && (
          <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>🏋️</span>
              <span>Manutention : {request.handlingRequired ? 'Oui' : 'Non'}</span>
            </div>
            {request.handlingRequired && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <span>🏢</span>
                    <span className="font-medium">Départ</span>
                  </div>
                  <div className="pl-4">
                    {request.departureFloor !== undefined && request.departureFloor !== null ? (
                      <>
                        <div>{request.departureFloor === 0 ? 'RDC' : `${request.departureFloor}ᵉ étage`}</div>
                        <div className="text-muted-foreground">
                          Ascenseur {request.departureElevator ? '✅' : '❌'}
                        </div>
                      </>
                    ) : (
                      <div className="text-muted-foreground">Non spécifié</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <span>🏠</span>
                    <span className="font-medium">Arrivée</span>
                  </div>
                  <div className="pl-4">
                    {request.arrivalFloor !== undefined && request.arrivalFloor !== null ? (
                      <>
                        <div>{request.arrivalFloor === 0 ? 'RDC' : `${request.arrivalFloor}ᵉ étage`}</div>
                        <div className="text-muted-foreground">
                          Ascenseur {request.arrivalElevator ? '✅' : '❌'}
                        </div>
                      </>
                    ) : (
                      <div className="text-muted-foreground">Non spécifié</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          {request.viewCount !== undefined && (
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{request.viewCount} vue{request.viewCount > 1 ? 's' : ''}</span>
            </div>
          )}
          {createdAt && (
            <div className="flex items-center gap-1">
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

      {showOfferButton && (request.status === "open" || request.status === "published_for_matching") && (
        <CardFooter className="p-4 pt-0 flex flex-row gap-2">
          {/* New interest-based workflow */}
          {onExpressInterest && onWithdrawInterest ? (
            isInterested ? (
              <Button 
                onClick={handleWithdrawInterest} 
                disabled={isPendingInterest}
                className="flex-1 bg-green-600 hover:bg-green-700"
                data-testid={`button-withdraw-interest-${request.id}`}
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                {isPendingInterest ? "Retrait..." : "Intéressé ✓"}
              </Button>
            ) : (
              <>
                {onDecline && (
                  <Button 
                    onClick={() => onDecline(request.id)} 
                    disabled={isPendingInterest}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 min-w-0"
                    variant="secondary"
                    data-testid={`button-not-available-${request.id}`}
                  >
                    <ThumbsDown className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span className="truncate">Indisponible</span>
                  </Button>
                )}
                <Button 
                  onClick={handleExpressInterest} 
                  disabled={isPendingInterest}
                  className="flex-1 bg-green-600 hover:bg-green-700 min-w-0"
                  data-testid={`button-express-interest-${request.id}`}
                >
                  <ThumbsUp className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="truncate">{isPendingInterest ? "Envoi..." : "Intéressé"}</span>
                </Button>
              </>
            )
          ) : (
            /* Old offer-based workflow (backward compatibility) */
            <>
              {onDecline && (
                <Button 
                  onClick={() => onDecline(request.id)} 
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  variant="destructive"
                  data-testid={`button-decline-${request.id}`}
                >
                  <X className="w-4 h-4 mr-1" />
                  Décliner
                </Button>
              )}
              <Button 
                onClick={handleOfferClick} 
                className="flex-1"
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
