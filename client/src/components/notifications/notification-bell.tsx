import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface NotificationBellProps {
  userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [, navigate] = useLocation();

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: [`/api/notifications/unread-count?userId=${userId}`],
    enabled: !!userId,
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.count || 0;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={() => navigate("/notifications")}
      data-testid="button-notifications"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span
          className="absolute -top-0.5 -end-0.5 h-5 min-w-[1.25rem] px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background"
          data-testid="badge-unread-count"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Button>
  );
}
