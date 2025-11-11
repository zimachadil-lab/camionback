import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Phone, FileText, ArrowRight, PhoneCall } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface MissionCardProps {
  request: any;
  onViewDetails: () => void;
}

export function MissionCard({ request, onViewDetails }: MissionCardProps) {
  const { t, i18n } = useTranslation();
  
  const clientPhone = request.client?.phoneNumber || request.clientPhone || "N/A";
  const clientName = request.client?.name || request.clientName || t('shared.labels.client');
  const missionDate = request.pickupDate || request.deliveryDate;

  return (
    <Card className="overflow-hidden hover-elevate shadow-lg">
      {/* Header avec numéro de commande */}
      <CardHeader className="bg-gradient-to-br from-[#0d9488] via-[#0f766e] to-[#115e59] text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2" data-testid={`mission-reference-${request.id}`}>
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-white/80 font-medium">Commande</p>
              <h3 className="text-xl font-bold">{request.referenceId}</h3>
            </div>
          </div>
          {request.paymentStatus === "awaiting_payment" && (
            <Badge className="bg-orange-500 text-white border-0">
              En attente paiement
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {/* Date de mission */}
        {missionDate && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3" data-testid={`mission-date-${request.id}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Calendar className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
                  Date de la mission
                </p>
                <p className="text-base font-bold text-foreground mt-0.5">
                  {format(new Date(missionDate), "EEEE d MMMM yyyy", { 
                    locale: i18n.language === 'ar' ? undefined : fr 
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Itinéraire */}
        <div className="bg-muted/50 border border-border rounded-lg p-3" data-testid={`mission-itinerary-${request.id}`}>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1">
              <div className="p-1.5 bg-primary rounded-md flex-shrink-0">
                <MapPin className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-foreground/60 font-medium">Départ</p>
                <p className="text-sm font-semibold text-foreground truncate">{request.fromCity}</p>
              </div>
            </div>
            
            <ArrowRight className="h-4 w-4 text-primary flex-shrink-0" />
            
            <div className="flex items-center gap-2 flex-1">
              <div className="p-1.5 bg-orange-600 rounded-md flex-shrink-0">
                <MapPin className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-foreground/60 font-medium">Arrivée</p>
                <p className="text-sm font-semibold text-foreground truncate">{request.toCity}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Téléphone du client */}
        <div className="bg-card border border-border rounded-lg p-3" data-testid={`mission-client-phone-${request.id}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="p-2 bg-blue-600 rounded-lg flex-shrink-0">
                <Phone className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
                  Téléphone client
                </p>
                <p className="text-base font-bold text-foreground truncate">
                  {clientPhone}
                </p>
                <p className="text-xs text-foreground/60">{clientName}</p>
              </div>
            </div>
            {clientPhone !== "N/A" && (
              <a href={`tel:${clientPhone}`} data-testid={`button-call-client-${request.id}`}>
                <Button
                  size="icon"
                  variant="default"
                  className="flex-shrink-0 h-11 w-11 bg-blue-600"
                >
                  <Phone className="h-4 w-4" />
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* Message d'incitation */}
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3" data-testid={`mission-contact-reminder-${request.id}`}>
          <div className="flex items-center gap-2">
            <PhoneCall className="h-4 w-4 text-warning-foreground flex-shrink-0" />
            <p className="text-sm font-medium text-warning-foreground">
              Veuillez contacter le client pour organiser la prise en charge
            </p>
          </div>
        </div>

        {/* Bouton Détails */}
        <Button 
          onClick={onViewDetails}
          variant="default"
          className="w-full h-11 bg-primary font-semibold"
          data-testid={`button-view-mission-details-${request.id}`}
        >
          <FileText className="h-4 w-4 me-2" />
          Voir les détails
        </Button>
      </CardContent>
    </Card>
  );
}
