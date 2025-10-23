import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, Inbox, CheckCircle, MessageSquare, Package, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";

interface GroupedNotification {
  requestId: string;
  referenceId: string;
  notifications: {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
  }[];
  unreadCount: number;
}

interface CoordinatorNotificationsProps {
  userId: string;
}

export function CoordinatorNotifications({ userId }: CoordinatorNotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: groupedNotifications, isLoading } = useQuery<GroupedNotification[]>({
    queryKey: [`/api/coordinator/notifications?userId=${userId}`],
    enabled: !!userId && isOpen,
    refetchInterval: 30000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/coordinator/notifications?userId=${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/unread-count?userId=${userId}`] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/coordinator/notifications/mark-all-read", {
        userId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/coordinator/notifications?userId=${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/unread-count?userId=${userId}`] });
    },
  });

  const getNotificationIcon = (type: string) => {
    const iconProps = { className: "h-5 w-5" };
    switch (type) {
      case "offer_received":
        return <Inbox {...iconProps} />;
      case "offer_accepted":
        return <CheckCircle {...iconProps} />;
      case "message_received":
        return <MessageSquare {...iconProps} />;
      case "payment_validated":
        return <Package {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  const totalUnread = groupedNotifications?.reduce((acc, group) => acc + group.unreadCount, 0) || 0;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-coordinator-notifications"
        >
          <Bell className="h-5 w-5" />
          {totalUnread > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              data-testid="badge-coordinator-unread-count"
            >
              {totalUnread > 9 ? "9+" : totalUnread}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>Notifications</SheetTitle>
              <SheetDescription>
                {totalUnread > 0 
                  ? `${totalUnread} notification${totalUnread > 1 ? "s" : ""} non lue${totalUnread > 1 ? "s" : ""}`
                  : "Toutes vos notifications sont lues"
                }
              </SheetDescription>
            </div>
            {totalUnread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                data-testid="button-mark-all-read"
                className="gap-2"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : groupedNotifications && groupedNotifications.length > 0 ? (
            <div className="space-y-4">
              {groupedNotifications.map((group) => (
                <Card
                  key={group.requestId}
                  className={`${group.unreadCount > 0 ? "border-l-4 border-l-[#5BC0EB]" : ""}`}
                  data-testid={`notification-group-${group.requestId}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Package className="h-4 w-4 text-[#5BC0EB]" />
                        {group.referenceId}
                      </CardTitle>
                      {group.unreadCount > 0 && (
                        <Badge 
                          variant="secondary"
                          className="bg-[#5BC0EB]/10 text-[#5BC0EB] border-[#5BC0EB]/20"
                        >
                          {group.unreadCount} nouveau{group.unreadCount > 1 ? "x" : ""}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {group.notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-md hover-elevate ${
                          !notification.read ? "bg-muted/50" : ""
                        }`}
                        data-testid={`notification-${notification.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 text-[#5BC0EB]">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="font-medium text-sm">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(notification.createdAt), "dd/MM à HH:mm", { locale: fr })}
                                </p>
                              </div>
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 flex-shrink-0"
                                  onClick={() => markAsReadMutation.mutate(notification.id)}
                                  data-testid={`button-mark-read-${notification.id}`}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Aucune notification</h3>
                <p className="text-sm text-muted-foreground">
                  Vous n'avez pas encore de notifications.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
