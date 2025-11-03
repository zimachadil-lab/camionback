import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - supports Client, Transporter, Coordinator, and Admin roles
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: text("phone_number").notNull().unique(),
  passwordHash: text("password_hash").notNull(), // Bcrypt hash of 6-digit PIN
  role: text("role"), // Pas de constraint - accepte toutes valeurs pendant migration (transporter/transporteur/coordinator/coordinateur)
  clientId: text("client_id").unique(), // Auto-generated ID for clients (C-XXXX)
  name: text("name"),
  city: text("city"), // City of residence
  truckPhotos: text("truck_photos").array(), // For transporters
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"), // Average rating for transporters
  totalRatings: integer("total_ratings").default(0), // Number of ratings received
  totalTrips: integer("total_trips").default(0), // For transporters
  status: text("status"), // 'pending', 'validated' - for transporters only
  accountStatus: text("account_status").default("active"), // 'active', 'blocked' - for all users
  ribName: text("rib_name"), // Name for RIB (for transporters)
  ribNumber: text("rib_number"), // 24-digit RIB number (for transporters)
  deviceToken: text("device_token"), // Push notification subscription token (JSON)
  isActive: boolean("is_active").default(true),
  isVerified: boolean("is_verified").default(false), // Verified by professional reference (transporters only)
  createdAt: timestamp("created_at").defaultNow(),
});

// OTP verification codes
export const otpCodes = pgTable("otp_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: text("phone_number").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transport requests
export const transportRequests = pgTable("transport_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referenceId: text("reference_id").notNull().unique(), // CMD-2025-XXXXX
  clientId: varchar("client_id").notNull().references(() => users.id),
  fromCity: text("from_city").notNull(),
  toCity: text("to_city").notNull(),
  description: text("description").notNull(),
  goodsType: text("goods_type").notNull(),
  dateTime: timestamp("date_time").notNull(),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  photos: text("photos").array(),
  // Handling/Manutention fields
  handlingRequired: boolean("handling_required").default(false), // Besoin de manutention
  departureFloor: integer("departure_floor"), // Étage au départ (null si pas de manutention)
  departureElevator: boolean("departure_elevator"), // Ascenseur au départ
  arrivalFloor: integer("arrival_floor"), // Étage à l'arrivée (null si pas de manutention)
  arrivalElevator: boolean("arrival_elevator"), // Ascenseur à l'arrivée
  status: text("status").default("open"), // open, accepted, completed, cancelled
  acceptedOfferId: varchar("accepted_offer_id"),
  paymentStatus: text("payment_status").default("pending"), // pending, awaiting_payment, pending_admin_validation, paid
  paymentReceipt: text("payment_receipt"), // Client's payment receipt photo (base64)
  paymentDate: timestamp("payment_date"),
  viewCount: integer("view_count").default(0), // Number of times request was viewed
  declinedBy: text("declined_by").array().default(sql`ARRAY[]::text[]`), // IDs of transporters who declined
  smsSent: boolean("sms_sent").default(false), // Track if first offer SMS was sent to client
  isHidden: boolean("is_hidden").default(false), // Admin can hide requests from transporters
  shareToken: text("share_token").unique().default(sql`substring(md5(random()::text) from 1 for 16)`), // Unique token for public sharing
  // Coordination fields - for coordinator request management
  coordinationStatus: text("coordination_status").default("qualification_pending"), // Status for coordination workflow - NEW: starts as "qualification_pending"
  coordinationReason: text("coordination_reason"), // Archive reason if archived
  coordinationReminderDate: timestamp("coordination_reminder_date"), // Reminder date/time
  coordinationUpdatedAt: timestamp("coordination_updated_at"), // Last coordination status update
  coordinationUpdatedBy: varchar("coordination_updated_by").references(() => users.id), // Coordinator who updated
  assignedToId: varchar("assigned_to_id").references(() => users.id), // Coordinator assigned to this request
  // Manual assignment fields - for coordinator direct assignment
  assignedTransporterId: varchar("assigned_transporter_id").references(() => users.id), // Transporter assigned manually by coordinator
  transporterAmount: decimal("transporter_amount", { precision: 10, scale: 2 }), // Amount paid to transporter (set by coordinator)
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }), // CamionBack commission (set by coordinator)
  clientTotal: decimal("client_total", { precision: 10, scale: 2 }), // Total amount client pays (transporterAmount + platformFee)
  assignedByCoordinatorId: varchar("assigned_by_coordinator_id").references(() => users.id), // Coordinator who made the assignment
  assignedManually: boolean("assigned_manually").default(false), // True if assigned manually by coordinator
  assignedAt: timestamp("assigned_at"), // Timestamp of manual assignment
  // Transporter interests - Track transporters who clicked "Intéressé" for matching workflow
  transporterInterests: text("transporter_interests").array().default(sql`ARRAY[]::text[]`), // Array of transporter IDs who expressed interest
  qualifiedAt: timestamp("qualified_at"), // When coordinator completed qualification (set prices)
  publishedForMatchingAt: timestamp("published_for_matching_at"), // When published for transporter matching
  createdAt: timestamp("created_at").defaultNow(),
});

