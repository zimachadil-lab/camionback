import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Calendar, 
  Package, 
  FileText, 
  User, 
  Star,
  TrendingUp,
  Truck,
  Image as ImageIcon,
  LogIn
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PublicRequest {
  id: string;
  referenceId: string;
  fromCity: string;
  toCity: string;
  description: string;
  goodsType: string;
  dateTime: string;
  dateFlexible: boolean;
  invoiceRequired: boolean;
  budget: string | null;
  photos: string[] | null;
  status: string;
  viewCount: number;
  createdAt: string;
  client: {
    clientId: string;
    name: string;
    city: string;
  };
  acceptedOffer: {
    id: string;
    amount: string;
    pickupDate: string;
    loadType: string;
    transporter: {
      id: string;
      name: string;
      rating: string;
      totalTrips: number;
    };
  } | null;
  offersCount: number;
}

export default function PublicRequestView() {
  const [, params] = useRoute("/public/request/:shareToken");
  const [, setLocation] = useLocation();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const shareToken = params?.shareToken;

  const { data: request, isLoading, error } = useQuery<PublicRequest>({
    queryKey: ['/api/public/request', shareToken],
    enabled: !!shareToken,
  });

  const handleMakeOffer = async () => {
    // Check if user is logged in
    const response = await fetch('/api/auth/me', { credentials: 'include' });
    if (response.ok) {
      const { user } = await response.json();
      if (user && user.role === 'transporter') {
        // Redirect to transporter dashboard with this request
        setLocation(`/transporter?request=${request?.id}`);
      } else if (user) {
        // User is logged in but not a transporter
        alert("Vous devez avoir un compte transporteur pour faire une offre.");
      }
    } else {
      // Not logged in, redirect to home/login
      setLocation('/?redirect=/public/request/' + shareToken);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      open: { label: "Disponible", variant: "default" },
      accepted: { label: "Acceptée", variant: "secondary" },
      completed: { label: "Terminée", variant: "outline" },
      cancelled: { label: "Annulée", variant: "destructive" },
    };
    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant} data-testid="badge-request-status">{config.label}</Badge>;
  };

  if (!shareToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full" data-testid="card-error">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Lien de partage invalide</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full" data-testid="card-loading">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-center text-muted-foreground">Chargement de la commande...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full" data-testid="card-not-found">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Package className="h-16 w-16 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Commande introuvable</h2>
              <p className="text-center text-muted-foreground">
                Cette commande n'existe pas ou a été supprimée.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 shadow-md">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            <h1 className="text-xl font-bold">CamionBack</h1>
          </div>
          <p className="text-sm mt-1 text-primary-foreground/80">Plateforme logistique</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Reference and Status */}
        <Card data-testid="card-reference">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg">Commande {request.referenceId}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1" data-testid="text-created-date">
                  Créée le {format(new Date(request.createdAt), "dd MMMM yyyy", { locale: fr })}
                </p>
              </div>
              {getStatusBadge(request.status)}
            </div>
          </CardHeader>
        </Card>

        {/* Itinerary */}
        <Card data-testid="card-itinerary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-5 w-5" />
              Itinéraire
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-primary"></div>
                <div className="h-12 w-0.5 bg-border"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Départ</p>
                <p className="font-semibold" data-testid="text-from-city">{request.fromCity}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-destructive"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Arrivée</p>
                <p className="font-semibold" data-testid="text-to-city">{request.toCity}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card data-testid="card-details">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5" />
              Détails de la commande
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Type de marchandise</p>
              <p className="font-medium" data-testid="text-goods-type">{request.goodsType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="font-medium" data-testid="text-description">{request.description}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date proposée
              </p>
              <p className="font-medium" data-testid="text-date-time">
                {format(new Date(request.dateTime), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                {request.dateFlexible && (
                  <Badge variant="outline" className="ml-2">Date flexible</Badge>
                )}
              </p>
            </div>
            {request.budget && (
              <div>
                <p className="text-sm text-muted-foreground">Budget estimé</p>
                <p className="font-semibold text-lg text-primary" data-testid="text-budget">
                  {parseFloat(request.budget).toLocaleString('fr-FR')} MAD
                </p>
              </div>
            )}
            {request.invoiceRequired && (
              <div>
                <Badge variant="secondary">Facture TTC requise</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photos */}
        {request.photos && request.photos.length > 0 && (
          <Card data-testid="card-photos">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="h-5 w-5" />
                Photos de la marchandise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {request.photos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-md overflow-hidden border border-border hover-elevate cursor-pointer"
                    onClick={() => setSelectedPhotoIndex(index)}
                    data-testid={`image-photo-${index}`}
                  >
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setSelectedPhotoIndex(0)}
                data-testid="button-view-photos"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Voir toutes les photos ({request.photos.length})
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Client Info */}
        <Card data-testid="card-client">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-5 w-5" />
              Client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Identifiant</p>
              <p className="font-medium" data-testid="text-client-id">{request.client.clientId}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Nom</p>
              <p className="font-medium" data-testid="text-client-name">{request.client.name}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Ville</p>
              <p className="font-medium" data-testid="text-client-city">{request.client.city}</p>
            </div>
          </CardContent>
        </Card>

        {/* Accepted Offer (if any) */}
        {request.acceptedOffer && (
          <Card data-testid="card-accepted-offer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-5 w-5" />
                Offre acceptée
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-secondary/50 p-4 rounded-lg">
                <p className="text-2xl font-bold text-primary" data-testid="text-offer-amount">
                  {parseFloat(request.acceptedOffer.amount).toLocaleString('fr-FR')} MAD
                </p>
                <p className="text-sm text-muted-foreground">
                  Type: {request.acceptedOffer.loadType === 'return' ? 'Retour' : 'Groupage'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Date de prise en charge: {format(new Date(request.acceptedOffer.pickupDate), "dd MMMM yyyy", { locale: fr })}
                </p>
              </div>
              
              {request.acceptedOffer.transporter && (
                <div className="border-t pt-3">
                  <p className="text-sm font-medium mb-2">Transporteur assigné</p>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold" data-testid="text-transporter-name">
                      {request.acceptedOffer.transporter.name}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium" data-testid="text-transporter-rating">
                          {parseFloat(request.acceptedOffer.transporter.rating).toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span data-testid="text-transporter-trips">
                          {request.acceptedOffer.transporter.totalTrips} trajets
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <Card data-testid="card-stats">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Offres reçues</span>
              <span className="font-semibold" data-testid="text-offers-count">{request.offersCount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        {request.status === 'open' && (
          <div className="sticky bottom-4 pt-4">
            <Button
              className="w-full"
              size="lg"
              onClick={handleMakeOffer}
              data-testid="button-make-offer"
            >
              <LogIn className="h-5 w-5 mr-2" />
              Faire une offre
            </Button>
          </div>
        )}
      </div>

      {/* Photo Viewer Modal */}
      {selectedPhotoIndex !== null && request.photos && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhotoIndex(null)}
          data-testid="modal-photo-viewer"
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setSelectedPhotoIndex(null)}
              data-testid="button-close-photo"
            >
              ✕
            </Button>
            <img
              src={request.photos![selectedPhotoIndex]}
              alt={`Photo ${selectedPhotoIndex + 1}`}
              className="w-full h-auto rounded-lg"
              data-testid="image-photo-viewer"
            />
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPhotoIndex(Math.max(0, selectedPhotoIndex - 1))}
                disabled={selectedPhotoIndex === 0}
                data-testid="button-prev-photo"
              >
                ← Précédent
              </Button>
              <span className="text-white text-sm">
                {selectedPhotoIndex + 1} / {request.photos!.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPhotoIndex(Math.min(request.photos!.length - 1, selectedPhotoIndex + 1))}
                disabled={selectedPhotoIndex === request.photos!.length - 1}
                data-testid="button-next-photo"
              >
                Suivant →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
