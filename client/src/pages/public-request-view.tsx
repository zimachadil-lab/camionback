import { useState } from "react";
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
  Star,
  TrendingUp,
  Truck,
  Image as ImageIcon,
  ThumbsUp,
  ThumbsDown,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getCategoryConfig } from "@/lib/goods-category-config";
import { useToast } from "@/hooks/use-toast";

interface PublicRequest {
  id: string;
  referenceId: string;
  fromCity: string;
  toCity: string;
  description: string;
  goodsType: string;
  dateTime: string;
  handlingRequired?: boolean;
  departureFloor?: number | null;
  departureElevator?: boolean | null;
  arrivalFloor?: number | null;
  arrivalElevator?: boolean | null;
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
  const { toast } = useToast();

  const { data: request, isLoading, error } = useQuery<PublicRequest>({
    queryKey: [`/api/public/request/${shareToken}`],
    enabled: !!shareToken,
  });

  const handleInterested = async () => {
    // Check if user is logged in
    const response = await fetch('/api/auth/me', { credentials: 'include' });
    if (response.ok) {
      const { user } = await response.json();
      if (user && user.role === 'transporteur') {
        // Mark as interested and redirect to transporter dashboard
        toast({
          title: "Intérêt confirmé",
          description: "Vous allez être redirigé vers votre tableau de bord pour soumettre une offre.",
        });
        setTimeout(() => {
          setLocation(`/transporter-dashboard?request=${request?.id}`);
        }, 1000);
      } else if (user) {
        // User is logged in but not a transporter
        toast({
          title: "Accès réservé",
          description: "Vous devez avoir un compte transporteur pour manifester votre intérêt.",
          variant: "destructive",
        });
      }
    } else {
      // Not logged in, redirect to home/login
      toast({
        title: "Connexion requise",
        description: "Connectez-vous en tant que transporteur pour manifester votre intérêt.",
      });
      setTimeout(() => {
        setLocation('/?redirect=/public/request/' + shareToken);
      }, 1500);
    }
  };

  const handleNotInterested = async () => {
    toast({
      title: "Merci de votre retour",
      description: "Nous avons bien noté que cette commande ne vous convient pas.",
    });
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
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-background to-purple-50 dark:from-gray-900 dark:via-background dark:to-gray-800">
      {/* Modern Header with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>
        <div className="max-w-4xl mx-auto px-4 py-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Truck className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                CamionBack
                <Sparkles className="h-5 w-5 text-yellow-300" />
              </h1>
              <p className="text-sm text-white/90">Opportunité de transport</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-4 pb-32">
        {/* Reference and Status - Modern Design */}
        <Card className="border-2 border-teal-200 dark:border-teal-800 shadow-lg hover-elevate" data-testid="card-reference">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950 dark:to-emerald-950">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-xl font-bold text-teal-700 dark:text-teal-300">
                  Commande {request.referenceId}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2" data-testid="text-created-date">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(request.createdAt), "dd MMMM yyyy", { locale: fr })}
                </p>
              </div>
              {getStatusBadge(request.status)}
            </div>
          </CardHeader>
        </Card>

        {/* Itinerary - Modern Design */}
        <Card className="border-2 border-teal-200 dark:border-teal-800 shadow-lg hover-elevate" data-testid="card-itinerary">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950 dark:to-emerald-950">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-teal-700 dark:text-teal-300">
              <MapPin className="h-5 w-5" />
              Itinéraire
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="h-4 w-4 rounded-full bg-teal-600 shadow-md"></div>
                <div className="h-16 w-1 bg-border my-1"></div>
              </div>
              <div className="flex-1 bg-card p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground font-medium">Départ</p>
                <p className="font-bold text-lg" data-testid="text-from-city">{request.fromCity}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="h-4 w-4 rounded-full bg-destructive shadow-md"></div>
              </div>
              <div className="flex-1 bg-card p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground font-medium">Arrivée</p>
                <p className="font-bold text-lg" data-testid="text-to-city">{request.toCity}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details - Modern Design */}
        <Card className="border-2 border-teal-200 dark:border-teal-800 shadow-lg hover-elevate" data-testid="card-details">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950 dark:to-emerald-950">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-teal-700 dark:text-teal-300">
              <FileText className="h-5 w-5" />
              Détails de la commande
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div>
              <p className="text-sm text-muted-foreground">Type de marchandise</p>
              <p className="font-medium" data-testid="text-goods-type">{getCategoryConfig(request.goodsType).label}</p>
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
              </p>
            </div>
            {request.budget && (
              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/50 dark:to-emerald-950/50 p-4 rounded-lg border-2 border-teal-200 dark:border-teal-800">
                <p className="text-sm text-muted-foreground font-medium">Budget estimé</p>
                <p className="font-bold text-2xl text-teal-700 dark:text-teal-300" data-testid="text-budget">
                  {parseFloat(request.budget).toLocaleString('fr-FR')} MAD
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Manutention</p>
              {request.handlingRequired ? (
                <div className="space-y-1">
                  <p className="font-medium">Manutention : Oui</p>
                  <p className="text-sm">
                    Départ : {request.departureFloor === 0 ? 'RDC' : `${request.departureFloor}ᵉ étage`} - 
                    Ascenseur {request.departureElevator ? 'Oui' : 'Non'}
                  </p>
                  <p className="text-sm">
                    Arrivée : {request.arrivalFloor === 0 ? 'RDC' : `${request.arrivalFloor}ᵉ étage`} - 
                    Ascenseur {request.arrivalElevator ? 'Oui' : 'Non'}
                  </p>
                </div>
              ) : (
                <p className="font-medium">Manutention : Non</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Photos - Modern Design */}
        {request.photos && request.photos.length > 0 && (
          <Card className="border-2 border-teal-200 dark:border-teal-800 shadow-lg hover-elevate" data-testid="card-photos">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950 dark:to-emerald-950">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-teal-700 dark:text-teal-300">
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

        {/* Accepted Offer (if any) - Modern Design */}
        {request.acceptedOffer && (
          <Card className="border-2 border-teal-200 dark:border-teal-800 shadow-lg hover-elevate" data-testid="card-accepted-offer">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950 dark:to-emerald-950">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-teal-700 dark:text-teal-300">
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

        {/* Action Buttons - Interested / Not Interested */}
        {request.status === 'open' && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent backdrop-blur-sm z-40">
            <div className="max-w-4xl mx-auto grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={handleNotInterested}
                className="flex-1"
                data-testid="button-not-interested"
              >
                <ThumbsDown className="h-5 w-5 mr-2" />
                Indisponible
              </Button>
              <Button
                size="lg"
                onClick={handleInterested}
                className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg"
                data-testid="button-interested"
              >
                <ThumbsUp className="h-5 w-5 mr-2" />
                Intéressé
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Manifestez votre intérêt pour cette opportunité
            </p>
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
              className="absolute top-4 right-4 text-white"
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
