import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useLocation } from "wouter";

interface MessagesBadgeProps {
  userId: string;
}

export function MessagesBadge({ userId }: MessagesBadgeProps) {
  const [, navigate] = useLocation();
  
  const { data } = useQuery({
    queryKey: [`/api/chat/unread-count?userId=${userId}`],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const unreadCount = data?.count || 0;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => navigate("/messages")}
      className="relative"
      data-testid="button-messages"
    >
      <MessageSquare className="h-5 w-5" />
      {unreadCount > 0 && (
        <span
          className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center"
          data-testid="badge-unread-messages-count"
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Button>
  );
}
