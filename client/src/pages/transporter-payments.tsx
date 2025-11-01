import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingTruck } from "@/components/ui/loading-truck";
import { Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/lib/auth-context";

export default function TransporterPayments() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading, logout } = useAuth();

  // Redirect non-transporters
  useEffect(() => {
    if (!authLoading && user && user.role !== "transporteur") {
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);

  const handleLogout = () => {
    logout();
  };

  const { data: paymentRequests = [], isLoading } = useQuery({
    queryKey: ["/api/requests/payments", user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/requests?payments=true&transporterId=${user!.id}`);
      return response.json();
    },
    refetchInterval: 5000,
    enabled: !!user?.id && user?.role === "transporteur",
  });

  const { data: allOffers = [] } = useQuery({
    queryKey: ["/api/offers"],
    queryFn: async () => {
      const response = await fetch("/api/offers");
      return response.json();
    },
    enabled: !!user,
  });

  // Early return after all hooks
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingTruck message="Chargement..." size="lg" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingTruck message="Chargement de vos paiements..." size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={user}
        onLogout={handleLogout}
      />
      
      <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Paiements reçus</h1>
          <p className="text-muted-foreground mt-1">Historique de vos paiements CamionBack</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des paiements</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro de commande</TableHead>
                      <TableHead>Date de commande</TableHead>
                      <TableHead>Dernière mise à jour</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentRequests.map((request: any) => {
                      // Find accepted offer for this request to get amount
                      const acceptedOffer = allOffers.find(
                        (offer: any) => offer.id === request.acceptedOfferId
                      );

                      const isPendingValidation = request.paymentStatus === "pending_admin_validation";
                      const isPaid = request.paymentStatus === "paid";

                      return (
                        <TableRow key={request.id} data-testid={`row-payment-${request.id}`}>
                          <TableCell className="font-medium" data-testid={`text-reference-${request.id}`}>
                            {request.referenceId}
                          </TableCell>
                          <TableCell data-testid={`text-created-${request.id}`}>
                            {request.createdAt 
                              ? format(new Date(request.createdAt), "dd/MM/yyyy", { locale: fr })
                              : "N/A"
                            }
                          </TableCell>
                          <TableCell data-testid={`text-updated-${request.id}`}>
                            {request.updatedAt 
                              ? format(new Date(request.updatedAt), "dd/MM/yyyy 'à' HH:mm", { locale: fr })
                              : request.createdAt 
                                ? format(new Date(request.createdAt), "dd/MM/yyyy 'à' HH:mm", { locale: fr })
                                : "N/A"
                            }
                          </TableCell>
                          <TableCell className="font-semibold" data-testid={`text-amount-${request.id}`}>
                            {acceptedOffer ? `${acceptedOffer.amount} MAD` : "N/A"}
                          </TableCell>
                          <TableCell data-testid={`status-payment-${request.id}`}>
                            {isPendingValidation && (
                              <Badge variant="default" className="bg-orange-600 gap-1">
                                <Clock className="h-3 w-3" />
                                En attente de paiement par CamionBack
                              </Badge>
                            )}
                            {isPaid && (
                              <Badge variant="default" className="bg-green-600 gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Payé par CamionBack
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Aucun paiement pour le moment
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
