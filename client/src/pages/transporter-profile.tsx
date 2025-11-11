import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { User, Phone, MapPin, Camera, KeyRound, Truck, X, Edit } from "lucide-react";
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
  const { user: currentUser, loading: authLoading, logout, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [truckPhotoFile, setTruckPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  
  // Form states
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  // Use currentUser from AuthContext (already loaded via /api/auth/me)
  // No need for separate query - data is already available
  const profile: UserProfile | null = currentUser ? {
    id: currentUser.id,
    name: currentUser.name || "",
    phoneNumber: currentUser.phoneNumber,
    city: currentUser.city || "",
    truckPhotos: [], // TODO: Add truckPhotos to currentUser type if needed
    role: currentUser.role || "",
  } : null;

  const isLoading = authLoading;

  // Initialize form when currentUser loads
  useEffect(() => {
    if (currentUser) {
      setPhoneNumber(currentUser.phoneNumber);
      setName(currentUser.name || "");
    }
  }, [currentUser]);

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
    onSuccess: () => {
      toast({
        title: "✅ Profil mis à jour avec succès",
        description: "Vos informations ont été enregistrées",
      });
      refreshUser();
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
    logout();
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

  // Early return if still loading or no user
  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingTruck size="lg" />
      </div>
    );
  }

  // At this point, currentUser is guaranteed to be non-null
  const userForHeader = {
    ...currentUser,
    role: currentUser.role || "transporteur",
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={userForHeader} onLogout={handleLogout} />
        <div className="container py-8">
          <p className="text-center text-muted-foreground">Profil introuvable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a2540]">
      {/* Header avec bouton retour */}
      <div className="bg-[#0a2540] border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Mon Profil</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="text-white hover:bg-white/10"
            data-testid="button-close-profile"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Photo du camion - Section principale */}
        <Card className="bg-white/10 border-white/20 overflow-hidden">
          <CardContent className="p-0">
            <div className="relative h-48 bg-gradient-to-br from-[#0d9488] via-[#0f766e] to-[#115e59]">
              {(previewUrl || (profile.truckPhotos && profile.truckPhotos.length > 0)) ? (
                <img
                  src={previewUrl || profile.truckPhotos[0]}
                  alt="Camion"
                  className="w-full h-full object-cover"
                  data-testid="img-truck-preview"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Truck className="w-20 h-20 text-white/40" />
                </div>
              )}
              
              {isEditing && (
                <label className="absolute bottom-4 right-4 cursor-pointer">
                  <div className="bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all">
                    <Camera className="w-5 h-5 text-[#0d9488]" />
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleTruckPhotoChange}
                    className="hidden"
                    data-testid="input-truck-photo"
                  />
                </label>
              )}
            </div>
            
            {isEditing && (
              <div className="p-3 bg-white/5">
                <p className="text-xs text-gray-300 text-center">
                  Maximum 5 MB - Formats: JPG, PNG
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bouton Modifier */}
        {!isEditing && (
          <Button
            onClick={() => {
              setIsEditing(true);
              setPhoneNumber(profile.phoneNumber);
              setName(profile.name);
            }}
            className="w-full bg-gradient-to-r from-[#17cfcf] to-[#0ea5a5] hover:from-[#15b8b8] hover:to-[#0c8f8f] text-white font-semibold h-12"
            data-testid="button-edit-profile"
          >
            <Edit className="w-4 h-4 mr-2" />
            Modifier le profil
          </Button>
        )}

        {/* Informations personnelles */}
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-6 space-y-6">

            {/* Name Field */}
            <div className="space-y-3">
              <Label htmlFor="name" className="flex items-center gap-2 text-gray-300">
                <User className="w-4 h-4 text-[#17cfcf]" />
                Nom complet ou nom de société
              </Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom"
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                  data-testid="input-name"
                />
              ) : (
                <p className="text-lg font-semibold text-white" data-testid="text-name">{profile.name}</p>
              )}
            </div>

            {/* Phone Number Field */}
            <div className="space-y-3">
              <Label htmlFor="phone" className="flex items-center gap-2 text-gray-300">
                <Phone className="w-4 h-4 text-[#17cfcf]" />
                Numéro de téléphone
              </Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+212XXXXXXXXX"
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                  data-testid="input-phone"
                />
              ) : (
                <p className="text-lg font-semibold text-white" data-testid="text-phone">{profile.phoneNumber}</p>
              )}
            </div>

            {/* City Field (Read-only) */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-gray-300">
                <MapPin className="w-4 h-4 text-[#17cfcf]" />
                Ville de résidence
              </Label>
              <p className="text-lg font-semibold text-white" data-testid="text-city">
                {profile.city}
              </p>
              <p className="text-xs text-gray-400 italic">
                Non modifiable - Contactez l'administrateur pour changer
              </p>
            </div>

            {/* PIN Section */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-gray-300">
                <KeyRound className="w-4 h-4 text-[#17cfcf]" />
                Code PIN
              </Label>
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-white tracking-widest" data-testid="text-pin">••••••</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPinDialog(true)}
                  className="border-white/20 text-white hover:bg-white/10"
                  data-testid="button-change-pin"
                >
                  Réinitialiser le PIN
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-3">
            <Button
              onClick={handleSaveProfile}
              disabled={updateProfileMutation.isPending}
              className="flex-1 bg-gradient-to-r from-[#17cfcf] to-[#0ea5a5] hover:from-[#15b8b8] hover:to-[#0c8f8f] text-white font-semibold h-12"
              data-testid="button-save-profile"
            >
              {updateProfileMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setTruckPhotoFile(null);
                setPreviewUrl("");
              }}
              className="border-white/20 text-white hover:bg-white/10 h-12 px-8"
              data-testid="button-cancel-edit"
            >
              Annuler
            </Button>
          </div>
        )}
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
