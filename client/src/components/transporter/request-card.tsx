import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Package, Calendar, DollarSign, Image as ImageIcon, AlertCircle, Eye, FileText, X, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Home, Sofa, Boxes, Truck, Wrench, ShoppingCart, LucideIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PhotoGalleryDialog } from "./photo-gallery-dialog";

// Configuration des catégories avec icônes et couleurs
const getCategoryConfig = (goodsType: string): { icon: LucideIcon; color: string; bgColor: string; borderColor: string } => {
  const type = goodsType.toLowerCase();
  
  if (type.includes('déménagement')) {
    return {
      icon: Home,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      borderColor: 'border-emerald-500'
    };
  }
  
  if (type.includes('meuble') || type.includes('mobilier')) {
    return {
      icon: Sofa,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
      borderColor: 'border-blue-500'
    };
  }
  
  if (type.includes('matériau') || type.includes('construction')) {
    return {
      icon: Boxes,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-orange-500 to-orange-600',
      borderColor: 'border-orange-500'
    };
  }
  
  if (type.includes('équipement') || type.includes('machine')) {
    return {
      icon: Wrench,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-purple-500 to-purple-600',
      borderColor: 'border-purple-500'
    };
  }
  
  if (type.includes('marchandise') || type.includes('produit')) {
    return {
      icon: ShoppingCart,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-pink-500 to-pink-600',
      borderColor: 'border-pink-500'
    };
  }
  
  if (type.includes('colis')) {
    return {
      icon: Package,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-amber-500 to-amber-600',
      borderColor: 'border-amber-500'
    };
  }
  
  if (type.includes('matériel')) {
    return {
      icon: Wrench,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      borderColor: 'border-indigo-500'
    };
  }
  
  // Default: Transport général
  return {
    icon: Truck,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-slate-500 to-slate-600',
    borderColor: 'border-slate-500'
  };
};

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

  const categoryConfig = getCategoryConfig(request.goodsType);
  const CategoryIcon = categoryConfig.icon;

  return (
    <>
    <Card className="overflow-hidden hover-elevate border border-border">
      {/* En-tête coloré avec icône de catégorie */}
      <div className={`${categoryConfig.bgColor} p-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <div className="bg-white/20 rounded-md p-1.5 backdrop-blur-sm">
            <CategoryIcon className={`w-5 h-5 ${categoryConfig.color}`} />
          </div>
          <h3 className="font-semibold text-white text-base">{request.goodsType}</h3>
        </div>
        <Badge className="bg-slate-900/90 text-white border-0 font-mono text-xs" data-testid={`text-reference-${request.id}`}>
          {request.referenceId}
        </Badge>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Trajet */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="font-medium">Trajet</span>
          </div>
          <div className="flex items-center gap-2 text-base font-semibold pl-6">
            <span className="truncate">{request.fromCity}</span>
            <span className="text-[#17cfcf]">→</span>
            <span className="truncate">{request.toCity}</span>
          </div>
        </div>

        {/* Date de mission */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">Disponibilité</span>
          </div>
          <div className="pl-6 font-semibold">
            {format(dateTime, "dd MMMM yyyy", { locale: fr })}
          </div>
        </div>

        {/* Services requis */}
        {request.description && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span className="font-medium">Services</span>
            </div>
            <p className={`text-sm pl-6 ${showFullDescription ? '' : 'line-clamp-2'}`}>
              {request.description}
            </p>
            {request.description.length > 100 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-xs text-[#17cfcf] hover:underline pl-6 flex items-center gap-1"
                data-testid={`button-toggle-description-${request.id}`}
              >
                {showFullDescription ? 'Voir moins' : 'Plus de détails'}
              </button>
            )}
          </div>
        )}

        {/* Informations complémentaires */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {request.estimatedWeight && (
            <Badge variant="outline" className="text-xs">
              <Package className="w-3 h-3 mr-1" />
              {request.estimatedWeight}
            </Badge>
          )}
          
          {request.handlingRequired !== undefined && request.handlingRequired !== null && (
            <Badge variant="outline" className="text-xs">
              Manutention : {request.handlingRequired ? 'Oui' : 'Non'}
            </Badge>
          )}
          
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

        {/* Prix - Zone mise en avant */}
        {request.transporterPrice && (
          <div className="p-4 rounded-lg bg-gradient-to-br from-[#00ff88]/15 to-[#00cc88]/15 border-2 border-[#00ff88]/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Montant Fixé</span>
              <span className="text-2xl font-bold text-[#00ff88]">{request.transporterPrice.toLocaleString()} MAD</span>
            </div>
          </div>
        )}

        {request.budget && !request.transporterPrice && (
          <div className="p-4 rounded-lg bg-gradient-to-br from-[#00ff88]/15 to-[#00cc88]/15 border-2 border-[#00ff88]/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Budget</span>
              <span className="text-2xl font-bold text-[#00ff88]">{request.budget}</span>
            </div>
          </div>
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
        <CardFooter className="p-4 pt-0 grid grid-cols-2 gap-3">
          {/* New interest-based workflow */}
          {onExpressInterest && onWithdrawInterest ? (
            isInterested ? (
              <Button 
                onClick={handleWithdrawInterest} 
                disabled={isPendingInterest}
                className="col-span-2 h-12 font-semibold bg-gradient-to-r from-[#17cfcf] to-[#13b3b3] hover:from-[#17cfcf]/90 hover:to-[#13b3b3]/90 text-white border-0"
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
                    className="h-12 font-medium"
                    data-testid={`button-not-available-${request.id}`}
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    <span>Indisponible</span>
                  </Button>
                )}
                <Button 
                  onClick={handleExpressInterest} 
                  disabled={isPendingInterest}
                  className={`h-12 font-semibold bg-gradient-to-r from-[#17cfcf] to-[#13b3b3] hover:from-[#17cfcf]/90 hover:to-[#13b3b3]/90 text-white border-0 ${!onDecline ? 'col-span-2' : ''}`}
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
                  className="h-12"
                  data-testid={`button-decline-${request.id}`}
                >
                  <X className="w-4 h-4 mr-2" />
                  Décliner
                </Button>
              )}
              <Button 
                onClick={handleOfferClick} 
                className={`h-12 ${!onDecline ? 'col-span-2' : ''}`}
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
