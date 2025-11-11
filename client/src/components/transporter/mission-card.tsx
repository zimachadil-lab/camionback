import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Phone, FileText, ArrowRight } from "lucide-react";
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
    <Card className="overflow-hidden hover-elevate border-2 border-[#0d9488]/30 shadow-lg">
      {/* Header avec numéro de commande */}
      <CardHeader className="bg-gradient-to-br from-[#0d9488] via-[#0f766e] to-[#115e59] text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
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

      <CardContent className="p-5 space-y-4">
        {/* Date de mission - Très visible */}
        {missionDate && (
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 border-2 border-teal-200 dark:border-teal-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-600 rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                  Date de la mission
                </p>
                <p className="text-lg font-bold text-teal-700 dark:text-teal-300 mt-0.5">
                  {format(new Date(missionDate), "EEEE d MMMM yyyy", { 
                    locale: i18n.language === 'ar' ? undefined : fr 
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Itinéraire - Départ et Arrivée */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950/40 dark:to-gray-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="p-2 bg-[#0d9488] rounded-lg flex-shrink-0">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Départ</p>
                <p className="text-sm font-bold text-foreground truncate">{request.fromCity}</p>
              </div>
            </div>
            
            <ArrowRight className="h-5 w-5 text-[#0d9488] flex-shrink-0" />
            
            <div className="flex items-center gap-2 flex-1">
              <div className="p-2 bg-orange-600 rounded-lg flex-shrink-0">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Arrivée</p>
                <p className="text-sm font-bold text-foreground truncate">{request.toCity}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Téléphone du client - Très visible */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2.5 bg-blue-600 rounded-lg flex-shrink-0">
                <Phone className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                  Téléphone client
                </p>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300 truncate">
                  {clientPhone}
                </p>
                <p className="text-xs text-muted-foreground">{clientName}</p>
              </div>
            </div>
            {clientPhone !== "N/A" && (
              <Button
                size="icon"
                className="flex-shrink-0 h-12 w-12 bg-blue-600 hover:bg-blue-700 text-white"
                asChild
                data-testid={`button-call-client-${request.id}`}
              >
                <a href={`tel:${clientPhone}`}>
                  <Phone className="h-5 w-5" />
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Message d'incitation */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 p-3 rounded-r-lg">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            📞 Veuillez contacter le client pour organiser la prise en charge
          </p>
        </div>

        {/* Bouton Détails */}
        <Button 
          onClick={onViewDetails}
          className="w-full h-12 bg-gradient-to-r from-[#0d9488] to-[#0f766e] hover:from-[#0f766e] hover:to-[#115e59] text-white font-semibold shadow-lg hover:shadow-xl transition-all"
          data-testid={`button-view-mission-details-${request.id}`}
        >
          <FileText className="h-5 w-5 me-2" />
          Voir les détails de la mission
        </Button>
      </CardContent>
    </Card>
  );
}
