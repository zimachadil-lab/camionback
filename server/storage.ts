import { 
  type User, type InsertUser,
  type OtpCode, type InsertOtpCode,
  type TransportRequest, type InsertTransportRequest,
  type Offer, type InsertOffer,
  type TransporterInterest, type InsertTransporterInterest,
  type ChatMessage, type InsertChatMessage,
  type AdminSettings, type InsertAdminSettings,
  type Notification, type InsertNotification,
  type Rating, type InsertRating,
  type EmptyReturn, type InsertEmptyReturn, type ActiveEmptyReturnWithTransporter,
  type Contract, type InsertContract,
  type Report, type InsertReport,
  type City, type InsertCity,
  type SmsHistory, type InsertSmsHistory,
  type ClientTransporterContact, type InsertClientTransporterContact,
  type Story, type InsertStory,
  type CoordinatorLog, type InsertCoordinatorLog,
  type TransporterReference, type InsertTransporterReference,
  type CoordinationStatus, type InsertCoordinationStatus,
  type RequestNote, type InsertRequestNote
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from './db.js';
import { 
  users, otpCodes, transportRequests, offers, transporterInterests, chatMessages,
  adminSettings, notifications, ratings, emptyReturns, contracts, reports, cities, smsHistory,
  clientTransporterContacts, stories, coordinatorLogs, transporterReferences, coordinationStatuses, requestNotes
} from '@shared/schema';
import { eq, and, or, desc, asc, lte, gte, sql, inArray, isNull, isNotNull, ne } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { calculateDistance } from './distance.js';

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUsersByIds(ids: string[]): Promise<User[]>;
  getUserByPhone(phoneNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getPendingDrivers(): Promise<User[]>;
  getActiveValidatedTransporters(): Promise<Pick<User, 'id' | 'phoneNumber' | 'deviceToken' | 'name'>[]>;
  getNextClientId(): Promise<string>;
  getClientStatistics(): Promise<any[]>;
  blockUser(userId: string): Promise<User | undefined>;
  unblockUser(userId: string): Promise<User | undefined>;
  deleteUser(userId: string): Promise<void>;
  
  // OTP operations
  createOtp(otp: InsertOtpCode): Promise<OtpCode>;
  getOtpByPhone(phoneNumber: string): Promise<OtpCode | undefined>;
  verifyOtp(phoneNumber: string, code: string): Promise<boolean>;
  
  // Transport request operations
  createTransportRequest(request: InsertTransportRequest): Promise<TransportRequest>;
  getTransportRequest(id: string): Promise<TransportRequest | undefined>;
  getRequestByShareToken(shareToken: string): Promise<TransportRequest | undefined>;
  getAllTransportRequests(): Promise<TransportRequest[]>;
  getRequestsByClient(clientId: string): Promise<TransportRequest[]>;
  getOpenRequests(transporterId?: string): Promise<TransportRequest[]>;
  getAcceptedRequestsByTransporter(transporterId: string): Promise<TransportRequest[]>;
  getPaymentsByTransporter(transporterId: string): Promise<TransportRequest[]>;
  updateTransportRequest(id: string, updates: Partial<TransportRequest>): Promise<TransportRequest | undefined>;
  getRecommendedTransporters(fromCity: string): Promise<any[]>;
  
  // Offer operations
  createOffer(offer: InsertOffer): Promise<Offer>;
  getOffer(id: string): Promise<Offer | undefined>;
  getOffersByRequest(requestId: string): Promise<Offer[]>;
  getOffersByTransporter(transporterId: string): Promise<Offer[]>;
  updateOffer(id: string, updates: Partial<Offer>): Promise<Offer | undefined>;
  deleteOffer(id: string): Promise<void>;
  deleteOffersByRequest(requestId: string): Promise<void>;
  
  // Chat operations
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getMessagesByRequest(requestId: string): Promise<ChatMessage[]>;
  getAllMessages(): Promise<ChatMessage[]>;
  getUserConversations(userId: string): Promise<any[]>;
  markMessagesAsRead(userId: string, requestId: string): Promise<void>;
  getUnreadMessagesCount(userId: string): Promise<number>;
  deleteMessagesByRequestId(requestId: string): Promise<void>;
  getAdminConversations(): Promise<any[]>;
  
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
  
  // Empty Return operations
  createEmptyReturn(emptyReturn: InsertEmptyReturn): Promise<EmptyReturn>;
  getActiveEmptyReturns(): Promise<ActiveEmptyReturnWithTransporter[]>;
  getEmptyReturnsByTransporter(transporterId: string): Promise<EmptyReturn[]>;
  updateEmptyReturn(id: string, updates: Partial<EmptyReturn>): Promise<EmptyReturn | undefined>;
  expireOldReturns(): Promise<void>;
  
  // Contract operations
  createContract(contract: InsertContract): Promise<Contract>;
  getAllContracts(): Promise<Contract[]>;
  getContractById(id: string): Promise<Contract | undefined>;
  updateContract(id: string, updates: Partial<Contract>): Promise<Contract | undefined>;
  getContractByRequestId(requestId: string): Promise<Contract | undefined>;
  getContractByOfferId(offerId: string): Promise<Contract | undefined>;
  deleteContract(id: string): Promise<void>;
  
  // Report operations
  createReport(report: InsertReport): Promise<Report>;
  getAllReports(): Promise<Report[]>;
  getReportById(id: string): Promise<Report | undefined>;
  updateReport(id: string, updates: Partial<Report>): Promise<Report | undefined>;
  
  // City operations
  createCity(city: InsertCity): Promise<City>;
  getAllCities(): Promise<City[]>;
  getCityById(id: string): Promise<City | undefined>;
  updateCity(id: string, updates: Partial<City>): Promise<City | undefined>;
  deleteCity(id: string): Promise<void>;
  
  // SMS History operations
  createSmsHistory(smsHistory: InsertSmsHistory): Promise<SmsHistory>;
  getAllSmsHistory(): Promise<SmsHistory[]>;
  deleteSmsHistory(id: string): Promise<void>;
  
  // Story operations
  createStory(story: InsertStory): Promise<Story>;
  getAllStories(): Promise<Story[]>;
  getStoriesByRole(role: string): Promise<Story[]>;
  getActiveStoriesByRole(role: string): Promise<Story[]>;
  getStoryById(id: string): Promise<Story | undefined>;
  updateStory(id: string, updates: Partial<Story>): Promise<Story | undefined>;
  deleteStory(id: string): Promise<void>;
  
  // Coordinator operations
  getCoordinatorAvailableRequests(): Promise<any[]>;
  getCoordinatorActiveRequests(): Promise<any[]>;
  getCoordinatorPaymentRequests(): Promise<any[]>;
  updateRequestVisibility(requestId: string, isHidden: boolean): Promise<TransportRequest | undefined>;
  updateRequestPaymentStatus(requestId: string, paymentStatus: string): Promise<TransportRequest | undefined>;
  
  // Coordinator coordination views (for requests without accepted offers)
  getCoordinationNouveauRequests(filters?: { assignedToId?: string; searchQuery?: string }): Promise<any[]>;
  getCoordinationEnActionRequests(filters?: { assignedToId?: string; searchQuery?: string }): Promise<any[]>;
  getCoordinationPrioritairesRequests(filters?: { assignedToId?: string; searchQuery?: string }): Promise<any[]>;
  getCoordinationArchivesRequests(filters?: { assignedToId?: string; searchQuery?: string }): Promise<any[]>;
  updateCoordinationStatus(requestId: string, coordinationStatus: string, coordinationReason: string | null, coordinationReminderDate: Date | null, coordinatorId: string): Promise<TransportRequest | undefined>;
  
  // NEW: Coordinator-centric workflow methods
  getQualificationPendingRequests(filters?: { assignedToId?: string; searchQuery?: string }): Promise<any[]>;
  qualifyRequest(requestId: string, transporterAmount: number, platformFee: number, coordinatorId: string): Promise<TransportRequest | undefined>;
  publishForMatching(requestId: string, coordinatorId: string): Promise<TransportRequest | undefined>;
  getMatchingRequests(filters?: { assignedToId?: string; searchQuery?: string }): Promise<any[]>;
  getPublishedRequestsForTransporter(): Promise<any[]>;
  expressInterest(requestId: string, transporterId: string, availabilityDate?: Date): Promise<TransportRequest | undefined>;
  withdrawInterest(requestId: string, transporterId: string): Promise<TransportRequest | undefined>;
  getInterestedTransportersForRequest(requestId: string): Promise<any[]>;
  getTransporterInterests(transporterId: string): Promise<any[]>;
  getAllTransporterInterests(): Promise<any[]>;
  toggleTransporterVisibility(interestId: string, hidden: boolean): Promise<any | undefined>;
  archiveRequestWithReason(requestId: string, reason: string, coordinatorId: string): Promise<TransportRequest | undefined>;
  
  // Coordinator manual assignment
  searchTransporters(query: string): Promise<User[]>;
  assignTransporterManually(requestId: string, transporterId: string, transporterAmount: number, platformFee: number, coordinatorId: string): Promise<TransportRequest | undefined>;
  
  // Coordinator self-assignment
  assignCoordinatorToRequest(requestId: string, coordinatorId: string): Promise<TransportRequest | undefined>;
  unassignCoordinatorFromRequest(requestId: string, coordinatorId: string): Promise<TransportRequest | undefined>;
  
  // Coordinator management (Admin)
  getAllCoordinators(): Promise<User[]>;
  getCoordinatorById(id: string): Promise<User | undefined>;
  updateCoordinatorStatus(id: string, accountStatus: string): Promise<User | undefined>;
  deleteCoordinator(id: string): Promise<void>;
  resetCoordinatorPin(id: string, newPin: string): Promise<User | undefined>;
  
  // Coordinator activity logs
  createCoordinatorLog(log: InsertCoordinatorLog): Promise<CoordinatorLog>;
  getCoordinatorLogs(coordinatorId?: string): Promise<CoordinatorLog[]>;
  getRecentCoordinatorActivity(): Promise<any[]>;
  
  // Transporter Reference operations
  createTransporterReference(reference: InsertTransporterReference): Promise<TransporterReference>;
  getTransporterReferenceByTransporterId(transporterId: string): Promise<TransporterReference | undefined>;
  getAllPendingReferences(): Promise<any[]>;
  validateReference(id: string, adminId: string): Promise<TransporterReference | undefined>;
  rejectReference(id: string, adminId: string, reason: string): Promise<TransporterReference | undefined>;
  updateTransporterReference(id: string, updates: Partial<TransporterReference>): Promise<TransporterReference | undefined>;
  
  // Coordination Status Config operations (admin-configurable statuses)
  createCoordinationStatusConfig(status: InsertCoordinationStatus): Promise<CoordinationStatus>;
  getAllCoordinationStatusConfigs(): Promise<CoordinationStatus[]>;
  getCoordinationStatusConfigsByCategory(category: string): Promise<CoordinationStatus[]>;
  updateCoordinationStatusConfig(id: string, updates: Partial<CoordinationStatus>): Promise<CoordinationStatus | undefined>;
  deleteCoordinationStatusConfig(id: string): Promise<void>;
  getCoordinationStatusUsage(): Promise<{ coordination_status: string; usage_count: number }[]>;
  
  // Request Notes operations (coordinator internal notes)
  createRequestNote(requestId: string, coordinatorId: string, content: string): Promise<any>;
  getRequestNotes(requestId: string): Promise<any[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private otpCodes: Map<string, OtpCode>;
  private transportRequests: Map<string, TransportRequest>;
  private offers: Map<string, Offer>;
  private chatMessages: Map<string, ChatMessage>;
  private notifications: Map<string, Notification>;
  private ratings: Map<string, Rating>;
  private emptyReturns: Map<string, EmptyReturn>;
  private contracts: Map<string, Contract>;
  private reports: Map<string, Report>;
  private smsHistory: Map<string, SmsHistory>;
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
    this.emptyReturns = new Map();
    this.contracts = new Map();
    this.reports = new Map();
    this.smsHistory = new Map();
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

  async getUsersByIds(ids: string[]): Promise<User[]> {
    return ids.map(id => this.users.get(id)).filter((u): u is User => u !== undefined);
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
      clientId: insertUser.clientId ?? null,
      name: insertUser.name ?? null,
      city: insertUser.city ?? null,
      truckPhotos: insertUser.truckPhotos ?? null,
      rating: insertUser.rating ?? null,
      totalRatings: insertUser.totalRatings ?? null,
      totalTrips: insertUser.totalTrips ?? null,
      status: insertUser.status ?? null,
      accountStatus: insertUser.accountStatus ?? "active",
      ribName: insertUser.ribName ?? null,
      ribNumber: insertUser.ribNumber ?? null,
      deviceToken: insertUser.deviceToken ?? null,
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
    return Array.from(this.users.values())
      .filter((user) => 
        user.role === "transporteur" && 
        user.status === "pending" &&
        user.truckPhotos && 
        user.truckPhotos.length > 0
      )
      .sort((a, b) => {
        // Sort by createdAt desc (most recent first)
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return bTime - aTime;
      });
  }

  async getActiveValidatedTransporters(): Promise<Pick<User, 'id' | 'phoneNumber' | 'deviceToken' | 'name'>[]> {
    return Array.from(this.users.values())
      .filter((user) => 
        user.role === "transporteur" && 
        user.status === "validated" &&
        user.isActive === true &&
        user.accountStatus !== 'blocked'
      )
      .map(user => ({
        id: user.id,
        phoneNumber: user.phoneNumber,
        deviceToken: user.deviceToken,
        name: user.name,
      }));
  }

  async getNextClientId(): Promise<string> {
    const clients = Array.from(this.users.values()).filter(
      (user) => user.role === "client" && user.clientId
    );
    
    if (clients.length === 0) {
      return "C-0001";
    }
    
    // Extract numbers from clientIds and find the max
    const clientNumbers = clients
      .map(client => {
        const match = client.clientId?.match(/C-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);
    
    const maxNumber = Math.max(...clientNumbers, 0);
    const nextNumber = maxNumber + 1;
    
    // Format as C-XXXX with zero padding
    return `C-${nextNumber.toString().padStart(4, '0')}`;
  }

  async getClientStatistics(): Promise<any[]> {
    const clients = Array.from(this.users.values()).filter(
      (user) => user.role === "client"
    );
    
    const allRequests = Array.from(this.transportRequests.values());
    const allRatings = Array.from(this.ratings.values());
    
    return clients.map(client => {
      // Count orders
      const clientRequests = allRequests.filter(req => req.clientId === client.id);
      const totalOrders = clientRequests.length;
      const completedOrders = clientRequests.filter(
        req => req.status === "completed" || req.paymentStatus === "paid"
      ).length;
      
      // Calculate average satisfaction (ratings given by this client)
      const clientRatings = allRatings.filter(rating => rating.clientId === client.id);
      const averageRating = clientRatings.length > 0
        ? clientRatings.reduce((sum, r) => sum + r.score, 0) / clientRatings.length
        : 0;
      
      return {
        id: client.id,
        clientId: client.clientId || "N/A",
        name: client.name || "Non renseigné",
        phoneNumber: client.phoneNumber,
        totalOrders,
        completedOrders,
        averageRating: Number(averageRating.toFixed(2)),
        registrationDate: client.createdAt,
        accountStatus: client.accountStatus || "active",
      };
    });
  }

  async blockUser(userId: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    return this.updateUser(userId, { accountStatus: "blocked" });
  }

  async unblockUser(userId: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    return this.updateUser(userId, { accountStatus: "active" });
  }

  async deleteUser(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) return;

    // Delete all related data
    // Ratings
    for (const [id, rating] of this.ratings.entries()) {
      if (rating.clientId === userId || rating.transporterId === userId) {
        this.ratings.delete(id);
      }
    }

    // Contracts
    for (const [id, contract] of this.contracts.entries()) {
      if (contract.clientId === userId || contract.transporterId === userId) {
        this.contracts.delete(id);
      }
    }

    // Reports
    for (const [id, report] of this.reports.entries()) {
      if (report.reporterId === userId || report.reportedUserId === userId) {
        this.reports.delete(id);
      }
    }

    // Empty returns
    for (const [id, emptyReturn] of this.emptyReturns.entries()) {
      if (emptyReturn.transporterId === userId) {
        this.emptyReturns.delete(id);
      }
    }

    // Chat messages
    for (const [id, message] of this.chatMessages.entries()) {
      if (message.senderId === userId || message.receiverId === userId) {
        this.chatMessages.delete(id);
      }
    }

    // Notifications
    for (const [id, notification] of this.notifications.entries()) {
      if (notification.userId === userId) {
        this.notifications.delete(id);
      }
    }

    // SMS history
    for (const [id, sms] of this.smsHistory.entries()) {
      if (sms.adminId === userId) {
        this.smsHistory.delete(id);
      }
    }

    // Offers
    for (const [id, offer] of this.offers.entries()) {
      if (offer.transporterId === userId) {
        this.offers.delete(id);
      }
    }

    // Transport requests
    for (const [id, request] of this.transportRequests.entries()) {
      if (request.clientId === userId) {
        this.transportRequests.delete(id);
      }
    }

    // OTP codes
    this.otpCodes.delete(user.phoneNumber);

    // Finally delete user
    this.users.delete(userId);
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
      handlingRequired: insertRequest.handlingRequired ?? false,
      departureFloor: insertRequest.departureFloor ?? null,
      departureElevator: insertRequest.departureElevator ?? null,
      arrivalFloor: insertRequest.arrivalFloor ?? null,
      arrivalElevator: insertRequest.arrivalElevator ?? null,
      budget: insertRequest.budget ?? null,
      photos: insertRequest.photos ?? null,
      smsSent: insertRequest.smsSent ?? null,
      isHidden: false,
      id,
      referenceId,
      status: "open",
      acceptedOfferId: null,
      paymentStatus: "pending",
      paymentReceipt: null,
      paymentDate: null,
      viewCount: 0,
      declinedBy: [],
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
    // Filter for open requests only (expired ones are excluded because status changed to "expired")
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
    
    // Delete all related contracts
    const relatedContracts = Array.from(this.contracts.entries()).filter(
      ([, contract]) => contract.requestId === id
    );
    relatedContracts.forEach(([contractId]) => this.contracts.delete(contractId));
    
    // Delete all related reports
    const relatedReports = Array.from(this.reports.entries()).filter(
      ([, report]) => report.requestId === id
    );
    relatedReports.forEach(([reportId]) => this.reports.delete(reportId));
    
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

  async getAllOffers(): Promise<Offer[]> {
    return Array.from(this.offers.values());
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

  async deleteOffer(id: string): Promise<void> {
    this.offers.delete(id);
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
    // Only filter phone numbers for text messages, not voice messages
    const filteredMessage = insertMessage.message 
      ? this.filterPhoneNumbers(insertMessage.message)
      : null;
    
    const message: ChatMessage = {
      ...insertMessage,
      id,
      filteredMessage: filteredMessage && filteredMessage !== insertMessage.message ? filteredMessage : null,
      isRead: false,
      senderType: (insertMessage as any).senderType ?? null,
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
          role: viewerIsClient ? 'transporteur' : 'client',
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

  async deleteMessagesByRequestId(requestId: string): Promise<void> {
    const messagesToDelete = Array.from(this.chatMessages.entries())
      .filter(([_, msg]) => msg.requestId === requestId)
      .map(([id, _]) => id);
    
    for (const messageId of messagesToDelete) {
      this.chatMessages.delete(messageId);
    }
  }

  async getAdminConversations(): Promise<any[]> {
    // Group messages by requestId
    const conversationMap = new Map<string, ChatMessage[]>();
    
    for (const message of Array.from(this.chatMessages.values())) {
      if (!conversationMap.has(message.requestId)) {
        conversationMap.set(message.requestId, []);
      }
      conversationMap.get(message.requestId)!.push(message);
    }

    // Build conversation summaries
    const conversations: any[] = [];
    
    for (const [requestId, messages] of Array.from(conversationMap.entries())) {
      const request = this.transportRequests.get(requestId);
      if (!request) continue;

      // Sort messages by date
      const sortedMessages = messages.sort((a: ChatMessage, b: ChatMessage) => {
        const aTime = a.createdAt?.getTime() ?? 0;
        const bTime = b.createdAt?.getTime() ?? 0;
        return aTime - bTime;
      });

      const lastMessage = sortedMessages[sortedMessages.length - 1];
      const client = this.users.get(request.clientId);
      const clientName = client?.name || client?.phoneNumber || "Client inconnu";

      // Find transporter from accepted offer
      let transporterName = "Transporteur inconnu";
      let transporterId = null;
      if (request.acceptedOfferId) {
        const offer = this.offers.get(request.acceptedOfferId);
        if (offer) {
          transporterId = offer.transporterId;
          const transporter = this.users.get(offer.transporterId);
          transporterName = transporter?.name || transporter?.phoneNumber || "Transporteur inconnu";
        }
      }

      conversations.push({
        requestId,
        referenceId: request.referenceId,
        clientId: request.clientId,
        clientName,
        transporterId,
        transporterName,
        messageCount: messages.length,
        lastMessage: {
          text: lastMessage.message,
          createdAt: lastMessage.createdAt,
          senderType: lastMessage.senderType,
        },
      });
    }

    // Sort by last message date (most recent first)
    return conversations.sort((a, b) => 
      (b.lastMessage.createdAt?.getTime() ?? 0) - (a.lastMessage.createdAt?.getTime() ?? 0)
    );
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
      .sort((a, b) => {
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return bTime - aTime; // Most recent first
      });
  }

  async getRatingByRequestId(requestId: string): Promise<Rating | undefined> {
    return Array.from(this.ratings.values()).find(
      rating => rating.requestId === requestId
    );
  }

  async createEmptyReturn(insertEmptyReturn: InsertEmptyReturn): Promise<EmptyReturn> {
    const id = randomUUID();
    const emptyReturn: EmptyReturn = {
      id,
      transporterId: insertEmptyReturn.transporterId,
      fromCity: insertEmptyReturn.fromCity,
      toCity: insertEmptyReturn.toCity,
      returnDate: insertEmptyReturn.returnDate,
      status: "active",
      createdAt: new Date(),
    };
    this.emptyReturns.set(id, emptyReturn);
    return emptyReturn;
  }

  async getActiveEmptyReturns(): Promise<ActiveEmptyReturnWithTransporter[]> {
    const activeReturns = Array.from(this.emptyReturns.values())
      .filter(emptyReturn => emptyReturn.status === "active")
      .sort((a, b) => {
        const aTime = a.returnDate?.getTime() || 0;
        const bTime = b.returnDate?.getTime() || 0;
        return aTime - bTime; // Soonest first
      });
    
    // Populate transporter info
    return activeReturns.map(emptyReturn => {
      const transporter = this.users.get(emptyReturn.transporterId);
      return {
        ...emptyReturn,
        transporter: transporter ? {
          id: transporter.id,
          name: transporter.name,
          phoneNumber: transporter.phoneNumber,
        } : null,
      };
    });
  }

  async getEmptyReturnsByTransporter(transporterId: string): Promise<EmptyReturn[]> {
    return Array.from(this.emptyReturns.values())
      .filter(emptyReturn => emptyReturn.transporterId === transporterId)
      .sort((a, b) => {
        const aTime = a.returnDate?.getTime() || 0;
        const bTime = b.returnDate?.getTime() || 0;
        return bTime - aTime; // Most recent first
      });
  }

  async updateEmptyReturn(id: string, updates: Partial<EmptyReturn>): Promise<EmptyReturn | undefined> {
    const emptyReturn = this.emptyReturns.get(id);
    if (!emptyReturn) return undefined;
    const updated = { ...emptyReturn, ...updates };
    this.emptyReturns.set(id, updated);
    return updated;
  }

  async expireOldReturns(): Promise<void> {
    const now = new Date();
    const entries = Array.from(this.emptyReturns.entries());
    for (const [id, emptyReturn] of entries) {
      if (emptyReturn.status === "active" && emptyReturn.returnDate) {
        // Check if returnDate is J+1 (next day after return date)
        const returnDate = new Date(emptyReturn.returnDate);
        const expiryDate = new Date(returnDate);
        expiryDate.setDate(expiryDate.getDate() + 1);
        
        if (now >= expiryDate) {
          this.emptyReturns.set(id, { ...emptyReturn, status: "expired" });
        }
      }
    }
  }

  // Contract operations
  async createContract(contract: InsertContract): Promise<Contract> {
    const newContract: Contract = {
      id: randomUUID(),
      ...contract,
      status: "in_progress",
      createdAt: new Date(),
    };
    this.contracts.set(newContract.id, newContract);
    return newContract;
  }

  async getAllContracts(): Promise<Contract[]> {
    return Array.from(this.contracts.values());
  }

  async getContractById(id: string): Promise<Contract | undefined> {
    return this.contracts.get(id);
  }

  async updateContract(id: string, updates: Partial<Contract>): Promise<Contract | undefined> {
    const contract = this.contracts.get(id);
    if (!contract) return undefined;

    const updatedContract = { ...contract, ...updates };
    this.contracts.set(id, updatedContract);
    return updatedContract;
  }

  async getContractByRequestId(requestId: string): Promise<Contract | undefined> {
    return Array.from(this.contracts.values()).find(
      (contract) => contract.requestId === requestId
    );
  }

  async getContractByOfferId(offerId: string): Promise<Contract | undefined> {
    return Array.from(this.contracts.values()).find(
      (contract) => contract.offerId === offerId
    );
  }

  async deleteContract(id: string): Promise<void> {
    this.contracts.delete(id);
  }

  // Report operations
  async createReport(report: InsertReport): Promise<Report> {
    const newReport: Report = {
      id: randomUUID(),
      ...report,
      details: report.details ?? null,
      status: "pending",
      adminNotes: null,
      createdAt: new Date(),
    };
    this.reports.set(newReport.id, newReport);
    return newReport;
  }

  async getAllReports(): Promise<Report[]> {
    return Array.from(this.reports.values());
  }

  async getReportById(id: string): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async updateReport(id: string, updates: Partial<Report>): Promise<Report | undefined> {
    const report = this.reports.get(id);
    if (!report) return undefined;

    const updatedReport = { ...report, ...updates };
    this.reports.set(id, updatedReport);
    return updatedReport;
  }

  // Story operations (stubs - MemStorage not used in production)
  async createStory(story: InsertStory): Promise<Story> {
    throw new Error("MemStorage not implemented for stories");
  }
  async getAllStories(): Promise<Story[]> {
    return [];
  }
  async getStoriesByRole(role: string): Promise<Story[]> {
    return [];
  }
  async getActiveStoriesByRole(role: string): Promise<Story[]> {
    return [];
  }
  async getStoryById(id: string): Promise<Story | undefined> {
    return undefined;
  }
  async updateStory(id: string, updates: Partial<Story>): Promise<Story | undefined> {
    return undefined;
  }
  async deleteStory(id: string): Promise<void> {
    return;
  }

  // Transporter Reference operations (stubs - MemStorage not used in production)
  async createTransporterReference(reference: InsertTransporterReference): Promise<TransporterReference> {
    throw new Error("MemStorage not implemented for transporter references");
  }
  async getTransporterReferenceByTransporterId(transporterId: string): Promise<TransporterReference | undefined> {
    return undefined;
  }
  async getAllPendingReferences(): Promise<any[]> {
    return [];
  }
  async validateReference(id: string, adminId: string): Promise<TransporterReference | undefined> {
    return undefined;
  }
  async rejectReference(id: string, adminId: string, reason: string): Promise<TransporterReference | undefined> {
    return undefined;
  }
  async updateTransporterReference(id: string, updates: Partial<TransporterReference>): Promise<TransporterReference | undefined> {
    return undefined;
  }
  
  // NEW: Coordinator-centric workflow methods (stubs - MemStorage not used in production)
  async getQualificationPendingRequests(filters?: { assignedToId?: string; searchQuery?: string }): Promise<any[]> {
    return [];
  }
  async qualifyRequest(requestId: string, transporterAmount: number, platformFee: number, coordinatorId: string): Promise<TransportRequest | undefined> {
    return undefined;
  }
  async publishForMatching(requestId: string, coordinatorId: string): Promise<TransportRequest | undefined> {
    return undefined;
  }
  async getMatchingRequests(filters?: { assignedToId?: string; searchQuery?: string }): Promise<any[]> {
    return [];
  }
  async getPublishedRequestsForTransporter(): Promise<any[]> {
    return [];
  }
  async expressInterest(requestId: string, transporterId: string, availabilityDate?: Date): Promise<TransportRequest | undefined> {
    return undefined;
  }
  async withdrawInterest(requestId: string, transporterId: string): Promise<TransportRequest | undefined> {
    return undefined;
  }
  async getInterestedTransportersForRequest(requestId: string): Promise<any[]> {
    return [];
  }
  async getTransporterInterests(transporterId: string): Promise<any[]> {
    return [];
  }
  async getAllTransporterInterests(): Promise<any[]> {
    return [];
  }
  async toggleTransporterVisibility(interestId: string, hidden: boolean): Promise<any | undefined> {
    return undefined;
  }
  async archiveRequestWithReason(requestId: string, reason: string, coordinatorId: string): Promise<TransportRequest | undefined> {
    return undefined;
  }
  
  // Coordinator manual assignment (stubs - MemStorage not used in production)
  async searchTransporters(query: string): Promise<User[]> {
    return [];
  }
  async assignTransporterManually(requestId: string, transporterId: string, transporterAmount: number, platformFee: number, coordinatorId: string): Promise<TransportRequest | undefined> {
    return undefined;
  }
  
  // Coordination Status Config operations (stubs - MemStorage not used in production)
  async createCoordinationStatusConfig(status: InsertCoordinationStatus): Promise<CoordinationStatus> {
    throw new Error("MemStorage not implemented for coordination status configs");
  }
  async getAllCoordinationStatusConfigs(): Promise<CoordinationStatus[]> {
    return [];
  }
  async getCoordinationStatusConfigsByCategory(category: string): Promise<CoordinationStatus[]> {
    return [];
  }
  async updateCoordinationStatusConfig(id: string, updates: Partial<CoordinationStatus>): Promise<CoordinationStatus | undefined> {
    return undefined;
  }
  async deleteCoordinationStatusConfig(id: string): Promise<void> {
    return;
  }
  async getCoordinationStatusUsage(): Promise<{ coordination_status: string; usage_count: number }[]> {
    return [];
  }

  // Request Notes operations (coordinator internal notes)
  async createRequestNote(requestId: string, coordinatorId: string, content: string): Promise<any> {
    return {};
  }

  async getRequestNotes(requestId: string): Promise<any[]> {
    return [];
  }
}

export class DbStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByPhone(phoneNumber: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber)).limit(1);
    return result[0];
  }

  async getUsersByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];
    return await db.select().from(users).where(inArray(users.id, ids));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    let clientId = insertUser.clientId;
    
    // If role is 'client' and no clientId provided, generate one
    if (insertUser.role === 'client' && !clientId) {
      clientId = await this.getNextClientId();
    }
    
    const result = await db.insert(users).values({
      ...insertUser,
      clientId,
    }).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getPendingDrivers(): Promise<User[]> {
    // Select only essential fields, excluding heavy base64 truck_photos to avoid Neon DB memory limits
    const result = await db.select({
      id: users.id,
      phoneNumber: users.phoneNumber,
      role: users.role,
      name: users.name,
      city: users.city,
      status: users.status,
      accountStatus: users.accountStatus,
      isVerified: users.isVerified,
      createdAt: users.createdAt,
      ribName: users.ribName,
      ribNumber: users.ribNumber,
      clientId: users.clientId,
      totalTrips: users.totalTrips,
      deviceToken: users.deviceToken,
      isActive: users.isActive,
    }).from(users)
      .where(
        and(
          eq(users.role, 'transporteur'),
          eq(users.status, 'pending'),
          isNotNull(users.truckPhotos),
          sql`array_length(${users.truckPhotos}, 1) > 0`
        )
      )
      .orderBy(desc(users.createdAt)); // Most recent first
    
    // Cast to User[] - frontend only needs these fields for validation list
    return result as any as User[];
  }

  async getActiveValidatedTransporters(): Promise<Pick<User, 'id' | 'phoneNumber' | 'deviceToken' | 'name'>[]> {
    // Get only active validated transporters with minimal fields for notifications
    const result = await db.select({
      id: users.id,
      phoneNumber: users.phoneNumber,
      deviceToken: users.deviceToken,
      name: users.name,
    }).from(users)
      .where(
        and(
          eq(users.role, 'transporteur'),
          eq(users.status, 'validated'),
          eq(users.isActive, true),
          ne(users.accountStatus, 'blocked')
        )
      );
    
    return result;
  }

  async getTransporterPhotos(id: string): Promise<{ truckPhotos: string[] | null } | null> {
    // Load ONLY the truck photos for a specific transporter (lazy loading)
    const result = await db.select({
      truckPhotos: users.truckPhotos,
    }).from(users)
      .where(eq(users.id, id))
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }

  async getNextClientId(): Promise<string> {
    // ROBUST: Get all existing clientIds first
    const clients = await db.select({ clientId: users.clientId })
      .from(users)
      .where(and(eq(users.role, 'client'), isNotNull(users.clientId)));
    
    // Create a Set of existing IDs for fast collision detection
    const existingIds = new Set(clients.map(c => c.clientId).filter(Boolean));
    
    // Extract valid numbers from existing IDs (ignore legacy/malformed ones)
    const clientNumbers = clients
      .map(client => {
        const match = client.clientId?.match(/C-(\d{4,})/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);
    
    // Start from max + 1, or from 1 if no valid IDs exist
    let nextNumber = clientNumbers.length > 0 ? Math.max(...clientNumbers) + 1 : 1;
    
    // Try up to 100 times to find a unique ID (handles collisions with legacy data)
    for (let attempt = 0; attempt < 100; attempt++) {
      const candidateId = `C-${nextNumber.toString().padStart(4, '0')}`;
      
      // If this ID doesn't exist, use it
      if (!existingIds.has(candidateId)) {
        console.log(`✅ [getNextClientId] Generated unique ID: ${candidateId} (attempt ${attempt + 1})`);
        return candidateId;
      }
      
      // Collision detected - try next number
      console.warn(`⚠️ [getNextClientId] Collision detected for ${candidateId}, trying next...`);
      nextNumber++;
    }
    
    // Fallback: use timestamp-based ID if all sequential attempts fail (extremely unlikely)
    const fallbackId = `C-${Date.now().toString().slice(-6)}`;
    console.error(`❌ [getNextClientId] All attempts exhausted, using fallback: ${fallbackId}`);
    return fallbackId;
  }

  async getClientStatistics(): Promise<any[]> {
    const allUsers = await db.select().from(users).where(eq(users.role, 'client'));
    const allRequests = await db.select().from(transportRequests);
    const allRatings = await db.select().from(ratings);
    
    // OPTIMISATION: Grouper les requests par clientId AVANT la boucle (évite N×M comparaisons)
    const requestsByClientId = allRequests.reduce((acc: Record<string, any[]>, req) => {
      if (!acc[req.clientId]) {
        acc[req.clientId] = [];
      }
      acc[req.clientId].push(req);
      return acc;
    }, {});
    
    // OPTIMISATION: Grouper les ratings par clientId AVANT la boucle
    const ratingsByClientId = allRatings.reduce((acc: Record<string, any[]>, rating) => {
      if (!acc[rating.clientId]) {
        acc[rating.clientId] = [];
      }
      acc[rating.clientId].push(rating);
      return acc;
    }, {});
    
    return allUsers.map(client => {
      // Accès O(1) au lieu de O(N) filtrage
      const clientRequests = requestsByClientId[client.id] || [];
      const totalOrders = clientRequests.length;
      const completedOrders = clientRequests.filter(
        req => req.status === "completed" || req.paymentStatus === "paid"
      ).length;
      
      const clientRatings = ratingsByClientId[client.id] || [];
      const averageRating = clientRatings.length > 0
        ? clientRatings.reduce((sum, r) => sum + r.score, 0) / clientRatings.length
        : 0;
      
      return {
        id: client.id,
        clientId: client.clientId || "N/A",
        name: client.name || "Non renseigné",
        phoneNumber: client.phoneNumber,
        totalOrders,
        completedOrders,
        averageRating: Number(averageRating.toFixed(2)),
        registrationDate: client.createdAt,
        accountStatus: client.accountStatus || "active",
      };
    });
  }

  async blockUser(userId: string): Promise<User | undefined> {
    return this.updateUser(userId, { accountStatus: "blocked" });
  }

  async unblockUser(userId: string): Promise<User | undefined> {
    return this.updateUser(userId, { accountStatus: "active" });
  }

  async deleteUser(userId: string): Promise<void> {
    // Delete in correct order to respect foreign key constraints
    
    // 1. Delete ratings where user is client or transporter
    await db.delete(ratings).where(
      or(
        eq(ratings.clientId, userId),
        eq(ratings.transporterId, userId)
      )
    );
    
    // 2. Delete contracts where user is client or transporter
    await db.delete(contracts).where(
      or(
        eq(contracts.clientId, userId),
        eq(contracts.transporterId, userId)
      )
    );
    
    // 3. Delete reports where user is reporter or reported
    await db.delete(reports).where(
      or(
        eq(reports.reporterId, userId),
        eq(reports.reportedUserId, userId)
      )
    );
    
    // 4. Delete empty returns
    await db.delete(emptyReturns).where(eq(emptyReturns.transporterId, userId));
    
    // 5. Delete chat messages where user is sender or receiver
    await db.delete(chatMessages).where(
      or(
        eq(chatMessages.senderId, userId),
        eq(chatMessages.receiverId, userId)
      )
    );
    
    // 6. Delete notifications
    await db.delete(notifications).where(eq(notifications.userId, userId));
    
    // 7. Delete SMS history (if user is admin)
    await db.delete(smsHistory).where(eq(smsHistory.adminId, userId));
    
    // 8. Delete offers
    await db.delete(offers).where(eq(offers.transporterId, userId));
    
    // 9. Clean up transport requests references before deleting user's requests
    // Set NULL for coordinator/transporter assignments where this user was assigned
    await db.update(transportRequests)
      .set({
        assignedToId: null,
        coordinationUpdatedBy: null,
      })
      .where(
        or(
          eq(transportRequests.assignedToId, userId),
          eq(transportRequests.coordinationUpdatedBy, userId)
        )
      );
    
    await db.update(transportRequests)
      .set({
        assignedTransporterId: null,
        assignedByCoordinatorId: null,
      })
      .where(
        or(
          eq(transportRequests.assignedTransporterId, userId),
          eq(transportRequests.assignedByCoordinatorId, userId)
        )
      );
    
    // Remove user from transporterInterests arrays
    const requestsWithInterests = await db.select()
      .from(transportRequests)
      .where(sql`${userId} = ANY(${transportRequests.transporterInterests})`);
    
    for (const request of requestsWithInterests) {
      const updatedInterests = (request.transporterInterests || []).filter(id => id !== userId);
      await db.update(transportRequests)
        .set({ transporterInterests: updatedInterests })
        .where(eq(transportRequests.id, request.id));
    }
    
    // 10. Delete transport requests where user is the client
    await db.delete(transportRequests).where(eq(transportRequests.clientId, userId));
    
    // 11. Delete OTP codes
    const user = await this.getUser(userId);
    if (user) {
      await db.delete(otpCodes).where(eq(otpCodes.phoneNumber, user.phoneNumber));
    }
    
    // 12. Finally, delete the user
    await db.delete(users).where(eq(users.id, userId));
  }

  // OTP operations
  async createOtp(insertOtp: InsertOtpCode): Promise<OtpCode> {
    const result = await db.insert(otpCodes).values(insertOtp).returning();
    return result[0];
  }

  async getOtpByPhone(phoneNumber: string): Promise<OtpCode | undefined> {
    const result = await db.select().from(otpCodes)
      .where(eq(otpCodes.phoneNumber, phoneNumber))
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);
    return result[0];
  }

  async verifyOtp(phoneNumber: string, code: string): Promise<boolean> {
    const otp = await this.getOtpByPhone(phoneNumber);
    if (!otp || otp.code !== code || new Date() > otp.expiresAt) {
      return false;
    }
    
    await db.update(otpCodes)
      .set({ verified: true })
      .where(eq(otpCodes.id, otp.id));
    
    return true;
  }

  // Transport request operations
  async createTransportRequest(insertRequest: InsertTransportRequest): Promise<TransportRequest> {
    // Generate reference ID
    const year = new Date().getFullYear();
    const existingRequests = await db.select({ referenceId: transportRequests.referenceId })
      .from(transportRequests)
      .where(sql`${transportRequests.referenceId} LIKE ${`CMD-${year}-%`}`);
    
    let maxId = 0;
    existingRequests.forEach(req => {
      const match = req.referenceId.match(/CMD-\d{4}-(\d{5})/);
      if (match) {
        maxId = Math.max(maxId, parseInt(match[1], 10));
      }
    });
    
    const referenceId = `CMD-${year}-${String(maxId + 1).padStart(5, '0')}`;
    
    const result = await db.insert(transportRequests).values({
      ...insertRequest,
      referenceId,
    }).returning();
    return result[0];
  }

  async getTransportRequest(id: string): Promise<TransportRequest | undefined> {
    const result = await db.select().from(transportRequests)
      .where(eq(transportRequests.id, id))
      .limit(1);
    return result[0];
  }

  async getRequestByShareToken(shareToken: string): Promise<TransportRequest | undefined> {
    const result = await db.select().from(transportRequests)
      .where(eq(transportRequests.shareToken, shareToken))
      .limit(1);
    return result[0];
  }

  async getAllTransportRequests(): Promise<TransportRequest[]> {
    return await db.select().from(transportRequests);
  }

  async getRequestsByClient(clientId: string): Promise<TransportRequest[]> {
    return await db.select().from(transportRequests)
      .where(eq(transportRequests.clientId, clientId));
  }

  async getOpenRequests(transporterId?: string): Promise<TransportRequest[]> {
    // Get open requests only (expired ones automatically excluded since status changes to "expired" when archived)
    const openRequests = await db.select().from(transportRequests)
      .where(eq(transportRequests.status, 'open'));
    
    // If transporterId provided, apply transporter-specific filters
    if (transporterId) {
      // Get request IDs where this transporter already has an offer (optimized: select only requestId)
      const transporterOffers = await db.select({ requestId: offers.requestId })
        .from(offers)
        .where(eq(offers.transporterId, transporterId));
      const requestIdsWithOffer = new Set(transporterOffers.map(o => o.requestId));
      
      return openRequests.filter(req => {
        // Filter out requests already declined by this transporter
        if (req.declinedBy && req.declinedBy.includes(transporterId)) {
          return false;
        }
        
        // Filter out requests where transporter already has an offer
        if (requestIdsWithOffer.has(req.id)) {
          return false;
        }
        
        // Filter out requests hidden by admin
        if (req.isHidden) {
          return false;
        }
        
        return true;
      });
    }
    
    // For admin/client view, return all open requests (including hidden ones for admin management)
    return openRequests;
  }

  async getAcceptedRequestsByTransporter(transporterId: string): Promise<TransportRequest[]> {
    const allOffers = await db.select().from(offers)
      .where(eq(offers.transporterId, transporterId));
    
    const acceptedOfferIds = allOffers.map(o => o.id);
    
    // Get requests from accepted offers
    let requestsFromOffers: TransportRequest[] = [];
    if (acceptedOfferIds.length > 0) {
      requestsFromOffers = await db.select().from(transportRequests)
        .where(
          and(
            eq(transportRequests.status, 'accepted'),
            sql`${transportRequests.acceptedOfferId} IN (${sql.join(acceptedOfferIds.map(id => sql`${id}`), sql`, `)})`,
            sql`${transportRequests.paymentStatus} NOT IN ('pending_admin_validation', 'paid')`
          )
        );
    }
    
    // Get manually assigned requests
    const manuallyAssignedRequests = await db.select().from(transportRequests)
      .where(
        and(
          eq(transportRequests.assignedTransporterId, transporterId),
          sql`${transportRequests.paymentStatus} NOT IN ('pending_admin_validation', 'paid', 'completed')`
        )
      );
    
    // Combine both types of requests
    return [...requestsFromOffers, ...manuallyAssignedRequests];
  }

  async getPaymentsByTransporter(transporterId: string): Promise<TransportRequest[]> {
    const allOffers = await db.select().from(offers)
      .where(eq(offers.transporterId, transporterId));
    
    const offerIds = allOffers.map(o => o.id);
    
    // Get requests from accepted offers
    let requestsFromOffers: TransportRequest[] = [];
    if (offerIds.length > 0) {
      requestsFromOffers = await db.select().from(transportRequests)
        .where(
          and(
            sql`${transportRequests.acceptedOfferId} IN (${sql.join(offerIds.map(id => sql`${id}`), sql`, `)})`,
            or(
              eq(transportRequests.paymentStatus, 'pending_admin_validation'),
              eq(transportRequests.paymentStatus, 'paid')
            )
          )
        );
    }
    
    // Get manually assigned requests with payment status
    const manuallyAssignedRequests = await db.select().from(transportRequests)
      .where(
        and(
          eq(transportRequests.assignedTransporterId, transporterId),
          or(
            eq(transportRequests.paymentStatus, 'pending_admin_validation'),
            eq(transportRequests.paymentStatus, 'paid')
          )
        )
      );
    
    // Combine both types of requests
    return [...requestsFromOffers, ...manuallyAssignedRequests];
  }

  async updateTransportRequest(id: string, updates: Partial<TransportRequest>): Promise<TransportRequest | undefined> {
    const result = await db.update(transportRequests)
      .set(updates)
      .where(eq(transportRequests.id, id))
      .returning();
    return result[0];
  }

  async getRecommendedTransporters(fromCity: string): Promise<any[]> {
    // Filtrage 1: Transporteurs avec retours annoncés (fromCity == ville de départ du retour)
    const activeReturns = await db.select({
      transporterId: emptyReturns.transporterId,
      returnDate: emptyReturns.returnDate,
    })
      .from(emptyReturns)
      .where(
        and(
          eq(emptyReturns.fromCity, fromCity),
          eq(emptyReturns.status, 'active')
        )
      )
      .orderBy(asc(emptyReturns.returnDate))
      .limit(5);

    if (activeReturns.length > 0) {
      const transporterIds = activeReturns.map(r => r.transporterId);
      const transportersData = await db.select().from(users)
        .where(
          and(
            sql`${users.id} IN (${sql.join(transporterIds.map(id => sql`${id}`), sql`, `)})`,
            eq(users.role, 'transporteur'),
            eq(users.status, 'validated'),
            eq(users.accountStatus, 'active')
          )
        );

      return transportersData.map(t => ({
        id: t.id,
        name: t.name,
        city: t.city,
        truckPhoto: t.truckPhotos && t.truckPhotos.length > 0 ? t.truckPhotos[0] : null,
        rating: t.rating ? parseFloat(t.rating) : 0,
        totalTrips: t.totalTrips || 0,
        availabilityType: 'retour',
      }));
    }

    // Filtrage 2: Transporteurs de la ville de résidence
    const localTransporters = await db.select().from(users)
      .where(
        and(
          eq(users.city, fromCity),
          eq(users.role, 'transporteur'),
          eq(users.status, 'validated'),
          eq(users.accountStatus, 'active')
        )
      )
      .orderBy(desc(users.rating), desc(users.totalTrips))
      .limit(5);

    if (localTransporters.length > 0) {
      return localTransporters.map(t => ({
        id: t.id,
        name: t.name,
        city: t.city,
        truckPhoto: t.truckPhotos && t.truckPhotos.length > 0 ? t.truckPhotos[0] : null,
        rating: t.rating ? parseFloat(t.rating) : 0,
        totalTrips: t.totalTrips || 0,
        availabilityType: 'ville_residence',
      }));
    }

    // Filtrage 3: Meilleurs transporteurs (note + trajets)
    const topTransporters = await db.select().from(users)
      .where(
        and(
          eq(users.role, 'transporteur'),
          eq(users.status, 'validated'),
          eq(users.accountStatus, 'active')
        )
      )
      .orderBy(desc(users.rating), desc(users.totalTrips))
      .limit(5);

    return topTransporters.map(t => ({
      id: t.id,
      name: t.name,
      city: t.city,
      truckPhoto: t.truckPhotos && t.truckPhotos.length > 0 ? t.truckPhotos[0] : null,
      rating: t.rating ? parseFloat(t.rating) : 0,
      totalTrips: t.totalTrips || 0,
      availabilityType: 'top_rated',
    }));
  }

  async deleteTransportRequest(id: string): Promise<boolean> {
    const request = await this.getTransportRequest(id);
    if (!request) return false;
    
    // Delete all related contracts
    await db.delete(contracts).where(eq(contracts.requestId, id));
    
    // Delete all related reports
    await db.delete(reports).where(eq(reports.requestId, id));
    
    // Delete all related offers
    await this.deleteOffersByRequest(id);
    
    // Delete all related chat messages
    await this.deleteMessagesByRequestId(id);
    
    // Delete all related notifications
    await db.delete(notifications).where(eq(notifications.relatedId, id));
    
    // Get all offer IDs for this request to delete related notifications
    const relatedOffers = await this.getOffersByRequest(id);
    for (const offer of relatedOffers) {
      await db.delete(notifications).where(eq(notifications.relatedId, offer.id));
    }
    
    // Delete the request
    await db.delete(transportRequests).where(eq(transportRequests.id, id));
    
    return true;
  }

  // Offer operations
  async createOffer(insertOffer: InsertOffer): Promise<Offer> {
    const result = await db.insert(offers).values(insertOffer).returning();
    return result[0];
  }

  async getOffer(id: string): Promise<Offer | undefined> {
    const result = await db.select().from(offers)
      .where(eq(offers.id, id))
      .limit(1);
    return result[0];
  }

  async getOffersByRequest(requestId: string): Promise<Offer[]> {
    return await db.select().from(offers)
      .where(eq(offers.requestId, requestId));
  }

  async getOffersByTransporter(transporterId: string): Promise<Offer[]> {
    const transporterOffers = await db.select().from(offers)
      .where(eq(offers.transporterId, transporterId));
    
    const filteredOffers: Offer[] = [];
    
    for (const offer of transporterOffers) {
      const request = await this.getTransportRequest(offer.requestId);
      if (request && 
          request.paymentStatus !== "pending_admin_validation" && 
          request.paymentStatus !== "paid") {
        filteredOffers.push(offer);
      }
    }
    
    return filteredOffers;
  }

  async updateOffer(id: string, updates: Partial<Offer>): Promise<Offer | undefined> {
    const result = await db.update(offers)
      .set(updates)
      .where(eq(offers.id, id))
      .returning();
    return result[0];
  }

  async deleteOffer(id: string): Promise<void> {
    await db.delete(offers).where(eq(offers.id, id));
  }

  async deleteOffersByRequest(requestId: string): Promise<void> {
    await db.delete(offers).where(eq(offers.requestId, requestId));
  }

  async getAllOffers(): Promise<Offer[]> {
    return await db.select().from(offers);
  }

  async hasOfferForRequest(transporterId: string, requestId: string): Promise<boolean> {
    const result = await db.select().from(offers)
      .where(
        and(
          eq(offers.transporterId, transporterId),
          eq(offers.requestId, requestId)
        )
      )
      .limit(1);
    return result.length > 0;
  }

  // Chat operations
  filterPhoneNumbers(message: string): string {
    let filtered = message;
    filtered = filtered.replace(/\+212[\s\-]?\d{9}/g, '[Numéro filtré]');
    filtered = filtered.replace(/0[67][\s\-]?\d{2}[\s\-]?\d{2}[\s\-]?\d{2}[\s\-]?\d{2}/g, '[Numéro filtré]');
    filtered = filtered.replace(/https?:\/\/[^\s]+/g, '[Lien filtré]');
    filtered = filtered.replace(/www\.[^\s]+/g, '[Lien filtré]');
    return filtered;
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    // Only filter phone numbers for text messages, not voice messages
    const filteredMessage = insertMessage.message 
      ? this.filterPhoneNumbers(insertMessage.message)
      : null;
    
    const result = await db.insert(chatMessages).values({
      ...insertMessage,
      filteredMessage: filteredMessage && filteredMessage !== insertMessage.message ? filteredMessage : null,
    }).returning();
    return result[0];
  }

  async getMessagesByRequest(requestId: string): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages)
      .where(eq(chatMessages.requestId, requestId))
      .orderBy(asc(chatMessages.createdAt));
  }

  async getAllMessages(): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages);
  }

  async getUserConversations(userId: string): Promise<any[]> {
    const allMessages = await db.select().from(chatMessages)
      .where(or(eq(chatMessages.senderId, userId), eq(chatMessages.receiverId, userId)))
      .orderBy(asc(chatMessages.createdAt));
    
    const conversationsMap = new Map<string, any>();
    
    for (const msg of allMessages) {
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
        if (msg.createdAt && existing.lastMessage.createdAt && msg.createdAt > existing.lastMessage.createdAt) {
          existing.lastMessage = msg;
        }
        if (isUnread) {
          existing.unreadCount++;
        }
      }
    }
    
    const conversations: any[] = [];
    
    // Get current user to determine their role
    const currentUser = await this.getUser(userId);
    
    for (const conv of Array.from(conversationsMap.values())) {
      const request = await this.getTransportRequest(conv.requestId);
      let otherUser = await this.getUser(conv.otherUserId);
      
      if (request && !otherUser) {
        const viewerIsClient = request.clientId === userId;
        otherUser = {
          id: conv.otherUserId,
          name: viewerIsClient ? 'Transporteur' : 'Client',
          role: viewerIsClient ? 'transporteur' : 'client',
          phoneNumber: '',
        } as any;
      }
      
      if (request && otherUser) {
        // Anonymize client for transporters: show clientId instead of name/phone
        const displayName = currentUser?.role === 'transporteur' && otherUser.role === 'client'
          ? otherUser.clientId || 'Client'
          : (otherUser.name || otherUser.phoneNumber);
        
        conversations.push({
          requestId: conv.requestId,
          referenceId: request.referenceId,
          fromCity: request.fromCity,
          toCity: request.toCity,
          lastMessage: conv.lastMessage,
          unreadCount: conv.unreadCount,
          otherUser: {
            id: otherUser.id,
            name: displayName,
            role: otherUser.role,
          },
        });
      }
    }
    
    return conversations.sort((a, b) => 
      (b.lastMessage.createdAt?.getTime() || 0) - (a.lastMessage.createdAt?.getTime() || 0)
    );
  }

  async markMessagesAsRead(userId: string, requestId: string): Promise<void> {
    await db.update(chatMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(chatMessages.requestId, requestId),
          eq(chatMessages.receiverId, userId),
          eq(chatMessages.isRead, false)
        )
      );
  }

  async getUnreadMessagesCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(chatMessages)
      .where(and(eq(chatMessages.receiverId, userId), eq(chatMessages.isRead, false)));
    return Number(result[0]?.count || 0);
  }

  async deleteMessagesByRequestId(requestId: string): Promise<void> {
    await db.delete(chatMessages).where(eq(chatMessages.requestId, requestId));
  }

  async getAdminConversations(): Promise<any[]> {
    const allMessages = await db.select().from(chatMessages).orderBy(asc(chatMessages.createdAt));
    const conversationMap = new Map<string, ChatMessage[]>();
    
    for (const message of allMessages) {
      if (!conversationMap.has(message.requestId)) {
        conversationMap.set(message.requestId, []);
      }
      conversationMap.get(message.requestId)!.push(message);
    }
    
    const conversations: any[] = [];
    
    for (const [requestId, messages] of Array.from(conversationMap.entries())) {
      const request = await this.getTransportRequest(requestId);
      if (!request) continue;
      
      const sortedMessages = messages.sort((a, b) => 
        (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0)
      );
      
      const lastMessage = sortedMessages[sortedMessages.length - 1];
      const client = await this.getUser(request.clientId);
      const clientName = client?.name || client?.phoneNumber || "Client inconnu";
      
      let transporterName = "Transporteur inconnu";
      let transporterId = null;
      
      // First try to get transporter from accepted offer
      if (request.acceptedOfferId) {
        const offer = await this.getOffer(request.acceptedOfferId);
        if (offer) {
          transporterId = offer.transporterId;
          const transporter = await this.getUser(offer.transporterId);
          transporterName = transporter?.name || transporter?.phoneNumber || "Transporteur inconnu";
        }
      }
      
      // If no accepted offer, try to find transporter from message participants
      if (!transporterId) {
        // Try finding by senderType first
        const transporterMessage = messages.find(m => m.senderType === 'transporteur');
        if (transporterMessage) {
          const transporter = await this.getUser(transporterMessage.senderId);
          if (transporter && transporter.role === 'transporteur') {
            transporterId = transporter.id;
            transporterName = transporter.name || transporter.phoneNumber || "Transporteur inconnu";
          }
        }
        
        // If still not found, look through all message senders to find transporter by role
        if (!transporterId) {
          for (const msg of messages) {
            if (msg.senderId !== request.clientId) {
              const sender = await this.getUser(msg.senderId);
              if (sender && sender.role === 'transporteur') {
                transporterId = sender.id;
                transporterName = sender.name || sender.phoneNumber || "Transporteur inconnu";
                break;
              }
            }
          }
        }
        
        // Last resort: check all offers for this request
        if (!transporterId) {
          const allOffers = await this.getOffersByRequest(request.id);
          if (allOffers.length > 0) {
            // Get the first offer's transporter
            const firstOffer = allOffers[0];
            const transporter = await this.getUser(firstOffer.transporterId);
            if (transporter) {
              transporterId = transporter.id;
              transporterName = transporter.name || transporter.phoneNumber || "Transporteur inconnu";
            }
          }
        }
      }
      
      conversations.push({
        requestId,
        referenceId: request.referenceId,
        clientId: client?.clientId || request.clientId,
        clientName,
        transporterId,
        transporterName,
        messageCount: messages.length,
        lastMessage: {
          text: lastMessage.message,
          createdAt: lastMessage.createdAt,
          senderType: lastMessage.senderType,
        },
      });
    }
    
    return conversations.sort((a, b) => 
      (b.lastMessage.createdAt?.getTime() || 0) - (a.lastMessage.createdAt?.getTime() || 0)
    );
  }

  // Admin settings
  async getAdminSettings(): Promise<AdminSettings | undefined> {
    const result = await db.select().from(adminSettings).limit(1);
    return result[0];
  }

  async updateAdminSettings(updates: Partial<AdminSettings>): Promise<AdminSettings> {
    const existing = await this.getAdminSettings();
    
    if (!existing) {
      const result = await db.insert(adminSettings).values({
        ...updates,
        updatedAt: new Date(),
      }).returning();
      return result[0];
    }
    
    const result = await db.update(adminSettings)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(adminSettings.id, existing.id))
      .returning();
    return result[0];
  }

  // Notification operations
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(insertNotification).returning();
    return result[0];
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    return Number(result[0]?.count || 0);
  }

  async markAsRead(id: string): Promise<Notification | undefined> {
    const result = await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return result[0];
  }

  async markAllAsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  }

  // Rating operations
  async createRating(insertRating: InsertRating): Promise<Rating> {
    const result = await db.insert(ratings).values(insertRating).returning();
    return result[0];
  }

  async getRatingsByTransporter(transporterId: string): Promise<Rating[]> {
    return await db.select().from(ratings)
      .where(eq(ratings.transporterId, transporterId))
      .orderBy(desc(ratings.createdAt));
  }

  async getRatingByRequestId(requestId: string): Promise<Rating | undefined> {
    const result = await db.select().from(ratings)
      .where(eq(ratings.requestId, requestId))
      .limit(1);
    return result[0];
  }

  // Empty Return operations
  async createEmptyReturn(insertEmptyReturn: InsertEmptyReturn): Promise<EmptyReturn> {
    const result = await db.insert(emptyReturns).values(insertEmptyReturn).returning();
    return result[0];
  }

  async getActiveEmptyReturns(): Promise<ActiveEmptyReturnWithTransporter[]> {
    const results = await db
      .select({
        id: emptyReturns.id,
        transporterId: emptyReturns.transporterId,
        fromCity: emptyReturns.fromCity,
        toCity: emptyReturns.toCity,
        returnDate: emptyReturns.returnDate,
        status: emptyReturns.status,
        createdAt: emptyReturns.createdAt,
        transporter: {
          id: users.id,
          name: users.name,
          phoneNumber: users.phoneNumber,
        },
      })
      .from(emptyReturns)
      .leftJoin(users, eq(emptyReturns.transporterId, users.id))
      .where(eq(emptyReturns.status, 'active'))
      .orderBy(asc(emptyReturns.returnDate));
    
    return results;
  }

  async getEmptyReturnsByTransporter(transporterId: string): Promise<EmptyReturn[]> {
    return await db.select().from(emptyReturns)
      .where(eq(emptyReturns.transporterId, transporterId))
      .orderBy(desc(emptyReturns.returnDate));
  }

  async updateEmptyReturn(id: string, updates: Partial<EmptyReturn>): Promise<EmptyReturn | undefined> {
    const result = await db.update(emptyReturns)
      .set(updates)
      .where(eq(emptyReturns.id, id))
      .returning();
    return result[0];
  }

  async expireOldReturns(): Promise<void> {
    const now = new Date();
    const activeReturns = await db.select().from(emptyReturns)
      .where(eq(emptyReturns.status, 'active'));
    
    for (const emptyReturn of activeReturns) {
      if (emptyReturn.returnDate) {
        const returnDate = new Date(emptyReturn.returnDate);
        const expiryDate = new Date(returnDate);
        expiryDate.setDate(expiryDate.getDate() + 1);
        
        if (now >= expiryDate) {
          await db.update(emptyReturns)
            .set({ status: 'expired' })
            .where(eq(emptyReturns.id, emptyReturn.id));
        }
      }
    }
  }

  // Contract operations
  async createContract(insertContract: InsertContract): Promise<Contract> {
    const result = await db.insert(contracts).values(insertContract).returning();
    return result[0];
  }

  async getAllContracts(): Promise<Contract[]> {
    return await db.select().from(contracts);
  }

  async getContractById(id: string): Promise<Contract | undefined> {
    const result = await db.select().from(contracts)
      .where(eq(contracts.id, id))
      .limit(1);
    return result[0];
  }

  async updateContract(id: string, updates: Partial<Contract>): Promise<Contract | undefined> {
    const result = await db.update(contracts)
      .set(updates)
      .where(eq(contracts.id, id))
      .returning();
    return result[0];
  }

  async getContractByRequestId(requestId: string): Promise<Contract | undefined> {
    const result = await db.select().from(contracts)
      .where(eq(contracts.requestId, requestId))
      .limit(1);
    return result[0];
  }

  async getContractByOfferId(offerId: string): Promise<Contract | undefined> {
    const result = await db.select().from(contracts)
      .where(eq(contracts.offerId, offerId))
      .limit(1);
    return result[0];
  }

  async deleteContract(id: string): Promise<void> {
    await db.delete(contracts).where(eq(contracts.id, id));
  }

  // Report operations
  async createReport(insertReport: InsertReport): Promise<Report> {
    const result = await db.insert(reports).values(insertReport).returning();
    return result[0];
  }

  async getAllReports(): Promise<Report[]> {
    return await db.select().from(reports);
  }

  async getReportById(id: string): Promise<Report | undefined> {
    const result = await db.select().from(reports)
      .where(eq(reports.id, id))
      .limit(1);
    return result[0];
  }

  async updateReport(id: string, updates: Partial<Report>): Promise<Report | undefined> {
    const result = await db.update(reports)
      .set(updates)
      .where(eq(reports.id, id))
      .returning();
    return result[0];
  }

  // City operations
  async createCity(insertCity: InsertCity): Promise<City> {
    const result = await db.insert(cities).values(insertCity).returning();
    return result[0];
  }

  async getAllCities(): Promise<City[]> {
    return await db.select().from(cities).orderBy(asc(cities.name));
  }

  async getCityById(id: string): Promise<City | undefined> {
    const result = await db.select().from(cities)
      .where(eq(cities.id, id))
      .limit(1);
    return result[0];
  }

  async updateCity(id: string, updates: Partial<City>): Promise<City | undefined> {
    const result = await db.update(cities)
      .set(updates)
      .where(eq(cities.id, id))
      .returning();
    return result[0];
  }

  async deleteCity(id: string): Promise<void> {
    await db.delete(cities).where(eq(cities.id, id));
  }

  // SMS History operations
  async createSmsHistory(insertSmsHistory: InsertSmsHistory): Promise<SmsHistory> {
    const result = await db.insert(smsHistory).values(insertSmsHistory).returning();
    return result[0];
  }

  async getAllSmsHistory(): Promise<SmsHistory[]> {
    return await db.select().from(smsHistory).orderBy(desc(smsHistory.createdAt));
  }

  async deleteSmsHistory(id: string): Promise<void> {
    await db.delete(smsHistory).where(eq(smsHistory.id, id));
  }

  // Story operations
  async createStory(insertStory: InsertStory): Promise<Story> {
    const result = await db.insert(stories).values(insertStory).returning();
    return result[0];
  }

  async getAllStories(): Promise<Story[]> {
    return await db.select().from(stories).orderBy(asc(stories.order));
  }

  async getStoriesByRole(role: string): Promise<Story[]> {
    return await db.select().from(stories)
      .where(or(eq(stories.role, role), eq(stories.role, 'all')))
      .orderBy(asc(stories.order));
  }

  async getActiveStoriesByRole(role: string): Promise<Story[]> {
    return await db.select().from(stories)
      .where(and(
        or(eq(stories.role, role), eq(stories.role, 'all')),
        eq(stories.isActive, true)
      ))
      .orderBy(asc(stories.order));
  }

  async getStoryById(id: string): Promise<Story | undefined> {
    const result = await db.select().from(stories)
      .where(eq(stories.id, id))
      .limit(1);
    return result[0];
  }

  async updateStory(id: string, updates: Partial<Story>): Promise<Story | undefined> {
    const result = await db.update(stories)
      .set(updates)
      .where(eq(stories.id, id))
      .returning();
    return result[0];
  }

  async deleteStory(id: string): Promise<void> {
    await db.delete(stories).where(eq(stories.id, id));
  }

  // Coordinator operations
  async getCoordinatorAvailableRequests(): Promise<any[]> {
    // Get all open requests with client, transporter (if accepted), and offers
    const requests = await db.select({
      id: transportRequests.id,
      referenceId: transportRequests.referenceId,
      clientId: transportRequests.clientId,
      fromCity: transportRequests.fromCity,
      toCity: transportRequests.toCity,
      description: transportRequests.description,
      goodsType: transportRequests.goodsType,
      dateTime: transportRequests.dateTime,
      budget: transportRequests.budget,
      photos: transportRequests.photos,
      status: transportRequests.status,
      isHidden: transportRequests.isHidden,
      paymentStatus: transportRequests.paymentStatus,
      shareToken: transportRequests.shareToken,
      assignedToId: transportRequests.assignedToId,
      createdAt: transportRequests.createdAt,
    })
    .from(transportRequests)
    .where(eq(transportRequests.status, 'open'))
    .orderBy(desc(transportRequests.createdAt));

    // Enrich each request with client, assigned coordinator, offers, and transporter data
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        // Get client data
        const clientData = await db.select().from(users)
          .where(eq(users.id, request.clientId))
          .limit(1);
        
        // Get assigned coordinator data if exists
        const assignedToData = request.assignedToId 
          ? await db.select().from(users).where(eq(users.id, request.assignedToId)).limit(1)
          : [];
        
        // Get offers for this request
        const requestOffers = await db.select().from(offers)
          .where(eq(offers.requestId, request.id));

        return {
          ...request,
          client: clientData[0] || null,
          assignedTo: assignedToData[0] ? {
            id: assignedToData[0].id,
            name: assignedToData[0].name,
            phoneNumber: assignedToData[0].phoneNumber,
          } : null,
          offers: requestOffers,
        };
      })
    );

    return enrichedRequests;
  }

  async getCoordinatorActiveRequests(): Promise<any[]> {
    // OPTIMIZED: Use SQL JOINs to fetch all data in a single query instead of N+1 queries
    // Get all accepted requests AND manually assigned requests with all related data
    // EXCLUDE requests with paymentStatus = "paid_by_camionback" (migrated to contracts)
    
    const results = await db
      .select({
        // Request fields
        id: transportRequests.id,
        referenceId: transportRequests.referenceId,
        fromCity: transportRequests.fromCity,
        toCity: transportRequests.toCity,
        description: transportRequests.description,
        goodsType: transportRequests.goodsType,
        dateTime: transportRequests.dateTime,
        budget: transportRequests.budget,
        photos: transportRequests.photos,
        status: transportRequests.status,
        isHidden: transportRequests.isHidden,
        paymentStatus: transportRequests.paymentStatus,
        acceptedOfferId: transportRequests.acceptedOfferId,
        assignedTransporterId: transportRequests.assignedTransporterId,
        assignedToId: transportRequests.assignedToId,
        transporterAmount: transportRequests.transporterAmount,
        platformFee: transportRequests.platformFee,
        clientTotal: transportRequests.clientTotal,
        shareToken: transportRequests.shareToken,
        createdAt: transportRequests.createdAt,
        clientId: transportRequests.clientId,
        // Client data
        clientName: sql<string>`${users.name}`.as('client_name'),
        clientPhoneNumber: sql<string>`${users.phoneNumber}`.as('client_phone_number'),
        // Coordinator data
        coordinatorId: sql<string | null>`coordinator.id`.as('coordinator_id'),
        coordinatorName: sql<string | null>`coordinator.name`.as('coordinator_name'),
        coordinatorPhoneNumber: sql<string | null>`coordinator.phone_number`.as('coordinator_phone_number'),
        // Transporter data (from assigned_transporter_id)
        assignedTransporterName: sql<string | null>`assigned_transporter.name`.as('assigned_transporter_name'),
        assignedTransporterPhoneNumber: sql<string | null>`assigned_transporter.phone_number`.as('assigned_transporter_phone_number'),
        // Offer data
        offerId: sql<string | null>`${offers.id}`.as('offer_id'),
        offerAmount: sql<string | null>`${offers.amount}`.as('offer_amount'),
        offerTransporterId: sql<string | null>`${offers.transporterId}`.as('offer_transporter_id'),
        // Transporter data (from accepted offer)
        offerTransporterName: sql<string | null>`offer_transporter.name`.as('offer_transporter_name'),
        offerTransporterPhoneNumber: sql<string | null>`offer_transporter.phone_number`.as('offer_transporter_phone_number'),
      })
      .from(transportRequests)
      // JOIN client (always required)
      .innerJoin(users, eq(transportRequests.clientId, users.id))
      // LEFT JOIN coordinator (optional)
      .leftJoin(
        sql`users as coordinator`,
        eq(transportRequests.assignedToId, sql`coordinator.id`)
      )
      // LEFT JOIN assigned transporter (optional - for manually assigned)
      .leftJoin(
        sql`users as assigned_transporter`,
        eq(transportRequests.assignedTransporterId, sql`assigned_transporter.id`)
      )
      // LEFT JOIN accepted offer (optional)
      .leftJoin(offers, eq(transportRequests.acceptedOfferId, offers.id))
      // LEFT JOIN offer transporter (optional - for offer-based assignments)
      .leftJoin(
        sql`users as offer_transporter`,
        eq(offers.transporterId, sql`offer_transporter.id`)
      )
      .where(
        and(
          or(
            eq(transportRequests.status, 'accepted'),
            isNotNull(transportRequests.assignedTransporterId)
          ),
          ne(transportRequests.paymentStatus, 'paid_by_camionback')
        )
      )
      .orderBy(desc(transportRequests.createdAt));

    // Transform the flat results into the expected nested structure
    return results.map(row => ({
      id: row.id,
      referenceId: row.referenceId,
      fromCity: row.fromCity,
      toCity: row.toCity,
      description: row.description,
      goodsType: row.goodsType,
      dateTime: row.dateTime,
      budget: row.budget,
      photos: row.photos,
      status: row.status,
      isHidden: row.isHidden,
      paymentStatus: row.paymentStatus,
      acceptedOfferId: row.acceptedOfferId,
      assignedTransporterId: row.assignedTransporterId,
      assignedToId: row.assignedToId,
      transporterAmount: row.transporterAmount,
      platformFee: row.platformFee,
      clientTotal: row.clientTotal,
      shareToken: row.shareToken,
      createdAt: row.createdAt,
      // Nested client object
      client: {
        id: row.clientId,
        name: row.clientName,
        phoneNumber: row.clientPhoneNumber,
      },
      // Nested coordinator object (if assigned)
      assignedTo: row.coordinatorId ? {
        id: row.coordinatorId,
        name: row.coordinatorName,
        phoneNumber: row.coordinatorPhoneNumber,
      } : null,
      // Nested transporter object (priority: assigned > offer)
      transporter: row.assignedTransporterId ? {
        id: row.assignedTransporterId,
        name: row.assignedTransporterName,
        phoneNumber: row.assignedTransporterPhoneNumber,
      } : (row.offerTransporterId ? {
        id: row.offerTransporterId,
        name: row.offerTransporterName,
        phoneNumber: row.offerTransporterPhoneNumber,
      } : null),
      // Nested accepted offer object (if exists)
      acceptedOffer: row.offerId ? {
        id: row.offerId,
        amount: row.offerAmount,
        transporterId: row.offerTransporterId,
      } : null,
    }));
  }

  async getCoordinatorPaymentRequests(): Promise<any[]> {
    // Get requests with payment pending statuses
    const requests = await db.select({
      id: transportRequests.id,
      referenceId: transportRequests.referenceId,
      fromCity: transportRequests.fromCity,
      toCity: transportRequests.toCity,
      description: transportRequests.description,
      goodsType: transportRequests.goodsType,
      dateTime: transportRequests.dateTime,
      budget: transportRequests.budget,
      photos: transportRequests.photos,
      status: transportRequests.status,
      paymentStatus: transportRequests.paymentStatus,
      acceptedOfferId: transportRequests.acceptedOfferId,
      shareToken: transportRequests.shareToken,
      createdAt: transportRequests.createdAt,
    })
    .from(transportRequests)
    .where(
      and(
        eq(transportRequests.status, 'accepted'),
        or(
          eq(transportRequests.paymentStatus, 'pending'),
          eq(transportRequests.paymentStatus, 'awaiting_payment'),
          eq(transportRequests.paymentStatus, 'pending_admin_validation')
        )
      )
    )
    .orderBy(desc(transportRequests.createdAt));

    // Enrich with client, transporter, and accepted offer
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        // Get client data
        const clientResult = await db.select().from(users)
          .innerJoin(transportRequests, eq(transportRequests.clientId, users.id))
          .where(eq(transportRequests.id, request.id))
          .limit(1);
        const client = clientResult[0]?.users || null;

        // Get accepted offer and transporter
        let acceptedOffer = null;
        let transporter = null;
        if (request.acceptedOfferId) {
          const offerResult = await db.select().from(offers)
            .where(eq(offers.id, request.acceptedOfferId))
            .limit(1);
          acceptedOffer = offerResult[0] || null;

          if (acceptedOffer) {
            const transporterResult = await db.select().from(users)
              .where(eq(users.id, acceptedOffer.transporterId))
              .limit(1);
            transporter = transporterResult[0] || null;
          }
        }

        return {
          ...request,
          client,
          transporter,
          acceptedOffer,
        };
      })
    );

    return enrichedRequests;
  }

  async updateRequestVisibility(requestId: string, isHidden: boolean): Promise<TransportRequest | undefined> {
    const result = await db.update(transportRequests)
      .set({ isHidden })
      .where(eq(transportRequests.id, requestId))
      .returning();
    return result[0];
  }

  async updateRequestPaymentStatus(requestId: string, paymentStatus: string): Promise<TransportRequest | undefined> {
    console.log(`[updateRequestPaymentStatus] Starting update for request ${requestId} with paymentStatus: ${paymentStatus}`);
    
    // First, get the request details
    const request = await db.select().from(transportRequests)
      .where(eq(transportRequests.id, requestId))
      .limit(1);
    
    if (!request[0]) {
      console.log(`[updateRequestPaymentStatus] Request ${requestId} not found`);
      return undefined;
    }

    console.log(`[updateRequestPaymentStatus] Current request status: ${request[0].status}, current paymentStatus: ${request[0].paymentStatus}`);

    // Update the payment status
    const result = await db.update(transportRequests)
      .set({ paymentStatus })
      .where(eq(transportRequests.id, requestId))
      .returning();
    
    console.log(`[updateRequestPaymentStatus] Updated paymentStatus to: ${result[0]?.paymentStatus}`);
    
    // If paymentStatus is "paid_by_camionback", create a contract with status "completed"
    if (paymentStatus === "paid_by_camionback" && request[0].status === "accepted") {
      console.log(`[updateRequestPaymentStatus] Creating/updating contract for paid_by_camionback`);

      try {
        // Get the assigned transporter and contract amount
        let transporterId = request[0].assignedTransporterId;
        let offerId = request[0].acceptedOfferId;
        let amount = request[0].clientTotal || "0";

        // If no assigned transporter but we have an offer, get from accepted offer
        if (!transporterId && offerId) {
          const offer = await db.select().from(offers)
            .where(eq(offers.id, offerId))
            .limit(1);
          if (offer[0]) {
            transporterId = offer[0].transporterId;
            amount = offer[0].amount;
          }
        }

        // Calculate amount from qualified pricing if not available from offer
        if (!amount || amount === "0") {
          const transporterAmount = Number(request[0].transporterAmount) || 0;
          const platformFee = Number(request[0].platformFee) || 0;
          amount = String(transporterAmount + platformFee);
        }

        // Create contract if we have transporter and client (offerId is optional for coordinator-assigned requests)
        if (transporterId && request[0].clientId) {
          // Check if contract already exists for this request
          const existingContract = await db.select().from(contracts)
            .where(eq(contracts.requestId, requestId))
            .limit(1);

          if (existingContract.length === 0) {
            // Create new contract with "completed" (terminé) status
            console.log(`[updateRequestPaymentStatus] Creating new contract with status=completed, offerId: ${offerId || 'null (coordinator-assigned)'}`);
            await db.insert(contracts).values({
              requestId: requestId,
              offerId: offerId || null,
              clientId: request[0].clientId,
              transporterId: transporterId,
              referenceId: request[0].referenceId,
              amount: amount,
              status: "completed",
            });
            console.log(`[updateRequestPaymentStatus] Contract created successfully with amount: ${amount}`);
          } else {
            // Update existing contract to "completed" (terminé) status
            console.log(`[updateRequestPaymentStatus] Updating existing contract to status=completed`);
            await db.update(contracts)
              .set({ status: "completed" })
              .where(eq(contracts.requestId, requestId));
            console.log(`[updateRequestPaymentStatus] Contract updated successfully`);
          }
        } else {
          console.log(`[updateRequestPaymentStatus] Skipping contract creation - missing required data. transporterId: ${transporterId}, clientId: ${request[0].clientId}`);
        }
      } catch (error) {
        console.error("[updateRequestPaymentStatus] Error creating/updating contract for paid_by_camionback:", error);
        // Continue anyway - don't fail the payment status update
      }
    } else {
      console.log(`[updateRequestPaymentStatus] Skipping contract creation - paymentStatus: ${paymentStatus}, request.status: ${request[0].status}`);
    }
    
    return result[0];
  }

  // Coordinator coordination views (for requests without accepted offers)
  async getCoordinationNouveauRequests(filters?: { assignedToId?: string; searchQuery?: string }): Promise<any[]> {
    // Build where conditions
    const whereConditions = [
      eq(transportRequests.status, 'open'),
      eq(transportRequests.coordinationStatus, 'nouveau')
    ];

    // Add filter for assignedToId (can be null to show unassigned)
    if (filters?.assignedToId) {
      whereConditions.push(eq(transportRequests.assignedToId, filters.assignedToId));
    }

    // Get requests with status "open" and coordinationStatus "nouveau"
    let requests = await db.select({
      id: transportRequests.id,
      referenceId: transportRequests.referenceId,
      clientId: transportRequests.clientId,
      fromCity: transportRequests.fromCity,
      toCity: transportRequests.toCity,
      description: transportRequests.description,
      goodsType: transportRequests.goodsType,
      dateTime: transportRequests.dateTime,
      budget: transportRequests.budget,
      photos: transportRequests.photos,
      status: transportRequests.status,
      coordinationStatus: transportRequests.coordinationStatus,
      coordinationReminderDate: transportRequests.coordinationReminderDate,
      coordinationUpdatedAt: transportRequests.coordinationUpdatedAt,
      assignedToId: transportRequests.assignedToId,
      shareToken: transportRequests.shareToken,
      createdAt: transportRequests.createdAt,
    })
    .from(transportRequests)
    .where(and(...whereConditions))
    .orderBy(desc(transportRequests.createdAt));

    // Enrich with client, coordinator, and offers data
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const clientData = await db.select().from(users)
          .where(eq(users.id, request.clientId))
          .limit(1);
        
        const coordinatorData = request.assignedToId ? await db.select().from(users)
          .where(eq(users.id, request.assignedToId))
          .limit(1) : [];
        
        const requestOffers = await db.select().from(offers)
          .where(eq(offers.requestId, request.id));

        return {
          ...request,
          client: clientData[0] || null,
          assignedTo: coordinatorData[0] || null,
          offers: requestOffers,
          offersCount: requestOffers.length,
        };
      })
    );

    // Apply search filter if provided
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return enrichedRequests.filter(req => 
        req.referenceId?.toLowerCase().includes(query) ||
        req.fromCity?.toLowerCase().includes(query) ||
        req.toCity?.toLowerCase().includes(query) ||
        req.description?.toLowerCase().includes(query) ||
        req.goodsType?.toLowerCase().includes(query) ||
        req.client?.name?.toLowerCase().includes(query) ||
        req.client?.phoneNumber?.includes(query) ||
        req.assignedTo?.name?.toLowerCase().includes(query)
      );
    }

    return enrichedRequests;
  }

  async getCoordinationEnActionRequests(filters?: { assignedToId?: string; searchQuery?: string }): Promise<any[]> {
    // Get active coordination statuses from "en_action" category
    const enActionStatusConfigs = await db.select()
      .from(coordinationStatuses)
      .where(
        and(
          eq(coordinationStatuses.category, 'en_action'),
          eq(coordinationStatuses.isActive, true)
        )
      );
    
    const enActionStatusValues = enActionStatusConfigs.map(s => s.value);
    
    // If no statuses configured, return empty array
    if (enActionStatusValues.length === 0) {
      return [];
    }

    // Build where conditions
    const whereConditions = [
      eq(transportRequests.status, 'open'),
      sql`${transportRequests.coordinationStatus} = ANY(ARRAY[${sql.raw(enActionStatusValues.map(s => `'${s}'`).join(','))}])`
    ];

    // Add filter for assignedToId
    if (filters?.assignedToId) {
      whereConditions.push(eq(transportRequests.assignedToId, filters.assignedToId));
    }
    
    const requests = await db.select({
      id: transportRequests.id,
      referenceId: transportRequests.referenceId,
      clientId: transportRequests.clientId,
      fromCity: transportRequests.fromCity,
      toCity: transportRequests.toCity,
      description: transportRequests.description,
      goodsType: transportRequests.goodsType,
      dateTime: transportRequests.dateTime,
      budget: transportRequests.budget,
      photos: transportRequests.photos,
      status: transportRequests.status,
      coordinationStatus: transportRequests.coordinationStatus,
      coordinationReminderDate: transportRequests.coordinationReminderDate,
      coordinationUpdatedAt: transportRequests.coordinationUpdatedAt,
      assignedToId: transportRequests.assignedToId,
      shareToken: transportRequests.shareToken,
      createdAt: transportRequests.createdAt,
    })
    .from(transportRequests)
    .where(and(...whereConditions))
    .orderBy(
      // Priority: rappel_prevu with date first (oldest first), then by creation date
      sql`CASE WHEN ${transportRequests.coordinationStatus} = 'rappel_prevu' THEN ${transportRequests.coordinationReminderDate} ELSE NULL END ASC NULLS LAST`,
      desc(transportRequests.createdAt)
    );

    // Enrich with client, coordinator, and offers data
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const clientData = await db.select().from(users)
          .where(eq(users.id, request.clientId))
          .limit(1);
        
        const coordinatorData = request.assignedToId ? await db.select().from(users)
          .where(eq(users.id, request.assignedToId))
          .limit(1) : [];
        
        const requestOffers = await db.select().from(offers)
          .where(eq(offers.requestId, request.id));

        return {
          ...request,
          client: clientData[0] || null,
          assignedTo: coordinatorData[0] || null,
          offers: requestOffers,
          offersCount: requestOffers.length,
        };
      })
    );

    // Apply search filter if provided
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return enrichedRequests.filter(req => 
        req.referenceId?.toLowerCase().includes(query) ||
        req.fromCity?.toLowerCase().includes(query) ||
        req.toCity?.toLowerCase().includes(query) ||
        req.description?.toLowerCase().includes(query) ||
        req.goodsType?.toLowerCase().includes(query) ||
        req.client?.name?.toLowerCase().includes(query) ||
        req.client?.phoneNumber?.includes(query) ||
        req.assignedTo?.name?.toLowerCase().includes(query)
      );
    }

    return enrichedRequests;
  }

  async getCoordinationPrioritairesRequests(filters?: { assignedToId?: string; searchQuery?: string }): Promise<any[]> {
    // Get active coordination statuses from "prioritaires" category
    const prioritairesStatusConfigs = await db.select()
      .from(coordinationStatuses)
      .where(
        and(
          eq(coordinationStatuses.category, 'prioritaires'),
          eq(coordinationStatuses.isActive, true)
        )
      );
    
    const prioritairesStatusValues = prioritairesStatusConfigs.map(s => s.value);
    
    // If no statuses configured, return empty array
    if (prioritairesStatusValues.length === 0) {
      return [];
    }

    // Build where conditions
    const whereConditions = [
      eq(transportRequests.status, 'open'),
      sql`${transportRequests.coordinationStatus} = ANY(ARRAY[${sql.raw(prioritairesStatusValues.map(s => `'${s}'`).join(','))}])`
    ];

    // Add filter for assignedToId
    if (filters?.assignedToId) {
      whereConditions.push(eq(transportRequests.assignedToId, filters.assignedToId));
    }
    
    const requests = await db.select({
      id: transportRequests.id,
      referenceId: transportRequests.referenceId,
      clientId: transportRequests.clientId,
      fromCity: transportRequests.fromCity,
      toCity: transportRequests.toCity,
      description: transportRequests.description,
      goodsType: transportRequests.goodsType,
      dateTime: transportRequests.dateTime,
      budget: transportRequests.budget,
      photos: transportRequests.photos,
      status: transportRequests.status,
      coordinationStatus: transportRequests.coordinationStatus,
      coordinationReminderDate: transportRequests.coordinationReminderDate,
      coordinationUpdatedAt: transportRequests.coordinationUpdatedAt,
      assignedToId: transportRequests.assignedToId,
      shareToken: transportRequests.shareToken,
      createdAt: transportRequests.createdAt,
    })
    .from(transportRequests)
    .where(and(...whereConditions))
    .orderBy(desc(transportRequests.createdAt));

    // Enrich with client, coordinator, and offers data
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const clientData = await db.select().from(users)
          .where(eq(users.id, request.clientId))
          .limit(1);
        
        const coordinatorData = request.assignedToId ? await db.select().from(users)
          .where(eq(users.id, request.assignedToId))
          .limit(1) : [];
        
        const requestOffers = await db.select().from(offers)
          .where(eq(offers.requestId, request.id));

        return {
          ...request,
          client: clientData[0] || null,
          assignedTo: coordinatorData[0] || null,
          offers: requestOffers,
          offersCount: requestOffers.length,
        };
      })
    );

    // Apply search filter if provided
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return enrichedRequests.filter(req => 
        req.referenceId?.toLowerCase().includes(query) ||
        req.fromCity?.toLowerCase().includes(query) ||
        req.toCity?.toLowerCase().includes(query) ||
        req.description?.toLowerCase().includes(query) ||
        req.goodsType?.toLowerCase().includes(query) ||
        req.client?.name?.toLowerCase().includes(query) ||
        req.client?.phoneNumber?.includes(query) ||
        req.assignedTo?.name?.toLowerCase().includes(query)
      );
    }

    return enrichedRequests;
  }

  async getCoordinationArchivesRequests(filters?: { assignedToId?: string; searchQuery?: string }): Promise<any[]> {
    // Get active coordination statuses from "archives" category
    const archivesStatusConfigs = await db.select()
      .from(coordinationStatuses)
      .where(
        and(
          eq(coordinationStatuses.category, 'archives'),
          eq(coordinationStatuses.isActive, true)
        )
      );
    
    const archivesStatusValues = archivesStatusConfigs.map(s => s.value);
    
    // If no statuses configured, also include hardcoded 'archive' for backwards compatibility
    const allArchiveValues = archivesStatusValues.length > 0 
      ? archivesStatusValues 
      : ['archive'];

    // Build where conditions
    const whereConditions = [
      or(
        eq(transportRequests.status, 'open'),
        eq(transportRequests.status, 'expired')
      ),
      sql`${transportRequests.coordinationStatus} = ANY(ARRAY[${sql.raw(allArchiveValues.map(s => `'${s}'`).join(','))}])`
    ];

    // Add filter for assignedToId
    if (filters?.assignedToId) {
      whereConditions.push(eq(transportRequests.assignedToId, filters.assignedToId));
    }
    
    const requests = await db.select({
      id: transportRequests.id,
      referenceId: transportRequests.referenceId,
      clientId: transportRequests.clientId,
      fromCity: transportRequests.fromCity,
      toCity: transportRequests.toCity,
      description: transportRequests.description,
      goodsType: transportRequests.goodsType,
      dateTime: transportRequests.dateTime,
      budget: transportRequests.budget,
      photos: transportRequests.photos,
      status: transportRequests.status,
      coordinationStatus: transportRequests.coordinationStatus,
      coordinationReason: transportRequests.coordinationReason,
      coordinationUpdatedAt: transportRequests.coordinationUpdatedAt,
      assignedToId: transportRequests.assignedToId,
      shareToken: transportRequests.shareToken,
      createdAt: transportRequests.createdAt,
    })
    .from(transportRequests)
    .where(and(...whereConditions))
    .orderBy(desc(transportRequests.coordinationUpdatedAt));

    // Enrich with client and coordinator data
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const clientData = await db.select().from(users)
          .where(eq(users.id, request.clientId))
          .limit(1);

        const coordinatorData = request.assignedToId ? await db.select().from(users)
          .where(eq(users.id, request.assignedToId))
          .limit(1) : [];

        return {
          ...request,
          client: clientData[0] || null,
          assignedTo: coordinatorData[0] || null,
        };
      })
    );

    // Apply search filter if provided
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return enrichedRequests.filter(req => 
        req.referenceId?.toLowerCase().includes(query) ||
        req.fromCity?.toLowerCase().includes(query) ||
        req.toCity?.toLowerCase().includes(query) ||
        req.description?.toLowerCase().includes(query) ||
        req.goodsType?.toLowerCase().includes(query) ||
        req.client?.name?.toLowerCase().includes(query) ||
        req.client?.phoneNumber?.includes(query) ||
        req.assignedTo?.name?.toLowerCase().includes(query) ||
        req.coordinationReason?.toLowerCase().includes(query)
      );
    }

    return enrichedRequests;
  }

  async updateCoordinationStatus(
    requestId: string,
    coordinationStatus: string,
    coordinationReason: string | null,
    coordinationReminderDate: Date | null,
    coordinatorId: string
  ): Promise<TransportRequest | undefined> {
    // Check if this coordination status belongs to "archives" category
    const statusConfig = await db.select()
      .from(coordinationStatuses)
      .where(
        and(
          eq(coordinationStatuses.value, coordinationStatus),
          eq(coordinationStatuses.category, 'archives'),
          eq(coordinationStatuses.isActive, true)
        )
      )
      .limit(1);

    // Also check for hardcoded "archive" value for backwards compatibility
    const isArchiveStatus = statusConfig.length > 0 || coordinationStatus === 'archive';

    // Get current request to check its status
    const currentRequest = await db.select()
      .from(transportRequests)
      .where(eq(transportRequests.id, requestId))
      .limit(1);

    // If archiving, set status to "expired"
    // If un-archiving (moving from expired back to active), restore to "open"
    const updateData: any = {
      coordinationStatus,
      coordinationReason,
      coordinationReminderDate,
      coordinationUpdatedAt: new Date(),
      coordinationUpdatedBy: coordinatorId,
    };

    // Auto-assign coordinator when changing status from "nouveau" for the first time
    if (currentRequest[0]?.coordinationStatus === 'nouveau' && 
        !currentRequest[0]?.assignedToId &&
        coordinationStatus !== 'nouveau') {
      updateData.assignedToId = coordinatorId;
    }

    if (isArchiveStatus) {
      updateData.status = 'expired';
    } else if (currentRequest[0]?.status === 'expired') {
      // Restore to "open" if moving away from archive status
      updateData.status = 'open';
    }

    const result = await db.update(transportRequests)
      .set(updateData)
      .where(eq(transportRequests.id, requestId))
      .returning();
    
    return result[0];
  }

  // NEW: Coordinator-centric workflow methods
  async getQualificationPendingRequests(filters?: { assignedToId?: string; searchQuery?: string }): Promise<any[]> {
    const whereConditions = [
      eq(transportRequests.coordinationStatus, 'qualification_pending'),
      eq(transportRequests.status, 'open'),
    ];

    if (filters?.assignedToId) {
      whereConditions.push(eq(transportRequests.assignedToId, filters.assignedToId));
    }

    const clientAlias = alias(users, 'client');
    const assignedToAlias = alias(users, 'assignedTo');

    const requests = await db.select({
      request: transportRequests,
      client: clientAlias,
      assignedTo: assignedToAlias,
    }).from(transportRequests)
      .leftJoin(clientAlias, eq(transportRequests.clientId, clientAlias.id))
      .leftJoin(assignedToAlias, eq(transportRequests.assignedToId, assignedToAlias.id))
      .where(and(...whereConditions))
      .orderBy(desc(transportRequests.createdAt));

    const enrichedRequests = requests.map(({ request, client, assignedTo }) => ({
      ...request,
      client: client ? {
        id: client.id,
        name: client.name,
        phoneNumber: client.phoneNumber,
        clientId: client.clientId,
      } : null,
      assignedTo: assignedTo ? {
        id: assignedTo.id,
        name: assignedTo.name,
        phoneNumber: assignedTo.phoneNumber,
      } : null,
    }));

    if (filters?.searchQuery && filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      return enrichedRequests.filter(req =>
        req.referenceId?.toLowerCase().includes(query) ||
        req.fromCity?.toLowerCase().includes(query) ||
        req.toCity?.toLowerCase().includes(query) ||
        req.client?.name?.toLowerCase().includes(query) ||
        req.client?.phoneNumber?.includes(query)
      );
    }

    return enrichedRequests;
  }

  async qualifyRequest(requestId: string, transporterAmount: number, platformFee: number, coordinatorId: string): Promise<TransportRequest | undefined> {
    const clientTotal = transporterAmount + platformFee;
    
    // Get current request to access addresses for distance calculation
    const currentRequest = await db.select()
      .from(transportRequests)
      .where(eq(transportRequests.id, requestId))
      .limit(1);
    
    // Calculate distance if addresses are available
    let distance: number | null = null;
    if (currentRequest[0]?.departureAddress && currentRequest[0]?.arrivalAddress) {
      const distanceResult = await calculateDistance(
        currentRequest[0].departureAddress,
        currentRequest[0].arrivalAddress
      );
      distance = distanceResult.distance;
      if (distanceResult.error) {
        console.warn(`[qualifyRequest] Distance calculation failed for ${requestId}:`, distanceResult.error);
      }
    }
    
    const result = await db.update(transportRequests)
      .set({
        transporterAmount: transporterAmount.toString(),
        platformFee: platformFee.toString(),
        clientTotal: clientTotal.toString(),
        distance: distance,
        qualifiedAt: new Date(),
        coordinationUpdatedAt: new Date(),
        coordinationUpdatedBy: coordinatorId,
      })
      .where(eq(transportRequests.id, requestId))
      .returning();
    
    return result[0];
  }

  async publishForMatching(requestId: string, coordinatorId: string): Promise<TransportRequest | undefined> {
    const result = await db.update(transportRequests)
      .set({
        status: 'published_for_matching',
        coordinationStatus: 'matching',
        publishedForMatchingAt: new Date(),
        coordinationUpdatedAt: new Date(),
        coordinationUpdatedBy: coordinatorId,
      })
      .where(eq(transportRequests.id, requestId))
      .returning();
    
    return result[0];
  }

  async getPublishedRequestsForTransporter(): Promise<any[]> {
    // Explicitly project transporter-safe columns
    // INCLUDE pricing fields that transporters need to see
    const requests = await db.select({
      id: transportRequests.id,
      clientId: transportRequests.clientId,
      referenceId: transportRequests.referenceId,
      status: transportRequests.status,
      fromCity: transportRequests.fromCity,
      toCity: transportRequests.toCity,
      departureAddress: transportRequests.departureAddress,
      arrivalAddress: transportRequests.arrivalAddress,
      distance: transportRequests.distance,
      description: transportRequests.description,
      goodsType: transportRequests.goodsType,
      dateTime: transportRequests.dateTime,
      handlingRequired: transportRequests.handlingRequired,
      departureFloor: transportRequests.departureFloor,
      departureElevator: transportRequests.departureElevator,
      arrivalFloor: transportRequests.arrivalFloor,
      arrivalElevator: transportRequests.arrivalElevator,
      photos: transportRequests.photos,
      declinedBy: transportRequests.declinedBy,
      transporterInterests: transportRequests.transporterInterests,
      createdAt: transportRequests.createdAt,
      publishedForMatchingAt: transportRequests.publishedForMatchingAt,
      // Include coordinator-set pricing (transporters NEED to see their payment)
      // Use alias 'transporterPrice' to match frontend component expectations
      transporterPrice: transportRequests.transporterAmount,
      platformFee: transportRequests.platformFee,
      clientTotal: transportRequests.clientTotal,
      // Exclude budget (old workflow field)
    })
      .from(transportRequests)
      .where(
        and(
          eq(transportRequests.status, 'published_for_matching'),
          eq(transportRequests.coordinationStatus, 'matching'),
          or(
            eq(transportRequests.isHidden, false),
            isNull(transportRequests.isHidden)
          )
        )
      )
      .orderBy(desc(transportRequests.publishedForMatchingAt));
    
    return requests;
  }

  async getMatchingRequests(filters?: { assignedToId?: string; searchQuery?: string }): Promise<any[]> {
    const whereConditions = [
      or(
        eq(transportRequests.coordinationStatus, 'matching'),
        eq(transportRequests.coordinationStatus, 'qualified')
      ),
      or(
        eq(transportRequests.status, 'open'),
        eq(transportRequests.status, 'published_for_matching')
      ),
    ];

    if (filters?.assignedToId) {
      whereConditions.push(eq(transportRequests.assignedToId, filters.assignedToId));
    }

    // Create aliases for the three user joins
    const clientUser = alias(users, 'client_user');
    const coordinatorUser = alias(users, 'coordinator_user');
    const assignedToUser = alias(users, 'assigned_to_user');

    const requests = await db.select({
      request: transportRequests,
      client: clientUser,
      coordinator: coordinatorUser,
      assignedTo: assignedToUser,
    }).from(transportRequests)
      .leftJoin(clientUser, eq(transportRequests.clientId, clientUser.id))
      .leftJoin(coordinatorUser, eq(transportRequests.coordinationUpdatedBy, coordinatorUser.id))
      .leftJoin(assignedToUser, eq(transportRequests.assignedToId, assignedToUser.id))
      .where(and(...whereConditions))
      .orderBy(desc(transportRequests.publishedForMatchingAt));

    const enrichedRequests = requests.map(({ request, client, coordinator, assignedTo }) => ({
      ...request,
      client: client ? {
        id: client.id,
        name: client.name,
        phoneNumber: client.phoneNumber,
        clientId: client.clientId,
      } : null,
      coordinationUpdatedBy: coordinator ? {
        id: coordinator.id,
        name: coordinator.name,
        phoneNumber: coordinator.phoneNumber,
      } : null,
      assignedTo: assignedTo ? {
        id: assignedTo.id,
        name: assignedTo.name,
        phoneNumber: assignedTo.phoneNumber,
      } : null,
      interestedCount: request.transporterInterests?.length || 0,
    }));

    if (filters?.searchQuery && filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      return enrichedRequests.filter(req =>
        req.referenceId?.toLowerCase().includes(query) ||
        req.fromCity?.toLowerCase().includes(query) ||
        req.toCity?.toLowerCase().includes(query) ||
        req.client?.name?.toLowerCase().includes(query) ||
        req.client?.phoneNumber?.includes(query)
      );
    }

    return enrichedRequests;
  }

  async expressInterest(requestId: string, transporterId: string, availabilityDate?: Date): Promise<TransportRequest | undefined> {
    // Get request to check if it exists and get its date if no availability date provided
    const request = await db.select()
      .from(transportRequests)
      .where(eq(transportRequests.id, requestId))
      .limit(1);
    
    if (!request[0]) {
      return undefined; // Request doesn't exist
    }
    
    // Use provided date or default to request date
    const effectiveDate = availabilityDate || request[0].dateTime;
    
    // Check if interest already exists
    const existingInterest = await db.select()
      .from(transporterInterests)
      .where(
        and(
          eq(transporterInterests.requestId, requestId),
          eq(transporterInterests.transporterId, transporterId)
        )
      )
      .limit(1);
    
    if (existingInterest.length > 0) {
      // Update availability date if different
      if (availabilityDate) {
        await db.update(transporterInterests)
          .set({ availabilityDate: effectiveDate })
          .where(eq(transporterInterests.id, existingInterest[0].id));
      }
      return request[0]; // Return current state
    }
    
    // Create new interest record
    await db.insert(transporterInterests).values({
      requestId,
      transporterId,
      availabilityDate: effectiveDate,
    });
    
    // Also update array for backward compatibility
    await db.update(transportRequests)
      .set({
        transporterInterests: sql`array_append(COALESCE(${transportRequests.transporterInterests}, ARRAY[]::TEXT[]), ${transporterId})`,
      })
      .where(eq(transportRequests.id, requestId));
    
    // Return updated request
    const updated = await db.select()
      .from(transportRequests)
      .where(eq(transportRequests.id, requestId))
      .limit(1);
    
    return updated[0];
  }

  async withdrawInterest(requestId: string, transporterId: string): Promise<TransportRequest | undefined> {
    // Atomic operation: remove transporter from interests array
    // array_remove is idempotent - safe to call multiple times
    // COALESCE handles NULL case (legacy data)
    const result = await db.update(transportRequests)
      .set({
        transporterInterests: sql`array_remove(COALESCE(${transportRequests.transporterInterests}, ARRAY[]::TEXT[]), ${transporterId})`,
      })
      .where(eq(transportRequests.id, requestId))
      .returning();
    
    // If no rows returned, request doesn't exist
    if (result.length === 0) {
      return undefined;
    }
    
    return result[0];
  }

  async getInterestedTransportersForRequest(requestId: string): Promise<any[]> {
    const request = await db.select()
      .from(transportRequests)
      .where(eq(transportRequests.id, requestId))
      .limit(1);

    if (!request[0] || !request[0].transporterInterests || request[0].transporterInterests.length === 0) {
      return [];
    }

    // Get all interested transporters with their proposed availability dates
    // Join with transporter_interests to get the availability_date and hiddenFromClient status
    const transportersWithDates = await db
      .select({
        id: users.id,
        name: users.name,
        phoneNumber: users.phoneNumber,
        role: users.role,
        status: users.status,
        city: users.city,
        rating: users.rating,
        totalTrips: users.totalTrips,
        truckPhotos: users.truckPhotos,
        isVerified: users.isVerified,
        availabilityDate: transporterInterests.availabilityDate,
        hiddenFromClient: transporterInterests.hiddenFromClient,
        interestId: transporterInterests.id, // Include interest ID for updating visibility
      })
      .from(users)
      .leftJoin(
        transporterInterests,
        and(
          eq(transporterInterests.transporterId, users.id),
          eq(transporterInterests.requestId, requestId)
        )
      )
      .where(
        and(
          inArray(users.id, request[0].transporterInterests),
          eq(users.role, 'transporteur'),
          eq(users.status, 'validated')
        )
      );

    return transportersWithDates;
  }

  async getTransporterInterests(transporterId: string): Promise<any[]> {
    // Get all interests for this transporter with request details
    // Filter out cancelled requests to avoid showing them in "Mes intérêts"
    const interests = await db.select({
      interest: transporterInterests,
      request: transportRequests,
      client: users,
    })
      .from(transporterInterests)
      .leftJoin(transportRequests, eq(transporterInterests.requestId, transportRequests.id))
      .leftJoin(users, eq(transportRequests.clientId, users.id))
      .where(
        and(
          eq(transporterInterests.transporterId, transporterId),
          ne(transportRequests.status, 'cancelled')
        )
      )
      .orderBy(desc(transporterInterests.createdAt));

    return interests.map(({ interest, request, client }) => ({
      interestId: interest.id,
      requestId: request?.id,
      referenceId: request?.referenceId,
      availabilityDate: interest.availabilityDate,
      requestDate: request?.dateTime,
      fromCity: request?.fromCity,
      toCity: request?.toCity,
      goodsType: request?.goodsType,
      description: request?.description,
      transporterAmount: request?.transporterAmount,
      status: request?.status,
      coordinationStatus: request?.coordinationStatus,
      client: client ? {
        id: client.id,
        name: client.name,
        phoneNumber: client.phoneNumber,
      } : null,
      createdAt: interest.createdAt,
    }));
  }

  async getAllTransporterInterests(): Promise<any[]> {
    // Get all transporter interests for optimization
    return await db.select().from(transporterInterests);
  }

  async toggleTransporterVisibility(interestId: string, hidden: boolean): Promise<any | undefined> {
    const result = await db.update(transporterInterests)
      .set({ hiddenFromClient: hidden })
      .where(eq(transporterInterests.id, interestId))
      .returning();
    
    return result[0];
  }

  async archiveRequestWithReason(requestId: string, reason: string, coordinatorId: string): Promise<TransportRequest | undefined> {
    const result = await db.update(transportRequests)
      .set({
        coordinationStatus: 'archive',
        coordinationReason: reason,
        status: 'expired',
        coordinationUpdatedAt: new Date(),
        coordinationUpdatedBy: coordinatorId,
      })
      .where(eq(transportRequests.id, requestId))
      .returning();
    
    return result[0];
  }

  async republishRequest(requestId: string, coordinatorId: string): Promise<TransportRequest | undefined> {
    const result = await db.update(transportRequests)
      .set({
        coordinationStatus: 'qualification_pending',
        coordinationReason: null,
        status: 'open',
        coordinationUpdatedAt: new Date(),
        coordinationUpdatedBy: coordinatorId,
      })
      .where(eq(transportRequests.id, requestId))
      .returning();
    
    return result[0];
  }

  // Coordinator manual assignment
  async searchTransporters(query: string): Promise<User[]> {
    const searchTerm = `%${query}%`;
    return await db.select().from(users)
      .where(
        and(
          eq(users.role, 'transporteur'),
          eq(users.status, 'validated'),
          eq(users.accountStatus, 'active'),
          or(
            sql`${users.name} ILIKE ${searchTerm}`,
            sql`${users.phoneNumber} ILIKE ${searchTerm}`
          )
        )
      )
      .orderBy(asc(users.name))
      .limit(20);
  }

  async assignTransporterManually(
    requestId: string,
    transporterId: string,
    transporterAmount: number,
    platformFee: number,
    coordinatorId: string
  ): Promise<TransportRequest | undefined> {
    const clientTotal = transporterAmount + platformFee;
    
    const result = await db.update(transportRequests)
      .set({
        assignedTransporterId: transporterId,
        transporterAmount: transporterAmount.toString(),
        platformFee: platformFee.toString(),
        clientTotal: clientTotal.toString(),
        assignedByCoordinatorId: coordinatorId,
        assignedManually: true,
        assignedAt: new Date(),
        status: 'accepted',
        paymentStatus: 'not_required', // Reset payment status so request appears in transporter "à traiter" view
        coordinationStatus: 'assigned',
        coordinationUpdatedAt: new Date(),
        coordinationUpdatedBy: coordinatorId,
      })
      .where(eq(transportRequests.id, requestId))
      .returning();
    
    return result[0];
  }

  // Coordinator self-assignment (with atomic race protection)
  async assignCoordinatorToRequest(requestId: string, coordinatorId: string): Promise<TransportRequest | undefined> {
    // Atomic UPDATE with conditional WHERE to prevent race conditions
    // Only succeeds if request is either unassigned OR already assigned to this coordinator (idempotent)
    const result = await db.update(transportRequests)
      .set({ assignedToId: coordinatorId })
      .where(
        and(
          eq(transportRequests.id, requestId),
          or(
            sql`${transportRequests.assignedToId} IS NULL`,
            eq(transportRequests.assignedToId, coordinatorId)
          )
        )
      )
      .returning();
    
    // If no rows updated, request is either missing or assigned to another coordinator
    if (!result[0]) {
      // Check if request exists
      const request = await db.select()
        .from(transportRequests)
        .where(eq(transportRequests.id, requestId))
        .limit(1);
      
      if (!request[0]) {
        throw new Error("Commande introuvable");
      }
      
      // Request exists but is assigned to another coordinator
      throw new Error("Cette commande est déjà assignée à un autre coordinateur");
    }
    
    return result[0];
  }

  async unassignCoordinatorFromRequest(requestId: string, coordinatorId: string): Promise<TransportRequest | undefined> {
    // Verify request exists and is assigned to this coordinator
    const request = await db.select()
      .from(transportRequests)
      .where(eq(transportRequests.id, requestId))
      .limit(1);
    
    if (!request[0]) {
      throw new Error("Commande introuvable");
    }
    
    if (request[0].assignedToId !== coordinatorId) {
      throw new Error("Vous n'êtes pas assigné à cette commande");
    }
    
    const result = await db.update(transportRequests)
      .set({ assignedToId: null })
      .where(eq(transportRequests.id, requestId))
      .returning();
    
    return result[0];
  }

  // Coordinator management (Admin)
  async getAllCoordinators(): Promise<User[]> {
    return await db.select().from(users)
      .where(eq(users.role, 'coordinateur'))
      .orderBy(desc(users.createdAt));
  }

  async getCoordinatorById(id: string): Promise<User | undefined> {
    const result = await db.select().from(users)
      .where(and(
        eq(users.id, id),
        eq(users.role, 'coordinateur')
      ))
      .limit(1);
    return result[0];
  }

  async updateCoordinatorStatus(id: string, accountStatus: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ accountStatus })
      .where(and(
        eq(users.id, id),
        eq(users.role, 'coordinateur')
      ))
      .returning();
    return result[0];
  }

  async deleteCoordinator(id: string): Promise<void> {
    await db.delete(users).where(and(
      eq(users.id, id),
      eq(users.role, 'coordinateur')
    ));
  }

  async resetCoordinatorPin(id: string, newPin: string): Promise<User | undefined> {
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(newPin, 10);
    const result = await db.update(users)
      .set({ passwordHash })
      .where(and(
        eq(users.id, id),
        eq(users.role, 'coordinateur')
      ))
      .returning();
    return result[0];
  }

  // Coordinator activity logs
  async createCoordinatorLog(insertLog: InsertCoordinatorLog): Promise<CoordinatorLog> {
    const result = await db.insert(coordinatorLogs).values(insertLog).returning();
    return result[0];
  }

  async getCoordinatorLogs(coordinatorId?: string): Promise<CoordinatorLog[]> {
    if (coordinatorId) {
      return await db.select().from(coordinatorLogs)
        .where(eq(coordinatorLogs.coordinatorId, coordinatorId))
        .orderBy(desc(coordinatorLogs.createdAt))
        .limit(100);
    }
    return await db.select().from(coordinatorLogs)
      .orderBy(desc(coordinatorLogs.createdAt))
      .limit(100);
  }

  async getRecentCoordinatorActivity(): Promise<any[]> {
    // Get recent logs with coordinator information
    const logs = await db.select({
      id: coordinatorLogs.id,
      action: coordinatorLogs.action,
      targetType: coordinatorLogs.targetType,
      targetId: coordinatorLogs.targetId,
      details: coordinatorLogs.details,
      createdAt: coordinatorLogs.createdAt,
      coordinatorId: users.id,
      coordinatorName: users.name,
      coordinatorPhone: users.phoneNumber,
    })
    .from(coordinatorLogs)
    .innerJoin(users, eq(coordinatorLogs.coordinatorId, users.id))
    .orderBy(desc(coordinatorLogs.createdAt))
    .limit(50);

    return logs;
  }

  // Transporter Reference operations
  async createTransporterReference(reference: InsertTransporterReference): Promise<TransporterReference> {
    const result = await db.insert(transporterReferences).values(reference).returning();
    return result[0];
  }

  async getTransporterReferenceByTransporterId(transporterId: string): Promise<TransporterReference | undefined> {
    const result = await db.select().from(transporterReferences)
      .where(eq(transporterReferences.transporterId, transporterId))
      .limit(1);
    return result[0];
  }

  async getAllPendingReferences(): Promise<any[]> {
    const references = await db.select({
      id: transporterReferences.id,
      transporterId: transporterReferences.transporterId,
      transporterName: users.name,
      transporterPhone: users.phoneNumber,
      transporterCity: users.city,
      referenceName: transporterReferences.referenceName,
      referencePhone: transporterReferences.referencePhone,
      referenceRelation: transporterReferences.referenceRelation,
      status: transporterReferences.status,
      createdAt: transporterReferences.createdAt,
    })
    .from(transporterReferences)
    .innerJoin(users, eq(transporterReferences.transporterId, users.id))
    .where(eq(transporterReferences.status, 'pending'))
    .orderBy(desc(transporterReferences.createdAt));

    return references;
  }

  async validateReference(id: string, adminId: string): Promise<TransporterReference | undefined> {
    // Update reference status to validated
    const result = await db.update(transporterReferences)
      .set({ 
        status: 'validated',
        validatedBy: adminId,
        validatedAt: new Date()
      })
      .where(eq(transporterReferences.id, id))
      .returning();

    if (result[0]) {
      // Also update the transporter's isVerified status
      await db.update(users)
        .set({ 
          isVerified: true,
          status: 'validated'
        })
        .where(eq(users.id, result[0].transporterId));
    }

    return result[0];
  }

  async rejectReference(id: string, adminId: string, reason: string): Promise<TransporterReference | undefined> {
    const result = await db.update(transporterReferences)
      .set({ 
        status: 'rejected',
        validatedBy: adminId,
        validatedAt: new Date(),
        rejectionReason: reason
      })
      .where(eq(transporterReferences.id, id))
      .returning();

    return result[0];
  }

  async updateTransporterReference(id: string, updates: Partial<TransporterReference>): Promise<TransporterReference | undefined> {
    const result = await db.update(transporterReferences)
      .set(updates)
      .where(eq(transporterReferences.id, id))
      .returning();
    return result[0];
  }
  
  // Coordination Status Config operations
  async createCoordinationStatusConfig(status: InsertCoordinationStatus): Promise<CoordinationStatus> {
    const result = await db.insert(coordinationStatuses).values(status).returning();
    return result[0];
  }

  async getAllCoordinationStatusConfigs(): Promise<CoordinationStatus[]> {
    const result = await db.select()
      .from(coordinationStatuses)
      .where(eq(coordinationStatuses.isActive, true))
      .orderBy(asc(coordinationStatuses.category), asc(coordinationStatuses.displayOrder));
    return result;
  }

  async getCoordinationStatusConfigsByCategory(category: string): Promise<CoordinationStatus[]> {
    const result = await db.select()
      .from(coordinationStatuses)
      .where(and(
        eq(coordinationStatuses.category, category),
        eq(coordinationStatuses.isActive, true)
      ))
      .orderBy(asc(coordinationStatuses.displayOrder));
    return result;
  }

  async updateCoordinationStatusConfig(id: string, updates: Partial<CoordinationStatus>): Promise<CoordinationStatus | undefined> {
    const result = await db.update(coordinationStatuses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(coordinationStatuses.id, id))
      .returning();
    return result[0];
  }

  async deleteCoordinationStatusConfig(id: string): Promise<void> {
    await db.delete(coordinationStatuses).where(eq(coordinationStatuses.id, id));
  }

  async getCoordinationStatusUsage(): Promise<{ coordination_status: string; usage_count: number }[]> {
    const result = await db.select({
      coordination_status: transportRequests.coordinationStatus,
      usage_count: sql<number>`count(*)::int`,
    })
      .from(transportRequests)
      .where(isNotNull(transportRequests.coordinationStatus))
      .groupBy(transportRequests.coordinationStatus);
    
    return result.map((row: any) => ({
      coordination_status: row.coordination_status,
      usage_count: row.usage_count,
    }));
  }

  // Request Notes operations
  async createRequestNote(requestId: string, coordinatorId: string, content: string): Promise<any> {
    const noteData = {
      requestId,
      coordinatorId,
      content,
    };
    
    const [note] = await db.insert(requestNotes).values(noteData).returning();
    
    // Fetch coordinator info to return with note
    const coordinator = await this.getUser(coordinatorId);
    
    return {
      ...note,
      coordinator: coordinator ? {
        id: coordinator.id,
        name: coordinator.name,
        phoneNumber: coordinator.phoneNumber,
      } : null,
    };
  }

  async getRequestNotes(requestId: string): Promise<any[]> {
    const notes = await db.select()
      .from(requestNotes)
      .where(eq(requestNotes.requestId, requestId))
      .orderBy(desc(requestNotes.createdAt));
    
    // Enrich with coordinator info
    const enrichedNotes = await Promise.all(
      notes.map(async (note) => {
        const coordinator = await this.getUser(note.coordinatorId);
        return {
          ...note,
          coordinator: coordinator ? {
            id: coordinator.id,
            name: coordinator.name,
            phoneNumber: coordinator.phoneNumber,
          } : null,
        };
      })
    );
    
    return enrichedNotes;
  }
}

export const storage = new DbStorage();
