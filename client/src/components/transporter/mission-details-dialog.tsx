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
          <div className="p-4 space-y-3">
            {/* Date de mission */}
            {missionDate && (
              <Card className="border border-border">
                <CardContent className="p-3" data-testid="mission-details-date">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary rounded-lg">
                      <Calendar className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase text-foreground/70">
                        Date de la mission
                      </p>
                      <p className="text-base font-bold text-foreground">
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
            <Card className="border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                  <MapPin className="h-4 w-4" />
                  Itinéraire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2" data-testid="mission-details-itinerary">
                <div className="flex items-start gap-2.5 p-2.5 bg-muted/50 rounded-lg">
                  <div className="p-1.5 bg-primary rounded-md mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground/60">Ville de départ</p>
                    <p className="font-bold text-sm text-foreground">{request.fromCity}</p>
                    {request.fromAddress && (
                      <p className="text-xs text-foreground/60 mt-0.5">{request.fromAddress}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 bg-muted/50 rounded-lg">
                  <div className="p-1.5 bg-orange-600 rounded-md mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground/60">Ville d'arrivée</p>
                    <p className="font-bold text-sm text-foreground">{request.toCity}</p>
                    {request.toAddress && (
                      <p className="text-xs text-foreground/60 mt-0.5">{request.toAddress}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact client */}
            <Card className="border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                  <User className="h-4 w-4" />
                  Contact Client
                </CardTitle>
              </CardHeader>
              <CardContent data-testid="mission-details-client-contact">
                <div className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2.5 flex-1">
                    <div className="p-1.5 bg-blue-600 rounded-lg">
                      <Phone className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground/60">{clientName}</p>
                      <p className="text-base font-bold text-foreground">
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
                        <Phone className="h-3.5 w-3.5 me-1.5" />
                        Appeler
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Détails de la marchandise */}
            <Card className="border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                  <Package className="h-4 w-4" />
                  Détails de la marchandise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2" data-testid="mission-details-goods">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-muted/50 rounded-lg">
                    <p className="text-xs font-medium mb-1 text-foreground/60">Type</p>
                    <div className="flex items-center gap-1.5">
                      <categoryConfig.icon className="h-5 w-5 text-primary" />
                      <p className="font-semibold text-xs text-foreground">{categoryConfig.label}</p>
                    </div>
                  </div>
                  {request.estimatedWeight && (
                    <div className="p-2.5 bg-muted/50 rounded-lg">
                      <p className="text-xs font-medium mb-1 text-foreground/60">Poids estimé</p>
                      <div className="flex items-center gap-1.5">
                        <Ruler className="h-3.5 w-3.5 text-foreground/60" />
                        <p className="font-semibold text-xs text-foreground">{request.estimatedWeight}</p>
                      </div>
                    </div>
                  )}
                </div>

                {request.manutention && (
                  <div className="p-2.5 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Warehouse className="h-3.5 w-3.5 text-foreground/60" />
                      <p className="text-xs font-medium text-foreground/60">Manutention</p>
                    </div>
                    <p className="font-semibold text-xs text-foreground">{request.manutention}</p>
                  </div>
                )}

                {request.description && (
                  <div className="p-2.5 bg-muted/50 rounded-lg">
                    <p className="text-xs font-medium mb-1.5 text-foreground/60">Description</p>
                    <p className="text-xs leading-relaxed text-foreground">{request.description}</p>
                  </div>
                )}

                {request.photos && request.photos.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewPhotos?.(request.photos, request.referenceId)}
                    className="w-full gap-2"
                    data-testid="button-view-photos-dialog"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    Voir les photos ({request.photos.length})
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Message important */}
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3" data-testid="mission-action-required">
              <div className="flex items-center gap-2 mb-1">
                <PhoneCall className="h-4 w-4 text-warning-foreground flex-shrink-0" />
                <p className="font-semibold text-sm text-warning-foreground">
                  Action requise
                </p>
              </div>
              <p className="text-xs text-warning-foreground/90">
                Contactez le client pour organiser la prise en charge de la marchandise. Le coordinateur suit l'avancement de cette mission.
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
