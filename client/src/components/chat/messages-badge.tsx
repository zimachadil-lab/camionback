import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useLocation } from "wouter";

interface MessagesBadgeProps {
  userId: string;
}

export function MessagesBadge({ userId }: MessagesBadgeProps) {
  const [, navigate] = useLocation();
  
  const { data } = useQuery<{ count: number }>({
    queryKey: [`/api/chat/unread-count?userId=${userId}`],
    refetchInterval: 5000,
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
          className="absolute -top-0.5 -end-0.5 h-5 min-w-[1.25rem] px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background"
          data-testid="badge-unread-messages-count"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Button>
  );
}
