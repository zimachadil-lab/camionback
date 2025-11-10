import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Truck, Star, MapPin, Award, Loader2, Search } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RecommendedTransporter {
  id: string;
  name: string | null;
  city: string | null;
  rating: number;
  totalTrips: number;
  availabilityType: string;
  truckPhoto?: string | null;
}

interface RecommendedTransportersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  transporters: RecommendedTransporter[];
  isLoading?: boolean;
}

export function RecommendedTransportersDialog({
  open,
  onOpenChange,
  requestId,
  transporters,
  isLoading = false,
}: RecommendedTransportersDialogProps) {
  const { toast } = useToast();
  const [isNotifying, setIsNotifying] = useState(false);

  const notifyMutation = useMutation({
    mutationFn: async () => {
      const transporterIds = transporters.map(t => t.id);
      return apiRequest("POST", `/api/requests/${requestId}/notify-transporters`, {
        transporterIds,
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Notifications envoyées",
        description: data.message || "Les transporteurs ont été notifiés",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de l'envoi des notifications",
      });
    },
  });

  const handleNotify = async () => {
    setIsNotifying(true);
    await notifyMutation.mutateAsync();
    setIsNotifying(false);
  };

  const handleLater = () => {
    onOpenChange(false);
  };

  const getAvailabilityLabel = (type: string) => {
    switch (type) {
      case "retour":
        return "Retour annoncé";
      case "ville_residence":
        return "Ville de résidence";
      case "top_rated":
        return "Mieux noté";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isLoading ? (
              <>
                <Search className="h-6 w-6 text-primary animate-pulse" />
                Recherche en cours...
              </>
            ) : (
              <>
                <Truck className="h-6 w-6 text-primary" />
                Transporteurs disponibles
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isLoading ? (
              "Analyse des meilleurs transporteurs pour votre trajet..."
            ) : transporters.length > 0 ? (
              <>
                {transporters.length} transporteur{transporters.length > 1 ? "s" : ""} disponible{transporters.length > 1 ? "s" : ""} sur ce trajet.
                <br />
                Souhaitez-vous leur envoyer une notification ?
              </>
            ) : (
              "Aucun transporteur disponible pour ce trajet pour le moment."
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <Truck className="h-8 w-8 text-primary/40 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center space-y-2">
              <p className="font-medium text-lg">
                Recherche des meilleurs transporteurs
              </p>
              <p className="text-sm text-muted-foreground max-w-md">
                Notre système analyse les transporteurs disponibles, leurs retours annoncés, et leur historique pour vous proposer les meilleures options.
              </p>
            </div>
          </div>
        ) : transporters.length > 0 && (
          <div className="space-y-3 my-4">
            {transporters.map((transporter) => (
              <Card key={transporter.id} className="p-4">
                <div className="flex items-start gap-3">
                  {/* Photo du camion */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#0a2540] via-[#1d3c57] to-[#17cfcf]/20 flex items-center justify-center">
                    {transporter.truckPhoto ? (
                      <img
                        src={transporter.truckPhoto}
                        alt={`Camion de ${transporter.name || 'transporteur'}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Truck className="w-10 h-10 text-[#17cfcf] opacity-40" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">
                        {transporter.name || "Transporteur"}
                      </h4>
                      {transporter.availabilityType === "retour" && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <Award className="h-3 w-3 mr-1" />
                          {getAvailabilityLabel(transporter.availabilityType)}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      {transporter.city && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {transporter.city}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium text-foreground">
                          {transporter.rating.toFixed(1)}
                        </span>
                      </div>

                      <div className="text-xs">
                        {transporter.totalTrips} trajet{transporter.totalTrips > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleLater}
            disabled={isNotifying || isLoading}
            data-testid="button-notify-later"
          >
            {isLoading ? "Veuillez patienter..." : "Non, plus tard"}
          </Button>
          {!isLoading && transporters.length > 0 && (
            <Button
              onClick={handleNotify}
              disabled={isNotifying}
              data-testid="button-notify-now"
            >
              {isNotifying ? "Envoi en cours..." : "Oui, notifier"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
