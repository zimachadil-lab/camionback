import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, FileText, CheckCircle, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface PaidInvoiceCardProps {
  request: any;
}

export function PaidInvoiceCard({ request }: PaidInvoiceCardProps) {
  const { i18n } = useTranslation();
  
  const paymentDate = request.paymentDate || request.updatedAt;

  return (
    <Card className="overflow-hidden shadow-lg">
      {/* Header avec badge paiement effectué */}
      <CardHeader className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2" data-testid={`paid-invoice-reference-${request.id}`}>
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-white/80 font-medium">Facture</p>
              <h3 className="text-xl font-bold">{request.referenceId}</h3>
            </div>
          </div>
          <Badge className="bg-white/90 text-emerald-700 border-0 font-bold">
            Paiement effectué
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {/* Date de paiement */}
        {paymentDate && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3" data-testid={`paid-invoice-date-${request.id}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600 rounded-lg">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
                  Date de paiement
                </p>
                <p className="text-base font-bold text-foreground mt-0.5">
                  {format(new Date(paymentDate), "EEEE d MMMM yyyy", { 
                    locale: i18n.language === 'ar' ? undefined : fr 
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Itinéraire */}
        <div className="bg-muted/50 border border-border rounded-lg p-3" data-testid={`paid-invoice-itinerary-${request.id}`}>
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

        {/* Montant si disponible */}
        {request.acceptedOffer?.amount && (
          <div className="bg-card border border-border rounded-lg p-3" data-testid={`paid-invoice-amount-${request.id}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
                  Montant facturé
                </p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {request.acceptedOffer.amount} MAD
                </p>
              </div>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>
        )}

        {/* Message de confirmation */}
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3" data-testid={`paid-invoice-confirmation-${request.id}`}>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
              Cette facture a été payée et archivée
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
