import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, ListFilter, Package, Phone, CheckCircle, MapPin, MessageSquare, Image as ImageIcon, Clock } from "lucide-react";
import { Header } from "@/components/layout/header";
import { RequestCard } from "@/components/transporter/request-card";
import { OfferForm } from "@/components/transporter/offer-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChatWindow } from "@/components/chat/chat-window";
import { PhotoGalleryDialog } from "@/components/transporter/photo-gallery-dialog";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

const moroccanCities = [
  "Toutes les villes", "Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", 
  "Agadir", "Meknès", "Oujda", "Kenitra"
];

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
    setLocation("/");
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

  const handleMakeOffer = (requestId: string) => {
    setSelectedRequestId(requestId);
    setOfferDialogOpen(true);
  };

  const handleChat = (clientId: string, clientName: string, requestId: string) => {
    if (!requestId) {
      console.error('Cannot open chat: requestId is missing');
      return;
    }
    setSelectedClient({ id: clientId, name: clientName || "Client", role: "client" });
    setChatRequestId(requestId);
    setChatOpen(true);
  };

  const handleViewPhotos = (photos: string[], referenceId: string) => {
    setSelectedPhotos(photos);
    setSelectedReferenceId(referenceId);
    setPhotoGalleryOpen(true);
  };

  const filteredRequests = requests.filter((req: any) => {
    const cityMatch: boolean = selectedCity === "Toutes les villes" || 
                     req.fromCity === selectedCity || 
                     req.toCity === selectedCity;
    const searchMatch: boolean = searchQuery === "" || 
                       req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       req.goodsType.toLowerCase().includes(searchQuery.toLowerCase());
    return cityMatch && searchMatch;
  });

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
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="available" data-testid="tab-available">
              <Search className="mr-2 h-4 w-4" />
              Disponibles
            </TabsTrigger>
            <TabsTrigger value="my-offers" data-testid="tab-my-offers">
              <Package className="mr-2 h-4 w-4" />
              Mes offres
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
                  {moroccanCities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
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
                          <span className="text-xl font-bold text-primary">{offer.amount} MAD</span>
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
                                Client : {client.name || "Non spécifié"}
                              </p>
                              {request && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleChat(client.id, client.name, request.id)}
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
          requestId={chatRequestId}
        />
      )}

      <PhotoGalleryDialog
        open={photoGalleryOpen}
        onClose={() => setPhotoGalleryOpen(false)}
        photos={selectedPhotos}
        referenceId={selectedReferenceId}
      />
    </div>
  );
}
