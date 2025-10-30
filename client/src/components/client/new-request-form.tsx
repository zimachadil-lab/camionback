import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Upload, MapPin } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { RecommendedTransportersDialog } from "./recommended-transporters-dialog";
import { useAuth } from "@/lib/auth-context";

const requestSchema = z.object({
  fromCity: z.string().min(2, "Ville de départ requise"),
  toCity: z.string().min(2, "Ville d'arrivée requise"),
  description: z.string().min(10, "Description minimale: 10 caractères"),
  goodsType: z.string().min(1, "Type de marchandise requis"),
  dateTime: z.string().optional(),
  dateFlexible: z.boolean().default(false),
  invoiceRequired: z.boolean().default(false),
  budget: z.string().optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

const goodsTypes = [
  "Meubles", "Électroménager", "Marchandises", "Déménagement",
  "Matériaux de construction", "Colis", "Véhicule", "Autre"
];

export function NewRequestForm({ onSuccess }: { onSuccess?: () => void }) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [showRecommendationsDialog, setShowRecommendationsDialog] = useState(false);
  const [recommendedTransporters, setRecommendedTransporters] = useState<any[]>([]);
  const [createdRequestId, setCreatedRequestId] = useState<string>("");
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch cities from API
  const { data: cities = [], isLoading: citiesLoading } = useQuery({
    queryKey: ["/api/cities"],
    queryFn: async () => {
      const response = await fetch("/api/cities");
      return response.json();
    },
  });

  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      fromCity: "",
      toCity: "",
      description: "",
      goodsType: "",
      dateTime: "",
      dateFlexible: false,
      invoiceRequired: false,
      budget: "",
    },
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const onSubmit = async (data: RequestFormData) => {
    try {
      if (!user?.id) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Vous devez être connecté pour créer une demande",
        });
        return;
      }
      
      // Convert photos to base64
      const photoBase64Promises = photos.map(photo => convertToBase64(photo));
      const photoBase64Array = await Promise.all(photoBase64Promises);
      
      // Clean up optional fields - don't send empty strings
      const payload: any = {
        fromCity: data.fromCity,
        toCity: data.toCity,
        description: data.description,
        goodsType: data.goodsType,
        clientId: user.id,
        dateTime: data.dateTime ? new Date(data.dateTime).toISOString() : new Date().toISOString(),
        dateFlexible: data.dateFlexible,
        invoiceRequired: data.invoiceRequired,
        photos: photoBase64Array,
      };
      
      if (data.budget) {
        payload.budget = data.budget;
      }
      
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) throw new Error();
      
      const createdRequest = await response.json();
      setCreatedRequestId(createdRequest.id);
      
      toast({
        title: "Demande créée",
        description: "Votre demande de transport a été publiée avec succès",
      });
      
      // Fetch recommended transporters
      try {
        const recommendationsResponse = await fetch(
          `/api/requests/${createdRequest.id}/recommended-transporters`
        );
        if (recommendationsResponse.ok) {
          const recommendationsData = await recommendationsResponse.json();
          setRecommendedTransporters(recommendationsData.transporters || []);
          setShowRecommendationsDialog(true);
        } else {
          // If recommendations fail, still call onSuccess
          form.reset();
          setPhotos([]);
          onSuccess?.();
        }
      } catch (err) {
        console.error("Failed to fetch recommendations:", err);
        // If recommendations fail, still call onSuccess
        form.reset();
        setPhotos([]);
        onSuccess?.();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de création de la demande",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Nouvelle demande de transport</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="fromCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ville de départ</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-from-city">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {citiesLoading ? (
                          <div className="p-2 text-sm text-muted-foreground">Chargement...</div>
                        ) : (
                          cities.map((city: any) => (
                            <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="toCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ville d'arrivée</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-to-city">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {citiesLoading ? (
                          <div className="p-2 text-sm text-muted-foreground">Chargement...</div>
                        ) : (
                          cities.map((city: any) => (
                            <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="goodsType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de marchandise</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-goods-type">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {goodsTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Décrivez votre demande de transport..."
                      className="min-h-24"
                      data-testid="input-description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget (optionnel)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ex: 500 MAD" 
                      data-testid="input-budget"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date et heure souhaitées (optionnel)</FormLabel>
                  <FormControl>
                    <Input 
                      type="datetime-local" 
                      data-testid="input-datetime"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 grid-cols-2">
              <FormField
                control={form.control}
                name="dateFlexible"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-date-flexible"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">
                        Date flexible
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invoiceRequired"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-invoice-required"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">
                        Besoin d'une facture TTC
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Photos (optionnel)</label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover-elevate cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                  data-testid="input-photos"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {photos.length > 0 
                      ? `${photos.length} photo(s) sélectionnée(s)` 
                      : "Cliquez pour ajouter des photos"}
                  </p>
                </label>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" data-testid="button-create-request">
              Publier la demande
            </Button>
          </form>
        </Form>
      </CardContent>

      <RecommendedTransportersDialog
        open={showRecommendationsDialog}
        onOpenChange={(open) => {
          setShowRecommendationsDialog(open);
          // Call onSuccess when dialog closes
          if (!open) {
            form.reset();
            setPhotos([]);
            onSuccess?.();
          }
        }}
        requestId={createdRequestId}
        transporters={recommendedTransporters}
      />
    </Card>
  );
}
