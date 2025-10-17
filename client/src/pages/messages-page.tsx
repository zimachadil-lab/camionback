import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ArrowRight } from "lucide-react";
import { ChatWindow } from "@/components/chat/chat-window";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  // Fetch conversations
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: [`/api/chat/conversations?userId=${user?.id}`],
    enabled: !!user?.id,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Mutation pour marquer comme lu
  const markReadMutation = useMutation({
    mutationFn: async ({ userId, requestId }: { userId: string; requestId: string }) => {
      return apiRequest("POST", "/api/chat/mark-read", { userId, requestId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chat/conversations?userId=${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/chat/unread-count?userId=${user?.id}`] });
    },
  });

  const handleOpenConversation = (conversation: any) => {
    setSelectedConversation(conversation);
    setChatOpen(true);
    
    // Marquer les messages comme lus
    if (conversation.unreadCount > 0 && user?.id) {
      markReadMutation.mutate({ userId: user.id, requestId: conversation.requestId });
    }
  };

  const handleCloseChat = () => {
    setChatOpen(false);
    setSelectedConversation(null);
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Vous devez être connecté pour consulter vos messages.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">
            Consultez vos conversations
          </p>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Chargement...</p>
          </CardContent>
        </Card>
      ) : conversations.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Aucune conversation pour le moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {conversations.map((conversation: any) => (
            <Card 
              key={conversation.requestId} 
              className="hover-elevate"
              data-testid={`conversation-${conversation.requestId}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">
                        {conversation.referenceId}
                      </CardTitle>
                      {conversation.unreadCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="rounded-full"
                          data-testid={`badge-unread-${conversation.requestId}`}
                        >
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {conversation.fromCity} → {conversation.toCity}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleOpenConversation(conversation)}
                    size="sm"
                    className="gap-2 flex-shrink-0"
                    data-testid={`button-view-conversation-${conversation.requestId}`}
                  >
                    Voir conversation
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-muted-foreground">
                    {conversation.otherUser.role === "client" ? "Client" : "Transporteur"} :
                  </span>
                  <span className="text-foreground">{conversation.otherUser.name}</span>
                </div>
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    Dernier message : {conversation.lastMessage.filteredMessage || conversation.lastMessage.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(conversation.lastMessage.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedConversation && (
        <ChatWindow
          open={chatOpen}
          onClose={handleCloseChat}
          otherUser={selectedConversation.otherUser}
          currentUserId={user.id}
          requestId={selectedConversation.requestId}
        />
      )}
    </div>
  );
}
