import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Phone, CheckCircle, Trash2, Info, RotateCcw, Star, CreditCard, Upload, Eye, Edit, MessageSquare, Calendar, Flag, Truck, Users, Zap, X, ChevronLeft, ChevronRight, Target, ArrowDown, Camera, Home, Sofa, Boxes, Wrench, ShoppingCart, LucideIcon, DollarSign, ImageIcon, Plus } from "lucide-react";
import { getCategoryConfig } from "@/lib/goods-category-config";
import { Header } from "@/components/layout/header";
import { NewRequestForm } from "@/components/client/new-request-form";
import { OfferCard } from "@/components/client/offer-card";
import { ChatWindow } from "@/components/chat/chat-window";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { LoadingTruck } from "@/components/ui/loading-truck";
import { StoriesBar } from "@/components/ui/stories-bar";
import { MetaPixelEvents } from "@/lib/meta-pixel";
import { RouteMap } from "@/components/route-map";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useMemo } from "react";

// Zod schema helpers with i18n
const createEditRequestSchema = (t: any) => z.object({
  fromCity: z.string().min(2, t('clientDashboard.validation.fromCityRequired')),
  toCity: z.string().min(2, t('clientDashboard.validation.toCityRequired')),
  description: z.string().min(10, t('clientDashboard.validation.descriptionMin')),
  goodsType: z.string().min(1, t('clientDashboard.validation.goodsTypeRequired')),
  dateTime: z.string().optional(),
  budget: z.string().optional(),
  handlingRequired: z.boolean().default(false),
  departureFloor: z.number().nullable().optional(),
  departureElevator: z.boolean().nullable().optional(),
  arrivalFloor: z.number().nullable().optional(),
  arrivalElevator: z.boolean().nullable().optional(),
}).refine((data) => {
  if (data.handlingRequired) {
    return data.departureFloor !== null && data.departureFloor !== undefined &&
           data.arrivalFloor !== null && data.arrivalFloor !== undefined &&
           data.departureElevator !== null && data.departureElevator !== undefined &&
           data.arrivalElevator !== null && data.arrivalElevator !== undefined;
  }
  return true;
}, {
  message: t('clientDashboard.validation.handlingFieldsRequired'),
  path: ["handlingRequired"],
});

const createReportSchema = (t: any) => z.object({
  description: z.string().min(10, t('clientDashboard.validation.reportDescriptionMin')),
  type: z.string().min(1, t('clientDashboard.validation.reportTypeRequired')),
});

// Helper function to get client-friendly status with color
function getClientStatus(request: any, interestedCount: number = 0, t: any) {
  // 11. Commande terminée - Paiement validé
  if (request.paymentStatus === "paid" || request.paymentStatus === "pending_admin_validation") {
    return {
      text: t('clientDashboard.status.orderCompleted'),
      variant: "default" as const,
      icon: CheckCircle,
    };
  }

  // 10. En attente de confirmation paiement - Livraison confirmée
  if (request.paymentStatus === "awaiting_payment") {
    return {
      text: t('clientDashboard.status.awaitingPaymentConfirmation'),
      variant: "secondary" as const,
      icon: CreditCard,
    };
  }

  // 9. Livraison effectuée - Marquage "Livré"
  if (request.status === "completed") {
    return {
      text: t('clientDashboard.status.deliveryCompleted'),
      variant: "default" as const,
      icon: CheckCircle,
    };
  }

  // 8. Livraison en cours - Transporteur marque "Pris en charge"
  if (request.status === "in_progress") {
    return {
      text: t('clientDashboard.status.deliveryInProgress'),
      variant: "default" as const,
      icon: Truck,
    };
  }

  // 7. Offre confirmée - Si client valide un transporteur
  if (request.status === "accepted" && request.acceptedOfferId) {
    return {
      text: t('clientDashboard.status.offerConfirmed'),
      variant: "default" as const,
      icon: CheckCircle,
    };
  }

  // 6. Transporteur assigné manuellement - Coordinateur
  if (request.assignedTransporterId && !request.acceptedOfferId) {
    return {
      text: t('clientDashboard.status.transporterAssigned'),
      variant: "default" as const,
      icon: Truck,
    };
  }

  // 5. En sélection Transporteur - Tant qu'aucune offre n'a été choisie
  if (interestedCount > 0 && !request.acceptedOfferId && !request.assignedTransporterId) {
    return {
      text: t('clientDashboard.status.chooseTransporter'),
      variant: "outline" as const,
      icon: Users,
    };
  }

  // 4. Transporteurs intéressés - Si ≥ 1 intéressé
  if (request.status === "published_for_matching" && interestedCount > 0) {
    return {
      text: t('clientDashboard.status.offersReceived'),
      variant: "outline" as const,
      icon: Truck,
    };
  }

  // 3. Publication aux transporteurs - Publication matching enclenchée
  if (request.status === "published_for_matching") {
    return {
      text: t('clientDashboard.status.waitingForOffers'),
      variant: "secondary" as const,
      icon: Package,
    };
  }

  // 2. Prix vérifié / infos validées - Coordinateur valide détail + prix
  if (request.qualifiedAt && request.status !== "published_for_matching") {
    return {
      text: t('clientDashboard.status.requestFinalization'),
      variant: "secondary" as const,
      icon: Info,
    };
  }

  // 1. Création commande - Dès création (default)
  return {
    text: t('clientDashboard.status.logisticsQualification'),
    variant: "secondary" as const,
    icon: RotateCcw,
  };
}

