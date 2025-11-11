import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MapPin, 
  Package, 
  Calendar, 
  FileText, 
  Phone,
  Ruler,
  Warehouse,
  Image as ImageIcon,
  User,
  PhoneCall
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { getCategoryConfig } from "@/lib/goods-category-config";

interface MissionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: any;
  onViewPhotos?: (photos: string[], referenceId: string) => void;
}

export function MissionDetailsDialog({ 
  open, 
  onOpenChange, 
  request,
  onViewPhotos 
}: MissionDetailsDialogProps) {
  const { t, i18n } = useTranslation();
  
  if (!request) return null;

  const categoryConfig = getCategoryConfig(request.goodsType);
  const clientPhone = request.client?.phoneNumber || request.clientPhone || "N/A";
  const clientName = request.client?.name || request.clientName || t('shared.labels.client');
  const missionDate = request.pickupDate || request.deliveryDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="bg-gradient-to-br from-[#0d9488] via-[#0f766e] to-[#115e59] text-white p-6 pb-4">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <FileText className="h-6 w-6" />
            </div>
            Détails de la Mission
          </DialogTitle>
          <p className="text-white/90 text-sm mt-1">Commande {request.referenceId}</p>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="p-6 space-y-4">
            {/* Date de mission */}
            {missionDate && (
              <Card className="border-2 border-teal-200 dark:border-teal-800">
                <CardContent className="p-4" data-testid="mission-details-date">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-teal-600 to-emerald-600 rounded-lg">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-semibold uppercase">
                        Date de la mission
                      </p>
                      <p className="text-lg font-bold text-teal-700 dark:text-teal-300">
                        {format(new Date(missionDate), "EEEE d MMMM yyyy", { 
                          locale: i18n.language === 'ar' ? undefined : fr 
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Itinéraire */}
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <MapPin className="h-5 w-5" />
                  Itinéraire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3" data-testid="mission-details-itinerary">
                <div className="flex items-start gap-3 p-3 bg-teal-50 dark:bg-teal-950/20 rounded-lg">
                  <div className="p-2 bg-teal-600 rounded-lg mt-0.5">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground font-medium">Ville de départ</p>
                    <p className="font-bold text-base">{request.fromCity}</p>
                    {request.fromAddress && (
                      <p className="text-sm text-muted-foreground mt-1">{request.fromAddress}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <div className="p-2 bg-orange-600 rounded-lg mt-0.5">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground font-medium">Ville d'arrivée</p>
                    <p className="font-bold text-base">{request.toCity}</p>
                    {request.toAddress && (
                      <p className="text-sm text-muted-foreground mt-1">{request.toAddress}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informations client */}
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <User className="h-5 w-5" />
                  Contact Client
                </CardTitle>
              </CardHeader>
              <CardContent data-testid="mission-details-client-contact">
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <Phone className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{clientName}</p>
                      <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                        {clientPhone}
                      </p>
                    </div>
                  </div>
                  {clientPhone !== "N/A" && (
                    <a href={`tel:${clientPhone}`}>
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-blue-600"
                        data-testid="button-call-client-dialog"
                      >
                        <Phone className="h-4 w-4 me-2" />
                        Appeler
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Détails de la marchandise */}
            <Card className="border-2 border-purple-200 dark:border-purple-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <Package className="h-5 w-5" />
                  Détails de la marchandise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3" data-testid="mission-details-goods">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Type</p>
                    <div className="flex items-center gap-2">
                      <categoryConfig.icon className="h-6 w-6 text-primary" />
                      <p className="font-semibold text-sm">{categoryConfig.label}</p>
                    </div>
                  </div>
                  {request.estimatedWeight && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-lg">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Poids estimé</p>
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-muted-foreground" />
                        <p className="font-semibold">{request.estimatedWeight}</p>
                      </div>
                    </div>
                  )}
                </div>

                {request.manutention && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Warehouse className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground font-medium">Manutention</p>
                    </div>
                    <p className="font-semibold">{request.manutention}</p>
                  </div>
                )}

                {request.description && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium mb-2">Description</p>
                    <p className="text-sm leading-relaxed">{request.description}</p>
                  </div>
                )}

                {request.photos && request.photos.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => onViewPhotos?.(request.photos, request.referenceId)}
                    className="w-full gap-2"
                    data-testid="button-view-photos-dialog"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Voir les photos ({request.photos.length})
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Message important */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 p-4 rounded-r-lg" data-testid="mission-action-required">
              <div className="flex items-center gap-2 mb-1">
                <PhoneCall className="h-4 w-4 text-amber-600" />
                <p className="font-semibold text-amber-800 dark:text-amber-200">
                  Action requise
                </p>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Contactez le client pour organiser la prise en charge de la marchandise. Le coordinateur suit l'avancement de cette mission.
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