// Offers from transporters
export const offers = pgTable("offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull().references(() => transportRequests.id),
  transporterId: varchar("transporter_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  pickupDate: timestamp("pickup_date").notNull(), // Date proposée pour la prise en charge
  loadType: text("load_type").notNull(), // 'return' (retour) ou 'shared' (groupage)
  status: text("status").default("pending"), // pending, accepted, rejected, completed
  paymentProofUrl: text("payment_proof_url"), // Transporter uploads payment proof
  paymentValidated: boolean("payment_validated").default(false), // Admin validates
  createdAt: timestamp("created_at").defaultNow(),
});

// Transporter Interests - Track transporters who expressed interest with their availability dates
export const transporterInterests = pgTable("transporter_interests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull().references(() => transportRequests.id),
  transporterId: varchar("transporter_id").notNull().references(() => users.id),
  availabilityDate: timestamp("availability_date").notNull(), // Date when transporter is available
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat messages
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull().references(() => transportRequests.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  message: text("message"), // Text message content (null for voice/photo/video messages)
  messageType: text("message_type").default("text"), // 'text', 'voice', 'photo', or 'video'
  fileUrl: text("file_url"), // URL to file (audio/photo/video)
  fileName: text("file_name"), // Original filename
  fileSize: integer("file_size"), // File size in bytes
  filteredMessage: text("filtered_message"), // Message after phone/link filtering
  isRead: boolean("is_read").default(false),
  senderType: text("sender_type"), // 'client', 'transporteur', 'coordinateur', or 'admin'
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin settings
export const adminSettings = pgTable("admin_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commissionPercentage: decimal("commission_percentage", { precision: 5, scale: 2 }).default("10"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'offer_received', 'offer_accepted', 'message_received', 'payment_validated'
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedId: varchar("related_id"), // ID of offer, message, request, etc.
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Ratings - Individual ratings for each completed transport
export const ratings = pgTable("ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull().unique().references(() => transportRequests.id), // One rating per request
  transporterId: varchar("transporter_id").notNull().references(() => users.id),
  clientId: varchar("client_id").notNull().references(() => users.id),
  score: integer("score").notNull(), // 1-5 stars
  comment: text("comment"), // Optional comment for future use
  createdAt: timestamp("created_at").defaultNow(),
});

// Empty Returns - Transporters announce their empty return trips
export const emptyReturns = pgTable("empty_returns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transporterId: varchar("transporter_id").notNull().references(() => users.id),
  fromCity: text("from_city").notNull(),
  toCity: text("to_city").notNull(),
  returnDate: timestamp("return_date").notNull(), // Date of the return trip
  status: text("status").default("active"), // active, expired, assigned
  createdAt: timestamp("created_at").defaultNow(),
});

// Contracts - Generated when client accepts an offer
export const contracts = pgTable("contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull().references(() => transportRequests.id),
  offerId: varchar("offer_id").notNull().references(() => offers.id),
  clientId: varchar("client_id").notNull().references(() => users.id),
  transporterId: varchar("transporter_id").notNull().references(() => users.id),
  referenceId: text("reference_id").notNull(), // Copy of request reference for easy display
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Agreed amount
  status: text("status").default("in_progress"), // in_progress, marked_paid_transporter, marked_paid_client, completed
  createdAt: timestamp("created_at").defaultNow(),
});

