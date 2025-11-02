import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ARCHIVE_REASONS_OPTIONS, ARCHIVE_REASONS_LABELS } from "@shared/schema";
import { CheckCircle, Send, UserPlus, Archive, DollarSign, Calculator, TrendingUp, Truck } from "lucide-react";
import { ManualAssignmentDialog } from "./manual-assignment-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface QualificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: any;
  onSuccess: () => void;
}

export function QualificationDialog({ open, onOpenChange, request, onSuccess }: QualificationDialogProps) {
  const { toast } = useToast();
  const [transporterAmount, setTransporterAmount] = useState("");
  const [platformFee, setPlatformFee] = useState("");
  const [clientTotal, setClientTotal] = useState(0);
  const [archiveReason, setArchiveReason] = useState("");
  const [showArchiveSelect, setShowArchiveSelect] = useState(false);
  const [manualAssignmentOpen, setManualAssignmentOpen] = useState(false);

  // Calculate client total when amounts change
  useEffect(() => {
    const transporter = parseFloat(transporterAmount) || 0;
    const fee = parseFloat(platformFee) || 0;
    setClientTotal(transporter + fee);
  }, [transporterAmount, platformFee]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTransporterAmount("");
      setPlatformFee("");
      setClientTotal(0);
      setArchiveReason("");
      setShowArchiveSelect(false);
    }
  }, [open]);

  // Mutation: Qualify request (set prices)
  const qualifyMutation = useMutation({
    mutationFn: async () => {
      const transporter = parseFloat(transporterAmount);
      const fee = parseFloat(platformFee);
      
      if (isNaN(transporter) || transporter <= 0) {
        throw new Error("Montant transporteur invalide");
      }
      if (isNaN(fee) || fee < 0) {
        throw new Error("Cotisation plateforme invalide");
      }

      return apiRequest("POST", "/api/coordinator/qualify-request", {
        requestId: request.id,
        transporterAmount: transporter,
        platformFee: fee
      });
    },
    onSuccess: () => {
      toast({
        title: "Prix définis",
        description: `Commande ${request.referenceId} qualifiée avec succès`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/qualification-pending"] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de qualifier la commande",
      });
    }
  });

  // Mutation: Publish for matching
  const publishMutation = useMutation({
    mutationFn: async () => {
      // First qualify with prices
      const transporter = parseFloat(transporterAmount);
      const fee = parseFloat(platformFee);
      
      if (isNaN(transporter) || transporter <= 0) {
        throw new Error("Montant transporteur invalide");
      }
      if (isNaN(fee) || fee < 0) {
        throw new Error("Cotisation plateforme invalide");
      }

      await apiRequest("POST", "/api/coordinator/qualify-request", {
        requestId: request.id,
        transporterAmount: transporter,
        platformFee: fee
      });

      // Then publish for matching
      return apiRequest("POST", "/api/coordinator/publish-for-matching", {
        requestId: request.id
      });
    },
    onSuccess: () => {
      toast({
        title: "Publié pour matching",
        description: `Commande ${request.referenceId} disponible aux transporteurs`,
      });
      // Invalidate correct query keys used by dashboard
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/qualification-pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/coordination/en-action"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/available-requests"] });
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de publier la commande",
      });
    }
  });

  // Mutation: Archive request
  const archiveMutation = useMutation({
    mutationFn: async () => {
      if (!archiveReason) {
        throw new Error("Veuillez sélectionner un motif d'archivage");
      }

      return apiRequest("POST", "/api/coordinator/archive-request", {
        requestId: request.id,
        reason: archiveReason
      });
    },
    onSuccess: () => {
      toast({
        title: "Commande archivée",
        description: `${request.referenceId} archivée : ${ARCHIVE_REASONS_LABELS[archiveReason] || archiveReason}`,
      });
      // Invalidate correct query keys used by dashboard
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/qualification-pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/coordination/archives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/coordination/en-action"] });
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible d'archiver la commande",
      });
    }
  });

  // Separate mutation for manual assignment qualification (doesn't call parent onSuccess)
  const qualifyForManualAssignmentMutation = useMutation({
    mutationFn: async () => {
      const transporter = parseFloat(transporterAmount);
      const fee = parseFloat(platformFee);
      
      if (isNaN(transporter) || transporter <= 0) {
        throw new Error("Montant transporteur invalide");
      }
      if (isNaN(fee) || fee < 0) {
        throw new Error("Cotisation plateforme invalide");
      }

      return apiRequest("POST", "/api/coordinator/qualify-request", {
        requestId: request.id,
        transporterAmount: transporter,
        platformFee: fee
      });
    },
    onSuccess: () => {
      toast({
        title: "Prix définis",
        description: "Vous pouvez maintenant assigner un transporteur",
      });
      // Open manual assignment dialog WITHOUT calling parent onSuccess
      setManualAssignmentOpen(true);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de qualifier la commande",
      });
    }
  });

  const handleManualAssignment = () => {
    // Validate prices first
    const transporter = parseFloat(transporterAmount);
    const fee = parseFloat(platformFee);
    
    if (isNaN(transporter) || transporter <= 0) {
      toast({
        variant: "destructive",
        title: "Prix requis",
        description: "Veuillez définir un montant transporteur valide",
      });
      return;
    }
    if (isNaN(fee) || fee < 0) {
      toast({
        variant: "destructive",
        title: "Prix requis",
        description: "Veuillez définir une cotisation plateforme valide",
      });
      return;
    }

    // Qualify with separate mutation that doesn't close parent dialog
    qualifyForManualAssignmentMutation.mutate();
  };

  const isPending = qualifyMutation.isPending || publishMutation.isPending || archiveMutation.isPending || qualifyForManualAssignmentMutation.isPending;

  if (!request) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#5BC0EB]" />
              Qualification de la commande
            </DialogTitle>
            <DialogDescription>
              Définir les prix pour {request.referenceId} • {request.fromCity} → {request.toCity}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Request Summary */}
            <Card className="p-4 bg-muted/30">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Client:</span>
                  <p className="font-medium">{request.client?.name || "N/A"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Budget client:</span>
                  <p className="font-medium">{request.budget ? `${request.budget} MAD` : "Non spécifié"}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Description:</span>
                  <p className="font-medium">{request.description || request.goodsType || "N/A"}</p>
                </div>
              </div>
            </Card>

            {/* Pricing Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transporterAmount" className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-[#5BC0EB]" />
                  Montant transporteur (MAD)
                </Label>
                <Input
                  id="transporterAmount"
                  type="number"
                  placeholder="Ex: 3000"
                  value={transporterAmount}
                  onChange={(e) => setTransporterAmount(e.target.value)}
                  disabled={isPending}
                  data-testid="input-transporter-amount"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platformFee" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Cotisation plateforme (MAD)
                </Label>
                <Input
                  id="platformFee"
                  type="number"
                  placeholder="Ex: 500"
                  value={platformFee}
                  onChange={(e) => setPlatformFee(e.target.value)}
                  disabled={isPending}
                  data-testid="input-platform-fee"
                />
              </div>

              {/* Client Total Preview */}
              <Card className="p-4 bg-gradient-to-br from-[#5BC0EB]/10 to-purple-500/10 border-[#5BC0EB]/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-[#5BC0EB]" />
                    <span className="font-semibold text-lg">Total client</span>
                  </div>
                  <Badge className="bg-[#5BC0EB] hover:bg-[#5BC0EB]/90 text-white text-lg px-4 py-1">
                    {clientTotal.toFixed(2)} MAD
                  </Badge>
                </div>
                {request.budget && clientTotal > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {clientTotal > request.budget 
                      ? `⚠️ Dépasse le budget de ${(clientTotal - request.budget).toFixed(2)} MAD` 
                      : `✓ Dans le budget (marge: ${(request.budget - clientTotal).toFixed(2)} MAD)`
                    }
                  </p>
                )}
              </Card>
            </div>

            {/* Archive Section */}
            {showArchiveSelect && (
              <div className="space-y-2">
                <Label htmlFor="archiveReason">Motif d'archivage</Label>
                <Select value={archiveReason} onValueChange={setArchiveReason}>
                  <SelectTrigger data-testid="select-archive-reason">
                    <SelectValue placeholder="Sélectionner un motif" />
                  </SelectTrigger>
                  <SelectContent>
                    {ARCHIVE_REASONS_OPTIONS.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {/* Archive Button */}
            {!showArchiveSelect ? (
              <Button
                variant="destructive"
                onClick={() => setShowArchiveSelect(true)}
                disabled={isPending}
                className="w-full sm:w-auto"
                data-testid="button-show-archive"
              >
                <Archive className="h-4 w-4 mr-2" />
                Archiver
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowArchiveSelect(false)}
                  disabled={isPending}
                  className="w-full sm:w-auto"
                  data-testid="button-cancel-archive"
                >
                  Annuler archivage
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => archiveMutation.mutate()}
                  disabled={isPending || !archiveReason}
                  className="w-full sm:w-auto"
                  data-testid="button-confirm-archive"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Confirmer archivage
                </Button>
              </>
            )}

            {/* Main Action Buttons (only show if not archiving) */}
            {!showArchiveSelect && (
              <>
                <Button
                  variant="outline"
                  onClick={handleManualAssignment}
                  disabled={isPending}
                  className="w-full sm:w-auto"
                  data-testid="button-manual-assignment"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assigner manuellement
                </Button>
                <Button
                  onClick={() => publishMutation.mutate()}
                  disabled={isPending}
                  className="w-full sm:w-auto bg-[#5BC0EB] hover:bg-[#5BC0EB]/90"
                  data-testid="button-publish-matching"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Publier pour matching
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Assignment Dialog */}
      {manualAssignmentOpen && (
        <ManualAssignmentDialog
          open={manualAssignmentOpen}
          onOpenChange={setManualAssignmentOpen}
          request={request}
          onSuccess={() => {
            setManualAssignmentOpen(false);
            onOpenChange(false);
            onSuccess();
          }}
        />
      )}
    </>
  );
}
