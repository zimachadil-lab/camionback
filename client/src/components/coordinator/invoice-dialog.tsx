import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, User, Truck, MapPin, Package, Calendar, Wrench, CreditCard } from "lucide-react";
import { InvoiceData, formatHandlingDetails, formatCurrency } from "@/lib/invoice-utils";
import { InvoicePdfDocument } from "./invoice-pdf-document";
import { pdf } from '@react-pdf/renderer';
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface InvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  invoice: InvoiceData | null;
}

export function InvoiceDialog({ open, onClose, invoice }: InvoiceDialogProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    
    try {
      setIsGenerating(true);
      
      // Generate PDF blob
      const blob = await pdf(<InvoicePdfDocument invoice={invoice} />).toBlob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Facture-${invoice.requestReference}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "✅ Facture téléchargée",
        description: `Le fichier Facture-${invoice.requestReference}.pdf a été téléchargé avec succès.`,
      });
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      toast({
        title: "❌ Erreur",
        description: "Impossible de générer le PDF. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-6 w-6 text-[#0d9488]" />
            <span>Facture de Prestation</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header Card with Invoice Info */}
          <Card className="bg-gradient-to-br from-[#0d9488]/5 to-[#0d9488]/10 border-[#0d9488]/20">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Numéro de facture</p>
                  <p className="text-lg font-bold text-[#0d9488]" data-testid="text-invoice-number">{invoice.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-semibold" data-testid="text-invoice-date">{invoice.invoiceDate}</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Référence commande</p>
                <p className="font-semibold" data-testid="text-request-reference">{invoice.requestReference}</p>
              </div>
            </CardContent>
          </Card>

          {/* Client & Transporter Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Client Info */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-sm">CLIENT</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Nom</p>
                    <p className="font-medium" data-testid="text-client-name">{invoice.clientName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Téléphone</p>
                    <p className="font-medium" data-testid="text-client-phone">{invoice.clientPhone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Ville</p>
                    <p className="font-medium">{invoice.clientCity}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transporter Info */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#0d9488]/10 flex items-center justify-center">
                    <Truck className="h-4 w-4 text-[#0d9488]" />
                  </div>
                  <h3 className="font-semibold text-sm">TRANSPORTEUR</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Nom</p>
                    <p className="font-medium" data-testid="text-transporter-name">{invoice.transporterName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Téléphone</p>
                    <p className="font-medium" data-testid="text-transporter-phone">{invoice.transporterPhone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Ville</p>
                    <p className="font-medium">{invoice.transporterCity}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transport Details */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#0d9488]" />
                <h3 className="font-semibold">Détails du Transport</h3>
              </div>
              <Separator />
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Ville de départ</p>
                  <p className="font-medium">{invoice.fromCity}</p>
                  {invoice.departureAddress && (
                    <p className="text-xs text-muted-foreground mt-1">{invoice.departureAddress}</p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Ville d'arrivée</p>
                  <p className="font-medium">{invoice.toCity}</p>
                  {invoice.arrivalAddress && (
                    <p className="text-xs text-muted-foreground mt-1">{invoice.arrivalAddress}</p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Date de prise en charge</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {invoice.pickupDate}
                  </p>
                </div>
                {invoice.distance && (
                  <div>
                    <p className="text-muted-foreground text-xs">Distance estimée</p>
                    <p className="font-medium">{invoice.distance} km</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Goods Description */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-[#0d9488]" />
                <h3 className="font-semibold">Description de la Marchandise</h3>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Type de marchandise</p>
                  <Badge variant="secondary" className="mt-1">{invoice.goodsType}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Description</p>
                  <p className="font-medium">{invoice.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Handling Details */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-[#0d9488]" />
                <h3 className="font-semibold">Manutention</h3>
              </div>
              <Separator />
              <div className="text-sm">
                <p className="font-medium">{formatHandlingDetails(invoice)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Total Amount */}
          <Card className="bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-950/20 dark:to-teal-950/20 border-2 border-[#0d9488]/30">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">MONTANT TOTAL À PAYER</p>
                  <p className="text-3xl font-bold text-[#0d9488]" data-testid="text-total-amount">
                    {formatCurrency(invoice.totalAmount)}
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full bg-[#0d9488]/10 flex items-center justify-center">
                  <CreditCard className="h-8 w-8 text-[#0d9488]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Instructions */}
          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-amber-200 dark:border-amber-900/30">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-amber-700 dark:text-amber-500" />
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">Instructions de Paiement</h3>
              </div>
              <Separator className="bg-amber-200 dark:bg-amber-900/30" />
              <div className="space-y-2 text-sm text-amber-900 dark:text-amber-100">
                <p><span className="font-semibold">Mode de paiement:</span> {invoice.paymentMethod}</p>
                <p>{invoice.paymentInstructions}</p>
                <p><span className="font-semibold">À libeller au nom de:</span> CamionBack</p>
                
                <div className="mt-3 p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg border border-amber-300 dark:border-amber-800">
                  <p className="text-xs font-semibold mb-1 text-amber-800 dark:text-amber-400">RIB (Relevé d'Identité Bancaire)</p>
                  <p className="text-base font-mono font-bold tracking-wider text-amber-900 dark:text-amber-100" data-testid="text-rib">
                    {invoice.rib}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="flex-1 bg-gradient-to-r from-[#0d9488] to-[#0e9f8e] hover:from-[#0c8279] hover:to-[#0d8d7d] text-white font-semibold"
              data-testid="button-download-pdf"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? "Génération en cours..." : "Télécharger en PDF"}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              data-testid="button-close-invoice"
            >
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
