import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const transporterSchema = z.object({
  phoneNumber: z.string().min(10, "Numéro de téléphone requis"),
  name: z.string().min(2, "Nom requis"),
});

type TransporterFormData = z.infer<typeof transporterSchema>;

interface AddTransporterFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddTransporterForm({ open, onClose, onSuccess }: AddTransporterFormProps) {
  const [truckPhotos, setTruckPhotos] = useState<File[]>([]);
  const { toast } = useToast();

  const form = useForm<TransporterFormData>({
    resolver: zodResolver(transporterSchema),
    defaultValues: {
      phoneNumber: "",
      name: "",
    },
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setTruckPhotos(Array.from(e.target.files));
    }
  };

  const onSubmit = async (data: TransporterFormData) => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: data.phoneNumber,
          role: "transporter",
          name: data.name,
          truckPhotos: [],
          rating: null,
          totalTrips: null,
          isActive: null,
        }),
      });
      
      if (!response.ok) throw new Error();
      
      toast({
        title: "Transporteur ajouté",
        description: "Le transporteur a été ajouté avec succès",
      });
      
      form.reset();
      setTruckPhotos([]);
      onClose();
      onSuccess?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de l'ajout du transporteur",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Ajouter un transporteur</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom complet</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ahmed El Mansouri" 
                      data-testid="input-transporter-name"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numéro de téléphone</FormLabel>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      +212
                    </span>
                    <Input 
                      type="tel"
                      placeholder="6 12 34 56 78"
                      className="pl-16"
                      data-testid="input-transporter-phone"
                      {...field} 
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium">Photos du camion</label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover-elevate cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="truck-photo-upload"
                  data-testid="input-truck-photos"
                />
                <label htmlFor="truck-photo-upload" className="cursor-pointer">
                  <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {truckPhotos.length > 0 
                      ? `${truckPhotos.length} photo(s) sélectionnée(s)` 
                      : "Cliquez pour ajouter des photos"}
                  </p>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
                data-testid="button-cancel-transporter"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                data-testid="button-add-transporter"
              >
                Ajouter
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
