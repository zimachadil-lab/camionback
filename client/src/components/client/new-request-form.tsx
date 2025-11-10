import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar, Upload, MapPin, Loader2, Info, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { RecommendedTransportersDialog } from "./recommended-transporters-dialog";
import { useAuth } from "@/lib/auth-context";
import { MetaPixelEvents } from "@/lib/meta-pixel";
import { GooglePlacesAutocomplete } from "@/components/google-places-autocomplete";
import { extractCityFromAddress } from "@shared/utils";
import { InteractiveRouteMap } from "./interactive-route-map";

// Schema will be created with translations in component
const createRequestSchema = (t: (key: string) => string) => z.object({
  fromCity: z.string().min(2, t('newRequestForm.validation.fromCityRequired')),
  toCity: z.string().min(2, t('newRequestForm.validation.toCityRequired')),
  departureAddress: z.string().optional(),
  arrivalAddress: z.string().optional(),
  description: z.string().min(10, t('newRequestForm.validation.descriptionMin')),
  goodsType: z.string().min(1, t('newRequestForm.validation.goodsTypeRequired')),
  dateTime: z.string().optional(),
  budget: z.string().optional(),
  // Manutention fields
  handlingRequired: z.boolean(),
  departureFloor: z.string().optional(),
  departureElevator: z.boolean().optional(),
  arrivalFloor: z.string().optional(),
  arrivalElevator: z.boolean().optional(),
}).refine(
  (data) => {
    // Si manutention requise, les champs d'étage sont obligatoires
    if (data.handlingRequired) {
      return data.departureFloor && data.arrivalFloor && 
             data.departureElevator !== undefined && data.arrivalElevator !== undefined;
    }
    return true;
  },
  {
    message: t('newRequestForm.validation.handlingFieldsRequired'),
    path: ["handlingRequired"],
  }
);

// Goods types mapping for translations
const goodsTypesKeys = [
  "furniture", "appliances", "goods", "moving",
  "construction", "parcel", "vehicle", "other"
];

