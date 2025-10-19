import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type ChatMessage } from "@shared/schema";
import { VoiceRecorder } from "./voice-recorder";
import { VoiceMessagePlayer } from "./voice-message-player";
import { useToast } from "@/hooks/use-toast";

interface ChatWindowProps {
  open: boolean;
  onClose: () => void;
  otherUser: {
    id: string;
    name: string;
    role: string;
  };
  currentUserId: string;
  requestId: string;
}

export function ChatWindow({ open, onClose, otherUser, currentUserId, requestId }: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: messages = [], refetch } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chat/messages?requestId=${requestId}`],
    enabled: open && !!requestId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!open) {
      // Close existing websocket if chat is closed
      if (ws) {
        ws.close();
        setWs(null);
      }
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws-chat`;
    
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      console.log('Chat WebSocket connected');
    };
    
    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat' && data.requestId === requestId) {
          refetch();
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };
    
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    setWs(websocket);
    
    return () => {
      websocket.close();
      setWs(null);
    };
  }, [open, requestId, refetch]);

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { message?: string; messageType?: string; fileUrl?: string }) => {
      return apiRequest("POST", "/api/chat/messages", {
        requestId,
        senderId: currentUserId,
        receiverId: otherUser.id,
        ...messageData,
      });
    },
    onSuccess: (newMsg) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'chat',
          requestId,
          message: newMsg,
        }));
      }
      queryClient.invalidateQueries({ queryKey: [`/api/chat/messages?requestId=${requestId}`] });
      setNewMessage("");
    },
  });

  const handleVoiceRecorded = async (audioBlob: Blob) => {
    try {
      console.log('Starting voice upload:', {
        size: audioBlob.size,
        type: audioBlob.type
      });

      // Upload voice file
      const formData = new FormData();
      const fileName = `voice-${Date.now()}.webm`;
      formData.append('audio', audioBlob, fileName);

      console.log('Sending to /api/messages/upload-voice...');
      const response = await fetch('/api/messages/upload-voice', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Upload error response:', errorData);
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      const { fileUrl } = result;

      // Send voice message
      await sendMessageMutation.mutateAsync({
        messageType: 'voice',
        fileUrl,
      });
    } catch (error) {
      console.error('Voice message error:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Échec de l'envoi du message vocal",
      });
    }
  };

  const handleSendMessage = () => {
    const trimmed = newMessage.trim();
    if (!trimmed) return;
    sendMessageMutation.mutate({ message: trimmed, messageType: 'text' });
  };

  if (!open) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] h-[500px] flex flex-col z-50 shadow-xl">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{otherUser.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base">{otherUser.name}</CardTitle>
            <p className="text-xs text-muted-foreground capitalize">{otherUser.role}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          data-testid="button-close-chat"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucun message. Démarrez la conversation!
            </p>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.senderId === currentUserId;
              const isVoiceMessage = msg.messageType === 'voice';
              const displayMessage = msg.filteredMessage || msg.message;
              
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  data-testid={`message-${msg.id}`}
                >
                  <div
                    className={`max-w-[80%] ${
                      isVoiceMessage ? '' : 'rounded-lg px-4 py-2'
                    } ${
                      isOwn
                        ? isVoiceMessage ? '' : "bg-primary text-primary-foreground"
                        : isVoiceMessage ? '' : "bg-muted"
                    }`}
                  >
                    {isVoiceMessage && msg.fileUrl ? (
                      <VoiceMessagePlayer audioUrl={msg.fileUrl} />
                    ) : (
                      <>
                        <p className="text-sm">{displayMessage}</p>
                        {msg.filteredMessage && (
                          <p className="text-xs opacity-70 mt-1">
                            [Contenu filtré]
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <CardContent className="p-4 pt-0 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !sendMessageMutation.isPending && handleSendMessage()}
            placeholder="Tapez votre message..."
            disabled={sendMessageMutation.isPending}
            data-testid="input-chat-message"
          />
          <VoiceRecorder 
            onVoiceRecorded={handleVoiceRecorded}
            disabled={sendMessageMutation.isPending}
          />
          <Button 
            onClick={handleSendMessage} 
            size="icon"
            disabled={sendMessageMutation.isPending || !newMessage.trim()}
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
