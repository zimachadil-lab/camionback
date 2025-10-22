import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - supports Client, Transporter, and Admin roles
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: text("phone_number").notNull().unique(),
  passwordHash: text("password_hash").notNull(), // Bcrypt hash of 6-digit PIN
  role: text("role"), // 'client', 'transporter', 'admin' - null until selected
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
  isActive: boolean("is_active").default(true),
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
  dateFlexible: boolean("date_flexible").default(false), // Whether date is flexible
  invoiceRequired: boolean("invoice_required").default(false), // Whether TTC invoice is needed
  budget: decimal("budget", { precision: 10, scale: 2 }),
  photos: text("photos").array(),
  status: text("status").default("open"), // open, accepted, completed, cancelled
  acceptedOfferId: varchar("accepted_offer_id"),
  paymentStatus: text("payment_status").default("pending"), // pending, awaiting_payment, pending_admin_validation, paid
  paymentReceipt: text("payment_receipt"), // Client's payment receipt photo (base64)
  paymentDate: timestamp("payment_date"),
  viewCount: integer("view_count").default(0), // Number of times request was viewed
  declinedBy: text("declined_by").array().default(sql`ARRAY[]::text[]`), // IDs of transporters who declined
  smsSent: boolean("sms_sent").default(false), // Track if first offer SMS was sent to client
  isHidden: boolean("is_hidden").default(false), // Admin can hide requests from transporters
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
  senderType: text("sender_type"), // 'client', 'transporter', or 'admin'
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertOtpCodeSchema = createInsertSchema(otpCodes).omit({ id: true, createdAt: true, verified: true });
export const insertTransportRequestSchema = createInsertSchema(transportRequests).omit({ id: true, createdAt: true, referenceId: true, status: true, acceptedOfferId: true, paymentStatus: true, paymentReceipt: true, paymentDate: true, viewCount: true, declinedBy: true }).extend({
  dateTime: z.coerce.date(), // Accept ISO string and coerce to Date
});
export const insertOfferSchema = createInsertSchema(offers).omit({ id: true, createdAt: true, status: true, paymentProofUrl: true, paymentValidated: true }).extend({
  pickupDate: z.coerce.date(), // Accept ISO string and coerce to Date
  loadType: z.enum(["return", "shared"]), // Only allow 'return' or 'shared'
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

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertOtpCode = z.infer<typeof insertOtpCodeSchema>;
export type OtpCode = typeof otpCodes.$inferSelect;
export type InsertTransportRequest = z.infer<typeof insertTransportRequestSchema>;
export type TransportRequest = typeof transportRequests.$inferSelect;
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offers.$inferSelect;
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
