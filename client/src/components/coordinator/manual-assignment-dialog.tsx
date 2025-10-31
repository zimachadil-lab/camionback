import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Truck, MapPin, Star, Phone, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { LoadingTruck } from "@/components/ui/loading-truck";

interface ManualAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: any;
  onSuccess: () => void;
}

export function ManualAssignmentDialog({ open, onOpenChange, request, onSuccess }: ManualAssignmentDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransporter, setSelectedTransporter] = useState<any>(null);
  const [transporterAmount, setTransporterAmount] = useState("");
  const [platformFee, setPlatformFee] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Search transporters
  const { data: searchResults = [], isLoading: isLoadingSearch } = useQuery<any[]>({
    queryKey: ["/api/coordinator/search-transporters", searchQuery],
    enabled: searchQuery.trim().length >= 2 && isSearching,
  });

  // Assign transporter mutation
  const assignMutation = useMutation({
    mutationFn: async (data: { requestId: string; transporterId: string; transporterAmount: number; platformFee: number }) => {
      return await apiRequest("POST", "/api/coordinator/assign-transporter", data);
    },
    onSuccess: () => {
      onSuccess();
      handleClose();
    },
  });

  const handleClose = () => {
    setSearchQuery("");
    setSelectedTransporter(null);
    setTransporterAmount("");
    setPlatformFee("");
    setIsSearching(false);
    onOpenChange(false);
  };

  const handleSearch = () => {
    if (searchQuery.trim().length >= 2) {
      setIsSearching(true);
    }
  };

  const handleSelectTransporter = (transporter: any) => {
    setSelectedTransporter(transporter);
    setIsSearching(false);
  };

  const handleAssign = () => {
    if (!selectedTransporter || !transporterAmount || !platformFee) return;

    const amount = parseFloat(transporterAmount);
    const fee = parseFloat(platformFee);

    if (isNaN(amount) || isNaN(fee) || amount <= 0 || fee < 0) {
      return;
    }

    assignMutation.mutate({
      requestId: request.id,
      transporterId: selectedTransporter.id,
      transporterAmount: amount,
      platformFee: fee,
    });
  };

  const clientTotal = transporterAmount && platformFee 
    ? (parseFloat(transporterAmount) + parseFloat(platformFee)).toFixed(2)
    : "0.00";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Missionner un transporteur</DialogTitle>
          <DialogDescription>
            Recherchez et assignez manuellement un transporteur pour la commande {request?.referenceId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Search Transporter */}
          {!selectedTransporter && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Rechercher un transporteur</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Nom ou téléphone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10"
                      data-testid="input-search-transporter"
                    />
                  </div>
                  <Button 
                    onClick={handleSearch}
                    disabled={searchQuery.trim().length < 2}
                    data-testid="button-search"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Rechercher
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimum 2 caractères pour lancer la recherche
                </p>
              </div>

              {/* Search Results */}
              {isLoadingSearch && (
                <div className="flex justify-center py-8">
                  <LoadingTruck />
                </div>
              )}

              {isSearching && !isLoadingSearch && searchResults.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun transporteur trouvé</p>
                </div>
              )}

              {isSearching && searchResults.length > 0 && (
                <div className="space-y-2">
                  <Label>Résultats de recherche ({searchResults.length})</Label>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {searchResults.map((transporter) => (
                      <Card 
                        key={transporter.id} 
                        className="hover-elevate cursor-pointer"
                        onClick={() => handleSelectTransporter(transporter)}
                        data-testid={`card-transporter-${transporter.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Truck className="h-4 w-4 text-[#5BC0EB]" />
                                <h4 className="font-semibold">{transporter.name}</h4>
                              </div>
                              {transporter.city && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {transporter.city}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <Phone className="h-3 w-3" />
                                {transporter.phoneNumber}
                              </p>
                              {transporter.rating && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm font-medium">{parseFloat(transporter.rating).toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                            <Badge variant="default">Validé</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Selected Transporter & Pricing */}
          {selectedTransporter && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Transporteur sélectionné</Label>
                <Card className="bg-[#5BC0EB]/5 border-[#5BC0EB]/20">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Truck className="h-4 w-4 text-[#5BC0EB]" />
                          <h4 className="font-semibold">{selectedTransporter.name}</h4>
                        </div>
                        {selectedTransporter.city && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {selectedTransporter.city}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" />
                          {selectedTransporter.phoneNumber}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTransporter(null)}
                        data-testid="button-change-transporter"
                      >
                        Changer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4 border-t pt-4">
                <Label className="text-base font-semibold">Tarification</Label>
                
                <div className="space-y-2">
                  <Label htmlFor="transporterAmount">Montant Transporteur (MAD)</Label>
                  <Input
                    id="transporterAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 500"
                    value={transporterAmount}
                    onChange={(e) => setTransporterAmount(e.target.value)}
                    data-testid="input-transporter-amount"
                  />
                  <p className="text-xs text-muted-foreground">
                    Le montant que recevra le transporteur
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platformFee">Cotisation CamionBack (MAD)</Label>
                  <Input
                    id="platformFee"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 50"
                    value={platformFee}
                    onChange={(e) => setPlatformFee(e.target.value)}
                    data-testid="input-platform-fee"
                  />
                  <p className="text-xs text-muted-foreground">
                    La cotisation de la plateforme
                  </p>
                </div>

                {transporterAmount && platformFee && (
                  <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Montant transporteur:</span>
                        <span className="font-medium">{parseFloat(transporterAmount).toFixed(2)} MAD</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cotisation plateforme:</span>
                        <span className="font-medium">+{parseFloat(platformFee).toFixed(2)} MAD</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-blue-200 dark:border-blue-800">
                        <span className="font-semibold">Total Client:</span>
                        <span className="text-xl font-bold text-[#5BC0EB]">{clientTotal} MAD</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={assignMutation.isPending}
            data-testid="button-cancel"
          >
            Annuler
          </Button>
          {selectedTransporter && (
            <Button
              onClick={handleAssign}
              disabled={
                !transporterAmount || 
                !platformFee || 
                parseFloat(transporterAmount) <= 0 || 
                parseFloat(platformFee) < 0 ||
                assignMutation.isPending
              }
              className="bg-[#5BC0EB] hover:bg-[#4AA8D8]"
              data-testid="button-assign"
            >
              {assignMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {assignMutation.isPending ? "Assignation..." : "Confirmer l'assignation"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