export function NewRequestForm({ onSuccess, onClose }: { onSuccess?: () => void; onClose?: () => void }) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [showRecommendationsDialog, setShowRecommendationsDialog] = useState(false);
  const [recommendedTransporters, setRecommendedTransporters] = useState<any[]>([]);
  const [createdRequestId, setCreatedRequestId] = useState<string>("");
  const [fromCityConfirmed, setFromCityConfirmed] = useState(false);
  const [toCityConfirmed, setToCityConfirmed] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  // Create schema with translations - recreates on language change
  const requestSchema = useMemo(() => createRequestSchema(t), [t, i18n.language]);
  type RequestFormData = z.infer<typeof requestSchema>;

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
      departureAddress: "",
      arrivalAddress: "",
      description: "",
      goodsType: "",
      dateTime: "",
      budget: "",
      handlingRequired: false,
      departureFloor: "",
      departureElevator: false,
      arrivalFloor: "",
      arrivalElevator: false,
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
          title: t('common.error'),
          description: t('newRequestForm.loginRequired'),
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
        departureAddress: data.departureAddress || data.fromCity,
        arrivalAddress: data.arrivalAddress || data.toCity,
        description: data.description,
        goodsType: data.goodsType,
        clientId: user.id,
        dateTime: data.dateTime ? new Date(data.dateTime).toISOString() : new Date().toISOString(),
        photos: photoBase64Array,
        handlingRequired: data.handlingRequired,
      };
      
      if (data.budget) {
        payload.budget = data.budget;
      }
      
      // Add handling fields if manutention is required
      if (data.handlingRequired) {
        payload.departureFloor = parseInt(data.departureFloor || "0");
        payload.departureElevator = data.departureElevator;
        payload.arrivalFloor = parseInt(data.arrivalFloor || "0");
        payload.arrivalElevator = data.arrivalElevator;
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
        title: t('newRequestForm.requestCreated'),
        description: t('newRequestForm.requestCreatedDesc'),
      });
      
      // Track transport request creation with Meta Pixel
      MetaPixelEvents.createTransportRequest({
        fromCity: data.fromCity,
        toCity: data.toCity,
        goodsType: data.goodsType,
        budget: data.budget,
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
        title: t('newRequestForm.error'),
        description: t('newRequestForm.errorDesc'),
      });
    }
  };

  return (
    <Card key={i18n.language} className="relative">
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-3 top-3 h-9 w-9 rounded-full hover:bg-accent z-10"
          data-testid="button-close-new-request"
        >
          <X className="h-5 w-5" />
        </Button>
      )}
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="fromCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('newRequestForm.fromCity')}</FormLabel>
                    <FormControl>
                      <GooglePlacesAutocomplete
                        value={field.value}
                        onChange={(address, placeDetails) => {
                          // Store full address (neighborhood + city) for both client and transporter view
                          form.setValue('departureAddress', address);
                          
                          // Use full address (neighborhood + city) for transporter view too
                          field.onChange(address);
                          
                          // Mark as confirmed only when a place is selected from autocomplete
                          setFromCityConfirmed(!!placeDetails);
                        }}
                        placeholder={t('newRequestForm.fromCityPlaceholder')}
                        dataTestId="input-from-city"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="toCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('newRequestForm.toCity')}</FormLabel>
                    <FormControl>
                      <GooglePlacesAutocomplete
                        value={field.value}
                        onChange={(address, placeDetails) => {
                          // Store full address (neighborhood + city) for both client and transporter view
                          form.setValue('arrivalAddress', address);
                          
                          // Use full address (neighborhood + city) for transporter view too
                          field.onChange(address);
                          
                          // Mark as confirmed only when a place is selected from autocomplete
                          setToCityConfirmed(!!placeDetails);
                        }}
                        placeholder={t('newRequestForm.toCityPlaceholder')}
                        dataTestId="input-to-city"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Interactive map visualization - only show when both cities are confirmed */}
            {fromCityConfirmed && toCityConfirmed && form.watch('fromCity') && form.watch('toCity') && (
              <InteractiveRouteMap
                fromCity={form.watch('fromCity')}
                toCity={form.watch('toCity')}
                onFromCityChange={(address, location) => {
                  // Extract city from the full address returned by Google
                  const city = extractCityFromAddress(address);
                  form.setValue('departureAddress', address);
                  form.setValue('fromCity', city);
                }}
                onToCityChange={(address, location) => {
                  // Extract city from the full address returned by Google
                  const city = extractCityFromAddress(address);
                  form.setValue('arrivalAddress', address);
                  form.setValue('toCity', city);
                }}
                className="my-4"
              />
            )}

            <FormField
              control={form.control}
              name="goodsType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('newRequestForm.goodsType')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-goods-type">
                        <SelectValue placeholder={t('newRequestForm.goodsTypePlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {goodsTypesKeys.map((typeKey, index) => (
                        <SelectItem key={typeKey} value={typeKey}>
                          {t(`shared.goodsTypes.${typeKey}`)}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('newRequestForm.description')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('newRequestForm.descriptionPlaceholder')}
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
                  <FormLabel>{t('newRequestForm.budget')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('newRequestForm.budgetPlaceholder')} 
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

            <FormField
              control={form.control}
              name="handlingRequired"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-handling-required"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">
                      Besoin de manutention
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Si vous avez besoin d'aide pour charger/décharger avec étages
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {form.watch("handlingRequired") && (
              <div className="space-y-4 p-4 rounded-lg border bg-muted/50">
                <h3 className="font-semibold text-sm">Informations de manutention</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">🏢 Départ</h4>
                    <FormField
                      control={form.control}
                      name="departureFloor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Étage au départ</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="ex: 3" 
                              min="0"
                              data-testid="input-departure-floor"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="departureElevator"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-departure-elevator"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="cursor-pointer">
                              Ascenseur disponible
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">🏠 Arrivée</h4>
                    <FormField
                      control={form.control}
                      name="arrivalFloor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Étage à l'arrivée</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="ex: 2" 
                              min="0"
                              data-testid="input-arrival-floor"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="arrivalElevator"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-arrival-elevator"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="cursor-pointer">
                              Ascenseur disponible
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            )}

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

            <Button 
              type="submit" 
              size="lg" 
              className="w-full" 
              disabled={form.formState.isSubmitting}
              data-testid="button-create-request"
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Création en cours...
                </>
              ) : (
                "Publier la demande"
              )}
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
