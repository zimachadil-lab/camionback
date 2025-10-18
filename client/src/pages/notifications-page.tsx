import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Check, CheckCheck, Inbox, CheckCircle, MessageSquare, Wallet, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type Notification } from "@shared/schema";
import { Header } from "@/components/layout/header";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function NotificationsPage() {
  const [, navigate] = useLocation();
  const user = JSON.parse(localStorage.getItem("camionback_user") || "{}");

  const handleLogout = () => {
    // Clear user session
    localStorage.removeItem("camionback_user");
    // Force page reload to clear all state
    window.location.href = "/";
  };

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: [`/api/notifications?userId=${user.id}`],
    enabled: !!user.id,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications?userId=${user.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/unread-count?userId=${user.id}`] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/notifications/mark-all-read", {
        userId: user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications?userId=${user.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/unread-count?userId=${user.id}`] });
    },
  });

  const getNotificationIcon = (type: string) => {
    const iconProps = { className: "h-6 w-6" };
    switch (type) {
      case "offer_received":
        return <Inbox {...iconProps} />;
      case "offer_accepted":
        return <CheckCircle {...iconProps} />;
      case "message_received":
        return <MessageSquare {...iconProps} />;
      case "payment_validated":
        return <Wallet {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={user}
        onLogout={handleLogout}
      />

      <div className="container mx-auto p-4 md:p-6 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {unreadCount} notification{unreadCount > 1 ? "s" : ""} non lue{unreadCount > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              data-testid="button-mark-all-read"
              className="gap-2 w-full sm:w-auto"
            >
              <CheckCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Tout marquer comme lu</span>
              <span className="sm:hidden">Marquer comme lu</span>
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`transition-all hover-elevate cursor-pointer ${
                  !notification.read ? "border-l-4 border-l-primary" : ""
                }`}
                onClick={() => {
                  if (!notification.read) {
                    markAsReadMutation.mutate(notification.id);
                  }
                }}
                data-testid={`notification-${notification.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 text-primary">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-base">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <Badge variant="default" className="flex-shrink-0">
                            Nouveau
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notification.createdAt && format(new Date(notification.createdAt), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                      </p>
                    </div>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsReadMutation.mutate(notification.id);
                        }}
                        data-testid={`button-mark-read-${notification.id}`}
                        className="flex-shrink-0"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Aucune notification</h3>
              <p className="text-muted-foreground">
                Vous n'avez pas encore de notifications. Elles apparaîtront ici lorsque vous recevrez des offres, messages ou mises à jour.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
