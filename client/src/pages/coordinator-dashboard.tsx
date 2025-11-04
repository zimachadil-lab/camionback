import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, ListFilter, Package, Phone, CheckCircle, MapPin, MessageSquare, MessageCircle, Eye, EyeOff, Edit, DollarSign, Compass, ExternalLink, Star, Truck, Trash2, Share2, Copy, Send, RotateCcw, Info, Users, CreditCard, Calendar, X, Home, Sofa, Boxes, Wrench, ShoppingCart, LucideIcon, FileText, MoreVertical, Image as ImageIcon, ClipboardCheck, Award } from "lucide-react";
import { Header } from "@/components/layout/header";
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
import { ManualAssignmentDialog } from "@/components/coordinator/manual-assignment-dialog";
import { QualificationDialog } from "@/components/coordinator/qualification-dialog";
import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";

// Configuration des catégories avec icônes et couleurs (même logique que transporteur)
const getCategoryConfig = (goodsType: string): { icon: LucideIcon; color: string; bgColor: string; borderColor: string; label: string } => {
  const type = goodsType.toLowerCase();
  
  if (type.includes('déménagement')) {
    return {
      icon: Home,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      borderColor: 'border-emerald-500',
      label: 'Électroménager'
    };
  }
  
  if (type.includes('meuble') || type.includes('mobilier')) {
    return {
      icon: Sofa,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
      borderColor: 'border-blue-500',
      label: 'Meubles'
    };
  }
  
  if (type.includes('matériau') || type.includes('construction')) {
    return {
      icon: Boxes,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-orange-500 to-orange-600',
      borderColor: 'border-orange-500',
      label: 'Matériaux'
    };
  }
  
  if (type.includes('équipement') || type.includes('machine')) {
    return {
      icon: Wrench,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-purple-500 to-purple-600',
      borderColor: 'border-purple-500',
      label: 'Équipements'
    };
  }
  
  if (type.includes('marchandise') || type.includes('produit')) {
    return {
      icon: ShoppingCart,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-pink-500 to-pink-600',
      borderColor: 'border-pink-500',
      label: 'Marchandises'
    };
  }
  
  if (type.includes('colis')) {
    return {
      icon: Package,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-amber-500 to-amber-600',
      borderColor: 'border-amber-500',
      label: 'Colis'
    };
  }
  
  if (type.includes('matériel')) {
    return {
      icon: Wrench,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      borderColor: 'border-indigo-500',
      label: 'Matériel'
    };
  }
  
  // Default: Transport général
  return {
    icon: Truck,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-slate-500 to-slate-600',
    borderColor: 'border-slate-500',
    label: goodsType
  };
};

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
      text: "Livraison effectuée ✅ Merci pour votre confiance",
      variant: "default" as const,
      icon: CheckCircle,
    };
  }

  // 8. Livraison en cours - Transporteur marque "Pris en charge"
  if (request.status === "in_progress") {
    return {
      text: "Livraison en cours 🚚📦",
      variant: "default" as const,
      icon: Truck,
    };
  }

  // 7. Offre confirmée - Si client valide un transporteur
  if (request.status === "accepted" && request.acceptedOfferId) {
    return {
      text: "Transporteur sélectionné ✅ Livraison prévue",
      variant: "default" as const,
      icon: CheckCircle,
    };
  }

  // 6. Transporteur assigné manuellement - Coordinateur
  if (request.assignedTransporterId && !request.acceptedOfferId) {
    return {
      text: "Transporteur assigné ✅ Suivi en cours",
      variant: "default" as const,
      icon: Truck,
    };
  }

  // 5. En sélection Transporteur - Tant qu'aucune offre n'a été choisie
  if (interestedCount > 0 && !request.acceptedOfferId && !request.assignedTransporterId) {
    return {
      text: "Choisissez votre transporteur 👇",
      variant: "outline" as const,
      icon: Users,
    };
  }

  // 4. Transporteurs intéressés - Si ≥ 1 intéressé
  if (request.status === "published_for_matching" && interestedCount > 0) {
    return {
      text: "Des transporteurs ont postulé 🚚 Comparez les profils",
      variant: "outline" as const,
      icon: Truck,
    };
  }

  // 3. Publication aux transporteurs - Publication matching enclenchée
  if (request.status === "published_for_matching") {
    return {
      text: "En attente d'offres transporteurs…",
      variant: "secondary" as const,
      icon: Package,
    };
  }

  // 2. Prix vérifié / infos validées - Coordinateur valide détail + prix
  if (request.qualifiedAt && request.status !== "published_for_matching") {
    return {
      text: "Finalisation de votre demande…",
      variant: "secondary" as const,
      icon: Info,
    };
  }

  // 1. Création commande - Dès création (default)
  return {
    text: "Qualification logistique en cours…",
    variant: "secondary" as const,
    icon: RotateCcw,
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
  const [selectedCity, setSelectedCity] = useState("Toutes les villes");
  const [selectedStatus, setSelectedStatus] = useState("Tous les statuts");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDateFilter, setSelectedDateFilter] = useState("all");
  const [selectedCoordinator, setSelectedCoordinator] = useState("Tous les coordinateurs");
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
  const { toast} = useToast();

  const handleLogout = () => {
    logout();
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

  // Update request details mutation (coordinator complete edit)
  const updateRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const { requestId, ...updates } = data;
      return apiRequest("PATCH", `/api/coordinator/requests/${requestId}`, {
        ...updates,
        coordinatorId: user!.id,
      });
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

  const filterRequests = (requests: any[], applyStatusFilter = true) => {
    if (!requests || !Array.isArray(requests)) {
      return [];
    }
    // Deduplicate before filtering
    const uniqueRequests = deduplicateRequests(requests);
    return uniqueRequests.filter((request) => {
      const matchesCity = selectedCity === "Toutes les villes" || 
        request.fromCity === selectedCity || 
        request.toCity === selectedCity;
      const matchesStatus = !applyStatusFilter || selectedStatus === "Tous les statuts" || 
        request.status === selectedStatus;
      const matchesSearch = searchQuery === "" ||
        request.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (request.client?.name && request.client.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (request.transporter?.name && request.transporter.name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Date filtering
      const matchesDate = (() => {
        if (selectedDateFilter === "all") return true;
        const requestDate = new Date(request.createdAt);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (selectedDateFilter) {
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

      // Coordinator filtering (for qualified requests)
      const matchesCoordinator = selectedCoordinator === "Tous les coordinateurs" || 
        (request.coordinationUpdatedBy && (
          request.coordinationUpdatedBy.name === selectedCoordinator ||
          request.coordinationUpdatedBy.phoneNumber === selectedCoordinator
        ));
      
      return matchesCity && matchesStatus && matchesSearch && matchesDate && matchesCoordinator;
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

  const renderRequestCard = (request: any, showVisibilityToggle = false, showPaymentControls = false, isCoordination = false, showQualifyButton = false, showQualifiedBy = false, showRepublishButton = false) => {
    // Calculate interested count
    const interestedCount = request.transporterInterests?.length || 0;
    // Get client-friendly status
    const clientStatus = getClientStatus(request, interestedCount);
    const StatusIcon = clientStatus.icon;
    
    // Get coordinator who qualified this request
    const qualifiedBy = showQualifiedBy && request.coordinationUpdatedBy 
      ? allCoordinators.find((c: any) => c.id === request.coordinationUpdatedBy)
      : null;

    // Get category config
    const categoryConfig = getCategoryConfig(request.goodsType);
    const CategoryIcon = categoryConfig.icon;

    return (
    <Card key={request.id} className={`hover-elevate overflow-hidden border-2 ${categoryConfig.borderColor}`} data-testid={`card-request-${request.id}`}>
      {/* En-tête avec catégorie colorée - même style que transporteur */}
      <div className={`${categoryConfig.bgColor} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg bg-white/20 ${categoryConfig.color}`}>
            <CategoryIcon className="w-5 h-5" />
          </div>
          <span className={`text-base font-semibold ${categoryConfig.color}`}>
            {categoryConfig.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
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
          {request.client && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0 bg-white/20 hover:bg-white/30"
              onClick={(e) => {
                e.stopPropagation();
                handleWhatsAppContactClient(request.client.phoneNumber, request.referenceId);
              }}
              data-testid={`button-whatsapp-client-${request.id}`}
              title="Contacter le client via WhatsApp"
            >
              <MessageCircle className="h-4 w-4 text-white" />
            </Button>
          )}
          <Badge className="bg-slate-800/80 text-white hover:bg-slate-800 border-0 font-mono text-xs">
            {request.referenceId}
          </Badge>
          
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

      <CardHeader className="pb-3 space-y-3">
        {/* Trajet et date */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-base">
              {request.fromCity} → {request.toCity}
            </span>
          </div>
          <p className="text-xs text-muted-foreground pl-6">
            Créée le {format(new Date(request.createdAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
          </p>
        </div>

        {/* Statut avec badges */}
        <div className="flex flex-wrap items-center gap-2">
          {showPaymentControls && getPaymentStatusBadge(request.paymentStatus)}
          {request.isHidden && <Badge variant="secondary">Masqué</Badge>}
        </div>

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
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          {request.client && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Client:</span>
              <a 
                href={`tel:${request.client.phoneNumber}`}
                className="text-[#5BC0EB] hover:underline font-medium"
                data-testid={`link-call-client-${request.id}`}
              >
                {request.client.phoneNumber}
              </a>
            </div>
          )}

          {qualifiedBy && (
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950 p-2 rounded-md border border-green-200 dark:border-green-800">
              <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-muted-foreground">Qualifiée par:</span>
              <span className="font-semibold text-green-700 dark:text-green-300" data-testid={`text-qualified-by-${request.id}`}>
                {qualifiedBy.name || qualifiedBy.phoneNumber}
              </span>
            </div>
          )}

          {isCoordination && request.assignedTo && (
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950 p-2 rounded-md border border-blue-200 dark:border-blue-800">
              <Compass className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-muted-foreground">Assignée à:</span>
              <span className="font-semibold text-blue-700 dark:text-blue-300" data-testid={`text-assigned-to-${request.id}`}>
                {request.assignedTo.name}
              </span>
            </div>
          )}

          {request.transporter && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Transporteur:</span>
              <a 
                href={`tel:${request.transporter.phoneNumber}`}
                className="text-[#5BC0EB] hover:underline font-medium"
                data-testid={`link-call-transporter-${request.id}`}
              >
                {request.transporter.phoneNumber}
              </a>
            </div>
          )}
        </div>

        {/* Description/Services */}
        {request.description && (
          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span className="font-medium">Descriptif</span>
            </div>
            <p className={`text-sm pl-6 ${expandedDescriptions[request.id] ? '' : 'line-clamp-2'}`}>
              {request.description}
            </p>
            <div className="flex items-center gap-3 pl-6">
              {request.description.length > 100 && (
                <button
                  onClick={() => setExpandedDescriptions(prev => ({
                    ...prev,
                    [request.id]: !prev[request.id]
                  }))}
                  className="text-xs text-[#17cfcf] hover:underline"
                  data-testid={`button-toggle-description-${request.id}`}
                >
                  {expandedDescriptions[request.id] ? 'Voir moins' : 'Plus de détails'}
                </button>
              )}
              
              {request.photos && request.photos.length > 0 && (
                <Button
                  size="sm"
                  className="h-6 text-xs gap-1.5 bg-[#17cfcf]/20 hover:bg-[#17cfcf]/30 text-[#17cfcf] border border-[#17cfcf]/40 hover:border-[#17cfcf]/60 transition-all font-medium"
                  onClick={() => handleViewPhotos(request.photos)}
                  data-testid={`button-view-photos-inline-${request.id}`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{request.photos.length} photo{request.photos.length > 1 ? 's' : ''}</span>
                </Button>
              )}
            </div>
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

        {/* Section Prix - Style modernisé comme transporteur */}
        {(request.transporterPrice || request.clientTotal || request.acceptedOffer) && (
          <div className="space-y-2">
            {request.transporterPrice && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#00ff88]/10 via-[#00ff88]/5 to-transparent border-l-4 border-[#00ff88]">
                <div className="w-7 h-7 rounded-full bg-[#00ff88]/20 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-4 h-4 text-[#00ff88]" />
                </div>
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Transporteur</span>
                <span className="text-lg font-bold text-[#00ff88] ml-auto">{Math.floor(request.transporterPrice).toLocaleString()} Dhs</span>
              </div>
            )}
            
            {request.clientTotal && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent border-l-4 border-blue-500">
                <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Client Total</span>
                <span className="text-lg font-bold text-blue-500 ml-auto">{Math.floor(request.clientTotal).toLocaleString()} Dhs</span>
              </div>
            )}

            {request.acceptedOffer && !request.transporterPrice && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#5BC0EB]/10 via-[#5BC0EB]/5 to-transparent border-l-4 border-[#5BC0EB]">
                <div className="w-7 h-7 rounded-full bg-[#5BC0EB]/20 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-4 h-4 text-[#5BC0EB]" />
                </div>
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Montant accepté</span>
                <span className="text-lg font-bold text-[#5BC0EB] ml-auto">{Math.floor(request.acceptedOffer.amount).toLocaleString()} Dhs</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2 text-sm">
          {/* Show interested transporters count for qualified workflow */}
          {interestedCount > 0 && request.qualifiedAt && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Transporteurs intéressés:</span>
              <Badge variant="outline" className="bg-[#17cfcf]/10 text-[#17cfcf] border-[#17cfcf]/30">
                {interestedCount}
              </Badge>
            </div>
          )}

          {/* Show offers for old workflow */}
          {request.offers && request.offers.length > 0 && (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Offres reçues:</span>
              <Badge variant="outline">{request.offers.length}</Badge>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {/* Actions Principales Visibles */}
          
          {/* Qualify button - Action principale */}
          {showQualifyButton && (
            <Button
              size="default"
              variant="default"
              className="bg-gradient-to-r from-[#17cfcf] to-[#13b3b3] hover:from-[#13b3b3] hover:to-[#0f9999] text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={() => handleOpenQualificationDialog(request)}
              data-testid={`button-qualify-${request.id}`}
            >
              <ClipboardCheck className="h-5 w-5 mr-2" />
              Qualifier cette demande
            </Button>
          )}

          {/* Requalify button */}
          {showQualifiedBy && (
            <Button
              size="default"
              variant="default"
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={() => handleOpenQualificationDialog(request)}
              data-testid={`button-requalify-${request.id}`}
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Requalifier
            </Button>
          )}

          {/* Transporteurs intéressés */}
          {interestedCount > 0 && request.qualifiedAt && !request.assignedTransporterId && (
            <Button
              size="default"
              variant="default"
              className="bg-gradient-to-r from-[#17cfcf] to-[#13b3b3] hover:from-[#13b3b3] hover:to-[#0f9999] text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={() => handleViewInterestedTransporters(request)}
              data-testid={`button-view-interested-${request.id}`}
            >
              <Users className="h-5 w-5 mr-2" />
              {interestedCount} Intéressé{interestedCount > 1 ? 's' : ''}
            </Button>
          )}

          {/* Offres (old workflow) */}
          {showVisibilityToggle && request.offers && request.offers.length > 0 && (
            <Button
              size="default"
              variant="default"
              className="bg-gradient-to-r from-[#5BC0EB] to-[#4AA8D8] hover:from-[#4AA8D8] hover:to-[#3997C5] text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={() => handleViewOffers(request)}
              data-testid={`button-view-offers-${request.id}`}
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              {request.offers.length} Offre{request.offers.length > 1 ? 's' : ''}
            </Button>
          )}

          {/* Missionner transporteur */}
          {isCoordination && !request.transporter && request.status !== 'accepted' && (
            <Button
              size="default"
              variant="default"
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={() => handleOpenManualAssignment(request)}
              data-testid={`button-manual-assignment-${request.id}`}
            >
              <Truck className="h-5 w-5 mr-2" />
              Missionner
            </Button>
          )}

          {/* Republier - Pour les demandes archivées */}
          {showRepublishButton && (
            <Button
              size="default"
              variant="default"
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={() => handleRepublishRequest(request.id)}
              data-testid={`button-republish-${request.id}`}
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Republier
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
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
        <div className="mb-6 flex items-center gap-3">
          <div className="bg-[#5BC0EB]/10 p-3 rounded-lg">
            <Compass className="h-8 w-8 text-[#5BC0EB]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Tableau de bord Coordinateur</h1>
            <p className="text-muted-foreground">Gestion et supervision des commandes</p>
          </div>
        </div>

        {/* Unified Search Bar with Filters */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par référence, client, transporteur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-city">
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Ville" />
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
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status">
                <ListFilter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tous les statuts">Tous les statuts</SelectItem>
                <SelectItem value="open">Ouvert</SelectItem>
                <SelectItem value="accepted">Accepté</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedDateFilter} onValueChange={setSelectedDateFilter}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-date">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les dates</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">7 derniers jours</SelectItem>
                <SelectItem value="month">30 derniers jours</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedCoordinator} onValueChange={setSelectedCoordinator}>
              <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-coordinator">
                <Users className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Coordinateur" />
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
            
            {(searchQuery || selectedCity !== "Toutes les villes" || selectedStatus !== "Tous les statuts" || selectedDateFilter !== "all" || selectedCoordinator !== "Tous les coordinateurs") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCity("Toutes les villes");
                  setSelectedStatus("Tous les statuts");
                  setSelectedDateFilter("all");
                  setSelectedCoordinator("Tous les coordinateurs");
                }}
                className="whitespace-nowrap"
                data-testid="button-clear-filters"
              >
                <X className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="nouveau" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="nouveau" data-testid="tab-nouveau" className="gap-1 px-2">
              <span className="text-xs sm:text-sm">Nouveau</span>
              <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-1.5 py-0">
                {nouveauLoading ? "..." : filterRequests(nouveauRequests).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="qualifies" data-testid="tab-qualifies" className="gap-1 px-2">
              <span className="text-xs sm:text-sm">Qualifiés</span>
              <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-1.5 py-0">
                {matchingLoading ? "..." : filterRequests(matchingRequests).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="interesses" data-testid="tab-interesses" className="gap-1 px-2">
              <span className="text-xs sm:text-sm">Intéressés</span>
              <Badge className="bg-purple-500 hover:bg-purple-600 text-white text-xs px-1.5 py-0">
                {matchingLoading ? "..." : filterRequests(matchingRequests.filter((r: any) => r.transporterInterests && r.transporterInterests.length > 0)).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="production" data-testid="tab-production" className="gap-1 px-2">
              <span className="text-xs sm:text-sm">En Production</span>
              <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs px-1.5 py-0">
                {(activeLoading || paymentLoading) ? "..." : filterRequests([...activeRequests, ...paymentRequests]).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="archives" data-testid="tab-archives" className="gap-1 px-2">
              <span className="text-xs sm:text-sm">Archives</span>
              <Badge className="bg-gray-500 hover:bg-gray-600 text-white text-xs px-1.5 py-0">
                {archivesLoading ? "..." : filterRequests(archivesRequests).length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* ONGLET 1: NOUVEAU - Demandes en attente de qualification */}
          <TabsContent value="nouveau" className="space-y-4">
            {nouveauLoading ? (
              <div className="flex justify-center py-12">
                <LoadingTruck />
              </div>
            ) : filterRequests(nouveauRequests).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune nouvelle commande à qualifier</p>
                </CardContent>
              </Card>
            ) : (
              filterRequests(nouveauRequests).map((request) => renderRequestCard(request, true, false, false, true))
            )}
          </TabsContent>

          {/* ONGLET 2: QUALIFIÉS - Demandes publiées pour matching transporteurs */}
          <TabsContent value="qualifies" className="space-y-4">
            {matchingLoading ? (
              <div className="flex justify-center py-12">
                <LoadingTruck />
              </div>
            ) : filterRequests(matchingRequests).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune commande qualifiée en attente de matching</p>
                </CardContent>
              </Card>
            ) : (
              filterRequests(matchingRequests).map((request) => renderRequestCard(request, true, false, false, false, true))
            )}
          </TabsContent>

          {/* ONGLET 3: INTÉRESSÉS - Demandes avec transporteurs intéressés */}
          <TabsContent value="interesses" className="space-y-4">
            {matchingLoading ? (
              <div className="flex justify-center py-12">
                <LoadingTruck />
              </div>
            ) : filterRequests(matchingRequests.filter((r: any) => r.transporterInterests && r.transporterInterests.length > 0)).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun transporteur intéressé pour le moment</p>
                </CardContent>
              </Card>
            ) : (
              filterRequests(matchingRequests.filter((r: any) => r.transporterInterests && r.transporterInterests.length > 0)).map((request) => (
                <Card key={request.id} className="overflow-hidden border-l-4 border-purple-500" data-testid={`card-interested-request-${request.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-purple-500 text-white">
                            {request.transporterInterests.length} intéressé{request.transporterInterests.length > 1 ? 's' : ''}
                          </Badge>
                          <h3 className="text-lg font-bold" data-testid={`text-ref-${request.id}`}>
                            {request.referenceId}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <MapPin className="h-4 w-4" />
                          <span className="font-medium">{request.fromCity}</span>
                          <span>→</span>
                          <span className="font-medium">{request.toCity}</span>
                        </div>
                        {request.dateTime && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(request.dateTime), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                          </div>
                        )}
                      </div>
                      <Button
                        size="lg"
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => {
                          setSelectedRequestForInterested(request);
                          setInterestedTransportersDialogOpen(true);
                        }}
                        data-testid={`button-view-interested-${request.id}`}
                      >
                        <Eye className="h-5 w-5 mr-2" />
                        Voir détails & Assigner
                      </Button>
                    </div>
                    
                    {/* Contact Client */}
                    {request.client && request.client.phoneNumber && (
                      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-700 dark:to-cyan-700 rounded-lg p-3 border border-blue-500 shadow-md mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-full">
                              <Phone className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-xs text-white/80 font-medium uppercase tracking-wide">Client</p>
                              <p className="font-bold text-base text-white">{request.client.name || 'Client'}</p>
                            </div>
                          </div>
                          <a
                            href={`tel:${request.client.phoneNumber}`}
                            className="flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-700 px-4 py-2 rounded-md font-bold text-sm transition-colors shadow-sm"
                            data-testid={`link-call-client-${request.id}`}
                          >
                            <Phone className="h-4 w-4" />
                            {request.client.phoneNumber}
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {/* Prix qualifiés */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-lg p-5 border border-slate-700 shadow-lg">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 rounded-md bg-slate-700/30 border border-slate-600/50">
                          <p className="text-xs font-medium text-slate-300 mb-2">Transporteur</p>
                          <p className="text-2xl font-bold text-white">{request.transporterAmount || 0} DH</p>
                        </div>
                        <div className="text-center p-3 rounded-md bg-orange-500/20 border border-orange-500/50">
                          <p className="text-xs font-medium text-orange-200 mb-2">Commission</p>
                          <p className="text-2xl font-bold text-orange-400">+{request.platformFee || 0} DH</p>
                        </div>
                        <div className="text-center p-3 rounded-md bg-[#17cfcf]/20 border border-[#17cfcf]/50">
                          <p className="text-xs font-medium text-cyan-200 mb-2">Total client</p>
                          <p className="text-2xl font-bold text-[#17cfcf]">{request.clientTotal || 0} DH</p>
                        </div>
                      </div>
                    </div>

                    {request.description && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">{request.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* ONGLET 4: EN PRODUCTION - Commandes actives et en paiement */}
          <TabsContent value="production" className="space-y-4">
            {(activeLoading || paymentLoading) ? (
              <div className="flex justify-center py-12">
                <LoadingTruck />
              </div>
            ) : filterRequests([...activeRequests, ...paymentRequests]).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune commande en production</p>
                </CardContent>
              </Card>
            ) : (
              filterRequests([...activeRequests, ...paymentRequests]).map((request) => 
                renderRequestCard(request, false, true, false, false)
              )
            )}
          </TabsContent>

          {/* ONGLET 4: ARCHIVES - Commandes archivées */}
          <TabsContent value="archives" className="space-y-4">
            {archivesLoading ? (
              <div className="flex justify-center py-12">
                <LoadingTruck />
              </div>
            ) : filterRequests(archivesRequests).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune commande archivée</p>
                </CardContent>
              </Card>
            ) : (
              filterRequests(archivesRequests).map((request) => renderRequestCard(request, false, false, false, false, false, true))
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
                <p className="font-medium">{selectedRequest.goodsType}</p>
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
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier la commande</DialogTitle>
              <DialogDescription>
                Modification complète des informations de la commande
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Villes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Ville de départ</label>
                  <Select
                    value={editFormData.fromCity}
                    onValueChange={(value) => setEditFormData({ ...editFormData, fromCity: value })}
                  >
                    <SelectTrigger data-testid="select-edit-from-city">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city: any) => (
                        <SelectItem key={city.id} value={city.name}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Ville d'arrivée</label>
                  <Select
                    value={editFormData.toCity}
                    onValueChange={(value) => setEditFormData({ ...editFormData, toCity: value })}
                  >
                    <SelectTrigger data-testid="select-edit-to-city">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city: any) => (
                        <SelectItem key={city.id} value={city.name}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                            <span className="font-medium">{request.goodsType}</span>
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
    </div>
  );
}
