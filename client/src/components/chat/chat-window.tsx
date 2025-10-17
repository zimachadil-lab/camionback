import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  senderId: string;
  message: string;
  filteredMessage?: string;
  createdAt: Date;
}

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUserId,
      message: newMessage,
      createdAt: new Date(),
    };

    setMessages([...messages, message]);
    setNewMessage("");
    
    // API call will be implemented in phase 2
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
              const displayMessage = msg.filteredMessage || msg.message;
              
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{displayMessage}</p>
                    {msg.filteredMessage && (
                      <p className="text-xs opacity-70 mt-1">
                        [Contenu filtré]
                      </p>
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
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Tapez votre message..."
            data-testid="input-chat-message"
          />
          <Button 
            onClick={handleSendMessage} 
            size="icon"
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
