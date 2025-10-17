import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MOROCCAN_CITIES = [
  "Casablanca",
  "Rabat",
  "Fès",
  "Marrakech",
  "Tanger",
  "Agadir",
  "Meknès",
  "Oujda",
  "Kenitra",
  "Tétouan",
  "Safi",
  "El Jadida",
  "Nador",
  "Béni Mellal",
  "Khouribga"
];

const profileSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  city: z.string().min(1, "Veuillez sélectionner une ville"),
  truckPhoto: z.instanceof(File, { message: "La photo du camion est obligatoire" }),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function CompleteProfile() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const user = JSON.parse(localStorage.getItem("camionback_user") || "{}");

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      city: "",
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("truckPhoto", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("userId", user.id);
      formData.append("name", data.name);
      formData.append("city", data.city);
      formData.append("truckPhoto", data.truckPhoto);

      const response = await fetch("/api/auth/complete-profile", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to complete profile");
      }

      const result = await response.json();
      
      // Update localStorage with new user data
      localStorage.setItem("camionback_user", JSON.stringify(result.user));

      toast({
        title: "Profil complété",
        description: "Votre profil est en cours de validation par notre équipe",
      });

      // Redirect to home, which will route to transporter dashboard
      setLocation("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de la complétion du profil",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Truck className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Complétez votre profil</CardTitle>
          <CardDescription>
            Remplissez ces informations pour commencer à proposer vos services
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                        {...field} 
                        data-testid="input-name"
                      />
                    </FormControl>
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
                        <SelectTrigger data-testid="select-city">
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

              <div className="space-y-2">
                <FormLabel>Numéro de téléphone</FormLabel>
                <Input 
                  value={user.phoneNumber || ""} 
                  disabled 
                  className="bg-muted"
                  data-testid="input-phone-disabled"
                />
                <p className="text-xs text-muted-foreground">
                  Le numéro de téléphone ne peut pas être modifié
                </p>
              </div>

              <FormField
                control={form.control}
                name="truckPhoto"
                render={({ field: { value, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Photo du camion *</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <div className="border-2 border-dashed rounded-lg p-6 text-center hover-elevate active-elevate-2 cursor-pointer transition-all">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="hidden"
                            id="truck-photo"
                            data-testid="input-truck-photo"
                          />
                          <label htmlFor="truck-photo" className="cursor-pointer">
                            {previewUrl ? (
                              <img 
                                src={previewUrl} 
                                alt="Aperçu camion" 
                                className="max-h-48 mx-auto rounded-lg"
                              />
                            ) : (
                              <div className="space-y-2">
                                <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                  Cliquez pour télécharger une photo de votre camion
                                </p>
                              </div>
                            )}
                          </label>
                        </div>
                        {previewUrl && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPreviewUrl(null);
                              form.setValue("truckPhoto", undefined as any);
                            }}
                            data-testid="button-remove-photo"
                          >
                            Changer la photo
                          </Button>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                size="lg" 
                disabled={loading}
                data-testid="button-submit-profile"
              >
                {loading ? "Enregistrement..." : "Soumettre mon profil"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
