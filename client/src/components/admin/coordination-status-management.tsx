import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Settings as SettingsIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingTruck } from "@/components/ui/loading-truck";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const statusFormSchema = z.object({
  label: z.string().min(1, "Le label est requis"),
  value: z.string().min(1, "La valeur est requise").regex(/^[a-z_]+$/, "Lettres minuscules et underscores uniquement"),
  category: z.enum(["en_action", "prioritaires", "archives"], {
    required_error: "La catégorie est requise"
  }),
  color: z.string().optional(),
  displayOrder: z.coerce.number().min(0),
});

type StatusFormData = z.infer<typeof statusFormSchema>;

export function CoordinationStatusManagement() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogData, setEditDialogData] = useState<any>(null);
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);
  const { toast } = useToast();

  const createForm = useForm<StatusFormData>({
    resolver: zodResolver(statusFormSchema),
    defaultValues: {
      label: "",
      value: "",
      category: "en_action",
      color: "",
      displayOrder: 0,
    },
  });

  const editForm = useForm<StatusFormData>({
    resolver: zodResolver(statusFormSchema),
  });

  const { data: statuses = [], isLoading } = useQuery({
    queryKey: ["/api/admin/coordination-statuses"],
    queryFn: async () => {
      const response = await fetch(`/api/admin/coordination-statuses?userId=${user.id}`);
      if (!response.ok) throw new Error("Erreur de chargement");
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch status usage counts
  const { data: statusUsage = {} } = useQuery({
    queryKey: ["/api/admin/coordination-status-usage"],
    queryFn: async () => {
      const response = await fetch(`/api/admin/coordination-status-usage?userId=${user.id}`);
      if (!response.ok) return {};
      const data = await response.json();
      const usageMap: Record<string, number> = {};
      data.forEach((item: any) => {
        usageMap[item.coordination_status] = item.usage_count;
      });
      return usageMap;
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: StatusFormData) => {
      return await apiRequest("POST", `/api/admin/coordination-statuses?userId=${user.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coordination-statuses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coordination-status-usage"] });
      toast({
        title: "Statut créé",
        description: "Le nouveau statut a été créé avec succès.",
      });
      setCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de créer le statut",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StatusFormData> }) => {
      return await apiRequest("PATCH", `/api/admin/coordination-statuses/${id}?userId=${user.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coordination-statuses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coordination-status-usage"] });
      toast({
        title: "Statut modifié",
        description: "Le statut a été mis à jour avec succès.",
      });
      setEditDialogData(null);
      editForm.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de modifier le statut",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/coordination-statuses/${id}?userId=${user.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coordination-statuses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coordination-status-usage"] });
      toast({
        title: "Statut supprimé",
        description: "Le statut a été supprimé avec succès.",
      });
      setDeleteDialogId(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de supprimer le statut",
      });
    },
  });

  const handleCreate = (data: StatusFormData) => {
    createMutation.mutate(data);
  };

  const handleEdit = (status: any) => {
    setEditDialogData(status);
    editForm.reset({
      label: status.label,
      value: status.value,
      category: status.category,
      color: status.color || "",
      displayOrder: status.displayOrder,
    });
  };

  const handleUpdate = (data: StatusFormData) => {
    if (editDialogData) {
      updateMutation.mutate({ id: editDialogData.id, data });
    }
  };

  const enActionStatuses = statuses.filter((s: any) => s.category === "en_action");
  const prioritairesStatuses = statuses.filter((s: any) => s.category === "prioritaires");
  const archivesStatuses = statuses.filter((s: any) => s.category === "archives");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Gestion des Statuts de Coordination
          </CardTitle>
          <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-status">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un statut
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingTruck />
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">En Action ({enActionStatuses.length} statuts)</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ordre</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Valeur</TableHead>
                    <TableHead>Couleur</TableHead>
                    <TableHead>Utilisations</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enActionStatuses.map((status: any) => (
                    <TableRow key={status.id}>
                      <TableCell>{status.displayOrder}</TableCell>
                      <TableCell className="font-medium">{status.label}</TableCell>
                      <TableCell><code className="text-xs bg-muted px-2 py-1 rounded">{status.value}</code></TableCell>
                      <TableCell>
                        {status.color && (
                          <Badge variant="outline">{status.color}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {statusUsage[status.value] || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(status)}
                          data-testid={`button-edit-status-${status.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteDialogId(status.id)}
                          data-testid={`button-delete-status-${status.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {enActionStatuses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Aucun statut "En Action"
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Prioritaires ({prioritairesStatuses.length} statuts)</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ordre</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Valeur</TableHead>
                    <TableHead>Couleur</TableHead>
                    <TableHead>Utilisations</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prioritairesStatuses.map((status: any) => (
                    <TableRow key={status.id}>
                      <TableCell>{status.displayOrder}</TableCell>
                      <TableCell className="font-medium">{status.label}</TableCell>
                      <TableCell><code className="text-xs bg-muted px-2 py-1 rounded">{status.value}</code></TableCell>
                      <TableCell>
                        {status.color && (
                          <Badge variant="outline">{status.color}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {statusUsage[status.value] || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(status)}
                          data-testid={`button-edit-status-${status.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteDialogId(status.id)}
                          data-testid={`button-delete-status-${status.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {prioritairesStatuses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Aucun statut "Prioritaires"
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Archives ({archivesStatuses.length} statuts)</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ordre</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Valeur</TableHead>
                    <TableHead>Couleur</TableHead>
                    <TableHead>Utilisations</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivesStatuses.map((status: any) => (
                    <TableRow key={status.id}>
                      <TableCell>{status.displayOrder}</TableCell>
                      <TableCell className="font-medium">{status.label}</TableCell>
                      <TableCell><code className="text-xs bg-muted px-2 py-1 rounded">{status.value}</code></TableCell>
                      <TableCell>
                        {status.color && (
                          <Badge variant="outline">{status.color}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {statusUsage[status.value] || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(status)}
                          data-testid={`button-edit-status-${status.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteDialogId(status.id)}
                          data-testid={`button-delete-status-${status.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {archivesStatuses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Aucun statut "Archives"
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau statut</DialogTitle>
              <DialogDescription>
                Ajoutez un nouveau statut de coordination
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Client injoignable" {...field} data-testid="input-create-label" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valeur technique</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: client_injoignable" {...field} data-testid="input-create-value" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-create-category">
                            <SelectValue placeholder="Sélectionner une catégorie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en_action">En Action</SelectItem>
                          <SelectItem value="prioritaires">Prioritaires</SelectItem>
                          <SelectItem value="archives">Archives</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Couleur (optionnel)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: orange, red, blue" {...field} data-testid="input-create-color" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordre d'affichage</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-create-order" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-create">
                    {createMutation.isPending ? "Création..." : "Créer"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editDialogData} onOpenChange={() => setEditDialogData(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le statut</DialogTitle>
              <DialogDescription>
                Modifiez les informations du statut
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-label" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valeur technique</FormLabel>
                      <FormControl>
                        <Input {...field} disabled data-testid="input-edit-value" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-category">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en_action">En Action</SelectItem>
                          <SelectItem value="prioritaires">Prioritaires</SelectItem>
                          <SelectItem value="archives">Archives</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Couleur (optionnel)</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-color" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordre d'affichage</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-edit-order" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditDialogData(null)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit">
                    {updateMutation.isPending ? "Modification..." : "Modifier"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteDialogId} onOpenChange={() => setDeleteDialogId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer ce statut ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteDialogId && deleteMutation.mutate(deleteDialogId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
