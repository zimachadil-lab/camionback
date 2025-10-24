import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, Package, DollarSign, TrendingUp, Plus, Search, CheckCircle, XCircle, UserCheck, CreditCard, Phone, Eye, EyeOff, TruckIcon, MapPin, Calendar, FileText, MessageSquare, Trash2, Send, Flag, Pencil, Camera, RefreshCw, Circle, Edit, Compass } from "lucide-react";
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

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [addTransporterOpen, setAddTransporterOpen] = useState(false);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [commissionRate, setCommissionRate] = useState("10");
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
  const { toast} = useToast();

  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("camionback_user") || "{}"));

  // Fetch conversation messages (enabled only when conversation dialog is open)
  const { data: conversationMessages = [] } = useQuery({
    queryKey: ["/api/chat/messages", selectedConversation?.requestId],
    queryFn: async () => {
      if (!selectedConversation?.requestId) return [];
      const response = await fetch(`/api/chat/messages?requestId=${selectedConversation.requestId}`);
      return response.json();
    },
    enabled: conversationDialogOpen && !!selectedConversation?.requestId,
  });

  useEffect(() => {
    const refreshUserData = async () => {
      try {
        const response = await fetch(`/api/auth/me/${user.id}`);
        if (response.ok) {
          const { user: updatedUser } = await response.json();
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

  const handleLogout = () => {
    // Clear user session
    localStorage.removeItem("camionback_user");
    // Force page reload to clear all state
    window.location.href = "/";
  };

  // Fetch pending drivers
  const { data: pendingDrivers = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["/api/admin/pending-drivers"],
    queryFn: async () => {
      const response = await fetch("/api/admin/pending-drivers");
      return response.json();
    },
  });

  // Fetch all requests for payment validation
  const { data: allRequests = [] } = useQuery({
    queryKey: ["/api/requests"],
    queryFn: async () => {
      const response = await fetch("/api/requests");
      return response.json();
    },
  });

  // Fetch all users for client/transporter details
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
  });

  // Fetch admin settings for commission calculation
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
      return response.json();
    },
  });

  // Fetch active empty returns
  const { data: emptyReturns = [], isLoading: emptyReturnsLoading } = useQuery({
    queryKey: ["/api/empty-returns"],
    queryFn: async () => {
      const response = await fetch("/api/empty-returns");
      return response.json();
    },
  });

  // Fetch all contracts
  const { data: contracts = [] } = useQuery({
    queryKey: ["/api/contracts"],
    queryFn: async () => {
      const response = await fetch("/api/contracts");
      return response.json();
    },
  });

  // Fetch all conversations (admin)
  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/admin/conversations"],
    queryFn: async () => {
      const response = await fetch("/api/admin/conversations");
      return response.json();
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
      return response.json();
    },
  });

  // Combine clients, transporters and other users for unified lookup
  const allUsers = useMemo(() => {
    return [...clientsWithStats, ...transportersWithStats, ...users];
  }, [clientsWithStats, transportersWithStats, users]);

  // Fetch all reports
  const { data: allReports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/reports"],
    queryFn: async () => {
      const response = await fetch("/api/reports");
      return response.json();
    },
  });

  // Fetch all cities
  const { data: cities = [], isLoading: citiesLoading } = useQuery({
    queryKey: ["/api/cities"],
    queryFn: async () => {
      const response = await fetch("/api/cities");
      return response.json();
    },
  });

  // Fetch all stories
  const { data: allStories = [], isLoading: storiesLoading } = useQuery({
    queryKey: ["/api/stories"],
    queryFn: async () => {
      const response = await fetch(`/api/stories?adminId=${user.id}`);
      return response.json();
    },
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
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/client-statistics"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer le compte",
      });
    },
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
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
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

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={user}
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

        <Tabs defaultValue="requests" className="w-full">
          <div className="space-y-2">
            {/* Barre de navigation principale - Opérations */}
            <div className="bg-muted/30 p-2 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2 px-2 font-medium">Opérations</p>
              <TabsList className="flex lg:grid w-full lg:grid-cols-7 overflow-x-auto text-xs sm:text-sm">
                <TabsTrigger value="requests" data-testid="tab-requests" className="flex-shrink-0">Demandes</TabsTrigger>
                <TabsTrigger value="offers" data-testid="tab-offers" className="flex-shrink-0">
                  Offres
                  {allOffers.length > 0 && (
                    <Badge className="ml-2 px-1.5 py-0 h-5 min-w-5 text-xs">
                      {allOffers.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="contracts" data-testid="tab-contracts" className="flex-shrink-0">
                  Contrats
                  {contracts.length > 0 && (
                    <Badge className="ml-2 px-1.5 py-0 h-5 min-w-5 text-xs">
                      {contracts.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="messages" data-testid="tab-messages" className="flex-shrink-0">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Messages
                  {conversations.length > 0 && (
                    <Badge className="ml-2 px-1.5 py-0 h-5 min-w-5 text-xs" data-testid="badge-messages-count">
                      {conversations.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="to-pay" data-testid="tab-to-pay" className="flex-shrink-0">
                  À payer
                  {pendingPayments.length > 0 && (
                    <Badge variant="destructive" className="ml-2 px-1.5 py-0 h-5 min-w-5 text-xs">
                      {pendingPayments.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="validation" data-testid="tab-validation" className="flex-shrink-0">
                  Validation
                  {pendingDrivers.length > 0 && (
                    <Badge variant="destructive" className="ml-2 px-1.5 py-0 h-5 min-w-5 text-xs">
                      {pendingDrivers.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="empty-returns" data-testid="tab-empty-returns" className="flex-shrink-0">
                  <TruckIcon className="w-4 h-4 mr-1" />
                  Retours
                  {emptyReturns.length > 0 && (
                    <Badge className="ml-2 px-1.5 py-0 h-5 min-w-5 text-xs bg-[#00d4b2]">
                      {emptyReturns.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Barre de navigation secondaire - Gestion */}
            <div className="bg-muted/30 p-2 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2 px-2 font-medium">Gestion & Configuration</p>
              <TabsList className="flex lg:grid w-full lg:grid-cols-10 overflow-x-auto text-xs sm:text-sm">
                <TabsTrigger value="drivers" data-testid="tab-drivers" className="flex-shrink-0">Transporteurs</TabsTrigger>
                <TabsTrigger value="clients" data-testid="tab-clients" className="flex-shrink-0">Clients</TabsTrigger>
                <TabsTrigger value="coordinators" data-testid="tab-coordinators" className="flex-shrink-0">
                  <Compass className="w-4 h-4 mr-1" />
                  Coordinateurs
                </TabsTrigger>
                <TabsTrigger value="reports" data-testid="tab-reports" className="flex-shrink-0">
                  <Flag className="w-4 h-4 mr-1" />
                  Signalements
                  {allReports.filter((r: any) => r.status === "pending").length > 0 && (
                    <Badge variant="destructive" className="ml-2 px-1.5 py-0 h-5 min-w-5 text-xs">
                      {allReports.filter((r: any) => r.status === "pending").length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="communications" data-testid="tab-communications" className="flex-shrink-0">
                  <Send className="w-4 h-4 mr-1" />
                  Communications
                </TabsTrigger>
                <TabsTrigger value="facturation" data-testid="tab-facturation" className="flex-shrink-0">Facturation</TabsTrigger>
                <TabsTrigger value="cities" data-testid="tab-cities" className="flex-shrink-0">Villes</TabsTrigger>
                <TabsTrigger value="stories" data-testid="tab-stories" className="flex-shrink-0">Stories</TabsTrigger>
                <TabsTrigger value="stats" data-testid="tab-stats" className="flex-shrink-0">Statistiques</TabsTrigger>
                <TabsTrigger value="settings" data-testid="tab-settings" className="flex-shrink-0">Paramètres</TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="requests" className="mt-6">
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
                                    {usersLoading ? "Chargement..." : (client?.phoneNumber || "Non défini")}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {usersLoading ? "..." : (client?.clientId || "N/A")}
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
          </TabsContent>

          <TabsContent value="offers" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Offres transporteurs
                  <Badge className="ml-2">
                    Total: {allOffers.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allOffers.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucune offre pour le moment</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>N° Commande</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Transporteur</TableHead>
                          <TableHead>Date client</TableHead>
                          <TableHead>Date transporteur</TableHead>
                          <TableHead>Prix initial</TableHead>
                          <TableHead>Prix proposé</TableHead>
                          <TableHead>Type chargement</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allOffers.map((offer: any) => {
                          const request = allRequests.find((r: any) => r.id === offer.requestId);
                          const client = allUsers.find((u: any) => u.id === request?.clientId);
                          const transporter = allUsers.find((u: any) => u.id === offer.transporterId);
                          
                          const formatDate = (dateStr: string) => {
                            if (!dateStr) return "N/A";
                            try {
                              const date = new Date(dateStr);
                              return date.toLocaleDateString("fr-FR");
                            } catch {
                              return "N/A";
                            }
                          };

                          const getLoadTypeLabel = (loadType: string) => {
                            if (loadType === "return") return "Retour";
                            if (loadType === "shared") return "Groupage";
                            return "N/A";
                          };

                          const getStatusBadge = (status: string) => {
                            if (status === "accepted") return <Badge className="bg-green-600">Acceptée</Badge>;
                            if (status === "rejected") return <Badge variant="destructive">Refusée</Badge>;
                            if (status === "completed") return <Badge className="bg-blue-600">Complétée</Badge>;
                            return <Badge variant="secondary">En attente</Badge>;
                          };

                          return (
                            <TableRow key={offer.id}>
                              <TableCell className="font-medium" data-testid={`text-ref-${offer.id}`}>
                                {request?.referenceId || "N/A"}
                              </TableCell>
                              <TableCell data-testid={`text-client-${offer.id}`}>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {usersLoading ? "Chargement..." : (client?.clientId || "Non défini")}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {usersLoading ? "..." : (client?.phoneNumber || "")}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell data-testid={`text-transporter-${offer.id}`}>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {usersLoading ? "Chargement..." : (transporter?.name || "N/A")}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {usersLoading ? "..." : (transporter?.phoneNumber || "")}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell data-testid={`text-client-date-${offer.id}`}>
                                {formatDate(request?.dateTime)}
                              </TableCell>
                              <TableCell data-testid={`text-transporter-date-${offer.id}`}>
                                {formatDate(offer.pickupDate)}
                              </TableCell>
                              <TableCell data-testid={`text-budget-${offer.id}`}>
                                {request?.budget ? `${request.budget} MAD` : "N/A"}
                              </TableCell>
                              <TableCell className="font-semibold" data-testid={`text-amount-${offer.id}`}>
                                {offer.amount} MAD
                              </TableCell>
                              <TableCell data-testid={`text-load-type-${offer.id}`}>
                                {getLoadTypeLabel(offer.loadType)}
                              </TableCell>
                              <TableCell data-testid={`badge-status-${offer.id}`}>
                                {getStatusBadge(offer.status)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {offer.status === "pending" && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          setEditingOffer(offer);
                                          setEditOfferAmount(offer.amount);
                                          setEditOfferDate(offer.pickupDate ? new Date(offer.pickupDate).toISOString().split('T')[0] : "");
                                          setEditOfferLoadType(offer.loadType || "");
                                        }}
                                        data-testid={`button-edit-offer-${offer.id}`}
                                        title="Modifier l'offre"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        className="bg-[#00cc88] hover:bg-[#00b377]"
                                        onClick={() => handleAcceptOfferAsAdmin(offer.id, request?.id)}
                                        data-testid={`button-accept-offer-${offer.id}`}
                                      >
                                        Accepter
                                      </Button>
                                    </>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setDeleteOfferId(offer.id)}
                                    data-testid={`button-delete-offer-${offer.id}`}
                                    title="Supprimer l'offre"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
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
          </TabsContent>

          <TabsContent value="contracts" className="mt-6">
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
                                Client {usersLoading ? "Chargement..." : (client?.clientId || "Non défini")}
                              </TableCell>
                              <TableCell data-testid={`text-contract-transporter-${contract.id}`}>
                                <div className="flex flex-col">
                                  <span>{usersLoading ? "Chargement..." : (transporter?.name || "N/A")}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {usersLoading ? "..." : (transporter?.phoneNumber || "")}
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
          </TabsContent>

          <TabsContent value="messages" className="mt-6">
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
          </TabsContent>

          <TabsContent value="validation" className="mt-6">
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
                            {driver.truckPhotos && driver.truckPhotos.length > 0 ? (
                              <img 
                                src={driver.truckPhotos[0]} 
                                alt="Camion" 
                                className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => {
                                  setEnlargedTruckPhoto(driver.truckPhotos[0]);
                                  setShowTruckPhotoDialog(true);
                                }}
                                data-testid={`img-truck-${driver.id}`}
                              />
                            ) : (
                              <span className="text-muted-foreground text-sm">Aucune photo</span>
                            )}
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
          </TabsContent>

          <TabsContent value="to-pay" className="mt-6">
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

                        // Calculate net amount (base amount that transporter gets, without commission)
                        const netAmount = acceptedOffer 
                          ? parseFloat(acceptedOffer.amount)
                          : 0;

                        // Calculate commission and total
                        const commissionPercentage = adminSettings?.commissionPercentage || 10;
                        const commissionAmount = netAmount * (commissionPercentage / 100);
                        const totalClientAmount = netAmount + commissionAmount;

                        return (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">{request.referenceId}</TableCell>
                            <TableCell>
                              Client {usersLoading ? "Chargement..." : (client?.clientId || "Non défini")}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {usersLoading ? "Chargement..." : (transporter?.name || "Transporteur")}
                                </p>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Phone className="w-3 h-3" />
                                  <a href={`tel:${transporter?.phoneNumber}`} className="hover:underline">
                                    {usersLoading ? "..." : (transporter?.phoneNumber || "N/A")}
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
          </TabsContent>


          <TabsContent value="drivers" className="mt-6">
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
          </TabsContent>

          <TabsContent value="clients" className="mt-6">
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
          </TabsContent>

          <TabsContent value="coordinators" className="mt-6">
            <CoordinatorManagement />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
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
          </TabsContent>

          <TabsContent value="communications" className="mt-6">
            <AdminCommunications />
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
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
            </div>
          </TabsContent>

          <TabsContent value="facturation" className="mt-6">
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

                            const netAmount = acceptedOffer ? parseFloat(acceptedOffer.amount) : 0;
                            const commissionPercentage = adminSettings?.commissionPercentage || 10;
                            const commissionAmount = netAmount * (commissionPercentage / 100);
                            const totalClientAmount = netAmount + commissionAmount;

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
          </TabsContent>

          <TabsContent value="cities" className="mt-6">
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
          </TabsContent>

          <TabsContent value="stories" className="mt-6">
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
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Paramètres de commission
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-2">
                      Pourcentage de commission CamionBack (%)
                    </label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Ce pourcentage est automatiquement ajouté au prix du transporteur pour calculer le montant total que le client doit payer.
                    </p>
                  </div>
                  
                  <div className="flex gap-4 items-end">
                    <div className="flex-1 max-w-xs space-y-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                        data-testid="input-commission-rate"
                      />
                      <p className="text-xs text-muted-foreground">
                        Commission actuelle: {adminSettings?.commissionPercentage || commissionRate}%
                      </p>
                    </div>
                    <Button 
                      onClick={async () => {
                        try {
                          await apiRequest("PATCH", "/api/admin/settings", {
                            commissionPercentage: parseFloat(commissionRate)
                          });
                          toast({
                            title: "Commission mise à jour",
                            description: `Le taux de commission est maintenant de ${commissionRate}%`,
                          });
                          queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
                        } catch (error) {
                          toast({
                            variant: "destructive",
                            title: "Erreur",
                            description: "Échec de la mise à jour de la commission",
                          });
                        }
                      }}
                      data-testid="button-update-commission"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Mettre à jour
                    </Button>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 mt-6">
                    <h4 className="font-medium mb-2">Exemple de calcul</h4>
                    <div className="text-sm space-y-1">
                      <p>Prix transporteur: <strong>1000 MAD</strong></p>
                      <p>Commission ({commissionRate}%): <strong>{(1000 * parseFloat(commissionRate || "0") / 100).toFixed(2)} MAD</strong></p>
                      <p className="pt-2 border-t border-border mt-2">
                        Total client: <strong className="text-primary">{(1000 + (1000 * parseFloat(commissionRate || "0") / 100)).toFixed(2)} MAD</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="empty-returns" className="mt-6">
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
          </TabsContent>
        </Tabs>
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
                      <div className="flex gap-2">
                        {request.dateFlexible && (
                          <Badge variant="outline">Date flexible</Badge>
                        )}
                        {request.invoiceRequired && (
                          <Badge variant="outline">Facture TTC requise</Badge>
                        )}
                      </div>
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
                        <p className="text-sm text-muted-foreground">Date flexible</p>
                        <p className="font-medium">
                          {selectedRequest.dateFlexible ? "Oui" : "Non"}
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
                        <p className="text-sm text-muted-foreground">Facture TTC requise</p>
                        <p className="font-medium">{selectedRequest.invoiceRequired ? "Oui" : "Non"}</p>
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
                await apiRequest("POST", "/api/chat/messages", {
                  requestId: selectedConversation.requestId,
                  senderId: user.id,
                  receiverId: selectedConversation.clientId,
                  message: adminMessage,
                  messageType: "text",
                  senderType: "admin",
                });
                
                toast({
                  title: "Message envoyé",
                  description: "Votre message a été envoyé avec succès",
                });
                
                setAdminMessage("");
                queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", selectedConversation.requestId] });
              } catch (error) {
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

                // Send voice message
                await apiRequest("POST", "/api/chat/messages", {
                  requestId: selectedConversation.requestId,
                  senderId: user.id,
                  receiverId: selectedConversation.clientId,
                  messageType: 'voice',
                  fileUrl,
                  senderType: "admin",
                });

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
              } else if (message.senderId === selectedConversation.clientId) {
                return `Client ${selectedConversation.clientId || 'Non défini'}`;
              } else {
                return selectedConversation.transporterName;
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

            const netAmount = acceptedOffer ? parseFloat(acceptedOffer.amount) : 0;
            const commissionPercentage = adminSettings?.commissionPercentage || 10;
            const commissionAmount = netAmount * (commissionPercentage / 100);
            const totalClientAmount = netAmount + commissionAmount;

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
                      <span className="text-muted-foreground">Commission CamionBack ({commissionPercentage}%)</span>
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
    </div>
  );
}
