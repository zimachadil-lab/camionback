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
    <Card className="overflow-hidden hover-elevate border-2">
      <CardContent className="p-5 space-y-4">
        {/* En-tête: Référence discrète en haut à droite */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-medium text-muted-foreground">{request.goodsType}</h3>
          <Badge variant="outline" className="text-xs" data-testid={`text-reference-${request.id}`}>
            {request.referenceId}
          </Badge>
        </div>

        {/* TRAJET - Information principale en très grand */}
        <div className="flex items-center gap-3 py-2">
          <MapPin className="w-6 h-6 text-[#17cfcf] flex-shrink-0" />
          <div className="flex items-center gap-2 text-xl font-bold">
            <span className="truncate">{request.fromCity}</span>
            <span className="text-[#17cfcf]">→</span>
            <span className="truncate">{request.toCity}</span>
          </div>
        </div>

        {/* DATE DE MISSION - Badge coloré imposant */}
        <div className="flex items-center gap-2">
          <Badge className="bg-gradient-to-r from-[#17cfcf] to-[#13b3b3] text-white border-0 px-4 py-2 text-base font-bold">
            <Calendar className="w-5 h-5 mr-2" />
            {format(dateTime, "d MMM yyyy", { locale: fr }).toUpperCase()}
          </Badge>
          {request.estimatedWeight && (
            <Badge variant="outline" className="px-3 py-2 text-sm font-medium">
              <Package className="w-4 h-4 mr-1.5" />
              {request.estimatedWeight}
            </Badge>
          )}
        </div>

        {/* PRIX - Bloc très visible et coloré */}
        {request.transporterPrice && (
          <div className="bg-gradient-to-br from-[#00ff88]/20 to-[#00cc88]/20 dark:from-[#00ff88]/30 dark:to-[#00cc88]/30 rounded-xl p-4 border-2 border-[#00ff88]/40">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-foreground">Montant Fixé</span>
              <span className="text-3xl font-bold text-[#00ff88]">{request.transporterPrice.toLocaleString()} MAD</span>
            </div>
          </div>
        )}

        {/* Show client budget if no qualified price (old workflow) */}
        {request.budget && !request.transporterPrice && (
          <div className="bg-gradient-to-br from-[#00ff88]/20 to-[#00cc88]/20 rounded-xl p-4 border-2 border-[#00ff88]/40">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-foreground">Budget</span>
              <span className="text-3xl font-bold text-[#00ff88]">{request.budget}</span>
            </div>
          </div>
        )}

        {/* Description - Collapsible, moins proéminente */}
        {request.description && (
          <div className="border-t pt-3">
            <p className={`text-xs text-muted-foreground ${showFullDescription ? '' : 'line-clamp-2'}`}>
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

        {/* Infos secondaires regroupées */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {/* Manutention - Version simplifiée */}
          {request.handlingRequired !== undefined && request.handlingRequired !== null && (
            <Badge variant={request.handlingRequired ? "default" : "secondary"} className="text-xs">
              <span className="mr-1">🏋️</span>
              Manutention : {request.handlingRequired ? 'Oui' : 'Non'}
            </Badge>
          )}
          
          {/* Vues */}
          {request.viewCount !== undefined && request.viewCount > 0 && (
            <Badge variant="outline" className="text-xs">
              <Eye className="w-3 h-3 mr-1" />
              {request.viewCount} vue{request.viewCount > 1 ? 's' : ''}
            </Badge>
          )}
          
          {/* Photos */}
          {request.photos && request.photos.length > 0 && (
            <Badge 
              variant="outline" 
              className="text-xs cursor-pointer hover-elevate"
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
        <CardFooter className="p-5 pt-0 flex flex-col gap-3">
          {/* New interest-based workflow */}
          {onExpressInterest && onWithdrawInterest ? (
            isInterested ? (
              <Button 
                onClick={handleWithdrawInterest} 
                disabled={isPendingInterest}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-[#00ff88] to-[#00cc88] hover:from-[#00ff88]/90 hover:to-[#00cc88]/90 text-white border-0 shadow-lg hover:shadow-xl hover:shadow-[#00ff88]/30 transition-all duration-300"
                data-testid={`button-withdraw-interest-${request.id}`}
              >
                <ThumbsUp className="w-6 h-6 mr-2" />
                {isPendingInterest ? "Retrait..." : "Intéressé ✓"}
              </Button>
            ) : (
              <>
                <Button 
                  onClick={handleExpressInterest} 
                  disabled={isPendingInterest}
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-[#00ff88] to-[#00cc88] hover:from-[#00ff88]/90 hover:to-[#00cc88]/90 text-white border-0 shadow-lg hover:shadow-xl hover:shadow-[#00ff88]/30 transition-all duration-300"
                  data-testid={`button-express-interest-${request.id}`}
                >
                  <ThumbsUp className="w-6 h-6 mr-2" />
                  <span>{isPendingInterest ? "Envoi..." : "Intéressé"}</span>
                </Button>
                {onDecline && (
                  <Button 
                    onClick={() => onDecline(request.id)} 
                    disabled={isPendingInterest}
                    variant="ghost"
                    className="w-full h-10 text-sm text-muted-foreground hover:text-foreground"
                    data-testid={`button-not-available-${request.id}`}
                  >
                    <ThumbsDown className="w-4 h-4 mr-1.5" />
                    <span>Marquer indisponible</span>
                  </Button>
                )}
              </>
            )
          ) : (
            /* Old offer-based workflow (backward compatibility) */
            <>
              <Button 
                onClick={handleOfferClick} 
                className="w-full h-14 text-lg font-bold"
                variant={!isUserValidated ? "secondary" : "default"}
                data-testid={`button-make-offer-${request.id}`}
              >
                Faire une offre
              </Button>
              {onDecline && (
                <Button 
                  onClick={() => onDecline(request.id)} 
                  variant="ghost"
                  className="w-full h-10 text-sm text-muted-foreground"
                  data-testid={`button-decline-${request.id}`}
                >
                  <X className="w-4 h-4 mr-1" />
                  Décliner
                </Button>
              )}
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
