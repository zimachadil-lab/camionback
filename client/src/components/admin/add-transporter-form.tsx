import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MOROCCAN_CITIES = [
  "Casablanca", "Rabat", "Fès", "Marrakech", "Tanger", "Agadir",
  "Meknès", "Oujda", "Kenitra", "Tétouan", "Safi", "El Jadida",
  "Nador", "Béni Mellal", "Khouribga"
];

const transporterSchema = z.object({
  phoneNumber: z.string().min(9, "Numéro de téléphone requis (9 chiffres)"),
  name: z.string().min(2, "Nom requis"),
  city: z.string().min(1, "Ville requise"),
  pin: z.string().regex(/^\d{6}$/, "Le code PIN doit contenir exactement 6 chiffres"),
  truckPhoto: z.instanceof(File, { message: "Photo du camion requise" }),
});

type TransporterFormData = z.infer<typeof transporterSchema>;

interface AddTransporterFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddTransporterForm({ open, onClose, onSuccess }: AddTransporterFormProps) {
  const { toast } = useToast();

  const form = useForm<TransporterFormData>({
    resolver: zodResolver(transporterSchema),
    defaultValues: {
      phoneNumber: "",
      name: "",
      city: "",
      pin: "",
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("truckPhoto", file);
    }
  };

  const onSubmit = async (data: TransporterFormData) => {
    try {
      // Format phone number with +212 prefix
      const fullPhoneNumber = `+212${data.phoneNumber.replace(/\s/g, "")}`;
      
      // Step 1: Register the transporter with PIN
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: fullPhoneNumber,
          pin: data.pin,
        }),
      });

      if (!registerResponse.ok) {
        const error = await registerResponse.json();
        throw new Error(error.error || "Erreur lors de l'inscription");
      }

      const { user } = await registerResponse.json();

      // Step 2: Set role to transporter
      const roleResponse = await fetch("/api/auth/select-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          role: "transporter",
        }),
      });

      if (!roleResponse.ok) throw new Error("Erreur lors de la sélection du rôle");

      // Step 3: Complete profile with name, city, and photo
      const formData = new FormData();
      formData.append("userId", user.id);
      formData.append("name", data.name);
      formData.append("city", data.city);
      formData.append("truckPhoto", data.truckPhoto);

      const profileResponse = await fetch("/api/auth/complete-profile", {
        method: "POST",
        body: formData,
      });

      if (!profileResponse.ok) throw new Error("Erreur lors de la complétion du profil");

      const { user: updatedUser } = await profileResponse.json();

      // Step 4: Validate the transporter immediately (admin adds validated transporters)
      const validateResponse = await fetch(`/api/admin/validate-driver/${updatedUser.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true }),
      });

      if (!validateResponse.ok) throw new Error("Erreur lors de la validation");

      toast({
        title: "Transporteur ajouté",
        description: `${data.name} a été ajouté et validé avec succès`,
      });

      form.reset();
      onClose();
      onSuccess?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Échec de l'ajout du transporteur",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Ajouter un transporteur</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ville de résidence</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-transporter-city">
                        <SelectValue placeholder="Sélectionnez une ville" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MOROCCAN_CITIES.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code PIN (6 chiffres)</FormLabel>
                  <FormControl>
                    <Input 
                      type="password"
                      placeholder="••••••"
                      maxLength={6}
                      data-testid="input-transporter-pin"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="truckPhoto"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Photo du camion</FormLabel>
                  <FormControl>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover-elevate cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          handlePhotoChange(e);
                          const file = e.target.files?.[0];
                          if (file) onChange(file);
                        }}
                        className="hidden"
                        id="truck-photo-upload"
                        data-testid="input-truck-photo"
                        {...field}
                      />
                      <label htmlFor="truck-photo-upload" className="cursor-pointer">
                        <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {value?.name || "Cliquez pour ajouter une photo"}
                        </p>
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
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
                data-testid="button-submit-transporter"
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
