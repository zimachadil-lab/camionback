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
import { StoriesBar } from "@/components/ui/stories-bar";
import { LoadingTruck } from "@/components/ui/loading-truck";
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

const referenceSchema = z.object({
  referenceName: z.string().min(2, "Nom complet requis (min. 2 caractères)"),
  referencePhone: z.string().regex(/^\+212[0-9]{9}$/, "Format: +212XXXXXXXXX"),
  referenceRelation: z.enum(["Client", "Transporteur", "Autre"], {
    required_error: "Type de relation requis",
  }),
});

export default function TransporterDashboard() {
  console.log("🚀 [TransporterDashboard] Component START");
  const [, setLocation] = useLocation();
  const [selectedCity, setSelectedCity] = useState("Toutes les villes");
  console.log("✅ [TransporterDashboard] State initialized");
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
  console.log("👤 [TransporterDashboard] User from localStorage:", user);

  // Initialize forms FIRST (before mutations that use them)
  console.log("📝 [TransporterDashboard] Initializing forms...");
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

  const referenceForm = useForm({
    resolver: zodResolver(referenceSchema),
    defaultValues: {
      referenceName: "",
      referencePhone: "+212",
      referenceRelation: "Client" as const,
    },
  });

  console.log("📝 [TransporterDashboard] All forms initialized");

  // Refresh user data from database on mount to get latest status
  useEffect(() => {
    console.log("🔄 [TransporterDashboard] useEffect for refreshing user data");
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

  console.log("📊 [TransporterDashboard] Setting up queries...");

  // Load requests with limit of 50 for better performance
  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/requests", user.id],
    queryFn: async () => {
      const response = await fetch(`/api/requests?status=open&transporterId=${user.id}&limit=50`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Failed: ${response.statusText}`);
      if (response.status === 304 || response.status === 204) return [];
      const text = await response.text();
      return text ? JSON.parse(text) : [];
    },
    enabled: !!user.id,
  });

  const { data: myOffers = [], isLoading: offersLoading } = useQuery({
    queryKey: ["/api/offers", user.id],
    queryFn: async () => {
      const response = await fetch(`/api/offers?transporterId=${user.id}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Failed: ${response.statusText}`);
      if (response.status === 304 || response.status === 204) return [];
      const text = await response.text();
      return text ? JSON.parse(text) : [];
    },
    enabled: !!user.id, // Only load when user is loaded
    refetchInterval: 5000,
  });

  const { data: allRequests = [], isLoading: allRequestsLoading } = useQuery({
    queryKey: ["/api/requests/all"],
    queryFn: async () => {
      const response = await fetch("/api/requests", { cache: "no-store" });
      if (!response.ok) throw new Error(`Failed: ${response.statusText}`);
      if (response.status === 304 || response.status === 204) return [];
      const text = await response.text();
      return text ? JSON.parse(text) : [];
    },
    enabled: !!user.id, // Only load when user is loaded
  });

  // Helper function to get client info from requests (avoid loading ALL users)
  const getClientInfo = (clientId: string) => {
    // Try to find client info in requests or acceptedRequests
    const allReqs = [...requests, ...acceptedRequests, ...allRequests];
    const req = allReqs.find((r: any) => r.clientId === clientId);
    return req ? {
      id: req.clientId,
      clientId: req.clientIdentifier || clientId,
      phoneNumber: req.clientPhone || "Non disponible",
      city: req.fromCity || "Non spécifiée"
    } : null;
  };

  const { data: acceptedRequests = [], isLoading: acceptedLoading } = useQuery({
    queryKey: ["/api/requests/accepted", user.id],
    queryFn: async () => {
      const response = await fetch(`/api/requests?accepted=true&transporterId=${user.id}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Failed: ${response.statusText}`);
      if (response.status === 304 || response.status === 204) return [];
      const text = await response.text();
      return text ? JSON.parse(text) : [];
    },
    enabled: !!user.id, // Only load when user is loaded
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
    const clientInfo = getClientInfo(request.clientId);
    setSelectedClientDetails({
      ...request,
      clientId: clientInfo?.clientId || request.clientIdentifier,
      clientPhone: clientInfo?.phoneNumber || "Non disponible",
      clientCity: clientInfo?.city || request.fromCity,
    });
    setClientDetailsOpen(true);
  };

  // Fetch cities from API
  const { data: cities = [], isLoading: citiesLoading } = useQuery({
    queryKey: ["/api/cities"],
    queryFn: async () => {
      const response = await fetch("/api/cities", { cache: "no-store" });
      if (!response.ok) throw new Error(`Failed: ${response.statusText}`);
      if (response.status === 304 || response.status === 204) return [];
      const text = await response.text();
      return text ? JSON.parse(text) : [];
    },
    enabled: !!user.id, // Only load when user is loaded
  });

  // Fetch transporter reference
  const { data: transporterReference, isLoading: referenceLoading } = useQuery<{
    id: string;
    transporterId: string;
    referenceName: string;
    referencePhone: string;
    referenceRelation: string;
    status: string;
    rejectionReason?: string | null;
    validatedBy?: string | null;
    validatedAt?: string | null;
    createdAt: string;
  } | null>({
    queryKey: [`/api/transporter-references/${user.id}`],
    queryFn: async () => {
      const response = await fetch(`/api/transporter-references/${user.id}`, { cache: "no-store" });
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed: ${response.statusText}`);
      }
      if (response.status === 304 || response.status === 204) return null;
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    },
    enabled: user.role === "transporter" && !!user.id,
  });

  const { toast } = useToast();

  // Submit transporter reference
  const submitReferenceMutation = useMutation({
    mutationFn: async (data: { referenceName: string; referencePhone: string; referenceRelation: string }) => {
      return await apiRequest("POST", "/api/transporter-references", {
        transporterId: user.id,
        ...data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Votre référence a été enregistrée. Notre équipe vous contactera pour validation.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/transporter-references/${user.id}`] });
      referenceForm.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Échec de l'enregistrement de la référence",
      });
    },
  });

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

  const filteredRequests = requests
    .filter((req: any) => {
      // Exclude requests declined by this transporter
      const notDeclined = !req.declinedBy || !req.declinedBy.includes(user.id);
      const cityMatch: boolean = selectedCity === "Toutes les villes" || 
                       req.fromCity === selectedCity || 
                       req.toCity === selectedCity;
      const searchMatch: boolean = searchQuery === "" || 
                         req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         req.goodsType.toLowerCase().includes(searchQuery.toLowerCase());
      return notDeclined && cityMatch && searchMatch;
    })
    .sort((a: any, b: any) => {
      // Sort by most recent first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Count offers per request for display
  const offerCounts = myOffers.reduce((acc: any, offer: any) => {
    acc[offer.requestId] = (acc[offer.requestId] || 0) + 1;
    return acc;
  }, {});

  // Only wait for critical data - allow render even if some data is still loading
  console.log("⏳ [TransporterDashboard] Loading states:", { requestsLoading, citiesLoading });
  console.log("📦 [TransporterDashboard] Data counts:", {
    requests: requests.length,
    cities: cities.length,
    myOffers: myOffers.length,
    acceptedRequests: acceptedRequests.length
  });
  
  if (requestsLoading || citiesLoading) {
    console.log("⏳ [TransporterDashboard] Showing loading truck...");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingTruck message="Chargement de votre tableau de bord..." size="lg" />
      </div>
    );
  }

  console.log("✅ [TransporterDashboard] RENDERING DASHBOARD NOW!");
  console.log("👤 [TransporterDashboard] User status:", user.status);
  console.log("📋 [TransporterDashboard] Reference data:", transporterReference);
  console.log("📊 [TransporterDashboard] About to return JSX...");

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={user}
        onAnnounceReturn={handleAnnounceReturn}
        onLogout={handleLogout}
      />
      
      {/* <StoriesBar userRole="transporter" /> */}
      
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
              Mes offres ({myOffers.length})
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
                  const request = requests.find((r: any) => r.id === offer.requestId);
                  if (!request) return null;
                  
                  return (
                    <Card key={offer.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-mono text-muted-foreground">{request.requestId}</span>
                              <Badge variant={
                                offer.status === "accepted" ? "default" :
                                offer.status === "rejected" ? "destructive" :
                                "secondary"
                              }>
                                {offer.status === "accepted" ? "Acceptée" :
                                 offer.status === "rejected" ? "Refusée" :
                                 "En attente"}
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-lg">{request.cargoType}</h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                              <MapPin className="h-4 w-4" />
                              {request.departureCity} → {request.arrivalCity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{offer.price} DH</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {new Date(request.preferredDate).toLocaleDateString('fr-FR')}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            Soumise le {new Date(offer.createdAt).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Vous n'avez pas encore soumis d'offres
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="to-process" className="mt-6 space-y-6">
            {acceptedRequests.length > 0 ? (
              <div className="space-y-4">
                {acceptedRequests.map((request: any) => (
                  <Card key={request.id} className="overflow-hidden border-l-4 border-l-primary">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-mono text-muted-foreground">{request.requestId}</span>
                            <Badge variant="default">À traiter</Badge>
                          </div>
                          <h3 className="font-semibold text-lg">{request.cargoType}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <MapPin className="h-4 w-4" />
                            {request.departureCity} → {request.arrivalCity}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(request.preferredDate).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Package className="h-4 w-4" />
                          {request.description}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1">
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Contacter le client
                        </Button>
                        <Button variant="outline" size="sm">
                          <Info className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Aucune demande acceptée à traiter
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
