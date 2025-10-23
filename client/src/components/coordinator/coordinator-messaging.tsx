import { useQuery, useMutation } from "@tanstack/react-query";
import { MessageSquare, Send, Phone, X, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ConversationGroup {
  requestId: string;
  referenceId: string;
  client: {
    id: string;
    name: string;
    phoneNumber: string;
  } | null;
  transporter: {
    id: string;
    name: string;
    phoneNumber: string;
  } | null;
  lastMessage: {
    content: string;
    createdAt: string;
    senderType: string;
  } | null;
  unreadCount: number;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  messageType: string;
  senderType: string;
  isRead: boolean;
  createdAt: string;
}

interface CoordinatorMessagingProps {
  userId: string;
}

export function CoordinatorMessaging({ userId }: CoordinatorMessagingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<ConversationGroup | null>(null);
  const [messageText, setMessageText] = useState("");
  const { toast } = useToast();

  const { data: conversations, isLoading } = useQuery<ConversationGroup[]>({
    queryKey: [`/api/coordinator/conversations?userId=${userId}`],
    enabled: isOpen && !!userId,
    refetchInterval: 15000,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: [`/api/coordinator/conversations/${selectedConversation?.requestId}/messages`],
    enabled: !!selectedConversation,
    refetchInterval: 5000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { senderId: string; receiverId: string; message: string }) => {
      return apiRequest("POST", `/api/coordinator/conversations/${selectedConversation?.requestId}/messages`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/coordinator/conversations/${selectedConversation?.requestId}/messages`] 
      });
      queryClient.invalidateQueries({ queryKey: [`/api/coordinator/conversations`] });
      setMessageText("");
      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return apiRequest("PATCH", `/api/coordinator/conversations/${requestId}/mark-read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/coordinator/conversations`] });
    },
  });

  const handleSendMessage = (receiverId: string) => {
    if (!messageText.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      senderId: userId,
      receiverId,
      message: messageText.trim(),
    });
  };

  const handleOpenConversation = (conversation: ConversationGroup) => {
    setSelectedConversation(conversation);
    if (conversation.unreadCount > 0) {
      markAsReadMutation.mutate(conversation.requestId);
    }
  };

  const totalUnread = conversations?.reduce((acc, conv) => acc + conv.unreadCount, 0) || 0;

  const normalizePhone = (phone: string) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.startsWith("212") ? cleaned : `212${cleaned.replace(/^0+/, "")}`;
  };

  const makePhoneCall = (phone: string) => {
    const normalized = normalizePhone(phone);
    window.location.href = `tel:+${normalized}`;
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            data-testid="button-coordinator-messages"
          >
            <MessageSquare className="h-5 w-5" />
            {totalUnread > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                data-testid="badge-coordinator-messages-unread"
              >
                {totalUnread > 9 ? "9+" : totalUnread}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Messagerie</SheetTitle>
            <SheetDescription>
              {totalUnread > 0 
                ? `${totalUnread} conversation${totalUnread > 1 ? "s" : ""} non lue${totalUnread > 1 ? "s" : ""}`
                : "Toutes les conversations"
              }
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-3">
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
            ) : conversations && conversations.length > 0 ? (
              <div className="space-y-3">
                {conversations.map((conversation) => (
                  <Card
                    key={conversation.requestId}
                    className={`cursor-pointer hover-elevate ${
                      conversation.unreadCount > 0 ? "border-l-4 border-l-[#5BC0EB]" : ""
                    }`}
                    onClick={() => handleOpenConversation(conversation)}
                    data-testid={`conversation-${conversation.requestId}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold">
                          {conversation.referenceId}
                        </CardTitle>
                        {conversation.unreadCount > 0 && (
                          <Badge 
                            variant="secondary"
                            className="bg-[#5BC0EB]/10 text-[#5BC0EB] border-[#5BC0EB]/20"
                          >
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {conversation.client && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Client:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{conversation.client.name}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  makePhoneCall(conversation.client!.phoneNumber);
                                }}
                                data-testid={`button-call-client-${conversation.requestId}`}
                              >
                                <Phone className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                        {conversation.transporter && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Transporteur:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{conversation.transporter.name}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  makePhoneCall(conversation.transporter!.phoneNumber);
                                }}
                                data-testid={`button-call-transporter-${conversation.requestId}`}
                              >
                                <Phone className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                        {conversation.lastMessage && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs text-muted-foreground truncate">
                              {conversation.lastMessage.content}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(conversation.lastMessage.createdAt), "dd/MM à HH:mm", { locale: fr })}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Aucune conversation</h3>
                  <p className="text-sm text-muted-foreground">
                    Les conversations apparaîtront ici.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{selectedConversation?.referenceId}</DialogTitle>
                <DialogDescription className="mt-2 space-y-1">
                  {selectedConversation?.client && (
                    <div className="flex items-center gap-2">
                      <span>Client: {selectedConversation.client.name}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 gap-1"
                        onClick={() => makePhoneCall(selectedConversation.client!.phoneNumber)}
                        data-testid="button-call-client-dialog"
                      >
                        <Phone className="h-3 w-3" />
                        <span className="text-xs">{selectedConversation.client.phoneNumber}</span>
                      </Button>
                    </div>
                  )}
                  {selectedConversation?.transporter && (
                    <div className="flex items-center gap-2">
                      <span>Transporteur: {selectedConversation.transporter.name}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 gap-1"
                        onClick={() => makePhoneCall(selectedConversation.transporter!.phoneNumber)}
                        data-testid="button-call-transporter-dialog"
                      >
                        <Phone className="h-3 w-3" />
                        <span className="text-xs">{selectedConversation.transporter.phoneNumber}</span>
                      </Button>
                    </div>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 py-4">
            {messagesLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : messages && messages.length > 0 ? (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderType === "coordinateur" ? "justify-end" : "justify-start"
                  }`}
                  data-testid={`message-${message.id}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.senderType === "coordinateur"
                        ? "bg-[#5BC0EB] text-white"
                        : "bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium opacity-80">
                        {message.senderType === "client" ? "Client" : 
                         message.senderType === "transporter" ? "Transporteur" : "Vous"}
                      </span>
                      {message.isRead && message.senderType === "coordinateur" && (
                        <CheckCheck className="h-3 w-3 opacity-80" />
                      )}
                    </div>
                    <p className="text-sm">{message.message}</p>
                    <p className={`text-xs mt-1 ${
                      message.senderType === "coordinateur" ? "opacity-80" : "text-muted-foreground"
                    }`}>
                      {format(new Date(message.createdAt), "HH:mm", { locale: fr })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Aucun message dans cette conversation
              </div>
            )}
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex gap-2">
              {selectedConversation?.client && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleSendMessage(selectedConversation.client!.id)}
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  data-testid="button-send-to-client"
                >
                  Envoyer au client
                </Button>
              )}
              {selectedConversation?.transporter && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleSendMessage(selectedConversation.transporter!.id)}
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  data-testid="button-send-to-transporter"
                >
                  Envoyer au transporteur
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Textarea
                placeholder="Écrivez votre message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="min-h-[80px]"
                data-testid="textarea-coordinator-message"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
