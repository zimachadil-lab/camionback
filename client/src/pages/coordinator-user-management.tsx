import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LoadingTruck } from "@/components/ui/loading-truck";
import { Search, UserPlus, Users, Truck, Edit, Camera } from "lucide-react";
import { useLocation } from "wouter";

// Add Client Form Component
function AddClientForm({ onSuccess, cities }: { onSuccess: () => void; cities: any[] }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    city: "",
    photo: null as File | null,
  });

  const addClientMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/admin/clients", {
        method: "POST",
        body: data,
      });
      if (!response.ok) throw new Error("Échec de l'ajout");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Client ajouté",
        description: "Le client a été ajouté avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
      onSuccess();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de l'ajout du client",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("phoneNumber", formData.phoneNumber);
    data.append("city", formData.city);
    if (formData.photo) {
      data.append("photo", formData.photo);
    }
    addClientMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="client-name">Nom complet *</Label>
        <Input
          id="client-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          data-testid="input-client-name"
        />
      </div>
      <div>
        <Label htmlFor="client-phone">Téléphone *</Label>
        <Input
          id="client-phone"
          type="tel"
          placeholder="+212..."
          value={formData.phoneNumber}
          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
          required
          data-testid="input-client-phone"
        />
      </div>
      <div>
        <Label htmlFor="client-city">Ville *</Label>
        <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
          <SelectTrigger id="client-city" data-testid="select-client-city">
            <SelectValue placeholder="Sélectionner une ville" />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city: any) => (
              <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="client-photo">Photo (optionnel)</Label>
        <Input
          id="client-photo"
          type="file"
          accept="image/*"
          onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] || null })}
          data-testid="input-client-photo"
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={addClientMutation.isPending} data-testid="button-submit-client">
          {addClientMutation.isPending ? "Ajout..." : "Ajouter le client"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Add Transporter Form Component (similar to admin version but for coordinator)
function AddTransporterForm({ onSuccess, cities }: { onSuccess: () => void; cities: any[] }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    city: "",
    truckPhoto: null as File | null,
  });

  const addTransporterMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/admin/transporters", {
        method: "POST",
        body: data,
      });
      if (!response.ok) throw new Error("Échec de l'ajout");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Transporteur ajouté",
        description: "Le transporteur a été ajouté avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transporters"] });
      onSuccess();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de l'ajout du transporteur",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("phoneNumber", formData.phoneNumber);
    data.append("city", formData.city);
    if (formData.truckPhoto) {
      data.append("truckPhoto", formData.truckPhoto);
    }
    addTransporterMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="transporter-name">Nom complet *</Label>
        <Input
          id="transporter-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          data-testid="input-transporter-name"
        />
      </div>
      <div>
        <Label htmlFor="transporter-phone">Téléphone *</Label>
        <Input
          id="transporter-phone"
          type="tel"
          placeholder="+212..."
          value={formData.phoneNumber}
          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
          required
          data-testid="input-transporter-phone"
        />
      </div>
      <div>
        <Label htmlFor="transporter-city">Ville *</Label>
        <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
          <SelectTrigger id="transporter-city" data-testid="select-transporter-city">
            <SelectValue placeholder="Sélectionner une ville" />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city: any) => (
              <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="transporter-photo">Photo du camion (optionnel)</Label>
        <Input
          id="transporter-photo"
          type="file"
          accept="image/*"
          onChange={(e) => setFormData({ ...formData, truckPhoto: e.target.files?.[0] || null })}
          data-testid="input-transporter-photo"
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={addTransporterMutation.isPending} data-testid="button-submit-transporter">
          {addTransporterMutation.isPending ? "Ajout..." : "Ajouter le transporteur"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function CoordinatorUserManagement() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addType, setAddType] = useState<"client" | "transporter">("client");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Fetch user from localStorage
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Fetch clients
  const { data: clients = [], isLoading: clientsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/clients"],
  });

  // Fetch transporters
  const { data: transporters = [], isLoading: transportersLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/transporters"],
  });

  // Fetch cities
  const { data: cities = [] } = useQuery<any[]>({
    queryKey: ["/api/cities"],
  });

  // Filter function
  const filterUsers = (users: any[]) => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter((u: any) =>
      u.name?.toLowerCase().includes(query) ||
      u.phoneNumber?.includes(query) ||
      u.clientId?.toLowerCase().includes(query)
    );
  };

  const filteredClients = filterUsers(clients);
  const filteredTransporters = filterUsers(transporters);

  const handleOpenAddDialog = (type: "client" | "transporter") => {
    setAddType(type);
    setAddDialogOpen(true);
  };

  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
  };

  const handleEditUser = (user: any, type: "client" | "transporter") => {
    setSelectedUser({ ...user, type });
    setEditDialogOpen(true);
  };

  if (!user || user.role !== "coordinateur") {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} onLogout={handleLogout} />

      <main className="flex-1 container py-6 px-4 md:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground">Ajouter et gérer les clients et transporteurs</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, téléphone ou ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-users"
            />
          </div>
        </div>

        {/* Add Buttons */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Button
            onClick={() => handleOpenAddDialog("client")}
            className="gap-2"
            data-testid="button-add-client"
          >
            <UserPlus className="h-4 w-4" />
            Ajouter un Client
          </Button>
          <Button
            onClick={() => handleOpenAddDialog("transporter")}
            variant="secondary"
            className="gap-2"
            data-testid="button-add-transporter"
          >
            <UserPlus className="h-4 w-4" />
            Ajouter un Transporteur
          </Button>
        </div>

        {/* Tabs for Clients and Transporters */}
        <Tabs defaultValue="clients">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="clients" data-testid="tab-clients">
              <Users className="h-4 w-4 mr-2" />
              Clients ({filteredClients.length})
            </TabsTrigger>
            <TabsTrigger value="transporters" data-testid="tab-transporters">
              <Truck className="h-4 w-4 mr-2" />
              Transporteurs ({filteredTransporters.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="mt-6">
            {clientsLoading ? (
              <div className="flex justify-center py-12">
                <LoadingTruck />
              </div>
            ) : filteredClients.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun client trouvé</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredClients.map((client: any) => (
                  <Card key={client.id} className="hover-elevate" data-testid={`card-client-${client.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{client.name}</CardTitle>
                          {client.clientId && (
                            <Badge variant="outline" className="mt-1">{client.clientId}</Badge>
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditUser(client, "client")}
                          data-testid={`button-edit-client-${client.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Téléphone:</span>{" "}
                        <a href={`tel:${client.phoneNumber}`} className="text-primary hover:underline">
                          {client.phoneNumber}
                        </a>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Ville:</span> {client.city}
                      </p>
                      {client.totalRequests !== undefined && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Commandes:</span> {client.totalRequests}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="transporters" className="mt-6">
            {transportersLoading ? (
              <div className="flex justify-center py-12">
                <LoadingTruck />
              </div>
            ) : filteredTransporters.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun transporteur trouvé</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTransporters.map((transporter: any) => (
                  <Card key={transporter.id} className="hover-elevate" data-testid={`card-transporter-${transporter.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{transporter.name}</CardTitle>
                          {transporter.hasTruckPhoto && (
                            <Badge variant="outline" className="mt-1">
                              <Camera className="h-3 w-3 mr-1" />
                              Photo
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditUser(transporter, "transporter")}
                          data-testid={`button-edit-transporter-${transporter.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Téléphone:</span>{" "}
                        <a href={`tel:${transporter.phoneNumber}`} className="text-primary hover:underline">
                          {transporter.phoneNumber}
                        </a>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Ville:</span> {transporter.city}
                      </p>
                      {transporter.rating !== undefined && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Note:</span> {transporter.rating.toFixed(1)} ⭐
                        </p>
                      )}
                      {transporter.totalTrips !== undefined && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Trajets:</span> {transporter.totalTrips}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {addType === "client" ? "Ajouter un Client" : "Ajouter un Transporteur"}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations pour ajouter un nouveau {addType === "client" ? "client" : "transporteur"}
            </DialogDescription>
          </DialogHeader>
          {addType === "client" ? (
            <AddClientForm onSuccess={handleCloseAddDialog} cities={cities} />
          ) : (
            <AddTransporterForm onSuccess={handleCloseAddDialog} cities={cities} />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog (TODO: Implement edit functionality) */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Fonctionnalité de modification en cours de développement
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cette fonctionnalité sera disponible prochainement pour permettre la modification des informations utilisateur.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
