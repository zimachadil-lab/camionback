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
  name: text("name"),
  city: text("city"), // City of residence
  truckPhotos: text("truck_photos").array(), // For transporters
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"), // Average rating for transporters
  totalRatings: integer("total_ratings").default(0), // Number of ratings received
  totalTrips: integer("total_trips").default(0), // For transporters
  status: text("status"), // 'pending', 'validated' - for transporters only
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
  createdAt: timestamp("created_at").defaultNow(),
});

// Offers from transporters
export const offers = pgTable("offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull().references(() => transportRequests.id),
  transporterId: varchar("transporter_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  message: text("message"),
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
  message: text("message").notNull(),
  filteredMessage: text("filtered_message"), // Message after phone/link filtering
  isRead: boolean("is_read").default(false),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertOtpCodeSchema = createInsertSchema(otpCodes).omit({ id: true, createdAt: true, verified: true });
export const insertTransportRequestSchema = createInsertSchema(transportRequests).omit({ id: true, createdAt: true, referenceId: true, status: true, acceptedOfferId: true, paymentStatus: true, paymentReceipt: true, paymentDate: true, viewCount: true, declinedBy: true }).extend({
  dateTime: z.coerce.date(), // Accept ISO string and coerce to Date
});
export const insertOfferSchema = createInsertSchema(offers).omit({ id: true, createdAt: true, status: true, paymentProofUrl: true, paymentValidated: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true, filteredMessage: true, isRead: true });
export const insertAdminSettingsSchema = createInsertSchema(adminSettings).omit({ id: true, updatedAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, read: true });
export const insertRatingSchema = createInsertSchema(ratings).omit({ id: true, createdAt: true });

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
