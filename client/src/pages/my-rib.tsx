import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, ArrowLeft, Save } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";

export default function MyRib() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [ribName, setRibName] = useState("");
  const [ribNumber, setRibNumber] = useState("");

  const { isLoading } = useQuery({
    queryKey: ["/api/user/rib", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("Utilisateur non trouvé");
      const response = await fetch(`/api/user/rib?userId=${user.id}`);
      if (!response.ok) throw new Error("Échec de récupération du RIB");
      const data = await response.json();
      setRibName(data.ribName || "");
      setRibNumber(data.ribNumber || "");
      return data;
    },
    enabled: !!user?.id,
  });

  const updateRibMutation = useMutation({
    mutationFn: async (data: { ribName: string; ribNumber: string }) => {
      if (!user?.id) throw new Error("Utilisateur non trouvé");
      return await apiRequest("PATCH", "/api/user/rib", {
        ...data,
        userId: user.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "✅ Votre RIB a été enregistré avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/rib"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "⚠️ Le RIB doit contenir exactement 24 chiffres.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation front-end
    if (ribNumber && !/^\d{24}$/.test(ribNumber)) {
      toast({
        variant: "destructive",
        title: "Erreur de validation",
        description: "⚠️ Le RIB doit contenir exactement 24 chiffres.",
      });
      return;
    }

    updateRibMutation.mutate({ ribName, ribNumber });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/transporter-dashboard">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Mon RIB</h1>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-primary" />
              <CardTitle>Informations bancaires</CardTitle>
            </div>
            <CardDescription>
              Ajoutez ou modifiez vos informations bancaires pour recevoir vos paiements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement...
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="ribName">
                    Nom (personnel ou société) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="ribName"
                    type="text"
                    value={ribName}
                    onChange={(e) => setRibName(e.target.value)}
                    placeholder="Ex: Mohammed Alami ou Société Transport ABC"
                    required
                    data-testid="input-rib-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ribNumber">
                    Numéro RIB <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="ribNumber"
                    type="text"
                    value={ribNumber}
                    onChange={(e) => {
                      // Only allow digits
                      const value = e.target.value.replace(/\D/g, "");
                      setRibNumber(value);
                    }}
                    placeholder="24 chiffres exactement"
                    maxLength={24}
                    required
                    data-testid="input-rib-number"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    {ribNumber.length}/24 chiffres
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-medium text-sm mb-2">ℹ️ Important</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Le RIB doit contenir exactement 24 chiffres</li>
                    <li>Vérifiez bien les informations avant d'enregistrer</li>
                    <li>Ces informations seront utilisées pour vos paiements</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Link href="/transporter-dashboard" className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      data-testid="button-cancel"
                    >
                      Annuler
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    className="flex-1 gap-2"
                    disabled={updateRibMutation.isPending || !ribName || !ribNumber}
                    data-testid="button-save-rib"
                  >
                    <Save className="h-4 w-4" />
                    {updateRibMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
