import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { MetaPixelEvents } from "@/lib/meta-pixel";

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

// Schema will be created with translations in component
const createProfileSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(3, t('completeProfile.fullNameError')),
  city: z.string().min(1, t('completeProfile.cityError')),
  truckPhoto: z.instanceof(File, { message: t('completeProfile.truckPhotoRequired') }),
});

export default function CompleteProfile() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { t, i18n } = useTranslation();

  // Create schema with translations - recreates on language change
  const profileSchema = useMemo(() => createProfileSchema(t), [t, i18n.language]);
  type ProfileForm = z.infer<typeof profileSchema>;

  // IMPORTANT: All hooks must be called before any conditional returns
  // Form recreates when language changes due to resolver dependency
  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      city: "",
    },
  });

  // Track page view with Meta Pixel
  useEffect(() => {
    if (user?.role === 'transporteur') {
      MetaPixelEvents.viewCompleteProfile('transporteur');
    }
  }, [user]);

  // Redirect if not authenticated or not a transporter
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'transporteur')) {
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);
  
  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }
  
  // Redirect if not authenticated
  if (!user) {
    return null;
  }

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
      formData.append("name", data.name);
      formData.append("city", data.city);
      formData.append("truckPhoto", data.truckPhoto);

      const response = await fetch("/api/auth/complete-profile", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to complete profile");
      }

      const result = await response.json();

      toast({
        title: t('completeProfile.profileCompleted'),
        description: t('completeProfile.profileValidation'),
      });

      // Track transporter registration with Meta Pixel
      MetaPixelEvents.transporterRegistration({
        city: data.city,
        vehicleType: 'camion',
        capacity: 'N/A',
      });

      // CRITICAL: Force full page navigation to ensure user context is fresh
      // React setState is async, so using window.location instead of setLocation
      // This forces a complete page reload with the updated user data from the server
      window.location.href = "/";
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('completeProfile.profileError'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card key={i18n.language} className="w-full max-w-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Truck className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">{t('completeProfile.title')}</CardTitle>
          <CardDescription>
            {t('completeProfile.subtitle')}
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
                    <FormLabel>{t('completeProfile.fullName')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('completeProfile.fullNamePlaceholder')} 
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
                    <FormLabel>{t('completeProfile.city')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-city">
                          <SelectValue placeholder={t('completeProfile.selectCity')} />
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
                <FormLabel>{t('completeProfile.phoneNumber')}</FormLabel>
                <Input 
                  value={user.phoneNumber || ""} 
                  disabled 
                  className="bg-muted"
                  data-testid="input-phone-disabled"
                />
                <p className="text-xs text-muted-foreground">
                  {t('completeProfile.phoneCannotChange')}
                </p>
              </div>

              <FormField
                control={form.control}
                name="truckPhoto"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>{t('completeProfile.truckPhoto')} *</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        {previewUrl ? (
                          <div className="border-2 border-dashed rounded-lg p-4">
                            <img 
                              src={previewUrl} 
                              alt={t('completeProfile.truckPhotoPreview')} 
                              className="max-h-48 mx-auto rounded-lg mb-4"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                setPreviewUrl(null);
                                const input = document.getElementById("truck-photo") as HTMLInputElement;
                                if (input) input.value = "";
                                form.resetField("truckPhoto");
                              }}
                              data-testid="button-remove-photo"
                            >
                              {t('completeProfile.changePhoto')}
                            </Button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed rounded-lg p-6 text-center">
                            <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground mb-4">
                              {t('completeProfile.uploadPhoto')}
                            </p>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handlePhotoChange(e);
                                  onChange(file);
                                }
                              }}
                              id="truck-photo"
                              data-testid="input-truck-photo"
                              className="max-w-xs mx-auto"
                            />
                          </div>
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
                {loading ? t('completeProfile.submitting') : t('completeProfile.submit')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
