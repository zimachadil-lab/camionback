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
import { Truck, Star, MapPin, Award } from "lucide-react";
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
}

interface RecommendedTransportersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  transporters: RecommendedTransporter[];
}

export function RecommendedTransportersDialog({
  open,
  onOpenChange,
  requestId,
  transporters,
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
            <Truck className="h-6 w-6 text-primary" />
            Transporteurs disponibles
          </DialogTitle>
          <DialogDescription>
            {transporters.length > 0 ? (
              <>
                🚛 {transporters.length} transporteur{transporters.length > 1 ? "s" : ""} disponible{transporters.length > 1 ? "s" : ""} sur ce trajet.
                <br />
                Souhaitez-vous leur envoyer une notification ?
              </>
            ) : (
              "Aucun transporteur disponible pour ce trajet pour le moment."
            )}
          </DialogDescription>
        </DialogHeader>

        {transporters.length > 0 && (
          <div className="space-y-3 my-4">
            {transporters.map((transporter) => (
              <Card key={transporter.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
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
            disabled={isNotifying}
            data-testid="button-notify-later"
          >
            Non, plus tard
          </Button>
          {transporters.length > 0 && (
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
