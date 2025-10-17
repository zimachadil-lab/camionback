import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, Phone, CheckCircle } from "lucide-react";
import { NewRequestForm } from "@/components/client/new-request-form";
import { OfferCard } from "@/components/client/offer-card";
import { ChatWindow } from "@/components/chat/chat-window";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function RequestWithOffers({ request, onAcceptOffer, onChat }: any) {
  const { data: offers = [] } = useQuery({
    queryKey: ["/api/offers", request.id],
    queryFn: async () => {
      const response = await fetch(`/api/offers?requestId=${request.id}`);
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

  const offersWithTransporters = offers.map((offer: any) => {
    const transporter = users.find((u: any) => u.id === offer.transporterId);
    return {
      ...offer,
      transporterName: transporter?.name || "Transporteur",
      rating: parseFloat(transporter?.rating || "0"),
      totalTrips: transporter?.totalTrips || 0,
      truckPhoto: transporter?.truckPhotos?.[0],
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">{request.referenceId}</h3>
          <p className="text-sm text-muted-foreground">
            {request.fromCity} → {request.toCity}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">
          Offres reçues ({offersWithTransporters.length})
        </h4>
        {offersWithTransporters.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {offersWithTransporters.map((offer: any) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onAccept={onAcceptOffer}
                onChat={onChat}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucune offre pour le moment
          </p>
        )}
      </div>
    </div>
  );
}

export default function ClientDashboard() {
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedTransporter, setSelectedTransporter] = useState<any>(null);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [contactInfo, setContactInfo] = useState<any>(null);

  const user = JSON.parse(localStorage.getItem("camionback_user") || "{}");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["/api/requests", user.id],
    queryFn: async () => {
      const response = await fetch(`/api/requests?clientId=${user.id}`);
      return response.json();
    },
  });

  const acceptOfferMutation = useMutation({
    mutationFn: async (offerId: string) => {
      const response = await fetch(`/api/offers/${offerId}/accept`, {
        method: "POST",
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      
      setContactInfo({
        transporterPhone: data.transporterPhone,
        transporterName: data.transporterName,
        commission: data.commission,
        total: data.total
      });
      setShowContactDialog(true);
    },
  });

  const handleAcceptOffer = (offerId: string) => {
    acceptOfferMutation.mutate(offerId);
  };

  const handleChat = (transporterId: string) => {
    setSelectedTransporter({ id: transporterId, name: "Transporteur", role: "transporter" });
    setChatOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  const activeRequests = requests.filter((r: any) => r.status === "open" || r.status === "accepted");
  const completedRequests = requests.filter((r: any) => r.status === "completed");

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mes demandes</h1>
            <p className="text-muted-foreground mt-1">Gérez vos demandes de transport</p>
          </div>
          <Button 
            onClick={() => setShowNewRequest(true)} 
            size="lg"
            data-testid="button-new-request"
          >
            <Plus className="mr-2 h-5 w-5" />
            Nouvelle demande
          </Button>
        </div>

        {showNewRequest ? (
          <NewRequestForm onSuccess={() => {
            setShowNewRequest(false);
            queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
          }} />
        ) : (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="active" data-testid="tab-active">
                <Package className="mr-2 h-4 w-4" />
                Actives
              </TabsTrigger>
              <TabsTrigger value="completed" data-testid="tab-completed">
                Terminées
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-6 space-y-6">
              {activeRequests.length > 0 ? (
                activeRequests.map((request: any) => (
                  <RequestWithOffers 
                    key={request.id} 
                    request={request}
                    onAcceptOffer={handleAcceptOffer}
                    onChat={handleChat}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Vous n'avez pas encore de demandes
                  </p>
                  <Button 
                    onClick={() => setShowNewRequest(true)} 
                    className="mt-4"
                  >
                    Créer une demande
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-6">
              {completedRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Aucune demande terminée
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedRequests.map((request: any) => (
                    <div key={request.id} className="p-4 rounded-lg border">
                      <p className="font-semibold">{request.referenceId}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.fromCity} → {request.toCity}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {selectedTransporter && (
        <ChatWindow
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          otherUser={selectedTransporter}
          currentUserId="current-client-id"
          requestId="1"
        />
      )}

      <AlertDialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <AlertDialogTitle className="text-xl">Offre acceptée !</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-4 text-base">
              <p className="text-foreground">
                Le transporteur <span className="font-semibold">{contactInfo?.transporterName}</span> a été informé que vous avez choisi son offre.
              </p>
              
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <p className="font-medium text-foreground mb-2">Vous pouvez maintenant le contacter :</p>
                <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                  <Phone className="w-5 h-5" />
                  <a href={`tel:${contactInfo?.transporterPhone}`} className="hover:underline">
                    {contactInfo?.transporterPhone}
                  </a>
                </div>
              </div>

              {contactInfo?.commission && (
                <div className="text-sm text-muted-foreground border-t pt-3 space-y-1">
                  <p>Commission CamionBack : {contactInfo.commission.toFixed(2)} MAD</p>
                  <p className="font-semibold text-foreground">Total à payer : {contactInfo.total.toFixed(2)} MAD</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              className="w-full"
              data-testid="button-close-contact-dialog"
            >
              J'ai compris
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
