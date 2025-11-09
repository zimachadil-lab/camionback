import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Package, Calendar, DollarSign, Image as ImageIcon, AlertCircle, Eye, FileText, X, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown } from "lucide-react";
import { format } from "date-fns";
import { fr, ar } from "date-fns/locale";
import { PhotoGalleryDialog } from "./photo-gallery-dialog";
import { DatePickerDialog } from "./date-picker-dialog";
import { getCategoryConfig } from "@/lib/goods-category-config";

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
  onExpressInterest?: (requestId: string, availabilityDate?: Date) => void;
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
  const { t, i18n } = useTranslation();
  const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [showValidationWarning, setShowValidationWarning] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const hasTrackedView = useRef(false);
  
  const dateTime = typeof request.dateTime === 'string' 
    ? new Date(request.dateTime) 
    : request.dateTime;

  // Use appropriate locale for date-fns based on current language
  const dateLocale = i18n.language === 'ar' ? ar : fr;

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
    } else {
      setDatePickerOpen(true);
    }
  };

  const handleDateConfirm = (date: Date) => {
    if (onExpressInterest) {
      onExpressInterest(request.id, date);
    }
    setDatePickerOpen(false);
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

  const categoryConfig = getCategoryConfig(request.goodsType, t);
  const CategoryIcon = categoryConfig.icon;

  return (
    <>
    <Card dir={i18n.dir()} className={`overflow-hidden hover-elevate border-2 ${categoryConfig.borderColor}`}>
      {/* En-tête coloré avec icône de catégorie */}
      <div className={`${categoryConfig.bgColor} p-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <div className="bg-white/20 rounded-md p-1.5 backdrop-blur-sm">
            <CategoryIcon className={`w-5 h-5 ${categoryConfig.color}`} />
          </div>
          <h3 className="font-semibold text-white text-base">{categoryConfig.label}</h3>
        </div>
        <Badge className="bg-slate-900/90 text-white border-0 font-mono text-xs" data-testid={`text-reference-${request.id}`}>
          {request.referenceId}
        </Badge>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Trajet avec badge Disponible aligné */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">{t('requestCard.route')}</span>
            </div>
            {/* Badge "Disponible" animé aligné avec Trajet */}
            <Badge 
              className="bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold px-3 py-1 shadow-lg animate-pulse border-0"
              data-testid={`badge-available-${request.id}`}
            >
              <span className="relative flex items-center gap-1.5">
                <span className="absolute -start-1 h-2 w-2 rounded-full bg-white opacity-75 animate-ping"></span>
                <span className="relative h-2 w-2 rounded-full bg-white"></span>
                {t('requestCard.available')}
              </span>
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-base font-semibold ps-6">
            <span className="truncate">{request.fromCity}</span>
            <span className="text-[#17cfcf] rtl:rotate-180">→</span>
            <span className="truncate">{request.toCity}</span>
          </div>
        </div>

        {/* Date de mission */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">{t('requestCard.availability')}</span>
          </div>
          <div className="ps-6 font-semibold">
            {format(dateTime, "dd MMMM yyyy", { locale: dateLocale })}
          </div>
        </div>

        {/* Services requis */}
        {request.description && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span className="font-medium">{t('requestCard.description')}</span>
            </div>
            <p className={`text-sm ps-6 ${showFullDescription ? '' : 'line-clamp-2'}`}>
              {request.description}
            </p>
            <div className="flex items-center gap-3 ps-6">
              {request.description.length > 100 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-xs text-[#17cfcf] hover:underline"
                  data-testid={`button-toggle-description-${request.id}`}
                >
                  {showFullDescription ? t('requestCard.seeLess') : t('requestCard.moreDetails')}
                </button>
              )}
              
              {request.photos && request.photos.length > 0 && (
                <Button
                  size="sm"
                  className="h-6 text-xs gap-1.5 bg-[#17cfcf]/20 hover:bg-[#17cfcf]/30 text-[#17cfcf] border border-[#17cfcf]/40 hover:border-[#17cfcf]/60 transition-all font-medium"
                  onClick={handleViewPhotos}
                  data-testid={`button-view-photos-${request.id}`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{request.photos.length} {request.photos.length > 1 ? t('requestCard.photosPlural') : t('requestCard.photos')}</span>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Poids si disponible */}
        {request.estimatedWeight && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Badge variant="outline" className="text-xs">
              <Package className="w-3 h-3 me-1" />
              {request.estimatedWeight}
            </Badge>
          </div>
        )}

        {/* Manutention détaillée */}
        {request.handlingRequired && (
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>🏋️</span>
              <span>{t('requestCard.handlingYes')}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 ps-6">
              {/* Départ */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>🏢</span>
                  <span className="font-medium">{t('requestCard.departureLocation')}</span>
                </div>
                <div className="text-sm">
                  {request.departureFloor !== undefined && request.departureFloor !== null ? (
                    <>
                      <div>{request.departureFloor === 0 ? t('requestCard.groundFloor') : t('requestCard.floor_ordinal', { floor: request.departureFloor })}</div>
                      <div className="text-xs text-muted-foreground">
                        {t('requestCard.elevator')} {request.departureElevator ? '✅' : '❌'}
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t('requestCard.notSpecified')}</span>
                  )}
                </div>
              </div>

              {/* Arrivée */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>🏠</span>
                  <span className="font-medium">{t('requestCard.arrivalLocation')}</span>
                </div>
                <div className="text-sm">
                  {request.arrivalFloor !== undefined && request.arrivalFloor !== null ? (
                    <>
                      <div>{request.arrivalFloor === 0 ? t('requestCard.groundFloor') : t('requestCard.floor_ordinal', { floor: request.arrivalFloor })}</div>
                      <div className="text-xs text-muted-foreground">
                        {t('requestCard.elevator')} {request.arrivalElevator ? '✅' : '❌'}
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t('requestCard.notSpecified')}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {request.handlingRequired === false && (
          <div className="pt-2 border-t">
            <Badge variant="outline" className="text-xs">
              {t('requestCard.handlingNo')}
            </Badge>
          </div>
        )}

        {/* Prix - Zone compacte */}
        {request.transporterPrice && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#00ff88]/10 via-[#00ff88]/5 to-transparent border-s-4 border-solid border-[#00ff88]">
            <div className="w-7 h-7 rounded-full bg-[#00ff88]/20 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 text-[#00ff88]" />
            </div>
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{t('requestCard.fixedAmount')}</span>
            <span className="text-lg font-bold text-[#00ff88] ms-auto">{Math.floor(request.transporterPrice).toLocaleString()} Dhs</span>
          </div>
        )}

        {request.budget && !request.transporterPrice && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#00ff88]/10 via-[#00ff88]/5 to-transparent border-s-4 border-solid border-[#00ff88]">
            <div className="w-7 h-7 rounded-full bg-[#00ff88]/20 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 text-[#00ff88]" />
            </div>
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{t('requestCard.budgetLabel')}</span>
            <span className="text-lg font-bold text-[#00ff88] ms-auto">{request.budget.replace('.00', '').replace('MAD', 'Dhs')}</span>
          </div>
        )}

        {showValidationWarning && !isUserValidated && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('requestCard.validationWarning')}
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
                className="col-span-2 h-12 font-semibold bg-gradient-to-r from-[#17cfcf] to-[#13b3b3] hover:from-[#17cfcf]/90 hover:to-[#13b3b3]/90 text-white border-0 shadow-md hover:shadow-lg transition-shadow"
                data-testid={`button-withdraw-interest-${request.id}`}
              >
                <ThumbsUp className="w-5 h-5 me-2" />
                {isPendingInterest ? t('requestCard.withdrawing') : t('requestCard.interested_action')}
              </Button>
            ) : (
              <>
                {onDecline && (
                  <Button 
                    onClick={() => onDecline(request.id)} 
                    disabled={isPendingInterest}
                    className="h-12 font-medium bg-muted/50 hover:bg-muted border-2 border-border hover:border-muted-foreground/30 transition-all"
                    data-testid={`button-not-available-${request.id}`}
                  >
                    <ThumbsDown className="w-5 h-5 me-2" />
                    <span>{t('requestCard.notAvailable')}</span>
                  </Button>
                )}
                <Button 
                  onClick={handleExpressInterest} 
                  disabled={isPendingInterest}
                  className={`h-12 font-semibold bg-gradient-to-r from-[#17cfcf] to-[#13b3b3] hover:from-[#17cfcf]/90 hover:to-[#13b3b3]/90 text-white border-0 shadow-md hover:shadow-lg transition-shadow ${!onDecline ? 'col-span-2' : ''}`}
                  data-testid={`button-express-interest-${request.id}`}
                >
                  <ThumbsUp className="w-5 h-5 me-2" />
                  <span>{isPendingInterest ? t('requestCard.sending') : t('requestCard.interested_action')}</span>
                </Button>
              </>
            )
          ) : (
            /* Old offer-based workflow (backward compatibility) */
            <>
              {onDecline && (
                <Button 
                  onClick={() => onDecline(request.id)} 
                  className="h-12 font-medium bg-muted/50 hover:bg-muted border-2 border-border hover:border-muted-foreground/30"
                  data-testid={`button-decline-${request.id}`}
                >
                  <X className="w-5 h-5 me-2" />
                  Décliner
                </Button>
              )}
              <Button 
                onClick={handleOfferClick} 
                className={`h-12 font-semibold bg-gradient-to-r from-[#17cfcf] to-[#13b3b3] hover:from-[#17cfcf]/90 hover:to-[#13b3b3]/90 text-white border-0 shadow-md hover:shadow-lg ${!onDecline ? 'col-span-2' : ''}`}
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

    <DatePickerDialog
      open={datePickerOpen}
      onOpenChange={setDatePickerOpen}
      onConfirm={handleDateConfirm}
      requestDate={dateTime}
      isPending={isPendingInterest}
    />
    </>
  );
}
