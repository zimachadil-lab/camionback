import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Package, DollarSign, Image as ImageIcon, AlertCircle, Eye, FileText, X, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, ArrowRight, Camera, Warehouse, Building2, Home, Calendar, Hash } from "lucide-react";
import { format } from "date-fns";
import { fr, ar } from "date-fns/locale";
import { PhotoGalleryDialog } from "./photo-gallery-dialog";
import { DatePickerDialog } from "./date-picker-dialog";
import { getCategoryConfig } from "@/lib/goods-category-config";
import { RouteMap } from "@/components/route-map";

interface RequestCardProps {
  request: {
    id: string;
    referenceId: string;
    clientName?: string;
    fromCity: string;
    toCity: string;
    departureAddress?: string;
    arrivalAddress?: string;
    distance?: number | null;
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

  const categoryConfig = getCategoryConfig(request.goodsType);
  const CategoryIcon = categoryConfig.icon;

  return (
    <>
    <Card dir={i18n.dir()} className={`overflow-hidden hover-elevate border-2 ${categoryConfig.borderColor}`}>
      {/* En-tête coloré avec icône de catégorie */}
      <div className={`${categoryConfig.bgColor} p-2.5 flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-2">
          <div className="bg-white/20 rounded-md px-3.5 py-1.5 backdrop-blur-sm shadow-md border border-white/20">
            <CategoryIcon className={`w-4 h-4 ${categoryConfig.color}`} />
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-1 justify-end pr-1">
          {/* Date de disponibilité avec animation verte intense */}
          <div className="relative bg-gradient-to-r from-green-500 to-green-600 px-3.5 py-1.5 rounded-md shadow-md" data-testid={`text-availability-date-${request.id}`}>
            {/* Animation ping externe */}
            <span className="absolute -inset-0.5 bg-green-400 rounded-md opacity-60 animate-ping"></span>
            {/* Animation pulse interne */}
            <span className="absolute inset-0 bg-green-300 rounded-md opacity-40 animate-pulse"></span>
            {/* Effet de brillance */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-md animate-pulse"></span>
            <div className="relative flex items-center gap-1">
              <Calendar className="w-3 h-3 text-white drop-shadow-sm" />
              <span className="text-[10px] font-bold text-white drop-shadow-sm whitespace-nowrap">
                {format(dateTime, "dd MMM yyyy", { locale: dateLocale })}
              </span>
            </div>
          </div>
          {/* Numéro de commande modernisé */}
          <div className="bg-gradient-to-r from-[#17cfcf] to-[#13b3b3] px-3.5 py-1.5 rounded-md shadow-md border border-white/20" data-testid={`text-reference-${request.id}`}>
            <div className="flex items-center gap-1">
              <Hash className="w-3 h-3 text-white drop-shadow-sm" />
              <span className="text-[10px] font-bold text-white drop-shadow-sm whitespace-nowrap">
                {(() => {
                  const parts = request.referenceId.split('-');
                  return parts.length >= 3 ? `${parts[0]}-${parts[2]}` : request.referenceId;
                })()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Carte de trajet avec distance - Style client */}
        {request.fromCity && request.toCity && (
          <div className="space-y-2">
            {request.distance && request.departureAddress && request.arrivalAddress && (
              <RouteMap
                departureCity={request.fromCity}
                arrivalCity={request.toCity}
                departureAddress={request.departureAddress}
                arrivalAddress={request.arrivalAddress}
                distance={request.distance}
                variant="compact"
              />
            )}
            
            {/* Ligne compacte récapitulative */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/20 rounded-md">
              <div className="flex items-center gap-2 flex-1 min-w-0 text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#5BC0EB] flex-shrink-0"></div>
                  <span className="font-medium truncate">{request.fromCity}</span>
                </div>
                <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#e74c3c] flex-shrink-0"></div>
                  <span className="font-medium truncate">{request.toCity}</span>
                </div>
              </div>
              {request.distance && (
                <div className="flex-shrink-0 px-2 py-0.5 bg-[#5BC0EB]/20 rounded border border-[#5BC0EB]/40">
                  <span className="text-xs font-bold text-[#5BC0EB]">{request.distance} km</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Description - Style modernisé avec icône de catégorie */}
        {request.description && (
          <div className="space-y-2.5">
            <div className="relative overflow-hidden rounded-xl border-2 border-border/40 bg-gradient-to-br from-background via-muted/30 to-muted/50 shadow-sm">
              {/* Icône de catégorie avec fond coloré */}
              <div className="absolute left-3 top-3">
                <div className={`w-8 h-8 rounded-lg ${categoryConfig.bgColor} flex items-center justify-center shadow-md`}>
                  <CategoryIcon className="w-4 h-4 text-white" />
                </div>
              </div>
              
              {/* Contenu de la description */}
              <div className="pl-14 pr-4 py-3">
                <p 
                  className={`text-sm leading-relaxed text-foreground ${showFullDescription ? '' : 'line-clamp-2'}`}
                >
                  <span className="font-bold text-primary">{categoryConfig.label}:</span>{' '}
                  <span className="text-muted-foreground">{request.description}</span>
                </p>
              </div>
            </div>
            
            {/* Actions sous la description */}
            <div className="flex items-center gap-3 px-1">
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-xs text-[#17cfcf] hover:text-[#13b3b3] font-semibold transition-colors flex items-center gap-1"
                data-testid={`button-toggle-description-${request.id}`}
              >
                {showFullDescription ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    <span>{t('requestCard.seeLess')}</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    <span>{t('requestCard.moreDetails')}</span>
                  </>
                )}
              </button>
              
              {request.photos && request.photos.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleViewPhotos}
                  data-testid={`button-view-photos-${request.id}`}
                  className="h-7 px-2.5 gap-1.5 text-[#3498db] hover:text-[#2980b9]"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">{request.photos.length} {t('requestCard.photos')}</span>
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

        {/* Section manutention - visible seulement quand "Plus de détails" est ouvert */}
        {showFullDescription && (
          <>
            {/* Manutention détaillée */}
            {request.handlingRequired && (
              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Warehouse className="w-4 h-4 text-primary" />
                  <span>{t('requestCard.handlingYes')}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 ps-6">
                  {/* Départ */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="w-3.5 h-3.5" />
                      <span className="font-medium">{t('requestCard.departureLocation')}</span>
                    </div>
                    <div className="text-sm">
                      {request.departureFloor !== undefined && request.departureFloor !== null ? (
                        <>
                          <div>{request.departureFloor === 0 ? t('requestCard.groundFloor') : t('requestCard.floor_ordinal', { floor: request.departureFloor })}</div>
                          <div className="text-xs text-muted-foreground">
                            {t('requestCard.elevator')}: <Badge variant={request.departureElevator ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">{request.departureElevator ? 'Oui' : 'Non'}</Badge>
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
                      <Home className="w-3.5 h-3.5" />
                      <span className="font-medium">{t('requestCard.arrivalLocation')}</span>
                    </div>
                    <div className="text-sm">
                      {request.arrivalFloor !== undefined && request.arrivalFloor !== null ? (
                        <>
                          <div>{request.arrivalFloor === 0 ? t('requestCard.groundFloor') : t('requestCard.floor_ordinal', { floor: request.arrivalFloor })}</div>
                          <div className="text-xs text-muted-foreground">
                            {t('requestCard.elevator')}: <Badge variant={request.arrivalElevator ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">{request.arrivalElevator ? 'Oui' : 'Non'}</Badge>
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
              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Warehouse className="w-4 h-4 text-primary" />
                  <span>{t('requestCard.handlingNo')}</span>
                </div>
              </div>
            )}
          </>
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
        <CardFooter className="p-4 pt-0 flex flex-col gap-2.5">
          {/* New interest-based workflow */}
          {onExpressInterest && onWithdrawInterest ? (
            isInterested ? (
              <Button 
                onClick={handleWithdrawInterest} 
                disabled={isPendingInterest}
                className="w-full gap-3 h-14 border-2 border-emerald-500 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-md transition-all duration-300"
                data-testid={`button-withdraw-interest-${request.id}`}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <ThumbsUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold leading-tight">
                      {isPendingInterest ? t('requestCard.withdrawing') : t('requestCard.interested_action')}
                    </p>
                    <p className="text-xs text-white/80">
                      Cliquer pour retirer l'intérêt
                    </p>
                  </div>
                </div>
              </Button>
            ) : (
              <>
                <Button 
                  onClick={handleExpressInterest} 
                  disabled={isPendingInterest}
                  className="w-full gap-3 h-14 border-2 border-[#17cfcf] bg-gradient-to-r from-[#17cfcf] to-[#13b3b3] text-white font-semibold shadow-md transition-all duration-300"
                  data-testid={`button-express-interest-${request.id}`}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <ThumbsUp className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold leading-tight">
                        {isPendingInterest ? t('requestCard.sending') : t('requestCard.interested_action')}
                      </p>
                      <p className="text-xs text-white/80">
                        Déclarer votre disponibilité
                      </p>
                    </div>
                  </div>
                </Button>
                {onDecline && (
                  <Button 
                    onClick={() => onDecline(request.id)} 
                    disabled={isPendingInterest}
                    variant="outline"
                    className="w-full h-11 font-medium border-2 border-destructive/40 text-destructive transition-all"
                    data-testid={`button-not-available-${request.id}`}
                  >
                    <ThumbsDown className="w-4 h-4 me-2" />
                    <span>{t('requestCard.notAvailable')}</span>
                  </Button>
                )}
              </>
            )
          ) : (
            /* Old offer-based workflow (backward compatibility) */
            <>
              <Button 
                onClick={handleOfferClick} 
                className="w-full gap-3 h-14 border-2 border-[#17cfcf] bg-gradient-to-r from-[#17cfcf] to-[#13b3b3] text-white font-semibold shadow-md transition-all duration-300"
                variant={!isUserValidated ? "secondary" : "default"}
                data-testid={`button-make-offer-${request.id}`}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold leading-tight">
                      Faire une offre
                    </p>
                    <p className="text-xs text-white/80">
                      Proposer un prix
                    </p>
                  </div>
                </div>
              </Button>
              {onDecline && (
                <Button 
                  onClick={() => onDecline(request.id)} 
                  variant="outline"
                  className="w-full h-11 font-medium border-2 border-destructive/40 text-destructive transition-all"
                  data-testid={`button-decline-${request.id}`}
                >
                  <X className="w-4 h-4 me-2" />
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
