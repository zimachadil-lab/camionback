import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Truck } from "lucide-react";

const offerSchema = z.object({
  amount: z.string().min(1, "Montant requis").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Montant invalide",
  }),
  pickupDate: z.string().min(1, "Date de prise en charge requise"),
  loadType: z.enum(["return", "shared"], {
    required_error: "Type de chargement requis",
  }),
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
      pickupDate: "",
      loadType: undefined,
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
          pickupDate: data.pickupDate,
          loadType: data.loadType,
        }),
      });
      
      if (!response.ok) {
        if (response.status === 409) {
          const errorData = await response.json();
          toast({
            variant: "destructive",
            title: "Offre déjà soumise",
            description: errorData.error || "Vous avez déjà soumis une offre pour cette demande",
          });
          onClose();
          return;
        }
        throw new Error();
      }
      
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
              name="pickupDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date de prise en charge
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      data-testid="input-offer-pickup-date"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="loadType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Type de chargement
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-2"
                      data-testid="radio-group-load-type"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="return" data-testid="radio-load-type-return" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Retour (camion vide qui rentre)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="shared" data-testid="radio-load-type-shared" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Groupage / Partagé
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
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
