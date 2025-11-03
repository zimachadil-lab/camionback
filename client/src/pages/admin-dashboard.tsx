import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
// REMOVED: Tabs navigation replaced with card-based navigation
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, Package, DollarSign, TrendingUp, Plus, Search, CheckCircle, XCircle, UserCheck, CreditCard, Phone, Eye, EyeOff, TruckIcon, MapPin, Calendar, FileText, MessageSquare, Trash2, Send, Flag, Pencil, Camera, RefreshCw, Circle, Edit, Compass, Settings, Weight, Building2, Home } from "lucide-react";
import { LoadingTruck } from "@/components/ui/loading-truck";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
import { Header } from "@/components/layout/header";
import { KpiCard } from "@/components/admin/kpi-card";
import { AddTransporterForm } from "@/components/admin/add-transporter-form";
import { AddClientForm } from "@/components/admin/add-client-form";
import { TransporterRibDialog } from "@/components/admin/transporter-rib-dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VoiceRecorder } from "@/components/chat/voice-recorder";
import { VoiceMessagePlayer } from "@/components/chat/voice-message-player";
import AdminCommunications from "@/pages/admin-communications";
import { CoordinatorManagement } from "@/components/admin/coordinator-management";
import { CoordinationStatusManagement } from "@/components/admin/coordination-status-management";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<string>("requests");
  const [addTransporterOpen, setAddTransporterOpen] = useState(false);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // REMOVED: commissionRate state - no longer needed with manual coordinator pricing
  const [selectedReceipt, setSelectedReceipt] = useState<string>("");
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [assignOrderDialogOpen, setAssignOrderDialogOpen] = useState(false);
  const [selectedEmptyReturn, setSelectedEmptyReturn] = useState<any>(null);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [contractDetailsOpen, setContractDetailsOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [conversationDialogOpen, setConversationDialogOpen] = useState(false);
  const [deleteConversationId, setDeleteConversationId] = useState<string | null>(null);
  const [adminMessage, setAdminMessage] = useState("");
  const [transporterSearch, setTransporterSearch] = useState("");
  const [transporterCityFilter, setTransporterCityFilter] = useState("all");
  const [clientSearch, setClientSearch] = useState("");
  const [assignOrderSearch, setAssignOrderSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoiceDetailsOpen, setInvoiceDetailsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [requestDetailDialogOpen, setRequestDetailDialogOpen] = useState(false);
  const [newCityName, setNewCityName] = useState("");
  const [editingCity, setEditingCity] = useState<any>(null);
  const [newStoryTitle, setNewStoryTitle] = useState("");
  const [newStoryContent, setNewStoryContent] = useState("");
  const [newStoryMediaUrl, setNewStoryMediaUrl] = useState("");
  const [newStoryRole, setNewStoryRole] = useState("all");
  const [newStoryOrder, setNewStoryOrder] = useState(0);
  const [editingStory, setEditingStory] = useState<any>(null);
  const [selectedRibTransporter, setSelectedRibTransporter] = useState<any>(null);
  const [deleteOfferId, setDeleteOfferId] = useState<string | null>(null);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [editOfferAmount, setEditOfferAmount] = useState("");
  const [editOfferDate, setEditOfferDate] = useState("");
  const [editOfferLoadType, setEditOfferLoadType] = useState("");
  const [enlargedTruckPhoto, setEnlargedTruckPhoto] = useState<string>("");
  const [showTruckPhotoDialog, setShowTruckPhotoDialog] = useState(false);
  const [requestSearchQuery, setRequestSearchQuery] = useState("");
  const [requestStatusFilter, setRequestStatusFilter] = useState("all");
  const [editingTransporter, setEditingTransporter] = useState<any>(null);
  const [editTransporterDialogOpen, setEditTransporterDialogOpen] = useState(false);
  const [editTransporterName, setEditTransporterName] = useState("");
  const [editTransporterCity, setEditTransporterCity] = useState("");
  const [editTransporterPhone, setEditTransporterPhone] = useState("");
  const [editTransporterNewPassword, setEditTransporterNewPassword] = useState("");
  const [editTransporterPhoto, setEditTransporterPhoto] = useState<File | null>(null);
  const [viewPhotoTransporterId, setViewPhotoTransporterId] = useState<string | null>(null);
  const [viewPhotoDialogOpen, setViewPhotoDialogOpen] = useState(false);
  // REMOVED: Reference system no longer used
  // const [rejectReferenceDialogOpen, setRejectReferenceDialogOpen] = useState(false);
  // const [rejectionReason, setRejectionReason] = useState("");
  // const [selectedReference, setSelectedReference] = useState<any>(null);
  const [loadingPhotos, setLoadingPhotos] = useState<Record<string, boolean>>({});
  const [loadedPhotos, setLoadedPhotos] = useState<Record<string, string[]>>({});
  const [coordinationDialogOpen, setCoordinationDialogOpen] = useState(false);
  const [selectedRequestForCoordination, setSelectedRequestForCoordination] = useState<any>(null);
  const [adminCoordinationStatus, setAdminCoordinationStatus] = useState("");
  const [adminCoordinationReason, setAdminCoordinationReason] = useState("");
  const [adminCoordinationReminderDate, setAdminCoordinationReminderDate] = useState("");
  const [adminCoordinationAssignedTo, setAdminCoordinationAssignedTo] = useState("none");
  const { toast} = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);

  // Fetch conversation messages (enabled only when conversation dialog is open)
  const { data: conversationMessages = [] } = useQuery({
    queryKey: ["/api/chat/messages", selectedConversation?.requestId],
    queryFn: async () => {
      if (!selectedConversation?.requestId) return [];
      const response = await fetch(`/api/chat/messages?requestId=${selectedConversation.requestId}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: conversationDialogOpen && !!selectedConversation?.requestId,
  });

  const handleLogout = () => {
    logout();
  };

  // Fetch pending drivers
  const { data: pendingDrivers = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["/api/admin/pending-drivers"],
    queryFn: async () => {
      const response = await fetch("/api/admin/pending-drivers");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    refetchOnMount: "always",
    staleTime: 0,
  });

  // REMOVED: Reference system no longer used - transporter validation now done directly by admin
  // const { data: pendingReferences = [], isLoading: referencesLoading } = useQuery({
  //   queryKey: ["/api/admin/transporter-references", user?.id],
  //   queryFn: async () => {
  //     if (!user?.id) return [];
  //     const response = await fetch(`/api/admin/transporter-references?adminId=${user.id}`);
  //     if (!response.ok) {
  //       console.error("Failed to fetch references:", await response.text());
  //       return [];
  //     }
  //     return response.json();
  //   },
  //   enabled: !!user?.id,
  //   refetchOnMount: "always",
  //   staleTime: 0,
  // });

  // Fetch all requests for payment validation
  const { data: allRequests = [] } = useQuery({
    queryKey: ["/api/requests"],
    queryFn: async () => {
      console.log("🔍 [ADMIN] Fetching ALL requests from /api/requests");
      const response = await fetch("/api/requests");
      console.log("📡 [ADMIN] Response status:", response.status, response.statusText);
      const data = await response.json();
      console.log("📦 [ADMIN] Requests data:", Array.isArray(data) ? `${data.length} requests` : "ERROR - not an array", data);
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch admin settings to calculate commission for legacy orders (read-only, no longer configurable)
  const { data: adminSettings } = useQuery({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const response = await fetch("/api/admin/settings");
      return response.json();
    },
  });

  // Fetch all offers to get transporter and amount details
  const { data: allOffers = [] } = useQuery({
    queryKey: ["/api/offers/all"],
    queryFn: async () => {
      const response = await fetch("/api/offers");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch active empty returns
  const { data: emptyReturns = [], isLoading: emptyReturnsLoading } = useQuery({
    queryKey: ["/api/empty-returns"],
    queryFn: async () => {
      const response = await fetch("/api/empty-returns");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch all contracts
  const { data: contracts = [] } = useQuery({
    queryKey: ["/api/contracts"],
    queryFn: async () => {
      const response = await fetch("/api/contracts");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch all conversations (admin)
  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/admin/conversations"],
    queryFn: async () => {
      const response = await fetch("/api/admin/conversations");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch admin statistics
  const { data: adminStats } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/stats");
      return response.json();
    },
  });

  // Fetch coordinators for coordination assignment
  const { data: coordinators = [] } = useQuery({
    queryKey: ["/api/admin/coordinators"],
    enabled: !!user?.id,
    queryFn: async () => {
      const response = await fetch(`/api/admin/coordinators?adminId=${user!.id}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch coordination statuses
  const { data: coordinationStatuses = [] } = useQuery({
    queryKey: ["/api/admin/coordination-statuses"],
    enabled: !!user?.id,
    queryFn: async () => {
      const response = await fetch(`/api/admin/coordination-statuses?userId=${user!.id}`);
      const data = await response.json();
      // Protection: toujours retourner un tableau, même en cas d'erreur
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch transporters with stats
  const { data: transportersWithStats = [], isLoading: transportersLoading, error: transportersError } = useQuery({
    queryKey: ["/api/admin/transporters"],
    queryFn: async () => {
      console.log("🔍 [ADMIN] Fetching transporters from /api/admin/transporters");
      const response = await fetch("/api/admin/transporters");
      console.log("📡 [ADMIN] Response status:", response.status, response.statusText);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ [ADMIN] API Error:", errorText);
        throw new Error(`Failed to fetch transporters: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      console.log("✅ [ADMIN] Transporters data received:", {
        count: data.length,
        firstItem: data[0],
        allItems: data
      });
      return data;
    },
  });

  // Debug logging
  useEffect(() => {
    console.log("🚛 [ADMIN] Transporters state update:", {
      loading: transportersLoading,
      error: transportersError?.message,
      count: transportersWithStats?.length,
      hasData: Array.isArray(transportersWithStats),
      data: transportersWithStats
    });
  }, [transportersWithStats, transportersLoading, transportersError]);

  // Fetch transporter photo when dialog opens
  const { data: transporterPhoto, isLoading: photoLoading } = useQuery({
    queryKey: ["/api/admin/transporters", viewPhotoTransporterId, "photo"],
    queryFn: async () => {
      if (!viewPhotoTransporterId) return null;
      const response = await fetch(`/api/admin/transporters/${viewPhotoTransporterId}/photo`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: viewPhotoDialogOpen && !!viewPhotoTransporterId,
  });

  // Fetch clients with stats
  const { data: clientsWithStats = [] } = useQuery({
    queryKey: ["/api/admin/clients"],
    queryFn: async () => {
      const response = await fetch("/api/admin/clients");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Combine clients and transporters for unified lookup
  const allUsers = useMemo(() => {
    return [...clientsWithStats, ...transportersWithStats];
  }, [clientsWithStats, transportersWithStats]);

  // Fetch all reports
  const { data: allReports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/reports"],
    queryFn: async () => {
      const response = await fetch("/api/reports");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch all cities
  const { data: cities = [], isLoading: citiesLoading } = useQuery({
    queryKey: ["/api/cities"],
    queryFn: async () => {
      const response = await fetch("/api/cities");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch all stories
  const { data: allStories = [], isLoading: storiesLoading } = useQuery({
    queryKey: ["/api/stories", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/stories?adminId=${user.id}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user?.id,
  });

  // Calculate contract statistics
  const activeContracts = contracts.filter(
    (c: any) => c.status === "in_progress" || c.status === "marked_paid_transporter" || c.status === "marked_paid_client"
  ).length;
  const completedContracts = contracts.filter(
    (c: any) => c.status === "completed"
  ).length;

  // Filter requests pending admin validation
  const pendingPayments = allRequests.filter(
    (req: any) => req.paymentStatus === "pending_admin_validation"
  );

  // Filter and sort requests for the Demandes view
  const filteredAndSortedRequests = [...allRequests]
    .filter((request: any) => {
      // Filter by status
      if (requestStatusFilter !== "all") {
        if (requestStatusFilter !== request.status) return false;
      }

      // Filter by search query
      if (requestSearchQuery.trim() !== "") {
        const query = requestSearchQuery.toLowerCase().trim();
        const client = allUsers.find((u: any) => u.id === request.clientId);
        
        // Search by reference ID
        if (request.referenceId?.toString().toLowerCase().includes(query)) return true;
        
        // Search by client phone number
        if (client?.phoneNumber?.toString().toLowerCase().includes(query)) return true;
        
        // Search by departure city
        if (request.fromCity?.toString().toLowerCase().includes(query)) return true;
        
        // Search by arrival city
        if (request.toCity?.toString().toLowerCase().includes(query)) return true;
        
        return false;
      }

      return true;
    })
    .sort((a: any, b: any) => {
      // Sort by date descending (most recent first)
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

  const handleValidateDriver = async (driverId: string, validated: boolean) => {
    try {
      const response = await fetch(`/api/admin/validate-driver/${driverId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ validated }),
      });

      if (!response.ok) throw new Error();

      toast({
        title: validated ? "Transporteur validé" : "Transporteur refusé",
        description: validated 
          ? "Le transporteur a été validé avec succès"
          : "Le transporteur a été refusé",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-drivers"] });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de la validation",
      });
    }
  };

  const handleLoadTruckPhotos = async (transporterId: string) => {
    // Check if photos are already cached
    if (loadedPhotos[transporterId] !== undefined) {
      // Photos already loaded, just show them
      if (loadedPhotos[transporterId] && loadedPhotos[transporterId].length > 0) {
        setEnlargedTruckPhoto(loadedPhotos[transporterId][0]);
        setShowTruckPhotoDialog(true);
      } else {
        toast({
          title: "Aucune photo",
          description: "Ce transporteur n'a pas encore ajouté de photo de camion",
        });
      }
      return;
    }

    // Start loading
    setLoadingPhotos(prev => ({ ...prev, [transporterId]: true }));

    try {
      const response = await fetch(`/api/admin/transporter-photos/${transporterId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const photos = data.truckPhotos || [];
      
      // Cache the photos (even if empty array)
      setLoadedPhotos(prev => ({ ...prev, [transporterId]: photos }));
      setLoadingPhotos(prev => ({ ...prev, [transporterId]: false }));

      if (photos.length > 0) {
        setEnlargedTruckPhoto(photos[0]);
        setShowTruckPhotoDialog(true);
      } else {
        toast({
          title: "Aucune photo",
          description: "Ce transporteur n'a pas encore ajouté de photo de camion",
        });
      }
    } catch (error: any) {
      setLoadingPhotos(prev => ({ ...prev, [transporterId]: false }));
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: error.message || "Impossible de charger les photos. Réessayez.",
      });
    }
  };

  const handleValidatePayment = async (requestId: string) => {
    try {
      const response = await fetch(`/api/requests/${requestId}/admin-validate-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error();

      toast({
        title: "Paiement validé",
        description: "Le paiement a été validé avec succès",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de la validation du paiement",
      });
    }
  };

  const handleRejectReceipt = async (requestId: string) => {
    try {
      const response = await fetch(`/api/requests/${requestId}/admin-reject-receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error();

      toast({
        title: "Reçu refusé",
        description: "Le reçu a été refusé. Le client pourra téléverser un nouveau reçu.",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec du refus du reçu",
      });
    }
  };

  const handleAcceptOfferAsAdmin = async (offerId: string, requestId: string) => {
    try {
      await apiRequest("POST", `/api/offers/${offerId}/accept`, { adminAccept: true });

      toast({
        title: "Offre acceptée",
        description: "L'offre a été acceptée avec succès. Le transporteur et le client ont été notifiés.",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/offers/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de l'acceptation de l'offre",
      });
    }
  };

  const handleBlockUser = async (userId: string, userType: string) => {
    if (!confirm(`Voulez-vous bloquer ce ${userType === "client" ? "client" : "transporteur"} ? Il ne pourra plus se connecter ni utiliser la plateforme.`)) {
      return;
    }

    try {
      await apiRequest("POST", `/api/admin/block-user/${userId}`, {});

      toast({
        title: "Utilisateur bloqué",
        description: "L'utilisateur a été bloqué avec succès et a reçu une notification.",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/admin/transporters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec du blocage de l'utilisateur",
      });
    }
  };

  const handleUnblockUser = async (userId: string, userType: string) => {
    try {
      await apiRequest("POST", `/api/admin/unblock-user/${userId}`, {});

      toast({
        title: "Utilisateur débloqué",
        description: "L'utilisateur a été débloqué avec succès et peut à nouveau utiliser la plateforme.",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/admin/transporters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec du déblocage de l'utilisateur",
      });
    }
  };

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
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de l'affectation de la commande",
      });
    },
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({ reportId, status, resolution }: { reportId: string; status: string; resolution?: string }) => {
      return await apiRequest("PATCH", `/api/reports/${reportId}`, {
        status,
        resolution,
      });
    },
    onSuccess: () => {
      toast({
        title: "Signalement mis à jour",
        description: "Le statut du signalement a été modifié avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de la mise à jour du signalement",
      });
    },
  });

  const toggleHideRequest = useMutation({
    mutationFn: async ({ requestId, isHidden }: { requestId: string; isHidden: boolean }) => {
      return await apiRequest("PATCH", `/api/requests/${requestId}/toggle-hide`, {
        isHidden,
      });
    },
    onSuccess: (_data, variables) => {
      toast({
        title: variables.isHidden ? "Demande masquée" : "Demande réaffichée",
        description: variables.isHidden 
          ? "La demande a été masquée aux transporteurs" 
          : "La demande est à nouveau visible pour les transporteurs",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de modifier la visibilité de la demande",
      });
    },
  });

  const deleteRequest = useMutation({
    mutationFn: async (requestId: string) => {
      return await apiRequest("DELETE", `/api/requests/${requestId}`);
    },
    onSuccess: () => {
      toast({
        title: "Demande supprimée",
        description: "La demande a été supprimée définitivement",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer la demande",
      });
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ requestId, updates }: { requestId: string; updates: any }) => {
      return await apiRequest("PATCH", `/api/requests/${requestId}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Statut modifié",
        description: "Le statut de la demande a été mis à jour",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      setRequestDetailDialogOpen(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de modifier le statut",
      });
    },
  });

  // Delete offer mutation
  const deleteOfferMutation = useMutation({
    mutationFn: async (offerId: string) => {
      return await apiRequest("DELETE", `/api/admin/offers/${offerId}`);
    },
    onSuccess: () => {
      toast({
        title: "Offre supprimée",
        description: "L'offre a été supprimée avec succès",
      });
      setDeleteOfferId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer l'offre",
      });
    },
  });

  // Edit offer mutation
  const editOfferMutation = useMutation({
    mutationFn: async ({ offerId, updates }: { offerId: string; updates: any }) => {
      return await apiRequest("PATCH", `/api/admin/offers/${offerId}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Offre modifiée",
        description: "L'offre a été modifiée avec succès",
      });
      setEditingOffer(null);
      setEditOfferAmount("");
      setEditOfferDate("");
      setEditOfferLoadType("");
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de modifier l'offre",
      });
    },
  });

  // Update coordination status mutation (admin)
  const updateCoordinationMutation = useMutation({
    mutationFn: async ({ requestId, coordinationStatus, coordinationReason, coordinationReminderDate, assignedToId }: {
      requestId: string;
      coordinationStatus: string;
      coordinationReason: string | null;
      coordinationReminderDate: string | null;
      assignedToId: string | null;
    }) => {
      // Update coordination status and assignedToId in a single call (admin-authorized)
      return await apiRequest("PATCH", `/api/coordinator/requests/${requestId}/coordination-status`, {
        coordinationStatus,
        coordinationReason,
        coordinationReminderDate,
        assignedToId
      });
    },
    onSuccess: () => {
      toast({
        title: "Coordination mise à jour",
        description: "Les informations de coordination ont été modifiées",
      });
      setCoordinationDialogOpen(false);
      setSelectedRequestForCoordination(null);
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/coordination/nouveau"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/coordination/en-action"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/coordination/prioritaires"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/coordination/archives"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de modifier la coordination",
      });
    },
  });

  // REMOVED: Reference system no longer used
  // const validateReferenceMutation = useMutation({
  //   mutationFn: async (referenceId: string) => {
  //     if (!user?.id) throw new Error("Non authentifié");
  //     return await apiRequest("PATCH", `/api/admin/transporter-references/${referenceId}`, {
  //       status: "validated",
  //       adminId: user.id,
  //     });
  //   },
  //   onSuccess: () => {
  //     toast({
  //       title: "Référence validée",
  //       description: "La référence a été validée avec succès",
  //     });
  //     queryClient.invalidateQueries({ queryKey: ["/api/admin/transporter-references", user?.id] });
  //     queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-drivers"] });
  //     queryClient.invalidateQueries({ queryKey: ["/api/admin/transporters"] });
  //   },
  //   onError: () => {
  //     toast({
  //       variant: "destructive",
  //       title: "Erreur",
  //       description: "Impossible de valider la référence",
  //     });
  //   },
  // });

  // REMOVED: Reference system no longer used
  // const rejectReferenceMutation = useMutation({
  //   mutationFn: async ({ referenceId, reason }: { referenceId: string; reason: string }) => {
  //     if (!user?.id) throw new Error("Non authentifié");
  //     return await apiRequest("PATCH", `/api/admin/transporter-references/${referenceId}`, {
  //       status: "rejected",
  //       rejectionReason: reason,
  //       adminId: user.id,
  //     });
  //   },
  //   onSuccess: () => {
  //     toast({
  //       title: "Référence rejetée",
  //       description: "La référence a été rejetée",
  //     });
  //     queryClient.invalidateQueries({ queryKey: ["/api/admin/transporter-references", user?.id] });
  //     queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-drivers"] });
  //     queryClient.invalidateQueries({ queryKey: ["/api/admin/transporters"] });
  //     setRejectReferenceDialogOpen(false);
  //     setRejectionReason("");
  //   },
  //   onError: () => {
  //     toast({
  //       variant: "destructive",
  //       title: "Erreur",
  //       description: "Impossible de rejeter la référence",
  //     });
  //   },
  // });

  // Delete user mutation (for permanent account deletion)
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "Compte supprimé",
        description: "✅ Compte supprimé avec succès. L'utilisateur peut désormais se réinscrire librement.",
      });
      // Invalidate all user-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-drivers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transporters"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer le compte",
      });
    },
  });

  // Migration mutation to fix missing requests in coordinator views
  const migrateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/migrate-coordination-status");
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/qualification-pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/matching-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Migration réussie",
        description: `${data.updated} demandes ont été corrigées et sont maintenant visibles aux coordinateurs.`
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la migration.",
      });
    }
  });

  // Update transporter mutation
  const updateTransporterMutation = useMutation({
    mutationFn: async ({ transporterId, formData }: { transporterId: string; formData: FormData }) => {
      const response = await fetch(`/api/admin/transporters/${transporterId}`, {
        method: "PATCH",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Échec de la mise à jour");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "✅ Les informations du transporteur ont été mises à jour avec succès.",
      });
      setEditTransporterDialogOpen(false);
      setEditingTransporter(null);
      setEditTransporterName("");
      setEditTransporterCity("");
      setEditTransporterPhone("");
      setEditTransporterNewPassword("");
      setEditTransporterPhoto(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transporters"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le transporteur",
      });
    },
  });

  const handleUpdateTransporter = () => {
    if (!editingTransporter) return;
    
    const formData = new FormData();
    
    // Only add fields that have values
    if (editTransporterName.trim()) {
      formData.append("name", editTransporterName.trim());
    }
    if (editTransporterCity.trim()) {
      formData.append("city", editTransporterCity.trim());
    }
    if (editTransporterPhone.trim()) {
      formData.append("phoneNumber", editTransporterPhone.trim());
    }
    if (editTransporterNewPassword.trim()) {
      formData.append("newPassword", editTransporterNewPassword.trim());
    }
    if (editTransporterPhoto) {
      formData.append("truckPhoto", editTransporterPhoto);
    }
    
    updateTransporterMutation.mutate({ 
      transporterId: editingTransporter.id, 
      formData 
    });
  };

  // Format trend text
  const formatTrend = (trend: number) => {
    if (trend === 0) return "Aucun changement";
    const sign = trend > 0 ? "+" : "";
    return `${sign}${trend}% ce mois`;
  };

  // Render loading state while checking auth (without early return to respect Hooks rules)
  const isAuthenticated = user?.id && user?.role === "admin";

  return (
    <div className="min-h-screen bg-background">
      {!isAuthenticated ? (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <LoadingTruck />
        </div>
      ) : (
        <>
          <Header
            user={user as { id: string; name?: string; role: string; clientId?: string }}
            onLogout={handleLogout}
          />
          
          <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Administration</h1>
            <p className="text-muted-foreground mt-1">Gérez la plateforme CamionBack</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => {
                // Invalider toutes les queries pour rafraîchir les données
                queryClient.invalidateQueries();
                toast({
                  title: "✅ Données actualisées",
                  description: "Toutes les données ont été rafraîchies avec succès",
                });
              }}
              data-testid="button-refresh-dashboard"
              className="hover:text-[#17cfcf] hover:border-[#17cfcf]"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </Button>
            <Button 
              onClick={() => setAddClientOpen(true)}
              variant="secondary"
              data-testid="button-add-client"
            >
              <Plus className="mr-2 h-5 w-5" />
              Ajouter client
            </Button>
            <Button 
              onClick={() => setAddTransporterOpen(true)}
              data-testid="button-add-transporter"
            >
              <Plus className="mr-2 h-5 w-5" />
              Ajouter transporteur
            </Button>
          </div>
        </div>

        {/* Navigation par cartes - 3 sections */}
        <div className="space-y-8">
          {/* Section 1: OPÉRATIONS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <TruckIcon className="w-5 h-5 text-[#17cfcf]" />
              <h2 className="text-lg font-bold">Opérations</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {/* Demandes */}
              <Card 
                className={`cursor-pointer hover-elevate transition-all ${activeSection === 'requests' ? 'ring-2 ring-[#17cfcf]' : ''}`}
                onClick={() => setActiveSection('requests')}
                data-testid="card-requests"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Demandes
                    </div>
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Contrats */}
              <Card 
                className={`cursor-pointer hover-elevate transition-all ${activeSection === 'contracts' ? 'ring-2 ring-[#17cfcf]' : ''}`}
                onClick={() => setActiveSection('contracts')}
                data-testid="card-contracts"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Contrats
                    </div>
                    {contracts.length > 0 && (
                      <Badge className="relative">
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#17cfcf] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#17cfcf]"></span>
                        </span>
                        {contracts.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Messages */}
              <Card 
                className={`cursor-pointer hover-elevate transition-all ${activeSection === 'messages' ? 'ring-2 ring-[#17cfcf]' : ''}`}
                onClick={() => setActiveSection('messages')}
                data-testid="card-messages"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Messages
                    </div>
                    {conversations.length > 0 && (
                      <Badge className="relative">
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#17cfcf] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#17cfcf] animate-pulse"></span>
                        </span>
                        {conversations.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* À payer */}
              <Card 
                className={`cursor-pointer hover-elevate transition-all ${activeSection === 'to-pay' ? 'ring-2 ring-[#17cfcf]' : ''}`}
                onClick={() => setActiveSection('to-pay')}
                data-testid="card-to-pay"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      À payer
                    </div>
                    {pendingPayments.length > 0 && (
                      <Badge variant="destructive" className="relative">
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 animate-pulse"></span>
                        </span>
                        {pendingPayments.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Validation */}
              <Card 
                className={`cursor-pointer hover-elevate transition-all ${activeSection === 'validation' ? 'ring-2 ring-[#17cfcf]' : ''}`}
                onClick={() => setActiveSection('validation')}
                data-testid="card-validation"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      Validation
                    </div>
                    {pendingDrivers.length > 0 && (
                      <Badge variant="destructive" className="relative">
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 animate-pulse"></span>
                        </span>
                        {pendingDrivers.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Retours */}
              <Card 
                className={`cursor-pointer hover-elevate transition-all ${activeSection === 'empty-returns' ? 'ring-2 ring-[#17cfcf]' : ''}`}
                onClick={() => setActiveSection('empty-returns')}
                data-testid="card-empty-returns"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TruckIcon className="w-4 h-4" />
                      Retours
                    </div>
                    {emptyReturns.length > 0 && (
                      <Badge className="bg-[#00d4b2] relative">
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d4b2] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00d4b2]"></span>
                        </span>
                        {emptyReturns.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* Section 2: GESTION */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Settings className="w-5 h-5 text-[#17cfcf]" />
              <h2 className="text-lg font-bold">Gestion</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {/* Transporteurs */}
              <Card 
                className={`cursor-pointer hover-elevate transition-all ${activeSection === 'drivers' ? 'ring-2 ring-[#17cfcf]' : ''}`}
                onClick={() => setActiveSection('drivers')}
                data-testid="card-drivers"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Transporteurs
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Clients */}
              <Card 
                className={`cursor-pointer hover-elevate transition-all ${activeSection === 'clients' ? 'ring-2 ring-[#17cfcf]' : ''}`}
                onClick={() => setActiveSection('clients')}
                data-testid="card-clients"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Clients
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Coordinateurs */}
              <Card 
                className={`cursor-pointer hover-elevate transition-all ${activeSection === 'coordinators' ? 'ring-2 ring-[#17cfcf]' : ''}`}
                onClick={() => setActiveSection('coordinators')}
                data-testid="card-coordinators"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Compass className="w-4 h-4" />
                    Coordinateurs
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Statuts Coordination */}
              <Card 
                className={`cursor-pointer hover-elevate transition-all ${activeSection === 'coordination-statuses' ? 'ring-2 ring-[#17cfcf]' : ''}`}
                onClick={() => setActiveSection('coordination-statuses')}
                data-testid="card-coordination-statuses"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Statuts Coordination
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Signalements */}
              <Card 
                className={`cursor-pointer hover-elevate transition-all ${activeSection === 'reports' ? 'ring-2 ring-[#17cfcf]' : ''}`}
                onClick={() => setActiveSection('reports')}
                data-testid="card-reports"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4" />
                      Signalements
                    </div>
                    {allReports.filter((r: any) => r.status === "pending").length > 0 && (
                      <Badge variant="destructive" className="relative">
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 animate-pulse"></span>
                        </span>
                        {allReports.filter((r: any) => r.status === "pending").length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Communications */}
              <Card 
                className={`cursor-pointer hover-elevate transition-all ${activeSection === 'communications' ? 'ring-2 ring-[#17cfcf]' : ''}`}
                onClick={() => setActiveSection('communications')}
                data-testid="card-communications"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Communications
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Facturation */}
              <Card 
                className={`cursor-pointer hover-elevate transition-all ${activeSection === 'facturation' ? 'ring-2 ring-[#17cfcf]' : ''}`}
                onClick={() => setActiveSection('facturation')}
                data-testid="card-facturation"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Facturation
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* Section 3: CONFIGURATION */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Building2 className="w-5 h-5 text-[#17cfcf]" />
              <h2 className="text-lg font-bold">Configuration</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {/* Villes */}
              <Card 
                className={`cursor-pointer hover-elevate transition-all ${activeSection === 'cities' ? 'ring-2 ring-[#17cfcf]' : ''}`}
                onClick={() => setActiveSection('cities')}
                data-testid="card-cities"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Villes
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Stories */}
              <Card 
                className={`cursor-pointer hover-elevate transition-all ${activeSection === 'stories' ? 'ring-2 ring-[#17cfcf]' : ''}`}
                onClick={() => setActiveSection('stories')}
                data-testid="card-stories"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Stories
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Statistiques */}
              <Card 
                className={`cursor-pointer hover-elevate transition-all ${activeSection === 'stats' ? 'ring-2 ring-[#17cfcf]' : ''}`}
                onClick={() => setActiveSection('stats')}
                data-testid="card-stats"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Statistiques
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>

        {/* Contenu de la section active */}
        <div className="mt-8">
          {activeSection === 'requests' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Toutes les demandes
                  <Badge className="ml-2" data-testid="badge-total-requests">
                    Total: {allRequests.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filters and Search Bar */}
                <div className="mb-6 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search Input */}
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Rechercher par n° commande, téléphone, ville départ ou arrivée..."
                          value={requestSearchQuery}
                          onChange={(e) => setRequestSearchQuery(e.target.value)}
                          className="pl-10"
                          data-testid="input-search-requests"
                        />
                      </div>
                    </div>
                    
                    {/* Status Filter */}
                    <div className="w-full sm:w-64">
                      <Select
                        value={requestStatusFilter}
                        onValueChange={setRequestStatusFilter}
                      >
                        <SelectTrigger data-testid="select-filter-status">
                          <SelectValue placeholder="Filtrer par statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les statuts</SelectItem>
                          <SelectItem value="open">🟡 En attente d'offre</SelectItem>
                          <SelectItem value="accepted">🔵 Acceptée</SelectItem>
                          <SelectItem value="completed">🟢 Terminée</SelectItem>
                          <SelectItem value="cancelled">🔴 Annulée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Results Summary */}
                  {(requestSearchQuery || requestStatusFilter !== "all") && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        {filteredAndSortedRequests.length} résultat{filteredAndSortedRequests.length > 1 ? 's' : ''} trouvé{filteredAndSortedRequests.length > 1 ? 's' : ''}
                      </span>
                      {(requestSearchQuery || requestStatusFilter !== "all") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setRequestSearchQuery("");
                            setRequestStatusFilter("all");
                          }}
                          className="h-6 px-2"
                          data-testid="button-clear-filters"
                        >
                          Réinitialiser les filtres
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {allRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucune demande pour le moment</p>
                  </div>
                ) : filteredAndSortedRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucune demande ne correspond à vos critères de recherche</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Référence</TableHead>
                          <TableHead>Date de publication</TableHead>
                          <TableHead>Téléphone Client</TableHead>
                          <TableHead>De → Vers</TableHead>
                          <TableHead>Date souhaitée</TableHead>
                          <TableHead>Prix estimé</TableHead>
                          <TableHead>Offres</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAndSortedRequests.map((request: any) => {
                          const client = allUsers.find((u: any) => u.id === request.clientId);
                          
                          // Format date with time: JJ/MM/AAAA - HH:mm
                          const formatDateWithTime = (dateStr: string) => {
                            if (!dateStr) return "N/A";
                            try {
                              const date = new Date(dateStr);
                              const day = String(date.getDate()).padStart(2, '0');
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const year = date.getFullYear();
                              const hours = String(date.getHours()).padStart(2, '0');
                              const minutes = String(date.getMinutes()).padStart(2, '0');
                              return `${day}/${month}/${year} - ${hours}:${minutes}`;
                            } catch {
                              return "N/A";
                            }
                          };
                          
                          const formatDate = (dateStr: string) => {
                            if (!dateStr) return "N/A";
                            try {
                              const date = new Date(dateStr);
                              return date.toLocaleDateString("fr-FR");
                            } catch {
                              return "N/A";
                            }
                          };

                          const getStatusBadge = (status: string) => {
                            if (status === "open") return <Badge variant="default">Ouverte</Badge>;
                            if (status === "accepted") return <Badge className="bg-blue-600">Acceptée</Badge>;
                            if (status === "completed") return <Badge className="bg-green-600">Complétée</Badge>;
                            return <Badge variant="secondary">{status}</Badge>;
                          };

                          return (
                            <TableRow key={request.id}>
                              <TableCell className="font-medium">{request.referenceId}</TableCell>
                              <TableCell className="text-sm">{formatDateWithTime(request.createdAt)}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {client?.phoneNumber || "Non défini"}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {client?.clientId || "N/A"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {request.fromCity} → {request.toCity}
                                </div>
                              </TableCell>
                              <TableCell>{formatDate(request.dateTime)}</TableCell>
                              <TableCell className="font-semibold text-primary">
                                {request.estimatedPrice?.toLocaleString("fr-MA")} MAD
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" data-testid={`badge-offers-count-${request.id}`}>
                                  {request.offersCount || 0} {request.offersCount === 1 ? "offre" : "offres"}
                                </Badge>
                              </TableCell>
                              <TableCell>{getStatusBadge(request.status)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    size="icon" 
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setRequestDetailDialogOpen(true);
                                    }}
                                    data-testid={`button-view-request-${request.id}`}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedRequestForCoordination(request);
                                      setAdminCoordinationStatus(request.coordinationStatus || "nouveau");
                                      setAdminCoordinationReason(request.coordinationReason || "");
                                      setAdminCoordinationReminderDate(request.coordinationReminderDate || "");
                                      setAdminCoordinationAssignedTo(request.assignedToId || "none");
                                      setCoordinationDialogOpen(true);
                                    }}
                                    data-testid={`button-coordination-${request.id}`}
                                    title="Gérer la coordination"
                                  >
                                    <Compass className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="ghost"
                                    onClick={() => {
                                      // Toggle hide/show request
                                      toggleHideRequest.mutate({ 
                                        requestId: request.id, 
                                        isHidden: !request.isHidden 
                                      });
                                    }}
                                    data-testid={`button-toggle-hide-${request.id}`}
                                    className={request.isHidden ? "text-yellow-600 hover:text-yellow-700" : ""}
                                  >
                                    {request.isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => {
                                      if (confirm(`Voulez-vous vraiment supprimer définitivement la demande ${request.referenceId} ?`)) {
                                        deleteRequest.mutate(request.id);
                                      }
                                    }}
                                    data-testid={`button-delete-request-${request.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === 'contracts' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Contrats
                  <Badge className="ml-2">
                    Total: {contracts.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contracts.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun contrat pour le moment</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>N° Commande</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Transporteur</TableHead>
                          <TableHead>Montant</TableHead>
                          <TableHead>Date création</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contracts.map((contract: any) => {
                          const client = allUsers.find((u: any) => u.id === contract.clientId);
                          const transporter = allUsers.find((u: any) => u.id === contract.transporterId);
                          
                          const formatDate = (dateStr: string) => {
                            if (!dateStr) return "N/A";
                            try {
                              const date = new Date(dateStr);
                              return date.toLocaleDateString("fr-FR");
                            } catch {
                              return "N/A";
                            }
                          };

                          const getStatusBadge = (status: string) => {
                            if (status === "in_progress") return <Badge className="bg-blue-600">En cours d'exécution</Badge>;
                            if (status === "marked_paid_transporter") return <Badge className="bg-yellow-600">Payé côté transporteur</Badge>;
                            if (status === "marked_paid_client") return <Badge className="bg-orange-600">Payé côté client</Badge>;
                            if (status === "completed") return <Badge className="bg-green-600">Terminé</Badge>;
                            return <Badge variant="secondary">Inconnu</Badge>;
                          };

                          return (
                            <TableRow key={contract.id}>
                              <TableCell className="font-medium" data-testid={`text-contract-ref-${contract.id}`}>
                                {contract.referenceId || "N/A"}
                              </TableCell>
                              <TableCell data-testid={`text-contract-client-${contract.id}`}>
                                Client {client?.clientId || "Non défini"}
                              </TableCell>
                              <TableCell data-testid={`text-contract-transporter-${contract.id}`}>
                                <div className="flex flex-col">
                                  <span>{transporter?.name || "N/A"}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {transporter?.phoneNumber || ""}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="font-semibold" data-testid={`text-contract-amount-${contract.id}`}>
                                {contract.amount} MAD
                              </TableCell>
                              <TableCell data-testid={`text-contract-date-${contract.id}`}>
                                {formatDate(contract.createdAt)}
                              </TableCell>
                              <TableCell data-testid={`badge-contract-status-${contract.id}`}>
                                {getStatusBadge(contract.status)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="hover:bg-[#3498db]/10"
                                  onClick={() => {
                                    setSelectedContract(contract);
                                    setContractDetailsOpen(true);
                                  }}
                                  data-testid={`button-view-contract-${contract.id}`}
                                >
                                  <Eye className="w-5 h-5 text-[#3498db]" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === 'messages' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Messages
                  <Badge className="ml-2" data-testid="badge-total-conversations">
                    Total: {conversations.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {conversations.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucune conversation pour le moment</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>N° Commande</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Transporteur</TableHead>
                          <TableHead>Dernier message</TableHead>
                          <TableHead>Nb messages</TableHead>
                          <TableHead>Aperçu</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {conversations.map((conv: any) => {
                          const formatDate = (dateStr: string | Date) => {
                            if (!dateStr) return "N/A";
                            try {
                              const date = new Date(dateStr);
                              return date.toLocaleString("fr-FR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              });
                            } catch {
                              return "N/A";
                            }
                          };

                          const truncateMessage = (msg: string, maxLength = 50) => {
                            if (!msg) return "";
                            return msg.length > maxLength ? msg.substring(0, maxLength) + "..." : msg;
                          };

                          return (
                            <TableRow key={conv.requestId}>
                              <TableCell className="font-medium" data-testid={`text-conv-ref-${conv.requestId}`}>
                                {conv.referenceId || "N/A"}
                              </TableCell>
                              <TableCell data-testid={`text-conv-client-${conv.requestId}`}>
                                Client {conv.clientId || "Non défini"}
                              </TableCell>
                              <TableCell data-testid={`text-conv-transporter-${conv.requestId}`}>
                                {conv.transporterName || "N/A"}
                              </TableCell>
                              <TableCell data-testid={`text-conv-date-${conv.requestId}`}>
                                {formatDate(conv.lastMessage.createdAt)}
                              </TableCell>
                              <TableCell data-testid={`text-conv-count-${conv.requestId}`}>
                                <Badge variant="secondary">{conv.messageCount}</Badge>
                              </TableCell>
                              <TableCell className="max-w-xs" data-testid={`text-conv-preview-${conv.requestId}`}>
                                <span className="text-sm text-muted-foreground italic">
                                  "{truncateMessage(conv.lastMessage.text)}"
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="hover:bg-[#3498db]/10"
                                    onClick={() => {
                                      setSelectedConversation(conv);
                                      setConversationDialogOpen(true);
                                    }}
                                    data-testid={`button-view-conversation-${conv.requestId}`}
                                  >
                                    <Eye className="w-5 h-5 text-[#3498db]" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="hover:bg-destructive/10"
                                    onClick={() => {
                                      setDeleteConversationId(conv.requestId);
                                    }}
                                    data-testid={`button-delete-conversation-${conv.requestId}`}
                                  >
                                    <Trash2 className="w-5 h-5 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === 'validation' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Validation des transporteurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingLoading ? (
                  <div className="text-center py-8">
                    <LoadingTruck message="Chargement des transporteurs..." size="md" />
                  </div>
                ) : pendingDrivers.length === 0 ? (
                  <div className="text-center py-8">
                    <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun transporteur en attente de validation</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead>Ville</TableHead>
                        <TableHead>Date de demande</TableHead>
                        <TableHead>Photo camion</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingDrivers.map((driver: any) => (
                        <TableRow key={driver.id}>
                          <TableCell className="font-medium">{driver.name}</TableCell>
                          <TableCell>{driver.phoneNumber}</TableCell>
                          <TableCell>{driver.city}</TableCell>
                          <TableCell>
                            {driver.createdAt ? (
                              <div className="text-sm">
                                <div className="font-medium">
                                  {format(new Date(driver.createdAt), "dd/MM/yyyy", { locale: fr })}
                                </div>
                                <div className="text-muted-foreground">
                                  {format(new Date(driver.createdAt), "HH:mm", { locale: fr })}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleLoadTruckPhotos(driver.id)}
                              disabled={loadingPhotos[driver.id]}
                              data-testid={`button-view-photo-${driver.id}`}
                              className="hover-elevate"
                            >
                              {loadingPhotos[driver.id] ? (
                                <RefreshCw className="w-5 h-5 animate-spin text-[#3498db]" />
                              ) : (
                                <Camera className="w-5 h-5 text-[#3498db]" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleValidateDriver(driver.id, true)}
                                data-testid={`button-validate-${driver.id}`}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Valider
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleValidateDriver(driver.id, false)}
                                data-testid={`button-reject-${driver.id}`}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Refuser
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  if (confirm(`⚠️ Êtes-vous sûr de vouloir supprimer définitivement ce compte transporteur ?\n\nCette action supprimera aussi son mot de passe et toutes ses données associées (offres, messages, etc.).`)) {
                                    deleteUserMutation.mutate(driver.id);
                                  }
                                }}
                                data-testid={`button-delete-user-${driver.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === 'to-pay' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Paiements en attente de validation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingPayments.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun paiement en attente de validation</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° Commande</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Transporteur</TableHead>
                        <TableHead>Montant net</TableHead>
                        <TableHead>Total client</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Reçu</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingPayments.map((request: any) => {
                        const client = allUsers.find((u: any) => u.id === request.clientId);
                        
                        // Get accepted offer details
                        const acceptedOffer = request.acceptedOfferId 
                          ? allOffers.find((o: any) => o.id === request.acceptedOfferId)
                          : null;
                        
                        // Get transporter from accepted offer
                        const transporter = acceptedOffer 
                          ? allUsers.find((u: any) => u.id === acceptedOffer.transporterId)
                          : null;

                        // Use manual pricing values if available (qualified requests), otherwise calculate for legacy
                        const netAmount = request.transporterAmount 
                          ? parseFloat(request.transporterAmount)
                          : (acceptedOffer ? parseFloat(acceptedOffer.amount) : 0);
                        
                        const commissionAmount = request.platformFee 
                          ? parseFloat(request.platformFee)
                          : (acceptedOffer ? netAmount * (parseFloat(adminSettings?.commissionPercentage || "10") / 100) : 0);
                        
                        const totalClientAmount = request.clientTotal 
                          ? parseFloat(request.clientTotal)
                          : (netAmount + commissionAmount); // For legacy requests, calculate total

                        return (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">{request.referenceId}</TableCell>
                            <TableCell>
                              Client {client?.clientId || "Non défini"}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {transporter?.name || "Transporteur"}
                                </p>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Phone className="w-3 h-3" />
                                  <a href={`tel:${transporter?.phoneNumber}`} className="hover:underline">
                                    {transporter?.phoneNumber || "N/A"}
                                  </a>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold">{netAmount.toFixed(2)} MAD</span>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-primary">{totalClientAmount.toFixed(2)} MAD</span>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-green-600">{commissionAmount.toFixed(2)} MAD</span>
                            </TableCell>
                            <TableCell>
                              {request.paymentReceipt ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedReceipt(request.paymentReceipt);
                                    setShowReceiptDialog(true);
                                  }}
                                  className="gap-1"
                                  data-testid={`button-view-receipt-${request.id}`}
                                >
                                  <Eye className="w-4 h-4" />
                                  Voir
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-sm">Aucun reçu</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end flex-wrap">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleValidatePayment(request.id)}
                                  data-testid={`button-validate-payment-${request.id}`}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Marquer comme payé
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRejectReceipt(request.id)}
                                  data-testid={`button-reject-receipt-${request.id}`}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Refuser le reçu
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === 'drivers' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Tous les transporteurs
                  <Badge className="ml-2" data-testid="badge-total-transporters">
                    Total: {transportersWithStats.filter((t: any) => {
                      const searchLower = transporterSearch.toLowerCase();
                      const matchesSearch = !transporterSearch || 
                        t.name.toLowerCase().includes(searchLower) || 
                        t.phoneNumber.includes(transporterSearch);
                      const matchesCity = transporterCityFilter === "all" || t.city === transporterCityFilter;
                      return matchesSearch && matchesCity;
                    }).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par nom ou téléphone..."
                      value={transporterSearch}
                      onChange={(e) => setTransporterSearch(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-transporter"
                    />
                  </div>
                  <Select value={transporterCityFilter} onValueChange={setTransporterCityFilter}>
                    <SelectTrigger className="w-[200px]" data-testid="select-city-filter">
                      <SelectValue placeholder="Filtrer par ville" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les villes</SelectItem>
                      {Array.from(new Set(transportersWithStats.map((t: any) => t.city))).map((city: any) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {transportersLoading ? (
                  <div className="text-center py-8">
                    <LoadingTruck message="Chargement des transporteurs..." size="md" />
                  </div>
                ) : transportersError ? (
                  <div className="text-center py-8 text-destructive">
                    <XCircle className="w-12 h-12 mx-auto mb-4" />
                    <p className="font-semibold">Erreur lors du chargement</p>
                    <p className="text-sm mt-2">{transportersError.message}</p>
                  </div>
                ) : transportersWithStats.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun transporteur validé</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      (Vérifiez la console pour plus de détails)
                    </p>
                  </div>
                ) : (
                  (() => {
                    const filteredTransporters = transportersWithStats.filter((t: any) => {
                      const searchLower = transporterSearch.toLowerCase();
                      const matchesSearch = !transporterSearch || 
                        t.name.toLowerCase().includes(searchLower) || 
                        t.phoneNumber.includes(transporterSearch);
                      const matchesCity = transporterCityFilter === "all" || t.city === transporterCityFilter;
                      return matchesSearch && matchesCity;
                    });

                    return filteredTransporters.length === 0 ? (
                      <div className="text-center py-8">
                        <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Aucun transporteur trouvé avec ces critères</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-16">Photo</TableHead>
                              <TableHead>Nom</TableHead>
                              <TableHead>Ville</TableHead>
                              <TableHead>Téléphone</TableHead>
                              <TableHead>Note</TableHead>
                              <TableHead>Trajets</TableHead>
                              <TableHead>Commissions</TableHead>
                              <TableHead>Dernière activité</TableHead>
                              <TableHead>Statut</TableHead>
                              <TableHead>RIB</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredTransporters.map((transporter: any) => (
                              <TableRow key={transporter.id}>
                                <TableCell>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => {
                                            setViewPhotoTransporterId(transporter.id);
                                            setViewPhotoDialogOpen(true);
                                          }}
                                          disabled={!transporter.hasTruckPhoto}
                                          data-testid={`button-view-photo-${transporter.id}`}
                                          className="hover-elevate"
                                        >
                                          <Camera className={`w-4 h-4 ${transporter.hasTruckPhoto ? 'text-primary' : 'text-muted-foreground'}`} />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{transporter.hasTruckPhoto ? "Voir la photo du camion" : "Aucune photo disponible"}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableCell>
                                <TableCell className="font-medium">{transporter.name}</TableCell>
                                <TableCell>{transporter.city}</TableCell>
                                <TableCell>
                                  <a 
                                    href={`tel:${transporter.phoneNumber}`}
                                    className="text-primary hover:underline"
                                  >
                                    {transporter.phoneNumber}
                                  </a>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    ⭐ {transporter.rating.toFixed(1)}
                                    <span className="text-xs text-muted-foreground ml-1">
                                      ({transporter.totalRatings})
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>{transporter.totalTrips}</TableCell>
                                <TableCell className="text-primary font-semibold">
                                  {transporter.totalCommissions.toLocaleString("fr-MA")} MAD
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {transporter.lastActivity 
                                    ? new Date(transporter.lastActivity).toLocaleDateString("fr-FR")
                                    : "Aucune"}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={transporter.accountStatus === "active" ? "default" : "destructive"}
                                    data-testid={`badge-status-${transporter.id}`}
                                  >
                                    {transporter.accountStatus === "active" ? "Actif" : "Bloqué"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedRibTransporter(transporter)}
                                    data-testid={`button-rib-${transporter.id}`}
                                    className="gap-2"
                                  >
                                    <CreditCard className="w-4 h-4" />
                                    RIB
                                  </Button>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2 flex-wrap">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingTransporter(transporter);
                                        setEditTransporterName(transporter.name || "");
                                        setEditTransporterCity(transporter.city || "");
                                        setEditTransporterPhone(transporter.phoneNumber || "");
                                        setEditTransporterNewPassword("");
                                        setEditTransporterPhoto(null);
                                        setEditTransporterDialogOpen(true);
                                      }}
                                      data-testid={`button-edit-${transporter.id}`}
                                      className="gap-1"
                                    >
                                      <Pencil className="w-4 h-4" />
                                      Modifier
                                    </Button>
                                    {transporter.accountStatus === "active" ? (
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleBlockUser(transporter.id, "transporter")}
                                        data-testid={`button-block-${transporter.id}`}
                                      >
                                        🔒 Bloquer
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => handleUnblockUser(transporter.id, "transporter")}
                                        data-testid={`button-unblock-${transporter.id}`}
                                      >
                                        🔓 Débloquer
                                      </Button>
                                    )}
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => {
                                        if (confirm(`⚠️ Êtes-vous sûr de vouloir supprimer définitivement ce compte transporteur ?\n\nCette action supprimera aussi son mot de passe et toutes ses données associées (offres, messages, etc.).`)) {
                                          deleteUserMutation.mutate(transporter.id);
                                        }
                                      }}
                                      data-testid={`button-delete-transporter-${transporter.id}`}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    );
                  })()
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === 'clients' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Tous les clients
                  <Badge className="ml-2" data-testid="badge-total-clients">
                    Total: {clientsWithStats.filter((c: any) => {
                      const searchLower = clientSearch.toLowerCase();
                      return !clientSearch || 
                        c.name.toLowerCase().includes(searchLower) || 
                        c.phoneNumber.includes(clientSearch) ||
                        c.clientId.toLowerCase().includes(searchLower);
                    }).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par ID, nom ou téléphone..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-client"
                    />
                  </div>
                </div>

                {clientsWithStats.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun client enregistré</p>
                  </div>
                ) : (
                  (() => {
                    const filteredClients = clientsWithStats.filter((c: any) => {
                      const searchLower = clientSearch.toLowerCase();
                      return !clientSearch || 
                        c.name.toLowerCase().includes(searchLower) || 
                        c.phoneNumber.includes(clientSearch) ||
                        c.clientId.toLowerCase().includes(searchLower);
                    });

                    return filteredClients.length === 0 ? (
                      <div className="text-center py-8">
                        <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Aucun client trouvé avec ces critères</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID Client</TableHead>
                              <TableHead>Nom</TableHead>
                              <TableHead>Téléphone</TableHead>
                              <TableHead>Commandes totales</TableHead>
                              <TableHead>Commandes complétées</TableHead>
                              <TableHead>Satisfaction</TableHead>
                              <TableHead>Date d'inscription</TableHead>
                              <TableHead>Statut</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredClients.map((client: any) => (
                              <TableRow key={client.id}>
                                <TableCell className="font-medium" data-testid={`text-client-id-${client.id}`}>
                                  {client.clientId}
                                </TableCell>
                                <TableCell data-testid={`text-client-name-${client.id}`}>
                                  {client.name}
                                </TableCell>
                                <TableCell>
                                  <a 
                                    href={`tel:${client.phoneNumber}`}
                                    className="text-primary hover:underline"
                                    data-testid={`link-client-phone-${client.id}`}
                                  >
                                    {client.phoneNumber}
                                  </a>
                                </TableCell>
                                <TableCell data-testid={`text-total-orders-${client.id}`}>
                                  {client.totalOrders}
                                </TableCell>
                                <TableCell data-testid={`text-completed-orders-${client.id}`}>
                                  {client.completedOrders}
                                </TableCell>
                                <TableCell data-testid={`text-client-rating-${client.id}`}>
                                  {client.averageRating > 0 ? (
                                    <div className="flex items-center gap-1">
                                      ⭐ {client.averageRating.toFixed(1)}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">Aucune note</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground" data-testid={`text-registration-date-${client.id}`}>
                                  {client.registrationDate 
                                    ? new Date(client.registrationDate).toLocaleDateString("fr-FR")
                                    : "N/A"}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={client.accountStatus === "active" ? "default" : "destructive"}
                                    data-testid={`badge-client-status-${client.id}`}
                                  >
                                    {client.accountStatus === "active" ? "Actif" : "Bloqué"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    {client.accountStatus === "active" ? (
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleBlockUser(client.id, "client")}
                                        data-testid={`button-block-client-${client.id}`}
                                      >
                                        🔒 Bloquer
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => handleUnblockUser(client.id, "client")}
                                        data-testid={`button-unblock-client-${client.id}`}
                                      >
                                        🔓 Débloquer
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => {
                                        if (confirm(`⚠️ Êtes-vous sûr de vouloir supprimer définitivement ce compte client ?\n\nCette action supprimera aussi son mot de passe et toutes ses données associées (demandes, messages, etc.).`)) {
                                          deleteUserMutation.mutate(client.id);
                                        }
                                      }}
                                      data-testid={`button-delete-user-${client.id}`}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    );
                  })()
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === 'coordinators' && (
            <CoordinatorManagement />
          )}

          {activeSection === 'coordination-statuses' && (
            <CoordinationStatusManagement />
          )}

          {activeSection === 'reports' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="w-5 h-5" />
                  Tous les signalements
                  <Badge className="ml-2" data-testid="badge-total-reports">
                    Total: {allReports.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reportsLoading ? (
                  <div className="text-center py-8">
                    <LoadingTruck message="Chargement des signalements..." size="md" />
                  </div>
                ) : allReports.length === 0 ? (
                  <div className="text-center py-8">
                    <Flag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun signalement pour le moment</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Commande</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Signalé par</TableHead>
                          <TableHead>Utilisateur signalé</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allReports.map((report: any) => {
                          const reporter = allUsers.find((u: any) => u.id === report.reporterId);
                          const reportedUser = allUsers.find((u: any) => u.id === report.reportedUserId);
                          const request = allRequests.find((r: any) => r.id === report.requestId);

                          const getReportTypeLabel = (type: string) => {
                            const types: any = {
                              "no-show": "Absence",
                              "payment": "Paiement",
                              "communication": "Communication",
                              "incorrect-info": "Infos incorrectes",
                              "damaged-goods": "Marchandises non conformes",
                              "other": "Autre"
                            };
                            return types[type] || type;
                          };

                          return (
                            <TableRow key={report.id}>
                              <TableCell className="text-sm" data-testid={`text-report-date-${report.id}`}>
                                {new Date(report.createdAt).toLocaleDateString("fr-FR")}
                              </TableCell>
                              <TableCell data-testid={`text-report-request-${report.id}`}>
                                {request?.referenceId || "N/A"}
                              </TableCell>
                              <TableCell data-testid={`text-report-type-${report.id}`}>
                                <Badge variant="outline">
                                  {getReportTypeLabel(report.type)}
                                </Badge>
                              </TableCell>
                              <TableCell data-testid={`text-reporter-${report.id}`}>
                                <div className="space-y-1">
                                  <p className="font-medium">{reporter?.name || "Inconnu"}</p>
                                  <Badge variant={report.reporterRole === "client" ? "default" : "secondary"} className="text-xs">
                                    {report.reporterRole === "client" ? "Client" : "Transporteur"}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell data-testid={`text-reported-user-${report.id}`}>
                                <div className="space-y-1">
                                  <p className="font-medium">{reportedUser?.name || "Inconnu"}</p>
                                  <p className="text-xs text-muted-foreground">{reportedUser?.phoneNumber}</p>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-xs" data-testid={`text-report-description-${report.id}`}>
                                <p className="text-sm truncate" title={report.description}>
                                  {report.description}
                                </p>
                              </TableCell>
                              <TableCell data-testid={`badge-report-status-${report.id}`}>
                                <Badge
                                  variant={
                                    report.status === "pending" ? "destructive" :
                                    report.status === "resolved" ? "default" :
                                    "secondary"
                                  }
                                >
                                  {report.status === "pending" ? "En attente" :
                                   report.status === "resolved" ? "Résolu" :
                                   "Rejeté"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {report.status === "pending" && (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => {
                                        updateReportMutation.mutate({
                                          reportId: report.id,
                                          status: "resolved",
                                          resolution: "Signalement traité et résolu par l'administrateur"
                                        });
                                      }}
                                      disabled={updateReportMutation.isPending}
                                      data-testid={`button-resolve-${report.id}`}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Résoudre
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => {
                                        updateReportMutation.mutate({
                                          reportId: report.id,
                                          status: "rejected",
                                          resolution: "Signalement rejeté par l'administrateur"
                                        });
                                      }}
                                      disabled={updateReportMutation.isPending}
                                      data-testid={`button-reject-${report.id}`}
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Rejeter
                                    </Button>
                                    {reportedUser && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleBlockUser(reportedUser.id, report.reporterRole === "client" ? "transporter" : "client")}
                                        data-testid={`button-block-reported-${report.id}`}
                                      >
                                        🔒 Bloquer
                                      </Button>
                                    )}
                                  </div>
                                )}
                                {report.status !== "pending" && report.resolution && (
                                  <p className="text-xs text-muted-foreground">{report.resolution}</p>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === 'communications' && (
            <AdminCommunications />
          )}

          {activeSection === 'stats' && (
            <div className="space-y-6">
              {/* KPI Principaux */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  title="Clients actifs"
                  value={adminStats?.activeClients || 0}
                  icon={Users}
                  trend={adminStats?.activeClientsTrend !== undefined ? formatTrend(adminStats.activeClientsTrend) : "..."}
                  trendUp={adminStats?.activeClientsTrend ? adminStats.activeClientsTrend > 0 : undefined}
                />
                <KpiCard
                  title="Transporteurs actifs"
                  value={adminStats?.activeDrivers || 0}
                  icon={Users}
                  trend={adminStats?.activeDriversTrend !== undefined ? formatTrend(adminStats.activeDriversTrend) : "..."}
                  trendUp={adminStats?.activeDriversTrend ? adminStats.activeDriversTrend > 0 : undefined}
                />
                <KpiCard
                  title="Demandes totales"
                  value={adminStats?.totalRequests || 0}
                  icon={Package}
                  trend=""
                  trendUp={undefined}
                />
                <KpiCard
                  title="Commissions totales"
                  value={`${adminStats?.totalCommissions?.toLocaleString("fr-MA") || 0} MAD`}
                  icon={DollarSign}
                  trend={adminStats?.commissionsTrend !== undefined ? formatTrend(adminStats.commissionsTrend) : "..."}
                  trendUp={adminStats?.commissionsTrend ? adminStats.commissionsTrend > 0 : undefined}
                />
              </div>

              {/* Statistiques détaillées */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                <CardHeader>
                  <CardTitle>Taux de conversion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary mb-2">
                    {adminStats?.conversionRate || 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Offres acceptées / Total des offres
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Demandes complétées</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary mb-2">
                    {adminStats?.completedRequests || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Sur {adminStats?.totalRequests || 0} demandes totales
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Satisfaction transporteurs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary mb-2">
                    ⭐ {adminStats?.averageRating || 0} / 5
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Moyenne des notes clients
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Durée moyenne</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary mb-2">
                    ⏱️ {adminStats?.averageProcessingTime || 0} j
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Traitement des commandes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Montant moyen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary mb-2">
                    {adminStats?.averageAmount?.toLocaleString("fr-MA") || 0} MAD
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Par mission complétée
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Paiements en attente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary mb-2">
                    {adminStats?.pendingPaymentsTotal?.toLocaleString("fr-MA") || 0} MAD
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {adminStats?.pendingPaymentsCount || 0} commande(s)
                  </p>
                </CardContent>
              </Card>

              <Card className="border-orange-500 border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <RefreshCw className="w-5 h-5" />
                    Migration Urgente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Corriger les demandes invisibles aux coordinateurs (statut de coordination manquant)
                  </p>
                  <Button
                    onClick={() => {
                      if (confirm("Lancer la migration pour rendre visibles les demandes manquantes dans les vues coordinateur ?")) {
                        migrateMutation.mutate();
                      }
                    }}
                    variant="outline"
                    className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
                    disabled={migrateMutation.isPending}
                    data-testid="button-migrate-coordination-status"
                  >
                    {migrateMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Migration en cours...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Lancer Migration
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
              </div>
            </div>
          )}

          {activeSection === 'facturation' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Historique des paiements
                  <Badge className="ml-2" data-testid="badge-total-invoices">
                    Total: {allRequests.filter((r: any) => r.paymentStatus === "paid").length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const paidRequests = allRequests.filter((r: any) => r.paymentStatus === "paid");
                  
                  if (paidRequests.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Aucun paiement validé pour le moment</p>
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Référence</TableHead>
                            <TableHead>Date validation</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Transporteur</TableHead>
                            <TableHead>Total client</TableHead>
                            <TableHead>Commission</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paidRequests.map((request: any) => {
                            const client = allUsers.find((u: any) => u.id === request.clientId);
                            const acceptedOffer = request.acceptedOfferId 
                              ? allOffers.find((o: any) => o.id === request.acceptedOfferId)
                              : null;
                            const transporter = acceptedOffer 
                              ? allUsers.find((u: any) => u.id === acceptedOffer.transporterId)
                              : null;

                            // Use manual pricing values if available (qualified requests), otherwise calculate for legacy
                            const netAmount = request.transporterAmount 
                              ? parseFloat(request.transporterAmount)
                              : (acceptedOffer ? parseFloat(acceptedOffer.amount) : 0);
                            
                            const commissionAmount = request.platformFee 
                              ? parseFloat(request.platformFee)
                              : (acceptedOffer ? netAmount * (parseFloat(adminSettings?.commissionPercentage || "10") / 100) : 0);
                            
                            const totalClientAmount = request.clientTotal 
                              ? parseFloat(request.clientTotal)
                              : (netAmount + commissionAmount); // For legacy requests, calculate total

                            return (
                              <TableRow key={request.id}>
                                <TableCell className="font-medium">{request.referenceId}</TableCell>
                                <TableCell>
                                  {request.updatedAt 
                                    ? new Date(request.updatedAt).toLocaleDateString("fr-FR")
                                    : "N/A"}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{client?.clientId || "Non défini"}</span>
                                    <span className="text-xs text-muted-foreground">{client?.phoneNumber || ""}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{transporter?.name || "Inconnu"}</p>
                                    <a 
                                      href={`tel:${transporter?.phoneNumber}`}
                                      className="text-xs text-primary hover:underline"
                                    >
                                      {transporter?.phoneNumber}
                                    </a>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="font-semibold text-primary">
                                    {totalClientAmount.toFixed(2)} MAD
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="font-semibold text-green-600">
                                    {commissionAmount.toFixed(2)} MAD
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge className="bg-green-600">Payé</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedInvoice(request);
                                      setInvoiceDetailsOpen(true);
                                    }}
                                    data-testid={`button-view-invoice-${request.id}`}
                                  >
                                    <Eye className="w-5 h-5 text-[#3498db]" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {activeSection === 'cities' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Gestion des villes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add new city form */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                  <h4 className="font-medium">Ajouter une nouvelle ville</h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nom de la ville"
                      value={editingCity ? editingCity.name : newCityName}
                      onChange={(e) => editingCity ? setEditingCity({...editingCity, name: e.target.value}) : setNewCityName(e.target.value)}
                      data-testid="input-city-name"
                    />
                    <Button 
                      onClick={async () => {
                        const cityName = editingCity ? editingCity.name : newCityName;
                        if (!cityName.trim()) {
                          toast({
                            variant: "destructive",
                            title: "Erreur",
                            description: "Le nom de la ville est requis",
                          });
                          return;
                        }
                        
                        try {
                          if (editingCity) {
                            // Update existing city
                            await apiRequest("PATCH", `/api/cities/${editingCity.id}`, {
                              name: cityName.trim()
                            });
                            toast({
                              title: "Ville modifiée",
                              description: `La ville a été modifiée avec succès`,
                            });
                            setEditingCity(null);
                          } else {
                            // Create new city
                            await apiRequest("POST", "/api/cities", {
                              name: cityName.trim(),
                              isActive: true
                            });
                            toast({
                              title: "Ville ajoutée",
                              description: `${cityName} a été ajoutée avec succès`,
                            });
                            setNewCityName("");
                          }
                          queryClient.invalidateQueries({ queryKey: ["/api/cities"] });
                        } catch (error: any) {
                          toast({
                            variant: "destructive",
                            title: "Erreur",
                            description: error.message || "Échec de l'opération",
                          });
                        }
                      }}
                      data-testid={editingCity ? "button-update-city" : "button-add-city"}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {editingCity ? "Modifier" : "Ajouter"}
                    </Button>
                    {editingCity && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingCity(null);
                          setNewCityName("");
                        }}
                        data-testid="button-cancel-edit-city"
                      >
                        Annuler
                      </Button>
                    )}
                  </div>
                </div>

                {/* Cities list */}
                <div>
                  <h4 className="font-medium mb-4">Liste des villes ({cities.length})</h4>
                  {citiesLoading ? (
                    <div className="text-center py-8">
                      <LoadingTruck message="Chargement des villes..." size="md" />
                    </div>
                  ) : cities.length === 0 ? (
                    <div className="text-center py-8">
                      <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucune ville enregistrée</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cities.map((city: any) => (
                            <TableRow key={city.id}>
                              <TableCell className="font-medium">{city.name}</TableCell>
                              <TableCell>
                                <Badge variant={city.isActive ? "default" : "secondary"}>
                                  {city.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingCity(city);
                                      setNewCityName(city.name);
                                    }}
                                    data-testid={`button-edit-city-${city.id}`}
                                  >
                                    Modifier
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={async () => {
                                      if (confirm(`Êtes-vous sûr de vouloir supprimer ${city.name} ?`)) {
                                        try {
                                          await apiRequest("DELETE", `/api/cities/${city.id}`);
                                          toast({
                                            title: "Ville supprimée",
                                            description: `${city.name} a été supprimée avec succès`,
                                          });
                                          queryClient.invalidateQueries({ queryKey: ["/api/cities"] });
                                        } catch (error) {
                                          toast({
                                            variant: "destructive",
                                            title: "Erreur",
                                            description: "Échec de la suppression",
                                          });
                                        }
                                      }
                                    }}
                                    data-testid={`button-delete-city-${city.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'stories' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Circle className="w-5 h-5" />
                  Gestion des Stories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add new story form */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                  <h4 className="font-medium">
                    {editingStory ? "Modifier une story" : "Créer une nouvelle story"}
                  </h4>
                  <div className="space-y-3">
                    <Input
                      placeholder="Titre de la story"
                      value={editingStory ? editingStory.title : newStoryTitle}
                      onChange={(e) => editingStory 
                        ? setEditingStory({...editingStory, title: e.target.value}) 
                        : setNewStoryTitle(e.target.value)}
                      data-testid="input-story-title"
                    />
                    <Textarea
                      placeholder="Contenu de la story"
                      value={editingStory ? editingStory.content : newStoryContent}
                      onChange={(e) => editingStory 
                        ? setEditingStory({...editingStory, content: e.target.value}) 
                        : setNewStoryContent(e.target.value)}
                      rows={4}
                      data-testid="input-story-content"
                    />
                    <Input
                      placeholder="URL de l'image/vidéo (optionnel)"
                      value={editingStory ? (editingStory.mediaUrl || '') : newStoryMediaUrl}
                      onChange={(e) => editingStory 
                        ? setEditingStory({...editingStory, mediaUrl: e.target.value}) 
                        : setNewStoryMediaUrl(e.target.value)}
                      data-testid="input-story-media-url"
                    />
                    <Select
                      value={editingStory ? editingStory.role : newStoryRole}
                      onValueChange={(value) => editingStory
                        ? setEditingStory({...editingStory, role: value})
                        : setNewStoryRole(value)}
                    >
                      <SelectTrigger data-testid="select-story-role">
                        <SelectValue placeholder="Sélectionner le public" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les utilisateurs</SelectItem>
                        <SelectItem value="client">Clients uniquement</SelectItem>
                        <SelectItem value="transporter">Transporteurs uniquement</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Ordre d'affichage (0 = premier)"
                      value={editingStory ? editingStory.order : newStoryOrder}
                      onChange={(e) => editingStory 
                        ? setEditingStory({...editingStory, order: parseInt(e.target.value)}) 
                        : setNewStoryOrder(parseInt(e.target.value))}
                      data-testid="input-story-order"
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={async () => {
                          const title = editingStory ? editingStory.title : newStoryTitle;
                          const content = editingStory ? editingStory.content : newStoryContent;
                          const mediaUrl = editingStory ? editingStory.mediaUrl : newStoryMediaUrl;
                          const role = editingStory ? editingStory.role : newStoryRole;
                          const order = editingStory ? editingStory.order : newStoryOrder;
                          
                          if (!title.trim() || !content.trim() || !role) {
                            toast({
                              variant: "destructive",
                              title: "Erreur",
                              description: "Titre, contenu et public requis",
                            });
                            return;
                          }
                          
                          try {
                            if (editingStory) {
                              await apiRequest("PATCH", `/api/stories/${editingStory.id}?adminId=${user.id}`, {
                                title: title.trim(),
                                content: content.trim(),
                                mediaUrl: mediaUrl.trim() || null,
                                role,
                                order: order || 0,
                              });
                              toast({
                                title: "Story modifiée",
                                description: "La story a été modifiée avec succès",
                              });
                              setEditingStory(null);
                            } else {
                              await apiRequest("POST", `/api/stories?adminId=${user.id}`, {
                                title: title.trim(),
                                content: content.trim(),
                                mediaUrl: mediaUrl.trim() || null,
                                role,
                                order: order || 0,
                              });
                              toast({
                                title: "Story créée",
                                description: `La story "${title}" a été créée avec succès`,
                              });
                              setNewStoryTitle("");
                              setNewStoryContent("");
                              setNewStoryMediaUrl("");
                              setNewStoryRole("all");
                              setNewStoryOrder(0);
                            }
                            queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
                          } catch (error: any) {
                            toast({
                              variant: "destructive",
                              title: "Erreur",
                              description: error.message || "Échec de l'opération",
                            });
                          }
                        }}
                        data-testid={editingStory ? "button-update-story" : "button-create-story"}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {editingStory ? "Modifier" : "Créer"}
                      </Button>
                      {editingStory && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingStory(null);
                            setNewStoryTitle("");
                            setNewStoryContent("");
                            setNewStoryMediaUrl("");
                            setNewStoryRole("all");
                            setNewStoryOrder(0);
                          }}
                          data-testid="button-cancel-edit-story"
                        >
                          Annuler
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stories list */}
                <div>
                  <h4 className="font-medium mb-4">Liste des stories ({allStories.length})</h4>
                  {storiesLoading ? (
                    <div className="text-center py-8">
                      <LoadingTruck message="Chargement des stories..." size="md" />
                    </div>
                  ) : allStories.length === 0 ? (
                    <div className="text-center py-8">
                      <Circle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucune story enregistrée</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Titre</TableHead>
                            <TableHead>Contenu</TableHead>
                            <TableHead>Public</TableHead>
                            <TableHead>Ordre</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allStories.map((story: any) => (
                            <TableRow key={story.id}>
                              <TableCell className="font-medium">{story.title}</TableCell>
                              <TableCell className="max-w-xs truncate">{story.content}</TableCell>
                              <TableCell>
                                <Badge variant={
                                  story.role === "all" ? "default" : 
                                  story.role === "client" ? "secondary" : 
                                  "outline"
                                }>
                                  {story.role === "all" ? "Tous" : 
                                   story.role === "client" ? "Clients" : 
                                   "Transporteurs"}
                                </Badge>
                              </TableCell>
                              <TableCell>{story.order}</TableCell>
                              <TableCell>
                                <Badge variant={story.isActive ? "default" : "secondary"}>
                                  {story.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                      try {
                                        await apiRequest("PATCH", `/api/stories/${story.id}?adminId=${user.id}`, {
                                          isActive: !story.isActive
                                        });
                                        toast({
                                          title: story.isActive ? "Story désactivée" : "Story activée",
                                          description: `La story est maintenant ${!story.isActive ? "active" : "inactive"}`,
                                        });
                                        queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
                                      } catch (error) {
                                        toast({
                                          variant: "destructive",
                                          title: "Erreur",
                                          description: "Échec du changement de statut",
                                        });
                                      }
                                    }}
                                    data-testid={`button-toggle-story-${story.id}`}
                                  >
                                    {story.isActive ? "Désactiver" : "Activer"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingStory(story);
                                    }}
                                    data-testid={`button-edit-story-${story.id}`}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={async () => {
                                      if (confirm(`Êtes-vous sûr de vouloir supprimer "${story.title}" ?`)) {
                                        try {
                                          await apiRequest("DELETE", `/api/stories/${story.id}?adminId=${user.id}`);
                                          toast({
                                            title: "Story supprimée",
                                            description: `"${story.title}" a été supprimée avec succès`,
                                          });
                                          queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
                                        } catch (error) {
                                          toast({
                                            variant: "destructive",
                                            title: "Erreur",
                                            description: "Échec de la suppression",
                                          });
                                        }
                                      }
                                    }}
                                    data-testid={`button-delete-story-${story.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* REMOVED: Old automatic pricing system with commission percentage - now using manual coordinator pricing */}
          
          {activeSection === 'empty-returns' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TruckIcon className="w-5 h-5" />
                  Retours à vide annoncés
                </CardTitle>
              </CardHeader>
              <CardContent>
                {emptyReturnsLoading ? (
                  <div className="text-center py-8">
                    <LoadingTruck message="Chargement des retours à vide..." size="md" />
                  </div>
                ) : emptyReturns.length === 0 ? (
                  <div className="text-center py-8">
                    <TruckIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun retour à vide annoncé</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transporteur</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead>De</TableHead>
                        <TableHead>Vers</TableHead>
                        <TableHead>Date de retour</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emptyReturns.map((emptyReturn: any) => {
                        const transporter = allUsers.find((u: any) => u.id === emptyReturn.transporterId);
                        return (
                          <TableRow key={emptyReturn.id}>
                            <TableCell className="font-medium">
                              {transporter?.name || "Inconnu"}
                            </TableCell>
                            <TableCell>
                              <a 
                                href={`tel:${transporter?.phoneNumber}`}
                                className="text-primary hover:underline"
                              >
                                {transporter?.phoneNumber || "N/A"}
                              </a>
                            </TableCell>
                            <TableCell>{emptyReturn.fromCity}</TableCell>
                            <TableCell>{emptyReturn.toCity}</TableCell>
                            <TableCell>
                              {new Date(emptyReturn.returnDate).toLocaleDateString("fr-FR")}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                className="bg-[#00d4b2] hover:bg-[#00d4b2] border border-[#00d4b2]"
                                onClick={() => {
                                  setSelectedEmptyReturn(emptyReturn);
                                  setAssignOrderDialogOpen(true);
                                }}
                                data-testid={`button-assign-order-${emptyReturn.id}`}
                              >
                                Affecter une commande
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AddTransporterForm
        open={addTransporterOpen}
        onClose={() => setAddTransporterOpen(false)}
        onSuccess={() => {}}
      />

      <AddClientForm
        open={addClientOpen}
        onClose={() => setAddClientOpen(false)}
        onSuccess={() => {}}
      />

      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reçu de paiement</DialogTitle>
            <DialogDescription>
              Vérifiez le reçu de paiement du client avant validation
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {selectedReceipt && (
              <img
                src={selectedReceipt}
                alt="Reçu de paiement"
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg border"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Order Dialog */}
      <Dialog open={assignOrderDialogOpen} onOpenChange={setAssignOrderDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Affecter une commande</DialogTitle>
            <DialogDescription>
              Sélectionnez une commande ouverte à affecter au transporteur
              {selectedEmptyReturn && (
                <span className="block mt-2 text-sm">
                  Retour: <strong>{selectedEmptyReturn.fromCity} → {selectedEmptyReturn.toCity}</strong>
                  {" "}le{" "}
                  <strong>{new Date(selectedEmptyReturn.returnDate).toLocaleDateString("fr-FR")}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par référence (CMD-XXXX)..."
                value={assignOrderSearch}
                onChange={(e) => setAssignOrderSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-assign-order"
              />
            </div>

            {(() => {
              const openRequests = allRequests
                .filter((req: any) => req.status === "open")
                .filter((req: any) => 
                  !assignOrderSearch || 
                  req.referenceId.toLowerCase().includes(assignOrderSearch.toLowerCase())
                );

              if (allRequests.filter((req: any) => req.status === "open").length === 0) {
                return (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucune commande ouverte disponible</p>
                  </div>
                );
              }

              if (openRequests.length === 0 && assignOrderSearch) {
                return (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucune commande trouvée avec cette référence</p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {openRequests.map((request: any) => {
                    const client = allUsers.find((u: any) => u.id === request.clientId);
                    return (
                      <Card 
                        key={request.id}
                        className="hover-elevate cursor-pointer"
                        onClick={() => {
                          if (selectedEmptyReturn) {
                            assignOrderMutation.mutate({
                              emptyReturnId: selectedEmptyReturn.id,
                              requestId: request.id,
                            });
                          }
                        }}
                        data-testid={`card-assign-request-${request.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">Réf: {request.referenceId}</Badge>
                                <span className="text-sm text-muted-foreground">
                                  Client {client?.clientId || "Non défini"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">{request.fromCity}</span>
                                <span className="text-muted-foreground">→</span>
                                <span className="font-medium">{request.toCity}</span>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {request.description}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              className="bg-[#00d4b2] hover:bg-[#00d4b2] border border-[#00d4b2]"
                              disabled={assignOrderMutation.isPending}
                            >
                              {assignOrderMutation.isPending ? "Affectation..." : "Affecter"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Contract Details Dialog */}
      <Dialog open={contractDetailsOpen} onOpenChange={setContractDetailsOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du contrat</DialogTitle>
            <DialogDescription>
              Informations complètes sur le contrat et la commande associée
            </DialogDescription>
          </DialogHeader>
          {selectedContract && (() => {
            const request = allRequests.find((r: any) => r.id === selectedContract.requestId);
            const offer = allOffers.find((o: any) => o.id === selectedContract.offerId);
            const client = allUsers.find((u: any) => u.id === selectedContract.clientId);
            const transporter = allUsers.find((u: any) => u.id === selectedContract.transporterId);

            return (
              <div className="mt-4 space-y-6">
                {/* Header avec statut */}
                <div className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <h3 className="text-lg font-semibold">Contrat {selectedContract.referenceId}</h3>
                    <p className="text-sm text-muted-foreground">
                      Créé le {new Date(selectedContract.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Changer le statut</label>
                    <Select
                      value={selectedContract.status}
                      onValueChange={async (value) => {
                        try {
                          await apiRequest("PATCH", `/api/contracts/${selectedContract.id}`, { status: value });
                          toast({
                            title: "Statut mis à jour",
                            description: "Le statut du contrat a été modifié avec succès",
                          });
                          queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
                          setContractDetailsOpen(false);
                        } catch (error) {
                          toast({
                            variant: "destructive",
                            title: "Erreur",
                            description: "Échec de la mise à jour du statut",
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="w-[250px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_progress">En cours d'exécution</SelectItem>
                        <SelectItem value="marked_paid_transporter">Payé côté transporteur</SelectItem>
                        <SelectItem value="marked_paid_client">Payé côté client</SelectItem>
                        <SelectItem value="completed">Terminé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Informations financières */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Informations financières</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Montant convenu</span>
                      <span className="font-semibold">{selectedContract.amount} MAD</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Informations client et transporteur */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Client
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Identifiant</p>
                        <p className="font-medium">Client {client?.clientId || "Non défini"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Ville</p>
                        <p className="font-medium flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {client?.city || "N/A"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <TruckIcon className="w-4 h-4" />
                        Transporteur
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Nom</p>
                        <p className="font-medium">{transporter?.name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Téléphone</p>
                        <p className="font-medium flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {transporter?.phoneNumber || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Ville</p>
                        <p className="font-medium flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {transporter?.city || "N/A"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Détails de la commande */}
                {request && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Détails de la commande
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Ville de départ</p>
                          <p className="font-medium">{request.fromCity}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Ville d'arrivée</p>
                          <p className="font-medium">{request.toCity}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Date souhaitée</p>
                          <p className="font-medium flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(request.dateTime).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Type de marchandise</p>
                          <p className="font-medium">{request.goodsType}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Description</p>
                        <p className="mt-1">{request.description}</p>
                      </div>
                      {/* Handling/Manutention Information */}
                      {request.handlingRequired !== undefined && request.handlingRequired !== null && (
                        <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Weight className="w-4 h-4" />
                            <span>Manutention : {request.handlingRequired ? 'Oui' : 'Non'}</span>
                          </div>
                          {request.handlingRequired && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Building2 className="w-3 h-3" />
                                  <span className="font-medium">Départ</span>
                                </div>
                                <div className="pl-4">
                                  {request.departureFloor !== undefined && request.departureFloor !== null ? (
                                    <>
                                      <div>{request.departureFloor === 0 ? 'RDC' : `${request.departureFloor}ᵉ étage`}</div>
                                      <div className="text-muted-foreground flex items-center gap-1">
                                        Ascenseur {request.departureElevator ? <CheckCircle className="w-3 h-3 text-green-600" /> : <XCircle className="w-3 h-3 text-red-600" />}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="text-muted-foreground">Non spécifié</div>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Home className="w-3 h-3" />
                                  <span className="font-medium">Arrivée</span>
                                </div>
                                <div className="pl-4">
                                  {request.arrivalFloor !== undefined && request.arrivalFloor !== null ? (
                                    <>
                                      <div>{request.arrivalFloor === 0 ? 'RDC' : `${request.arrivalFloor}ᵉ étage`}</div>
                                      <div className="text-muted-foreground flex items-center gap-1">
                                        Ascenseur {request.arrivalElevator ? <CheckCircle className="w-3 h-3 text-green-600" /> : <XCircle className="w-3 h-3 text-red-600" />}
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
                      {request.photos && request.photos.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Photos</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {request.photos.map((photo: string, index: number) => (
                              <img
                                key={index}
                                src={photo}
                                alt={`Photo ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Détails de l'offre */}
                {offer && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Détails de l'offre
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Date de prise en charge</p>
                          <p className="font-medium flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(offer.pickupDate).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Type de chargement</p>
                          <p className="font-medium">
                            {offer.loadType === "return" ? "Retour (camion vide)" : "Groupage / Partagé"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Request Detail Dialog */}
      <Dialog open={requestDetailDialogOpen} onOpenChange={setRequestDetailDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Détails de la commande
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.referenceId}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (() => {
            const client = allUsers.find((u: any) => u.id === selectedRequest.clientId);
            const formatDate = (dateStr: string) => {
              if (!dateStr) return "N/A";
              try {
                const date = new Date(dateStr);
                return date.toLocaleDateString("fr-FR", { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
              } catch {
                return "N/A";
              }
            };

            const getStatusBadge = (status: string) => {
              if (status === "open") return <Badge variant="default">Ouverte</Badge>;
              if (status === "accepted") return <Badge className="bg-blue-600">Acceptée</Badge>;
              if (status === "completed") return <Badge className="bg-green-600">Complétée</Badge>;
              if (status === "cancelled") return <Badge variant="destructive">Annulée</Badge>;
              return <Badge variant="secondary">{status}</Badge>;
            };

            const getPaymentStatusBadge = (status: string) => {
              if (status === "pending") return <Badge variant="secondary">En attente</Badge>;
              if (status === "awaiting_payment") return <Badge className="bg-yellow-600">Attente paiement</Badge>;
              if (status === "pending_admin_validation") return <Badge className="bg-orange-600">Validation admin</Badge>;
              if (status === "paid") return <Badge className="bg-green-600">Payé</Badge>;
              return <Badge variant="secondary">{status}</Badge>;
            };

            return (
              <div className="space-y-6 py-4">
                {/* Client Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Informations client
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Numéro de téléphone</p>
                        <p className="font-medium text-base flex items-center gap-2">
                          <Phone className="w-4 h-4 text-primary" />
                          {client?.phoneNumber || "Non défini"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">ID Client</p>
                        <p className="font-medium">{client?.clientId || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Ville</p>
                        <p className="font-medium">{client?.city || "N/A"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Transport Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Détails du transport
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">De</p>
                        <p className="font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {selectedRequest.fromCity}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Vers</p>
                        <p className="font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {selectedRequest.toCity}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date souhaitée</p>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(selectedRequest.dateTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Type de marchandise</p>
                        <p className="font-medium">{selectedRequest.goodsType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Budget estimé</p>
                        <p className="font-medium">
                          {selectedRequest.budget ? `${parseFloat(selectedRequest.budget).toLocaleString("fr-MA")} MAD` : "Non spécifié"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Nombre de vues</p>
                        <p className="font-medium">{selectedRequest.viewCount || 0}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="font-medium text-sm bg-muted p-3 rounded-md">{selectedRequest.description}</p>
                    </div>
                    {/* Handling/Manutention Information */}
                    {selectedRequest.handlingRequired !== undefined && selectedRequest.handlingRequired !== null && (
                      <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Weight className="w-4 h-4" />
                          <span>Manutention : {selectedRequest.handlingRequired ? 'Oui' : 'Non'}</span>
                        </div>
                        {selectedRequest.handlingRequired && (
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Building2 className="w-3 h-3" />
                                <span className="font-medium">Départ</span>
                              </div>
                              <div className="pl-4">
                                {selectedRequest.departureFloor !== undefined && selectedRequest.departureFloor !== null ? (
                                  <>
                                    <div>{selectedRequest.departureFloor === 0 ? 'RDC' : `${selectedRequest.departureFloor}ᵉ étage`}</div>
                                    <div className="text-muted-foreground flex items-center gap-1">
                                      Ascenseur {selectedRequest.departureElevator ? <CheckCircle className="w-3 h-3 text-green-600" /> : <XCircle className="w-3 h-3 text-red-600" />}
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-muted-foreground">Non spécifié</div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Home className="w-3 h-3" />
                                <span className="font-medium">Arrivée</span>
                              </div>
                              <div className="pl-4">
                                {selectedRequest.arrivalFloor !== undefined && selectedRequest.arrivalFloor !== null ? (
                                  <>
                                    <div>{selectedRequest.arrivalFloor === 0 ? 'RDC' : `${selectedRequest.arrivalFloor}ᵉ étage`}</div>
                                    <div className="text-muted-foreground flex items-center gap-1">
                                      Ascenseur {selectedRequest.arrivalElevator ? <CheckCircle className="w-3 h-3 text-green-600" /> : <XCircle className="w-3 h-3 text-red-600" />}
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
                  </CardContent>
                </Card>

                {/* Status Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Statut et suivi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Statut de la demande</p>
                        <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Statut du paiement</p>
                        <div className="mt-1">{getPaymentStatusBadge(selectedRequest.paymentStatus)}</div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Visibilité</p>
                        <div className="mt-1">
                          {selectedRequest.isHidden ? (
                            <Badge variant="secondary">Masquée</Badge>
                          ) : (
                            <Badge variant="default">Visible</Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date de création</p>
                        <p className="font-medium">{formatDate(selectedRequest.createdAt)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Photos */}
                {selectedRequest.photos && selectedRequest.photos.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Photos du chargement ({selectedRequest.photos.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {selectedRequest.photos.map((photo: string, index: number) => (
                          <div 
                            key={index}
                            className="aspect-square rounded-lg overflow-hidden border hover:border-primary cursor-pointer transition-all"
                            onClick={() => window.open(photo, '_blank')}
                          >
                            <img 
                              src={photo} 
                              alt={`Photo ${index + 1}`}
                              className="w-full h-full object-cover hover:scale-110 transition-transform"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Offers Received */}
                {(() => {
                  const requestOffers = allOffers.filter((offer: any) => offer.requestId === selectedRequest.id);
                  if (requestOffers.length === 0) return null;
                  
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Offres reçues ({requestOffers.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {requestOffers.map((offer: any) => {
                            const transporter = allUsers.find((u: any) => u.id === offer.transporterId);
                            const formatOfferDate = (dateStr: string) => {
                              if (!dateStr) return "N/A";
                              try {
                                const date = new Date(dateStr);
                                return date.toLocaleDateString("fr-FR", { 
                                  day: '2-digit', 
                                  month: '2-digit', 
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                });
                              } catch {
                                return "N/A";
                              }
                            };

                            return (
                              <div key={offer.id} className="flex items-center justify-between p-4 border rounded-lg hover-elevate">
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">{transporter?.name || "Transporteur inconnu"}</p>
                                    {offer.status === "accepted" && (
                                      <Badge className="bg-green-600">Acceptée</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm font-medium flex items-center gap-2">
                                    <Phone className="w-3 h-3 text-primary" />
                                    {transporter?.phoneNumber || "N/A"}
                                  </p>
                                  <div className="flex items-center gap-4 text-sm">
                                    <span className="font-semibold text-primary">
                                      {parseFloat(offer.amount).toLocaleString("fr-MA")} MAD
                                    </span>
                                    <span className="text-muted-foreground">
                                      {formatOfferDate(offer.createdAt)}
                                    </span>
                                  </div>
                                </div>
                                {offer.status !== "accepted" && selectedRequest.status === "open" && (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      if (confirm("Voulez-vous accepter cette offre ? Le transporteur et le client seront notifiés.")) {
                                        handleAcceptOfferAsAdmin(offer.id, selectedRequest.id);
                                        setRequestDetailDialogOpen(false);
                                      }
                                    }}
                                    data-testid={`button-accept-offer-${offer.id}`}
                                  >
                                    ✅ Accepter l'offre
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setRequestDetailDialogOpen(false)}
                  >
                    Fermer
                  </Button>
                  <Select
                    value={selectedRequest.status}
                    onValueChange={(newStatus) => {
                      updateRequestMutation.mutate({
                        requestId: selectedRequest.id,
                        updates: { status: newStatus }
                      });
                    }}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Modifier le statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Ouverte</SelectItem>
                      <SelectItem value="accepted">Acceptée</SelectItem>
                      <SelectItem value="completed">Complétée</SelectItem>
                      <SelectItem value="cancelled">Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Conversation View Dialog */}
      <Dialog open={conversationDialogOpen} onOpenChange={setConversationDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Conversation - {selectedConversation?.referenceId}
            </DialogTitle>
            <DialogDescription>
              Client {selectedConversation?.clientId || "Non défini"} ↔ {selectedConversation?.transporterName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedConversation && (() => {
            const sendAdminMessage = async () => {
              if (!adminMessage.trim()) return;
              
              try {
                // Collect all unique recipients (client + transporter)
                const recipients = new Set<string>();
                if (selectedConversation.clientId) recipients.add(selectedConversation.clientId);
                if (selectedConversation.transporterId) recipients.add(selectedConversation.transporterId);
                
                if (recipients.size === 0) {
                  throw new Error("Aucun destinataire trouvé");
                }
                
                // For admin messages, we only store ONE message but need to send notifications to both
                // So we send ONE message with client as receiver (convention), then notify transporter separately
                const primaryReceiver = selectedConversation.clientId || selectedConversation.transporterId;
                
                await apiRequest("POST", "/api/chat/messages", {
                  requestId: selectedConversation.requestId,
                  senderId: user.id,
                  receiverId: primaryReceiver,
                  message: adminMessage,
                  messageType: "text",
                  senderType: "admin",
                });
                
                // If there's a transporter and it's different from primary receiver, send a notification
                if (selectedConversation.transporterId && selectedConversation.transporterId !== primaryReceiver) {
                  // Send duplicate message to ensure transporter sees it in their conversations
                  await apiRequest("POST", "/api/chat/messages", {
                    requestId: selectedConversation.requestId,
                    senderId: user.id,
                    receiverId: selectedConversation.transporterId,
                    message: adminMessage,
                    messageType: "text",
                    senderType: "admin",
                  });
                }
                
                toast({
                  title: "Message envoyé",
                  description: "Votre message a été envoyé avec succès",
                });
                
                setAdminMessage("");
                queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", selectedConversation.requestId] });
              } catch (error) {
                console.error('Admin message error:', error);
                toast({
                  variant: "destructive",
                  title: "Erreur",
                  description: "Échec de l'envoi du message",
                });
              }
            };

            const handleVoiceRecorded = async (audioBlob: Blob) => {
              try {
                // Upload voice file
                const formData = new FormData();
                const fileName = `voice-${Date.now()}.webm`;
                formData.append('audio', audioBlob, fileName);

                const response = await fetch('/api/messages/upload-voice', {
                  method: 'POST',
                  body: formData,
                });

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                  console.error('Upload error:', errorData);
                  throw new Error(errorData.error || 'Upload failed');
                }

                const { fileUrl } = await response.json();

                // Send voice message - send to both client and transporter
                const recipients = new Set<string>();
                if (selectedConversation.clientId) recipients.add(selectedConversation.clientId);
                if (selectedConversation.transporterId) recipients.add(selectedConversation.transporterId);
                
                if (recipients.size === 0) {
                  throw new Error("Aucun destinataire trouvé");
                }
                
                const primaryReceiver = selectedConversation.clientId || selectedConversation.transporterId;
                
                await apiRequest("POST", "/api/chat/messages", {
                  requestId: selectedConversation.requestId,
                  senderId: user.id,
                  receiverId: primaryReceiver,
                  messageType: 'voice',
                  fileUrl,
                  senderType: "admin",
                });
                
                // Send duplicate to transporter if different from primary
                if (selectedConversation.transporterId && selectedConversation.transporterId !== primaryReceiver) {
                  await apiRequest("POST", "/api/chat/messages", {
                    requestId: selectedConversation.requestId,
                    senderId: user.id,
                    receiverId: selectedConversation.transporterId,
                    messageType: 'voice',
                    fileUrl,
                    senderType: "admin",
                  });
                }

                toast({
                  title: "Message vocal envoyé",
                  description: "Votre message vocal a été envoyé avec succès",
                });

                queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", selectedConversation.requestId] });
              } catch (error) {
                console.error('Voice message error:', error);
                toast({
                  variant: 'destructive',
                  title: 'Erreur',
                  description: "Échec de l'envoi du message vocal",
                });
              }
            };

            const getMessageBubbleStyle = (message: any) => {
              if (message.senderType === "admin") {
                return "bg-orange-500/20 border-orange-500/40 ml-4 mr-4";
              } else if (message.senderId === selectedConversation.clientId) {
                return "bg-blue-500/20 border-blue-500/40 ml-0 mr-auto";
              } else {
                return "bg-green-500/20 border-green-500/40 ml-auto mr-0";
              }
            };

            const getSenderLabel = (message: any) => {
              if (message.senderType === "admin") {
                return "Admin CamionBack";
              } else if (message.senderType === "client") {
                return `Client ${selectedConversation.clientId || 'Non défini'}`;
              } else if (message.senderType === "transporter") {
                return selectedConversation.transporterName || "Transporteur";
              } else {
                // Fallback: determine by sender ID
                if (message.senderId === selectedConversation.clientId) {
                  return `Client ${selectedConversation.clientId || 'Non défini'}`;
                } else if (message.senderId === selectedConversation.transporterId) {
                  return selectedConversation.transporterName || "Transporteur";
                } else {
                  return "Expéditeur inconnu";
                }
              }
            };

            return (
              <div className="flex flex-col gap-4 flex-1">
                {/* Messages list */}
                <div className="flex-1 overflow-y-auto max-h-[50vh] space-y-3 p-4 border rounded-lg">
                  {conversationMessages.length === 0 ? (
                    <p className="text-center text-muted-foreground">Aucun message</p>
                  ) : (
                    conversationMessages.map((message: any) => {
                      const isVoiceMessage = message.messageType === 'voice';
                      
                      return (
                        <div
                          key={message.id}
                          className={`p-3 rounded-lg border max-w-[80%] ${getMessageBubbleStyle(message)}`}
                          data-testid={`message-${message.id}`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold" data-testid={`message-sender-${message.id}`}>
                              {getSenderLabel(message)}
                            </span>
                            <span className="text-xs text-muted-foreground" data-testid={`message-time-${message.id}`}>
                              {new Date(message.createdAt).toLocaleString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          {isVoiceMessage && message.fileUrl ? (
                            <VoiceMessagePlayer audioUrl={message.fileUrl} />
                          ) : (
                            <p className="text-sm" data-testid={`message-text-${message.id}`}>{message.message}</p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Admin message input */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Envoyer un message en tant qu'Admin CamionBack..."
                    value={adminMessage}
                    onChange={(e) => setAdminMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendAdminMessage();
                      }
                    }}
                    className="flex-1"
                    data-testid="textarea-admin-message"
                  />
                  <VoiceRecorder 
                    onVoiceRecorded={handleVoiceRecorded}
                    disabled={false}
                  />
                  <Button
                    onClick={sendAdminMessage}
                    disabled={!adminMessage.trim()}
                    data-testid="button-send-admin-message"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Delete Conversation Confirmation */}
      <AlertDialog open={!!deleteConversationId} onOpenChange={(open) => !open && setDeleteConversationId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la conversation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Souhaitez-vous vraiment supprimer cette conversation ? Cette action est irréversible et supprimera tous les messages liés à cette commande.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteConversationId) return;
                
                try {
                  await apiRequest("DELETE", `/api/chat/conversation/${deleteConversationId}`, {});
                  
                  toast({
                    title: "Conversation supprimée",
                    description: "La conversation a été supprimée avec succès",
                  });
                  
                  setDeleteConversationId(null);
                  queryClient.invalidateQueries({ queryKey: ["/api/admin/conversations"] });
                } catch (error) {
                  toast({
                    variant: "destructive",
                    title: "Erreur",
                    description: "Échec de la suppression de la conversation",
                  });
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invoice Details Dialog */}
      <Dialog open={invoiceDetailsOpen} onOpenChange={setInvoiceDetailsOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la facture</DialogTitle>
            <DialogDescription>
              Informations complètes sur le paiement validé
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (() => {
            const client = allUsers.find((u: any) => u.id === selectedInvoice.clientId);
            const acceptedOffer = selectedInvoice.acceptedOfferId 
              ? allOffers.find((o: any) => o.id === selectedInvoice.acceptedOfferId)
              : null;
            const transporter = acceptedOffer 
              ? allUsers.find((u: any) => u.id === acceptedOffer.transporterId)
              : null;

            // Use manual pricing values if available (qualified requests), otherwise calculate for legacy
            const netAmount = selectedInvoice.transporterAmount 
              ? parseFloat(selectedInvoice.transporterAmount)
              : (acceptedOffer ? parseFloat(acceptedOffer.amount) : 0);
            
            const commissionAmount = selectedInvoice.platformFee 
              ? parseFloat(selectedInvoice.platformFee)
              : (acceptedOffer ? netAmount * (parseFloat(adminSettings?.commissionPercentage || "10") / 100) : 0);
            
            const totalClientAmount = selectedInvoice.clientTotal 
              ? parseFloat(selectedInvoice.clientTotal)
              : (netAmount + commissionAmount); // For legacy requests, calculate total

            return (
              <div className="mt-4 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <h3 className="text-lg font-semibold">Facture {selectedInvoice.referenceId}</h3>
                    <p className="text-sm text-muted-foreground">
                      Payé le {selectedInvoice.updatedAt 
                        ? new Date(selectedInvoice.updatedAt).toLocaleDateString("fr-FR")
                        : "N/A"}
                    </p>
                  </div>
                  <Badge className="bg-green-600">Payé</Badge>
                </div>

                {/* Parties */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-muted-foreground">Client</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium">Client {client?.clientId || "Non défini"}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-muted-foreground">Transporteur</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium">{transporter?.name || "Inconnu"}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Phone className="w-3 h-3" />
                        <a href={`tel:${transporter?.phoneNumber}`} className="hover:underline">
                          {transporter?.phoneNumber}
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Financial Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Détails financiers</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="text-muted-foreground">Montant transporteur</span>
                      <span className="font-semibold">{netAmount.toFixed(2)} MAD</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="text-muted-foreground">Commission CamionBack</span>
                      <span className="font-semibold text-green-600">{commissionAmount.toFixed(2)} MAD</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-semibold text-lg">Total payé par le client</span>
                      <span className="font-bold text-xl text-primary">{totalClientAmount.toFixed(2)} MAD</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Transport Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Détails du transport</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">De</p>
                        <p className="font-medium">{selectedInvoice.fromCity}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Vers</p>
                        <p className="font-medium">{selectedInvoice.toCity}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date souhaitée</p>
                        <p className="font-medium">
                          {new Date(selectedInvoice.desiredDate).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      {acceptedOffer && (
                        <div>
                          <p className="text-sm text-muted-foreground">Date de prise en charge</p>
                          <p className="font-medium">
                            {new Date(acceptedOffer.pickupDate).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      )}
                    </div>
                    {selectedInvoice.description && (
                      <div>
                        <p className="text-sm text-muted-foreground">Description</p>
                        <p className="text-sm mt-1">{selectedInvoice.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Receipt */}
                {selectedInvoice.paymentReceipt && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Reçu de paiement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <img
                        src={selectedInvoice.paymentReceipt}
                        alt="Reçu de paiement"
                        className="w-full h-auto max-h-[400px] object-contain rounded-lg border"
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {selectedRibTransporter && (
        <TransporterRibDialog
          open={!!selectedRibTransporter}
          onOpenChange={(open) => !open && setSelectedRibTransporter(null)}
          transporterId={selectedRibTransporter.id}
          transporterName={selectedRibTransporter.name}
        />
      )}

      {/* Delete Offer Confirmation Dialog */}
      <AlertDialog open={!!deleteOfferId} onOpenChange={(open) => !open && setDeleteOfferId(null)}>
        <AlertDialogContent data-testid="dialog-delete-offer">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette offre ?</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer cette offre ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-offer">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteOfferId && deleteOfferMutation.mutate(deleteOfferId)}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete-offer"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Offer Dialog */}
      <Dialog open={!!editingOffer} onOpenChange={(open) => !open && setEditingOffer(null)}>
        <DialogContent data-testid="dialog-edit-offer">
          <DialogHeader>
            <DialogTitle>Modifier l'offre</DialogTitle>
            <DialogDescription>
              Modifiez le prix, la date ou le type de chargement de l'offre.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="edit-amount" className="text-sm font-medium">
                Prix proposé (MAD)
              </label>
              <Input
                id="edit-amount"
                type="number"
                value={editOfferAmount}
                onChange={(e) => setEditOfferAmount(e.target.value)}
                placeholder="Montant"
                data-testid="input-edit-offer-amount"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-date" className="text-sm font-medium">
                Date de prise en charge
              </label>
              <Input
                id="edit-date"
                type="date"
                value={editOfferDate}
                onChange={(e) => setEditOfferDate(e.target.value)}
                data-testid="input-edit-offer-date"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-load-type" className="text-sm font-medium">
                Type de chargement
              </label>
              <Select
                value={editOfferLoadType}
                onValueChange={setEditOfferLoadType}
              >
                <SelectTrigger data-testid="select-edit-offer-load-type">
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="return">Retour</SelectItem>
                  <SelectItem value="shared">Groupage / Partagé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingOffer(null)}
              data-testid="button-cancel-edit-offer"
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (editingOffer) {
                  editOfferMutation.mutate({
                    offerId: editingOffer.id,
                    updates: {
                      amount: parseFloat(editOfferAmount),
                      pickupDate: editOfferDate,
                      loadType: editOfferLoadType,
                    },
                  });
                }
              }}
              data-testid="button-confirm-edit-offer"
            >
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Truck Photo Enlargement Dialog */}
      <Dialog open={showTruckPhotoDialog} onOpenChange={setShowTruckPhotoDialog}>
        <DialogContent className="max-w-4xl" data-testid="dialog-enlarged-truck-photo">
          <DialogHeader>
            <DialogTitle>Photo du camion</DialogTitle>
            <DialogDescription>
              Vérification visuelle de la photo du véhicule
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            <img 
              src={enlargedTruckPhoto} 
              alt="Camion agrandi" 
              className="max-w-full max-h-[600px] object-contain rounded-lg"
              data-testid="img-enlarged-truck"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* REMOVED: Reject Reference Dialog - reference system no longer used */}

      {/* Edit Transporter Dialog */}
      <Dialog open={editTransporterDialogOpen} onOpenChange={setEditTransporterDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-transporter">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5" />
              Modifier le profil du transporteur
            </DialogTitle>
            <DialogDescription>
              Modifiez les informations du transporteur. Tous les champs sont facultatifs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Nom */}
            <div className="space-y-2">
              <label htmlFor="edit-transporter-name" className="text-sm font-medium">
                Nom complet
              </label>
              <Input
                id="edit-transporter-name"
                value={editTransporterName}
                onChange={(e) => setEditTransporterName(e.target.value)}
                placeholder="Ex: Ahmed Benani"
                data-testid="input-edit-transporter-name"
              />
            </div>

            {/* Ville */}
            <div className="space-y-2">
              <label htmlFor="edit-transporter-city" className="text-sm font-medium">
                Ville
              </label>
              <Input
                id="edit-transporter-city"
                value={editTransporterCity}
                onChange={(e) => setEditTransporterCity(e.target.value)}
                placeholder="Ex: Casablanca"
                data-testid="input-edit-transporter-city"
              />
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <label htmlFor="edit-transporter-phone" className="text-sm font-medium">
                Numéro de téléphone
              </label>
              <Input
                id="edit-transporter-phone"
                value={editTransporterPhone}
                onChange={(e) => setEditTransporterPhone(e.target.value)}
                placeholder="Ex: +212612345678"
                data-testid="input-edit-transporter-phone"
              />
            </div>

            {/* Code d'accès (nouveau mot de passe) */}
            <div className="space-y-2">
              <label htmlFor="edit-transporter-password" className="text-sm font-medium">
                Code d'accès (nouveau mot de passe)
              </label>
              <Input
                id="edit-transporter-password"
                type="text"
                value={editTransporterNewPassword}
                onChange={(e) => setEditTransporterNewPassword(e.target.value)}
                placeholder="Ex: 040189 (laissez vide pour ne pas changer)"
                data-testid="input-edit-transporter-password"
              />
              <p className="text-xs text-muted-foreground">
                Saisissez un nouveau code à 6 chiffres pour remplacer le mot de passe actuel
              </p>
            </div>

            {/* Photo du camion */}
            <div className="space-y-2">
              <label htmlFor="edit-transporter-photo" className="text-sm font-medium">
                📷 Photo du camion (modifier)
              </label>
              {editingTransporter?.truckPhoto && !editTransporterPhoto && (
                <div className="mb-2">
                  <img 
                    src={editingTransporter.truckPhoto} 
                    alt="Photo actuelle" 
                    className="w-32 h-32 object-cover rounded border"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Photo actuelle</p>
                </div>
              )}
              <Input
                id="edit-transporter-photo"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setEditTransporterPhoto(file);
                  }
                }}
                data-testid="input-edit-transporter-photo"
              />
              {editTransporterPhoto && (
                <p className="text-sm text-green-600">
                  ✅ Nouvelle photo sélectionnée: {editTransporterPhoto.name}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Formats acceptés: JPG, PNG. Taille max: 5MB
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setEditTransporterDialogOpen(false);
                setEditingTransporter(null);
                setEditTransporterName("");
                setEditTransporterCity("");
                setEditTransporterPhone("");
                setEditTransporterNewPassword("");
                setEditTransporterPhoto(null);
              }}
              data-testid="button-cancel-edit-transporter"
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (editingTransporter) {
                  handleUpdateTransporter();
                }
              }}
              data-testid="button-confirm-edit-transporter"
            >
              Enregistrer les modifications
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de gestion de coordination (Admin) */}
      <Dialog open={coordinationDialogOpen} onOpenChange={setCoordinationDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestion de la coordination</DialogTitle>
            <DialogDescription>
              Commande {selectedRequestForCoordination?.referenceId}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Info: Date de dernière mise à jour */}
            {selectedRequestForCoordination?.coordinationUpdatedAt && (
              <div className="bg-muted p-3 rounded-md text-sm">
                <div className="font-medium mb-1">Dernière mise à jour</div>
                <div className="text-muted-foreground">
                  {(() => {
                    try {
                      return format(new Date(selectedRequestForCoordination.coordinationUpdatedAt), "dd MMMM yyyy 'à' HH:mm", { locale: fr });
                    } catch {
                      return "Date invalide";
                    }
                  })()}
                </div>
              </div>
            )}

            {/* Select: Statut de coordination */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Statut de coordination</label>
              <Select
                value={adminCoordinationStatus || "nouveau"}
                onValueChange={setAdminCoordinationStatus}
              >
                <SelectTrigger data-testid="select-admin-coordination-status">
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nouveau">Nouveau</SelectItem>
                  {Array.isArray(coordinationStatuses) && coordinationStatuses
                    .filter((s: any) => s.isActive)
                    .map((status: any) => (
                      <SelectItem key={status.id} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select: Assigné à */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Assigné à</label>
              <Select
                value={adminCoordinationAssignedTo || "none"}
                onValueChange={setAdminCoordinationAssignedTo}
              >
                <SelectTrigger data-testid="select-admin-assigned-to">
                  <SelectValue placeholder="Sélectionner un coordinateur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non assigné</SelectItem>
                  {Array.isArray(coordinators) && coordinators.map((coordinator: any) => (
                    <SelectItem key={coordinator.id} value={coordinator.id}>
                      {coordinator?.name || `Coordinateur ${coordinator.id.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Textarea: Raison */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Raison (optionnel)</label>
              <Textarea
                value={adminCoordinationReason}
                onChange={(e) => setAdminCoordinationReason(e.target.value)}
                placeholder="Précisez la raison du statut..."
                rows={3}
                data-testid="textarea-admin-coordination-reason"
              />
            </div>

            {/* Input: Date de rappel (conditionnel) */}
            {adminCoordinationStatus === "rappel_prevu" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Date de rappel</label>
                <Input
                  type="datetime-local"
                  value={adminCoordinationReminderDate}
                  onChange={(e) => setAdminCoordinationReminderDate(e.target.value)}
                  data-testid="input-admin-reminder-date"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setCoordinationDialogOpen(false);
                setSelectedRequestForCoordination(null);
              }}
              data-testid="button-cancel-coordination"
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (!selectedRequestForCoordination) return;
                
                updateCoordinationMutation.mutate({
                  requestId: selectedRequestForCoordination.id,
                  coordinationStatus: adminCoordinationStatus,
                  coordinationReason: adminCoordinationReason || null,
                  coordinationReminderDate: adminCoordinationReminderDate || null,
                  assignedToId: adminCoordinationAssignedTo === "none" ? null : adminCoordinationAssignedTo,
                });
              }}
              disabled={updateCoordinationMutation.isPending}
              data-testid="button-save-coordination"
            >
              {updateCoordinationMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog pour visualiser la photo du camion */}
      <Dialog open={viewPhotoDialogOpen} onOpenChange={setViewPhotoDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Photo du camion</DialogTitle>
            <DialogDescription>
              {transporterPhoto?.name || "Transporteur"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {photoLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <LoadingTruck message="Chargement de la photo..." size="sm" />
              </div>
            ) : !transporterPhoto?.hasTruckPhoto || !transporterPhoto?.truckPhoto ? (
              <div className="flex flex-col items-center justify-center py-12">
                <TruckIcon className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground font-medium">Aucune photo disponible</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Ce transporteur n'a pas encore ajouté de photo de camion
                </p>
              </div>
            ) : (
              <div className="relative rounded-lg overflow-hidden bg-muted">
                <img
                  src={transporterPhoto.truckPhoto}
                  alt={`Camion de ${transporterPhoto.name}`}
                  className="w-full h-auto max-h-[600px] object-contain"
                  data-testid="img-transporter-photo-full"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setViewPhotoDialogOpen(false);
                setViewPhotoTransporterId(null);
              }}
              data-testid="button-close-photo-dialog"
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  );
}
