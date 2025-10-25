import { useState } from "react";
import { Share2, Copy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface ShareCommandButtonProps {
  commandId: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ShareCommandButton({
  commandId,
  variant = "ghost",
  size = "icon",
}: ShareCommandButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const commandUrl = `${window.location.origin}/commande/${commandId}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `🚛 Nouvelle commande CamionBack : ${commandUrl}`
  )}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(commandUrl);
      toast({
        title: "Lien copié avec succès ✅",
        description: "Le lien de la commande a été copié dans le presse-papiers",
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien",
        variant: "destructive",
      });
    }
  };

  const handleWhatsAppShare = () => {
    window.open(whatsappUrl, "_blank");
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        data-testid={`button-share-${commandId}`}
        className="hover-elevate active-elevate-2"
      >
        <Share2 className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="sm:max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Partager cette commande
            </DialogTitle>
            <DialogDescription>
              Partagez le lien de cette commande avec d'autres utilisateurs
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={handleCopyLink}
              className="w-full justify-start gap-2"
              variant="outline"
              data-testid={`button-copy-link-${commandId}`}
            >
              <Copy className="h-4 w-4" />
              Copier le lien
            </Button>

            <Button
              onClick={handleWhatsAppShare}
              className="w-full justify-start gap-2 bg-[#25D366] hover:bg-[#20BA5A] text-white"
              data-testid={`button-whatsapp-share-${commandId}`}
            >
              <MessageCircle className="h-4 w-4" />
              Partager sur WhatsApp
            </Button>
          </div>

          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-xs text-muted-foreground break-all">
              {commandUrl}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
