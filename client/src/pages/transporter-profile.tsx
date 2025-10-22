import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, Phone, MapPin, Camera, KeyRound, Truck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingTruck } from "@/components/ui/loading-truck";

type UserProfile = {
  id: string;
  name: string;
  phoneNumber: string;
  city: string;
  truckPhotos: string[];
  role: string;
};

export default function TransporterProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [truckPhotoFile, setTruckPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  
  // Form states
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  // Get current user from localStorage
  const userStr = localStorage.getItem("camionback_user");
  const currentUser = userStr ? JSON.parse(userStr) : null;

  // Fetch user profile
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: [`/api/users/${currentUser?.id}`],
    enabled: !!currentUser?.id,
  });

  // Initialize form when profile loads
  useEffect(() => {
    if (profile) {
      setPhoneNumber(profile.phoneNumber);
      setName(profile.name);
    }
  }, [profile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch(`/api/users/${currentUser?.id}/profile`, {
        method: "PATCH",
        body: data,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la mise à jour");
      }
      return response.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "✅ Profil mis à jour avec succès",
        description: "Vos informations ont été enregistrées",
      });
      // Update localStorage
      localStorage.setItem("camionback_user", JSON.stringify(updatedUser));
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUser?.id}`] });
      setIsEditing(false);
      setTruckPhotoFile(null);
      setPreviewUrl("");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le profil",
        variant: "destructive",
      });
    },
  });

  // Update PIN mutation
  const updatePinMutation = useMutation({
    mutationFn: async (pin: string) => {
      const response = await apiRequest("PATCH", `/api/users/${currentUser?.id}/pin`, { pin });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Code PIN modifié",
        description: "Votre nouveau code PIN a été enregistré",
      });
      setShowPinDialog(false);
      setNewPin("");
      setConfirmPin("");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier le PIN",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("camionback_user");
    setLocation("/");
  };

  const handleTruckPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La photo ne doit pas dépasser 5 MB",
          variant: "destructive",
        });
        return;
      }
      setTruckPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    if (!phoneNumber || !name) {
      toast({
        title: "Champs requis",
        description: "Le nom et le téléphone sont obligatoires",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number format (Moroccan)
    const phoneRegex = /^\+212[5-7]\d{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      toast({
        title: "Numéro invalide",
        description: "Le numéro doit être au format marocain: +212XXXXXXXXX",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("phoneNumber", phoneNumber);
    formData.append("name", name);
    
    if (truckPhotoFile) {
      formData.append("truckPhoto", truckPhotoFile);
    }

    updateProfileMutation.mutate(formData);
  };

  const handleUpdatePin = () => {
    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      toast({
        title: "PIN invalide",
        description: "Le code PIN doit contenir exactement 6 chiffres",
        variant: "destructive",
      });
      return;
    }

    if (newPin !== confirmPin) {
      toast({
        title: "PIN non identique",
        description: "Les deux codes PIN doivent être identiques",
        variant: "destructive",
      });
      return;
    }

    updatePinMutation.mutate(newPin);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={currentUser} onLogout={handleLogout} />
        <div className="container py-8 flex items-center justify-center min-h-[60vh]">
          <LoadingTruck message="Chargement du profil..." size="lg" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={currentUser} onLogout={handleLogout} />
        <div className="container py-8">
          <p className="text-center text-muted-foreground">Profil introuvable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={currentUser} onLogout={handleLogout} />
      
      <div className="container max-w-3xl py-8 px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Mon Profil
                </CardTitle>
                <CardDescription>
                  Gérez vos informations personnelles
                </CardDescription>
              </div>
              {!isEditing && (
                <Button
                  onClick={() => {
                    setIsEditing(true);
                    setPhoneNumber(profile.phoneNumber);
                    setName(profile.name);
                  }}
                  data-testid="button-edit-profile"
                >
                  Modifier
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Truck Photo Section */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Photo du camion
              </Label>
              <div className="flex items-center gap-4">
                {(previewUrl || (profile.truckPhotos && profile.truckPhotos.length > 0)) && (
                  <img
                    src={previewUrl || profile.truckPhotos[0]}
                    alt="Camion"
                    className="w-32 h-32 object-cover rounded-lg border"
                    data-testid="img-truck-preview"
                  />
                )}
                {isEditing && (
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleTruckPhotoChange}
                      data-testid="input-truck-photo"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum 5 MB - Formats: JPG, PNG
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Nom complet ou nom de société
              </Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom"
                  data-testid="input-name"
                />
              ) : (
                <p className="text-base py-2" data-testid="text-name">{profile.name}</p>
              )}
            </div>

            {/* Phone Number Field */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Numéro de téléphone
              </Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+212XXXXXXXXX"
                  data-testid="input-phone"
                />
              ) : (
                <p className="text-base py-2" data-testid="text-phone">{profile.phoneNumber}</p>
              )}
            </div>

            {/* City Field (Read-only) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Ville de résidence
              </Label>
              <p className="text-base py-2 text-muted-foreground" data-testid="text-city">
                {profile.city}
              </p>
              <p className="text-xs text-muted-foreground">
                Non modifiable - Contactez l'administrateur pour changer
              </p>
            </div>

            {/* PIN Section */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                Code PIN
              </Label>
              <div className="flex items-center gap-4">
                <p className="text-base py-2" data-testid="text-pin">••••••</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPinDialog(true)}
                  data-testid="button-change-pin"
                >
                  Réinitialiser le PIN
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  className="flex-1"
                  style={{ backgroundColor: "#17cfcf" }}
                  data-testid="button-save-profile"
                >
                  {updateProfileMutation.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setTruckPhotoFile(null);
                    setPreviewUrl("");
                  }}
                  data-testid="button-cancel-edit"
                >
                  Annuler
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PIN Change Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent data-testid="dialog-change-pin">
          <DialogHeader>
            <DialogTitle>Réinitialiser le code PIN</DialogTitle>
            <DialogDescription>
              Entrez un nouveau code PIN à 6 chiffres
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-pin">Nouveau code PIN</Label>
              <Input
                id="new-pin"
                type="password"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="6 chiffres"
                data-testid="input-new-pin"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-pin">Confirmer le code PIN</Label>
              <Input
                id="confirm-pin"
                type="password"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="6 chiffres"
                data-testid="input-confirm-pin"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPinDialog(false);
                setNewPin("");
                setConfirmPin("");
              }}
              data-testid="button-cancel-pin"
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpdatePin}
              disabled={updatePinMutation.isPending}
              data-testid="button-confirm-pin"
            >
              {updatePinMutation.isPending ? "Enregistrement..." : "Valider"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
