import { useState } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Package, DollarSign, TrendingUp, Plus, Search, CheckCircle, XCircle, UserCheck } from "lucide-react";
import { Header } from "@/components/layout/header";
import { KpiCard } from "@/components/admin/kpi-card";
import { AddTransporterForm } from "@/components/admin/add-transporter-form";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [addTransporterOpen, setAddTransporterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [commissionRate, setCommissionRate] = useState("10");
  const { toast } = useToast();

  const user = JSON.parse(localStorage.getItem("camionback_user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("camionback_user");
    setLocation("/");
  };

  // Fetch pending drivers
  const { data: pendingDrivers = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["/api/admin/pending-drivers"],
    queryFn: async () => {
      const response = await fetch("/api/admin/pending-drivers");
      return response.json();
    },
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

  const handleValidatePayment = (offerId: string) => {
    console.log("Validating payment for offer:", offerId);
  };

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
          <TabsList className="grid w-full max-w-3xl grid-cols-5">
            <TabsTrigger value="requests" data-testid="tab-requests">Demandes</TabsTrigger>
            <TabsTrigger value="validation" data-testid="tab-validation">
              Validation
              {pendingDrivers.length > 0 && (
                <Badge variant="destructive" className="ml-2 px-1.5 py-0 h-5 min-w-5 text-xs">
                  {pendingDrivers.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="drivers" data-testid="tab-drivers">Transporteurs</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">Paramètres</TabsTrigger>
            <TabsTrigger value="stats" data-testid="tab-stats">Statistiques</TabsTrigger>
          </TabsList>

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
                          <TableCell>{driver.phone}</TableCell>
                          <TableCell>{driver.city}</TableCell>
                          <TableCell>
                            {driver.truckPhoto ? (
                              <img 
                                src={driver.truckPhoto} 
                                alt="Camion" 
                                className="w-16 h-16 object-cover rounded"
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
        </Tabs>
      </div>

      <AddTransporterForm
        open={addTransporterOpen}
        onClose={() => setAddTransporterOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
