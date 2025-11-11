import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, ListFilter, Package, Phone, CheckCircle, MapPin, MessageSquare, MessageCircle, Eye, EyeOff, Edit, DollarSign, Compass, ExternalLink, Star, Truck, Trash2, Share2, Copy, Send, RotateCcw, Info, Users, CreditCard, Calendar, X, Home, Sofa, Boxes, Wrench, ShoppingCart, LucideIcon, FileText, MoreVertical, Image as ImageIcon, ClipboardCheck, Award, StickyNote, Plus, ChevronDown, ChevronUp, Upload, SlidersHorizontal, ArrowRight, AlertCircle, UserCheck, Hash, Warehouse, Building2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { TwoColumnGrid } from "@/components/layout/two-column-grid";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChatWindow } from "@/components/chat/chat-window";
import { PhotoGalleryDialog } from "@/components/transporter/photo-gallery-dialog";
import { LoadingTruck } from "@/components/ui/loading-truck";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ManualAssignmentDialog } from "@/components/coordinator/manual-assignment-dialog";
import { QualificationDialog } from "@/components/coordinator/qualification-dialog";
import { RouteMap } from "@/components/route-map";
import { PaymentDialog } from "@/components/payment/payment-dialog";
import { GooglePlacesAutocomplete } from "@/components/google-places-autocomplete";
import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { useForceFrenchLayout } from "@/hooks/use-force-french-layout";
import { useTranslation } from "react-i18next";
import { getCategoryConfig } from "@/lib/goods-category-config";
import { StatusIndicator } from "@/components/shared/status-indicator";

// Types for adaptive filters by tab
type TabId = 'nouveau' | 'qualifies' | 'interesses' | 'production' | 'archives';

interface TabFilters {
  searchQuery: string;
  selectedCity: string;
  selectedStatus?: string;
  selectedDateFilter?: string;
  selectedCoordinator?: string;
  minInterested?: number;
  selectedPaymentStatus?: string;
  selectedArchiveReason?: string;
}

type FiltersByTab = Record<TabId, TabFilters>;

// Helper function to get default filters for each tab
function getDefaultFilters(tab: TabId): TabFilters {
  const baseFilters = {
    searchQuery: '',
    selectedCity: 'Toutes les villes',
  };

  switch (tab) {
    case 'nouveau':
      return {
        ...baseFilters,
        selectedDateFilter: 'all',
        selectedCoordinator: 'Tous les coordinateurs',
      };
    case 'qualifies':
      return {
        ...baseFilters,
        selectedDateFilter: 'all',
      };
    case 'interesses':
      return {
        ...baseFilters,
        minInterested: 1,
      };
    case 'production':
      return {
        ...baseFilters,
        selectedPaymentStatus: 'Tous les statuts',
        selectedDateFilter: 'all',
      };
    case 'archives':
      return {
        ...baseFilters,
        selectedArchiveReason: 'Toutes les raisons',
        selectedDateFilter: 'all',
      };
    default:
      return baseFilters;
  }
}

// Count active filters (non-default values)
function countActiveFilters(filters: TabFilters, tab: TabId): number {
  const defaults = getDefaultFilters(tab);
  return Object.entries(filters).filter(([key, value]) => {
    const defaultValue = defaults[key as keyof TabFilters];
    return value !== defaultValue && value !== '' && value !== undefined;
  }).length;
}

// Helper function to get payment status label in French
function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'a_facturer': 'À facturer',
    'paid_by_client': 'Payé par le client',
    'paid_by_camionback': 'Payé par CamionBack'
  };
  return labels[status] || status;
}

// Helper function to get client-friendly status with color
function getClientStatus(request: any, interestedCount: number = 0) {
  // 11. Commande terminée - Paiement validé
  if (request.paymentStatus === "paid" || request.paymentStatus === "pending_admin_validation") {
    return {
      text: "Commande terminée",
      variant: "default" as const,
      icon: CheckCircle,
    };
  }

  // 10. En attente de confirmation paiement - Livraison confirmée
  if (request.paymentStatus === "awaiting_payment") {
    return {
      text: "En attente de confirmation paiement",
      variant: "secondary" as const,
      icon: CreditCard,
    };
  }

  // 9. Livraison effectuée - Marquage "Livré"
  if (request.status === "completed") {
    return {
      text: "Livraison effectuée - Merci pour votre confiance",
      variant: "default" as const,
      icon: CheckCircle,
    };
  }

  // 8. Livraison en cours - Transporteur marque "Pris en charge"
  if (request.status === "in_progress") {
    return {
      text: "Livraison en cours",
      variant: "default" as const,
      icon: Truck,
    };
  }

  // 7. Offre confirmée - Si client valide un transporteur
  if (request.status === "accepted" && request.acceptedOfferId) {
    return {
      text: "Transporteur sélectionné - Livraison prévue",
      variant: "default" as const,
      icon: CheckCircle,
    };
  }

  // 6. Transporteur assigné manuellement - Coordinateur
  if (request.assignedTransporterId && !request.acceptedOfferId) {
    return {
      text: "Transporteur assigné - Suivi en cours",
      variant: "default" as const,
      icon: Truck,
    };
  }

  // 5. En sélection Transporteur - Tant qu'aucune offre n'a été choisie
  if (interestedCount > 0 && !request.acceptedOfferId && !request.assignedTransporterId) {
    return {
      text: "Choisissez votre transporteur",
      variant: "outline" as const,
      icon: Users,
      isProcessing: true,
    };
  }

  // 4. Transporteurs intéressés - Si ≥ 1 intéressé
  if (request.status === "published_for_matching" && interestedCount > 0) {
    return {
      text: "Des transporteurs ont postulé - Comparez les profils",
      variant: "outline" as const,
      icon: Truck,
      isProcessing: true,
    };
  }

  // 3. Publication aux transporteurs - Publication matching enclenchée
  if (request.status === "published_for_matching") {
    return {
      text: "En attente d'offres transporteurs…",
      variant: "secondary" as const,
      icon: Package,
      isProcessing: true,
    };
  }

  // 2. Prix vérifié / infos validées - Coordinateur valide détail + prix
  if (request.qualifiedAt && request.status !== "published_for_matching") {
    return {
      text: "Finalisation de votre demande…",
      variant: "secondary" as const,
      icon: Info,
      isProcessing: true,
    };
  }

  // 1. Création commande - Dès création (default)
  return {
    text: "Qualification logistique en cours…",
    variant: "secondary" as const,
    icon: RotateCcw,
    isProcessing: true,
  };
}

