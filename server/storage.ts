import { 
  type User, type InsertUser,
  type OtpCode, type InsertOtpCode,
  type TransportRequest, type InsertTransportRequest,
  type Offer, type InsertOffer,
  type ChatMessage, type InsertChatMessage,
  type AdminSettings, type InsertAdminSettings,
  type Notification, type InsertNotification
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phoneNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // OTP operations
  createOtp(otp: InsertOtpCode): Promise<OtpCode>;
  getOtpByPhone(phoneNumber: string): Promise<OtpCode | undefined>;
  verifyOtp(phoneNumber: string, code: string): Promise<boolean>;
  
  // Transport request operations
  createTransportRequest(request: InsertTransportRequest): Promise<TransportRequest>;
  getTransportRequest(id: string): Promise<TransportRequest | undefined>;
  getAllTransportRequests(): Promise<TransportRequest[]>;
  getRequestsByClient(clientId: string): Promise<TransportRequest[]>;
  getOpenRequests(): Promise<TransportRequest[]>;
  updateTransportRequest(id: string, updates: Partial<TransportRequest>): Promise<TransportRequest | undefined>;
  
  // Offer operations
  createOffer(offer: InsertOffer): Promise<Offer>;
  getOffer(id: string): Promise<Offer | undefined>;
  getOffersByRequest(requestId: string): Promise<Offer[]>;
  getOffersByTransporter(transporterId: string): Promise<Offer[]>;
  updateOffer(id: string, updates: Partial<Offer>): Promise<Offer | undefined>;
  
  // Chat operations
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getMessagesByRequest(requestId: string): Promise<ChatMessage[]>;
  getAllMessages(): Promise<ChatMessage[]>;
  getUserConversations(userId: string): Promise<any[]>;
  markMessagesAsRead(userId: string, requestId: string): Promise<void>;
  getUnreadMessagesCount(userId: string): Promise<number>;
  
  // Admin settings
  getAdminSettings(): Promise<AdminSettings | undefined>;
  updateAdminSettings(settings: Partial<AdminSettings>): Promise<AdminSettings>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  getUnreadCount(userId: string): Promise<number>;
  markAsRead(id: string): Promise<Notification | undefined>;
  markAllAsRead(userId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private otpCodes: Map<string, OtpCode>;
  private transportRequests: Map<string, TransportRequest>;
  private offers: Map<string, Offer>;
  private chatMessages: Map<string, ChatMessage>;
  private notifications: Map<string, Notification>;
  private adminSettings: AdminSettings;
  private requestCounter: number;

  constructor() {
    this.users = new Map();
    this.otpCodes = new Map();
    this.transportRequests = new Map();
    this.offers = new Map();
    this.chatMessages = new Map();
    this.notifications = new Map();
    this.requestCounter = 1;
    this.adminSettings = {
      id: randomUUID(),
      commissionPercentage: "10",
      updatedAt: new Date(),
    };
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByPhone(phoneNumber: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.phoneNumber === phoneNumber,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      rating: insertUser.rating || "0",
      totalTrips: insertUser.totalTrips || 0,
      isActive: insertUser.isActive !== undefined ? insertUser.isActive : true,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createOtp(insertOtp: InsertOtpCode): Promise<OtpCode> {
    const id = randomUUID();
    const otp: OtpCode = {
      ...insertOtp,
      id,
      verified: false,
      createdAt: new Date(),
    };
    this.otpCodes.set(insertOtp.phoneNumber, otp);
    return otp;
  }

  async getOtpByPhone(phoneNumber: string): Promise<OtpCode | undefined> {
    return this.otpCodes.get(phoneNumber);
  }

  async verifyOtp(phoneNumber: string, code: string): Promise<boolean> {
    const otp = this.otpCodes.get(phoneNumber);
    if (!otp || otp.code !== code || new Date() > otp.expiresAt) {
      return false;
    }
    otp.verified = true;
    return true;
  }

  generateReferenceId(): string {
    const year = new Date().getFullYear();
    const id = String(this.requestCounter++).padStart(5, '0');
    return `CMD-${year}-${id}`;
  }

  async createTransportRequest(insertRequest: InsertTransportRequest): Promise<TransportRequest> {
    const id = randomUUID();
    const referenceId = this.generateReferenceId();
    const request: TransportRequest = {
      ...insertRequest,
      id,
      referenceId,
      status: "open",
      acceptedOfferId: null,
      createdAt: new Date(),
    };
    this.transportRequests.set(id, request);
    return request;
  }

  async getTransportRequest(id: string): Promise<TransportRequest | undefined> {
    return this.transportRequests.get(id);
  }

  async getAllTransportRequests(): Promise<TransportRequest[]> {
    return Array.from(this.transportRequests.values());
  }

  async getRequestsByClient(clientId: string): Promise<TransportRequest[]> {
    return Array.from(this.transportRequests.values()).filter(
      (req) => req.clientId === clientId
    );
  }

  async getOpenRequests(): Promise<TransportRequest[]> {
    return Array.from(this.transportRequests.values()).filter(
      (req) => req.status === "open"
    );
  }

  async updateTransportRequest(id: string, updates: Partial<TransportRequest>): Promise<TransportRequest | undefined> {
    const request = this.transportRequests.get(id);
    if (!request) return undefined;
    const updated = { ...request, ...updates };
    this.transportRequests.set(id, updated);
    return updated;
  }

  async createOffer(insertOffer: InsertOffer): Promise<Offer> {
    const id = randomUUID();
    const offer: Offer = {
      ...insertOffer,
      id,
      status: "pending",
      paymentProofUrl: null,
      paymentValidated: false,
      createdAt: new Date(),
    };
    this.offers.set(id, offer);
    return offer;
  }

  async getOffer(id: string): Promise<Offer | undefined> {
    return this.offers.get(id);
  }

  async getOffersByRequest(requestId: string): Promise<Offer[]> {
    return Array.from(this.offers.values()).filter(
      (offer) => offer.requestId === requestId
    );
  }

  async getOffersByTransporter(transporterId: string): Promise<Offer[]> {
    return Array.from(this.offers.values()).filter(
      (offer) => offer.transporterId === transporterId
    );
  }

  async updateOffer(id: string, updates: Partial<Offer>): Promise<Offer | undefined> {
    const offer = this.offers.get(id);
    if (!offer) return undefined;
    const updated = { ...offer, ...updates };
    this.offers.set(id, updated);
    return updated;
  }

  filterPhoneNumbers(message: string): string {
    // Filter Moroccan phone numbers and international formats
    let filtered = message;
    
    // Remove +212 format
    filtered = filtered.replace(/\+212[\s\-]?\d{9}/g, '[Numéro filtré]');
    
    // Remove 0X XX XX XX XX format
    filtered = filtered.replace(/0[67][\s\-]?\d{2}[\s\-]?\d{2}[\s\-]?\d{2}[\s\-]?\d{2}/g, '[Numéro filtré]');
    
    // Remove URLs and links
    filtered = filtered.replace(/https?:\/\/[^\s]+/g, '[Lien filtré]');
    filtered = filtered.replace(/www\.[^\s]+/g, '[Lien filtré]');
    
    return filtered;
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const filteredMessage = this.filterPhoneNumbers(insertMessage.message);
    const message: ChatMessage = {
      ...insertMessage,
      id,
      filteredMessage: filteredMessage !== insertMessage.message ? filteredMessage : null,
      isRead: false,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getMessagesByRequest(requestId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter((msg) => msg.requestId === requestId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getAllMessages(): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values());
  }

  async getUserConversations(userId: string): Promise<any[]> {
    // Get all messages where user is sender or receiver
    const allMessages = Array.from(this.chatMessages.values());
    console.log(`[DEBUG Storage] Total messages in system: ${allMessages.length}`);
    console.log(`[DEBUG Storage] Looking for messages with userId: ${userId}`);
    
    const userMessages = allMessages.filter((msg) => {
      const matches = msg.senderId === userId || msg.receiverId === userId;
      if (matches) {
        console.log(`[DEBUG Storage] Found message: senderId=${msg.senderId}, receiverId=${msg.receiverId}`);
      }
      return matches;
    });
    
    console.log(`[DEBUG Storage] Found ${userMessages.length} messages for user ${userId}`);

    // Group by requestId
    const conversationsMap = new Map<string, any>();
    
    for (const msg of userMessages) {
      const existing = conversationsMap.get(msg.requestId);
      const isUnread = msg.receiverId === userId && !msg.isRead;
      
      if (!existing) {
        conversationsMap.set(msg.requestId, {
          requestId: msg.requestId,
          lastMessage: msg,
          unreadCount: isUnread ? 1 : 0,
          otherUserId: msg.senderId === userId ? msg.receiverId : msg.senderId,
        });
      } else {
        // Update if this message is newer
        if (msg.createdAt > existing.lastMessage.createdAt) {
          existing.lastMessage = msg;
        }
        if (isUnread) {
          existing.unreadCount++;
        }
      }
    }

    // Convert to array and enrich with request data
    const conversations: any[] = [];
    console.log(`[DEBUG Storage] Processing ${conversationsMap.size} conversation groups`);
    
    for (const conv of conversationsMap.values()) {
      console.log(`[DEBUG Storage] Looking for request: ${conv.requestId}, otherUser: ${conv.otherUserId}`);
      const request = await this.getTransportRequest(conv.requestId);
      const otherUser = await this.getUser(conv.otherUserId);
      
      console.log(`[DEBUG Storage] Request found: ${!!request}, OtherUser found: ${!!otherUser}`);
      
      if (request && otherUser) {
        conversations.push({
          requestId: conv.requestId,
          referenceId: request.referenceId,
          fromCity: request.fromCity,
          toCity: request.toCity,
          lastMessage: conv.lastMessage,
          unreadCount: conv.unreadCount,
          otherUser: {
            id: otherUser.id,
            name: otherUser.name || otherUser.phoneNumber,
            role: otherUser.role,
          },
        });
      } else {
        console.log(`[DEBUG Storage] Skipping conversation - missing request or otherUser!`);
      }
    }

    // Sort by last message date (most recent first)
    return conversations.sort((a, b) => 
      b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime()
    );
  }

  async markMessagesAsRead(userId: string, requestId: string): Promise<void> {
    // Mark all messages in this conversation as read where user is receiver
    for (const [id, message] of this.chatMessages.entries()) {
      if (message.requestId === requestId && message.receiverId === userId && !message.isRead) {
        this.chatMessages.set(id, { ...message, isRead: true });
      }
    }
  }

  async getUnreadMessagesCount(userId: string): Promise<number> {
    return Array.from(this.chatMessages.values())
      .filter((msg) => msg.receiverId === userId && !msg.isRead)
      .length;
  }

  async getAdminSettings(): Promise<AdminSettings | undefined> {
    return this.adminSettings;
  }

  async updateAdminSettings(updates: Partial<AdminSettings>): Promise<AdminSettings> {
    this.adminSettings = {
      ...this.adminSettings,
      ...updates,
      updatedAt: new Date(),
    };
    return this.adminSettings;
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      ...insertNotification,
      id,
      relatedId: insertNotification.relatedId ?? null,
      read: false,
      createdAt: new Date(),
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter((notif) => notif.userId === userId)
      .sort((a, b) => {
        const timeA = a.createdAt?.getTime() || 0;
        const timeB = b.createdAt?.getTime() || 0;
        return timeB - timeA;
      });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return Array.from(this.notifications.values())
      .filter((notif) => notif.userId === userId && !notif.read)
      .length;
  }

  async markAsRead(id: string): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    const updated = { ...notification, read: true };
    this.notifications.set(id, updated);
    return updated;
  }

  async markAllAsRead(userId: string): Promise<void> {
    const entries = Array.from(this.notifications.entries());
    for (const [id, notif] of entries) {
      if (notif.userId === userId && !notif.read) {
        this.notifications.set(id, { ...notif, read: true });
      }
    }
  }
}

export const storage = new MemStorage();
