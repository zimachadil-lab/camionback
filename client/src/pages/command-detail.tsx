import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, MapPin, Calendar, Truck, User as UserIcon, Phone } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { TransportRequest, User } from "@shared/schema";

export default function CommandDetail() {
  const [, params] = useRoute("/commande/:id");
  const [, setLocation] = useLocation();
  const commandId = params?.id;

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const { data: request, isLoading, error } = useQuery<TransportRequest & { offersCount?: number; pickupDate?: string; offerAmount?: number; loadType?: string }>({
    queryKey: ["/api/requests", commandId],
    enabled: !!commandId && !!user,
  });

  // Redirection si non connecté
  useEffect(() => {
    if (!user && !isLoading) {
      // Sauvegarder l'URL pour rediriger après connexion
      localStorage.setItem("redirectAfterLogin", `/commande/${commandId}`);
      setLocation("/login");
    }
  }, [user, isLoading, commandId, setLocation]);

  // Vérifier les droits d'accès
  useEffect(() => {
    if (user && user.role !== "transporter" && user.role !== "coordinateur" && user.role !== "admin") {
      setLocation("/");
    }
  }, [user, setLocation]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Commande introuvable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Cette commande n'existe pas ou vous n'avez pas accès à celle-ci.
            </p>
            <Button onClick={() => setLocation("/")} data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto p-4 sm:p-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">
                {request.referenceId}
              </CardTitle>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                request.status === "pending" ? "bg-yellow-500/10 text-yellow-500" :
                request.status === "accepted" ? "bg-green-500/10 text-green-500" :
                request.status === "completed" ? "bg-blue-500/10 text-blue-500" :
                "bg-gray-500/10 text-gray-500"
              }`}>
                {request.status === "pending" ? "En attente" :
                 request.status === "accepted" ? "Acceptée" :
                 request.status === "completed" ? "Terminée" :
                 request.status}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Itinéraire */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-1" />
                <div>
                  <p className="font-semibold">De</p>
                  <p className="text-muted-foreground">{request.fromCity}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-destructive mt-1" />
                <div>
                  <p className="font-semibold">À</p>
                  <p className="text-muted-foreground">{request.toCity}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {request.description && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <p className="font-semibold">Description</p>
                </div>
                <p className="text-muted-foreground pl-7">{request.description}</p>
              </div>
            )}

            {/* Date de création */}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Date de création</p>
                <p className="text-muted-foreground">
                  {format(new Date(request.dateTime), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              </div>
            </div>

            {/* Date de mission (si disponible) */}
            {request.pickupDate && (
              <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-md">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-primary">Date de la mission</p>
                  <p className="text-muted-foreground">
                    {format(new Date(request.pickupDate), "EEEE d MMMM yyyy", { locale: fr })}
                  </p>
                </div>
              </div>
            )}

            {/* Type de chargement (si disponible) */}
            {request.loadType && (
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Type de chargement</p>
                  <p className="text-muted-foreground">
                    {request.loadType === "return" ? "Retour" : "Groupage"}
                  </p>
                </div>
              </div>
            )}

            {/* Montant de l'offre (si disponible) */}
            {request.offerAmount && (
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Montant de l'offre</p>
                  <p className="text-primary font-bold text-lg">{request.offerAmount} MAD</p>
                </div>
              </div>
            )}

            {/* Nombre de vues */}
            <div className="flex items-center gap-3">
              <UserIcon className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Vues</p>
                <p className="text-muted-foreground">{request.viewCount} vues</p>
              </div>
            </div>

            {/* Nombre d'offres */}
            {request.offersCount !== undefined && (
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Offres reçues</p>
                  <p className="text-muted-foreground">{request.offersCount} offre(s)</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
