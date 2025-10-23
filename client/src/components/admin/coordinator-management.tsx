import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus, UserCheck, UserX, Trash2, RefreshCw, Compass, Shield, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingTruck } from "@/components/ui/loading-truck";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCoordinatorSchema, resetCoordinatorPinSchema, type CreateCoordinator, type ResetCoordinatorPin } from "@shared/schema";

export function CoordinatorManagement() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);
  const [resetPinDialogId, setResetPinDialogId] = useState<string | null>(null);
  const { toast } = useToast();

  // Create coordinator form
  const createForm = useForm<CreateCoordinator>({
    resolver: zodResolver(createCoordinatorSchema),
    defaultValues: {
      phoneNumber: "",
      name: "",
      pin: "",
    },
  });

  // Reset PIN form
  const resetPinForm = useForm<ResetCoordinatorPin>({
    resolver: zodResolver(resetCoordinatorPinSchema),
    defaultValues: {
      newPin: "",
    },
  });

  // Fetch coordinators
  const { data: coordinators = [], isLoading: coordinatorsLoading } = useQuery({
    queryKey: ["/api/admin/coordinators"],
  });

  // Fetch coordinator activity logs
  const { data: activityLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["/api/admin/coordinator-activity"],
  });

  // Create coordinator mutation
  const createCoordinatorMutation = useMutation({
    mutationFn: async (data: CreateCoordinator) => {
      return await apiRequest("/api/admin/coordinators", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coordinators"] });
      toast({
        title: "Coordinateur créé",
        description: "Le nouveau coordinateur a été créé avec succès.",
      });
      setCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de créer le coordinateur",
      });
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/coordinators/${id}/toggle-status`, "PATCH", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coordinators"] });
      toast({
        title: "Statut modifié",
        description: "Le statut du coordinateur a été mis à jour.",
      });
    },
  });

  // Delete coordinator mutation
  const deleteCoordinatorMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/coordinators/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coordinators"] });
      toast({
        title: "Coordinateur supprimé",
        description: "Le coordinateur a été supprimé avec succès.",
      });
      setDeleteDialogId(null);
    },
  });

  // Reset PIN mutation
  const resetPinMutation = useMutation({
    mutationFn: async ({ id, newPin }: { id: string; newPin: string }) => {
      return await apiRequest(`/api/admin/coordinators/${id}/reset-pin`, "PATCH", { newPin });
    },
    onSuccess: () => {
      toast({
        title: "PIN réinitialisé",
        description: "Le PIN du coordinateur a été réinitialisé avec succès.",
      });
      setResetPinDialogId(null);
      resetPinForm.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de réinitialiser le PIN",
      });
    },
  });

  const handleCreateCoordinator = createForm.handleSubmit((data) => {
    createCoordinatorMutation.mutate(data);
  });

  const handleResetPin = resetPinForm.handleSubmit((data) => {
    if (resetPinDialogId) {
      resetPinMutation.mutate({ id: resetPinDialogId, newPin: data.newPin });
    }
  });

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      update_visibility: "Visibilité modifiée",
      update_payment_status: "Paiement modifié",
      view_request: "Demande consultée",
      send_message: "Message envoyé",
      view_chat: "Chat consulté",
    };
    return labels[action] || action;
  };

  const activeCoordinators = coordinators.filter((c: any) => c.accountStatus === "active").length;
  const blockedCoordinators = coordinators.filter((c: any) => c.accountStatus === "blocked").length;

  if (coordinatorsLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-coordinators">
        <LoadingTruck />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="coordinator-management">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="card-total-coordinators">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Coordinateurs</CardTitle>
            <Compass className="h-4 w-4 text-[#5BC0EB]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-count">{coordinators.length}</div>
            <p className="text-xs text-muted-foreground">
              Comptes coordinateurs créés
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-active-coordinators">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-active-count">{activeCoordinators}</div>
            <p className="text-xs text-muted-foreground">
              Coordinateurs opérationnels
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-blocked-coordinators">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bloqués</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-blocked-count">{blockedCoordinators}</div>
            <p className="text-xs text-muted-foreground">
              Comptes désactivés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList data-testid="tabs-coordinator">
          <TabsTrigger value="list" data-testid="tab-coordinator-list">
            <Shield className="mr-2 h-4 w-4" />
            Liste des Coordinateurs
          </TabsTrigger>
          <TabsTrigger value="activity" data-testid="tab-coordinator-activity">
            <Activity className="mr-2 h-4 w-4" />
            Activité Récente
          </TabsTrigger>
        </TabsList>

        {/* Coordinators List Tab */}
        <TabsContent value="list" data-testid="content-coordinator-list">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Compass className="h-5 w-5 text-[#5BC0EB]" />
                  Gestion des Coordinateurs
                </CardTitle>
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-[#5BC0EB] hover:bg-[#4AA8D8] text-white"
                  data-testid="button-create-coordinator"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau Coordinateur
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {coordinators.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground" data-testid="text-no-coordinators">
                  <Compass className="mx-auto h-12 w-12 mb-4 text-[#5BC0EB] opacity-50" />
                  <p>Aucun coordinateur enregistré</p>
                  <p className="text-sm">Créez votre premier coordinateur pour commencer</p>
                </div>
              ) : (
                <Table data-testid="table-coordinators">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date de création</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coordinators.map((coordinator: any) => (
                      <TableRow key={coordinator.id} data-testid={`row-coordinator-${coordinator.id}`}>
                        <TableCell className="font-medium" data-testid={`text-name-${coordinator.id}`}>
                          <div className="flex items-center gap-2">
                            <Compass className="h-4 w-4 text-[#5BC0EB]" />
                            {coordinator.name || "Sans nom"}
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-phone-${coordinator.id}`}>{coordinator.phoneNumber}</TableCell>
                        <TableCell data-testid={`badge-status-${coordinator.id}`}>
                          {coordinator.accountStatus === "active" ? (
                            <Badge className="bg-green-600">Actif</Badge>
                          ) : (
                            <Badge variant="destructive">Bloqué</Badge>
                          )}
                        </TableCell>
                        <TableCell data-testid={`text-created-${coordinator.id}`}>
                          {format(new Date(coordinator.createdAt), "dd MMM yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleStatusMutation.mutate(coordinator.id)}
                              disabled={toggleStatusMutation.isPending}
                              data-testid={`button-toggle-status-${coordinator.id}`}
                            >
                              {coordinator.accountStatus === "active" ? (
                                <>
                                  <UserX className="mr-1 h-3 w-3" />
                                  Bloquer
                                </>
                              ) : (
                                <>
                                  <UserCheck className="mr-1 h-3 w-3" />
                                  Activer
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setResetPinDialogId(coordinator.id);
                                resetPinForm.reset();
                              }}
                              data-testid={`button-reset-pin-${coordinator.id}`}
                            >
                              <RefreshCw className="mr-1 h-3 w-3" />
                              PIN
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeleteDialogId(coordinator.id)}
                              data-testid={`button-delete-${coordinator.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Logs Tab */}
        <TabsContent value="activity" data-testid="content-coordinator-activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#5BC0EB]" />
                Activité des Coordinateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex items-center justify-center py-12" data-testid="loading-activity">
                  <LoadingTruck />
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground" data-testid="text-no-activity">
                  <Activity className="mx-auto h-12 w-12 mb-4 text-[#5BC0EB] opacity-50" />
                  <p>Aucune activité enregistrée</p>
                </div>
              ) : (
                <div className="space-y-4" data-testid="list-activity-logs">
                  {activityLogs.map((log: any) => (
                    <div key={log.id} className="border-l-4 border-[#5BC0EB] pl-4 py-2" data-testid={`log-${log.id}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm" data-testid={`text-log-coordinator-${log.id}`}>
                          {log.coordinatorName || log.coordinatorPhone}
                        </span>
                        <span className="text-xs text-muted-foreground" data-testid={`text-log-time-${log.id}`}>
                          {format(new Date(log.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[#5BC0EB] border-[#5BC0EB]" data-testid={`badge-log-action-${log.id}`}>
                          {getActionLabel(log.action)}
                        </Badge>
                        {log.targetType && (
                          <span className="text-xs text-muted-foreground" data-testid={`text-log-target-${log.id}`}>
                            {log.targetType}: {log.targetId?.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Coordinator Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent data-testid="dialog-create-coordinator">
          <DialogHeader>
            <DialogTitle>Nouveau Coordinateur</DialogTitle>
            <DialogDescription>
              Créez un nouveau compte coordinateur pour la gestion opérationnelle de la plateforme.
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={handleCreateCoordinator} className="space-y-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom complet</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: Ahmed Bennani"
                        data-testid="input-coordinator-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro de téléphone</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="+212XXXXXXXXX"
                        data-testid="input-coordinator-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="pin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code PIN (6 chiffres)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="******"
                        maxLength={6}
                        data-testid="input-coordinator-pin"
                      />
                    </FormControl>
                    <FormDescription>
                      Le coordinateur utilisera ce PIN pour se connecter
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  data-testid="button-cancel-create"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={createCoordinatorMutation.isPending}
                  className="bg-[#5BC0EB] hover:bg-[#4AA8D8]"
                  data-testid="button-confirm-create"
                >
                  {createCoordinatorMutation.isPending ? "Création..." : "Créer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Reset PIN Dialog */}
      <Dialog open={!!resetPinDialogId} onOpenChange={(open) => !open && setResetPinDialogId(null)}>
        <DialogContent data-testid="dialog-reset-pin">
          <DialogHeader>
            <DialogTitle>Réinitialiser le PIN</DialogTitle>
            <DialogDescription>
              Entrez un nouveau code PIN à 6 chiffres pour ce coordinateur.
            </DialogDescription>
          </DialogHeader>
          <Form {...resetPinForm}>
            <form onSubmit={handleResetPin} className="space-y-4">
              <FormField
                control={resetPinForm.control}
                name="newPin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nouveau PIN (6 chiffres)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="******"
                        maxLength={6}
                        data-testid="input-reset-pin"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResetPinDialogId(null)}
                  data-testid="button-cancel-reset"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={resetPinMutation.isPending}
                  data-testid="button-confirm-reset-pin"
                >
                  {resetPinMutation.isPending ? "Réinitialisation..." : "Réinitialiser"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialogId} onOpenChange={(open) => !open && setDeleteDialogId(null)}>
        <AlertDialogContent data-testid="dialog-delete-coordinator">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce coordinateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le compte coordinateur sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialogId && deleteCoordinatorMutation.mutate(deleteDialogId)}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