// Reports/Signalements - Users can report issues with completed requests
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull().references(() => transportRequests.id),
  reporterId: varchar("reporter_id").notNull().references(() => users.id), // User who created the report
  reporterType: text("reporter_type").notNull(), // 'client' or 'transporter'
  reportedUserId: varchar("reported_user_id").notNull().references(() => users.id), // User being reported
  reason: text("reason").notNull(), // Motif du signalement
  details: text("details"), // Détails supplémentaires (facultatif)
  status: text("status").default("pending"), // pending, treated, rejected
  adminNotes: text("admin_notes"), // Notes internes de l'admin
  createdAt: timestamp("created_at").defaultNow(),
});

// Cities - Admin-managed list of available cities
export const cities = pgTable("cities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// SMS History - Track all SMS sent from admin dashboard
export const smsHistory = pgTable("sms_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  targetAudience: text("target_audience").notNull(), // 'transporters', 'clients', 'both'
  message: text("message").notNull(),
  recipientCount: integer("recipient_count").notNull(),
  status: text("status").default("sent"), // 'sent', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
});

// Client-Transporter Contacts - Track when clients contact transporters via recommendations
export const clientTransporterContacts = pgTable("client_transporter_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull().references(() => transportRequests.id, { onDelete: 'cascade' }),
  clientId: varchar("client_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  transporterId: varchar("transporter_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  contactType: text("contact_type").default("recommendation"), // 'recommendation' - for future expansion
  isRead: boolean("is_read").default(false), // Admin read status
  createdAt: timestamp("created_at").defaultNow(),
});

// Stories - Instagram-style dynamic stories for client and transporter dashboards
export const stories = pgTable("stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  role: text("role").notNull(), // 'client', 'transporter', or 'all'
  title: text("title").notNull(), // Short title for the story
  content: text("content").notNull(), // Main content/description of the story
  mediaUrl: text("media_url"), // Optional URL to image or video
  order: integer("order").default(0), // Display order (lower = first)
  isActive: boolean("is_active").default(true), // Active/Inactive status
  createdAt: timestamp("created_at").defaultNow(),
});

// Transporter References - Professional references for transporter validation
export const transporterReferences = pgTable("transporter_references", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transporterId: varchar("transporter_id").notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  referenceName: text("reference_name").notNull(), // Full name of the reference
  referencePhone: text("reference_phone").notNull(), // Phone number of the reference
  referenceRelation: text("reference_relation").notNull(), // 'Client', 'Transporteur', 'Autre'
  status: text("status").default("pending"), // 'pending', 'validated', 'rejected'
  validatedBy: varchar("validated_by").references(() => users.id), // Admin/Coordinator who validated
  validatedAt: timestamp("validated_at"), // When it was validated
  rejectionReason: text("rejection_reason"), // Reason for rejection if rejected
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertOtpCodeSchema = createInsertSchema(otpCodes).omit({ id: true, createdAt: true, verified: true });
export const insertTransportRequestSchema = createInsertSchema(transportRequests).omit({ 
  id: true, 
  createdAt: true, 
  referenceId: true, 
  status: true, 
  acceptedOfferId: true, 
  paymentStatus: true, 
  paymentReceipt: true, 
  paymentDate: true, 
  viewCount: true, 
  declinedBy: true, 
  coordinationStatus: true, 
  coordinationReason: true, 
  coordinationReminderDate: true, 
  coordinationUpdatedAt: true, 
  coordinationUpdatedBy: true,
  transporterInterests: true, // Auto-managed by system
  qualifiedAt: true, // Auto-set when coordinator qualifies
  publishedForMatchingAt: true, // Auto-set when published
}).extend({
  dateTime: z.coerce.date(), // Accept ISO string and coerce to Date
});
export const insertOfferSchema = createInsertSchema(offers).omit({ id: true, createdAt: true, status: true, paymentProofUrl: true, paymentValidated: true }).extend({
  pickupDate: z.coerce.date(), // Accept ISO string and coerce to Date
  loadType: z.enum(["return", "shared"]), // Only allow 'return' or 'shared'
});
export const insertTransporterInterestSchema = createInsertSchema(transporterInterests).omit({ id: true, createdAt: true }).extend({
  availabilityDate: z.coerce.date(), // Accept ISO string and coerce to Date
});
export const insertChatMessageSchema = createInsertSchema(chatMessages)
  .omit({ id: true, createdAt: true, filteredMessage: true, isRead: true })
  .extend({
    messageType: z.enum(["text", "voice", "photo", "video"]).default("text"),
    message: z.string().optional(),
    fileUrl: z.string().optional(),
    fileName: z.string().optional(),
    fileSize: z.number().optional(),
  })
  .refine(
    (data) => {
      if (data.messageType === "text") {
        return !!data.message && data.message.trim().length > 0;
      }
      if (data.messageType === "voice" || data.messageType === "photo" || data.messageType === "video") {
        return !!data.fileUrl && data.fileUrl.trim().length > 0;
      }
      return false;
    },
    {
      message: "Text messages require a message field, media messages require a fileUrl field",
    }
  );
export const insertAdminSettingsSchema = createInsertSchema(adminSettings).omit({ id: true, updatedAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, read: true });
export const insertRatingSchema = createInsertSchema(ratings).omit({ id: true, createdAt: true });
export const insertEmptyReturnSchema = createInsertSchema(emptyReturns).omit({ id: true, createdAt: true, status: true }).extend({
  returnDate: z.coerce.date(), // Accept ISO string and coerce to Date
});
export const insertContractSchema = createInsertSchema(contracts).omit({ id: true, createdAt: true, status: true });
export const insertReportSchema = createInsertSchema(reports).omit({ id: true, createdAt: true, status: true, adminNotes: true });
export const insertCitySchema = createInsertSchema(cities).omit({ id: true, createdAt: true });
export const insertSmsHistorySchema = createInsertSchema(smsHistory).omit({ id: true, createdAt: true, status: true });
export const insertClientTransporterContactSchema = createInsertSchema(clientTransporterContacts).omit({ id: true, createdAt: true, isRead: true });
export const insertStorySchema = createInsertSchema(stories).omit({ id: true, createdAt: true }).extend({
  role: z.enum(["client", "transporter", "all"]),
});
export const insertTransporterReferenceSchema = createInsertSchema(transporterReferences).omit({ id: true, createdAt: true, status: true, validatedBy: true, validatedAt: true, rejectionReason: true }).extend({
  referenceRelation: z.enum(["Client", "Transporteur", "Autre"]),
});

// Coordinator Activity Logs
export const coordinatorLogs = pgTable("coordinator_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  coordinatorId: varchar("coordinator_id").notNull().references(() => users.id),
  action: text("action").notNull(), // 'update_visibility', 'update_payment_status', 'view_request', 'send_message', 'view_chat'
  targetType: text("target_type"), // 'request', 'chat', 'user'
  targetId: varchar("target_id"), // ID of the affected entity
  details: text("details"), // JSON string with additional details
  createdAt: timestamp("created_at").defaultNow(),
});