// Component to display offers for coordinators with transporter contact info
function CoordinatorOffersView({ requestId, onAcceptOffer, isPending }: { 
  requestId: string; 
  onAcceptOffer: (offerId: string) => void;
  isPending: boolean;
}) {
  const { data: offers = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/coordinator/requests", requestId, "offers"],
    enabled: !!requestId,
  });

  // State for managing truck photo viewing
  const [selectedTruckPhoto, setSelectedTruckPhoto] = useState<string | null>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8" data-testid="loading-offers">
        <LoadingTruck />
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground" data-testid="text-no-offers">
        <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Aucune offre reçue pour cette commande</p>
      </div>
    );
  }

  const handleViewTruckPhoto = (truckPhotos: string[] | null) => {
    const photo = truckPhotos && truckPhotos.length > 0 ? truckPhotos[0] : null;
    setSelectedTruckPhoto(photo);
    setPhotoDialogOpen(true);
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 mt-4" data-testid="grid-offers">
        {offers.map((offer: any) => (
          <Card key={offer.id} className="overflow-hidden" data-testid={`card-offer-${offer.id}`}>
            <CardContent className="p-4 space-y-3">
              {/* Truck Photo Button */}
              {offer.transporter?.truckPhotos && offer.transporter.truckPhotos.length > 0 && (
                <div className="mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => handleViewTruckPhoto(offer.transporter.truckPhotos)}
                    data-testid={`button-view-truck-photo-${offer.id}`}
                  >
                    <Truck className="h-4 w-4" />
                    Voir photo du camion
                  </Button>
                </div>
              )}

              {/* Transporter Info */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Truck className="h-4 w-4 text-[#5BC0EB]" />
                    <h4 className="font-semibold" data-testid={`text-transporter-name-${offer.id}`}>
                      {offer.transporter?.name || "Transporteur"}
                    </h4>
                  </div>
                  {offer.transporter?.city && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {offer.transporter.city}
                    </p>
                  )}
                  {offer.transporter?.rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{parseFloat(offer.transporter.rating).toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <Badge variant={offer.status === "pending" ? "default" : "secondary"}>
                  {offer.status === "pending" ? "En attente" : offer.status}
                </Badge>
              </div>

            {/* Contact Info - Visible for Coordinator */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Contact Transporteur</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-[#5BC0EB]" />
                  <a 
                    href={`tel:${offer.transporter?.phoneNumber}`}
                    className="text-sm text-[#5BC0EB] hover:underline font-medium"
                    data-testid={`link-call-transporter-${offer.id}`}
                  >
                    {offer.transporter?.phoneNumber}
                  </a>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => {
                    const message = encodeURIComponent(
                      `Bonjour 👋,\nJe suis coordinateur CamionBack.\nJe souhaite discuter de votre offre pour cette commande.`
                    );
                    // Normalize phone number: remove spaces, dashes, and + sign
                    const normalizedPhone = offer.transporter?.phoneNumber.replace(/[\s\-\+]/g, "");
                    window.open(`https://wa.me/${normalizedPhone}?text=${message}`, "_blank");
                  }}
                  data-testid={`button-whatsapp-transporter-${offer.id}`}
                >
                  🟢 WhatsApp
                </Button>
              </div>
            </div>

            {/* Offer Details */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Montant transporteur:</span>
                <span className="font-medium">{offer.amount} DH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Commission:</span>
                <span className="font-medium text-orange-600">+{offer.commissionAmount} DH</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-semibold">Total client:</span>
                <span className="text-lg font-bold text-[#5BC0EB]">{offer.clientAmount} DH</span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">
                  {offer.loadType === "return" ? "Retour à vide" : "Groupage"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Prise en charge:</span>
                <span className="font-medium">
                  {format(new Date(offer.pickupDate), "dd MMM yyyy", { locale: fr })}
                </span>
              </div>
            </div>

            {offer.status === "pending" && (
              <Button
                className="w-full bg-[#5BC0EB] hover:bg-[#4AA8D8]"
                onClick={() => onAcceptOffer(offer.id)}
                disabled={isPending}
                data-testid={`button-accept-offer-${offer.id}`}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isPending ? "Acceptation..." : "Accepter cette offre"}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
      </div>

      {/* Truck Photo Dialog */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Photo du camion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTruckPhoto ? (
              <img
                src={selectedTruckPhoto}
                alt="Photo du camion"
                className="w-full h-auto rounded-lg"
                data-testid="img-truck-photo"
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucune photo disponible pour ce camion</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Component to display interested transporters for coordinators
function InterestedTransportersView({ request, onAssignTransporter, isPending }: { 
  request: any; 
  onAssignTransporter: (transporterId: string) => void;
  isPending: boolean;
}) {
  const { toast } = useToast();
  
  // Fetch interested transporters from API
  // Query key will be joined with "/" to form: /api/requests/:requestId/interested-transporters
  const { data: interestedTransporters, isLoading } = useQuery<any[]>({
    queryKey: [`/api/requests/${request.id}/interested-transporters`],
    enabled: !!request.id,
  });
  
  const transporterInterests = interestedTransporters || [];

  // State for managing truck photo viewing
  const [selectedTruckPhoto, setSelectedTruckPhoto] = useState<string | null>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);

  // Mutation to toggle transporter visibility for client
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ interestId, hidden }: { interestId: string; hidden: boolean }) => {
      const response = await fetch('/api/coordinator/toggle-transporter-visibility', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interestId, hidden }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors du basculement de visibilité');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/requests/${request.id}/interested-transporters`] });
      toast({
        title: "Visibilité mise à jour",
        description: "La visibilité du transporteur a été modifiée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier la visibilité",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-3 opacity-50 animate-pulse" />
        <p>Chargement des transporteurs intéressés...</p>
      </div>
    );
  }

  if (transporterInterests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground" data-testid="text-no-interested">
        <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Aucun transporteur intéressé pour cette commande</p>
      </div>
    );
  }

  const handleViewTruckPhoto = (truckPhotos: string[] | null) => {
    const photo = truckPhotos && truckPhotos.length > 0 ? truckPhotos[0] : null;
    setSelectedTruckPhoto(photo);
    setPhotoDialogOpen(true);
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 mt-4" data-testid="grid-interested">
        {transporterInterests.map((transporter: any) => (
          <Card key={transporter.id} className="overflow-hidden" data-testid={`card-interested-${transporter.id}`}>
            <CardContent className="p-4 space-y-3">
              {/* Truck Photo Button */}
              {transporter.truckPhotos && transporter.truckPhotos.length > 0 && (
                <div className="mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => handleViewTruckPhoto(transporter.truckPhotos)}
                    data-testid={`button-view-truck-photo-${transporter.id}`}
                  >
                    <Truck className="h-4 w-4" />
                    Voir photo du camion
                  </Button>
                </div>
              )}

              {/* Transporter Info */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Truck className="h-4 w-4 text-[#17cfcf]" />
                    <h4 className="font-semibold" data-testid={`text-transporter-name-${transporter.id}`}>
                      {transporter.name || "Transporteur"}
                    </h4>
                  </div>
                  {transporter.city && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {transporter.city}
                    </p>
                  )}
                  {transporter.rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{parseFloat(transporter.rating).toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <Badge className="bg-[#17cfcf]/10 text-[#17cfcf] border-[#17cfcf]/30">
                    Intéressé
                  </Badge>
                  {transporter.hiddenFromClient && (
                    <Badge variant="outline" className="text-xs">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Masqué
                    </Badge>
                  )}
                </div>
              </div>

              {/* Availability Date Badge */}
              {transporter.availabilityDate && request.dateTime && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    {isSameDay(new Date(transporter.availabilityDate), new Date(request.dateTime)) ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                        ✓ {format(new Date(transporter.availabilityDate), "d MMM yyyy", { locale: fr })} - Correspond à la date souhaitée
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                        ℹ️ {format(new Date(transporter.availabilityDate), "d MMM yyyy", { locale: fr })} - Date alternative
                      </Badge>
                    )}
                  </div>
                </div>
              )}

            {/* Contact Info - Visible for Coordinator */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Contact Transporteur</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-[#17cfcf]" />
                  <a 
                    href={`tel:${transporter.phoneNumber}`}
                    className="text-sm text-[#17cfcf] hover:underline font-medium"
                    data-testid={`link-call-transporter-${transporter.id}`}
                  >
                    {transporter.phoneNumber}
                  </a>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => {
                    const message = encodeURIComponent(
                      `Bonjour 👋,\nJe suis coordinateur CamionBack.\nJe souhaite discuter de votre intérêt pour cette commande.`
                    );
                    // Normalize phone number: remove spaces, dashes, and + sign
                    const normalizedPhone = transporter.phoneNumber.replace(/[\s\-\+]/g, "");
                    window.open(`https://wa.me/${normalizedPhone}?text=${message}`, "_blank");
                  }}
                  data-testid={`button-whatsapp-transporter-${transporter.id}`}
                >
                  🟢 WhatsApp
                </Button>
              </div>
            </div>

            {/* Price Information */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Montant transporteur:</span>
                <span className="font-medium">{request.transporterAmount || 0} DH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Commission plateforme:</span>
                <span className="font-medium text-orange-600">+{request.platformFee || 0} DH</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-semibold">Total client:</span>
                <span className="text-lg font-bold text-[#17cfcf]">{request.clientTotal || 0} DH</span>
              </div>
            </div>

            {/* Toggle Visibility Button */}
            {transporter.interestId && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  toggleVisibilityMutation.mutate({
                    interestId: transporter.interestId,
                    hidden: !transporter.hiddenFromClient,
                  });
                }}
                disabled={toggleVisibilityMutation.isPending}
                data-testid={`button-toggle-visibility-${transporter.id}`}
              >
                {transporter.hiddenFromClient ? (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Afficher au client
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Masquer au client
                  </>
                )}
              </Button>
            )}

            <Button
              className="w-full bg-[#17cfcf] hover:bg-[#13b3b3]"
              onClick={() => onAssignTransporter(transporter.id)}
              disabled={isPending}
              data-testid={`button-assign-transporter-${transporter.id}`}
            >
              <Truck className="h-4 w-4 mr-2" />
              {isPending ? "Assignation..." : "Assigner ce transporteur"}
            </Button>
          </CardContent>
        </Card>
      ))}
      </div>

      {/* Truck Photo Dialog */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Photo du camion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTruckPhoto ? (
              <img 
                src={selectedTruckPhoto} 
                alt="Camion" 
                className="w-full h-auto rounded-md"
              />
            ) : (
              <div className="flex items-center justify-center h-64 bg-muted rounded-md">
                <p className="text-muted-foreground">Aucune photo disponible</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function CoordinatorDashboard() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading, logout } = useAuth();
  const { t } = useTranslation();

  // Force French language and LTR direction for Coordinator dashboard
  useForceFrenchLayout();

  // Adaptive filters state by tab
  const [activeTab, setActiveTab] = useState<TabId>('nouveau');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [filters, setFilters] = useState<FiltersByTab>({
    nouveau: getDefaultFilters('nouveau'),
    qualifies: getDefaultFilters('qualifies'),
    interesses: getDefaultFilters('interesses'),
    production: getDefaultFilters('production'),
    archives: getDefaultFilters('archives'),
  });
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<{ client: any; transporter: any } | null>(null);
  const [chatRequestId, setChatRequestId] = useState<string>("");
  const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [selectedReferenceId, setSelectedReferenceId] = useState("");
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [offersDialogOpen, setOffersDialogOpen] = useState(false);
  const [selectedRequestForOffers, setSelectedRequestForOffers] = useState<any>(null);
  const [interestedTransportersDialogOpen, setInterestedTransportersDialogOpen] = useState(false);
  const [selectedRequestForInterested, setSelectedRequestForInterested] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [loadedTruckPhotos, setLoadedTruckPhotos] = useState<Record<string, string[] | null>>({});
  const [loadingTruckPhotos, setLoadingTruckPhotos] = useState<Record<string, boolean>>({});
  const [truckPhotoDialogOpen, setTruckPhotoDialogOpen] = useState(false);
  const [selectedTruckPhoto, setSelectedTruckPhoto] = useState<string | null>(null);
  const [assignOrderDialogOpen, setAssignOrderDialogOpen] = useState(false);
  const [selectedEmptyReturn, setSelectedEmptyReturn] = useState<any>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const [coordinationDialogOpen, setCoordinationDialogOpen] = useState(false);
  const [selectedRequestForCoordination, setSelectedRequestForCoordination] = useState<any>(null);
  const [selectedCoordinationStatus, setSelectedCoordinationStatus] = useState("");
  const [coordinationReason, setCoordinationReason] = useState("");
  const [coordinationReminderDate, setCoordinationReminderDate] = useState("");
  const [deleteRequestId, setDeleteRequestId] = useState<string | null>(null);
  const [manualAssignmentDialogOpen, setManualAssignmentDialogOpen] = useState(false);
  const [selectedRequestForAssignment, setSelectedRequestForAssignment] = useState<any>(null);
  const [qualificationDialogOpen, setQualificationDialogOpen] = useState(false);
  const [selectedRequestForQualification, setSelectedRequestForQualification] = useState<any>(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [archiveRequestData, setArchiveRequestData] = useState<any>(null);
  const [truckPhotosDialogOpen, setTruckPhotosDialogOpen] = useState(false);
  const [selectedTruckPhotos, setSelectedTruckPhotos] = useState<any[]>([]);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelRequestData, setCancelRequestData] = useState<any>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [requalifyDialogOpen, setRequalifyDialogOpen] = useState(false);
  const [requalifyRequestData, setRequalifyRequestData] = useState<any>(null);
  const [requalificationReason, setRequalificationReason] = useState("");
  
  // New unified Payment Dialog states
  const [showCoordinatorPaymentDialog, setShowCoordinatorPaymentDialog] = useState(false);
  const [coordinatorPaymentRequestId, setCoordinatorPaymentRequestId] = useState<string | null>(null);
  
  const { toast} = useToast();

  const handleLogout = () => {
    logout();
  };

  // Handle coordinator payment - opens unified payment dialog
  const handleCoordinatorPayment = (requestId: string) => {
    setCoordinatorPaymentRequestId(requestId);
    setShowCoordinatorPaymentDialog(true);
  };

  // Fetch all available requests (open status)
  const { data: availableRequests = [], isLoading: availableLoading } = useQuery({
    queryKey: ["/api/coordinator/available-requests"],
    queryFn: async () => {
      const response = await fetch("/api/coordinator/available-requests");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch requests in progress (accepted status)
  const { data: activeRequests = [], isLoading: activeLoading } = useQuery({
    queryKey: ["/api/coordinator/active-requests"],
    queryFn: async () => {
      const response = await fetch("/api/coordinator/active-requests");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch payment pending requests
  const { data: paymentRequests = [], isLoading: paymentLoading } = useQuery({
    queryKey: ["/api/coordinator/payment-requests"],
    queryFn: async () => {
      const response = await fetch("/api/coordinator/payment-requests");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch cities for filtering
  const { data: cities = [] } = useQuery({
    queryKey: ["/api/cities"],
    queryFn: async () => {
      const response = await fetch("/api/cities");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch coordinators for filtering
  const { data: coordinators = [] } = useQuery({
    queryKey: ["/api/coordinators"],
    enabled: !!user?.id,
    queryFn: async () => {
      const response = await fetch(`/api/coordinators`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch empty returns for coordinator
  const { data: emptyReturns = [], isLoading: emptyReturnsLoading } = useQuery({
    queryKey: ["/api/empty-returns"],
    queryFn: async () => {
      const response = await fetch("/api/empty-returns");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // NEW WORKFLOW: "Nouveau" devient "À qualifier" avec status qualification_pending
  const { data: nouveauRequests = [], isLoading: nouveauLoading } = useQuery({
    queryKey: ["/api/coordinator/qualification-pending"],
    queryFn: async () => {
      const response = await fetch("/api/coordinator/qualification-pending");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: enActionRequests = [], isLoading: enActionLoading } = useQuery({
    queryKey: ["/api/coordinator/coordination/en-action"],
    queryFn: async () => {
      const response = await fetch("/api/coordinator/coordination/en-action");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: prioritairesRequests = [], isLoading: prioritairesLoading } = useQuery({
    queryKey: ["/api/coordinator/coordination/prioritaires"],
    queryFn: async () => {
      const response = await fetch("/api/coordinator/coordination/prioritaires");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: archivesRequests = [], isLoading: archivesLoading } = useQuery({
    queryKey: ["/api/coordinator/coordination/archives"],
    queryFn: async () => {
      const response = await fetch("/api/coordinator/coordination/archives");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch all coordinators for filters
  const { data: allCoordinators = [] } = useQuery({
    queryKey: ["/api/coordinators"],
    queryFn: async () => {
      const response = await fetch("/api/coordinators");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch matching requests (published_for_matching status)
  const { data: matchingRequests = [], isLoading: matchingLoading } = useQuery({
    queryKey: ["/api/coordinator/matching-requests"],
    queryFn: async () => {
      const response = await fetch("/api/coordinator/matching-requests");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch coordination statuses
  const { data: coordinationStatuses = [], isLoading: statusesLoading } = useQuery({
    queryKey: ["/api/admin/coordination-statuses"],
    enabled: !!user?.id,
    queryFn: async () => {
      const response = await fetch(`/api/admin/coordination-statuses?userId=${user!.id}`);
      const data = await response.json();
      // Protection: toujours retourner un tableau, même en cas d'erreur
      return Array.isArray(data) ? data : [];
    },
  });

  // Toggle request visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ requestId, isHidden }: { requestId: string; isHidden: boolean }) => {
      return apiRequest("PATCH", `/api/coordinator/requests/${requestId}/toggle-visibility`, { isHidden });
    },
    onMutate: async ({ requestId, isHidden }) => {
      // Annuler toutes les requêtes de coordination en cours
      await queryClient.cancelQueries({ predicate: (query) => 
        query.queryKey[0] === "/api/coordinator/qualification-pending" ||
        query.queryKey[0] === "/api/coordinator/matching-requests" ||
        query.queryKey[0] === "/api/coordinator/coordination/en-action" ||
        query.queryKey[0] === "/api/coordinator/coordination/prioritaires" ||
        query.queryKey[0] === "/api/coordinator/coordination/archives"
      });
      
      // Fonction de mise à jour optimiste
      const updateCache = (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((req: any) => 
          req.id === requestId ? { ...req, isHidden } : req
        );
      };
      
      // Mettre à jour toutes les requêtes qui correspondent aux patterns
      queryClient.setQueriesData(
        { predicate: (query) => query.queryKey[0] === "/api/coordinator/qualification-pending" },
        updateCache
      );
      queryClient.setQueriesData(
        { predicate: (query) => query.queryKey[0] === "/api/coordinator/matching-requests" },
        updateCache
      );
      queryClient.setQueriesData(
        { predicate: (query) => query.queryKey[0] === "/api/coordinator/coordination/en-action" },
        updateCache
      );
      queryClient.setQueriesData(
        { predicate: (query) => query.queryKey[0] === "/api/coordinator/coordination/prioritaires" },
        updateCache
      );
      queryClient.setQueriesData(
        { predicate: (query) => query.queryKey[0] === "/api/coordinator/coordination/archives" },
        updateCache
      );
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Visibilité de la commande modifiée",
      });
    },
    onError: () => {
      // Invalider toutes les queries pour recharger les données en cas d'erreur
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0] === "/api/coordinator/qualification-pending" ||
        query.queryKey[0] === "/api/coordinator/matching-requests" ||
        query.queryKey[0] === "/api/coordinator/coordination/en-action" ||
        query.queryKey[0] === "/api/coordinator/coordination/prioritaires" ||
        query.queryKey[0] === "/api/coordinator/coordination/archives"
      });
      
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de modification de la visibilité",
      });
    },
  });

  // Update payment status mutation
  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ requestId, paymentStatus }: { requestId: string; paymentStatus: string }) => {
      return apiRequest("PATCH", `/api/coordinator/requests/${requestId}/payment-status`, { paymentStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/payment-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/active-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "Succès",
        description: "Statut de paiement mis à jour",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de mise à jour du statut",
      });
    },
  });


  // Accept offer mutation for coordinator
  const acceptOfferMutation = useMutation({
    mutationFn: async (offerId: string) => {
      return apiRequest("POST", `/api/coordinator/offers/${offerId}/accept`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/available-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/active-requests"] });
      toast({
        title: "Offre acceptée",
        description: "L'offre a été acceptée avec succès au nom du client",
      });
      setOffersDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible d'accepter l'offre",
      });
    },
  });

  // Self-assign coordinator mutation
  const assignToMeMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return apiRequest("POST", `/api/coordinator/assign-to-me/${requestId}`, {});
    },
    onSuccess: () => {
      // Invalider toutes les queries de coordination
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/qualification-pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/matching-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/available-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/active-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/coordination/en-action"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/coordination/prioritaires"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/coordination/archives"] });
      toast({
        title: "Succès",
        description: "Commande assignée à vous",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de s'assigner à cette commande",
      });
    },
  });

  // Unassign coordinator mutation
  const unassignFromMeMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return apiRequest("DELETE", `/api/coordinator/unassign-from-me/${requestId}`, {});
    },
    onSuccess: () => {
      // Invalider toutes les queries de coordination
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/qualification-pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/matching-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/available-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/active-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/coordination/en-action"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/coordination/prioritaires"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/coordination/archives"] });
      toast({
        title: "Succès",
        description: "Désassignation effectuée",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de se désassigner",
      });
    },
  });

  // Update request details mutation (coordinator complete edit)
  const updateRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const { requestId, ...updates } = data;
      return apiRequest("PATCH", `/api/coordinator/requests/${requestId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/available-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/active-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/payment-requests"] });
      toast({
        title: "Commande modifiée",
        description: "La commande a été mise à jour avec succès",
      });
      setEditDialogOpen(false);
      setDetailsDialogOpen(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de la modification de la commande",
      });
    },
  });

  // Assign order to empty return mutation
  const assignOrderMutation = useMutation({
    mutationFn: async ({ emptyReturnId, requestId }: { emptyReturnId: string; requestId: string }) => {
      return await apiRequest("POST", `/api/empty-returns/${emptyReturnId}/assign`, {
        requestId,
      });
    },
    onSuccess: () => {
      toast({
        title: "Commande affectée",
        description: "La commande a été affectée au transporteur avec succès",
      });
      setAssignOrderDialogOpen(false);
      setSelectedEmptyReturn(null);
      queryClient.invalidateQueries({ queryKey: ["/api/empty-returns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/available-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/active-requests"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de l'affectation de la commande",
      });
    },
  });

  // Update coordination status mutation
  const updateCoordinationStatusMutation = useMutation({
    mutationFn: async ({
      requestId,
      coordinationStatus,
      coordinationReason,
      coordinationReminderDate,
    }: {
      requestId: string;
      coordinationStatus: string;
      coordinationReason?: string | null;
      coordinationReminderDate?: Date | null;
    }) => {
      return apiRequest("PATCH", `/api/coordinator/requests/${requestId}/coordination-status`, {
        coordinationStatus,
        coordinationReason,
        coordinationReminderDate,
        coordinatorId: user!.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Statut mis à jour",
        description: "Le statut de coordination a été mis à jour",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/qualification-pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/coordination/en-action"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/coordination/prioritaires"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/coordination/archives"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de la mise à jour du statut",
      });
    },
  });

  // Delete request mutation
  const deleteRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return apiRequest("DELETE", `/api/requests/${requestId}`);
    },
    onSuccess: () => {
      toast({
        title: "Commande supprimée",
        description: "La commande a été supprimée avec succès",
      });
      setDeleteRequestId(null);
      // Invalidate all coordinator queries
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/qualification-pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/coordination/en-action"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/coordination/prioritaires"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/coordination/archives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/available-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/active-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/payment-requests"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de la suppression de la commande",
      });
    },
  });

  // Archive request mutation
  const archiveRequestMutation = useMutation({
    mutationFn: async ({ requestId, archiveReason, archiveComment }: { requestId: string; archiveReason: string; archiveComment?: string }) => {
      return apiRequest("PATCH", `/api/coordinator/requests/${requestId}/archive`, {
        archiveReason,
        archiveComment,
      });
    },
    onSuccess: () => {
      toast({
        title: "Commande archivée",
        description: "La commande a été archivée avec succès",
      });
      setArchiveDialogOpen(false);
      setArchiveRequestData(null);
      // Invalidate all coordinator queries
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/qualification-pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/coordination/en-action"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/coordination/prioritaires"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/coordination/archives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/available-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/active-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/payment-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/matching-requests"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de l'archivage de la commande",
      });
    },
  });

  // Republish request mutation
  const republishRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return apiRequest("POST", `/api/coordinator/requests/${requestId}/republish`, {});
    },
    onSuccess: () => {
      toast({
        title: "Commande republiée",
        description: "La commande a été republiée avec succès et apparaîtra dans l'onglet Nouveau",
      });
      // Invalidate all coordinator queries to refresh the views
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/qualification-pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/coordination/archives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/available-requests"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de la republication de la commande",
      });
    },
  });

  // Cancel request mutation
  const cancelRequestMutation = useMutation({
    mutationFn: async ({ requestId, cancellationReason }: { requestId: string; cancellationReason: string }) => {
      return apiRequest("PATCH", `/api/coordinator/requests/${requestId}/cancel`, {
        cancellationReason,
      });
    },
    onSuccess: () => {
      toast({
        title: "Commande annulée",
        description: "La commande a été annulée avec succès et retirée des vues transporteurs",
      });
      setCancelDialogOpen(false);
      setCancelRequestData(null);
      setCancellationReason("");
      // Invalidate all queries
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/matching-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/available-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de l'annulation de la commande",
      });
    },
  });

  // Requalify request mutation - Cancel and republish for matching
  const requalifyRequestMutation = useMutation({
    mutationFn: async ({ requestId, requalificationReason }: { requestId: string; requalificationReason: string }) => {
      return apiRequest("POST", `/api/coordinator/requests/${requestId}/cancel-and-requalify`, {
        requalificationReason,
      });
    },
    onSuccess: () => {
      toast({
        title: "Commande requalifiée",
        description: "La commande a été annulée et republiée pour matching avec les transporteurs",
      });
      setRequalifyDialogOpen(false);
      setRequalifyRequestData(null);
      setRequalificationReason("");
      // Invalidate all queries to refresh views
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/active-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/payment-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/qualified-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/interested-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/matching-requests"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de la requalification de la commande",
      });
    },
  });

  // Assign transporter mutation for interested transporters
  const assignMutation = useMutation({
    mutationFn: async (data: { requestId: string; transporterId: string; transporterAmount: number; platformFee: number }) => {
      return await apiRequest("POST", "/api/coordinator/assign-transporter", data);
    },
    onSuccess: () => {
      toast({
        title: "Transporteur assigné !",
        description: "Le transporteur a été assigné avec succès à cette commande.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/matching-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/active-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/coordination/en-action"] });
      setInterestedTransportersDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible d'assigner le transporteur",
      });
    },
  });

  // Redirect to login if not authenticated or not coordinator (after all hooks)
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "coordinateur")) {
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);

  // Show loading while checking auth (after all hooks)
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0A2540] to-[#163049]">
        <LoadingTruck message="Chargement..." />
      </div>
    );
  }

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    setDetailsDialogOpen(true);
  };

  const handleOpenEdit = (request: any) => {
    setEditFormData({
      requestId: request.id,
      fromCity: request.fromCity,
      toCity: request.toCity,
      departureAddress: request.departureAddress || request.fromCity || '',
      arrivalAddress: request.arrivalAddress || request.toCity || '',
      description: request.description,
      dateTime: request.dateTime,
      photos: request.photos || [],
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (!editFormData) return;
    updateRequestMutation.mutate(editFormData);
  };

  const handleAddPhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e: any) => {
      const files = Array.from(e.target.files);
      files.forEach((file: any) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target && event.target.result) {
            setEditFormData((prev: any) => ({
              ...prev,
              photos: [...(prev.photos || []), event.target!.result as string],
            }));
          }
        };
        reader.readAsDataURL(file);
      });
    };
    input.click();
  };

  const handleRemovePhoto = (index: number) => {
    setEditFormData((prev: any) => ({
      ...prev,
      photos: prev.photos.filter((_: any, i: number) => i !== index),
    }));
  };

  const handleLoadTruckPhotos = async (transporterId: string) => {
    // Check if photos are already cached
    if (loadedTruckPhotos[transporterId] !== undefined) {
      // Photos already loaded, just show them
      if (loadedTruckPhotos[transporterId] && loadedTruckPhotos[transporterId]!.length > 0) {
        setSelectedTruckPhoto(loadedTruckPhotos[transporterId]![0]);
        setTruckPhotoDialogOpen(true);
      } else {
        toast({
          title: "Aucune photo",
          description: "Ce transporteur n'a pas encore ajouté de photo de camion",
        });
      }
      return;
    }

    // Start loading
    setLoadingTruckPhotos(prev => ({ ...prev, [transporterId]: true }));

    try {
      const response = await fetch(`/api/admin/transporter-photos/${transporterId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const photos = data.truckPhotos || [];
      
      // Cache the photos (even if empty array)
      setLoadedTruckPhotos(prev => ({ ...prev, [transporterId]: photos }));
      setLoadingTruckPhotos(prev => ({ ...prev, [transporterId]: false }));

      if (photos.length > 0) {
        setSelectedTruckPhoto(photos[0]);
        setTruckPhotoDialogOpen(true);
      } else {
        toast({
          title: "Aucune photo",
          description: "Ce transporteur n'a pas encore ajouté de photo de camion",
        });
      }
    } catch (error: any) {
      setLoadingTruckPhotos(prev => ({ ...prev, [transporterId]: false }));
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: error.message || "Impossible de charger les photos. Réessayez.",
      });
    }
  };

  const handleOpenChat = (client: any, transporter: any, requestId: string) => {
    setSelectedParticipants({ client, transporter });
    setChatRequestId(requestId);
    setChatOpen(true);
  };

  const handleViewPhotos = (photos: string[], referenceId?: string) => {
    setSelectedPhotos(photos);
    setSelectedReferenceId(referenceId || "");
    setPhotoGalleryOpen(true);
  };

  const handleArchiveRequest = () => {
    if (!archiveRequestData) return;
    archiveRequestMutation.mutate({
      requestId: archiveRequestData.requestId,
      archiveReason: archiveRequestData.archiveReason,
      archiveComment: archiveRequestData.archiveComment,
    });
  };

  const handleRepublishRequest = (requestId: string) => {
    republishRequestMutation.mutate(requestId);
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "À facturer", variant: "outline" },
      awaiting_payment: { label: "En attente", variant: "secondary" },
      pending_admin_validation: { label: "Validation admin", variant: "default" },
      paid: { label: "Payé", variant: "default" },
    };
    const statusInfo = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getRequestStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      open: { label: "Ouvert", variant: "default" },
      accepted: { label: "Accepté", variant: "default" },
      completed: { label: "Terminé", variant: "default" },
      cancelled: { label: "Annulé", variant: "destructive" },
    };
    const statusInfo = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const handleWhatsAppContact = (phoneNumber: string, referenceId: string) => {
    const message = encodeURIComponent(
      `Bonjour 👋,\nJe suis coordinateur CamionBack.\nJe souhaite coordonner avec vous au sujet de la commande référence ${referenceId}.`
    );
    window.open(`https://wa.me/${phoneNumber.replace(/\+/g, "")}?text=${message}`, "_blank");
  };

  const handleWhatsAppContactClient = (phoneNumber: string, referenceId: string) => {
    const message = encodeURIComponent(
      `Bonjour 👋,\nJe suis coordinateur CamionBack.\nJe souhaite vous aider à trouver un transporteur pour votre commande référence ${referenceId}.\nComment puis-je vous assister ?`
    );
    window.open(`https://wa.me/${phoneNumber.replace(/\+/g, "")}?text=${message}`, "_blank");
  };

  const handleViewOffers = (request: any) => {
    setSelectedRequestForOffers(request);
    setOffersDialogOpen(true);
  };

  const handleViewInterestedTransporters = (request: any) => {
    setSelectedRequestForInterested(request);
    setInterestedTransportersDialogOpen(true);
  };

  // Helper function to deduplicate requests by ID
  const deduplicateRequests = (requests: any[]) => {
    const seen = new Set();
    return requests.filter((request) => {
      if (seen.has(request.id)) {
        return false;
      }
      seen.add(request.id);
      return true;
    });
  };

  const filterRequests = (requests: any[], tabFilters: TabFilters = filters[activeTab], applyStatusFilter = true) => {
    if (!requests || !Array.isArray(requests)) {
      return [];
    }
    // Deduplicate before filtering
    const uniqueRequests = deduplicateRequests(requests);
    return uniqueRequests.filter((request) => {
      const matchesCity = tabFilters.selectedCity === "Toutes les villes" || 
        request.fromCity === tabFilters.selectedCity || 
        request.toCity === tabFilters.selectedCity;
      const matchesStatus = !applyStatusFilter || !tabFilters.selectedStatus || tabFilters.selectedStatus === "Tous les statuts" || 
        request.status === tabFilters.selectedStatus;
      const matchesSearch = tabFilters.searchQuery === "" ||
        request.referenceId.toLowerCase().includes(tabFilters.searchQuery.toLowerCase()) ||
        (request.client?.name && request.client.name.toLowerCase().includes(tabFilters.searchQuery.toLowerCase())) ||
        (request.transporter?.name && request.transporter.name.toLowerCase().includes(tabFilters.searchQuery.toLowerCase()));
      
      // Date filtering
      const matchesDate = (() => {
        if (!tabFilters.selectedDateFilter || tabFilters.selectedDateFilter === "all") return true;
        const requestDate = new Date(request.createdAt);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (tabFilters.selectedDateFilter) {
          case "today":
            return requestDate >= today;
          case "week": {
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            return requestDate >= weekAgo;
          }
          case "month": {
            const monthAgo = new Date(today);
            monthAgo.setMonth(today.getMonth() - 1);
            return requestDate >= monthAgo;
          }
          default:
            return true;
        }
      })();

      // Coordinator filtering (for nouveau tab)
      const matchesCoordinator = !tabFilters.selectedCoordinator || tabFilters.selectedCoordinator === "Tous les coordinateurs" || 
        (request.coordinationUpdatedBy && (
          request.coordinationUpdatedBy.name === tabFilters.selectedCoordinator ||
          request.coordinationUpdatedBy.phoneNumber === tabFilters.selectedCoordinator
        )) ||
        (request.assignedTo && (
          request.assignedTo.name === tabFilters.selectedCoordinator ||
          request.assignedTo.phoneNumber === tabFilters.selectedCoordinator
        ));

      // Min interested filtering (for interesses tab)
      const matchesMinInterested = !tabFilters.minInterested || 
        (request.transporterInterests && request.transporterInterests.length >= tabFilters.minInterested);

      // Payment status filtering (for production tab)
      const matchesPaymentStatus = !tabFilters.selectedPaymentStatus || tabFilters.selectedPaymentStatus === "Tous les statuts" ||
        request.paymentMethod === tabFilters.selectedPaymentStatus;

      // Archive reason filtering (for archives tab)
      const matchesArchiveReason = !tabFilters.selectedArchiveReason || tabFilters.selectedArchiveReason === "Toutes les raisons" ||
        request.archiveReason === tabFilters.selectedArchiveReason;
      
      return matchesCity && matchesStatus && matchesSearch && matchesDate && matchesCoordinator && matchesMinInterested && matchesPaymentStatus && matchesArchiveReason;
    });
  };

  const handleOpenCoordinationDialog = (request: any) => {
    setSelectedRequestForCoordination(request);
    setSelectedCoordinationStatus(request.coordinationStatus || "nouveau");
    setCoordinationReason(request.coordinationReason || "");
    setCoordinationReminderDate(request.coordinationReminderDate ? format(new Date(request.coordinationReminderDate), "yyyy-MM-dd") : "");
    setCoordinationDialogOpen(true);
  };

  const handleUpdateCoordinationStatus = () => {
    if (!selectedRequestForCoordination) return;

    updateCoordinationStatusMutation.mutate({
      requestId: selectedRequestForCoordination.id,
      coordinationStatus: selectedCoordinationStatus,
      coordinationReason: coordinationReason || null,
      coordinationReminderDate: coordinationReminderDate ? new Date(coordinationReminderDate) : null,
    });

    setCoordinationDialogOpen(false);
    setSelectedRequestForCoordination(null);
  };

  const handleCopyShareLink = (shareToken: string) => {
    const shareUrl = `${window.location.origin}/public/request/${shareToken}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({
        title: "Lien copié !",
        description: "Le lien de partage a été copié dans le presse-papiers.",
      });
    }).catch(() => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de copier le lien.",
      });
    });
  };

  const handleShareViaWhatsApp = (shareToken: string, referenceId: string) => {
    const shareUrl = `${window.location.origin}/public/request/${shareToken}`;
    const message = encodeURIComponent(
      `🚚 Commande CamionBack ${referenceId}\n\nConsultez les détails complets de cette commande :\n${shareUrl}`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  // Handler for payment receipt upload
  const handleOpenManualAssignment = (request: any) => {
    setSelectedRequestForAssignment(request);
    setManualAssignmentDialogOpen(true);
  };

  const handleManualAssignmentSuccess = () => {
    toast({
      title: "Transporteur assigné !",
      description: "Le transporteur a été assigné avec succès à cette commande.",
    });
    queryClient.invalidateQueries({ queryKey: ["/api/coordinator/available-requests"] });
    queryClient.invalidateQueries({ queryKey: ["/api/coordinator/active-requests"] });
    queryClient.invalidateQueries({ queryKey: ["/api/coordinator/matching-requests"] });
    queryClient.invalidateQueries({ queryKey: ["/api/coordinator/coordination-requests"] });
  };

  // NEW: Handler for opening qualification dialog
  const handleOpenQualificationDialog = (request: any) => {
    setSelectedRequestForQualification(request);
    setQualificationDialogOpen(true);
  };

  const handleQualificationSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/coordinator/qualification-pending"] });
    queryClient.invalidateQueries({ queryKey: ["/api/coordinator/coordination/en-action"] });
    queryClient.invalidateQueries({ queryKey: ["/api/coordinator/matching-requests"] });
  };

  // Request Notes Component - Internal coordinator notes
  const RequestNotes = ({ requestId }: { requestId: string }) => {
    const [noteContent, setNoteContent] = useState("");
    const [showNotes, setShowNotes] = useState(false);
    
    // Fetch notes for this request
    const { data: notes = [], isLoading } = useQuery<any[]>({
      queryKey: ["/api/coordinator/requests", requestId, "notes"],
      enabled: showNotes,
    });
    
    // Create note mutation
    const createNoteMutation = useMutation({
      mutationFn: async (content: string) => {
        const response = await fetch(`/api/coordinator/requests/${requestId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erreur lors de l'ajout de la note");
        }
        return response.json();
      },
      onSuccess: () => {
        setNoteContent("");
        queryClient.invalidateQueries({ queryKey: ["/api/coordinator/requests", requestId, "notes"] });
        toast({
          title: "Note ajoutée",
          description: "La note interne a été enregistrée avec succès.",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Erreur",
          description: error.message || "Impossible d'ajouter la note",
          variant: "destructive",
        });
      },
    });
    
    const handleAddNote = () => {
      if (noteContent.trim()) {
        createNoteMutation.mutate(noteContent.trim());
      }
    };
    
    return (
      <div className="border-t pt-4 space-y-3">
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg hover-elevate active-elevate-2 transition-all group bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/30"
          data-testid={`button-toggle-notes-${requestId}`}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 shadow-sm">
              <StickyNote className="h-4 w-4 text-white" />
            </div>
            <span className="font-medium text-sm text-foreground">
              Notes internes
            </span>
          </div>
          <div className="flex items-center gap-2">
            {notes && notes.length > 0 && (
              <Badge className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 font-semibold shadow-sm px-2.5 py-0.5">
                {notes.length}
              </Badge>
            )}
            {showNotes ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground transition-transform" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
            )}
          </div>
        </button>
        
        {showNotes && (
          <div className="space-y-3 pl-6">
            {/* Add note form */}
            <div className="space-y-2">
              <Textarea
                placeholder="Ajouter une note interne (visible uniquement par les coordinateurs)..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="resize-none text-sm"
                rows={3}
                data-testid={`textarea-note-${requestId}`}
              />
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={!noteContent.trim() || createNoteMutation.isPending}
                className="bg-[#17cfcf] hover:bg-[#14b8b8] text-white"
                data-testid={`button-add-note-${requestId}`}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Ajouter la note
              </Button>
            </div>
            
            {/* Notes history */}
            {isLoading && (
              <div className="text-sm text-muted-foreground">Chargement des notes...</div>
            )}
            
            {notes && notes.length > 0 && (
              <div className="space-y-2">
                {notes.map((note: any) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-lg bg-muted/50 border text-sm space-y-1"
                    data-testid={`note-${note.id}`}
                  >
                    <p className="whitespace-pre-wrap">{note.content}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t">
                      <span className="font-medium">
                        {note.coordinator?.name || note.coordinator?.phoneNumber || "Coordinateur"}
                      </span>
                      <span>•</span>
                      <span>
                        {format(new Date(note.createdAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {notes && notes.length === 0 && !isLoading && (
              <p className="text-sm text-muted-foreground">Aucune note pour cette demande</p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderRequestCard = (request: any, showVisibilityToggle = false, showPaymentControls = false, isCoordination = false, showQualifyButton = false, showQualifiedBy = false, showRepublishButton = false, showPaymentStatusSelector = false) => {
    // Calculate interested count
    const interestedCount = request.transporterInterests?.length || 0;
    // Get client-friendly status
    const clientStatus = getClientStatus(request, interestedCount);
    
    // Get coordinator who qualified/assigned this request
    // The coordinator data is already in request.coordinationUpdatedBy or request.assignedTo as an object
    const qualifiedBy = showQualifiedBy 
      ? (request.coordinationUpdatedBy || request.assignedTo)
      : null;

    // Calculate coordinator assignment state
    const isAssignedToMe = request.assignedToId === user?.id;
    const isAssignedToOther = request.assignedToId && request.assignedToId !== user?.id;
    const isUnassigned = !request.assignedToId;

    // Get category config
    const categoryConfig = getCategoryConfig(request.goodsType);
    const CategoryIcon = categoryConfig.icon;

    // Check if departure is within 24 hours
    const departureDate = new Date(request.dateTime);
    const now = new Date();
    const hoursUntilDeparture = (departureDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isUrgent = hoursUntilDeparture > 0 && hoursUntilDeparture <= 24;

    // Get "Plus de détails" toggle state from parent component state
    const showFullDescription = expandedDescriptions[request.id] || false;
    const toggleDescription = () => {
      setExpandedDescriptions((prev) => ({
        ...prev,
        [request.id]: !prev[request.id],
      }));
    };

    return (
    <Card key={request.id} className={`hover-elevate overflow-hidden border-2 ${categoryConfig.borderColor}`} data-testid={`card-request-${request.id}`}>
      {/* En-tête coloré avec icône de catégorie - Style transporteur */}
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
                {format(new Date(request.dateTime), "dd MMM yyyy", { locale: fr })}
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
          
          {/* Bouton photos si disponible */}
          {request.photos && request.photos.length > 0 && (
            <Button
              size="sm"
              className="h-6 text-xs gap-1.5 bg-white/20 hover:bg-white/30 text-white border border-white/40 hover:border-white/60 transition-all font-medium"
              onClick={() => handleViewPhotos(request.photos)}
              data-testid={`button-view-photos-header-${request.id}`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{request.photos.length}</span>
            </Button>
          )}
          
          {/* Menu Actions Secondaires - En haut à droite */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0 bg-white/20 hover:bg-white/30"
                data-testid={`button-more-actions-${request.id}`}
              >
                <MoreVertical className="h-4 w-4 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleViewDetails(request)}
                data-testid={`menu-view-details-${request.id}`}
              >
                <Eye className="h-4 w-4 mr-2" />
                Détails
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleOpenEdit(request)}
                data-testid={`menu-edit-request-${request.id}`}
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              {request.photos && request.photos.length > 0 && (
                <DropdownMenuItem
                  onClick={() => handleViewPhotos(request.photos)}
                  data-testid={`menu-view-photos-${request.id}`}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Photos ({request.photos.length})
                </DropdownMenuItem>
              )}
              {request.shareToken && (
                <>
                  <DropdownMenuItem
                    onClick={() => handleCopyShareLink(request.shareToken)}
                    data-testid={`menu-copy-link-${request.id}`}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copier le lien
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleShareViaWhatsApp(request.shareToken, request.referenceId)}
                    data-testid={`menu-share-whatsapp-${request.id}`}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Partager via WhatsApp
                  </DropdownMenuItem>
                </>
              )}
              {request.client && request.transporter && (
                <DropdownMenuItem
                  onClick={() => handleOpenChat(request.client, request.transporter, request.id)}
                  data-testid={`menu-open-chat-${request.id}`}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Messagerie
                </DropdownMenuItem>
              )}
              {request.transporter && (
                <DropdownMenuItem
                  onClick={() => handleWhatsAppContact(request.transporter.phoneNumber, request.referenceId)}
                  data-testid={`menu-whatsapp-transporter-${request.id}`}
                >
                  <MessageCircle className="h-4 w-4 mr-2 text-green-500" />
                  WhatsApp Transporteur
                </DropdownMenuItem>
              )}
              
              {/* Masquer/Réafficher */}
              {showVisibilityToggle && (
                <DropdownMenuItem
                  onClick={() => toggleVisibilityMutation.mutate({ 
                    requestId: request.id, 
                    isHidden: !request.isHidden 
                  })}
                  disabled={toggleVisibilityMutation.isPending}
                  data-testid={`menu-toggle-visibility-${request.id}`}
                >
                  {request.isHidden ? (
                    <>
                      <Eye className="h-4 w-4 mr-2 text-green-600" />
                      <span className="text-green-600">Réafficher</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4 mr-2 text-red-600" />
                      <span className="text-red-600">Masquer</span>
                    </>
                  )}
                </DropdownMenuItem>
              )}
              
              {/* Supprimer */}
              <DropdownMenuItem
                onClick={() => setDeleteRequestId(request.id)}
                data-testid={`menu-delete-request-${request.id}`}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">

        {/* Carte de trajet avec distance */}
        {request.fromCity && request.toCity && (
          <div className="space-y-2">
            <RouteMap
              departureCity={request.fromCity}
              arrivalCity={request.toCity}
              departureAddress={request.departureAddress}
              arrivalAddress={request.arrivalAddress}
              distance={request.distance}
              variant="compact"
            />
            
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
                <div className="flex-shrink-0 px-2 py-0.5 bg-[#17cfcf]/20 rounded border border-[#17cfcf]/40">
                  <span className="text-xs font-bold text-[#17cfcf]">{request.distance} km</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Statut logistique */}
        <StatusIndicator 
          text={clientStatus.text}
          icon={clientStatus.icon}
          isProcessing={clientStatus.isProcessing}
        />

        {/* Info client et tonnage */}
        <div className="space-y-2">
          {request.client && (
            <a 
              href={`tel:${request.client.phoneNumber}`}
              className="group flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gradient-to-r from-[#17cfcf]/10 via-[#17cfcf]/5 to-transparent border border-[#17cfcf]/20 hover:border-[#17cfcf]/40 hover:shadow-sm transition-all"
              data-testid={`link-call-client-${request.id}`}
            >
              <div className="w-8 h-8 rounded-full bg-[#17cfcf]/15 flex items-center justify-center flex-shrink-0 group-hover:bg-[#17cfcf]/25 transition-colors">
                <Phone className="h-4 w-4 text-[#17cfcf]" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs text-muted-foreground">Client</span>
                <span className="text-sm font-semibold text-[#17cfcf] truncate">{request.client.phoneNumber}</span>
              </div>
            </a>
          )}
          
          {request.weight && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 text-sm">
              <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Tonnage:</span>
              <span className="font-medium">{request.weight} tonnes</span>
            </div>
          )}
        </div>

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
                <p className={`text-sm leading-relaxed text-foreground ${showFullDescription ? '' : 'line-clamp-2'}`}>
                  <span className="font-bold text-primary">{categoryConfig.label}:</span>{' '}
                  <span className="text-muted-foreground">{request.description}</span>
                </p>
              </div>
            </div>
            
            {/* Bouton "Plus de détails" */}
            <div className="flex items-center gap-3 px-1">
              <button
                onClick={toggleDescription}
                className="text-xs text-[#17cfcf] hover:text-[#13b3b3] font-semibold transition-colors flex items-center gap-1"
                data-testid={`button-toggle-description-${request.id}`}
              >
                {showFullDescription ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    <span>Voir moins</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    <span>Plus de détails</span>
                  </>
                )}
              </button>
            </div>

            {/* Section manutention - visible seulement quand "Plus de détails" est ouvert */}
            {showFullDescription && (
              <>
                {/* Manutention détaillée */}
                {request.handlingRequired && (
                  <div className="space-y-3 pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Warehouse className="w-4 h-4 text-primary" />
                      <span>Manutention requise</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 ps-6">
                      {/* Départ */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Building2 className="w-3.5 h-3.5" />
                          <span className="font-medium">Départ</span>
                        </div>
                        <div className="text-sm">
                          {request.departureFloor !== undefined && request.departureFloor !== null ? (
                            <>
                              <div>{request.departureFloor === 0 ? 'Rez-de-chaussée' : `${request.departureFloor}e étage`}</div>
                              <div className="text-xs text-muted-foreground">
                                Ascenseur: <Badge variant={request.departureElevator ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">{request.departureElevator ? 'Oui' : 'Non'}</Badge>
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
                          <Home className="w-3.5 h-3.5" />
                          <span className="font-medium">Arrivée</span>
                        </div>
                        <div className="text-sm">
                          {request.arrivalFloor !== undefined && request.arrivalFloor !== null ? (
                            <>
                              <div>{request.arrivalFloor === 0 ? 'Rez-de-chaussée' : `${request.arrivalFloor}e étage`}</div>
                              <div className="text-xs text-muted-foreground">
                                Ascenseur: <Badge variant={request.arrivalElevator ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">{request.arrivalElevator ? 'Oui' : 'Non'}</Badge>
                              </div>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">Non spécifié</span>
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
                      <span>Pas de manutention requise</span>
                    </div>
                  </div>
                )}

                {/* Adresses détaillées - Affiche quartier + ville si disponible */}
                {(request.departureAddress || request.arrivalAddress) && (
                  <div className="space-y-3 pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>Adresses détaillées</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 ps-6">
                      {/* Départ détaillé */}
                      {request.departureAddress && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#5BC0EB] flex-shrink-0"></div>
                            <span className="font-medium">Départ</span>
                          </div>
                          <div className="text-sm text-foreground">
                            {request.departureAddress}
                          </div>
                        </div>
                      )}

                      {/* Arrivée détaillée */}
                      {request.arrivalAddress && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#e74c3c] flex-shrink-0"></div>
                            <span className="font-medium">Arrivée</span>
                          </div>
                          <div className="text-sm text-foreground">
                            {request.arrivalAddress}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Prix qualifié */}
        {request.clientTotal && request.qualifiedAt && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#00ff88]/10 via-[#00ff88]/5 to-transparent border-l-4 border-[#00ff88]">
            <div className="w-7 h-7 rounded-full bg-[#00ff88]/20 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 text-[#00ff88]" />
            </div>
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Prix Qualifié</span>
            <span className="text-lg font-bold text-[#00ff88] ml-auto">{Math.floor(request.clientTotal).toLocaleString()} Dhs</span>
          </div>
        )}

        {/* Infos supplémentaires */}
        <div className="space-y-2">
          {qualifiedBy && (
            <div className="flex items-center gap-2 text-xs">
              <Users className="h-3.5 w-3.5 text-green-600" />
              <span className="text-muted-foreground">Qualifiée par:</span>
              <span className="font-medium text-green-700 dark:text-green-400">
                {qualifiedBy.name || qualifiedBy.phoneNumber}
              </span>
            </div>
          )}
          
          {interestedCount > 0 && request.qualifiedAt && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#17cfcf]" />
              <span className="text-muted-foreground">Transporteurs intéressés:</span>
              <Badge variant="outline" className="bg-[#17cfcf]/10 text-[#17cfcf] border-[#17cfcf]/30">
                {interestedCount}
              </Badge>
            </div>
          )}
        </div>

        {/* Actions Principales du Coordinateur */}
        <div className="flex flex-wrap gap-2">
          {/* Qualifier */}
          {showQualifyButton && (
            <Button
              className="flex-1 min-w-[140px] gap-2 bg-gradient-to-r from-[#17cfcf] to-[#13b3b3] hover:from-[#13b3b3] hover:to-[#0f9999] text-white font-semibold shadow-md hover:shadow-lg transition-all"
              onClick={() => handleOpenQualificationDialog(request)}
              data-testid={`button-qualify-${request.id}`}
            >
              <ClipboardCheck className="h-4 w-4" />
              Qualifier
            </Button>
          )}

          {/* Voir transporteurs intéressés */}
          {interestedCount > 0 && request.qualifiedAt && !request.assignedTransporterId && (
            <Button
              variant="default"
              className="flex-1 min-w-[140px] gap-2 bg-gradient-to-r from-[#17cfcf] to-[#13b3b3] hover:from-[#13b3b3] hover:to-[#0f9999] text-white font-semibold shadow-md hover:shadow-lg transition-all"
              onClick={() => handleViewInterestedTransporters(request)}
              data-testid={`button-view-interested-${request.id}`}
            >
              <Users className="h-4 w-4" />
              {interestedCount} Intéressé{interestedCount > 1 ? 's' : ''}
            </Button>
          )}

          {/* Auto-assignation coordinateur */}
          {isUnassigned && !request.transporter && (
            <Button
              variant="default"
              className="flex-1 min-w-[140px] gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
              onClick={() => assignToMeMutation.mutate(request.id)}
              disabled={assignToMeMutation.isPending}
              data-testid={`button-self-assign-${request.id}`}
            >
              <UserCheck className="h-4 w-4" />
              Me l'affecter
            </Button>
          )}

          {isAssignedToMe && !request.transporter && (
            <Button
              variant="destructive"
              className="flex-1 min-w-[140px] gap-2 font-semibold shadow-md hover:shadow-lg transition-all"
              onClick={() => unassignFromMeMutation.mutate(request.id)}
              disabled={unassignFromMeMutation.isPending}
              data-testid={`button-self-unassign-${request.id}`}
            >
              <X className="h-4 w-4" />
              Désaffecter
            </Button>
          )}

          {isAssignedToOther && request.assignedTo && (
            <Badge className="flex-1 min-w-[140px] gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-700 dark:text-green-400 border-green-500/40 hover:bg-green-500/30 text-sm font-semibold py-2 justify-center" data-testid={`badge-assigned-coordinator-${request.id}`}>
              <Users className="h-4 w-4" />
              {request.assignedTo.name || request.assignedTo.phoneNumber}
            </Badge>
          )}

          {/* Voir détails */}
          <Button
            variant="secondary"
            onClick={() => handleViewDetails(request)}
            data-testid={`button-view-details-${request.id}`}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Détails
          </Button>
        </div>

        {/* Notes internes coordinateur */}
        <RequestNotes requestId={request.id} />
      </CardContent>
    </Card>
    );
  };

  // Adaptive FilterSheet Component
  const FilterSheet = () => {
    const activeFilters = filters[activeTab];
    const activeFilterCount = countActiveFilters(activeFilters, activeTab);
    const [tempFilters, setTempFilters] = useState(activeFilters);

    const handleApply = () => {
      setFilters({ ...filters, [activeTab]: tempFilters });
      setFilterSheetOpen(false);
    };

    const handleReset = () => {
      const defaultFilters = getDefaultFilters(activeTab);
      setTempFilters(defaultFilters);
      setFilters({ ...filters, [activeTab]: defaultFilters });
    };

    return (
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="default" className="gap-2" data-testid="button-filter-trigger">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filtres</span>
            {activeFilterCount > 0 && (
              <Badge variant="default" className="ml-1" data-testid="badge-filter-count">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto" data-testid="sheet-filters">
          <SheetHeader>
            <SheetTitle>Filtrer les commandes</SheetTitle>
            <SheetDescription>
              Affinez votre recherche selon vos critères
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 py-4">
            {/* Search - All tabs */}
            <div className="space-y-2">
              <Label htmlFor="filter-search">Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="filter-search"
                  placeholder="Référence, client, transporteur..."
                  value={tempFilters.searchQuery}
                  onChange={(e) => setTempFilters({ ...tempFilters, searchQuery: e.target.value })}
                  className="pl-10"
                  data-testid="input-filter-search"
                />
              </div>
            </div>

            {/* City - All tabs */}
            <div className="space-y-2">
              <Label htmlFor="filter-city">Ville</Label>
              <Select
                value={tempFilters.selectedCity}
                onValueChange={(value) => setTempFilters({ ...tempFilters, selectedCity: value })}
              >
                <SelectTrigger id="filter-city" data-testid="select-filter-city">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Toutes les villes">Toutes les villes</SelectItem>
                  {cities.map((city: any) => (
                    <SelectItem key={city.id} value={city.name}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date - nouveau, qualifies, production, archives */}
            {(activeTab === 'nouveau' || activeTab === 'qualifies' || activeTab === 'production' || activeTab === 'archives') && (
              <div className="space-y-2">
                <Label htmlFor="filter-date">Période</Label>
                <Select
                  value={tempFilters.selectedDateFilter || 'all'}
                  onValueChange={(value) => setTempFilters({ ...tempFilters, selectedDateFilter: value })}
                >
                  <SelectTrigger id="filter-date" data-testid="select-filter-date">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les dates</SelectItem>
                    <SelectItem value="today">Aujourd'hui</SelectItem>
                    <SelectItem value="week">7 derniers jours</SelectItem>
                    <SelectItem value="month">30 derniers jours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Coordinator - nouveau only */}
            {activeTab === 'nouveau' && (
              <div className="space-y-2">
                <Label htmlFor="filter-coordinator">Coordinateur</Label>
                <Select
                  value={tempFilters.selectedCoordinator || 'Tous les coordinateurs'}
                  onValueChange={(value) => setTempFilters({ ...tempFilters, selectedCoordinator: value })}
                >
                  <SelectTrigger id="filter-coordinator" data-testid="select-filter-coordinator">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tous les coordinateurs">Tous les coordinateurs</SelectItem>
                    {allCoordinators.map((coordinator: any) => (
                      <SelectItem key={coordinator.id} value={coordinator.name || coordinator.phoneNumber}>
                        {coordinator.name || coordinator.phoneNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Min Interested - interesses only */}
            {activeTab === 'interesses' && (
              <div className="space-y-2">
                <Label htmlFor="filter-min-interested">Minimum transporteurs intéressés</Label>
                <Input
                  id="filter-min-interested"
                  type="number"
                  min="1"
                  value={tempFilters.minInterested || 1}
                  onChange={(e) => setTempFilters({ ...tempFilters, minInterested: parseInt(e.target.value) || 1 })}
                  data-testid="input-filter-min-interested"
                />
              </div>
            )}

            {/* Payment Status - production only */}
            {activeTab === 'production' && (
              <div className="space-y-2">
                <Label htmlFor="filter-payment-status">Statut de paiement</Label>
                <Select
                  value={tempFilters.selectedPaymentStatus || 'Tous les statuts'}
                  onValueChange={(value) => setTempFilters({ ...tempFilters, selectedPaymentStatus: value })}
                >
                  <SelectTrigger id="filter-payment-status" data-testid="select-filter-payment-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tous les statuts">Tous les statuts</SelectItem>
                    <SelectItem value="a_facturer">À facturer</SelectItem>
                    <SelectItem value="paid_by_client">Payé par le client</SelectItem>
                    <SelectItem value="paid_by_camionback">Payé par CamionBack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Archive Reason - archives only */}
            {activeTab === 'archives' && (
              <div className="space-y-2">
                <Label htmlFor="filter-archive-reason">Raison d'archivage</Label>
                <Select
                  value={tempFilters.selectedArchiveReason || 'Toutes les raisons'}
                  onValueChange={(value) => setTempFilters({ ...tempFilters, selectedArchiveReason: value })}
                >
                  <SelectTrigger id="filter-archive-reason" data-testid="select-filter-archive-reason">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Toutes les raisons">Toutes les raisons</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="cancelled">Annulé</SelectItem>
                    <SelectItem value="no_response">Pas de réponse</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <SheetFooter className="gap-2">
            <Button variant="outline" onClick={handleReset} data-testid="button-filter-reset">
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
            <Button onClick={handleApply} data-testid="button-filter-apply">
              Appliquer
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        user={{
          id: user.id,
          name: user.name || "Coordinateur",
          role: "coordinateur",
        }}
        onLogout={handleLogout}
      />

      <main className="container mx-auto p-4 max-w-7xl">
        <Tabs defaultValue="nouveau" className="w-full" onValueChange={(value) => setActiveTab(value as TabId)}>
          {/* Tabs and Filter aligned on same line for desktop */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div className="flex justify-center md:flex-1">
              <TabsList className="inline-flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-[#0a1929]/80 via-[#1a2942]/80 to-[#0a1929]/80 backdrop-blur-xl p-1.5 shadow-2xl border border-white/10 gap-1">
              <TabsTrigger 
                value="nouveau" 
                data-testid="tab-nouveau"
                className="relative inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#fbbf24] data-[state=active]:via-[#f59e0b] data-[state=active]:to-[#d97706] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-yellow-500/50 text-slate-400 hover:text-slate-200 hover:bg-white/5"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nouveau</span>
                {!nouveauLoading && filterRequests(nouveauRequests, filters.nouveau).length > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 text-xs font-bold rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 text-white shadow-md shadow-yellow-500/40 animate-pulse">
                    {filterRequests(nouveauRequests, filters.nouveau).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="qualifies" 
                data-testid="tab-qualifies"
                className="relative inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#3b82f6] data-[state=active]:via-[#2563eb] data-[state=active]:to-[#1d4ed8] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/50 text-slate-400 hover:text-slate-200 hover:bg-white/5"
              >
                <ClipboardCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Qualifiés</span>
                {!matchingLoading && filterRequests(matchingRequests, filters.qualifies).length > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 text-xs font-bold rounded-full bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-md">
                    {filterRequests(matchingRequests, filters.qualifies).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="interesses" 
                data-testid="tab-interesses"
                className="relative inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#a855f7] data-[state=active]:via-[#9333ea] data-[state=active]:to-[#7e22ce] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 text-slate-400 hover:text-slate-200 hover:bg-white/5"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Intéressés</span>
                {!matchingLoading && filterRequests(matchingRequests.filter((r: any) => r.transporterInterests && r.transporterInterests.length > 0), filters.interesses).length > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 text-xs font-bold rounded-full bg-gradient-to-br from-purple-400 to-purple-500 text-white shadow-md">
                    {filterRequests(matchingRequests.filter((r: any) => r.transporterInterests && r.transporterInterests.length > 0), filters.interesses).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="production" 
                data-testid="tab-production"
                className="relative inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#10b981] data-[state=active]:via-[#059669] data-[state=active]:to-[#047857] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-green-500/50 text-slate-400 hover:text-slate-200 hover:bg-white/5"
              >
                <Truck className="h-4 w-4" />
                <span className="hidden sm:inline">Production</span>
                {!(activeLoading || paymentLoading) && filterRequests([...activeRequests, ...paymentRequests], filters.production).length > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 text-xs font-bold rounded-full bg-gradient-to-br from-green-400 to-green-500 text-white shadow-md">
                    {filterRequests([...activeRequests, ...paymentRequests], filters.production).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="archives" 
                data-testid="tab-archives"
                className="relative inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#6b7280] data-[state=active]:via-[#4b5563] data-[state=active]:to-[#374151] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-gray-500/50 text-slate-400 hover:text-slate-200 hover:bg-white/5"
              >
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Archives</span>
                {!archivesLoading && filterRequests(archivesRequests, filters.archives).length > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 text-xs font-bold rounded-full bg-gradient-to-br from-gray-400 to-gray-500 text-white shadow-md">
                    {filterRequests(archivesRequests, filters.archives).length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            </div>
            
            {/* Filter button aligned on the right for desktop */}
            <div className="flex justify-end md:justify-start">
              <FilterSheet />
            </div>
          </div>

          {/* ONGLET 1: NOUVEAU - Demandes en attente de qualification */}
          <TabsContent value="nouveau" className="space-y-4">
            {nouveauLoading ? (
              <div className="flex justify-center py-12">
                <LoadingTruck />
              </div>
            ) : filterRequests(nouveauRequests, filters.nouveau).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune nouvelle commande à qualifier</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filterRequests(nouveauRequests, filters.nouveau).map((request) => renderRequestCard(request, true, false, false, true, true))}
              </div>
            )}
          </TabsContent>

          {/* ONGLET 2: QUALIFIÉS - Demandes publiées pour matching transporteurs */}
          <TabsContent value="qualifies" className="space-y-4">
            {matchingLoading ? (
              <div className="flex justify-center py-12">
                <LoadingTruck />
              </div>
            ) : filterRequests(matchingRequests, filters.qualifies).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune commande qualifiée en attente de matching</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filterRequests(matchingRequests, filters.qualifies).map((request) => renderRequestCard(request, true, false, false, false, true))}
              </div>
            )}
          </TabsContent>

          {/* ONGLET 3: INTÉRESSÉS - Demandes avec transporteurs intéressés */}
          <TabsContent value="interesses" className="space-y-4">
            {matchingLoading ? (
              <div className="flex justify-center py-12">
                <LoadingTruck />
              </div>
            ) : filterRequests(matchingRequests.filter((r: any) => r.transporterInterests && r.transporterInterests.length > 0), filters.interesses).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun transporteur intéressé pour le moment</p>
                </CardContent>
              </Card>
            ) : (
              <TwoColumnGrid testId="grid-interested-requests">
                {filterRequests(matchingRequests.filter((r: any) => r.transporterInterests && r.transporterInterests.length > 0), filters.interesses).map((request) => (
                  <div key={request.id}>
                    {renderRequestCard(request, true, false, false, false, true)}
                    {/* Actions footer pour Intéressés */}
                    <div className="flex gap-2 px-4 pb-4">
                      <Button
                        className="flex-1 gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                        onClick={() => {
                          setSelectedRequestForInterested(request);
                          setInterestedTransportersDialogOpen(true);
                        }}
                        data-testid={`button-view-assign-${request.id}`}
                      >
                        <Eye className="h-4 w-4" />
                        Voir détails & Assigner
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setCancelRequestData(request);
                          setCancelDialogOpen(true);
                        }}
                        data-testid={`button-cancel-request-${request.id}`}
                      >
                        <X className="h-4 w-4" />
                        Annuler
                      </Button>
                    </div>
                  </div>
                ))}
              </TwoColumnGrid>
            )}
          </TabsContent>

          {/* ONGLET 4: EN PRODUCTION - Commandes actives et en paiement */}
          <TabsContent value="production" className="space-y-4">
            {(activeLoading || paymentLoading) ? (
              <div className="flex justify-center py-12">
                <LoadingTruck />
              </div>
            ) : filterRequests([...activeRequests, ...paymentRequests], filters.production).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune commande en production</p>
                </CardContent>
              </Card>
            ) : (
              <TwoColumnGrid testId="grid-production-requests">
                {filterRequests([...activeRequests, ...paymentRequests], filters.production).map((request) => (
                  <div key={request.id}>
                    {renderRequestCard(request, false, false, false, false, true, false, true)}
                    {/* Actions footer pour Production */}
                    <div className="flex gap-2 px-4 pb-4">
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={() => {
                          // TODO: Implémenter requalify dialog
                          if (confirm(`Voulez-vous vraiment annuler et requalifier la commande ${request.referenceId} ?`)) {
                            fetch(`/api/requests/${request.id}/requalify`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({ reason: 'Annulé par coordinateur' }),
                            }).then(async (res) => {
                              if (res.ok) {
                                toast({
                                  title: "Commande requalifiée",
                                  description: "La commande a été remise en matching.",
                                });
                                queryClient.invalidateQueries({ queryKey: ['/api/coordinator/active-requests'] });
                                queryClient.invalidateQueries({ queryKey: ['/api/coordinator/matching-requests'] });
                              } else {
                                const error = await res.json();
                                toast({
                                  variant: "destructive",
                                  title: "Erreur",
                                  description: error.error || "Impossible de requalifier",
                                });
                              }
                            });
                          }
                        }}
                        data-testid={`button-requalify-${request.id}`}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Annuler & Requalifier
                      </Button>
                      <Button
                        className="flex-1 gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                        onClick={() => {
                          handleCoordinatorPayment(request.id);
                        }}
                        data-testid={`button-pay-${request.id}`}
                      >
                        <CreditCard className="h-4 w-4" />
                        Prise en charge / Payer
                      </Button>
                    </div>
                  </div>
                ))}
              </TwoColumnGrid>
            )}
          </TabsContent>

          {/* ONGLET 5: ARCHIVES - Commandes archivées */}
          <TabsContent value="archives" className="space-y-4">
            {archivesLoading ? (
              <div className="flex justify-center py-12">
                <LoadingTruck />
              </div>
            ) : filterRequests(archivesRequests, filters.archives).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune commande archivée</p>
                </CardContent>
              </Card>
            ) : (
              <TwoColumnGrid testId="grid-archived-requests">
                {filterRequests(archivesRequests, filters.archives).map((request) => (
                  <div key={request.id}>
                    {renderRequestCard(request, false, false, false, false, false, true)}
                  </div>
                ))}
              </TwoColumnGrid>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Chat Window */}
      {chatOpen && selectedParticipants && (
        <ChatWindow
          open={chatOpen}
          currentUserId={user.id}
          currentUserRole="coordinateur"
          otherUser={selectedParticipants.transporter}
          requestId={chatRequestId}
          onClose={() => {
            setChatOpen(false);
            setSelectedParticipants(null);
          }}
        />
      )}

      {/* Photo Gallery Dialog */}
      <PhotoGalleryDialog
        photos={selectedPhotos}
        open={photoGalleryOpen}
        onClose={() => setPhotoGalleryOpen(false)}
        referenceId={selectedReferenceId}
      />

      {/* Offers Dialog */}
      {selectedRequestForOffers && (
        <Dialog open={offersDialogOpen} onOpenChange={setOffersDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="dialog-coordinator-offers">
            <DialogHeader>
              <DialogTitle>Offres reçues - {selectedRequestForOffers.referenceId}</DialogTitle>
              <DialogDescription>
                {selectedRequestForOffers.fromCity} → {selectedRequestForOffers.toCity}
              </DialogDescription>
            </DialogHeader>
            <CoordinatorOffersView 
              requestId={selectedRequestForOffers.id}
              onAcceptOffer={(offerId) => acceptOfferMutation.mutate(offerId)}
              isPending={acceptOfferMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Request Details Dialog */}
      {selectedRequest && (
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails de la commande - {selectedRequest.referenceId}</DialogTitle>
              <DialogDescription>
                Informations complètes sur la commande
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">De</p>
                  <p className="font-medium">{selectedRequest.fromCity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">À</p>
                  <p className="font-medium">{selectedRequest.toCity}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Type de marchandise</p>
                <p className="font-medium">{getCategoryConfig(selectedRequest.goodsType).label}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="font-medium">{selectedRequest.description}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {format(new Date(selectedRequest.dateTime), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              </div>

              {selectedRequest.budget && (
                <div>
                  <p className="text-sm text-muted-foreground">Budget estimé</p>
                  <p className="font-medium">{selectedRequest.budget} DH</p>
                </div>
              )}

              {selectedRequest.client && (
                <div className="border-t pt-4">
                  <p className="font-semibold mb-2">Client</p>
                  <div className="space-y-1">
                    <p><span className="text-muted-foreground">Téléphone:</span> {selectedRequest.client.phoneNumber}</p>
                    {selectedRequest.client.clientId && (
                      <p><span className="text-muted-foreground">ID Client:</span> {selectedRequest.client.clientId}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedRequest.transporter && (
                <div className="border-t pt-4">
                  <p className="font-semibold mb-2">Transporteur</p>
                  <div className="space-y-1">
                    <p><span className="text-muted-foreground">Téléphone:</span> {selectedRequest.transporter.phoneNumber}</p>
                    {selectedRequest.transporter.city && (
                      <p><span className="text-muted-foreground">Ville:</span> {selectedRequest.transporter.city}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedRequest.acceptedOffer && (
                <div className="border-t pt-4">
                  <p className="font-semibold mb-2">Offre acceptée</p>
                  <div className="space-y-1">
                    <p><span className="text-muted-foreground">Montant:</span> <span className="font-bold text-[#5BC0EB]">{selectedRequest.acceptedOffer.amount} DH</span></p>
                    <p><span className="text-muted-foreground">Type de chargement:</span> {selectedRequest.acceptedOffer.loadType === "return" ? "Retour" : "Groupage"}</p>
                    <p><span className="text-muted-foreground">Date de prise en charge:</span> {format(new Date(selectedRequest.acceptedOffer.pickupDate), "dd MMMM yyyy", { locale: fr })}</p>
                  </div>
                </div>
              )}

              {selectedRequest.photos && selectedRequest.photos.length > 0 && (
                <div className="border-t pt-4">
                  <p className="font-semibold mb-2">Photos ({selectedRequest.photos.length})</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewPhotos(selectedRequest.photos)}
                  >
                    Voir les photos
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  handleOpenEdit(selectedRequest);
                  setDetailsDialogOpen(false);
                }}
                data-testid="button-edit-request"
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
              <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Request Dialog */}
      {editFormData && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent 
            className="max-w-2xl max-h-[80vh] overflow-y-auto"
            onPointerDownOutside={(e) => {
              // Empêcher la fermeture du Dialog lors d'un clic sur Google Places
              const target = e.target as HTMLElement;
              if (target.closest('.pac-container')) {
                e.preventDefault();
              }
            }}
            onInteractOutside={(e) => {
              // Empêcher la fermeture du Dialog lors d'une interaction avec Google Places
              const target = e.target as HTMLElement;
              if (target.closest('.pac-container')) {
                e.preventDefault();
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>Modifier la commande</DialogTitle>
              <DialogDescription>
                Modification complète des informations de la commande
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Adresses avec Google Places Autocomplete */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Adresse de départ</label>
                  <GooglePlacesAutocomplete
                    value={editFormData.departureAddress || editFormData.fromCity || ''}
                    onChange={(address, placeDetails) => {
                      // Extract city from structured place details
                      let city = '';
                      if (placeDetails?.address_components) {
                        placeDetails.address_components.forEach((component: any) => {
                          if (component.types.includes('locality')) {
                            city = component.long_name;
                          } else if (!city && component.types.includes('administrative_area_level_1')) {
                            // Fallback to province/region if no locality
                            city = component.long_name;
                          }
                        });
                      }
                      // Fallback: extract from formatted address (avoid country name)
                      if (!city && address) {
                        const parts = address.split(',').map(p => p.trim()).filter(p => p);
                        // Take second-to-last part (likely city) instead of last (country)
                        if (parts.length >= 2) {
                          city = parts[parts.length - 2];
                        } else if (parts.length === 1) {
                          city = parts[0];
                        }
                      }
                      
                      // Defensive: prevent country names
                      if (city && (city.toLowerCase() === 'maroc' || city.toLowerCase() === 'morocco' || city.toLowerCase() === 'المغرب')) {
                        city = editFormData.fromCity || '';
                      }
                      
                      setEditFormData({ 
                        ...editFormData, 
                        departureAddress: address,
                        fromCity: city || editFormData.fromCity
                      });
                    }}
                    placeholder="Quartier, Ville"
                    dataTestId="input-edit-departure-address"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ex: Hay Hassani, Casablanca
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Adresse d'arrivée</label>
                  <GooglePlacesAutocomplete
                    value={editFormData.arrivalAddress || editFormData.toCity || ''}
                    onChange={(address, placeDetails) => {
                      // Extract city from structured place details
                      let city = '';
                      if (placeDetails?.address_components) {
                        placeDetails.address_components.forEach((component: any) => {
                          if (component.types.includes('locality')) {
                            city = component.long_name;
                          } else if (!city && component.types.includes('administrative_area_level_1')) {
                            // Fallback to province/region if no locality
                            city = component.long_name;
                          }
                        });
                      }
                      // Fallback: extract from formatted address (avoid country name)
                      if (!city && address) {
                        const parts = address.split(',').map(p => p.trim()).filter(p => p);
                        // Take second-to-last part (likely city) instead of last (country)
                        if (parts.length >= 2) {
                          city = parts[parts.length - 2];
                        } else if (parts.length === 1) {
                          city = parts[0];
                        }
                      }
                      
                      // Defensive: prevent country names
                      if (city && (city.toLowerCase() === 'maroc' || city.toLowerCase() === 'morocco' || city.toLowerCase() === 'المغرب')) {
                        city = editFormData.toCity || '';
                      }
                      
                      setEditFormData({ 
                        ...editFormData, 
                        arrivalAddress: address,
                        toCity: city || editFormData.toCity
                      });
                    }}
                    placeholder="Quartier, Ville"
                    dataTestId="input-edit-arrival-address"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ex: Hay Riad, Rabat
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium mb-1 block">Description détaillée</label>
                <Input
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="Description de la marchandise"
                  data-testid="input-edit-description"
                />
              </div>

              {/* Date */}
              <div>
                <label className="text-sm font-medium mb-1 block">Date souhaitée</label>
                <Input
                  type="datetime-local"
                  value={new Date(editFormData.dateTime).toISOString().slice(0, 16)}
                  onChange={(e) => setEditFormData({ ...editFormData, dateTime: new Date(e.target.value).toISOString() })}
                  data-testid="input-edit-datetime"
                />
              </div>

              {/* Photos */}
              <div>
                <label className="text-sm font-medium mb-1 block">Photos ({editFormData.photos.length})</label>
                <div className="flex gap-2 mb-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddPhoto}
                    data-testid="button-add-photo"
                  >
                    Ajouter des photos
                  </Button>
                </div>

                {/* Photo Grid */}
                {editFormData.photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {editFormData.photos.map((photo: string, index: number) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemovePhoto(index)}
                          data-testid={`button-remove-photo-${index}`}
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setEditDialogOpen(false)}
                disabled={updateRequestMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                onClick={handleEditSubmit}
                disabled={updateRequestMutation.isPending}
                data-testid="button-save-edit"
              >
                {updateRequestMutation.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Archive Request Dialog */}
      {archiveRequestData && (
        <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Archiver la commande</DialogTitle>
              <DialogDescription>
                Veuillez sélectionner un motif d'archivage
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Select
                value={archiveRequestData.archiveReason || ""}
                onValueChange={(value) => setArchiveRequestData({ ...archiveRequestData, archiveReason: value as any })}
              >
                <SelectTrigger data-testid="select-archive-reason">
                  <SelectValue placeholder="Sélectionnez un motif" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_cancelled">Client a annulé</SelectItem>
                  <SelectItem value="no_transporters_available">Aucun transporteur disponible</SelectItem>
                  <SelectItem value="client_found_alternative">Client a trouvé une alternative</SelectItem>
                  <SelectItem value="expired">Demande expirée</SelectItem>
                  <SelectItem value="duplicate_request">Demande dupliquée</SelectItem>
                  <SelectItem value="budget_too_low">Budget insuffisant</SelectItem>
                  <SelectItem value="route_not_serviceable">Itinéraire non desservable</SelectItem>
                  <SelectItem value="administrative_error">Erreur administrative</SelectItem>
                  <SelectItem value="client_unreachable">Client injoignable</SelectItem>
                  <SelectItem value="goods_not_transportable">Marchandises non transportables</SelectItem>
                  <SelectItem value="completed">Complétée avec succès</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>

              {archiveRequestData.archiveReason === "other" && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Précisez le motif</label>
                  <Input
                    value={archiveRequestData.archiveComment || ""}
                    onChange={(e) => setArchiveRequestData({ ...archiveRequestData, archiveComment: e.target.value })}
                    placeholder="Motif d'archivage..."
                    data-testid="input-archive-comment"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setArchiveDialogOpen(false)}
                disabled={archiveRequestMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                onClick={handleArchiveRequest}
                disabled={archiveRequestMutation.isPending || !archiveRequestData.archiveReason}
                data-testid="button-confirm-archive"
              >
                {archiveRequestMutation.isPending ? "Archivage..." : "Archiver"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Truck Photos Dialog */}
      <Dialog open={truckPhotosDialogOpen} onOpenChange={setTruckPhotosDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Photos du camion</DialogTitle>
            <DialogDescription>
              Photos du véhicule du transporteur
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            {selectedTruckPhotos.map((photo: any, index: number) => (
              <div key={index}>
                <img
                  src={photo.photoUrl}
                  alt={`Photo camion ${index + 1}`}
                  className="w-full h-48 object-cover rounded"
                />
              </div>
            ))}
          </div>

          {selectedTruckPhotos.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Aucune photo disponible</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setTruckPhotosDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Order to Empty Return Dialog */}
      {selectedEmptyReturn && (
        <Dialog open={assignOrderDialogOpen} onOpenChange={setAssignOrderDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Affecter une commande au retour à vide</DialogTitle>
              <DialogDescription>
                Transporteur: {selectedEmptyReturn.transporter?.name} | 
                {selectedEmptyReturn.fromCity} → {selectedEmptyReturn.toCity} | 
                Date: {format(new Date(selectedEmptyReturn.returnDate), "dd/MM/yyyy", { locale: fr })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {matchingRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune commande qualifiée compatible
                </p>
              ) : (
                matchingRequests
                  .filter((req: any) => 
                    req.fromCity === selectedEmptyReturn.fromCity &&
                    req.toCity === selectedEmptyReturn.toCity
                  )
                  .map((request: any) => (
                    <Card key={request.id} className="hover-elevate">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-base">{request.referenceId}</CardTitle>
                            <CardDescription className="text-sm mt-1">
                              {request.fromCity} → {request.toCity}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Marchandise:</span>
                            <span className="font-medium">{getCategoryConfig(request.goodsType).label}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Date:</span>
                            <span className="font-medium">
                              {format(new Date(request.dateTime), "dd MMMM yyyy", { locale: fr })}
                            </span>
                          </div>

                          {request.client && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Client:</span>
                              <span className="font-medium">{request.client.name}</span>
                            </div>
                          )}
                        </div>

                        <Button
                          size="sm"
                          variant="default"
                          className="w-full bg-[#5BC0EB] hover:bg-[#4AA8D8]"
                          onClick={() => {
                            // Here you would implement the assignment logic
                            toast({
                              title: "Fonctionnalité à venir",
                              description: "L'affectation automatique sera bientôt disponible",
                            });
                          }}
                          data-testid={`button-assign-request-${request.id}`}
                        >
                          Affecter cette commande
                        </Button>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignOrderDialogOpen(false)}>
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Manual Assignment Dialog */}
      {selectedRequestForAssignment && (
        <ManualAssignmentDialog
          open={manualAssignmentDialogOpen}
          onOpenChange={setManualAssignmentDialogOpen}
          request={selectedRequestForAssignment}
          onSuccess={handleManualAssignmentSuccess}
        />
      )}

      {/* Interested Transporters Dialog */}
      {selectedRequestForInterested && (
        <Dialog open={interestedTransportersDialogOpen} onOpenChange={setInterestedTransportersDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="dialog-interested-transporters">
            <DialogHeader>
              <DialogTitle>Transporteurs intéressés - {selectedRequestForInterested.referenceId}</DialogTitle>
              <DialogDescription>
                {selectedRequestForInterested.fromCity} → {selectedRequestForInterested.toCity}
              </DialogDescription>
            </DialogHeader>
            <InterestedTransportersView 
              request={selectedRequestForInterested}
              onAssignTransporter={(transporterId) => {
                assignMutation.mutate({
                  requestId: selectedRequestForInterested.id,
                  transporterId: transporterId,
                  transporterAmount: parseFloat(selectedRequestForInterested.transporterAmount) || 0,
                  platformFee: parseFloat(selectedRequestForInterested.platformFee) || 0,
                });
              }}
              isPending={assignMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* NEW: Qualification Dialog */}
      {selectedRequestForQualification && (
        <QualificationDialog
          open={qualificationDialogOpen}
          onOpenChange={setQualificationDialogOpen}
          request={selectedRequestForQualification}
          onSuccess={handleQualificationSuccess}
        />
      )}

      {/* Delete Request Confirmation Dialog */}
      <AlertDialog open={!!deleteRequestId} onOpenChange={(open) => !open && setDeleteRequestId(null)}>
        <AlertDialogContent data-testid="dialog-delete-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement cette commande ? 
              Cette action est irréversible et supprimera toutes les données associées (offres, messages, etc.).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={deleteRequestMutation.isPending}
              data-testid="button-cancel-delete"
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRequestId && deleteRequestMutation.mutate(deleteRequestId)}
              disabled={deleteRequestMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              {deleteRequestMutation.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Request Dialog */}
      {cancelRequestData && (
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent data-testid="dialog-cancel-request">
            <DialogHeader>
              <DialogTitle>Annuler la commande</DialogTitle>
              <DialogDescription>
                Commande {cancelRequestData.referenceId} - Cette action marquera la commande comme annulée côté client et la retirera de toutes les vues transporteurs.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Raison de l'annulation <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Ex: Client injoignable, Client a trouvé un transporteur ailleurs, etc."
                  rows={4}
                  data-testid="textarea-cancellation-reason"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Cette raison sera visible par le client
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setCancelDialogOpen(false);
                  setCancellationReason("");
                }}
                disabled={cancelRequestMutation.isPending}
                data-testid="button-cancel-dialog"
              >
                Retour
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (cancellationReason.trim()) {
                    cancelRequestMutation.mutate({
                      requestId: cancelRequestData.id,
                      cancellationReason: cancellationReason.trim(),
                    });
                  }
                }}
                disabled={cancelRequestMutation.isPending || !cancellationReason.trim()}
                data-testid="button-confirm-cancel"
              >
                {cancelRequestMutation.isPending ? "Annulation..." : "Annuler la commande"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Requalify Request Dialog */}
      {requalifyRequestData && (
        <Dialog open={requalifyDialogOpen} onOpenChange={setRequalifyDialogOpen}>
          <DialogContent data-testid="dialog-requalify-request">
            <DialogHeader>
              <DialogTitle>Annuler et requalifier la commande</DialogTitle>
              <DialogDescription>
                Commande {requalifyRequestData.referenceId} - Cette action annulera la commande actuelle et la republiera immédiatement pour matching avec les transporteurs.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  <strong>Action automatique :</strong> La commande sera requalifiée et visible dans l'onglet "Qualifiés", puis "Intéressés" une fois que des transporteurs expriment leur intérêt.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Raison de la requalification <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={requalificationReason}
                  onChange={(e) => setRequalificationReason(e.target.value)}
                  placeholder="Ex: Désaccord entre client et transporteur, Changement de conditions, etc."
                  rows={4}
                  data-testid="textarea-requalification-reason"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Cette raison sera enregistrée en note interne
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setRequalifyDialogOpen(false);
                  setRequalificationReason("");
                }}
                disabled={requalifyRequestMutation.isPending}
                data-testid="button-cancel-requalify-dialog"
              >
                Retour
              </Button>
              <Button
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                onClick={() => {
                  if (requalificationReason.trim()) {
                    requalifyRequestMutation.mutate({
                      requestId: requalifyRequestData.id,
                      requalificationReason: requalificationReason.trim(),
                    });
                  }
                }}
                disabled={requalifyRequestMutation.isPending || !requalificationReason.trim()}
                data-testid="button-confirm-requalify"
              >
                {requalifyRequestMutation.isPending ? "Requalification..." : "Annuler et requalifier"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* New Unified Payment Dialog with Rating */}
      {coordinatorPaymentRequestId && (
        <PaymentDialog
          open={showCoordinatorPaymentDialog}
          onOpenChange={setShowCoordinatorPaymentDialog}
          requestId={coordinatorPaymentRequestId}
          transporterName={
            [...activeRequests, ...paymentRequests].find((r: any) => r.id === coordinatorPaymentRequestId)?.transporter?.name || 
            [...activeRequests, ...paymentRequests].find((r: any) => r.id === coordinatorPaymentRequestId)?.transporterName ||
            "Transporteur"
          }
          paidBy="coordinator"
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/coordinator/active-requests'] });
            queryClient.invalidateQueries({ queryKey: ['/api/coordinator/payment-requests'] });
            setShowCoordinatorPaymentDialog(false);
          }}
        />
      )}

    </div>
  );
}
