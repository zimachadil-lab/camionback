import { useState } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Package, DollarSign, TrendingUp, Plus, Search, CheckCircle, XCircle, UserCheck, CreditCard, Phone, Eye, TruckIcon } from "lucide-react";
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
  const { toast } = useToast();

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

  // Mock KPI data
  const kpis = {
    activeClients: 124,
    activeDrivers: 87,
    totalRequests: 456,
    completedRequests: 342,
    totalCommissions: "45,680",
    conversionRate: "75%",
  };

  // Mock requests with offers
  const mockRequests = [
    {
      id: "1",
      referenceId: "CMD-2025-00145",
      clientName: "Mohammed Ali",
      fromCity: "Casablanca",
      toCity: "Marrakech",
      status: "open",
      offers: [
        { id: "o1", transporterName: "Ahmed Transport", amount: "800", accepted: false },
        { id: "o2", transporterName: "Youssef Logistics", amount: "750", accepted: false },
      ]
    },
    {
      id: "2",
      referenceId: "CMD-2025-00146",
      clientName: "Fatima Zahra",
      fromCity: "Rabat",
      toCity: "Fès",
      status: "accepted",
      offers: [
        { id: "o3", transporterName: "Hassan Transport", amount: "600", accepted: true },
      ]
    }
  ];

  // Mock top drivers
  const topDrivers = [
    { id: "1", name: "Ahmed Transport", rating: 4.8, trips: 156, commissions: "15,400 MAD" },
    { id: "2", name: "Youssef Logistics", rating: 4.7, trips: 143, commissions: "14,200 MAD" },
    { id: "3", name: "Hassan Transport", rating: 4.6, trips: 128, commissions: "12,800 MAD" },
  ];

  const handleRejectOffer = (offerId: string) => {
    console.log("Rejecting offer:", offerId);
  };

  const handleUpdateCommission = () => {
    console.log("Updating commission to:", commissionRate);
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
            value={kpis.activeClients}
            icon={Users}
            trend="+12% ce mois"
            trendUp={true}
          />
          <KpiCard
            title="Transporteurs actifs"
            value={kpis.activeDrivers}
            icon={Users}
            trend="+8% ce mois"
            trendUp={true}
          />
          <KpiCard
            title="Demandes totales"
            value={kpis.totalRequests}
            icon={Package}
          />
          <KpiCard
            title="Commissions totales"
            value={`${kpis.totalCommissions} MAD`}
            icon={DollarSign}
            trend="+15% ce mois"
            trendUp={true}
          />
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full max-w-5xl grid-cols-9 text-xs sm:text-sm">
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
            <TabsTrigger value="drivers" data-testid="tab-drivers">Transporteurs</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">Paramètres</TabsTrigger>
            <TabsTrigger value="stats" data-testid="tab-stats">Statistiques</TabsTrigger>
          </TabsList>

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
                          ? parseFloat(acceptedOffer.amount).toFixed(2)
                          : "N/A";

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
                              <span className="font-semibold">{netAmount} MAD</span>
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

          <TabsContent value="requests" className="mt-6 space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par ID ou client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-admin"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Toutes les demandes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mockRequests.map((request) => (
                    <div key={request.id} className="border-b pb-6 last:border-0">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <Badge variant="outline" className="mb-2">
                            {request.referenceId}
                          </Badge>
                          <p className="font-semibold">{request.clientName}</p>
                          <p className="text-sm text-muted-foreground">
                            {request.fromCity} → {request.toCity}
                          </p>
                        </div>
                        <Badge variant={request.status === "open" ? "default" : "secondary"}>
                          {request.status === "open" ? "Ouverte" : "Acceptée"}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          Offres reçues ({request.offers.length})
                        </p>
                        {request.offers.map((offer) => (
                          <div
                            key={offer.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted"
                          >
                            <div>
                              <p className="font-medium">{offer.transporterName}</p>
                              <p className="text-lg font-bold text-primary">
                                {offer.amount} MAD
                              </p>
                            </div>
                            {offer.accepted ? (
                              <Badge className="bg-green-600">Acceptée</Badge>
                            ) : (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleValidatePayment(offer.id)}
                                  data-testid={`button-validate-${offer.id}`}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Valider
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRejectOffer(offer.id)}
                                  data-testid={`button-reject-${offer.id}`}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Rejeter
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drivers" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Meilleurs transporteurs</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Trajets</TableHead>
                      <TableHead>Commissions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topDrivers.map((driver) => (
                      <TableRow key={driver.id}>
                        <TableCell className="font-medium">{driver.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4 text-yellow-400" />
                            {driver.rating}
                          </div>
                        </TableCell>
                        <TableCell>{driver.trips}</TableCell>
                        <TableCell className="text-primary font-semibold">
                          {driver.commissions}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de commission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Pourcentage de commission (%)
                  </label>
                  <div className="flex gap-4">
                    <Input
                      type="number"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(e.target.value)}
                      className="max-w-32"
                      data-testid="input-commission-rate"
                    />
                    <Button 
                      onClick={handleUpdateCommission}
                      data-testid="button-update-commission"
                    >
                      Mettre à jour
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Commission actuelle: {commissionRate}% du montant total
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Taux de conversion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary mb-2">
                    {kpis.conversionRate}
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
                    {kpis.completedRequests}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Sur {kpis.totalRequests} demandes totales
                  </p>
                </CardContent>
              </Card>
            </div>
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
          <div className="mt-4">
            {allRequests.filter((req: any) => req.status === "open").length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucune commande ouverte disponible</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allRequests
                  .filter((req: any) => req.status === "open")
                  .map((request: any) => {
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
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