function RequestWithOffers({ request, onAcceptOffer, onDeclineOffer, onChat, onDelete, onViewTransporter, onUpdateStatus, onReport, onChooseTransporter, onOpenPhotosDialog, users, cities, citiesLoading, currentUserId }: any) {
  const { t } = useTranslation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showOffersDialog, setShowOffersDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCamioMatchDialog, setShowCamioMatchDialog] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [editPhotos, setEditPhotos] = useState<File[]>([]);
  const [editedExistingPhotos, setEditedExistingPhotos] = useState<string[]>([]);
  const isAccepted = request.status === "accepted";
  const hasTransporter = isAccepted || !!request.assignedTransporterId;
  const { toast } = useToast();
  
  // Create goodsTypes array using translations
  const goodsTypes = [
    t('shared.goodsTypes.furniture'),
    t('shared.goodsTypes.appliances'),
    t('shared.goodsTypes.goods'),
    t('shared.goodsTypes.moving'),
    t('shared.goodsTypes.construction'),
    t('shared.goodsTypes.parcels'),
    t('shared.goodsTypes.vehicle'),
    t('shared.goodsTypes.other')
  ];
  
  // Create schemas with useMemo
  const editRequestSchema = useMemo(() => createEditRequestSchema(t), [t]);
  const reportSchema = useMemo(() => createReportSchema(t), [t]);

  const { data: offers = [] } = useQuery({
    queryKey: ["/api/offers", request.id],
    queryFn: async () => {
      const response = await fetch(`/api/offers?requestId=${request.id}`);
      return response.json();
    },
  });

  // Fetch interested transporters ONLY when dialog is opened (lazy loading for better performance)
  const { data: interestedTransporters = [], refetch: refetchInterestedTransporters } = useQuery({
    queryKey: ["/api/requests", request.id, "interested-transporters"],
    queryFn: async () => {
      const response = await fetch(`/api/requests/${request.id}/interested-transporters`);
      return response.json();
    },
    enabled: false, // Disabled by default - only fetch when needed (dialog opens)
  });

  const offersWithTransporters = offers.map((offer: any) => {
    // Use transporter data from offer if available (new API format)
    // Otherwise fall back to users array for backward compatibility
    const transporterData = offer.transporter || users.find((u: any) => u.id === offer.transporterId);
    return {
      ...offer,
      transporterName: transporterData?.name || "Transporteur",
      rating: parseFloat(transporterData?.rating || "0"),
      totalTrips: transporterData?.totalTrips || 0,
      truckPhoto: transporterData?.truckPhotos?.[0] || offer.truckPhoto,
    };
  });

  // Determine which workflow to use
  const isQualifiedWorkflow = !!request.qualifiedAt;
  
  // OPTIMISATION: Utiliser le count pré-calculé du backend pour éviter une requête API
  // Au lieu de charger tous les transporteurs intéressés, on utilise juste le nombre
  const displayCount = isQualifiedWorkflow 
    ? (request.interestedTransportersCount ?? 0) 
    : offersWithTransporters.length;

  // Get client-friendly status
  const clientStatus = getClientStatus(request, displayCount, t);
  const StatusIcon = clientStatus.icon;

  const createdAt = request.createdAt 
    ? (typeof request.createdAt === 'string' ? new Date(request.createdAt) : request.createdAt)
    : null;

  // Get category config for colored border
  const categoryConfig = getCategoryConfig(request.goodsType, t);

  // Format datetime for input
  const formatDateTimeForInput = (dateStr: string | Date | null) => {
    if (!dateStr) return "";
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const editForm = useForm({
    resolver: zodResolver(editRequestSchema),
    defaultValues: {
      fromCity: request.fromCity || "",
      toCity: request.toCity || "",
      description: request.description || "",
      goodsType: request.goodsType || "",
      dateTime: formatDateTimeForInput(request.dateTime),
      budget: request.budget || "",
      handlingRequired: request.handlingRequired || false,
      departureFloor: request.departureFloor ?? null,
      departureElevator: request.departureElevator ?? null,
      arrivalFloor: request.arrivalFloor ?? null,
      arrivalElevator: request.arrivalElevator ?? null,
    },
  });

  // Reset form with latest request data when dialog opens or request changes
  useEffect(() => {
    if (showEditDialog) {
      editForm.reset({
        fromCity: request.fromCity || "",
        toCity: request.toCity || "",
        description: request.description || "",
        goodsType: request.goodsType || "",
        dateTime: formatDateTimeForInput(request.dateTime),
        budget: request.budget || "",
        handlingRequired: request.handlingRequired || false,
        departureFloor: request.departureFloor ?? null,
        departureElevator: request.departureElevator ?? null,
        arrivalFloor: request.arrivalFloor ?? null,
        arrivalElevator: request.arrivalElevator ?? null,
      });
      // Reset photos state - keep existing photos by default
      setEditPhotos([]);
      setEditedExistingPhotos(request.photos || []);
    }
  }, [showEditDialog, request, editForm]);

  const editRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/requests/${request.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: t('clientDashboard.toast.requestEdited'),
        description: t('clientDashboard.toast.requestEditedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      setShowEditDialog(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: t('clientDashboard.toast.editError'),
        description: t('clientDashboard.toast.editErrorDesc'),
      });
    },
  });

  // Convert file to base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Handle photo upload - adds to existing photos
  const handleEditPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setEditPhotos(Array.from(e.target.files));
    }
  };

  // Remove a single existing photo
  const removeExistingPhoto = (index: number) => {
    setEditedExistingPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmitEdit = async (data: any) => {
    const payload: any = {
      fromCity: data.fromCity,
      toCity: data.toCity,
      description: data.description,
      goodsType: data.goodsType,
      handlingRequired: data.handlingRequired,
      departureFloor: data.departureFloor,
      departureElevator: data.departureElevator,
      arrivalFloor: data.arrivalFloor,
      arrivalElevator: data.arrivalElevator,
    };
    
    if (data.dateTime) {
      payload.dateTime = new Date(data.dateTime).toISOString();
    }
    
    if (data.budget) {
      payload.budget = data.budget;
    }
    
    // Handle photos - merge existing photos with new uploads
    const finalPhotos: string[] = [];
    
    // Add retained existing photos
    if (editedExistingPhotos.length > 0) {
      finalPhotos.push(...editedExistingPhotos);
    }
    
    // Add new photos (convert to base64)
    if (editPhotos.length > 0) {
      const photoBase64Promises = editPhotos.map(photo => convertToBase64(photo));
      const photoBase64Array = await Promise.all(photoBase64Promises);
      finalPhotos.push(...photoBase64Array);
    }
    
    payload.photos = finalPhotos;
    
    editRequestMutation.mutate(payload);
  };

  // CamioMatch query
  const { data: matches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ["/api/recommendations", request.id],
    queryFn: async () => {
      const response = await fetch(`/api/recommendations/${request.id}`);
      return response.json();
    },
    enabled: showCamioMatchDialog,
  });

  // Reset current match index when dialog opens
  useEffect(() => {
    if (showCamioMatchDialog) {
      setCurrentMatchIndex(0);
    }
  }, [showCamioMatchDialog]);

  // Contact transporter mutation
  const contactTransporterMutation = useMutation({
    mutationFn: async (transporterId: string) => {
      return await apiRequest("POST", "/api/client-transporter-contacts", {
        requestId: request.id,
        clientId: currentUserId,
        transporterId,
      });
    },
    onSuccess: () => {
      toast({
        title: t('clientDashboard.toast.contactSaved'),
        description: t('clientDashboard.toast.contactSavedDesc'),
      });
    },
  });

  // Function to handle WhatsApp redirect
  const handleWhatsAppContact = () => {
    const phoneNumber = "+212664373534";
    const message = encodeURIComponent(
      `Bonjour, j'ai besoin d'aide pour ma commande ${request.referenceId} (${request.fromCity} → ${request.toCity}). Pouvez-vous m'assister ?`
    );
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\+/g, "")}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <>
      <Card className={`overflow-hidden hover-elevate bg-[#0f324f]/30 border-2 ${categoryConfig.borderColor}`}>
        <CardContent className="p-4 space-y-3">
          {/* Header avec référence et actions */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold" data-testid={`text-reference-${request.id}`}>
              {request.referenceId}
            </h3>
            <div className="flex items-center gap-2">
              {!isAccepted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowEditDialog(true)}
                  data-testid={`button-edit-${request.id}`}
                  className="h-8 w-8 text-[#1abc9c] hover:text-[#1abc9c] hover:bg-[#1abc9c]/10"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {request.photos && request.photos.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenPhotosDialog(request.photos)}
                  data-testid={`button-view-photos-${request.id}`}
                  className="h-8 px-2 gap-1.5 text-[#3498db] hover:text-[#3498db] hover:bg-[#3498db]/10"
                >
                  <Camera className="h-4 w-4" />
                  <span className="text-xs font-medium">{request.photos.length}</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
                data-testid={`button-delete-${request.id}`}
                className="h-8 w-8 text-[#e74c3c] hover:text-[#e74c3c] hover:bg-[#e74c3c]/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Carte de trajet avec distance */}
          {request.fromCity && request.toCity && (
            <div className="mt-2">
              <RouteMap
                departureCity={request.fromCity}
                arrivalCity={request.toCity}
                departureAddress={request.departureAddress}
                arrivalAddress={request.arrivalAddress}
                distance={request.distance}
              />
            </div>
          )}

          {/* Statut logistique visible */}
          <div className="relative flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-[#1abc9c]/20 via-[#16a085]/15 to-[#1abc9c]/20 rounded-lg border-2 border-[#1abc9c]/40 shadow-sm">
            <div className="relative">
              <div className="absolute inset-0 bg-[#1abc9c]/30 rounded-full animate-ping"></div>
              <div className="relative w-8 h-8 rounded-full bg-[#1abc9c]/20 flex items-center justify-center border-2 border-[#1abc9c]/50">
                <StatusIcon className="w-4 h-4 text-[#1abc9c] animate-pulse" />
              </div>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {clientStatus.text}
            </span>
          </div>

          {/* Infos compactes: Vues et Date */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {request.viewCount !== undefined && (
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {request.viewCount} vue{request.viewCount > 1 ? 's' : ''}
              </span>
            )}
            {createdAt && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Créée le {format(createdAt, "d MMM yyyy", { locale: fr })}
              </span>
            )}
          </div>

          {/* Description */}
          {request.description && (
            <div className="text-sm">
              <p className="text-muted-foreground text-xs mb-1">Description :</p>
              <p className="line-clamp-2">{request.description}</p>
            </div>
          )}

          {/* Manutention détaillée */}
          {request.handlingRequired !== undefined && request.handlingRequired !== null && (
            <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span>🏋️</span>
                <span>{t('clientDashboard.labels.handling')} : {request.handlingRequired ? t('shared.labels.yes') : t('shared.labels.no')}</span>
              </div>
              {request.handlingRequired && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  {/* Départ */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>🏢</span>
                      <span className="font-medium">Départ</span>
                    </div>
                    <div className="text-sm">
                      {request.departureFloor !== undefined && request.departureFloor !== null ? (
                        <>
                          <div>{request.departureFloor === 0 ? 'RDC' : `${request.departureFloor}ᵉ étage`}</div>
                          <div className="text-xs text-muted-foreground">
                            Ascenseur {request.departureElevator ? '✅' : '❌'}
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">Non spécifié</span>
                      )}
                    </div>
                  </div>

                  {/* Arrivée */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>🏠</span>
                      <span className="font-medium">Arrivée</span>
                    </div>
                    <div className="text-sm">
                      {request.arrivalFloor !== undefined && request.arrivalFloor !== null ? (
                        <>
                          <div>{request.arrivalFloor === 0 ? 'RDC' : `${request.arrivalFloor}ᵉ étage`}</div>
                          <div className="text-xs text-muted-foreground">
                            Ascenseur {request.arrivalElevator ? '✅' : '❌'}
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">Non spécifié</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Prix qualifié */}
          {request.clientTotal && request.qualifiedAt && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#00ff88]/10 via-[#00ff88]/5 to-transparent border-l-4 border-[#00ff88]">
                <div className="w-7 h-7 rounded-full bg-[#00ff88]/20 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-4 h-4 text-[#00ff88]" />
                </div>
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Prix Qualifié</span>
                <span className="text-lg font-bold text-[#00ff88] ml-auto">{Math.floor(request.clientTotal).toLocaleString()} Dhs</span>
              </div>
              <p className="text-xs text-muted-foreground px-1">
                Qualifié le {format(new Date(request.qualifiedAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
              </p>
            </div>
          )}

          {/* Bouton Offres reçues / Transporteurs intéressés */}
          {!isAccepted && (
            <div className="relative">
              <Button
                variant="outline"
                className="w-full gap-2 sm:gap-3 h-auto sm:h-14 py-3 sm:py-0 border-2 border-blue-500 bg-gradient-to-r from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 text-foreground font-semibold shadow-md hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
                onClick={() => {
                  setShowOffersDialog(true);
                  // Charger les transporteurs intéressés seulement quand le dialog s'ouvre
                  if (isQualifiedWorkflow) {
                    refetchInterestedTransporters();
                  }
                }}
                data-testid={`button-view-offers-${request.id}`}
              >
                <div className="flex items-center gap-2 sm:gap-3 w-full">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-xs sm:text-sm font-semibold leading-tight truncate">
                      {isQualifiedWorkflow ? t('clientDashboard.actions.interested') : t('clientDashboard.actions.offersReceived')}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      Voir {displayCount > 1 ? 'les' : 'la'} {displayCount} {displayCount > 1 ? 'propositions' : 'proposition'}
                    </p>
                  </div>
                  <Badge 
                    variant="default" 
                    className="text-base sm:text-lg font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 bg-blue-500 hover:bg-blue-500 flex-shrink-0"
                  >
                    {displayCount}
                  </Badge>
                </div>
              </Button>
            </div>
          )}

          {/* Nouveaux boutons: CamioMatch et Coordinateur */}
          {!hasTransporter && (
            <div className="flex flex-wrap gap-2.5">
              {/* CamioMatch - Masqué pour raisons stratégiques, gardé en système */}
              {false && (
                <Button
                  onClick={() => setShowCamioMatchDialog(true)}
                  data-testid={`button-camiomatch-${request.id}`}
                  className="flex-1 min-w-[135px] gap-2 rounded-xl font-semibold text-white bg-gradient-to-br from-[#17cfcf] to-[#13b3b3] border-0 shadow-md hover:shadow-lg hover:shadow-[#17cfcf]/30 transition-shadow duration-300 hover-elevate"
                >
                  <Zap className="w-5 h-5" />
                  CamioMatch
                </Button>
              )}
              <Button
                onClick={handleWhatsAppContact}
                data-testid={`button-coordinator-${request.id}`}
                className="w-full gap-2 rounded-xl font-semibold text-white bg-gradient-to-br from-[#17cfcf] to-[#13b3b3] border-0 shadow-md hover:shadow-lg hover:shadow-[#17cfcf]/25 transition-shadow duration-300 hover-elevate"
              >
                <Phone className="w-5 h-5" />
                Coordinateur
              </Button>
            </div>
          )}

          {/* Actions pour commande avec transporteur (acceptée ou assignée) */}
          {hasTransporter && (
            <div className="flex flex-col gap-3 pt-3">
              {/* Bouton principal: Message */}
              <Button
                onClick={() => {
                  // Handle manual assignment
                  if (request.assignedTransporterId && request.transporter) {
                    onChat(request.transporter.id, request.transporter.name || 'Transporteur', request.id);
                  } else {
                    // Handle accepted offer
                    const acceptedOffer = offersWithTransporters.find((o: any) => o.id === request.acceptedOfferId);
                    if (acceptedOffer) {
                      onChat(acceptedOffer.transporterId, acceptedOffer.transporterName || 'Transporteur', request.id);
                    }
                  }
                }}
                data-testid={`button-chat-active-${request.id}`}
                className="w-full gap-2 h-12 text-base font-semibold bg-[#00cc88] hover:bg-[#00cc88]/90 border-[#00cc88]"
                style={{ textShadow: "0 1px 1px rgba(0,0,0,0.2)" }}
              >
                <MessageSquare className="h-5 w-5" />
                Envoyer un message
              </Button>

              {/* Boutons secondaires */}
              <div className="grid grid-cols-2 gap-2">
                {/* Menu Contact */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      data-testid={`button-contact-menu-${request.id}`}
                      className="gap-2 h-11 text-base"
                    >
                      <Phone className="h-5 w-5" />
                      Contacter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem
                      onClick={() => onViewTransporter(request.id)}
                      data-testid={`button-view-transporter-${request.id}`}
                      className="gap-2 py-3"
                    >
                      <Info className="h-4 w-4" />
                      Voir les informations
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        let phone = "";
                        // Handle manual assignment
                        if (request.assignedTransporterId && request.transporter) {
                          phone = request.transporter.phoneNumber;
                        } else {
                          // Handle accepted offer
                          const acceptedOffer = offersWithTransporters.find((o: any) => o.id === request.acceptedOfferId);
                          if (acceptedOffer && acceptedOffer.transporter) {
                            phone = acceptedOffer.transporter.phoneNumber;
                          }
                        }
                        if (phone) {
                          window.location.href = `tel:${phone}`;
                        }
                      }}
                      data-testid={`button-call-transporter-${request.id}`}
                      className="gap-2 py-3"
                    >
                      <Phone className="h-4 w-4" />
                      Appeler le transporteur
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        let phone = "";
                        let refId = request.referenceId;
                        // Handle manual assignment
                        if (request.assignedTransporterId && request.transporter) {
                          phone = request.transporter.phoneNumber;
                        } else {
                          // Handle accepted offer
                          const acceptedOffer = offersWithTransporters.find((o: any) => o.id === request.acceptedOfferId);
                          if (acceptedOffer && acceptedOffer.transporter) {
                            phone = acceptedOffer.transporter.phoneNumber;
                          }
                        }
                        if (phone) {
                          const message = encodeURIComponent(`Bonjour, concernant la commande ${refId} (${request.fromCity} → ${request.toCity})`);
                          window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
                        }
                      }}
                      data-testid={`button-whatsapp-transporter-${request.id}`}
                      className="gap-2 py-3"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Contacter par WhatsApp
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Menu Plus d'actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      data-testid={`button-more-actions-${request.id}`}
                      className="gap-2 h-11 text-base"
                    >
                      <RotateCcw className="h-5 w-5" />
                      Plus d'actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      onClick={() => onUpdateStatus(request.id, "completed")}
                      data-testid={`button-complete-${request.id}`}
                      className="gap-2 py-3"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Marquer comme terminée
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onUpdateStatus(request.id, "republish")}
                      data-testid={`button-republish-${request.id}`}
                      className="gap-2 py-3"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Republier la demande
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onReport(request.id)}
                      data-testid={`button-report-active-${request.id}`}
                      className="gap-2 py-3 text-destructive focus:text-destructive"
                    >
                      <Flag className="h-4 w-4" />
                      Signaler un problème
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog des offres / transporteurs intéressés */}
      <Dialog open={showOffersDialog} onOpenChange={setShowOffersDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="space-y-3 pb-4">
            {/* Titre avec badge */}
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-[#17cfcf]" />
                {isQualifiedWorkflow ? t('clientDashboard.actions.interested') : t('clientDashboard.actions.offersReceived')}
              </DialogTitle>
              <Badge className="bg-slate-900 text-white border-0 font-mono text-xs px-3 py-1">
                {request.referenceId}
              </Badge>
            </div>

            {/* Route et Prix */}
            <div className="space-y-2">
              {/* Carte de trajet avec distance dans le dialogue */}
              {request.fromCity && request.toCity && (
                <div className="mt-2">
                  <RouteMap
                    departureCity={request.fromCity}
                    arrivalCity={request.toCity}
                    departureAddress={request.departureAddress}
                    arrivalAddress={request.arrivalAddress}
                    distance={request.distance}
                  />
                </div>
              )}

              {/* Prix - Style transporteur */}
              {isQualifiedWorkflow && request.clientTotal && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#00ff88]/10 via-[#00ff88]/5 to-transparent border-l-4 border-[#00ff88]">
                  <div className="w-7 h-7 rounded-full bg-[#00ff88]/20 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-4 h-4 text-[#00ff88]" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[#00ff88]">
                      {parseFloat(request.clientTotal).toFixed(2)}
                    </span>
                    <span className="text-sm font-medium text-[#00ff88]/70">MAD</span>
                  </div>
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {isQualifiedWorkflow ? (
              // New workflow: Display interested transporters
              interestedTransporters.length > 0 ? (
                <div className="space-y-3">
                  {interestedTransporters.map((transporter: any, index: number) => {
                    // Array of vibrant border colors
                    const borderColors = [
                      'border-[#17cfcf] border-2',  // Cyan
                      'border-purple-500 border-2',  // Purple
                      'border-orange-500 border-2',  // Orange
                      'border-pink-500 border-2',    // Pink
                      'border-green-500 border-2',   // Green
                      'border-blue-500 border-2',    // Blue
                      'border-yellow-500 border-2',  // Yellow
                      'border-red-500 border-2',     // Red
                    ];
                    const borderColor = borderColors[index % borderColors.length];
                    
                    return (
                    <Card key={transporter.id} className={`overflow-hidden hover-elevate ${borderColor}`}>
                      <div className="flex gap-3 p-3">
                        {/* Left column: Photo + Action button */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          {/* Transporter photo */}
                          <div className="w-24 h-24 bg-gradient-to-br from-[#0a2540] via-[#1d3c57] to-[#17cfcf]/20 rounded-lg overflow-hidden">
                            {transporter.truckPhotos?.[0] ? (
                              <img
                                src={transporter.truckPhotos[0]}
                                alt="Camion"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Truck className="w-12 h-12 text-[#17cfcf] opacity-40 m-auto mt-6" />
                            )}
                          </div>
                          
                          {/* Action button with animation */}
                          <Button
                            className="bg-gradient-to-r from-[#17cfcf] to-[#13b3b3] hover:from-[#13b3b3] hover:to-[#0f9999] text-white font-bold px-3 py-2 text-sm shadow-lg animate-pulse hover:animate-none w-24"
                            onClick={() => onChooseTransporter(request.id, transporter.id)}
                            data-testid={`button-select-transporter-${transporter.id}`}
                          >
                            ✓ {t('clientDashboard.actions.chooseTransporter')}
                          </Button>
                        </div>
                        
                        {/* Transporter info */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-semibold text-base">{transporter.name || t('shared.labels.transporter')}</h4>
                              {transporter.city && (
                                <p className="text-xs text-muted-foreground">{transporter.city}</p>
                              )}
                            </div>
                            {transporter.isVerified && (
                              <Badge className="bg-[#17cfcf] text-[10px] px-2 py-0">{t('shared.labels.verified')}</Badge>
                            )}
                          </div>
                          
                          {/* Rating */}
                          <div className="flex items-center gap-1.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < Math.round(parseFloat(transporter.rating || "0"))
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="text-xs text-muted-foreground ml-1">
                              {parseFloat(transporter.rating || "0").toFixed(1)} ({transporter.totalTrips || 0})
                            </span>
                          </div>

                          {/* Proposed availability date - improved visibility */}
                          {transporter.availabilityDate && (
                            <div className="space-y-1 pt-1">
                              <p className="text-xs font-semibold text-muted-foreground">{t('clientDashboard.labels.proposedAvailability')}</p>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  className={`${
                                    new Date(transporter.availabilityDate).toDateString() === new Date(request.dateTime).toDateString()
                                      ? 'bg-green-500 hover:bg-green-600' 
                                      : 'bg-orange-500 hover:bg-orange-600'
                                  } text-white border-0 text-sm font-bold px-3 py-1`}
                                >
                                  📅 {format(new Date(transporter.availabilityDate), "dd MMMM yyyy", { locale: fr })}
                                </Badge>
                              </div>
                              {new Date(transporter.availabilityDate).toDateString() === new Date(request.dateTime).toDateString() ? (
                                <p className="text-xs text-green-600 dark:text-green-400 font-bold">✓ {t('clientDashboard.labels.matchesRequestedDate')}</p>
                              ) : (
                                <p className="text-xs text-orange-600 dark:text-orange-400 font-bold">ℹ️ {t('clientDashboard.labels.alternativeDate')}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucun transporteur intéressé pour le moment
                </p>
              )
            ) : (
              // Old workflow: Display offers
              offersWithTransporters.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {offersWithTransporters.map((offer: any) => (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      onAccept={(offerId) => {
                        onAcceptOffer(offerId);
                        setShowOffersDialog(false);
                      }}
                      onDecline={(offerId) => {
                        onDeclineOffer(offerId);
                      }}
                      onChat={() => {
                        onChat(offer.transporterId, offer.transporterName, request.id);
                        setShowOffersDialog(false);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucune offre pour le moment
                </p>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog CamioMatch */}
      <Dialog open={showCamioMatchDialog} onOpenChange={setShowCamioMatchDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            {/* Phrase animée d'accueil */}
            <div className="text-center mb-2">
              <p className="text-sm text-[#17cfcf] font-medium animate-pulse flex items-center justify-center gap-2">
                <Truck className="w-4 h-4" />
                Trouvons le bon camion pour vous...
              </p>
            </div>
            <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <Zap className="w-6 h-6 text-[#17cfcf]" />
              CamioMatch
            </DialogTitle>
            <DialogDescription className="text-center text-base">
              Voici les meilleurs matches pour votre trajet
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            {matchesLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                {/* Animation de chargement avec camion */}
                <div className="relative w-48 h-24">
                  <div className="absolute bottom-8 left-0 w-full h-1 bg-gray-300 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#17cfcf] to-[#13b3b3] rounded-full animate-pulse" />
                  </div>
                  <div className="absolute bottom-0 left-0 w-16 h-16 animate-[drive_2s_ease-in-out_infinite]">
                    <Truck className="w-full h-full text-[#17cfcf]" />
                  </div>
                </div>
                <p className="text-lg font-medium text-[#17cfcf] animate-pulse">
                  Recherche des meilleurs transporteurs...
                </p>
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-12">
                <Truck className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium text-muted-foreground">
                  Aucun match disponible pour le moment
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Essayez de republier votre demande ou contactez le coordinateur
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Carte centrale du match actuel */}
                <div className="relative transition-all duration-300">
                  <Card className="overflow-hidden border-2 border-[#17cfcf]/40 shadow-2xl bg-gradient-to-br from-card via-card to-[#17cfcf]/10 backdrop-blur-sm">
                    <CardContent className="p-4 space-y-3">
                      {/* Photo du camion */}
                      <div className="w-full h-40 bg-gradient-to-br from-[#0a2540] via-[#1d3c57] to-[#17cfcf]/20 rounded-xl overflow-hidden flex items-center justify-center relative shadow-inner">
                        {matches[currentMatchIndex]?.truckPhoto ? (
                          <img
                            src={matches[currentMatchIndex].truckPhoto}
                            alt={t('clientDashboard.labels.transporterTruck')}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          />
                        ) : (
                          <Truck className="w-24 h-24 text-[#17cfcf] opacity-40" />
                        )}
                      </div>

                      {/* Informations transporteur */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold">
                            {matches[currentMatchIndex]?.name || `Transporteur ${matches[currentMatchIndex]?.id?.substring(0, 8)}`}
                          </h3>
                          {matches[currentMatchIndex]?.priority && (
                            <Badge className="bg-[#17cfcf] text-white font-semibold flex items-center gap-1">
                              {matches[currentMatchIndex].priority === 'empty_return' && (
                                <>
                                  <Target className="w-3 h-3" />
                                  {t('clientDashboard.dialogs.offers.emptyReturn')}
                                </>
                              )}
                              {matches[currentMatchIndex].priority === 'active' && (
                                <>
                                  <Zap className="w-3 h-3" />
                                  {t('clientDashboard.dialogs.offers.recentlyActive')}
                                </>
                              )}
                              {matches[currentMatchIndex].priority === 'rating' && (
                                <>
                                  <Star className="w-3 h-3 fill-white" />
                                  {t('clientDashboard.dialogs.offers.topRated')}
                                </>
                              )}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <span className="text-muted-foreground">{t('clientDashboard.dialogs.offers.city')}:</span>
                            <span className="font-medium">{matches[currentMatchIndex]?.city || 'N/A'}</span>
                          </span>
                        </div>

                        {/* Étoiles de satisfaction */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-5 h-5 ${
                                  i < Math.round(matches[currentMatchIndex]?.rating || 0)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">
                            {(matches[currentMatchIndex]?.rating || 0).toFixed(1)} / 5.0
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ({matches[currentMatchIndex]?.totalTrips || 0} trajets)
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Navigation avec flèches améliorées */}
                  {matches.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentMatchIndex((prev) => (prev === 0 ? matches.length - 1 : prev - 1))}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 h-14 w-14 rounded-full bg-background shadow-lg border-2 border-[#17cfcf] z-10"
                        data-testid="button-previous-match"
                      >
                        <ChevronLeft className="w-8 h-8 text-[#17cfcf]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentMatchIndex((prev) => (prev === matches.length - 1 ? 0 : prev + 1))}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 h-14 w-14 rounded-full bg-background shadow-lg border-2 border-[#17cfcf] z-10"
                        data-testid="button-next-match"
                      >
                        <ChevronRight className="w-8 h-8 text-[#17cfcf]" />
                      </Button>
                    </>
                  )}
                </div>

                {/* Indicateur de position */}
                {matches.length > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    {matches.map((_: any, index: number) => (
                      <div
                        key={index}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          index === currentMatchIndex
                            ? 'w-6 bg-[#17cfcf]'
                            : 'w-1.5 bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Boutons d'action style Tinder - icônes uniquement */}
                <div className="flex items-center justify-center gap-8 pt-2">
                  {/* Bouton Passer (gauche, rouge/gris) */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      // Passer au suivant
                      if (currentMatchIndex < matches.length - 1) {
                        setCurrentMatchIndex(currentMatchIndex + 1);
                      } else {
                        toast({
                          title: t('clientDashboard.dialogs.offers.matchesEnd'),
                          description: t('clientDashboard.dialogs.offers.matchesEndDesc'),
                        });
                      }
                    }}
                    className="rounded-full border-2 border-red-500/60 text-red-500 shadow-lg"
                    data-testid="button-skip-match"
                  >
                    <X className="w-8 h-8" />
                  </Button>

                  {/* Bouton Contacter (droite, turquoise avec pulse) */}
                  <Button
                    size="icon"
                    onClick={() => {
                      const currentMatch = matches[currentMatchIndex];
                      contactTransporterMutation.mutate(currentMatch.id);
                      onChat(currentMatch.id, currentMatch.name || 'Transporteur', request.id);
                      setShowCamioMatchDialog(false);
                    }}
                    className="rounded-full bg-gradient-to-br from-[#17cfcf] to-[#13b3b3] text-white border-0 shadow-xl animate-pulse-glow"
                    data-testid="button-contact-match"
                  >
                    <MessageSquare className="w-8 h-8" />
                  </Button>
                </div>

                {/* Compteur discret */}
                <p className="text-center text-[10px] text-muted-foreground/60 mt-1">
                  {currentMatchIndex + 1} / {matches.length}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de modification */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('clientDashboard.dialogs.editTitle')}</DialogTitle>
            <DialogDescription>
              {t('clientDashboard.dialogs.editDescription')}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={editForm.control}
                  name="fromCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('clientDashboard.dialogs.edit.fromCity')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="edit-select-from-city">
                            <SelectValue placeholder={t('clientDashboard.dialogs.edit.selectFromCity')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {citiesLoading ? (
                            <div className="p-2 text-sm text-muted-foreground">{t('common.loading')}</div>
                          ) : (
                            cities.map((city: any) => (
                              <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="toCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('clientDashboard.dialogs.edit.toCity')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="edit-select-to-city">
                            <SelectValue placeholder={t('clientDashboard.dialogs.edit.selectToCity')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {citiesLoading ? (
                            <div className="p-2 text-sm text-muted-foreground">{t('common.loading')}</div>
                          ) : (
                            cities.map((city: any) => (
                              <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="goodsType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('clientDashboard.dialogs.edit.goodsType')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="edit-select-goods-type">
                          <SelectValue placeholder={t('clientDashboard.dialogs.edit.selectGoodsType')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {goodsTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('clientDashboard.dialogs.edit.description')}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t('clientDashboard.dialogs.edit.descriptionPlaceholder')}
                        className="min-h-24"
                        data-testid="edit-input-description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('clientDashboard.dialogs.edit.budget')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="ex: 500 MAD" 
                        data-testid="edit-input-budget"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="dateTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('clientDashboard.dialogs.edit.pickupDate')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        data-testid="edit-input-datetime"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="handlingRequired"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="edit-checkbox-handling-required"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">
                        {t('clientDashboard.dialogs.edit.handlingRequired')}
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        {t('newRequestForm.handlingDescription')}
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              {editForm.watch("handlingRequired") && (
                <div className="space-y-4 p-4 rounded-lg border bg-muted/50">
                  <h3 className="font-semibold text-sm">{t('shared.labels.handlingInfo')}</h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">🏢 {t('shared.labels.departure')}</h4>
                      <FormField
                        control={editForm.control}
                        name="departureFloor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('clientDashboard.dialogs.edit.departureFloor')}</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="ex: 3" 
                                min="0"
                                data-testid="edit-input-departure-floor"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="departureElevator"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value ?? false}
                                onCheckedChange={field.onChange}
                                data-testid="edit-checkbox-departure-elevator"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="cursor-pointer">
                                {t('clientDashboard.dialogs.edit.departureElevator')}
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">🏠 {t('shared.labels.arrival')}</h4>
                      <FormField
                        control={editForm.control}
                        name="arrivalFloor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('clientDashboard.dialogs.edit.arrivalFloor')}</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="ex: 2" 
                                min="0"
                                data-testid="edit-input-arrival-floor"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="arrivalElevator"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value ?? false}
                                onCheckedChange={field.onChange}
                                data-testid="edit-checkbox-arrival-elevator"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="cursor-pointer">
                                {t('clientDashboard.dialogs.edit.arrivalElevator')}
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Section Photos */}
              <div className="space-y-3">
                <label className="text-sm font-medium">{t('clientDashboard.dialogs.edit.photos')}</label>
                
                {/* Photos existantes conservées */}
                {editedExistingPhotos.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">{t('shared.labels.existingPhotos')} ({editedExistingPhotos.length})</p>
                    <div className="grid grid-cols-3 gap-2">
                      {editedExistingPhotos.map((photo: string, index: number) => (
                        <div key={index} className="relative aspect-square rounded-md overflow-hidden bg-muted group">
                          <img 
                            src={photo} 
                            alt={`Photo ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeExistingPhoto(index)}
                            data-testid={`button-remove-photo-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nouvelles photos sélectionnées (aperçu) */}
                {editPhotos.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">{t('shared.labels.newPhotos')} ({editPhotos.length})</p>
                    <div className="grid grid-cols-3 gap-2">
                      {editPhotos.map((photo: File, index: number) => (
                        <div key={index} className="relative aspect-square rounded-md overflow-hidden bg-muted border-2 border-primary">
                          <img 
                            src={URL.createObjectURL(photo)} 
                            alt={`Nouvelle photo ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Zone de téléchargement de nouvelles photos */}
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleEditPhotoUpload}
                    className="hidden"
                    id="edit-photo-upload"
                    data-testid="input-edit-photos"
                  />
                  <label htmlFor="edit-photo-upload" className="cursor-pointer">
                    <Camera className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {editPhotos.length > 0 
                        ? t('clientDashboard.dialogs.edit.changePhotos')
                        : t('clientDashboard.dialogs.edit.addMorePhotos')}
                    </p>
                  </label>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => setShowEditDialog(false)}
                  data-testid="button-cancel-edit"
                >
                  {t('common.cancel')}
                </Button>
                <Button 
                  type="submit" 
                  disabled={editRequestMutation.isPending}
                  data-testid="button-save-edit"
                >
                  {editRequestMutation.isPending ? t('clientDashboard.dialogs.edit.saving') : t('clientDashboard.dialogs.edit.save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('clientDashboard.dialogs.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('clientDashboard.dialogs.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">{t('shared.actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(request.id);
                setShowDeleteDialog(false);
              }}
              data-testid="button-confirm-delete"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('clientDashboard.actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function ClientDashboard() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading, logout } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // Create schemas with useMemo
  const reportSchema = useMemo(() => createReportSchema(t), [t]);
  
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedTransporter, setSelectedTransporter] = useState<any>(null);
  const [chatRequestId, setChatRequestId] = useState<string>("");
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [showTransporterInfo, setShowTransporterInfo] = useState(false);
  const [transporterInfo, setTransporterInfo] = useState<any>(null);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingRequestId, setRatingRequestId] = useState<string>("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentRequestId, setPaymentRequestId] = useState<string>("");
  const [paymentReceipt, setPaymentReceipt] = useState<string>("");
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportRequestId, setReportRequestId] = useState<string>("");
  const [showPhotosDialog, setShowPhotosDialog] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  const handleLogout = () => {
    logout();
  };

  const handleOpenPhotosDialog = (photos: string[]) => {
    setSelectedPhotos(photos);
    setShowPhotosDialog(true);
  };

  // Track client dashboard login with Meta Pixel
  useEffect(() => {
    if (user?.role === 'client') {
      MetaPixelEvents.login('client');
    }
  }, [user]);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["/api/requests", user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/requests?clientId=${user!.id}`);
      return response.json();
    },
    enabled: !!user,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      return response.json();
    },
  });

  // Fetch cities from API
  const { data: cities = [], isLoading: citiesLoading } = useQuery({
    queryKey: ["/api/cities"],
    queryFn: async () => {
      const response = await fetch("/api/cities");
      return response.json();
    },
  });

  const acceptOfferMutation = useMutation({
    mutationFn: async (offerId: string) => {
      const response = await fetch(`/api/offers/${offerId}/accept`, {
        method: "POST",
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      
      setContactInfo({
        transporterPhone: data.transporterPhone,
        transporterName: data.transporterName,
        commission: data.commission,
        total: data.total
      });
      setShowContactDialog(true);
    },
  });

  const chooseTransporterMutation = useMutation({
    mutationFn: async ({ requestId, transporterId }: { requestId: string; transporterId: string }) => {
      return await apiRequest("POST", `/api/requests/${requestId}/choose-transporter`, { transporterId });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      
      toast({
        title: t('clientDashboard.toast.transporterSelected'),
        description: t('clientDashboard.toast.transporterChosenDesc', { transporterName: data.transporter?.name || t('shared.labels.transporter') }),
      });

      setContactInfo({
        transporterPhone: data.transporter?.phoneNumber || '',
        transporterName: data.transporter?.name || t('shared.labels.transporter'),
        commission: 0,
        total: data.request.clientTotal || 0
      });
      setShowContactDialog(true);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: t('clientDashboard.toast.selectError'),
        description: error.message || t('clientDashboard.toast.selectErrorDesc'),
      });
    }
  });

  const declineOfferMutation = useMutation({
    mutationFn: async (offerId: string) => {
      const response = await fetch(`/api/offers/${offerId}/decline`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to decline offer");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      toast({
        title: t('clientDashboard.toast.offerDeclined'),
        description: t('clientDashboard.toast.offerDeclinedDesc'),
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: t('clientDashboard.toast.declineError'),
        description: t('clientDashboard.toast.declineErrorDesc'),
      });
    },
  });

  const deleteRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete request");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: t('clientDashboard.toast.requestDeleted'),
        description: t('clientDashboard.toast.requestDeletedDesc'),
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: t('clientDashboard.toast.deleteError'),
        description: t('clientDashboard.toast.deleteErrorDesc'),
      });
    },
  });

  const viewTransporterMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await fetch(`/api/requests/${requestId}/accepted-transporter`);
      if (!response.ok) {
        throw new Error("Failed to fetch transporter info");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setTransporterInfo(data);
      setShowTransporterInfo(true);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: string }) => {
      const endpoint = action === "completed" 
        ? `/api/requests/${requestId}/complete`
        : `/api/requests/${requestId}/republish`;
      
      const response = await fetch(endpoint, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`Failed to ${action} request`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
    },
  });

  const handleAcceptOffer = (offerId: string) => {
    acceptOfferMutation.mutate(offerId);
  };

  const handleDeclineOffer = (offerId: string) => {
    declineOfferMutation.mutate(offerId);
  };

  const handleChooseTransporter = (requestId: string, transporterId: string) => {
    chooseTransporterMutation.mutate({ requestId, transporterId });
  };

  const handleDeleteRequest = (requestId: string) => {
    deleteRequestMutation.mutate(requestId);
  };

  const handleViewTransporter = (requestId: string) => {
    viewTransporterMutation.mutate(requestId);
  };

  const handleUpdateStatus = (requestId: string, action: string) => {
    if (action === "completed") {
      // Show rating dialog before completing
      setRatingRequestId(requestId);
      setRatingValue(0);
      setHoverRating(0);
      setShowRatingDialog(true);
    } else {
      // For republish action
      updateStatusMutation.mutate({ requestId, action });
    }
  };

  const completeWithRatingMutation = useMutation({
    mutationFn: async ({ requestId, rating }: { requestId: string; rating: number }) => {
      const response = await fetch(`/api/requests/${requestId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating }),
      });
      if (!response.ok) {
        throw new Error("Failed to complete request with rating");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('clientDashboard.toast.orderCompleted'),
        description: t('clientDashboard.toast.orderCompletedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      setShowRatingDialog(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: t('clientDashboard.toast.completeError'),
        description: t('clientDashboard.toast.completeErrorDesc'),
      });
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async ({ requestId, receipt }: { requestId: string; receipt: string }) => {
      return await apiRequest("POST", `/api/requests/${requestId}/mark-as-paid`, {
        clientId: user!.id,
        paymentReceipt: receipt,
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: t('clientDashboard.toast.deliveryConfirmed'),
        description: t('clientDashboard.toast.deliveryConfirmedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      
      // Close payment dialog
      setShowPaymentDialog(false);
      setPaymentReceipt("");
      
      // Open rating dialog automatically with the same request
      setRatingRequestId(variables.requestId);
      setRatingValue(0);
      setHoverRating(0);
      setShowRatingDialog(true);
      
      // Clear payment request ID after everything is set
      setPaymentRequestId("");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: t('clientDashboard.toast.paymentError'),
        description: t('clientDashboard.toast.paymentErrorDesc'),
      });
    },
  });

  const reportForm = useForm({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      description: "",
      type: "",
    },
  });

  const createReportMutation = useMutation({
    mutationFn: async (data: { requestId: string; description: string; type: string }) => {
      // Get the request to find the transporter ID
      const request = requests.find((r: any) => r.id === data.requestId);
      
      // Fetch the accepted offer to get transporterId
      let transporterId = "";
      if (request?.acceptedOfferId) {
        try {
          const offersResponse = await fetch(`/api/offers?requestId=${data.requestId}`);
          const offers = await offersResponse.json();
          const acceptedOffer = offers.find((o: any) => o.id === request.acceptedOfferId);
          transporterId = acceptedOffer?.transporterId || "";
        } catch (error) {
          console.error("Error fetching offers:", error);
        }
      }
      
      return await apiRequest("POST", "/api/reports", {
        requestId: data.requestId,
        reporterId: user!.id,
        reporterType: "client",
        reportedUserId: transporterId,
        reason: data.type,
        details: data.description,
      });
    },
    onSuccess: () => {
      toast({
        title: t('clientDashboard.toast.reportSent'),
        description: t('clientDashboard.toast.reportSentDesc'),
      });
      setShowReportDialog(false);
      reportForm.reset();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: t('clientDashboard.toast.reportError'),
        description: t('clientDashboard.toast.reportErrorDesc'),
      });
    },
  });

  const handleSubmitRating = () => {
    if (ratingValue > 0 && ratingRequestId) {
      completeWithRatingMutation.mutate({ requestId: ratingRequestId, rating: ratingValue });
    }
  };

  const handleOpenReportDialog = (requestId: string) => {
    setReportRequestId(requestId);
    reportForm.reset();
    setShowReportDialog(true);
  };

  const handleSubmitReport = (data: any) => {
    if (reportRequestId) {
      createReportMutation.mutate({
        requestId: reportRequestId,
        description: data.description,
        type: data.type,
      });
    }
  };

  const handleOpenPaymentDialog = (requestId: string) => {
    setPaymentRequestId(requestId);
    setPaymentReceipt("");
    setShowPaymentDialog(true);
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Accept all image formats - validation is manual by admin
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: t('clientDashboard.toast.invalidFormat'),
        description: t('clientDashboard.toast.invalidFormatDesc'),
      });
      e.target.value = ''; // Reset input
      return;
    }

    // Validate file size (max 10MB - increased limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: t('clientDashboard.toast.fileTooLarge'),
        description: t('clientDashboard.toast.fileTooLargeDesc'),
      });
      e.target.value = ''; // Reset input
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentReceipt(reader.result as string);
      toast({
        title: t('clientDashboard.toast.receiptUploaded'),
        description: t('clientDashboard.toast.receiptUploadedDesc'),
      });
    };
    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      toast({
        variant: "destructive",
        title: t('clientDashboard.toast.fileReadError'),
        description: t('clientDashboard.toast.fileReadErrorDesc'),
      });
      e.target.value = ''; // Reset input
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmPayment = () => {
    if (!paymentReceipt) {
      toast({
        variant: "destructive",
        title: t('clientDashboard.toast.missingReceipt'),
        description: t('clientDashboard.toast.missingReceiptDesc'),
      });
      return;
    }
    markAsPaidMutation.mutate({ requestId: paymentRequestId, receipt: paymentReceipt });
  };

  const handleChat = (transporterId: string, transporterName: string, requestId: string) => {
    setSelectedTransporter({ id: transporterId, name: transporterName || "Transporteur", role: "transporter" });
    setChatRequestId(requestId);
    setChatOpen(true);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingTruck size="lg" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingTruck size="lg" />
      </div>
    );
  }

  const activeRequests = requests.filter((r: any) => 
    (r.status === "open" || r.status === "accepted" || r.status === "published_for_matching") && 
    (!r.paymentStatus || r.paymentStatus === "not_required" || r.paymentStatus === "pending" || r.paymentStatus === "a_facturer")
  );
  const completedRequests = requests.filter((r: any) => 
    r.status === "completed" || r.status === "expired" || r.paymentStatus === "paid"
  );
  const paymentPendingRequests = requests.filter((r: any) => 
    r.paymentStatus === "awaiting_payment" || r.paymentStatus === "pending_admin_validation"
  );

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={user as any}
        onLogout={handleLogout}
      />
      
      <StoriesBar userRole="client" />
      
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex-1" />
          <Button
            onClick={() => setShowNewRequest(true)}
            size="default"
            className="gap-2"
            data-testid="button-new-request"
          >
            <Plus className="h-4 w-4" />
            {t('header.client.newRequest')}
          </Button>
        </div>
      </div>
      
      <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6">
        {showNewRequest ? (
          <NewRequestForm onSuccess={() => {
            setShowNewRequest(false);
            queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
          }} />
        ) : (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full max-w-3xl grid-cols-3">
              <TabsTrigger value="active" data-testid="tab-active">
                <Package className="mr-2 h-4 w-4" />
                {t('clientDashboard.tabs.active')}
              </TabsTrigger>
              <TabsTrigger value="to-pay" data-testid="tab-to-pay">
                <CreditCard className="mr-2 h-4 w-4" />
                {t('clientDashboard.tabs.toPay')} ({paymentPendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="completed" data-testid="tab-completed">
                {t('clientDashboard.tabs.completed')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-6 space-y-6">
              {activeRequests.length > 0 ? (
                activeRequests.map((request: any) => (
                  <RequestWithOffers 
                    key={request.id} 
                    request={request}
                    users={users}
                    cities={cities}
                    citiesLoading={citiesLoading}
                    currentUserId={user.id}
                    onAcceptOffer={handleAcceptOffer}
                    onDeclineOffer={handleDeclineOffer}
                    onChat={handleChat}
                    onDelete={handleDeleteRequest}
                    onViewTransporter={handleViewTransporter}
                    onUpdateStatus={handleUpdateStatus}
                    onReport={handleOpenReportDialog}
                    onChooseTransporter={handleChooseTransporter}
                    onOpenPhotosDialog={handleOpenPhotosDialog}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Vous n'avez pas encore de demandes
                  </p>
                  <Button 
                    onClick={() => setShowNewRequest(true)} 
                    className="mt-4"
                  >
                    Créer une demande
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="to-pay" className="mt-6">
              {paymentPendingRequests.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Aucune commande à payer
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentPendingRequests.map((request: any) => {
                    const acceptedOffer = request.acceptedOfferId 
                      ? users.find((u: any) => {
                          // Find the transporter through the accepted offer
                          return u.role === "transporteur";
                        })
                      : null;
                    
                    const categoryConfig = getCategoryConfig(request.goodsType, t);

                    return (
                      <div key={request.id} className={`p-4 rounded-lg border-2 ${categoryConfig.borderColor} space-y-4`}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <p className="font-semibold text-lg">{request.referenceId}</p>
                              <Badge variant="default" className="bg-blue-600">
                                À facturer
                              </Badge>
                            </div>

                            {/* Carte de trajet avec distance - To Pay */}
                            {request.fromCity && request.toCity && (
                              <div className="mt-2">
                                <RouteMap
                                  departureCity={request.fromCity}
                                  arrivalCity={request.toCity}
                                  departureAddress={request.departureAddress}
                                  arrivalAddress={request.arrivalAddress}
                                  distance={request.distance}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Type de marchandise</p>
                            <p className="font-medium">{categoryConfig.label}</p>
                          </div>
                          {request.estimatedWeight && (
                            <div>
                              <p className="text-muted-foreground">Poids estimé</p>
                              <p className="font-medium">{request.estimatedWeight}</p>
                            </div>
                          )}
                        </div>

                        {request.description && (
                          <div>
                            <p className="text-sm text-muted-foreground">Description</p>
                            <p className="text-sm">{request.description}</p>
                          </div>
                        )}

                        {/* Manutention détaillée */}
                        {request.handlingRequired !== undefined && request.handlingRequired !== null && (
                          <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <span>🏋️</span>
                              <span>Manutention : {request.handlingRequired ? 'Oui' : 'Non'}</span>
                            </div>
                            {request.handlingRequired && (
                              <div className="grid grid-cols-2 gap-4 pl-6">
                                {/* Départ */}
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span>🏢</span>
                                    <span className="font-medium">Départ</span>
                                  </div>
                                  <div className="text-sm">
                                    {request.departureFloor !== undefined && request.departureFloor !== null ? (
                                      <>
                                        <div>{request.departureFloor === 0 ? 'RDC' : `${request.departureFloor}ᵉ étage`}</div>
                                        <div className="text-xs text-muted-foreground">
                                          Ascenseur {request.departureElevator ? '✅' : '❌'}
                                        </div>
                                      </>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">Non spécifié</span>
                                    )}
                                  </div>
                                </div>

                                {/* Arrivée */}
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span>🏠</span>
                                    <span className="font-medium">Arrivée</span>
                                  </div>
                                  <div className="text-sm">
                                    {request.arrivalFloor !== undefined && request.arrivalFloor !== null ? (
                                      <>
                                        <div>{request.arrivalFloor === 0 ? 'RDC' : `${request.arrivalFloor}ᵉ étage`}</div>
                                        <div className="text-xs text-muted-foreground">
                                          Ascenseur {request.arrivalElevator ? '✅' : '❌'}
                                        </div>
                                      </>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">Non spécifié</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Prix qualifié */}
                        {request.clientTotal && request.qualifiedAt && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#00ff88]/10 via-[#00ff88]/5 to-transparent border-l-4 border-[#00ff88]">
                              <div className="w-7 h-7 rounded-full bg-[#00ff88]/20 flex items-center justify-center flex-shrink-0">
                                <DollarSign className="w-4 h-4 text-[#00ff88]" />
                              </div>
                              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Prix Qualifié</span>
                              <span className="text-lg font-bold text-[#00ff88] ml-auto">{Math.floor(request.clientTotal).toLocaleString()} Dhs</span>
                            </div>
                            <p className="text-xs text-muted-foreground px-1">
                              Qualifié le {format(new Date(request.qualifiedAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-2 border-t">
                          {request.acceptedOfferId && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleViewTransporter(request.id)}
                              data-testid={`button-view-transporter-payment-${request.id}`}
                              className="gap-2"
                            >
                              <Info className="h-4 w-4" />
                              <span className="hidden sm:inline">Infos transporteur</span>
                              <span className="sm:hidden">Infos</span>
                            </Button>
                          )}
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleOpenPaymentDialog(request.id)}
                            className="gap-2"
                            data-testid={`button-mark-paid-${request.id}`}
                          >
                            <CheckCircle className="h-4 w-4" />
                            Marquer comme payé
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-6">
              {completedRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Aucune demande terminée
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedRequests.map((request: any) => {
                    const categoryConfig = getCategoryConfig(request.goodsType, t);
                    
                    return (
                    <div key={request.id} className={`p-4 rounded-lg border-2 ${categoryConfig.borderColor} space-y-3`}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <p className="font-semibold">{request.referenceId}</p>
                            {request.status === "expired" ? (
                              <Badge variant="destructive" className="bg-orange-600">
                                Expirée
                              </Badge>
                            ) : (
                              <Badge variant="default" className="bg-gray-600">
                                Terminée
                              </Badge>
                            )}
                          </div>

                          {/* Carte de trajet avec distance - Completed */}
                          {request.fromCity && request.toCity && (
                            <div className="mt-2">
                              <RouteMap
                                departureCity={request.fromCity}
                                arrivalCity={request.toCity}
                                departureAddress={request.departureAddress}
                                arrivalAddress={request.arrivalAddress}
                                distance={request.distance}
                              />
                            </div>
                          )}

                          {request.status === "expired" && (
                            <div className="mt-2 p-2 rounded bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                              <p className="text-sm text-orange-800 dark:text-orange-300">
                                Cette commande a été marquée comme expirée par l'équipe CamionBack
                                {request.coordinationReason && `: ${request.coordinationReason}`}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        {request.description && (
                          <div>
                            <p className="text-sm text-muted-foreground">Description</p>
                            <p className="text-sm">{request.description}</p>
                          </div>
                        )}

                        {/* Manutention détaillée */}
                        {request.handlingRequired !== undefined && request.handlingRequired !== null && (
                          <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <span>🏋️</span>
                              <span>Manutention : {request.handlingRequired ? 'Oui' : 'Non'}</span>
                            </div>
                            {request.handlingRequired && (
                              <div className="grid grid-cols-2 gap-4 pl-6">
                                {/* Départ */}
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span>🏢</span>
                                    <span className="font-medium">Départ</span>
                                  </div>
                                  <div className="text-sm">
                                    {request.departureFloor !== undefined && request.departureFloor !== null ? (
                                      <>
                                        <div>{request.departureFloor === 0 ? 'RDC' : `${request.departureFloor}ᵉ étage`}</div>
                                        <div className="text-xs text-muted-foreground">
                                          Ascenseur {request.departureElevator ? '✅' : '❌'}
                                        </div>
                                      </>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">Non spécifié</span>
                                    )}
                                  </div>
                                </div>

                                {/* Arrivée */}
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span>🏠</span>
                                    <span className="font-medium">Arrivée</span>
                                  </div>
                                  <div className="text-sm">
                                    {request.arrivalFloor !== undefined && request.arrivalFloor !== null ? (
                                      <>
                                        <div>{request.arrivalFloor === 0 ? 'RDC' : `${request.arrivalFloor}ᵉ étage`}</div>
                                        <div className="text-xs text-muted-foreground">
                                          Ascenseur {request.arrivalElevator ? '✅' : '❌'}
                                        </div>
                                      </>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">Non spécifié</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Prix qualifié */}
                        {request.clientTotal && request.qualifiedAt && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#00ff88]/10 via-[#00ff88]/5 to-transparent border-l-4 border-[#00ff88]">
                              <div className="w-7 h-7 rounded-full bg-[#00ff88]/20 flex items-center justify-center flex-shrink-0">
                                <DollarSign className="w-4 h-4 text-[#00ff88]" />
                              </div>
                              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Prix Qualifié</span>
                              <span className="text-lg font-bold text-[#00ff88] ml-auto">{Math.floor(request.clientTotal).toLocaleString()} Dhs</span>
                            </div>
                            <p className="text-xs text-muted-foreground px-1">
                              Qualifié le {format(new Date(request.qualifiedAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          {request.acceptedOfferId && (
                            <>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleViewTransporter(request.id)}
                                data-testid={`button-view-transporter-completed-${request.id}`}
                                className="gap-2"
                              >
                                <Info className="h-4 w-4" />
                                <span className="hidden sm:inline">Infos transporteur</span>
                                <span className="sm:hidden">Infos</span>
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleUpdateStatus(request.id, "republish")}
                                data-testid={`button-republish-completed-${request.id}`}
                                className="gap-2"
                              >
                                <RotateCcw className="h-4 w-4" />
                                Republier
                              </Button>
                            </>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleOpenReportDialog(request.id)}
                            data-testid={`button-report-completed-${request.id}`}
                            className="gap-2"
                          >
                            <Flag className="h-4 w-4" />
                            <span className="hidden sm:inline">Signaler</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRequest(request.id)}
                            data-testid={`button-delete-completed-${request.id}`}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {selectedTransporter && (
        <ChatWindow
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          otherUser={selectedTransporter}
          currentUserId={user.id}
          currentUserRole="client"
          requestId={chatRequestId}
        />
      )}

      <AlertDialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <AlertDialogTitle className="text-xl">{t('clientDashboard.dialogs.offerAccepted')}</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-4 text-base">
              <p className="text-foreground">
                {t('clientDashboard.dialogs.transporterInformed', { transporterName: contactInfo?.transporterName })}
              </p>
              
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <p className="font-medium text-foreground mb-2">{t('clientDashboard.dialogs.canContactNow')}</p>
                <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                  <Phone className="w-5 h-5" />
                  <a href={`tel:${contactInfo?.transporterPhone}`} className="hover:underline">
                    {contactInfo?.transporterPhone}
                  </a>
                </div>
              </div>

              {contactInfo?.total && (
                <div className="text-sm border-t pt-3">
                  <p className="font-semibold text-foreground">{t('clientDashboard.labels.totalToPay')} : {contactInfo.total.toFixed(2)} MAD</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              className="w-full"
              data-testid="button-close-contact-dialog"
            >
              {t('shared.actions.understood')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showTransporterInfo} onOpenChange={setShowTransporterInfo}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <button
            onClick={() => setShowTransporterInfo(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            data-testid="button-close-transporter-info-x"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fermer</span>
          </button>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <Info className="w-6 h-6 text-primary-foreground" />
              </div>
              <AlertDialogTitle className="text-xl">Informations du transporteur</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-4 text-base">
              {transporterInfo ? (
                <>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Nom</p>
                      <p className="font-semibold text-foreground">{transporterInfo.transporterName || "Non disponible"}</p>
                    </div>
                    
                    {transporterInfo.transporterCity && (
                      <div>
                        <p className="text-sm text-muted-foreground">Ville</p>
                        <p className="font-semibold text-foreground">{transporterInfo.transporterCity}</p>
                      </div>
                    )}

                    {transporterInfo.transporterPhone && (
                      <div>
                        <p className="text-sm text-muted-foreground">{t('clientDashboard.dialogs.transporter.phone')}</p>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-primary" />
                          <a 
                            href={`tel:${transporterInfo.transporterPhone}`} 
                            className="font-semibold text-primary hover:underline"
                            data-testid="link-transporter-phone"
                          >
                            {transporterInfo.transporterPhone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {transporterInfo.totalAmount != null && (
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <span className="font-semibold text-foreground">{t('shared.labels.totalToPay')}</span>
                        <span className="font-bold text-primary text-xl">{Number(transporterInfo.totalAmount).toFixed(2)} MAD</span>
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground italic">
                    {t('clientDashboard.dialogs.transporter.contactInfo')}
                  </p>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">{t('common.loadingInfo')}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              className="w-full"
              data-testid="button-close-transporter-info"
            >
              {t('clientDashboard.dialogs.transporter.close')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center">
                <Star className="w-6 h-6 text-white fill-white" />
              </div>
              <AlertDialogTitle className="text-xl">{t('clientDashboard.dialogs.rating.title')}</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-6 text-base">
              <p className="text-foreground text-center">
                {t('clientDashboard.dialogs.rating.description')}
              </p>
              
              <div className="flex justify-center items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingValue(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 hover-elevate active-elevate-2"
                    data-testid={`button-star-${star}`}
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= (hoverRating || ratingValue)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>

              {ratingValue > 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  {t('clientDashboard.dialogs.rating.selectRating', { 
                    rating: ratingValue, 
                    stars: ratingValue === 1 ? t('clientDashboard.dialogs.rating.star') : t('clientDashboard.dialogs.rating.stars')
                  })}
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel 
              onClick={() => setShowRatingDialog(false)}
              data-testid="button-cancel-rating"
            >
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitRating}
              disabled={ratingValue === 0 || completeWithRatingMutation.isPending}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
              data-testid="button-submit-rating"
            >
              {completeWithRatingMutation.isPending ? t('clientDashboard.dialogs.rating.submitting') : t('clientDashboard.dialogs.rating.submit')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('clientDashboard.dialogs.payment.title')}</DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 space-y-3">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {t('shared.labels.bankTransferInstructions')}
                </p>
                <div className="space-y-1">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <span className="font-semibold">{t('shared.labels.rib')} :</span> 011815000005210001099713
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <span className="font-semibold">{t('shared.labels.payableTo')} :</span> CamionBack
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt-upload" className="text-sm font-medium">
                  {t('clientDashboard.dialogs.payment.receiptPreview')} <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t('shared.labels.receiptUploadInstructions')}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('receipt-upload')?.click()}
                    className="w-full gap-2"
                    data-testid="button-upload-receipt"
                  >
                    <Upload className="w-4 h-4" />
                    {paymentReceipt ? t('clientDashboard.dialogs.payment.receiptUploaded') : t('clientDashboard.dialogs.payment.uploadReceipt')}
                  </Button>
                  <input
                    id="receipt-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptUpload}
                    className="hidden"
                    data-testid="input-receipt-upload"
                  />
                </div>
                {paymentReceipt && (
                  <div className="mt-2">
                    <img
                      src={paymentReceipt}
                      alt={t('clientDashboard.dialogs.payment.receiptPreview')}
                      className="w-full h-40 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
              data-testid="button-cancel-payment"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleConfirmPayment}
              disabled={!paymentReceipt || markAsPaidMutation.isPending}
              data-testid="button-confirm-payment"
            >
              {markAsPaidMutation.isPending ? t('clientDashboard.dialogs.payment.confirming') : t('clientDashboard.dialogs.payment.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('clientDashboard.dialogs.report.title')}</DialogTitle>
            <DialogDescription>
              {t('clientDashboard.dialogs.report.description')}
            </DialogDescription>
          </DialogHeader>
          <Form {...reportForm}>
            <form onSubmit={reportForm.handleSubmit(handleSubmitReport)} className="space-y-4">
              <FormField
                control={reportForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('clientDashboard.dialogs.report.problemType')} <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-report-type">
                          <SelectValue placeholder={t('clientDashboard.dialogs.report.selectType')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="service">{t('shared.labels.serviceIssue')}</SelectItem>
                        <SelectItem value="payment">{t('shared.labels.paymentIssue')}</SelectItem>
                        <SelectItem value="communication">{t('shared.labels.communicationIssue')}</SelectItem>
                        <SelectItem value="quality">{t('clientDashboard.dialogs.report.types.quality')}</SelectItem>
                        <SelectItem value="damage">{t('clientDashboard.dialogs.report.types.damage')}</SelectItem>
                        <SelectItem value="delay">{t('clientDashboard.dialogs.report.types.delay')}</SelectItem>
                        <SelectItem value="other">{t('clientDashboard.dialogs.report.types.other')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={reportForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('clientDashboard.dialogs.report.descriptionLabel')} <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('clientDashboard.dialogs.report.descriptionPlaceholder')}
                        className="resize-none h-32"
                        data-testid="textarea-report-description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReportDialog(false)}
                  data-testid="button-cancel-report"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={createReportMutation.isPending}
                  data-testid="button-submit-report"
                >
                  {createReportMutation.isPending ? t('clientDashboard.dialogs.report.submitting') : t('clientDashboard.dialogs.report.submit')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog d'affichage des photos */}
      <Dialog open={showPhotosDialog} onOpenChange={setShowPhotosDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Photos de la demande ({selectedPhotos.length})</DialogTitle>
            <DialogDescription>
              Consultez les photos téléversées pour cette demande
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto p-2">
            {selectedPhotos.map((photo: string, index: number) => (
              <div key={index} className="relative group">
                <img
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-auto rounded-lg border-2 border-border hover:border-primary transition-colors"
                />
                <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  {index + 1}/{selectedPhotos.length}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPhotosDialog(false)}
              data-testid="button-close-photos"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
