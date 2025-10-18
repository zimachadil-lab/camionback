import { useState } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Package, DollarSign, TrendingUp, Plus, Search, CheckCircle, XCircle, UserCheck, CreditCard, Phone, Eye, TruckIcon, MapPin, Calendar, FileText, MessageSquare, Trash2, Send, Flag } from "lucide-react";
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

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [addTransporterOpen, setAddTransporterOpen] = useState(false);
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
  const { toast} = useToast();

  const user = JSON.parse(localStorage.getItem("camionback_user") || "{}");

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
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
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
  const { data: transportersWithStats = [] } = useQuery({
    queryKey: ["/api/admin/transporters"],
    queryFn: async () => {
      const response = await fetch("/api/admin/transporters");
      return response.json();
    },
  });

  // Fetch clients with stats
  const { data: clientsWithStats = [] } = useQuery({
    queryKey: ["/api/admin/clients"],
    queryFn: async () => {
      const response = await fetch("/api/admin/clients");
      return response.json();
    },
  });

  // Fetch all reports
  const { data: allReports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/reports"],
    queryFn: async () => {
      const response = await fetch("/api/reports");
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
          <Button 
            onClick={() => setAddTransporterOpen(true)}
            data-testid="button-add-transporter"
          >
            <Plus className="mr-2 h-5 w-5" />
            Ajouter transporteur
          </Button>
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
              <TabsList className="grid w-full grid-cols-7 text-xs sm:text-sm">
                <TabsTrigger value="requests" data-testid="tab-requests">Demandes</TabsTrigger>
                <TabsTrigger value="offers" data-testid="tab-offers">
                  Offres
                  {allOffers.length > 0 && (
                    <Badge className="ml-2 px-1.5 py-0 h-5 min-w-5 text-xs">
                      {allOffers.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="contracts" data-testid="tab-contracts">
                  Contrats
                  {contracts.length > 0 && (
                    <Badge className="ml-2 px-1.5 py-0 h-5 min-w-5 text-xs">
                      {contracts.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="messages" data-testid="tab-messages">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Messages
                  {conversations.length > 0 && (
                    <Badge className="ml-2 px-1.5 py-0 h-5 min-w-5 text-xs" data-testid="badge-messages-count">
                      {conversations.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="to-pay" data-testid="tab-to-pay">
                  À payer
                  {pendingPayments.length > 0 && (
                    <Badge variant="destructive" className="ml-2 px-1.5 py-0 h-5 min-w-5 text-xs">
                      {pendingPayments.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="validation" data-testid="tab-validation">
                  Validation
                  {pendingDrivers.length > 0 && (
                    <Badge variant="destructive" className="ml-2 px-1.5 py-0 h-5 min-w-5 text-xs">
                      {pendingDrivers.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="empty-returns" data-testid="tab-empty-returns">
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
              <TabsList className="grid w-full grid-cols-6 text-xs sm:text-sm">
                <TabsTrigger value="drivers" data-testid="tab-drivers">Transporteurs</TabsTrigger>
                <TabsTrigger value="clients" data-testid="tab-clients">Clients</TabsTrigger>
                <TabsTrigger value="reports" data-testid="tab-reports">
                  <Flag className="w-4 h-4 mr-1" />
                  Signalements
                  {allReports.filter((r: any) => r.status === "pending").length > 0 && (
                    <Badge variant="destructive" className="ml-2 px-1.5 py-0 h-5 min-w-5 text-xs">
                      {allReports.filter((r: any) => r.status === "pending").length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="facturation" data-testid="tab-facturation">Facturation</TabsTrigger>
                <TabsTrigger value="stats" data-testid="tab-stats">Statistiques</TabsTrigger>
                <TabsTrigger value="settings" data-testid="tab-settings">Paramètres</TabsTrigger>
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
                {allRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucune demande pour le moment</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Référence</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>De → Vers</TableHead>
                          <TableHead>Date souhaitée</TableHead>
                          <TableHead>Prix estimé</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allRequests.map((request: any) => {
                          const client = users.find((u: any) => u.id === request.clientId);
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
                              <TableCell>{formatDate(request.createdAt)}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{client?.name || "Inconnu"}</p>
                                  <a 
                                    href={`tel:${client?.phoneNumber}`}
                                    className="text-xs text-primary hover:underline"
                                  >
                                    {client?.phoneNumber}
                                  </a>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {request.fromCity} → {request.toCity}
                                </div>
                              </TableCell>
                              <TableCell>{formatDate(request.desiredDate)}</TableCell>
                              <TableCell className="font-semibold text-primary">
                                {request.estimatedPrice?.toLocaleString("fr-MA")} MAD
                              </TableCell>
                              <TableCell>{getStatusBadge(request.status)}</TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  data-testid={`button-view-request-${request.id}`}
                                >
                                  <Eye className="h-4 w-4" />
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
                          const client = users.find((u: any) => u.id === request?.clientId);
                          const transporter = users.find((u: any) => u.id === offer.transporterId);
                          
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
                                {client?.phoneNumber || "N/A"}
                              </TableCell>
                              <TableCell data-testid={`text-transporter-${offer.id}`}>
                                {transporter?.phoneNumber || "N/A"}
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
                                {offer.status === "pending" && (
                                  <Button
                                    size="sm"
                                    className="bg-[#00cc88] hover:bg-[#00b377]"
                                    onClick={() => handleAcceptOfferAsAdmin(offer.id, request?.id)}
                                    data-testid={`button-accept-offer-${offer.id}`}
                                  >
                                    Accepter l'offre
                                  </Button>
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
                          const client = users.find((u: any) => u.id === contract.clientId);
                          const transporter = users.find((u: any) => u.id === contract.transporterId);
                          
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
                                <div className="flex flex-col">
                                  <span>{client?.name || "N/A"}</span>
                                  <span className="text-xs text-muted-foreground">{client?.phoneNumber || ""}</span>
                                </div>
                              </TableCell>
                              <TableCell data-testid={`text-contract-transporter-${contract.id}`}>
                                <div className="flex flex-col">
                                  <span>{transporter?.name || "N/A"}</span>
                                  <span className="text-xs text-muted-foreground">{transporter?.phoneNumber || ""}</span>
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
                                {conv.clientName || "N/A"}
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Chargement...</p>
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
                                className="w-16 h-16 object-cover rounded"
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
                        const client = users.find((u: any) => u.id === request.clientId);
                        
                        // Get accepted offer details
                        const acceptedOffer = request.acceptedOfferId 
                          ? allOffers.find((o: any) => o.id === request.acceptedOfferId)
                          : null;
                        
                        // Get transporter from accepted offer
                        const transporter = acceptedOffer 
                          ? users.find((u: any) => u.id === acceptedOffer.transporterId)
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
                              <div>
                                <p className="font-medium">{client?.name || "Client inconnu"}</p>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Phone className="w-3 h-3" />
                                  <a href={`tel:${client?.phoneNumber}`} className="hover:underline">
                                    {client?.phoneNumber || "N/A"}
                                  </a>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{transporter?.name || "Transporteur"}</p>
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

                {transportersWithStats.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun transporteur validé</p>
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
                              <TableHead>Photo camion</TableHead>
                              <TableHead>Nom</TableHead>
                              <TableHead>Ville</TableHead>
                              <TableHead>Téléphone</TableHead>
                              <TableHead>Note</TableHead>
                              <TableHead>Trajets</TableHead>
                              <TableHead>Commissions</TableHead>
                              <TableHead>Dernière activité</TableHead>
                              <TableHead>Statut</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredTransporters.map((transporter: any) => (
                              <TableRow key={transporter.id}>
                                <TableCell>
                                  {transporter.truckPhoto ? (
                                    <img 
                                      src={transporter.truckPhoto} 
                                      alt="Camion" 
                                      className="w-16 h-16 object-cover rounded"
                                      data-testid={`img-truck-${transporter.id}`}
                                    />
                                  ) : (
                                    <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                                      <TruckIcon className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                  )}
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
                    <p className="text-muted-foreground">Chargement...</p>
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
                          const reporter = users.find((u: any) => u.id === report.reporterId);
                          const reportedUser = users.find((u: any) => u.id === report.reportedUserId);
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
                            const client = users.find((u: any) => u.id === request.clientId);
                            const acceptedOffer = request.acceptedOfferId 
                              ? allOffers.find((o: any) => o.id === request.acceptedOfferId)
                              : null;
                            const transporter = acceptedOffer 
                              ? users.find((u: any) => u.id === acceptedOffer.transporterId)
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
                                  <div>
                                    <p className="font-medium">{client?.name || "Inconnu"}</p>
                                    <a 
                                      href={`tel:${client?.phoneNumber}`}
                                      className="text-xs text-primary hover:underline"
                                    >
                                      {client?.phoneNumber}
                                    </a>
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Chargement...</p>
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
                        const transporter = users.find((u: any) => u.id === emptyReturn.transporterId);
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
                    const client = users.find((u: any) => u.id === request.clientId);
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
                                  {client?.name || "Client inconnu"}
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
            const client = users.find((u: any) => u.id === selectedContract.clientId);
            const transporter = users.find((u: any) => u.id === selectedContract.transporterId);

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
                        <p className="text-sm text-muted-foreground">Nom</p>
                        <p className="font-medium">{client?.name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Téléphone</p>
                        <p className="font-medium flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {client?.phoneNumber || "N/A"}
                        </p>
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

      {/* Conversation View Dialog */}
      <Dialog open={conversationDialogOpen} onOpenChange={setConversationDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Conversation - {selectedConversation?.referenceId}
            </DialogTitle>
            <DialogDescription>
              {selectedConversation?.clientName} ↔ {selectedConversation?.transporterName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedConversation && (() => {
            const { data: messages = [] } = useQuery({
              queryKey: ["/api/chat/messages", selectedConversation.requestId],
              queryFn: async () => {
                const response = await fetch(`/api/chat/messages?requestId=${selectedConversation.requestId}`);
                return response.json();
              },
              enabled: conversationDialogOpen,
            });

            const sendAdminMessage = async () => {
              if (!adminMessage.trim()) return;
              
              try {
                await apiRequest("POST", "/api/chat/messages", {
                  requestId: selectedConversation.requestId,
                  senderId: user.id,
                  receiverId: selectedConversation.clientId,
                  message: adminMessage,
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
                return selectedConversation.clientName;
              } else {
                return selectedConversation.transporterName;
              }
            };

            return (
              <div className="flex flex-col gap-4 flex-1">
                {/* Messages list */}
                <div className="flex-1 overflow-y-auto max-h-[50vh] space-y-3 p-4 border rounded-lg">
                  {messages.length === 0 ? (
                    <p className="text-center text-muted-foreground">Aucun message</p>
                  ) : (
                    messages.map((message: any) => (
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
                        <p className="text-sm" data-testid={`message-text-${message.id}`}>{message.message}</p>
                      </div>
                    ))
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
            const client = users.find((u: any) => u.id === selectedInvoice.clientId);
            const acceptedOffer = selectedInvoice.acceptedOfferId 
              ? allOffers.find((o: any) => o.id === selectedInvoice.acceptedOfferId)
              : null;
            const transporter = acceptedOffer 
              ? users.find((u: any) => u.id === acceptedOffer.transporterId)
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
                      <p className="font-medium">{client?.name || "Inconnu"}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Phone className="w-3 h-3" />
                        <a href={`tel:${client?.phoneNumber}`} className="hover:underline">
                          {client?.phoneNumber}
                        </a>
                      </div>
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
    </div>
  );
}
