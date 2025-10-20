import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send, Megaphone, History, Eye, Trash2, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SmsHistoryRecord {
  id: string;
  adminId: string;
  adminName?: string;
  targetAudience: string;
  message: string;
  recipientCount: number;
  status: string;
  createdAt: string;
}

export default function AdminCommunications() {
  const { toast } = useToast();
  const [customMessage, setCustomMessage] = useState("");
  const [targetAudience, setTargetAudience] = useState<string>("transporters");
  const [viewRecord, setViewRecord] = useState<SmsHistoryRecord | null>(null);

  // Get current user from localStorage
  const userStr = localStorage.getItem("user");
  const currentUser = userStr ? JSON.parse(userStr) : null;

  // Fetch SMS history
  const { data: smsHistory = [], isLoading: historyLoading } = useQuery<SmsHistoryRecord[]>({
    queryKey: [`/api/admin/sms/history?adminId=${currentUser?.id}`],
    enabled: !!currentUser?.id,
  });

  // Quick notify transporters mutation
  const notifyTransportersMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/sms/notify-transporters", {
        adminId: currentUser?.id
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "SMS envoyés avec succès",
        description: `${data.sent} SMS envoyés à ${data.total} transporteurs validés`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/sms/history?adminId=${currentUser?.id}`] });
      setCustomMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur d'envoi",
        description: error.message || "Impossible d'envoyer les SMS",
        variant: "destructive",
      });
    },
  });

  // Send custom SMS mutation
  const sendCustomSmsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/sms/send", {
        adminId: currentUser?.id,
        targetAudience,
        message: customMessage
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "SMS envoyés avec succès",
        description: `${data.sent} SMS envoyés à ${data.total} destinataires`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/sms/history?adminId=${currentUser?.id}`] });
      setCustomMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur d'envoi",
        description: error.message || "Impossible d'envoyer les SMS",
        variant: "destructive",
      });
    },
  });

  // Delete SMS history mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/sms/history/${id}?adminId=${currentUser?.id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Supprimé",
        description: "L'entrée a été supprimée de l'historique",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/sms/history?adminId=${currentUser?.id}`] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'entrée",
        variant: "destructive",
      });
    },
  });

  const handleNotifyTransporters = () => {
    if (!currentUser?.id) {
      toast({
        title: "Erreur",
        description: "Session expirée, veuillez vous reconnecter",
        variant: "destructive",
      });
      return;
    }
    notifyTransportersMutation.mutate();
  };

  const handleSendCustomSms = () => {
    if (!currentUser?.id) {
      toast({
        title: "Erreur",
        description: "Session expirée, veuillez vous reconnecter",
        variant: "destructive",
      });
      return;
    }

    if (!customMessage.trim()) {
      toast({
        title: "Message requis",
        description: "Veuillez saisir un message à envoyer",
        variant: "destructive",
      });
      return;
    }

    if (customMessage.length > 160) {
      toast({
        title: "Message trop long",
        description: "Le message ne peut pas dépasser 160 caractères",
        variant: "destructive",
      });
      return;
    }

    sendCustomSmsMutation.mutate();
  };

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case "transporters":
        return "Transporteurs";
      case "clients":
        return "Clients";
      case "both":
        return "Clients et Transporteurs";
      default:
        return audience;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "sent") {
      return <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Envoyé</span>;
    }
    return <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">Échec</span>;
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Megaphone className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Communications & SMS</h1>
      </div>

      {/* Block 1: Quick notify transporters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Envoi rapide aux transporteurs
          </CardTitle>
          <CardDescription>
            Notifier tous les transporteurs validés des nouvelles offres disponibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Message qui sera envoyé :</p>
              <p className="text-sm italic">
                "🚛 De nouvelles offres de transport sont disponibles sur CamionBack ! Connectez-vous dès maintenant pour proposer vos tarifs."
              </p>
            </div>
            <Button
              onClick={handleNotifyTransporters}
              disabled={notifyTransportersMutation.isPending}
              className="w-full"
              data-testid="button-notify-transporters"
            >
              <Users className="h-4 w-4 mr-2" />
              {notifyTransportersMutation.isPending ? "Envoi en cours..." : "Notifier les transporteurs validés"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Block 2: Custom SMS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Envoi libre de SMS personnalisés
          </CardTitle>
          <CardDescription>
            Rédigez et envoyez un message personnalisé à votre audience cible
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Public ciblé</label>
              <Select value={targetAudience} onValueChange={setTargetAudience}>
                <SelectTrigger data-testid="select-target-audience">
                  <SelectValue placeholder="Sélectionner le public" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transporters">Tous les transporteurs</SelectItem>
                  <SelectItem value="clients">Tous les clients</SelectItem>
                  <SelectItem value="both">Les deux (transporteurs + clients)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Message SMS</label>
                <span className={`text-xs ${customMessage.length > 160 ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {customMessage.length}/160
                </span>
              </div>
              <Textarea
                placeholder="Rédigez votre message ici (max 160 caractères)..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={4}
                maxLength={160}
                data-testid="textarea-custom-message"
              />
            </div>

            <Button
              onClick={handleSendCustomSms}
              disabled={sendCustomSmsMutation.isPending || !customMessage.trim() || customMessage.length > 160}
              className="w-full bg-green-600 hover:bg-green-700"
              data-testid="button-send-custom-sms"
            >
              <Send className="h-4 w-4 mr-2" />
              {sendCustomSmsMutation.isPending ? "Envoi en cours..." : "Envoyer le SMS"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Block 3: SMS History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique d'envois
          </CardTitle>
          <CardDescription>
            Consultez l'historique de tous les SMS envoyés depuis la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <p className="text-center text-muted-foreground py-8">Chargement de l'historique...</p>
          ) : smsHistory.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun SMS envoyé pour le moment</p>
          ) : (
            <div className="space-y-3">
              {smsHistory.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                  data-testid={`history-record-${record.id}`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        {format(new Date(record.createdAt), "dd/MM/yyyy à HH:mm", { locale: fr })}
                      </span>
                      {getStatusBadge(record.status)}
                      <span className="text-xs text-muted-foreground">
                        {getAudienceLabel(record.targetAudience)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {record.recipientCount} destinataires
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{record.message}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewRecord(record)}
                      data-testid={`button-view-${record.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(record.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${record.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Record Dialog */}
      <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails du SMS</DialogTitle>
            <DialogDescription>
              Informations complètes sur cet envoi
            </DialogDescription>
          </DialogHeader>
          {viewRecord && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date et heure</p>
                <p className="text-sm">
                  {format(new Date(viewRecord.createdAt), "dd/MM/yyyy à HH:mm:ss", { locale: fr })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cible</p>
                <p className="text-sm">{getAudienceLabel(viewRecord.targetAudience)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Destinataires</p>
                <p className="text-sm">{viewRecord.recipientCount}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Statut</p>
                <div className="mt-1">{getStatusBadge(viewRecord.status)}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Message</p>
                <p className="text-sm mt-1 p-3 bg-muted rounded">{viewRecord.message}</p>
              </div>
              {viewRecord.adminName && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Envoyé par</p>
                  <p className="text-sm">{viewRecord.adminName}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
