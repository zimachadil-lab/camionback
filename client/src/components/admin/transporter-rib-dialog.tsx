import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Save } from "lucide-react";

interface TransporterRibDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transporterId: string;
  transporterName: string;
}

export function TransporterRibDialog({ 
  open, 
  onOpenChange, 
  transporterId,
  transporterName 
}: TransporterRibDialogProps) {
  const { toast } = useToast();
  const [ribName, setRibName] = useState("");
  const [ribNumber, setRibNumber] = useState("");

  // Get current admin user from localStorage
  const storedUser = localStorage.getItem("camionback_user");
  const admin = storedUser ? JSON.parse(storedUser) : null;

  const { data: ribData, isLoading } = useQuery({
    queryKey: ["/api/admin/users", transporterId, "rib"],
    queryFn: async () => {
      if (!transporterId || !admin?.id) return null;
      const response = await fetch(`/api/admin/users/${transporterId}/rib?adminId=${admin.id}`);
      if (!response.ok) throw new Error("Échec de récupération du RIB");
      return response.json();
    },
    enabled: open && !!transporterId && !!admin?.id,
  });

  useEffect(() => {
    if (ribData) {
      setRibName(ribData.ribName || "");
      setRibNumber(ribData.ribNumber || "");
    }
  }, [ribData]);

  const updateRibMutation = useMutation({
    mutationFn: async (data: { ribName: string; ribNumber: string }) => {
      if (!admin?.id) throw new Error("Admin non trouvé");
      return await apiRequest("PATCH", `/api/admin/users/${transporterId}/rib`, {
        ...data,
        adminId: admin.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "✅ Le RIB a été enregistré avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", transporterId, "rib"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transporters"] });
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            RIB du transporteur
          </DialogTitle>
          <DialogDescription>
            {transporterName}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-rib-name">
                Nom (personnel ou société) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="admin-rib-name"
                type="text"
                value={ribName}
                onChange={(e) => setRibName(e.target.value)}
                placeholder="Ex: Mohammed Alami ou Société Transport ABC"
                required
                data-testid="input-admin-rib-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-rib-number">
                Numéro RIB <span className="text-destructive">*</span>
              </Label>
              <Input
                id="admin-rib-number"
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
                data-testid="input-admin-rib-number"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                {ribNumber.length}/24 chiffres
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-admin-rib"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={updateRibMutation.isPending || !ribName || !ribNumber}
                data-testid="button-save-admin-rib"
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {updateRibMutation.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
