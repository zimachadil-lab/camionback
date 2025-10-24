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

  // Load requests with limit of 50 for better performance
  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/requests", user.id],
    queryFn: async () => {
      const response = await fetch(`/api/requests?status=open&transporterId=${user.id}&limit=50`);
      return response.json();
    },
    enabled: !!user.id,
  });

  const { data: myOffers = [], isLoading: offersLoading } = useQuery({
    queryKey: ["/api/offers", user.id],
    queryFn: async () => {
      const response = await fetch(`/api/offers?transporterId=${user.id}`);
      return response.json();
    },
    enabled: !!user.id, // Only load when user is loaded
    refetchInterval: 5000,
  });

  const { data: allRequests = [], isLoading: allRequestsLoading } = useQuery({
    queryKey: ["/api/requests/all"],
    queryFn: async () => {
      const response = await fetch("/api/requests");
      return response.json();
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
      const response = await fetch(`/api/requests?accepted=true&transporterId=${user.id}`);
      return response.json();
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
      const response = await fetch("/api/cities");
      return response.json();
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
  console.log("🔍 DEBUG - Loading states:", {
    requestsLoading,
    citiesLoading,
    offersLoading,
    acceptedLoading,
    allRequestsLoading,
    referenceLoading,
    requestsCount: requests.length,
    citiesCount: cities.length
  });

  if (requestsLoading || citiesLoading) {
    console.log("⏳ Still loading...");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingTruck message="Chargement de votre tableau de bord..." size="lg" />
      </div>
    );
  }

  console.log("✅ Loading complete, rendering dashboard...", {
    user,
    requestsCount: requests.length,
    filteredCount: filteredRequests.length
  });

  // TEMPORARY: Minimal test to debug white page issue
  return (
    <div className="min-h-screen p-8 bg-red-500">
      <h1 className="text-4xl font-bold text-white">🎉 TEST: DASHBOARD CHARGE!</h1>
      <p className="text-white text-2xl">Demandes: {requests.length}</p>
      <p className="text-white text-2xl">Villes: {cities.length}</p>
    </div>
  );
}

// TODO: RESTORE ALL ORIGINAL CODE AFTER DEBUGGING
/* ORIGINAL DASHBOARD CODE WAS HERE - TEMPORARILY REMOVED FOR DEBUGGING */
