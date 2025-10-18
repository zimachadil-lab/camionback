import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Phone, CheckCircle, Trash2, Info, RotateCcw, Star, CreditCard, Upload } from "lucide-react";
import { Header } from "@/components/layout/header";
import { NewRequestForm } from "@/components/client/new-request-form";
import { OfferCard } from "@/components/client/offer-card";
import { ChatWindow } from "@/components/chat/chat-window";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

function RequestWithOffers({ request, onAcceptOffer, onChat, onDelete, onViewTransporter, onUpdateStatus, users }: any) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isAccepted = request.status === "accepted";

  const { data: offers = [] } = useQuery({
    queryKey: ["/api/offers", request.id],
    queryFn: async () => {
      const response = await fetch(`/api/offers?requestId=${request.id}`);
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
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-xl font-semibold">{request.referenceId}</h3>
              {isAccepted && (
                <Badge variant="default" className="bg-green-600">
                  Acceptée
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {request.fromCity} → {request.toCity}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAccepted && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onViewTransporter(request.id)}
                  data-testid={`button-view-transporter-${request.id}`}
                  className="gap-2"
                >
                  <Info className="h-4 w-4" />
                  <span className="hidden sm:inline">Infos transporteur</span>
                  <span className="sm:hidden">Infos</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      data-testid={`button-update-status-${request.id}`}
                      className="gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Statut
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onUpdateStatus(request.id, "completed")}
                      data-testid={`button-complete-${request.id}`}
                      className="gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Terminée
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onUpdateStatus(request.id, "republish")}
                      data-testid={`button-republish-${request.id}`}
                      className="gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Republier
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
              data-testid={`button-delete-${request.id}`}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isAccepted && (
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
                    onChat={() => onChat(offer.transporterId, offer.transporterName, request.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune offre pour le moment
              </p>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la commande</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette commande ? Cette action supprimera également toutes les offres et messages associés. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(request.id);
                setShowDeleteDialog(false);
              }}
              data-testid="button-confirm-delete"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function ClientDashboard() {
  const [, setLocation] = useLocation();
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedTransporter, setSelectedTransporter] = useState<any>(null);
  const [chatRequestId, setChatRequestId] = useState<string>("");
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [showTransporterInfo, setShowTransporterInfo] = useState(false);
  const [transporterInfo, setTransporterInfo] = useState<any>(null);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingRequestId, setRatingRequestId] = useState<string>("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentRequestId, setPaymentRequestId] = useState<string>("");
  const [paymentReceipt, setPaymentReceipt] = useState<string>("");

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
    // Clear user session
    localStorage.removeItem("camionback_user");
    // Force page reload to clear all state
    window.location.href = "/";
  };

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["/api/requests", user.id],
    queryFn: async () => {
      const response = await fetch(`/api/requests?clientId=${user.id}`);
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

  const deleteRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete request");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const viewTransporterMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await fetch(`/api/requests/${requestId}/accepted-transporter`);
      if (!response.ok) {
        throw new Error("Failed to fetch transporter info");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setTransporterInfo(data);
      setShowTransporterInfo(true);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: string }) => {
      const endpoint = action === "completed" 
        ? `/api/requests/${requestId}/complete`
        : `/api/requests/${requestId}/republish`;
      
      const response = await fetch(endpoint, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`Failed to ${action} request`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
    },
  });

  const handleAcceptOffer = (offerId: string) => {
    acceptOfferMutation.mutate(offerId);
  };

  const handleDeleteRequest = (requestId: string) => {
    deleteRequestMutation.mutate(requestId);
  };

  const handleViewTransporter = (requestId: string) => {
    viewTransporterMutation.mutate(requestId);
  };

  const handleUpdateStatus = (requestId: string, action: string) => {
    if (action === "completed") {
      // Show rating dialog before completing
      setRatingRequestId(requestId);
      setRatingValue(0);
      setHoverRating(0);
      setShowRatingDialog(true);
    } else {
      // For republish action
      updateStatusMutation.mutate({ requestId, action });
    }
  };

  const completeWithRatingMutation = useMutation({
    mutationFn: async ({ requestId, rating }: { requestId: string; rating: number }) => {
      const response = await fetch(`/api/requests/${requestId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating }),
      });
      if (!response.ok) {
        throw new Error("Failed to complete request with rating");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Commande terminée",
        description: "Merci pour votre évaluation ! La commande est maintenant terminée.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      setShowRatingDialog(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de terminer la commande",
      });
    },
  });

  const { toast } = useToast();

  const markAsPaidMutation = useMutation({
    mutationFn: async ({ requestId, receipt }: { requestId: string; receipt: string }) => {
      return await apiRequest("POST", `/api/requests/${requestId}/mark-as-paid`, {
        clientId: user.id,
        paymentReceipt: receipt,
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Succès",
        description: "Merci ! Veuillez maintenant évaluer le transporteur",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      
      // Close payment dialog
      setShowPaymentDialog(false);
      setPaymentReceipt("");
      
      // Open rating dialog automatically with the same request
      setRatingRequestId(variables.requestId);
      setRatingValue(0);
      setHoverRating(0);
      setShowRatingDialog(true);
      
      // Clear payment request ID after everything is set
      setPaymentRequestId("");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de la confirmation du paiement",
      });
    },
  });

  const handleSubmitRating = () => {
    if (ratingValue > 0 && ratingRequestId) {
      completeWithRatingMutation.mutate({ requestId: ratingRequestId, rating: ratingValue });
    }
  };

  const handleOpenPaymentDialog = (requestId: string) => {
    setPaymentRequestId(requestId);
    setPaymentReceipt("");
    setShowPaymentDialog(true);
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Accept all image formats - validation is manual by admin
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Format non accepté",
        description: "Veuillez téléverser une image",
      });
      e.target.value = ''; // Reset input
      return;
    }

    // Validate file size (max 10MB - increased limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "Fichier trop volumineux",
        description: "La taille maximale autorisée est de 10 Mo",
      });
      e.target.value = ''; // Reset input
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentReceipt(reader.result as string);
      toast({
        title: "Reçu téléversé",
        description: "Le reçu de paiement a été chargé avec succès",
      });
    };
    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      toast({
        variant: "destructive",
        title: "Erreur de lecture",
        description: "Impossible de lire le fichier. Veuillez réessayer avec une autre image.",
      });
      e.target.value = ''; // Reset input
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmPayment = () => {
    if (!paymentReceipt) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez téléverser le reçu de paiement",
      });
      return;
    }
    markAsPaidMutation.mutate({ requestId: paymentRequestId, receipt: paymentReceipt });
  };

  const handleChat = (transporterId: string, transporterName: string, requestId: string) => {
    setSelectedTransporter({ id: transporterId, name: transporterName || "Transporteur", role: "transporter" });
    setChatRequestId(requestId);
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

  const activeRequests = requests.filter((r: any) => 
    (r.status === "open" || r.status === "accepted") && r.paymentStatus !== "paid"
  );
  const completedRequests = requests.filter((r: any) => r.status === "completed" || r.paymentStatus === "paid");
  const paymentPendingRequests = requests.filter((r: any) => r.paymentStatus === "awaiting_payment");

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={user}
        onNewRequest={() => setShowNewRequest(true)}
        onLogout={handleLogout}
      />
      
      <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mes demandes</h1>
          <p className="text-muted-foreground mt-1">Gérez vos demandes de transport</p>
        </div>

        {showNewRequest ? (
          <NewRequestForm onSuccess={() => {
            setShowNewRequest(false);
            queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
          }} />
        ) : (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full max-w-3xl grid-cols-3">
              <TabsTrigger value="active" data-testid="tab-active">
                <Package className="mr-2 h-4 w-4" />
                Actives
              </TabsTrigger>
              <TabsTrigger value="to-pay" data-testid="tab-to-pay">
                <CreditCard className="mr-2 h-4 w-4" />
                À payer ({paymentPendingRequests.length})
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
                    users={users}
                    onAcceptOffer={handleAcceptOffer}
                    onChat={handleChat}
                    onDelete={handleDeleteRequest}
                    onViewTransporter={handleViewTransporter}
                    onUpdateStatus={handleUpdateStatus}
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

            <TabsContent value="to-pay" className="mt-6">
              {paymentPendingRequests.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Aucune commande à payer
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentPendingRequests.map((request: any) => {
                    const acceptedOffer = request.acceptedOfferId 
                      ? users.find((u: any) => {
                          // Find the transporter through the accepted offer
                          return u.role === "transporter";
                        })
                      : null;

                    return (
                      <div key={request.id} className="p-4 rounded-lg border space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-semibold text-lg">{request.referenceId}</p>
                              <Badge variant="default" className="bg-blue-600">
                                À facturer
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {request.fromCity} → {request.toCity}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Type de marchandise</p>
                            <p className="font-medium">{request.goodsType}</p>
                          </div>
                          {request.estimatedWeight && (
                            <div>
                              <p className="text-muted-foreground">Poids estimé</p>
                              <p className="font-medium">{request.estimatedWeight}</p>
                            </div>
                          )}
                        </div>

                        {request.description && (
                          <div>
                            <p className="text-sm text-muted-foreground">Description</p>
                            <p className="text-sm">{request.description}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-2 border-t">
                          {request.acceptedOfferId && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleViewTransporter(request.id)}
                              data-testid={`button-view-transporter-payment-${request.id}`}
                              className="gap-2"
                            >
                              <Info className="h-4 w-4" />
                              <span className="hidden sm:inline">Infos transporteur</span>
                              <span className="sm:hidden">Infos</span>
                            </Button>
                          )}
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleOpenPaymentDialog(request.id)}
                            className="gap-2"
                            data-testid={`button-mark-paid-${request.id}`}
                          >
                            <CheckCircle className="h-4 w-4" />
                            Marquer comme payé
                          </Button>
                        </div>
                      </div>
                    );
                  })}
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
                    <div key={request.id} className="p-4 rounded-lg border space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-semibold">{request.referenceId}</p>
                            <Badge variant="default" className="bg-gray-600">
                              Terminée
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {request.fromCity} → {request.toCity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {request.acceptedOfferId && (
                            <>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleViewTransporter(request.id)}
                                data-testid={`button-view-transporter-completed-${request.id}`}
                                className="gap-2"
                              >
                                <Info className="h-4 w-4" />
                                <span className="hidden sm:inline">Infos transporteur</span>
                                <span className="sm:hidden">Infos</span>
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleUpdateStatus(request.id, "republish")}
                                data-testid={`button-republish-completed-${request.id}`}
                                className="gap-2"
                              >
                                <RotateCcw className="h-4 w-4" />
                                Republier
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRequest(request.id)}
                            data-testid={`button-delete-completed-${request.id}`}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
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
          currentUserId={user.id}
          requestId={chatRequestId}
        />
      )}

      <AlertDialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
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

      <AlertDialog open={showTransporterInfo} onOpenChange={setShowTransporterInfo}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <Info className="w-6 h-6 text-primary-foreground" />
              </div>
              <AlertDialogTitle className="text-xl">Informations du transporteur</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-4 text-base">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Nom</p>
                  <p className="font-semibold text-foreground">{transporterInfo?.transporterName || "Non disponible"}</p>
                </div>
                
                {transporterInfo?.transporterCity && (
                  <div>
                    <p className="text-sm text-muted-foreground">Ville</p>
                    <p className="font-semibold text-foreground">{transporterInfo.transporterCity}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    <a 
                      href={`tel:${transporterInfo?.transporterPhone}`} 
                      className="font-semibold text-primary hover:underline"
                      data-testid="link-transporter-phone"
                    >
                      {transporterInfo?.transporterPhone}
                    </a>
                  </div>
                </div>
              </div>

              {transporterInfo?.totalAmount && (
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-foreground">Montant</span>
                    <span className="font-bold text-primary text-xl">{transporterInfo.totalAmount.toFixed(2)} MAD</span>
                  </div>
                </div>
              )}

              <p className="text-sm text-muted-foreground italic">
                Vous pouvez contacter directement le transporteur pour finaliser les détails du transport.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              className="w-full"
              data-testid="button-close-transporter-info"
            >
              Fermer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center">
                <Star className="w-6 h-6 text-white fill-white" />
              </div>
              <AlertDialogTitle className="text-xl">Évaluer le transporteur</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-6 text-base">
              <p className="text-foreground text-center">
                Merci d'évaluer le transporteur pour cette commande.
              </p>
              
              <div className="flex justify-center items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingValue(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                    data-testid={`button-star-${star}`}
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= (hoverRating || ratingValue)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>

              {ratingValue > 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  Note sélectionnée : {ratingValue} {ratingValue === 1 ? "étoile" : "étoiles"}
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel 
              onClick={() => setShowRatingDialog(false)}
              data-testid="button-cancel-rating"
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitRating}
              disabled={ratingValue === 0 || completeWithRatingMutation.isPending}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
              data-testid="button-submit-rating"
            >
              {completeWithRatingMutation.isPending ? "Enregistrement..." : "Valider la note"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer le paiement</DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 space-y-3">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Merci d'effectuer le virement sur le compte suivant :
                </p>
                <div className="space-y-1">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <span className="font-semibold">RIB :</span> 011815000005210001099713
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <span className="font-semibold">À l'ordre de :</span> CamionBack
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt-upload" className="text-sm font-medium">
                  Reçu de paiement <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Veuillez téléverser votre reçu de paiement (formats acceptés : JPEG, PNG, WebP - max. 5 Mo).
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('receipt-upload')?.click()}
                    className="w-full gap-2"
                    data-testid="button-upload-receipt"
                  >
                    <Upload className="w-4 h-4" />
                    {paymentReceipt ? "Reçu téléversé" : "Téléverser le reçu"}
                  </Button>
                  <input
                    id="receipt-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptUpload}
                    className="hidden"
                    data-testid="input-receipt-upload"
                  />
                </div>
                {paymentReceipt && (
                  <div className="mt-2">
                    <img
                      src={paymentReceipt}
                      alt="Reçu de paiement"
                      className="w-full h-40 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
              data-testid="button-cancel-payment"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleConfirmPayment}
              disabled={!paymentReceipt || markAsPaidMutation.isPending}
              data-testid="button-confirm-payment"
            >
              {markAsPaidMutation.isPending ? "Envoi en cours..." : "Confirmer le paiement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
