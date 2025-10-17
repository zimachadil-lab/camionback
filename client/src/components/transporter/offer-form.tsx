import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const offerSchema = z.object({
  amount: z.string().min(1, "Montant requis").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Montant invalide",
  }),
  message: z.string().optional(),
});

type OfferFormData = z.infer<typeof offerSchema>;

interface OfferFormProps {
  open: boolean;
  onClose: () => void;
  requestId: string;
  onSuccess?: () => void;
}

export function OfferForm({ open, onClose, requestId, onSuccess }: OfferFormProps) {
  const { toast } = useToast();

  const form = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      amount: "",
      message: "",
    },
  });

  const onSubmit = async (data: OfferFormData) => {
    try {
      const user = JSON.parse(localStorage.getItem("camionback_user") || "{}");
      
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          transporterId: user.id,
          amount: data.amount,
          message: data.message,
        }),
      });
      
      if (!response.ok) throw new Error();
      
      toast({
        title: "Offre envoyée",
        description: "Votre offre a été envoyée au client avec succès",
      });
      
      form.reset();
      onClose();
      onSuccess?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec d'envoi de l'offre",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Faire une offre</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant (MAD)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="500" 
                      data-testid="input-offer-amount"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Ajoutez un message pour le client..."
                      className="min-h-24"
                      data-testid="input-offer-message"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
                data-testid="button-cancel-offer"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                data-testid="button-submit-offer"
              >
                Envoyer l'offre
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
