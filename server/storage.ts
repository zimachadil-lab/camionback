import { 
  type User, type InsertUser,
  type OtpCode, type InsertOtpCode,
  type TransportRequest, type InsertTransportRequest,
  type Offer, type InsertOffer,
  type ChatMessage, type InsertChatMessage,
  type AdminSettings, type InsertAdminSettings,
  type Notification, type InsertNotification,
  type Rating, type InsertRating
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phoneNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getPendingDrivers(): Promise<User[]>;
  
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
  getAcceptedRequestsByTransporter(transporterId: string): Promise<TransportRequest[]>;
  getPaymentsByTransporter(transporterId: string): Promise<TransportRequest[]>;
  updateTransportRequest(id: string, updates: Partial<TransportRequest>): Promise<TransportRequest | undefined>;
  
  // Offer operations
  createOffer(offer: InsertOffer): Promise<Offer>;
  getOffer(id: string): Promise<Offer | undefined>;
  getOffersByRequest(requestId: string): Promise<Offer[]>;
  getOffersByTransporter(transporterId: string): Promise<Offer[]>;
  updateOffer(id: string, updates: Partial<Offer>): Promise<Offer | undefined>;
  deleteOffersByRequest(requestId: string): Promise<void>;
  
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
  
  // Rating operations
  createRating(rating: InsertRating): Promise<Rating>;
  getRatingsByTransporter(transporterId: string): Promise<Rating[]>;
  getRatingByRequestId(requestId: string): Promise<Rating | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private otpCodes: Map<string, OtpCode>;
  private transportRequests: Map<string, TransportRequest>;
  private offers: Map<string, Offer>;
  private chatMessages: Map<string, ChatMessage>;
  private notifications: Map<string, Notification>;
  private ratings: Map<string, Rating>;
  private adminSettings: AdminSettings;
  private requestCounter: number;

  constructor() {
    this.users = new Map();
    this.otpCodes = new Map();
    this.transportRequests = new Map();
    this.offers = new Map();
    this.chatMessages = new Map();
    this.notifications = new Map();
    this.ratings = new Map();
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
      id,
      phoneNumber: insertUser.phoneNumber,
      passwordHash: insertUser.passwordHash,
      role: insertUser.role ?? null,
      name: insertUser.name ?? null,
      city: insertUser.city ?? null,
      truckPhotos: insertUser.truckPhotos ?? null,
      rating: insertUser.rating ?? null,
      totalRatings: insertUser.totalRatings ?? null,
      totalTrips: insertUser.totalTrips ?? null,
      status: insertUser.status ?? null,
      isActive: insertUser.isActive ?? true,
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

  async getPendingDrivers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.role === "transporter" && user.status === "pending"
    );
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
      estimatedWeight: insertRequest.estimatedWeight ?? null,
      budget: insertRequest.budget ?? null,
      photos: insertRequest.photos ?? null,
      id,
      referenceId,
      status: "open",
      acceptedOfferId: null,
      paymentStatus: "pending",
      paymentReceipt: null,
      paymentDate: null,
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

  async getOpenRequests(transporterId?: string): Promise<TransportRequest[]> {
    const openRequests = Array.from(this.transportRequests.values()).filter(
      (req) => req.status === "open"
    );
    
    // If transporterId is provided, exclude requests where transporter already has an offer
    if (transporterId) {
      const filteredRequests: TransportRequest[] = [];
      for (const request of openRequests) {
        const hasOffer = await this.hasOfferForRequest(transporterId, request.id);
        if (!hasOffer) {
          filteredRequests.push(request);
        }
      }
      return filteredRequests;
    }
    
    return openRequests;
  }

  async getAcceptedRequestsByTransporter(transporterId: string): Promise<TransportRequest[]> {
    const acceptedRequests: TransportRequest[] = [];
    
    for (const request of Array.from(this.transportRequests.values())) {
      // Only include requests with accepted status and an accepted offer
      // Exclude requests with paymentStatus 'pending_admin_validation' or 'paid' (moved to payments tab)
      if (request.status === "accepted" && request.acceptedOfferId && 
          request.paymentStatus !== "pending_admin_validation" && 
          request.paymentStatus !== "paid") {
        const offer = await this.getOffer(request.acceptedOfferId);
        // Check if the accepted offer belongs to this transporter
        if (offer && offer.transporterId === transporterId) {
          acceptedRequests.push(request);
        }
      }
    }
    
    return acceptedRequests;
  }

  async getPaymentsByTransporter(transporterId: string): Promise<TransportRequest[]> {
    const paymentRequests: TransportRequest[] = [];
    
    for (const request of Array.from(this.transportRequests.values())) {
      // Include requests with paymentStatus 'pending_admin_validation' or 'paid'
      if (request.acceptedOfferId && 
          (request.paymentStatus === "pending_admin_validation" || request.paymentStatus === "paid")) {
        const offer = await this.getOffer(request.acceptedOfferId);
        // Check if the accepted offer belongs to this transporter
        if (offer && offer.transporterId === transporterId) {
          paymentRequests.push(request);
        }
      }
    }
    
    return paymentRequests;
  }

  async updateTransportRequest(id: string, updates: Partial<TransportRequest>): Promise<TransportRequest | undefined> {
    const request = this.transportRequests.get(id);
    if (!request) return undefined;
    const updated = { ...request, ...updates };
    this.transportRequests.set(id, updated);
    return updated;
  }

  async deleteTransportRequest(id: string): Promise<boolean> {
    const request = this.transportRequests.get(id);
    if (!request) return false;
    
    // Delete the request
    this.transportRequests.delete(id);
    
    // Delete all related offers and collect their IDs
    const relatedOffers = Array.from(this.offers.entries()).filter(
      ([, offer]) => offer.requestId === id
    );
    const offerIds: string[] = relatedOffers.map(([offerId]) => offerId);
    relatedOffers.forEach(([offerId]) => this.offers.delete(offerId));
    
    // Delete all related chat messages
    const relatedMessages = Array.from(this.chatMessages.entries()).filter(
      ([, msg]) => msg.requestId === id
    );
    relatedMessages.forEach(([msgId]) => this.chatMessages.delete(msgId));
    
    // Delete all related notifications (both for the request and its offers)
    const relatedNotifications = Array.from(this.notifications.entries()).filter(
      ([, notif]) => notif.relatedId === id || offerIds.includes(notif.relatedId || "")
    );
    relatedNotifications.forEach(([notifId]) => this.notifications.delete(notifId));
    
    return true;
  }

  async createOffer(insertOffer: InsertOffer): Promise<Offer> {
    const id = randomUUID();
    const offer: Offer = {
      ...insertOffer,
      message: insertOffer.message ?? null,
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
    const offers: Offer[] = [];
    
    for (const offer of Array.from(this.offers.values())) {
      if (offer.transporterId === transporterId) {
        // Get the associated request
        const request = await this.getTransportRequest(offer.requestId);
        
        // Exclude offers where the request payment is pending validation or paid
        // These should only appear in "Paiements reçus"
        if (request && 
            request.paymentStatus !== "pending_admin_validation" && 
            request.paymentStatus !== "paid") {
          offers.push(offer);
        }
      }
    }
    
    return offers;
  }

  async hasOfferForRequest(transporterId: string, requestId: string): Promise<boolean> {
    return Array.from(this.offers.values()).some(
      (offer) => offer.transporterId === transporterId && offer.requestId === requestId
    );
  }

  async updateOffer(id: string, updates: Partial<Offer>): Promise<Offer | undefined> {
    const offer = this.offers.get(id);
    if (!offer) return undefined;
    const updated = { ...offer, ...updates };
    this.offers.set(id, updated);
    return updated;
  }

  async deleteOffersByRequest(requestId: string): Promise<void> {
    const offersToDelete = Array.from(this.offers.entries())
      .filter(([_, offer]) => offer.requestId === requestId)
      .map(([id, _]) => id);
    
    for (const offerId of offersToDelete) {
      this.offers.delete(offerId);
    }
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
      .sort((a, b) => {
        const aTime = a.createdAt?.getTime() ?? 0;
        const bTime = b.createdAt?.getTime() ?? 0;
        return aTime - bTime;
      });
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
    
    console.log(`[DEBUG Storage] Starting to group ${userMessages.length} messages`);
    for (let i = 0; i < userMessages.length; i++) {
      const msg = userMessages[i];
      console.log(`[DEBUG Storage] Processing message ${i}: requestId=${msg.requestId}`);
      const existing = conversationsMap.get(msg.requestId);
      const isUnread = msg.receiverId === userId && !msg.isRead;
      
      if (!existing) {
        console.log(`[DEBUG Storage] Creating new conversation group for requestId=${msg.requestId}`);
        conversationsMap.set(msg.requestId, {
          requestId: msg.requestId,
          lastMessage: msg,
          unreadCount: isUnread ? 1 : 0,
          otherUserId: msg.senderId === userId ? msg.receiverId : msg.senderId,
        });
      } else {
        console.log(`[DEBUG Storage] Updating existing conversation for requestId=${msg.requestId}`);
        // Update if this message is newer
        if (msg.createdAt && existing.lastMessage.createdAt && msg.createdAt > existing.lastMessage.createdAt) {
          existing.lastMessage = msg;
        }
        if (isUnread) {
          existing.unreadCount++;
        }
      }
    }
    
    console.log(`[DEBUG Storage] conversationsMap size after grouping: ${conversationsMap.size}`);

    // Convert to array and enrich with request data
    const conversations: any[] = [];
    console.log(`[DEBUG Storage] Processing ${conversationsMap.size} conversation groups`);
    
    for (const conv of Array.from(conversationsMap.values())) {
      console.log(`[DEBUG Storage] Looking for request: ${conv.requestId}, otherUser: ${conv.otherUserId}`);
      const request = await this.getTransportRequest(conv.requestId);
      let otherUser = await this.getUser(conv.otherUserId);
      
      console.log(`[DEBUG Storage] Request found: ${!!request}, OtherUser found: ${!!otherUser}`);
      
      // If request exists but otherUser doesn't (e.g., after server restart), create a minimal user object
      if (request && !otherUser) {
        console.log(`[DEBUG Storage] Creating minimal otherUser object for ${conv.otherUserId}`);
        // Determine role based on who is viewing (userId is the viewer)
        const viewerIsClient = request.clientId === userId;
        otherUser = {
          id: conv.otherUserId,
          name: viewerIsClient ? 'Transporteur' : 'Client',
          role: viewerIsClient ? 'transporter' : 'client',
          phoneNumber: '',
        } as any;
      }
      
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
        console.log(`[DEBUG Storage] Skipping conversation - missing request!`);
      }
    }

    // Sort by last message date (most recent first)
    return conversations.sort((a, b) => 
      b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime()
    );
  }

  async markMessagesAsRead(userId: string, requestId: string): Promise<void> {
    // Mark all messages in this conversation as read where user is receiver
    for (const [id, message] of Array.from(this.chatMessages.entries())) {
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

  async createRating(insertRating: InsertRating): Promise<Rating> {
    const id = randomUUID();
    const rating: Rating = {
      id,
      requestId: insertRating.requestId,
      transporterId: insertRating.transporterId,
      clientId: insertRating.clientId,
      score: insertRating.score,
      comment: insertRating.comment ?? null,
      createdAt: new Date(),
    };
    this.ratings.set(id, rating);
    return rating;
  }

  async getRatingsByTransporter(transporterId: string): Promise<Rating[]> {
    return Array.from(this.ratings.values())
      .filter(rating => rating.transporterId === transporterId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Most recent first
  }

  async getRatingByRequestId(requestId: string): Promise<Rating | undefined> {
    return Array.from(this.ratings.values()).find(
      rating => rating.requestId === requestId
    );
  }
}

export const storage = new MemStorage();