// Coordination Statuses - Configurable statuses for coordinator workflow
export const coordinationStatuses = pgTable("coordination_statuses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  label: text("label").notNull(), // Display text (e.g., "Client injoignable")
  value: text("value").notNull().unique(), // Technical value (e.g., "client_injoignable")
  category: text("category").notNull(), // 'en_action' or 'prioritaires'
  color: text("color"), // Optional color for UI (e.g., "orange", "red")
  displayOrder: integer("display_order").default(0), // Order for display
  isActive: boolean("is_active").default(true), // Enable/disable status
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCoordinatorLogSchema = createInsertSchema(coordinatorLogs).omit({ id: true, createdAt: true });
export const insertCoordinationStatusSchema = createInsertSchema(coordinationStatuses).omit({ id: true, createdAt: true, updatedAt: true });

// Coordinator-specific schemas for admin management
export const createCoordinatorSchema = z.object({
  phoneNumber: z.string().min(10, "Le numéro de téléphone doit contenir au moins 10 caractères"),
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  pin: z.string().length(6, "Le PIN doit contenir exactement 6 chiffres").regex(/^\d{6}$/, "Le PIN doit contenir uniquement des chiffres"),
});

export const resetCoordinatorPinSchema = z.object({
  newPin: z.string().length(6, "Le PIN doit contenir exactement 6 chiffres").regex(/^\d{6}$/, "Le PIN doit contenir uniquement des chiffres"),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertOtpCode = z.infer<typeof insertOtpCodeSchema>;
export type OtpCode = typeof otpCodes.$inferSelect;
export type InsertTransportRequest = z.infer<typeof insertTransportRequestSchema>;
export type TransportRequest = typeof transportRequests.$inferSelect;
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offers.$inferSelect;
export type InsertTransporterInterest = z.infer<typeof insertTransporterInterestSchema>;
export type TransporterInterest = typeof transporterInterests.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertAdminSettings = z.infer<typeof insertAdminSettingsSchema>;
export type AdminSettings = typeof adminSettings.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratings.$inferSelect;
export type InsertEmptyReturn = z.infer<typeof insertEmptyReturnSchema>;
export type EmptyReturn = typeof emptyReturns.$inferSelect;
// Type for empty returns with populated transporter info
export type ActiveEmptyReturnWithTransporter = EmptyReturn & {
  transporter: {
    id: string;
    name: string | null;
    phoneNumber: string;
  } | null;
};
export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertCity = z.infer<typeof insertCitySchema>;
export type City = typeof cities.$inferSelect;
export type InsertSmsHistory = z.infer<typeof insertSmsHistorySchema>;
export type SmsHistory = typeof smsHistory.$inferSelect;
export type InsertClientTransporterContact = z.infer<typeof insertClientTransporterContactSchema>;
export type ClientTransporterContact = typeof clientTransporterContacts.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect;
export type InsertTransporterReference = z.infer<typeof insertTransporterReferenceSchema>;
export type TransporterReference = typeof transporterReferences.$inferSelect;
export type InsertCoordinatorLog = z.infer<typeof insertCoordinatorLogSchema>;
export type CoordinatorLog = typeof coordinatorLogs.$inferSelect;
export type InsertCoordinationStatus = z.infer<typeof insertCoordinationStatusSchema>;
export type CoordinationStatus = typeof coordinationStatuses.$inferSelect;
export type CreateCoordinator = z.infer<typeof createCoordinatorSchema>;
export type ResetCoordinatorPin = z.infer<typeof resetCoordinatorPinSchema>;

// Coordination Status Constants and Types
export const COORDINATION_STATUS = {
  // Vue: À Qualifier (NEW - initial state for all requests)
  QUALIFICATION_PENDING: "qualification_pending", // Nouveau statut initial - invisible aux transporteurs
  
  // Vue: Nouveau (requests qualified and ready)
  NOUVEAU: "nouveau",
  
  // Vue: Matching (NEW - published for transporter interest)
  MATCHING: "matching", // Publié pour concurrence transporteurs (boutons Intéressé/Pas dispo)
  
  // Vue: En Action
  CLIENT_INJOIGNABLE: "client_injoignable",
  INFOS_MANQUANTES: "infos_manquantes",
  PHOTOS_A_RECUPERER: "photos_a_recuperer",
  RAPPEL_PREVU: "rappel_prevu",
  ATTENTE_CONCURRENCE: "attente_concurrence",
  REFUS_TARIF: "refus_tarif",
  
  // Vue: Prioritaires
  LIVRAISON_URGENTE: "livraison_urgente",
  CLIENT_INTERESSE: "client_interesse",
  TRANSPORTEUR_INTERESSE: "transporteur_interesse",
  MENACE_ANNULATION: "menace_annulation",
  
  // Vue: Archives
  ARCHIVE: "archive",
} as const;

export const COORDINATION_ARCHIVE_REASONS = {
  CLIENT_INJOIGNABLE: "client_injoignable", // Client ne répond pas
  TRAITE_AILLEURS: "traite_ailleurs", // Client a déjà trouvé ailleurs
  BUDGET_INSUFFISANT: "budget_insuffisant", // Budget client insuffisant
  INFOS_INCOMPLETES: "infos_incompletes", // Informations incomplètes
  NON_PRIORITAIRE: "non_prioritaire", // Demande non prioritaire
  NON_REALISABLE: "non_realisable", // Transport non réalisable
  CLIENT_ANNULE: "client_annule", // Client a annulé la demande
  AUCUNE_OFFRE: "aucune_offre", // Aucune offre reçue
  PRIX_REFUSE: "prix_refuse", // Prix refusé par client
  INJOIGNABLE_LONG_TERME: "injoignable_long_terme", // Client injoignable sur le long terme
  A_REPRENDRE_PLUS_TARD: "a_reprendre_plus_tard", // À reprendre plus tard
  OFFRE_EXPIREE: "offre_expiree", // Offre expirée
} as const;

// Archive reasons with French labels for UI
export const ARCHIVE_REASONS_LABELS: Record<string, string> = {
  [COORDINATION_ARCHIVE_REASONS.CLIENT_INJOIGNABLE]: "Client injoignable",
  [COORDINATION_ARCHIVE_REASONS.TRAITE_AILLEURS]: "Client a trouvé ailleurs",
  [COORDINATION_ARCHIVE_REASONS.BUDGET_INSUFFISANT]: "Budget insuffisant",
  [COORDINATION_ARCHIVE_REASONS.INFOS_INCOMPLETES]: "Informations incomplètes",
  [COORDINATION_ARCHIVE_REASONS.NON_PRIORITAIRE]: "Demande non prioritaire",
  [COORDINATION_ARCHIVE_REASONS.NON_REALISABLE]: "Transport non réalisable",
  [COORDINATION_ARCHIVE_REASONS.CLIENT_ANNULE]: "Client a annulé",
  [COORDINATION_ARCHIVE_REASONS.AUCUNE_OFFRE]: "Aucune offre reçue",
  [COORDINATION_ARCHIVE_REASONS.PRIX_REFUSE]: "Prix refusé par le client",
  [COORDINATION_ARCHIVE_REASONS.INJOIGNABLE_LONG_TERME]: "Client injoignable (long terme)",
  [COORDINATION_ARCHIVE_REASONS.A_REPRENDRE_PLUS_TARD]: "À reprendre plus tard",
  [COORDINATION_ARCHIVE_REASONS.OFFRE_EXPIREE]: "Offre expirée",
};

// Typed array for UI selects
export const ARCHIVE_REASONS_OPTIONS = Object.entries(ARCHIVE_REASONS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

// Schema for updating coordination status
export const updateCoordinationStatusSchema = z.object({
  coordinationStatus: z.enum([
    COORDINATION_STATUS.QUALIFICATION_PENDING,
    COORDINATION_STATUS.NOUVEAU,
    COORDINATION_STATUS.MATCHING,
    COORDINATION_STATUS.CLIENT_INJOIGNABLE,
    COORDINATION_STATUS.INFOS_MANQUANTES,
    COORDINATION_STATUS.PHOTOS_A_RECUPERER,
    COORDINATION_STATUS.RAPPEL_PREVU,
    COORDINATION_STATUS.ATTENTE_CONCURRENCE,
    COORDINATION_STATUS.REFUS_TARIF,
    COORDINATION_STATUS.LIVRAISON_URGENTE,
    COORDINATION_STATUS.CLIENT_INTERESSE,
    COORDINATION_STATUS.TRANSPORTEUR_INTERESSE,
    COORDINATION_STATUS.MENACE_ANNULATION,
    COORDINATION_STATUS.ARCHIVE,
  ]),
  coordinationReason: z.enum([
    COORDINATION_ARCHIVE_REASONS.CLIENT_INJOIGNABLE,
    COORDINATION_ARCHIVE_REASONS.TRAITE_AILLEURS,
    COORDINATION_ARCHIVE_REASONS.BUDGET_INSUFFISANT,
    COORDINATION_ARCHIVE_REASONS.INFOS_INCOMPLETES,
    COORDINATION_ARCHIVE_REASONS.NON_PRIORITAIRE,
    COORDINATION_ARCHIVE_REASONS.NON_REALISABLE,
    COORDINATION_ARCHIVE_REASONS.CLIENT_ANNULE,
    COORDINATION_ARCHIVE_REASONS.AUCUNE_OFFRE,
    COORDINATION_ARCHIVE_REASONS.PRIX_REFUSE,
    COORDINATION_ARCHIVE_REASONS.INJOIGNABLE_LONG_TERME,
    COORDINATION_ARCHIVE_REASONS.A_REPRENDRE_PLUS_TARD,
    COORDINATION_ARCHIVE_REASONS.OFFRE_EXPIREE,
  ]).optional(),
  coordinationReminderDate: z.coerce.date().optional(),
  coordinationUpdatedBy: z.string(),
});

// Schema for coordinator qualification (setting prices)
export const qualifyRequestSchema = z.object({
  requestId: z.string(),
  transporterAmount: z.number().positive("Le montant transporteur doit être positif"),
  platformFee: z.number().nonnegative("La cotisation ne peut pas être négative"),
});

// Schema for expressing transporter interest
export const expressInterestSchema = z.object({
  requestId: z.string(),
  interested: z.boolean(), // true = "Intéressé", false = "Pas disponible"
  availabilityDate: z.coerce.date().optional(), // Date when transporter is available (optional for backward compatibility)
});

export type UpdateCoordinationStatus = z.infer<typeof updateCoordinationStatusSchema>;
export type QualifyRequest = z.infer<typeof qualifyRequestSchema>;
export type ExpressInterest = z.infer<typeof expressInterestSchema>;
