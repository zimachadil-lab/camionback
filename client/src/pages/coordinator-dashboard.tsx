import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, ListFilter, Package, Phone, CheckCircle, MapPin, MessageSquare, MessageCircle, Eye, EyeOff, Edit, DollarSign, Compass, ExternalLink, Star, Truck } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChatWindow } from "@/components/chat/chat-window";
import { PhotoGalleryDialog } from "@/components/transporter/photo-gallery-dialog";
import { LoadingTruck } from "@/components/ui/loading-truck";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
  const [selectedPhotoTransporterId, setSelectedPhotoTransporterId] = useState<string | null>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);

  // Fetch truck photo for selected transporter
  const { data: truckPhotoData } = useQuery({
    queryKey: ["/api/admin/transporters", selectedPhotoTransporterId, "photo"],
    queryFn: async () => {
      if (!selectedPhotoTransporterId) return null;
      const response = await fetch(`/api/admin/transporters/${selectedPhotoTransporterId}/photo`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: photoDialogOpen && !!selectedPhotoTransporterId,
  });

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

  const handleViewTruckPhoto = (transporterId: string) => {
    setSelectedPhotoTransporterId(transporterId);
    setPhotoDialogOpen(true);
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 mt-4" data-testid="grid-offers">
        {offers.map((offer: any) => (
          <Card key={offer.id} className="overflow-hidden" data-testid={`card-offer-${offer.id}`}>
            <CardContent className="p-4 space-y-3">
              {/* Truck Photo Button */}
              {offer.transporter?.id && (
                <div className="mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => handleViewTruckPhoto(offer.transporter.id)}
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
            {truckPhotoData?.truckPhoto ? (
              <img
                src={truckPhotoData.truckPhoto}
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

export default function CoordinatorDashboard() {
  const [, setLocation] = useLocation();
  const [selectedCity, setSelectedCity] = useState("Toutes les villes");
  const [selectedStatus, setSelectedStatus] = useState("Tous les statuts");
  const [searchQuery, setSearchQuery] = useState("");
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
  const { toast} = useToast();

  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("camionback_user") || "{}"));

  // Refresh user data from database on mount
  useEffect(() => {
    const refreshUserData = async () => {
      try {
        const response = await fetch(`/api/auth/me/${user.id}`);
        if (response.ok) {
          const { user: updatedUser } = await response.json();
          localStorage.setItem("camionback_user", JSON.stringify(updatedUser));
          setUser(updatedUser);
        } else if (response.status === 404) {
          localStorage.removeItem("camionback_user");
          window.location.href = "/";
        }
      } catch (error) {
        console.error("Failed to refresh user data:", error);
      }
    };

    if (user.id) {
      refreshUserData();
    }
  }, [user.id]);

  const handleLogout = () => {
    localStorage.removeItem("camionback_user");
    window.location.href = "/";
  };

  // Fetch all available requests (open status)
  const { data: availableRequests = [], isLoading: availableLoading } = useQuery({
    queryKey: ["/api/coordinator/available-requests"],
    queryFn: async () => {
      const response = await fetch("/api/coordinator/available-requests");
      return response.json();
    },
  });

  // Fetch requests in progress (accepted status)
  const { data: activeRequests = [], isLoading: activeLoading } = useQuery({
    queryKey: ["/api/coordinator/active-requests"],
    queryFn: async () => {
      const response = await fetch("/api/coordinator/active-requests");
      return response.json();
    },
  });

  // Fetch payment pending requests
  const { data: paymentRequests = [], isLoading: paymentLoading } = useQuery({
    queryKey: ["/api/coordinator/payment-requests"],
    queryFn: async () => {
      const response = await fetch("/api/coordinator/payment-requests");
      return response.json();
    },
  });

  // Fetch cities for filtering
  const { data: cities = [] } = useQuery({
    queryKey: ["/api/cities"],
    queryFn: async () => {
      const response = await fetch("/api/cities");
      return response.json();
    },
  });

  // Toggle request visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ requestId, isHidden }: { requestId: string; isHidden: boolean }) => {
      return apiRequest("PATCH", `/api/coordinator/requests/${requestId}/toggle-visibility`, { isHidden });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/available-requests"] });
      toast({
        title: "Succès",
        description: "Visibilité de la commande modifiée",
      });
    },
    onError: () => {
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

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    setDetailsDialogOpen(true);
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

  const filterRequests = (requests: any[], applyStatusFilter = true) => {
    return requests.filter((request) => {
      const matchesCity = selectedCity === "Toutes les villes" || 
        request.fromCity === selectedCity || 
        request.toCity === selectedCity;
      const matchesStatus = !applyStatusFilter || selectedStatus === "Tous les statuts" || 
        request.status === selectedStatus;
      const matchesSearch = searchQuery === "" ||
        request.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (request.client?.name && request.client.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (request.transporter?.name && request.transporter.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCity && matchesStatus && matchesSearch;
    });
  };

  const renderRequestCard = (request: any, showVisibilityToggle = false, showPaymentControls = false) => (
    <Card key={request.id} className="hover-elevate" data-testid={`card-request-${request.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">{request.referenceId}</CardTitle>
              {request.client && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWhatsAppContactClient(request.client.phoneNumber, request.referenceId);
                  }}
                  data-testid={`button-whatsapp-client-${request.id}`}
                  title="Contacter le client via WhatsApp"
                >
                  <MessageCircle className="h-4 w-4 text-green-500" />
                </Button>
              )}
              {getRequestStatusBadge(request.status)}
              {showPaymentControls && getPaymentStatusBadge(request.paymentStatus)}
              {request.isHidden && <Badge variant="secondary">Masqué</Badge>}
            </div>
            <CardDescription className="text-sm mt-1">
              {request.fromCity} → {request.toCity}
            </CardDescription>
            <p className="text-xs text-muted-foreground mt-1">
              Créée le {format(new Date(request.createdAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
            </p>
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

          {request.client && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Client:</span>
              <span className="font-medium">{request.client.name || "Non défini"}</span>
              <a 
                href={`tel:${request.client.phoneNumber}`}
                className="text-[#5BC0EB] hover:underline"
                data-testid={`link-call-client-${request.id}`}
              >
                {request.client.phoneNumber}
              </a>
            </div>
          )}

          {request.transporter && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Transporteur:</span>
              <span className="font-medium">{request.transporter.name || "Non défini"}</span>
              <a 
                href={`tel:${request.transporter.phoneNumber}`}
                className="text-[#5BC0EB] hover:underline"
                data-testid={`link-call-transporter-${request.id}`}
              >
                {request.transporter.phoneNumber}
              </a>
            </div>
          )}

          {request.offers && request.offers.length > 0 && (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Offres reçues:</span>
              <Badge variant="outline">{request.offers.length}</Badge>
            </div>
          )}

          {request.acceptedOffer && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Montant accepté:</span>
              <span className="font-bold text-[#5BC0EB]">{request.acceptedOffer.amount} DH</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewDetails(request)}
            data-testid={`button-view-details-${request.id}`}
          >
            👁️ Détails
          </Button>

          {request.photos && request.photos.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleViewPhotos(request.photos)}
              data-testid={`button-view-photos-${request.id}`}
            >
              📷 Photos ({request.photos.length})
            </Button>
          )}

          {request.client && request.transporter && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenChat(request.client, request.transporter, request.id)}
              data-testid={`button-open-chat-${request.id}`}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Messagerie
            </Button>
          )}

          {request.transporter && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleWhatsAppContact(request.transporter.phoneNumber, request.referenceId)}
              data-testid={`button-whatsapp-transporter-${request.id}`}
            >
              🟢 WhatsApp Transporteur
            </Button>
          )}

          {showVisibilityToggle && request.offers && request.offers.length > 0 && (
            <Button
              size="sm"
              variant="default"
              className="bg-[#5BC0EB] hover:bg-[#4AA8D8]"
              onClick={() => handleViewOffers(request)}
              data-testid={`button-view-offers-${request.id}`}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Offres ({request.offers.length})
            </Button>
          )}

          {showVisibilityToggle && (
            <Button
              size="sm"
              variant={request.isHidden ? "default" : "secondary"}
              onClick={() => toggleVisibilityMutation.mutate({ 
                requestId: request.id, 
                isHidden: !request.isHidden 
              })}
              disabled={toggleVisibilityMutation.isPending}
              data-testid={`button-toggle-visibility-${request.id}`}
            >
              {request.isHidden ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
              {request.isHidden ? "Réafficher" : "Masquer"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

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

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
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
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-city">
              <ListFilter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrer par ville" />
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
            <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-status">
              <ListFilter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Tous les statuts">Tous les statuts</SelectItem>
              <SelectItem value="open">Ouvert</SelectItem>
              <SelectItem value="accepted">Accepté</SelectItem>
              <SelectItem value="completed">Terminé</SelectItem>
              <SelectItem value="cancelled">Annulé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="available" data-testid="tab-available" className="gap-1 px-2">
              <span className="text-xs sm:text-sm">Dispo</span>
              <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-1.5 py-0">
                {filterRequests(availableRequests).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="active" data-testid="tab-active" className="gap-1 px-2">
              <span className="text-xs sm:text-sm">À traiter</span>
              <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-1.5 py-0">
                {filterRequests(activeRequests, false).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="payment" data-testid="tab-payment" className="gap-1 px-2">
              <span className="text-xs sm:text-sm">À payer</span>
              <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs px-1.5 py-0">
                {filterRequests(paymentRequests, false).length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            {availableLoading ? (
              <div className="flex justify-center py-12">
                <LoadingTruck />
              </div>
            ) : filterRequests(availableRequests).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune commande disponible</p>
                </CardContent>
              </Card>
            ) : (
              filterRequests(availableRequests).map((request) => renderRequestCard(request, true, false))
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {activeLoading ? (
              <div className="flex justify-center py-12">
                <LoadingTruck />
              </div>
            ) : filterRequests(activeRequests, false).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune commande à traiter</p>
                </CardContent>
              </Card>
            ) : (
              filterRequests(activeRequests, false).map((request) => renderRequestCard(request, false, false))
            )}
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            {paymentLoading ? (
              <div className="flex justify-center py-12">
                <LoadingTruck />
              </div>
            ) : filterRequests(paymentRequests, false).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune commande en attente de paiement</p>
                </CardContent>
              </Card>
            ) : (
              filterRequests(paymentRequests, false).map((request) => (
                <Card key={request.id} className="hover-elevate" data-testid={`card-payment-${request.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base">{request.referenceId}</CardTitle>
                          {getPaymentStatusBadge(request.paymentStatus)}
                        </div>
                        <CardDescription className="text-sm mt-1">
                          {request.fromCity} → {request.toCity}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      {request.acceptedOffer && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Montant:</span>
                          <span className="font-bold text-[#5BC0EB]">{request.acceptedOffer.amount} DH</span>
                        </div>
                      )}

                      {request.client && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Client:</span>
                          <span className="font-medium">{request.client.name}</span>
                          <a href={`tel:${request.client.phoneNumber}`} className="text-[#5BC0EB] hover:underline">
                            {request.client.phoneNumber}
                          </a>
                        </div>
                      )}

                      {request.transporter && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Transporteur:</span>
                          <span className="font-medium">{request.transporter.name}</span>
                          <a href={`tel:${request.transporter.phoneNumber}`} className="text-[#5BC0EB] hover:underline">
                            {request.transporter.phoneNumber}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Select
                        value={request.paymentStatus}
                        onValueChange={(value) => updatePaymentStatusMutation.mutate({ 
                          requestId: request.id, 
                          paymentStatus: value 
                        })}
                      >
                        <SelectTrigger className="w-[180px]" data-testid={`select-payment-status-${request.id}`}>
                          <SelectValue placeholder="Statut paiement" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">À facturer</SelectItem>
                          <SelectItem value="awaiting_payment">En attente paiement</SelectItem>
                          <SelectItem value="pending_admin_validation">Validation admin</SelectItem>
                          <SelectItem value="paid">Payé</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(request)}
                        data-testid={`button-view-details-payment-${request.id}`}
                      >
                        👁️ Détails
                      </Button>

                      {request.client && request.transporter && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenChat(request.client, request.transporter, request.id)}
                          data-testid={`button-open-chat-payment-${request.id}`}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Messagerie
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
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
                    <p><span className="text-muted-foreground">Nom:</span> {selectedRequest.client.name || "Non défini"}</p>
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
                    <p><span className="text-muted-foreground">Nom:</span> {selectedRequest.transporter.name || "Non défini"}</p>
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
              <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
