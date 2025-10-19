import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface ContactWhatsAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactWhatsAppDialog({ open, onOpenChange }: ContactWhatsAppDialogProps) {
  const handleWhatsAppClick = () => {
    window.open("https://wa.me/212664373534", "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            💬 Contactez-nous facilement
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Besoin d'aide ? Écrivez-nous directement sur WhatsApp.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#25D366]/10 mb-4">
              <MessageCircle className="h-10 w-10 text-[#25D366]" />
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Notre équipe est disponible pour répondre à toutes vos questions
            </p>
          </div>

          <Button
            onClick={handleWhatsAppClick}
            className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-white gap-2 h-12 text-base shadow-lg"
            data-testid="button-whatsapp"
          >
            <MessageCircle className="h-5 w-5" />
            Ouvrir WhatsApp
          </Button>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              +212 664 37 35 34
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
