import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ListFilter, Package } from "lucide-react";
import { RequestCard } from "@/components/transporter/request-card";
import { OfferForm } from "@/components/transporter/offer-form";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

const moroccanCities = [
  "Toutes les villes", "Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", 
  "Agadir", "Meknès", "Oujda", "Kenitra"
];

export default function TransporterDashboard() {
  const [selectedCity, setSelectedCity] = useState("Toutes les villes");
  const [searchQuery, setSearchQuery] = useState("");
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string>("");

  const user = JSON.parse(localStorage.getItem("camionback_user") || "{}");

  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/requests"],
    queryFn: async () => {
      const response = await fetch("/api/requests?status=open");
      return response.json();
    },
  });

  const { data: myOffers = [], isLoading: offersLoading } = useQuery({
    queryKey: ["/api/offers", user.id],
    queryFn: async () => {
      const response = await fetch(`/api/offers?transporterId=${user.id}`);
      return response.json();
    },
  });

  const handleMakeOffer = (requestId: string) => {
    setSelectedRequestId(requestId);
    setOfferDialogOpen(true);
  };

  const filteredRequests = requests.filter((req: any) => {
    const cityMatch = selectedCity === "Toutes les villes" || 
                     req.fromCity === selectedCity || 
                     req.toCity === selectedCity;
    const searchMatch = searchQuery === "" || 
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
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
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
                {filteredRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onMakeOffer={handleMakeOffer}
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
              <div className="space-y-6">
                {myOffers.map((offer: any) => (
                  <div key={offer.id} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        offer.status === "pending" ? "outline" :
                        offer.status === "accepted" ? "default" :
                        "secondary"
                      }>
                        {offer.status === "pending" ? "En attente" :
                         offer.status === "accepted" ? "Acceptée" :
                         "Refusée"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Votre offre: <span className="font-bold text-primary">{offer.amount} MAD</span>
                      </span>
                    </div>
                  </div>
                ))}
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
    </div>
  );
}
