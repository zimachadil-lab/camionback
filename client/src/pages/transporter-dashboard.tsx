import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, ListFilter, Package, Phone, CheckCircle, MapPin, MessageSquare, Image as ImageIcon, Clock, Calendar, Flag, Edit, TruckIcon } from "lucide-react";
import { Header } from "@/components/layout/header";
import { RequestCard } from "@/components/transporter/request-card";
import { OfferForm } from "@/components/transporter/offer-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChatWindow } from "@/components/chat/chat-window";
import { PhotoGalleryDialog } from "@/components/transporter/photo-gallery-dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

const reportSchema = z.object({
  description: z.string().min(10, "Description minimale: 10 caractères"),
  type: z.string().min(1, "Type de problème requis"),
});

const editOfferSchema = z.object({
  amount: z.coerce.number().min(1, "Le montant doit être supérieur à 0"),
  pickupDate: z.string().min(1, "Date de prise en charge requise"),
  loadType: z.enum(["return", "shared"], {
    required_error: "Type de chargement requis",
  }),
});

export default function TransporterDashboard() {
  const [, setLocation] = useLocation();
  const [selectedCity, setSelectedCity] = useState("Toutes les villes");
  const [searchQuery, setSearchQuery] = useState("");
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string>("");
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string; role: string } | null>(null);
  const [chatRequestId, setChatRequestId] = useState<string>("");
  const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [selectedReferenceId, setSelectedReferenceId] = useState("");
  const [clientDetailsOpen, setClientDetailsOpen] = useState(false);
  const [selectedClientDetails, setSelectedClientDetails] = useState<any>(null);
  const [announceReturnOpen, setAnnounceReturnOpen] = useState(false);
  const [returnFromCity, setReturnFromCity] = useState("");
  const [returnToCity, setReturnToCity] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportRequestId, setReportRequestId] = useState<string>("");
  const [editOfferDialogOpen, setEditOfferDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [notValidatedDialogOpen, setNotValidatedDialogOpen] = useState(false);

  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("camionback_user") || "{}"));

  // Refresh user data from database on mount to get latest status
  useEffect(() => {
    const refreshUserData = async () => {
      try {
        const response = await fetch(`/api/auth/me/${user.id}`);
        if (response.ok) {
          const { user: updatedUser } = await response.json();
          // Update localStorage with fresh data
          localStorage.setItem("camionback_user", JSON.stringify(updatedUser));
          setUser(updatedUser);
        } else if (response.status === 404) {
          // User not found - clear localStorage and redirect to login
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

  // Initialize edit offer form when offer is selected
  useEffect(() => {
    if (selectedOffer && editOfferDialogOpen) {
      editOfferForm.reset({
        amount: selectedOffer.amount.toString(),
        pickupDate: selectedOffer.pickupDate ? new Date(selectedOffer.pickupDate).toISOString().split('T')[0] : "",
        loadType: selectedOffer.loadType || "return",
      });
    }
  }, [selectedOffer, editOfferDialogOpen]);

  const handleLogout = () => {
    // Clear user session
    localStorage.removeItem("camionback_user");
    // Force page reload to clear all state
    window.location.href = "/";
  };

  const handleAnnounceReturn = () => {
    // Check if transporter is validated
    if (user.status === "validated") {
      // Allow access to announce return form
      setAnnounceReturnOpen(true);
    } else {
      // Show blocking dialog for non-validated transporters
      setNotValidatedDialogOpen(true);
    }
  };

  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/requests", user.id],
    queryFn: async () => {
      const response = await fetch(`/api/requests?status=open&transporterId=${user.id}`);
      return response.json();
    },
  });

  const { data: myOffers = [], isLoading: offersLoading } = useQuery({
    queryKey: ["/api/offers", user.id],
    queryFn: async () => {
      const response = await fetch(`/api/offers?transporterId=${user.id}`);
      return response.json();
    },
    refetchInterval: 5000,
  });

  const { data: allRequests = [] } = useQuery({
    queryKey: ["/api/requests/all"],
    queryFn: async () => {
      const response = await fetch("/api/requests");
      return response.json();
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      return response.json();
    },
  });

  const { data: acceptedRequests = [], isLoading: acceptedLoading } = useQuery({
    queryKey: ["/api/requests/accepted", user.id],
    queryFn: async () => {
      const response = await fetch(`/api/requests?accepted=true&transporterId=${user.id}`);
      return response.json();
    },
    refetchInterval: 5000,
  });

  const handleMakeOffer = (requestId: string) => {
    setSelectedRequestId(requestId);
    setOfferDialogOpen(true);
  };

  const handleChat = (clientId: string, clientIdentifier: string, requestId: string) => {
    if (!requestId) {
      console.error('Cannot open chat: requestId is missing');
      return;
    }
    setSelectedClient({ id: clientId, name: clientIdentifier || "Client", role: "client" });
    setChatRequestId(requestId);
    setChatOpen(true);
  };

  const handleViewPhotos = (photos: string[], referenceId: string) => {
    setSelectedPhotos(photos);
    setSelectedReferenceId(referenceId);
    setPhotoGalleryOpen(true);
  };

  const handleViewClientDetails = (request: any) => {
    const client = users.find((u: any) => u.id === request.clientId);
    setSelectedClientDetails({
      ...request,
      clientId: client?.clientId,
      clientPhone: client?.phoneNumber,
      clientCity: client?.city,
    });
    setClientDetailsOpen(true);
  };

  // Fetch cities from API
  const { data: cities = [], isLoading: citiesLoading } = useQuery({
    queryKey: ["/api/cities"],
    queryFn: async () => {
      const response = await fetch("/api/cities");
      return response.json();
    },
  });

  const { toast } = useToast();

  const markForBillingMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await apiRequest("POST", `/api/requests/${requestId}/mark-for-billing`, {
        transporterId: user.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "La commande a été marquée comme à facturer",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/requests/accepted"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de la mise à jour",
      });
    },
  });

  const declineRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await apiRequest("POST", `/api/requests/${requestId}/decline`, {
        transporterId: user.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Commande masquée",
        description: "Cette commande ne sera plus affichée",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de l'opération",
      });
    },
  });

  const trackViewMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await apiRequest("POST", `/api/requests/${requestId}/track-view`, {});
    },
  });

  const announceReturnMutation = useMutation({
    mutationFn: async (data: { fromCity: string; toCity: string; returnDate: string }) => {
      return await apiRequest("POST", "/api/empty-returns", {
        transporterId: user.id,
        ...data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Votre retour à vide a été annoncé",
      });
      setAnnounceReturnOpen(false);
      // Reset form fields
      setReturnFromCity("");
      setReturnToCity("");
      setReturnDate("");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de l'annonce du retour",
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

  const editOfferForm = useForm({
    resolver: zodResolver(editOfferSchema),
    defaultValues: {
      amount: "",
      pickupDate: "",
      loadType: "return" as const,
    },
  });

  const updateOfferMutation = useMutation({
    mutationFn: async (data: { offerId: string; amount: number; pickupDate: string; loadType: string }) => {
      return await apiRequest("PATCH", `/api/offers/${data.offerId}`, {
        amount: data.amount,
        pickupDate: data.pickupDate,
        loadType: data.loadType,
      });
    },
    onSuccess: () => {
      toast({
        title: "Offre modifiée",
        description: "Votre offre a été mise à jour avec succès",
      });
      setEditOfferDialogOpen(false);
      editOfferForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de la modification de l'offre",
      });
    },
  });

  const createReportMutation = useMutation({
    mutationFn: async (data: { requestId: string; description: string; type: string }) => {
      // Get the request to find the client ID
      const request = [...requests, ...acceptedRequests].find((r: any) => r.id === data.requestId);
      const clientId = request?.clientId || "";
      
      return await apiRequest("POST", "/api/reports", {
        requestId: data.requestId,
        reporterId: user.id,
        reporterType: "transporter",
        reportedUserId: clientId,
        reason: data.type,
        details: data.description,
      });
    },
    onSuccess: () => {
      toast({
        title: "Signalement envoyé",
        description: "Votre signalement a été envoyé à l'équipe support",
      });
      setShowReportDialog(false);
      reportForm.reset();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de l'envoi du signalement",
      });
    },
  });

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

  const handleDeclineRequest = (requestId: string) => {
    if (confirm("Voulez-vous vraiment masquer cette commande ? Elle ne sera plus visible dans votre liste.")) {
      declineRequestMutation.mutate(requestId);
    }
  };

  const filteredRequests = requests.filter((req: any) => {
    // Exclude requests declined by this transporter
    const notDeclined = !req.declinedBy || !req.declinedBy.includes(user.id);
    const cityMatch: boolean = selectedCity === "Toutes les villes" || 
                     req.fromCity === selectedCity || 
                     req.toCity === selectedCity;
    const searchMatch: boolean = searchQuery === "" || 
                       req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       req.goodsType.toLowerCase().includes(searchQuery.toLowerCase());
    return notDeclined && cityMatch && searchMatch;
  });

  // Count offers per request for display
  const offerCounts = myOffers.reduce((acc: any, offer: any) => {
    acc[offer.requestId] = (acc[offer.requestId] || 0) + 1;
    return acc;
  }, {});

  if (requestsLoading || offersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={user}
        onAnnounceReturn={handleAnnounceReturn}
        onLogout={handleLogout}
      />
      
      {/* Pending validation message */}
      {user.status === "pending" && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 p-4 mx-4 mt-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                Compte en cours de validation
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                Votre compte est en cours de validation par l'équipe CamionBack. 
                Vous serez notifié dès son approbation et pourrez alors accéder à toutes les fonctionnalités.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground mt-1">Trouvez des demandes de transport</p>
        </div>

        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full max-w-3xl grid-cols-3">
            <TabsTrigger value="available" data-testid="tab-available">
              <Search className="mr-2 h-4 w-4" />
              Disponibles (<span className="text-[#00ff99]">{filteredRequests.length}</span>)
            </TabsTrigger>
            <TabsTrigger value="my-offers" data-testid="tab-my-offers">
              <Package className="mr-2 h-4 w-4" />
              Mes offres
            </TabsTrigger>
            <TabsTrigger value="to-process" data-testid="tab-to-process">
              <CheckCircle className="mr-2 h-4 w-4" />
              À traiter ({acceptedRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="mt-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-requests"
                />
              </div>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-city-filter">
                  <ListFilter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Toutes les villes">Toutes les villes</SelectItem>
                  {citiesLoading ? (
                    <div className="p-2 text-sm text-muted-foreground">Chargement...</div>
                  ) : (
                    cities.map((city: any) => (
                      <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {filteredRequests.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredRequests.map((request: any) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onMakeOffer={handleMakeOffer}
                    userStatus={user.status}
                    offerCount={offerCounts[request.id] || 0}
                    onDecline={handleDeclineRequest}
                    onTrackView={() => trackViewMutation.mutate(request.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Aucune demande trouvée
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-offers" className="mt-6 space-y-6">
            {myOffers.length > 0 ? (
              <div className="space-y-4">
                {myOffers.map((offer: any) => {
                  const request = allRequests.find((r: any) => r.id === offer.requestId);
                  const client = users.find((u: any) => u.id === request?.clientId);
                  const isAccepted = offer.status === "accepted";

                  return (
                    <Card key={offer.id} className="hover-elevate">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge 
                              variant={
                                offer.status === "pending" ? "outline" :
                                offer.status === "accepted" ? "default" :
                                "secondary"
                              }
                              className={isAccepted ? "bg-green-600" : ""}
                            >
                              {isAccepted && <CheckCircle className="w-3 h-3 mr-1" />}
                              {offer.status === "pending" ? "En attente" :
                               offer.status === "accepted" ? "Acceptée" :
                               "Refusée"}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Référence: <span className="font-semibold text-foreground">{request?.referenceId}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-primary">{offer.amount} MAD</span>
                            {offer.status === "pending" && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedOffer(offer);
                                  setEditOfferDialogOpen(true);
                                }}
                                data-testid={`button-edit-offer-${offer.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {request && (
                          <>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span>{request.fromCity} → {request.toCity}</span>
                            </div>

                            {request.photos && request.photos.length > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewPhotos(request.photos, request.referenceId)}
                                className="gap-2"
                                data-testid={`button-view-offer-photos-${offer.id}`}
                              >
                                <ImageIcon className="w-4 h-4" />
                                Voir les photos ({request.photos.length})
                              </Button>
                            )}
                          </>
                        )}

                        {isAccepted && client && (
                          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4 space-y-3">
                            <p className="text-sm font-medium text-green-900 dark:text-green-100 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Votre offre a été acceptée !
                            </p>
                            <div className="space-y-2">
                              <p className="text-sm text-green-800 dark:text-green-200">
                                Vous pouvez maintenant contacter le client :
                              </p>
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-green-700 dark:text-green-300" />
                                <a 
                                  href={`tel:${client.phoneNumber}`} 
                                  className="text-lg font-semibold text-green-700 dark:text-green-300 hover:underline"
                                  data-testid={`link-client-phone-${offer.id}`}
                                >
                                  {client.phoneNumber}
                                </a>
                              </div>
                              <p className="text-xs text-green-700 dark:text-green-400">
                                Client {client.clientId || "Non défini"}
                              </p>
                              {request && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleChat(client.id, client.clientId || "Client", request.id)}
                                  className="gap-2 mt-2 w-full"
                                  data-testid={`button-chat-${offer.id}`}
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  Envoyer un message
                                </Button>
                              )}
                            </div>
                          </div>
                        )}

                        {offer.message && (
                          <p className="text-sm text-muted-foreground border-l-2 border-primary pl-3">
                            {offer.message}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Vous n'avez pas encore fait d'offres
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="to-process" className="mt-6 space-y-6">
            {acceptedRequests.length > 0 ? (
              <div className="space-y-4">
                {acceptedRequests.map((request: any) => {
                  const client = users.find((u: any) => u.id === request.clientId);
                  const isMarkedForBilling = request.paymentStatus === "awaiting_payment";

                  return (
                    <Card key={request.id} className="hover-elevate">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold">{request.referenceId}</h3>
                              {isMarkedForBilling && (
                                <Badge variant="default" className="bg-orange-600">
                                  En attente de paiement client
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {request.fromCity} → {request.toCity}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewClientDetails(request)}
                              className="gap-2"
                              data-testid={`button-view-client-${request.id}`}
                            >
                              <Phone className="h-4 w-4" />
                              Voir les détails
                            </Button>
                            {!isMarkedForBilling && request.status !== "completed" && request.paymentStatus !== "paid" && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => markForBillingMutation.mutate(request.id)}
                                disabled={markForBillingMutation.isPending}
                                className="gap-2"
                                data-testid={`button-mark-billing-${request.id}`}
                              >
                                <CheckCircle className="h-4 w-4" />
                                Marquer comme à facturer
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleOpenReportDialog(request.id)}
                              data-testid={`button-report-${request.id}`}
                              className="gap-2"
                            >
                              <Flag className="h-4 w-4" />
                              <span className="hidden sm:inline">Signaler</span>
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Type de marchandise</p>
                              <p className="font-medium">{request.goodsType}</p>
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
                          
                          {request.photos && request.photos.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewPhotos(request.photos, request.referenceId)}
                              className="gap-2"
                              data-testid={`button-view-request-photos-${request.id}`}
                            >
                              <ImageIcon className="w-4 h-4" />
                              Voir les photos ({request.photos.length})
                            </Button>
                          )}
                        </div>

                        {client && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleChat(client.id, client.clientId || "Client", request.id)}
                            className="gap-2 w-full sm:w-auto bg-[#00cc88] hover:bg-[#00cc88]/90 text-white border-[#00cc88]"
                            data-testid={`button-chat-request-${request.id}`}
                            style={{ textShadow: "0 1px 1px rgba(0,0,0,0.2)" }}
                          >
                            <MessageSquare className="w-4 w-4" />
                            Envoyer un message au client
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Aucune commande à traiter
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <OfferForm
        open={offerDialogOpen}
        onClose={() => setOfferDialogOpen(false)}
        requestId={selectedRequestId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
        }}
      />

      {selectedClient && (
        <ChatWindow
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          otherUser={selectedClient}
          currentUserId={user.id}
          currentUserRole="transporter"
          requestId={chatRequestId}
        />
      )}

      <PhotoGalleryDialog
        open={photoGalleryOpen}
        onClose={() => setPhotoGalleryOpen(false)}
        photos={selectedPhotos}
        referenceId={selectedReferenceId}
      />

      <Dialog open={clientDetailsOpen} onOpenChange={setClientDetailsOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Détails du client</DialogTitle>
          </DialogHeader>
          {selectedClientDetails && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Commande</p>
                <p className="font-semibold text-lg">{selectedClientDetails.referenceId}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Identifiant</p>
                <p className="font-medium">Client {selectedClientDetails.clientId || "Non défini"}</p>
              </div>

              {selectedClientDetails.clientCity && (
                <div>
                  <p className="text-sm text-muted-foreground">Ville</p>
                  <p className="font-medium">{selectedClientDetails.clientCity}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-muted-foreground">Téléphone</p>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <a 
                    href={`tel:${selectedClientDetails.clientPhone}`} 
                    className="font-semibold text-primary hover:underline text-lg"
                    data-testid="link-client-phone-details"
                  >
                    {selectedClientDetails.clientPhone}
                  </a>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">Trajet</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium">
                    {selectedClientDetails.fromCity} → {selectedClientDetails.toCity}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setClientDetailsOpen(false)}
                className="w-full"
                data-testid="button-close-client-details"
              >
                Fermer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Announce Empty Return Dialog */}
      <Dialog open={announceReturnOpen} onOpenChange={setAnnounceReturnOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Annoncer un retour à vide</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Ville de départ</label>
              <Select value={returnFromCity} onValueChange={setReturnFromCity}>
                <SelectTrigger data-testid="select-return-from-city">
                  <SelectValue placeholder="Sélectionner la ville de départ" />
                </SelectTrigger>
                <SelectContent>
                  {citiesLoading ? (
                    <div className="p-2 text-sm text-muted-foreground">Chargement...</div>
                  ) : (
                    cities.map((city: any) => (
                      <SelectItem key={city.id} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Ville d'arrivée</label>
              <Select value={returnToCity} onValueChange={setReturnToCity}>
                <SelectTrigger data-testid="select-return-to-city">
                  <SelectValue placeholder="Sélectionner la ville d'arrivée" />
                </SelectTrigger>
                <SelectContent>
                  {citiesLoading ? (
                    <div className="p-2 text-sm text-muted-foreground">Chargement...</div>
                  ) : (
                    cities.map((city: any) => (
                      <SelectItem key={city.id} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Date de retour</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="pl-10"
                  data-testid="input-return-date"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setAnnounceReturnOpen(false)}
                className="flex-1"
                data-testid="button-cancel-return"
              >
                Annuler
              </Button>
              <Button
                onClick={() => {
                  if (!returnFromCity || !returnToCity || !returnDate) {
                    toast({
                      variant: "destructive",
                      title: "Erreur",
                      description: "Veuillez remplir tous les champs",
                    });
                    return;
                  }
                  announceReturnMutation.mutate({
                    fromCity: returnFromCity,
                    toCity: returnToCity,
                    returnDate,
                  });
                }}
                disabled={announceReturnMutation.isPending}
                className="flex-1 bg-[#00d4b2] hover:bg-[#00d4b2] border border-[#00d4b2]"
                data-testid="button-submit-return"
              >
                {announceReturnMutation.isPending ? "En cours..." : "Annoncer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Offer Dialog */}
      <Dialog open={editOfferDialogOpen} onOpenChange={(open) => {
        setEditOfferDialogOpen(open);
        if (!open) {
          editOfferForm.reset();
          setSelectedOffer(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier votre offre</DialogTitle>
            <DialogDescription>
              Modifiez le montant, la date ou le type de chargement de votre offre
            </DialogDescription>
          </DialogHeader>
          <Form {...editOfferForm}>
            <form 
              onSubmit={editOfferForm.handleSubmit((data) => {
                if (!selectedOffer) return;
                const amount = typeof data.amount === 'number' ? data.amount : Number(data.amount);
                updateOfferMutation.mutate({
                  offerId: selectedOffer.id,
                  amount,
                  pickupDate: data.pickupDate,
                  loadType: data.loadType,
                });
              })}
              className="space-y-4"
            >
              <FormField
                control={editOfferForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant (MAD) <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ex: 5000"
                        data-testid="input-edit-amount"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editOfferForm.control}
                name="pickupDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de prise en charge <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        data-testid="input-edit-pickup-date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editOfferForm.control}
                name="loadType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de chargement <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-load-type">
                          <SelectValue placeholder="Sélectionnez le type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="return">Retour (camion vide)</SelectItem>
                        <SelectItem value="shared">Groupage / Partagé</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditOfferDialogOpen(false);
                    editOfferForm.reset();
                    setSelectedOffer(null);
                  }}
                  data-testid="button-cancel-edit-offer"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={updateOfferMutation.isPending}
                  data-testid="button-submit-edit-offer"
                >
                  {updateOfferMutation.isPending ? "Modification..." : "Modifier l'offre"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Signaler un problème</DialogTitle>
            <DialogDescription>
              Décrivez le problème rencontré avec ce client.
            </DialogDescription>
          </DialogHeader>
          <Form {...reportForm}>
            <form onSubmit={reportForm.handleSubmit(handleSubmitReport)} className="space-y-4">
              <FormField
                control={reportForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de problème <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-report-type">
                          <SelectValue placeholder="Sélectionnez un type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="no-show">Client absent</SelectItem>
                        <SelectItem value="payment">Problème de paiement</SelectItem>
                        <SelectItem value="communication">Problème de communication</SelectItem>
                        <SelectItem value="incorrect-info">Informations incorrectes</SelectItem>
                        <SelectItem value="damaged-goods">Marchandises non conformes</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
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
                    <FormLabel>Description détaillée <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Décrivez en détail le problème rencontré..."
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
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={createReportMutation.isPending}
                  data-testid="button-submit-report"
                >
                  {createReportMutation.isPending ? "Envoi en cours..." : "Envoyer le signalement"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Account Not Validated Dialog */}
      <Dialog open={notValidatedDialogOpen} onOpenChange={setNotValidatedDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Flag className="h-5 w-5 text-amber-600" />
              Compte non validé
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Votre compte CamionBack n'est pas encore validé par notre équipe.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Vous pourrez annoncer vos retours et bénéficier de toutes les fonctionnalités dès que votre compte sera activé.
            </p>
            <p className="text-muted-foreground leading-relaxed flex items-center gap-2">
              <TruckIcon className="h-4 w-4 text-[#00d4b2]" />
              Merci pour votre patience.
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setNotValidatedDialogOpen(false)}
              className="w-full"
              data-testid="button-close-not-validated"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
