import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { db } from "./db";
import multer from "multer";
import { z } from "zod";
import bcrypt from "bcrypt";
import { sanitizeUser, sanitizeUsers, sendUser, isAdmin, isAdminOrCoordinator } from "./security-utils";
import { requireAuth, requireRole, getCurrentUser } from "./auth-middleware";
import { 
  insertUserSchema, 
  insertOtpCodeSchema, 
  insertTransportRequestSchema,
  insertOfferSchema,
  insertChatMessageSchema,
  insertNotificationSchema,
  insertEmptyReturnSchema,
  insertReportSchema,
  insertCitySchema,
  insertCoordinationStatusSchema,
  type Offer,
  type TransportRequest,
  clientTransporterContacts,
  transportRequests
} from "@shared/schema";
import { desc, eq } from "drizzle-orm";
import { sendNewOfferSMS, sendOfferAcceptedSMS, sendTransporterActivatedSMS, sendBulkSMS, sendManualAssignmentSMS, sendTransporterAssignedSMS } from "./infobip-sms";
import { emailService } from "./email-service";
import { migrateProductionData } from "./migrate-production-endpoint";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // DEBUG ENDPOINT - Check database connection (PUBLIC - À SUPPRIMER APRÈS DEBUG)
  app.get("/api/debug/db-info", async (req, res) => {
    try {
      const isDeployment = process.env.REPLIT_DEPLOYMENT === '1';
      const nodeEnv = process.env.NODE_ENV;
      const pgHost = process.env.PGHOST;
      const pgDatabase = process.env.PGDATABASE;
      
      // Test database connection by counting users
      const result = await db.select().from(clientTransporterContacts).limit(1);
      
      res.json({
        environment: {
          REPLIT_DEPLOYMENT: process.env.REPLIT_DEPLOYMENT,
          NODE_ENV: nodeEnv,
          isProduction: isDeployment || nodeEnv === 'production'
        },
        database: {
          host: pgHost ? `${pgHost.substring(0, 10)}...` : 'Not set',
          database: pgDatabase || 'Not set',
          connectionWorks: true
        },
        message: 'Database connection OK'
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Database connection failed',
        message: error.message,
        environment: {
          REPLIT_DEPLOYMENT: process.env.REPLIT_DEPLOYMENT,
          NODE_ENV: process.env.NODE_ENV
        }
      });
    }
  });
  
  // ENDPOINT TEMPORAIRE - Migration production (À SUPPRIMER APRÈS UTILISATION)
  app.post("/api/admin/migrate-production", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      console.log('🔧 [MIGRATION] Démarrage migration production par admin:', req.user?.id);
      const result = await migrateProductionData();
      res.json(result);
    } catch (error: any) {
      console.error('❌ [MIGRATION] Erreur:', error);
      res.status(500).json({ error: error.message });
    }
  });
  // PWA - Get VAPID public key for push notifications
  app.get("/api/pwa/vapid-public-key", (req, res) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    
    if (!publicKey) {
      console.error('❌ VAPID_PUBLIC_KEY not configured');
      return res.status(500).json({ error: "Push notifications not configured" });
    }
    
    res.json({ publicKey });
  });

  // PWA - Test endpoint to send a test push notification (ADMIN ONLY)
  app.post("/api/pwa/test-push", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const currentUser = req.user!;
      const { userId } = req.body || { userId: currentUser.id };
      
      if (!userId) {
        return res.status(400).json({ error: "userId requis" });
      }

      const { sendNotificationToUser } = await import('./push-notifications');
      
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
        : 'https://camionback.com';
      
      const testNotification = {
        title: 'Test Notification CamionBack',
        body: 'Ceci est une notification de test. Si vous la voyez, les push notifications fonctionnent !',
        url: '/',
        icon: `${baseUrl}/apple-touch-icon.png`,
        badge: `${baseUrl}/icons/notification-badge.png`
      };

      const result = await sendNotificationToUser(userId, testNotification, storage);

      if (result) {
        res.json({ 
          success: true, 
          message: 'Notification de test envoyée. Vérifiez votre appareil !' 
        });
      } else {
        res.json({ 
          success: false, 
          message: 'Échec de l\'envoi. Vérifiez les logs serveur pour plus de détails.' 
        });
      }
    } catch (error) {
      console.error('Erreur lors du test push:', error);
      res.status(500).json({ error: "Erreur lors du test" });
    }
  });

  // PWA - Test endpoint (GET) for easy browser testing (ADMIN ONLY)
  app.get("/api/pwa/test-push-notification", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const currentUser = req.user!;
      const userId = (req.query.userId as string) || currentUser.id;
      
      if (!userId) {
        return res.status(400).json({ error: "userId requis dans l'URL: ?userId=XXX" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.json({ success: false, error: 'Utilisateur introuvable' });
      }
      
      if (!user.deviceToken) {
        return res.json({ success: false, error: 'Pas de device token' });
      }
      
      const { sendPushNotification } = await import('./push-notifications');
      
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
        : 'https://camionback.com';
      
      const testNotification = {
        title: 'Test CamionBack',
        body: 'Si vous voyez ceci, les push notifications fonctionnent !',
        url: '/',
        icon: `${baseUrl}/apple-touch-icon.png`,
        badge: `${baseUrl}/icons/notification-badge.png`
      };
      
      const result = await sendPushNotification({
        deviceToken: user.deviceToken,
        notification: testNotification
      });
      
      if (result) {
        res.json({ 
          success: true, 
          message: 'Notification envoyée ! Vérifiez votre appareil.'
        });
      } else {
        res.json({ success: false, error: 'Échec envoi Web Push' });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Public routes - No authentication required
  
  // Get public request details via share token
  app.get("/api/public/request/:shareToken", async (req, res) => {
    try {
      const { shareToken } = req.params;
      
      if (!shareToken) {
        return res.status(400).json({ error: "Token de partage requis" });
      }

      // Find request by share token
      const request = await storage.getRequestByShareToken(shareToken);
      
      if (!request) {
        return res.status(404).json({ error: "Commande introuvable" });
      }

      // Get client info (sanitized)
      const client = await storage.getUser(request.clientId);
      if (!client) {
        return res.status(404).json({ error: "Client introuvable" });
      }

      // Get all offers for this request
      const allOffers = await storage.getOffersByRequest(request.id);
      
      // Get transporter info for accepted offer if any
      let acceptedOffer = null;
      let acceptedTransporter = null;
      
      if (request.acceptedOfferId) {
        acceptedOffer = allOffers.find(o => o.id === request.acceptedOfferId);
        if (acceptedOffer) {
          const transporter = await storage.getUser(acceptedOffer.transporterId);
          if (transporter) {
            acceptedTransporter = {
              id: transporter.id,
              name: transporter.name,
              rating: transporter.rating,
              totalTrips: transporter.totalTrips,
            };
          }
        }
      }

      // Build public response (exclude sensitive data)
      const publicRequest = {
        id: request.id,
        referenceId: request.referenceId,
        fromCity: request.fromCity,
        toCity: request.toCity,
        description: request.description,
        goodsType: request.goodsType,
        dateTime: request.dateTime,
        dateFlexible: request.dateFlexible,
        invoiceRequired: request.invoiceRequired,
        budget: request.budget,
        photos: request.photos, // Include photos for viewing
        status: request.status,
        viewCount: request.viewCount,
        createdAt: request.createdAt,
        client: {
          clientId: client.clientId,
          name: client.name,
          city: client.city,
        },
        acceptedOffer: acceptedOffer ? {
          id: acceptedOffer.id,
          amount: acceptedOffer.amount,
          pickupDate: acceptedOffer.pickupDate,
          loadType: acceptedOffer.loadType,
          transporter: acceptedTransporter,
        } : null,
        offersCount: allOffers.length,
      };

      res.json(publicRequest);
    } catch (error) {
      console.error("❌ [GET /api/public/request/:shareToken] ERROR:", error);
      res.status(500).json({ error: "Erreur lors de la récupération de la commande" });
    }
  });

  // Auth routes - New PIN-based system
  
  // Check if phone number exists
  app.post("/api/auth/check-phone", async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ error: "Numéro de téléphone requis" });
      }

      const user = await storage.getUserByPhone(phoneNumber);
      res.json({ exists: !!user, hasRole: user?.role ? true : false });
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la vérification" });
    }
  });

  // Register new user with PIN
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { phoneNumber, pin } = req.body;
      
      if (!phoneNumber || !pin) {
        return res.status(400).json({ error: "Numéro et code PIN requis" });
      }

      // Validate PIN format (6 digits)
      if (!/^\d{6}$/.test(pin)) {
        return res.status(400).json({ error: "Le code PIN doit contenir 6 chiffres" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByPhone(phoneNumber);
      if (existingUser) {
        return res.status(400).json({ error: "Ce numéro est déjà enregistré" });
      }

      // Hash the PIN
      const passwordHash = await bcrypt.hash(pin, 10);

      // Create user without role (will be selected after)
      // Special case: if phone contains "000000", make it admin
      const isAdminUser = phoneNumber.includes("000000");
      const user = await storage.createUser({
        phoneNumber,
        passwordHash,
        role: isAdminUser ? "admin" : null, // Will be updated when role is selected
        name: null,
        city: null,
        truckPhotos: null,
        rating: null,
        totalTrips: null,
        status: null,
        isActive: true,
      });

      // Créer session sécurisée (userId stocké côté serveur uniquement)
      req.session.userId = user.id;
      req.session.role = user.role || undefined;
      req.session.phoneNumber = user.phoneNumber || undefined;

      // Force session save before responding
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Échec de l'inscription" });
        }
        
        // Sanitize user data before sending (remove passwordHash)
        res.json({ user: sanitizeUser(user, 'owner') });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Échec de l'inscription" });
    }
  });

  // Login with phone + PIN
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { phoneNumber, pin } = req.body;
      
      if (!phoneNumber || !pin) {
        return res.status(400).json({ error: "Numéro et code PIN requis" });
      }

      const user = await storage.getUserByPhone(phoneNumber);
      if (!user) {
        return res.status(400).json({ error: "Numéro ou code PIN incorrect" });
      }

      // Verify PIN
      const isValidPin = await bcrypt.compare(pin, user.passwordHash);
      if (!isValidPin) {
        return res.status(400).json({ error: "Numéro ou code PIN incorrect" });
      }

      // Check if account is blocked
      if (user.accountStatus === "blocked") {
        return res.status(403).json({ 
          error: "Compte bloqué",
          message: "Votre compte est temporairement désactivé. Merci de contacter le support CamionBack."
        });
      }

      // Créer session sécurisée (userId stocké côté serveur uniquement)
      req.session.userId = user.id;
      req.session.role = user.role || undefined;
      req.session.phoneNumber = user.phoneNumber || undefined;

      // Force session save before responding
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Échec de la connexion" });
        }
        
        // Sanitize user data before sending (remove passwordHash)
        // Note: userId n'est PAS envoyé au client - uniquement dans session cookie
        res.json({ user: sanitizeUser(user, 'owner') });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Échec de la connexion" });
    }
  });

  // Logout - Destroy session
  app.post("/api/auth/logout", async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error("Logout error:", err);
          return res.status(500).json({ error: "Échec de la déconnexion" });
        }
        res.json({ success: true, message: "Déconnexion réussie" });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Échec de la déconnexion" });
    }
  });

  // Get current user data from session (NEW SECURE ENDPOINT)
  // This endpoint uses session cookie - no userId parameter needed
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = req.user!; // requireAuth ensures user exists
      
      // Sanitize and return user data (remove passwordHash)
      return sendUser(res, user, 'owner');
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des données" });
    }
  });

  // LEGACY endpoint - PROTECTED for backwards compatibility during migration
  // Requires authentication and ownership verification
  // TODO: Remove after frontend migration to session-based auth
  app.get("/api/auth/me/:userId", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUser = req.user!;
      
      if (!userId) {
        return res.status(400).json({ error: "ID utilisateur requis" });
      }

      // SECURITY: Only allow users to access their own data
      // Admins can access any user's data
      const isAdmin = currentUser.role === 'admin';
      const isOwner = currentUser.id === userId;
      
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ 
          error: "Accès refusé",
          message: "Vous ne pouvez accéder qu'à vos propres données"
        });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      // Sanitize with appropriate context (admin gets full data, owner gets own data)
      const context = isAdmin ? 'admin' : 'owner';
      res.json({ user: sanitizeUser(user, context) });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des données" });
    }
  });

  // Select role after registration
  app.post("/api/auth/select-role", async (req, res) => {
    try {
      const { role } = req.body;
      
      console.log("🔍 [SELECT-ROLE] Request body:", { role });
      console.log("🔍 [SELECT-ROLE] Session userId:", req.session.userId);
      
      // Get userId from session instead of request body
      const userId = req.session.userId;
      
      if (!userId) {
        console.log("❌ [SELECT-ROLE] Non authentifié - pas de userId dans session");
        return res.status(401).json({ error: "Non authentifié" });
      }
      
      if (!role) {
        console.log("❌ [SELECT-ROLE] Rôle requis - role manquant");
        return res.status(400).json({ error: "Rôle requis" });
      }

      if (role !== "client" && role !== "transporteur") {
        console.log("❌ [SELECT-ROLE] Rôle invalide - role reçu:", role);
        return res.status(400).json({ error: "Rôle invalide" });
      }
      
      console.log("✅ [SELECT-ROLE] Validation OK - userId:", userId, "role:", role);

      // Get existing user to check if clientId already exists
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        console.log("❌ [SELECT-ROLE] Utilisateur non trouvé");
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      // Update user role directly - no conversion needed (database accepts "transporteur" and "client")
      const updates: any = { role };
      
      // If client, generate automatic clientId ONLY if user doesn't have one
      if (role === "client" && !existingUser.clientId) {
        const clientId = await storage.getNextClientId();
        updates.clientId = clientId;
        console.log("📝 [SELECT-ROLE] Generated new clientId:", clientId);
      } else if (role === "client" && existingUser.clientId) {
        console.log("ℹ️ [SELECT-ROLE] User already has clientId:", existingUser.clientId);
      }
      
      // If transporter, set status to pending
      if (role === "transporteur") {
        updates.status = "pending";
      }

      console.log("🔄 [SELECT-ROLE] Updating user with:", updates);
      
      let user;
      try {
        user = await storage.updateUser(userId, updates);
      } catch (updateError: any) {
        console.error("❌ [SELECT-ROLE] Database update error:", updateError);
        return res.status(500).json({ 
          error: "Erreur base de données", 
          details: updateError.message 
        });
      }
      
      if (!user) {
        console.log("❌ [SELECT-ROLE] Utilisateur non trouvé après update");
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      console.log("✅ [SELECT-ROLE] User updated successfully:", { 
        id: user.id, 
        role: user.role,
        status: user.status 
      });

      // Update session with new role
      req.session.role = user.role || undefined;

      // Force session save before responding
      req.session.save((err) => {
        if (err) {
          console.error("❌ [SELECT-ROLE] Session save error:", err);
          return res.status(500).json({ 
            error: "Échec sauvegarde session", 
            details: err.message 
          });
        }
        
        console.log("✅ [SELECT-ROLE] Session saved successfully - sending response");
        // Sanitize user data before sending (remove passwordHash)
        res.json({ user: sanitizeUser(user, 'owner') });
      });
    } catch (error) {
      console.error("❌ [SELECT-ROLE] ERROR:", error);
      res.status(500).json({ error: "Échec de la sélection du rôle" });
    }
  });

  // Complete transporter profile
  app.post("/api/auth/complete-profile", upload.single("truckPhoto"), async (req, res) => {
    try {
      const { name, city } = req.body;
      const truckPhoto = req.file;
      
      // Get userId from session
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Non authentifié" });
      }

      if (!name || !city || !truckPhoto) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
      }

      // Convert truck photo to base64
      const truckPhotoBase64 = `data:${truckPhoto.mimetype};base64,${truckPhoto.buffer.toString('base64')}`;

      // Update user profile
      const user = await storage.updateUser(userId, {
        name,
        city,
        truckPhotos: [truckPhotoBase64],
        status: "pending" // Keep pending until admin validates
      });

      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      // Update session
      req.session.role = user.role || undefined;

      // Sanitize user data before sending (remove passwordHash)
      res.json({ user: sanitizeUser(user, 'owner') });
    } catch (error) {
      console.error("Complete profile error:", error);
      res.status(500).json({ error: "Échec de la complétion du profil" });
    }
  });

  // Diagnostic endpoint - ADMIN ONLY
  app.get("/api/diagnostic/database-stats", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const transporters = allUsers.filter(u => u.role === 'transporteur');
      
      const stats = {
        environment: process.env.NODE_ENV || 'unknown',
        totalUsers: allUsers.length,
        totalTransporters: transporters.length,
        transportersByStatus: {
          pending: transporters.filter(t => t.status === 'pending' || t.status === null).length,
          validated: transporters.filter(t => t.status === 'validated').length,
          rejected: transporters.filter(t => t.status === 'rejected').length,
          other: transporters.filter(t => t.status && !['pending', 'validated', 'rejected'].includes(t.status)).length
        },
        samplePendingTransporters: transporters
          .filter(t => t.status === 'pending' || t.status === null)
          .slice(0, 3)
          .map(t => sanitizeUser(t, 'admin')) // Sanitize transporter data
      };
      
      console.log('📊 [DIAGNOSTIC] Database stats:', stats);
      res.json(stats);
    } catch (error: any) {
      console.error('❌ [DIAGNOSTIC] Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin routes for driver validation
  app.get("/api/admin/pending-drivers", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const drivers = await storage.getPendingDrivers();
      // Sanitize all user data before sending
      const sanitizedDrivers = drivers.map(driver => sanitizeUser(driver, 'admin'));
      res.json(sanitizedDrivers);
    } catch (error: any) {
      console.error("Error fetching pending drivers:", error?.message);
      res.status(500).json({ 
        error: "Échec de récupération des transporteurs"
      });
    }
  });

  // Get truck photos for a specific transporter (lazy loading)
  app.get("/api/admin/transporter-photos/:id", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const photos = await storage.getTransporterPhotos(id);
      
      if (!photos) {
        return res.status(404).json({ error: "Transporteur non trouvé" });
      }
      
      res.json(photos);
    } catch (error: any) {
      console.error("Error fetching transporter photos:", error?.message);
      res.status(500).json({ 
        error: "Échec de récupération des photos"
      });
    }
  });

  app.post("/api/admin/validate-driver/:id", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const { validated, note } = req.body; // validated: boolean, note: optional string

      console.log(`📋 Validation transporteur demandée - ID: ${id}, Validated: ${validated}`);

      if (validated === undefined) {
        return res.status(400).json({ error: "État de validation requis" });
      }

      const updates: any = {
        status: validated ? "validated" : "rejected"
      };

      // If there's a note from admin, we could store it (would need to add a field to schema)
      // For now, we'll just update the status

      const user = await storage.updateUser(id, updates);
      if (!user) {
        console.log(`❌ Transporteur non trouvé - ID: ${id}`);
        return res.status(404).json({ error: "Transporteur non trouvé" });
      }

      console.log(`✅ Transporteur ${validated ? 'validé' : 'refusé'} - Nom: ${user.name}, Tél: ${user.phoneNumber}`);

      // Send push notification if transporter is validated
      if (validated) {
        try {
          if (user.deviceToken) {
            const { sendNotificationToUser, NotificationTemplates } = await import('./push-notifications');
            const notification = NotificationTemplates.accountValidated();
            notification.url = `/transporter-dashboard`;
            
            await sendNotificationToUser(user.id, notification, storage);
            console.log(`📨 Notification push envoyée pour validation de compte`);
          }
        } catch (pushError) {
          console.error('❌ Erreur lors de l\'envoi de la notification push:', pushError);
        }
      }

      // Send SMS notification if transporter is validated
      if (validated && user.phoneNumber) {
        console.log(`📱 Envoi SMS activation à ${user.phoneNumber}`);
        sendTransporterActivatedSMS(user.phoneNumber).catch(err => {
          console.error('Erreur envoi SMS activation transporteur:', err);
        });
      }

      return sendUser(res, user, 'admin');
    } catch (error) {
      console.error("Validate driver error:", error);
      res.status(500).json({ error: "Échec de la validation" });
    }
  });

  // Admin routes for blocking/unblocking users
  app.post("/api/admin/block-user/:id", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.blockUser(id);
      
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      // Create notification for blocked user
      await storage.createNotification({
        userId: id,
        type: "account_blocked",
        title: "Compte bloqué",
        message: "Votre compte CamionBack a été temporairement bloqué. Contactez l'équipe support pour plus d'informations.",
        relatedId: null,
      });

      return sendUser(res, user, 'admin');
    } catch (error) {
      console.error("Block user error:", error);
      res.status(500).json({ error: "Échec du blocage de l'utilisateur" });
    }
  });

  app.post("/api/admin/unblock-user/:id", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.unblockUser(id);
      
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      // Create notification for unblocked user
      await storage.createNotification({
        userId: id,
        type: "account_unblocked",
        title: "Compte débloqué",
        message: "Votre compte CamionBack a été réactivé. Vous pouvez à nouveau utiliser la plateforme normalement.",
        relatedId: null,
      });

      return sendUser(res, user, 'admin');
    } catch (error) {
      console.error("Unblock user error:", error);
      res.status(500).json({ error: "Échec du déblocage de l'utilisateur" });
    }
  });

  // Delete user account permanently (admin)
  app.delete("/api/admin/users/:id", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if user exists before deletion
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      // Delete user and all associated data
      await storage.deleteUser(id);

      res.json({ 
        success: true, 
        message: "Compte supprimé avec succès. L'utilisateur peut désormais se réinscrire librement." 
      });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Échec de la suppression de l'utilisateur" });
    }
  });

  // Update transporter profile (admin)
  app.patch("/api/admin/transporters/:id", requireAuth, requireRole(['admin']), upload.single("truckPhoto"), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, city, phoneNumber, newPassword } = req.body;
      
      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "Transporteur non trouvé" });
      }

      if (user.role !== "transporteur") {
        return res.status(400).json({ error: "L'utilisateur n'est pas un transporteur" });
      }

      // Build update object
      const updates: any = {};
      
      if (name) updates.name = name;
      if (city) updates.city = city;
      if (phoneNumber) updates.phoneNumber = phoneNumber;
      
      // Handle password update
      if (newPassword) {
        // Validate password is 6 digits
        if (!/^\d{6}$/.test(newPassword)) {
          return res.status(400).json({ error: "Le code d'accès doit contenir exactement 6 chiffres" });
        }
        updates.passwordHash = await bcrypt.hash(newPassword, 10);
      }
      
      // Handle truck photo upload
      if (req.file) {
        const photoBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
        updates.truckPhotos = [photoBase64];
      }

      // Update user
      const updatedUser = await storage.updateUser(id, updates);
      
      if (!updatedUser) {
        return res.status(500).json({ error: "Échec de la mise à jour" });
      }

      console.log(`✅ Transporteur mis à jour - ID: ${id}, Nom: ${updatedUser.name}`);
      // Sanitize user data before sending (remove passwordHash)
      return sendUser(res, updatedUser, 'admin');
    } catch (error) {
      console.error("Update transporter error:", error);
      res.status(500).json({ error: "Échec de la mise à jour du transporteur" });
    }
  });

  // Report/Signalement routes
  app.post("/api/reports", async (req, res) => {
    try {
      const reportData = insertReportSchema.parse(req.body);
      const report = await storage.createReport(reportData);
      
      // Create notification for admin about new report
      const allUsers = await storage.getAllUsers();
      const adminUser = allUsers.find(u => u.role === "admin");
      
      if (adminUser) {
        await storage.createNotification({
          userId: adminUser.id,
          type: "new_report",
          title: "Nouveau signalement",
          message: `Un nouveau signalement a été créé concernant la commande ${reportData.requestId}.`,
          relatedId: report.id,
        });
      }

      // Send email notification to admin about new report (non-blocking)
      Promise.all([
        storage.getTransportRequest(report.requestId),
        storage.getUser(report.reporterId),
        storage.getUser(report.reportedUserId)
      ]).then(([request, reporter, reported]) => {
        if (request && reporter && reported) {
          emailService.sendNewReportEmail(report, request, reporter, reported).catch(emailError => {
            console.error("Failed to send report email:", emailError);
          });
        }
      }).catch(err => {
        console.error("Failed to get data for report email:", err);
      });

      res.json(report);
    } catch (error) {
      console.error("Create report error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Échec de la création du signalement" });
    }
  });

  app.get("/api/reports", async (req, res) => {
    try {
      const reports = await storage.getAllReports();
      res.json(reports);
    } catch (error) {
      console.error("Get reports error:", error);
      res.status(500).json({ error: "Échec de la récupération des signalements" });
    }
  });

  app.patch("/api/reports/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const report = await storage.updateReport(id, updates);
      
      if (!report) {
        return res.status(404).json({ error: "Signalement non trouvé" });
      }

      // If status changed to resolved, notify the reporter
      if (updates.status === "resolved" && report.reporterId) {
        await storage.createNotification({
          userId: report.reporterId,
          type: "report_resolved",
          title: "Signalement résolu",
          message: `Votre signalement concernant la commande ${report.requestId} a été résolu.`,
          relatedId: report.id,
        });
      }

      res.json(report);
    } catch (error) {
      console.error("Update report error:", error);
      res.status(500).json({ error: "Échec de la mise à jour du signalement" });
    }
  });

  // User routes
  // 🔒 SÉCURISÉ: Admin seul peut lister tous les users
  app.get("/api/users", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // ✅ Sanitize tous les users (supprime passwordHash)
      const sanitizedUsers = users.map(u => sanitizeUser(u, 'admin'));
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // 🔒 SÉCURISÉ: User peut voir ses données OU admin peut voir n'importe quel user
  app.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.user!;
      
      // ✅ Vérification ownership: seul le user lui-même ou un admin peut accéder
      const isOwner = currentUser.id === id;
      const isUserAdmin = isAdmin(currentUser);
      
      if (!isOwner && !isUserAdmin) {
        return res.status(403).json({ 
          error: "Accès refusé",
          message: "Vous ne pouvez accéder qu'à vos propres données" 
        });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // ✅ Sanitize selon le contexte (admin voit tout, owner voit ses données)
      return sendUser(res, user, isUserAdmin ? 'admin' : 'owner');
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // 🔒 SÉCURISÉ: Seul admin peut créer des users via cet endpoint
  app.post("/api/users", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      // ✅ Sanitize avant envoi (admin context)
      return sendUser(res, user, 'admin');
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // 🔒 SÉCURISÉ: User peut modifier ses données OU admin peut modifier n'importe quel user
  app.patch("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.user!;
      
      // ✅ Vérification ownership: seul le user lui-même ou un admin peut modifier
      const isOwner = currentUser.id === id;
      const isUserAdmin = isAdmin(currentUser);
      
      if (!isOwner && !isUserAdmin) {
        return res.status(403).json({ 
          error: "Accès refusé",
          message: "Vous ne pouvez modifier que vos propres données" 
        });
      }
      
      const user = await storage.updateUser(id, req.body);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // ✅ Sanitize selon le contexte
      return sendUser(res, user, isUserAdmin ? 'admin' : 'owner');
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Update transporter profile (with truck photo)
  // 🔒 SÉCURISÉ: User peut modifier son profil OU admin peut modifier n'importe quel profil
  app.patch("/api/users/:id/profile", requireAuth, upload.single("truckPhoto"), async (req, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.user!;
      const { phoneNumber, name } = req.body;
      const truckPhoto = req.file;

      // ✅ Vérification ownership: seul le user lui-même ou un admin peut modifier
      const isOwner = currentUser.id === id;
      const isUserAdmin = isAdmin(currentUser);
      
      if (!isOwner && !isUserAdmin) {
        return res.status(403).json({ 
          error: "Accès refusé",
          message: "Vous ne pouvez modifier que votre propre profil" 
        });
      }

      // Validate required fields
      if (!phoneNumber || !name) {
        return res.status(400).json({ error: "Nom et téléphone requis" });
      }

      // Validate phone number format (Moroccan)
      const phoneRegex = /^\+212[5-7]\d{8}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({ error: "Format de numéro invalide" });
      }

      // Validate truck photo MIME type if provided
      if (truckPhoto) {
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedMimeTypes.includes(truckPhoto.mimetype)) {
          return res.status(400).json({ 
            error: "Format de photo invalide. Formats acceptés: JPG, PNG, WEBP" 
          });
        }

        // Validate file size (5MB limit)
        if (truckPhoto.size > 5 * 1024 * 1024) {
          return res.status(400).json({ 
            error: "Photo trop volumineuse. Maximum 5 MB" 
          });
        }
      }

      const updateData: any = {
        phoneNumber: phoneNumber.trim(),
        name: name.trim(),
      };

      // If truck photo is provided, convert to base64 and update
      if (truckPhoto) {
        const truckPhotoBase64 = `data:${truckPhoto.mimetype};base64,${truckPhoto.buffer.toString('base64')}`;
        updateData.truckPhotos = [truckPhotoBase64];
      }

      const user = await storage.updateUser(id, updateData);
      
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      // ✅ Sanitize avant envoi (owner context car c'est un profil personnel)
      return sendUser(res, user, 'owner');
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Échec de la mise à jour du profil" });
    }
  });

  // Update user PIN
  // 🔒 SÉCURISÉ: Seul le user lui-même peut changer son PIN
  app.patch("/api/users/:id/pin", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.user!;
      const { pin } = req.body;

      // ✅ Vérification ownership stricte: UNIQUEMENT le user lui-même (pas même admin)
      if (currentUser.id !== id) {
        return res.status(403).json({ 
          error: "Accès refusé",
          message: "Vous ne pouvez modifier que votre propre code PIN" 
        });
      }

      if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
        return res.status(400).json({ error: "Le PIN doit contenir exactement 6 chiffres" });
      }

      // Hash the new PIN
      const hashedPin = await bcrypt.hash(pin, 10);

      const user = await storage.updateUser(id, {
        passwordHash: hashedPin,
      });

      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      // ✅ Retourne uniquement success (pas de données sensibles)
      res.json({ success: true });
    } catch (error) {
      console.error("Update PIN error:", error);
      res.status(500).json({ error: "Échec de la mise à jour du PIN" });
    }
  });

  // Update user device token for push notifications
  // 🔒 SÉCURISÉ: Seul le user lui-même peut mettre à jour son device token
  app.patch("/api/users/:id/device-token", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.user!;
      const { deviceToken } = req.body;

      // ✅ Vérification ownership: seul le user lui-même peut modifier son token
      if (currentUser.id !== id) {
        return res.status(403).json({ 
          error: "Accès refusé",
          message: "Vous ne pouvez modifier que votre propre device token" 
        });
      }

      if (!deviceToken) {
        return res.status(400).json({ error: "Device token requis" });
      }

      // Parse device token to validate it's a proper PushSubscription
      try {
        const subscription = JSON.parse(deviceToken);
        if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
          return res.status(400).json({ error: "Device token invalide" });
        }
      } catch (e) {
        return res.status(400).json({ error: "Device token invalide" });
      }

      const user = await storage.updateUser(id, {
        deviceToken: deviceToken,
      });

      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      console.log(`✅ Device token enregistré pour ${user.name || user.phoneNumber}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Erreur device token:", error);
      res.status(500).json({ error: "Échec de l'enregistrement du device token" });
    }
  });

  // Transport request routes
  app.post("/api/requests", async (req, res) => {
    try {
      console.log("Request body received:", JSON.stringify(req.body, null, 2));
      const requestData = insertTransportRequestSchema.parse(req.body);
      const request = await storage.createTransportRequest(requestData);
      
      // Send email notification to admin (non-blocking)
      storage.getUser(request.clientId).then(client => {
        if (client) {
          emailService.sendNewRequestEmail(request, client).catch(emailError => {
            console.error("Failed to send request email:", emailError);
          });
        }
      }).catch(err => {
        console.error("Failed to get client for email:", err);
      });
      
      console.log("New request created:", request.referenceId);
      
      res.json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("Validation error:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ error: error.errors });
      }
      console.log("Server error:", error);
      res.status(500).json({ error: "Failed to create request" });
    }
  });

  // Helper pour parser JSON de manière sécurisée (évite les plantages sur "null", "undefined", etc.)
  function safeParse(value: any, fallback: any = null): any {
    if (!value || value === 'null' || value === 'undefined' || value === '') {
      return fallback;
    }
    if (typeof value !== 'string') {
      return value; // Déjà un objet/array
    }
    try {
      return JSON.parse(value);
    } catch {
      console.warn(`⚠️ Failed to parse JSON value: ${value?.substring(0, 50)}...`);
      return fallback;
    }
  }

  // Endpoint de diagnostic simple pour tester en production
  app.get("/api/requests/diagnostic", async (req, res) => {
    try {
      const requests = await storage.getAllTransportRequests();
      const offers = await storage.getAllOffers();
      res.json({
        success: true,
        optimizationDeployed: true,
        requestsCount: requests.length,
        offersCount: offers.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Endpoint de diagnostic avancé pour identifier quelle ligne cause des problèmes
  app.get("/api/requests/debug-normalize", async (req, res) => {
    try {
      const rawRequests = await storage.getAllTransportRequests();
      
      const problems: any[] = [];
      const normalized: any[] = [];
      
      rawRequests.forEach((req, index) => {
        try {
          // Tester la normalisation de chaque ligne
          const normalizedReq = {
            ...req,
            photos: safeParse(req.photos, []),
            declinedBy: safeParse(req.declinedBy, []),
            paymentReceipt: (req.paymentReceipt === 'null' || req.paymentReceipt === 'undefined' || req.paymentReceipt === '') ? null : req.paymentReceipt,
            coordinationReason: (req.coordinationReason === 'null' || req.coordinationReason === 'undefined' || req.coordinationReason === '') ? null : req.coordinationReason,
          };
          
          // Tester aussi la sérialisation JSON
          JSON.stringify(normalizedReq);
          
          normalized.push({
            id: req.id,
            referenceId: req.referenceId,
            status: 'OK'
          });
        } catch (error) {
          problems.push({
            id: req.id,
            referenceId: req.referenceId,
            index,
            error: error instanceof Error ? error.message : String(error),
            photos: typeof req.photos,
            declinedBy: typeof req.declinedBy,
            photosValue: String(req.photos).substring(0, 100),
            declinedByValue: String(req.declinedBy).substring(0, 100)
          });
        }
      });
      
      res.json({
        success: true,
        totalRequests: rawRequests.length,
        normalizedSuccessfully: normalized.length,
        problemsCount: problems.length,
        problems: problems.slice(0, 10), // Premier 10 problèmes
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  });

  // Diagnostic COMPLET incluant l'enrichissement
  app.get("/api/requests/debug-full", async (req, res) => {
    const log: any[] = [];
    try {
      
      log.push({ step: 1, action: "Fetching requests", time: new Date().toISOString() });
      const rawRequests = await storage.getAllTransportRequests();
      log.push({ step: 2, action: "Requests fetched", count: rawRequests.length });
      
      log.push({ step: 3, action: "Normalizing requests" });
      const requests = rawRequests.map((req, index) => {
        try {
          return {
            ...req,
            photos: safeParse(req.photos, []),
            declinedBy: safeParse(req.declinedBy, []),
            paymentReceipt: (req.paymentReceipt === 'null' || req.paymentReceipt === 'undefined' || req.paymentReceipt === '') ? null : req.paymentReceipt,
            coordinationReason: (req.coordinationReason === 'null' || req.coordinationReason === 'undefined' || req.coordinationReason === '') ? null : req.coordinationReason,
          };
        } catch (error) {
          log.push({ step: 4, action: "Normalization error", index, error: String(error) });
          return {
            ...req,
            photos: [],
            declinedBy: [],
            paymentReceipt: null,
            coordinationReason: null,
          };
        }
      });
      log.push({ step: 5, action: "Requests normalized", count: requests.length });
      
      log.push({ step: 6, action: "Fetching offers" });
      const allOffers = await storage.getAllOffers();
      log.push({ step: 7, action: "Offers fetched", count: allOffers.length });
      
      log.push({ step: 8, action: "Grouping offers by requestId" });
      const offersByRequestId = allOffers.reduce((acc: Record<string, any[]>, offer) => {
        if (!acc[offer.requestId]) {
          acc[offer.requestId] = [];
        }
        acc[offer.requestId].push(offer);
        return acc;
      }, {});
      log.push({ step: 9, action: "Offers grouped", keysCount: Object.keys(offersByRequestId).length });
      
      log.push({ step: 10, action: "Starting enrichment" });
      const enrichedRequests = requests.map((request, index) => {
        try {
          const offers = offersByRequestId[request.id] || [];
          
          let enrichedRequest: any = {
            ...request,
            offersCount: offers.length,
          };
          
          if (request.acceptedOfferId) {
            const acceptedOffer = offers.find(o => o.id === request.acceptedOfferId);
            if (acceptedOffer) {
              enrichedRequest.pickupDate = acceptedOffer.pickupDate;
              enrichedRequest.offerAmount = acceptedOffer.amount;
              enrichedRequest.loadType = acceptedOffer.loadType;
            }
          }
          
          return enrichedRequest;
        } catch (error) {
          log.push({ step: 11, action: "Enrichment error", index, requestId: request.id, error: String(error) });
          return { ...request, offersCount: 0 };
        }
      });
      log.push({ step: 12, action: "Enrichment completed", count: enrichedRequests.length });
      
      log.push({ step: 13, action: "Testing JSON serialization" });
      const jsonString = JSON.stringify(enrichedRequests);
      log.push({ step: 14, action: "JSON serialization OK", size: jsonString.length });
      
      res.json({
        success: true,
        log,
        summary: {
          requestsCount: rawRequests.length,
          offersCount: allOffers.length,
          enrichedCount: enrichedRequests.length,
          jsonSize: jsonString.length
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        log
      });
    }
  });

  app.get("/api/requests", async (req, res) => {
    try {
      console.log("🔍 [GET /api/requests] Starting request fetch...");
      const { clientId, status, transporterId, accepted, payments } = req.query;
      
      let rawRequests;
      if (clientId) {
        console.log("📋 Fetching requests for client:", clientId);
        rawRequests = await storage.getRequestsByClient(clientId as string);
      } else if (payments === "true" && transporterId) {
        console.log("💰 Fetching payment requests for transporter:", transporterId);
        rawRequests = await storage.getPaymentsByTransporter(transporterId as string);
      } else if (accepted === "true" && transporterId) {
        console.log("✅ Fetching accepted requests for transporter:", transporterId);
        rawRequests = await storage.getAcceptedRequestsByTransporter(transporterId as string);
      } else if (status === "open") {
        console.log("🟡 Fetching open requests");
        rawRequests = await storage.getOpenRequests(transporterId as string | undefined);
      } else {
        console.log("📦 Fetching ALL transport requests");
        rawRequests = await storage.getAllTransportRequests();
      }
      
      console.log(`✅ Retrieved ${rawRequests.length} requests`);
      
      // ÉTAPE CRITIQUE: Normaliser TOUTES les colonnes JSON/array IMMÉDIATEMENT
      // AVANT tout traitement pour éviter les plantages sur données legacy corrompues
      console.log("🛡️ Normalizing JSON/array columns for legacy data compatibility...");
      const requests = rawRequests.map((req, index) => {
        try {
          return {
            ...req,
            // Arrays - convertir les strings "null"/"undefined"/"" en arrays vides
            photos: safeParse(req.photos, []),
            declinedBy: safeParse(req.declinedBy, []),
            // Textes simples - nettoyer les "null"/"undefined" strings
            paymentReceipt: (req.paymentReceipt === 'null' || req.paymentReceipt === 'undefined' || req.paymentReceipt === '') ? null : req.paymentReceipt,
            coordinationReason: (req.coordinationReason === 'null' || req.coordinationReason === 'undefined' || req.coordinationReason === '') ? null : req.coordinationReason,
          };
        } catch (error) {
          console.error(`⚠️ Failed to normalize request ${req.id} (index ${index}):`, error);
          // Retourner une version minimale sûre pour ne pas faire échouer toute la requête
          return {
            ...req,
            photos: [],
            declinedBy: [],
            paymentReceipt: null,
            coordinationReason: null,
          };
        }
      });
      
      console.log(`✅ Normalized ${requests.length} requests, starting optimized enrichment...`);
      
      // OPTIMISATION: Récupérer TOUTES les offres en une seule requête au lieu de N requêtes
      const allOffers = await storage.getAllOffers();
      console.log(`📊 Retrieved ${allOffers.length} total offers`);
      
      // Grouper les offres par requestId pour un accès O(1)
      const offersByRequestId = allOffers.reduce((acc: Record<string, any[]>, offer) => {
        if (!acc[offer.requestId]) {
          acc[offer.requestId] = [];
        }
        acc[offer.requestId].push(offer);
        return acc;
      }, {});
      
      console.log(`📋 Grouped offers by requestId, starting enrichment...`);
      
      // Get all unique transporter IDs from assigned transporters
      const assignedTransporterIds = [...new Set(
        requests
          .filter(r => r.assignedTransporterId)
          .map(r => r.assignedTransporterId)
      )];
      
      // Fetch transporter info for assigned transporters
      const assignedTransporters: Record<string, any> = {};
      if (assignedTransporterIds.length > 0) {
        const transporterPromises = assignedTransporterIds.map(async (id) => {
          const transporter = await storage.getUser(id!);
          return { id, transporter };
        });
        const transporterResults = await Promise.all(transporterPromises);
        transporterResults.forEach(({ id, transporter }) => {
          if (transporter && id) {
            assignedTransporters[id] = {
              id: transporter.id,
              name: transporter.name,
              phoneNumber: transporter.phoneNumber,
            };
          }
        });
      }
      
      // Enrichir les demandes SANS requêtes supplémentaires (synchrone, pas de Promise.all)
      const enrichedRequests = requests.map((request) => {
        const offers = offersByRequestId[request.id] || [];
        
        // Exclure les photos en base64 de la liste pour éviter une réponse de 34MB+
        // Les photos seront chargées uniquement lors de la consultation d'une demande spécifique
        const { photos, paymentReceipt, ...requestWithoutPhotos } = request;
        
        let enrichedRequest: any = {
          ...requestWithoutPhotos,
          offersCount: offers.length,
          // Indiquer seulement le NOMBRE de photos, pas leur contenu
          photosCount: Array.isArray(photos) ? photos.length : 0,
        };
        
        // For accepted requests, add the pickup date from the accepted offer
        if (request.acceptedOfferId) {
          const acceptedOffer = offers.find(o => o.id === request.acceptedOfferId);
          
          // Verify the offer belongs to the current transporter (if transporterId is provided)
          if (acceptedOffer && (!transporterId || acceptedOffer.transporterId === transporterId)) {
            enrichedRequest.pickupDate = acceptedOffer.pickupDate;
            enrichedRequest.offerAmount = acceptedOffer.amount;
            enrichedRequest.loadType = acceptedOffer.loadType;
          }
        }
        
        // For manually assigned transporters, add basic transporter info
        if (request.assignedTransporterId && assignedTransporters[request.assignedTransporterId]) {
          enrichedRequest.transporter = assignedTransporters[request.assignedTransporterId];
        }
        
        return enrichedRequest;
      });
      
      console.log(`✅ Successfully enriched ${enrichedRequests.length} requests in optimized mode`);
      res.json(enrichedRequests);
    } catch (error) {
      console.error("❌ [GET /api/requests] ERROR:", error);
      console.error("Error details:", error instanceof Error ? error.message : String(error));
      console.error("Stack trace:", error instanceof Error ? error.stack : "N/A");
      res.status(500).json({ error: "Failed to fetch requests" });
    }
  });

  app.get("/api/requests/:id", async (req, res) => {
    try {
      const request = await storage.getTransportRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch request" });
    }
  });

  app.patch("/api/requests/:id", async (req, res) => {
    try {
      console.log("[PATCH /api/requests/:id] Request body:", JSON.stringify(req.body, null, 2));
      
      // Convert dateTime string to Date object if present
      const updates = { ...req.body };
      if (updates.dateTime && typeof updates.dateTime === 'string') {
        updates.dateTime = new Date(updates.dateTime);
      }
      
      const request = await storage.updateTransportRequest(req.params.id, updates);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("[PATCH /api/requests/:id] Error:", error);
      res.status(500).json({ error: "Failed to update request", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Admin toggle hide/show request from transporters
  app.patch("/api/requests/:id/toggle-hide", async (req, res) => {
    try {
      const { isHidden } = req.body;
      const request = await storage.updateTransportRequest(req.params.id, { isHidden });
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle request visibility" });
    }
  });

  app.delete("/api/requests/:id", requireAuth, requireRole(['admin', 'coordinateur', 'client']), async (req, res) => {
    try {
      const success = await storage.deleteTransportRequest(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Request not found" });
      }
      res.json({ success: true, message: "Request deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete request" });
    }
  });

  // Get accepted transporter info for a request (handles both accepted offers and manual assignments)
  app.get("/api/requests/:id/accepted-transporter", async (req, res) => {
    try {
      const request = await storage.getTransportRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      // Case 1: Manual assignment by coordinator
      if (request.assignedTransporterId) {
        const transporter = await storage.getUser(request.assignedTransporterId);
        if (!transporter) {
          return res.status(404).json({ error: "Assigned transporter not found" });
        }

        res.json({
          transporterName: transporter.name,
          transporterPhone: transporter.phoneNumber,
          transporterCity: transporter.city,
          totalAmount: request.clientTotal || 0,
          transporterAmount: request.transporterAmount,
          platformFee: request.platformFee,
          acceptedAt: request.assignedAt,
          assignedManually: true,
        });
        return;
      }

      // Case 2: Accepted offer (traditional flow)
      if (!request.acceptedOfferId) {
        return res.status(400).json({ error: "No accepted offer or assigned transporter for this request" });
      }

      const offer = await storage.getOffer(request.acceptedOfferId);
      if (!offer) {
        return res.status(404).json({ error: "Accepted offer not found" });
      }

      const transporter = await storage.getUser(offer.transporterId);
      if (!transporter) {
        return res.status(404).json({ error: "Transporter not found" });
      }

      // Get commission from settings (invisible markup)
      const settings = await storage.getAdminSettings();
      const commissionRate = parseFloat(settings?.commissionPercentage || "10");
      const offerAmount = parseFloat(offer.amount);
      const totalWithCommission = offerAmount * (1 + commissionRate / 100);

      res.json({
        transporterName: transporter.name,
        transporterPhone: transporter.phoneNumber,
        transporterCity: transporter.city,
        totalAmount: totalWithCommission, // Only show total to client (commission is invisible)
        acceptedAt: offer.createdAt,
        assignedManually: false,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transporter info" });
    }
  });

  // Republish a request (reset to open status, optionally with new date)
  app.post("/api/requests/:id/republish", async (req, res) => {
    try {
      const request = await storage.getTransportRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      // Allow republishing for accepted, completed, or expired (open past-date) requests
      const isExpired = request.status === "open" && new Date(request.dateTime) < new Date();
      const canRepublish = request.status === "accepted" || request.status === "completed" || isExpired;

      if (!canRepublish) {
        return res.status(400).json({ error: "Only accepted, completed, or expired requests can be republished" });
      }

      // Delete all offers associated with this request
      await storage.deleteOffersByRequest(req.params.id);

      // Prepare updates object
      const updates: any = {
        status: "open",
        acceptedOfferId: null,
      };

      // If a new date is provided, update it
      if (req.body.newDate) {
        updates.dateTime = new Date(req.body.newDate);
      }

      // Reset request to open status
      const updatedRequest = await storage.updateTransportRequest(req.params.id, updates);

      res.json({ success: true, request: updatedRequest });
    } catch (error) {
      res.status(500).json({ error: "Failed to republish request" });
    }
  });

  // Mark a request as completed with rating
  app.post("/api/requests/:id/complete", async (req, res) => {
    try {
      const { rating } = req.body;
      const request = await storage.getTransportRequest(req.params.id);
      
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      if (request.status !== "accepted") {
        return res.status(400).json({ error: "Only accepted requests can be marked as completed" });
      }

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Valid rating (1-5) is required" });
      }

      // Get the accepted offer to find the transporter
      if (!request.acceptedOfferId) {
        return res.status(400).json({ error: "No accepted offer found" });
      }

      const offer = await storage.getOffer(request.acceptedOfferId);
      if (!offer) {
        return res.status(404).json({ error: "Accepted offer not found" });
      }

      // Get transporter
      const transporter = await storage.getUser(offer.transporterId);
      if (!transporter) {
        return res.status(404).json({ error: "Transporter not found" });
      }

      // Check if rating already exists for this request
      const existingRating = await storage.getRatingByRequestId(req.params.id);
      if (existingRating) {
        return res.status(400).json({ error: "This request has already been rated" });
      }

      // Create individual rating record
      await storage.createRating({
        requestId: req.params.id,
        transporterId: offer.transporterId,
        clientId: request.clientId,
        score: rating,
        comment: null,
      });

      // Calculate new average rating
      const currentRating = parseFloat(transporter.rating || "0");
      const currentTotalRatings = transporter.totalRatings || 0;
      const newTotalRatings = currentTotalRatings + 1;
      const newAverageRating = ((currentRating * currentTotalRatings) + rating) / newTotalRatings;

      // Update transporter stats
      await storage.updateUser(offer.transporterId, {
        rating: newAverageRating.toFixed(2),
        totalRatings: newTotalRatings,
        totalTrips: (transporter.totalTrips || 0) + 1,
      });

      // Mark request as completed
      const updatedRequest = await storage.updateTransportRequest(req.params.id, {
        status: "completed",
      });

      res.json({ 
        success: true, 
        request: updatedRequest,
        transporter: {
          id: transporter.id,
          newRating: newAverageRating.toFixed(2),
          totalRatings: newTotalRatings,
          totalTrips: (transporter.totalTrips || 0) + 1,
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to complete request" });
    }
  });

  // Mark a request as ready for billing (transporter marks as done)
  // NOTE: In production, this should use session/JWT authentication instead of req.body.transporterId
  app.post("/api/requests/:id/mark-for-billing", async (req, res) => {
    try {
      const request = await storage.getTransportRequest(req.params.id);
      
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      if (request.status !== "accepted") {
        return res.status(400).json({ error: "Only accepted requests can be marked for billing" });
      }

      // Basic authorization check - verify transporterId matches the accepted offer
      // TODO PRODUCTION: Replace with server-side session/JWT verification
      if (request.acceptedOfferId) {
        const acceptedOffer = await storage.getOffer(request.acceptedOfferId);
        const transporterId = req.body.transporterId;
        
        if (!acceptedOffer || !transporterId || acceptedOffer.transporterId !== transporterId) {
          return res.status(403).json({ error: "Unauthorized: only the assigned transporter can mark this request for billing" });
        }
      }

      // Update payment status to awaiting_payment
      const updatedRequest = await storage.updateTransportRequest(req.params.id, {
        paymentStatus: "awaiting_payment",
      });

      // Update contract status to marked_paid_transporter
      try {
        const contract = await storage.getContractByRequestId(req.params.id);
        if (contract) {
          await storage.updateContract(contract.id, {
            status: "marked_paid_transporter",
          });
        }
      } catch (error) {
        console.error("Failed to update contract status:", error);
        // Continue anyway - contract update failure shouldn't block the payment status update
      }

      // Create notification for client
      if (request.acceptedOfferId && request.clientId) {
        const acceptedOffer = await storage.getOffer(request.acceptedOfferId);
        const transporter = acceptedOffer ? await storage.getUser(acceptedOffer.transporterId) : null;
        
        if (transporter) {
          try {
            await storage.createNotification({
              userId: request.clientId,
              type: "payment_request",
              title: "Paiement requis",
              message: `Le transporteur ${transporter.name || "votre transporteur"} a marqué la commande ${request.referenceId} comme prête pour facturation. Veuillez confirmer le paiement.`,
              relatedId: request.id,
            });
          } catch (notifError) {
            console.error("Failed to create payment request notification:", notifError);
            // Continue anyway - notification failure shouldn't block the payment status update
          }
        }
      }

      res.json({ 
        success: true, 
        request: updatedRequest
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark request for billing" });
    }
  });

  // Mark a request as paid (client uploads receipt and awaits admin validation)
  // NOTE: In production, this should use session/JWT authentication instead of req.body.clientId
  app.post("/api/requests/:id/mark-as-paid", async (req, res) => {
    try {
      const request = await storage.getTransportRequest(req.params.id);
      
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      // Basic authorization check - verify clientId matches the request owner
      // TODO PRODUCTION: Replace with server-side session/JWT verification
      const clientId = req.body.clientId;
      if (!clientId || request.clientId !== clientId) {
        return res.status(403).json({ error: "Unauthorized: only the client can mark this request as paid" });
      }

      if (request.paymentStatus !== "awaiting_payment") {
        return res.status(400).json({ error: "Request must be awaiting payment" });
      }

      const paymentReceipt = req.body.paymentReceipt;
      if (!paymentReceipt) {
        return res.status(400).json({ error: "Payment receipt is required" });
      }

      // Update payment status to pending_admin_validation (client uploaded receipt, awaiting admin approval)
      const updatedRequest = await storage.updateTransportRequest(req.params.id, {
        paymentStatus: "pending_admin_validation",
        paymentReceipt,
      });

      // Update contract status to marked_paid_client
      try {
        const contract = await storage.getContractByRequestId(req.params.id);
        if (contract) {
          await storage.updateContract(contract.id, {
            status: "marked_paid_client",
          });
        }
      } catch (error) {
        console.error("Failed to update contract status:", error);
        // Continue anyway - contract update failure shouldn't block the payment status update
      }

      res.json({ 
        success: true, 
        request: updatedRequest
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark request as paid" });
    }
  });

  // Admin validates payment (final step)
  // NOTE: In production, this should use session/JWT authentication to verify admin role
  app.post("/api/requests/:id/admin-validate-payment", async (req, res) => {
    try {
      const request = await storage.getTransportRequest(req.params.id);
      
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      // TODO PRODUCTION: Verify admin role via session/JWT
      // For now, we trust the client-side check

      if (request.paymentStatus !== "pending_admin_validation") {
        return res.status(400).json({ error: "Request must be pending admin validation" });
      }

      // Update payment status to paid and set payment date
      const updatedRequest = await storage.updateTransportRequest(req.params.id, {
        paymentStatus: "paid",
        paymentDate: new Date(),
      });

      // Update contract status to completed
      try {
        const contract = await storage.getContractByRequestId(req.params.id);
        if (contract) {
          await storage.updateContract(contract.id, {
            status: "completed",
          });
        }
      } catch (error) {
        console.error("Failed to update contract status:", error);
        // Continue anyway - contract update failure shouldn't block the payment status update
      }

      // Create notification for transporter
      if (request.acceptedOfferId && request.clientId) {
        const acceptedOffer = await storage.getOffer(request.acceptedOfferId);
        const client = await storage.getUser(request.clientId);
        
        if (acceptedOffer && client) {
          try {
            await storage.createNotification({
              userId: acceptedOffer.transporterId,
              type: "payment_confirmed",
              title: "Paiement validé",
              message: `L'administrateur a validé le paiement pour la commande ${request.referenceId}. Le montant sera versé prochainement.`,
              relatedId: request.id,
            });
          } catch (notifError) {
            console.error("Failed to create payment validated notification:", notifError);
          }
        }
      }

      res.json({ 
        success: true, 
        request: updatedRequest
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to validate payment" });
    }
  });

  // Admin rejects payment receipt
  // NOTE: In production, this should use session/JWT authentication to verify admin role
  app.post("/api/requests/:id/admin-reject-receipt", async (req, res) => {
    try {
      const request = await storage.getTransportRequest(req.params.id);
      
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      // TODO PRODUCTION: Verify admin role via session/JWT
      // For now, we trust the client-side check

      if (request.paymentStatus !== "pending_admin_validation") {
        return res.status(400).json({ error: "Request must be pending admin validation" });
      }

      // Update payment status back to awaiting_payment and clear receipt
      const updatedRequest = await storage.updateTransportRequest(req.params.id, {
        paymentStatus: "awaiting_payment",
        paymentReceipt: null,
      });

      // Create notification for client
      if (request.clientId) {
        try {
          await storage.createNotification({
            userId: request.clientId,
            type: "payment_receipt_rejected",
            title: "Reçu refusé",
            message: `Votre reçu de paiement pour la commande ${request.referenceId} a été refusé. Veuillez téléverser un nouveau reçu de paiement.`,
            relatedId: request.id,
          });
        } catch (notifError) {
          console.error("Failed to create receipt rejected notification:", notifError);
        }
      }

      res.json({ 
        success: true, 
        request: updatedRequest
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to reject receipt" });
    }
  });

  // Decline a request (transporter declines permanently)
  app.post("/api/requests/:id/decline", async (req, res) => {
    try {
      const requestId = req.params.id;
      const { transporterId } = req.body;

      if (!transporterId) {
        return res.status(400).json({ error: "Transporter ID required" });
      }

      const request = await storage.getTransportRequest(requestId);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      // Add transporter to declinedBy array
      const currentDeclined = request.declinedBy || [];
      if (!currentDeclined.includes(transporterId)) {
        const updatedRequest = await storage.updateTransportRequest(requestId, {
          declinedBy: [...currentDeclined, transporterId],
        });
        res.json({ success: true, request: updatedRequest });
      } else {
        res.json({ success: true, message: "Already declined" });
      }
    } catch (error) {
      console.error("Failed to decline request:", error);
      res.status(500).json({ error: "Failed to decline request" });
    }
  });

  // Track view of a request
  app.post("/api/requests/:id/track-view", async (req, res) => {
    try {
      const requestId = req.params.id;
      const request = await storage.getTransportRequest(requestId);
      
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      // Increment view count
      const currentViews = request.viewCount || 0;
      const updatedRequest = await storage.updateTransportRequest(requestId, {
        viewCount: currentViews + 1,
      });

      if (!updatedRequest) {
        return res.status(500).json({ error: "Failed to update view count" });
      }

      res.json({ success: true, viewCount: updatedRequest.viewCount });
    } catch (error) {
      console.error("Failed to track view:", error);
      res.status(500).json({ error: "Failed to track view" });
    }
  });

  // Get recommended transporters for a request
  app.get("/api/requests/:id/recommended-transporters", async (req, res) => {
    try {
      const requestId = req.params.id;
      const request = await storage.getTransportRequest(requestId);
      
      if (!request) {
        return res.status(404).json({ error: "Demande non trouvée" });
      }

      // Get recommended transporters based on fromCity
      const recommendedTransporters = await storage.getRecommendedTransporters(request.fromCity);
      
      res.json({
        transporters: recommendedTransporters,
        count: recommendedTransporters.length
      });
    } catch (error) {
      console.error("Failed to get recommended transporters:", error);
      res.status(500).json({ error: "Échec de récupération des transporteurs recommandés" });
    }
  });

  // Notify selected transporters about a new request
  app.post("/api/requests/:id/notify-transporters", async (req, res) => {
    try {
      const requestId = req.params.id;
      const { transporterIds } = req.body;
      
      if (!transporterIds || !Array.isArray(transporterIds) || transporterIds.length === 0) {
        return res.status(400).json({ error: "Liste de transporteurs requise" });
      }

      const request = await storage.getTransportRequest(requestId);
      if (!request) {
        return res.status(404).json({ error: "Demande non trouvée" });
      }

      // Create notifications for each selected transporter
      let notifiedCount = 0;
      for (const transporterId of transporterIds) {
        try {
          await storage.createNotification({
            userId: transporterId,
            type: "new_request_available",
            title: "Nouvelle demande disponible",
            message: `Une nouvelle demande correspondant à votre trajet ou retour est disponible. Référence: ${request.referenceId}`,
            relatedId: requestId,
          });
          notifiedCount++;
        } catch (err) {
          console.error(`Failed to notify transporter ${transporterId}:`, err);
        }
      }

      res.json({ 
        success: true,
        notifiedCount,
        message: `${notifiedCount} transporteur(s) notifié(s)`
      });
    } catch (error) {
      console.error("Failed to notify transporters:", error);
      res.status(500).json({ error: "Échec de l'envoi des notifications" });
    }
  });

  // Get ratings for a transporter with request details
  app.get("/api/transporters/:id/ratings", async (req, res) => {
    try {
      const transporterId = req.params.id;
      
      // Get all ratings for this transporter
      const ratings = await storage.getRatingsByTransporter(transporterId);
      
      // Enrich ratings with request details (reference, date)
      const ratingsWithDetails = await Promise.all(
        ratings.map(async (rating) => {
          const request = await storage.getTransportRequest(rating.requestId);
          return {
            id: rating.id,
            score: rating.score,
            comment: rating.comment,
            createdAt: rating.createdAt,
            requestReference: request?.referenceId || "N/A",
            requestDate: request?.createdAt,
          };
        })
      );

      // Get transporter info for summary
      const transporter = await storage.getUser(transporterId);
      const averageRating = transporter?.rating ? parseFloat(transporter.rating) : 0;
      const totalRatings = transporter?.totalRatings || 0;

      res.json({
        summary: {
          averageRating: averageRating.toFixed(1),
          totalRatings,
        },
        ratings: ratingsWithDetails,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ratings" });
    }
  });

  // RIB routes for transporters
  app.get("/api/user/rib", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      
      if (!userId) {
        return res.status(401).json({ error: "Non authentifié" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== "transporteur") {
        return res.status(403).json({ error: "Accès refusé" });
      }

      res.json({
        ribName: user.ribName || "",
        ribNumber: user.ribNumber || "",
      });
    } catch (error) {
      console.error("Get RIB error:", error);
      res.status(500).json({ error: "Échec de récupération du RIB" });
    }
  });

  app.patch("/api/user/rib", async (req, res) => {
    try {
      const { userId, ribName, ribNumber } = req.body;
      
      if (!userId) {
        return res.status(401).json({ error: "Non authentifié" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== "transporteur") {
        return res.status(403).json({ error: "Accès refusé" });
      }

      // Validate RIB number (must be exactly 24 digits)
      if (ribNumber && !/^\d{24}$/.test(ribNumber)) {
        return res.status(400).json({ error: "Le RIB doit contenir exactement 24 chiffres" });
      }

      const updatedUser = await storage.updateUser(userId, {
        ribName: ribName || null,
        ribNumber: ribNumber || null,
      });

      res.json({
        ribName: updatedUser?.ribName || "",
        ribNumber: updatedUser?.ribNumber || "",
      });
    } catch (error) {
      console.error("Update RIB error:", error);
      res.status(500).json({ error: "Échec de mise à jour du RIB" });
    }
  });

  // Admin routes for managing transporter RIB
  app.get("/api/admin/users/:id/rib", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      res.json({
        ribName: user.ribName || "",
        ribNumber: user.ribNumber || "",
      });
    } catch (error) {
      console.error("Get user RIB error:", error);
      res.status(500).json({ error: "Échec de récupération du RIB" });
    }
  });

  app.patch("/api/admin/users/:id/rib", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const { ribName, ribNumber } = req.body;

      // Validate RIB number (must be exactly 24 digits)
      if (ribNumber && ribNumber !== "" && !/^\d{24}$/.test(ribNumber)) {
        return res.status(400).json({ error: "Le RIB doit contenir exactement 24 chiffres" });
      }

      const updatedUser = await storage.updateUser(req.params.id, {
        ribName: ribName || null,
        ribNumber: ribNumber || null,
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      res.json({
        ribName: updatedUser.ribName || "",
        ribNumber: updatedUser.ribNumber || "",
      });
    } catch (error) {
      console.error("Update user RIB error:", error);
      res.status(500).json({ error: "Échec de mise à jour du RIB" });
    }
  });

  // Offer routes
  app.post("/api/offers", async (req, res) => {
    try {
      const offerData = insertOfferSchema.parse(req.body);
      
      // Check if transporter already has an offer for this request
      const hasExistingOffer = await storage.hasOfferForRequest(
        offerData.transporterId,
        offerData.requestId
      );
      
      if (hasExistingOffer) {
        return res.status(409).json({ error: "Vous avez déjà soumis une offre pour cette demande" });
      }
      
      const offer = await storage.createOffer(offerData);
      
      // Get request and transporter info for notification
      const request = await storage.getTransportRequest(offer.requestId);
      const transporter = await storage.getUser(offer.transporterId);
      
      if (request) {
        // Get commission rate to display price with markup to client
        const settings = await storage.getAdminSettings();
        const commissionRate = parseFloat(settings?.commissionPercentage || "10");
        const clientAmount = (parseFloat(offer.amount) * (1 + commissionRate / 100)).toFixed(2);
        
        // Create notification for client
        await storage.createNotification({
          userId: request.clientId,
          type: "offer_received",
          title: "Nouvelle offre reçue",
          message: `${transporter?.name || "Un transporteur"} a soumis une offre de ${clientAmount} MAD pour votre demande ${request.referenceId}`,
          relatedId: offer.id
        });
        
        // Send push notification to client
        try {
          const client = await storage.getUser(request.clientId);
          if (client && client.deviceToken) {
            const { sendNotificationToUser, NotificationTemplates } = await import('./push-notifications');
            const notification = NotificationTemplates.newOffer(request.referenceId);
            notification.url = `/client-dashboard`;
            
            await sendNotificationToUser(client.id, notification, storage);
            console.log(`📨 Notification push envoyée au client pour nouvelle offre`);
          }
        } catch (pushError) {
          console.error('❌ Erreur lors de l\'envoi de la notification push:', pushError);
        }

        // Send email notification to admin (non-blocking)
        storage.getUser(request.clientId).then(client => {
          if (client && transporter) {
            emailService.sendNewOfferEmail(offer, request, transporter, client).catch(emailError => {
              console.error("Failed to send offer email:", emailError);
            });
          }
        }).catch(err => {
          console.error("Failed to get client for email:", err);
        });

        // Send SMS to client for every new offer received
        const client = await storage.getUser(request.clientId);
        if (client?.phoneNumber) {
          await sendNewOfferSMS(client.phoneNumber);
        }
        
        // Notify coordinators about new offer
        try {
          const allUsers = await storage.getAllUsers();
          const coordinators = allUsers.filter(u => u.role === 'coordinateur' && u.status === 'validated');
          
          for (const coordinator of coordinators) {
            await storage.createNotification({
              userId: coordinator.id,
              type: 'offer_received',
              title: 'Nouvelle offre soumise',
              message: `${transporter?.name || "Un transporteur"} a soumis une offre pour la demande ${request.referenceId}`,
              relatedId: request.id // Use request ID so coordinators can group by request
            });
            
            // Send push notification to coordinator
            if (coordinator.deviceToken) {
              try {
                const { sendNotificationToUser, NotificationTemplates } = await import('./push-notifications');
                const notification = NotificationTemplates.newOffer(request.referenceId);
                notification.url = `/coordinator-dashboard`;
                await sendNotificationToUser(coordinator.id, notification, storage);
              } catch (pushError) {
                console.error('❌ Erreur push notification coordinateur:', pushError);
              }
            }
          }
        } catch (coordError) {
          console.error('❌ Erreur notification coordinateurs:', coordError);
        }
      }
      
      res.json(offer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create offer" });
    }
  });

  app.get("/api/offers", async (req, res) => {
    try {
      const { requestId, transporterId } = req.query;
      
      let offers: any[] = [];
      if (requestId) {
        offers = await storage.getOffersByRequest(requestId as string);
        
        // Get commission rate for client view
        const settings = await storage.getAdminSettings();
        const commissionRate = parseFloat(settings?.commissionPercentage || "10");
        
        // Batch fetch all unique transporters in a single query to avoid N+1
        const uniqueTransporterIds = new Set(offers.map(offer => offer.transporterId));
        const transporterIds = Array.from(uniqueTransporterIds);
        const allTransporters = await storage.getUsersByIds(transporterIds);
        const transportersMap = new Map(allTransporters.map(t => [t.id, t]));
        
        // Add clientAmount (with commission) and transporter info with photo for each offer
        offers = offers.map(offer => {
          const transporter = transportersMap.get(offer.transporterId);
          return {
            ...offer,
            clientAmount: (parseFloat(offer.amount) * (1 + commissionRate / 100)).toFixed(2),
            transporter: transporter ? {
              id: transporter.id,
              name: transporter.name,
              city: transporter.city,
              phoneNumber: transporter.phoneNumber,
              rating: transporter.rating,
              totalTrips: transporter.totalTrips,
              truckPhotos: transporter.truckPhotos,
            } : null,
          };
        });
      } else if (transporterId) {
        offers = await storage.getOffersByTransporter(transporterId as string);
        // No commission markup for transporter view
      } else {
        // Return all offers (for admin view)
        offers = await storage.getAllOffers();
      }
      
      res.json(offers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch offers" });
    }
  });

  app.patch("/api/offers/:id", async (req, res) => {
    try {
      console.log(`[PATCH /api/offers/${req.params.id}] Request body:`, JSON.stringify(req.body, null, 2));
      
      // Convert amount to string if it's a number (for decimal type)
      const updates: any = { ...req.body };
      if (typeof updates.amount === "number") {
        updates.amount = updates.amount.toString();
      }
      
      // Convert pickupDate to Date if it's a string
      if (typeof updates.pickupDate === "string" && updates.pickupDate) {
        updates.pickupDate = new Date(updates.pickupDate);
      }
      
      const offer = await storage.updateOffer(req.params.id, updates);
      if (!offer) {
        console.log(`[PATCH /api/offers/${req.params.id}] Offer not found`);
        return res.status(404).json({ error: "Offer not found" });
      }
      console.log(`[PATCH /api/offers/${req.params.id}] Success:`, JSON.stringify(offer, null, 2));
      res.json(offer);
    } catch (error) {
      console.error(`[PATCH /api/offers/${req.params.id}] Error:`, error);
      res.status(500).json({ error: "Failed to update offer" });
    }
  });

  app.post("/api/offers/:id/accept", async (req, res) => {
    try {
      const offer = await storage.getOffer(req.params.id);
      if (!offer) {
        return res.status(404).json({ error: "Offer not found" });
      }

      // Get transporter and request info
      const transporter = await storage.getUser(offer.transporterId);
      const request = await storage.getTransportRequest(offer.requestId);
      const client = request ? await storage.getUser(request.clientId) : null;

      // Get commission percentage
      const settings = await storage.getAdminSettings();
      const commissionRate = parseFloat(settings?.commissionPercentage || "10");
      
      // Calculate total with commission
      const offerAmount = parseFloat(offer.amount);
      const commissionAmount = (offerAmount * commissionRate) / 100;
      const totalWithCommission = offerAmount + commissionAmount;

      // Update offer status
      await storage.updateOffer(req.params.id, { 
        status: "accepted"
      });

      // Update request with accepted offer
      await storage.updateTransportRequest(offer.requestId, {
        status: "accepted",
        acceptedOfferId: req.params.id,
      });

      // Clean up: Delete all other offers for this request (auto-cleanup)
      const allOffersForRequest = await storage.getOffersByRequest(offer.requestId);
      for (const otherOffer of allOffersForRequest) {
        if (otherOffer.id !== req.params.id) {
          await storage.deleteOffer(otherOffer.id);
        }
      }

      // Create notification for transporter
      await storage.createNotification({
        userId: offer.transporterId,
        type: "offer_accepted",
        title: "Offre acceptée !",
        message: `${client?.name || "Le client"} a accepté votre offre de ${offer.amount} MAD pour la demande ${request?.referenceId}. Commission: ${commissionAmount.toFixed(2)} MAD. Total: ${totalWithCommission.toFixed(2)} MAD`,
        relatedId: offer.id
      });
      
      // Send push notification to transporter
      try {
        if (transporter && transporter.deviceToken && request) {
          const { sendNotificationToUser, NotificationTemplates } = await import('./push-notifications');
          const notification = NotificationTemplates.offerAccepted(request.referenceId);
          notification.url = `/transporter-dashboard`;
          
          await sendNotificationToUser(transporter.id, notification, storage);
          console.log(`📨 Notification push envoyée au transporteur pour offre acceptée`);
        }
      } catch (pushError) {
        console.error('❌ Erreur lors de l\'envoi de la notification push:', pushError);
      }

      // Create contract automatically
      if (request) {
        await storage.createContract({
          requestId: offer.requestId,
          offerId: offer.id,
          clientId: request.clientId,
          transporterId: offer.transporterId,
          referenceId: request.referenceId,
          amount: offer.amount,
        });
      }

      // Send email notification to admin about order validation (non-blocking)
      if (request && transporter && client) {
        emailService.sendOrderValidatedEmail(request, offer, client, transporter).catch(emailError => {
          console.error("Failed to send order validated email:", emailError);
        });
      }

      // Send SMS to transporter about offer acceptance
      if (transporter?.phoneNumber) {
        await sendOfferAcceptedSMS(transporter.phoneNumber);
      }
      
      // Notify coordinators about offer acceptance
      try {
        const allUsers = await storage.getAllUsers();
        const coordinators = allUsers.filter(u => u.role === 'coordinateur' && u.status === 'validated');
        
        for (const coordinator of coordinators) {
          await storage.createNotification({
            userId: coordinator.id,
            type: 'offer_accepted',
            title: 'Offre acceptée',
            message: `${client?.name || "Le client"} a accepté l'offre de ${transporter?.name || "transporteur"} pour ${request?.referenceId}`,
            relatedId: request?.id || offer.requestId
          });
          
          // Send push notification to coordinator
          if (coordinator.deviceToken && request) {
            try {
              const { sendNotificationToUser, NotificationTemplates } = await import('./push-notifications');
              const notification = NotificationTemplates.offerAccepted(request.referenceId);
              notification.url = `/coordinator-dashboard`;
              await sendNotificationToUser(coordinator.id, notification, storage);
            } catch (pushError) {
              console.error('❌ Erreur push notification coordinateur:', pushError);
            }
          }
        }
      } catch (coordError) {
        console.error('❌ Erreur notification coordinateurs:', coordError);
      }

      res.json({ 
        success: true,
        commission: commissionAmount,
        total: totalWithCommission,
        transporterPhone: transporter?.phoneNumber,
        transporterName: transporter?.name,
        clientPhone: client?.phoneNumber,
        clientName: client?.name
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to accept offer" });
    }
  });

  app.post("/api/offers/:id/decline", async (req, res) => {
    try {
      const offer = await storage.getOffer(req.params.id);
      if (!offer) {
        return res.status(404).json({ error: "Offer not found" });
      }

      // Get transporter and request info
      const transporter = await storage.getUser(offer.transporterId);
      const request = await storage.getTransportRequest(offer.requestId);
      const client = request ? await storage.getUser(request.clientId) : null;

      // Update offer status to rejected
      await storage.updateOffer(req.params.id, { 
        status: "rejected"
      });

      // Create notification for transporter
      await storage.createNotification({
        userId: offer.transporterId,
        type: "offer_declined",
        title: "Offre déclinée",
        message: `${client?.name || "Le client"} a décliné votre offre de ${offer.amount} MAD pour la demande ${request?.referenceId}.`,
        relatedId: offer.id
      });

      res.json({ 
        success: true
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to decline offer" });
    }
  });

  // Admin offer management routes
  app.delete("/api/admin/offers/:id", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const offer = await storage.getOffer(id);
      
      if (!offer) {
        return res.status(404).json({ error: "Offre non trouvée" });
      }
      
      // Delete related contracts first (foreign key constraint)
      const contract = await storage.getContractByOfferId(id);
      if (contract) {
        await storage.deleteContract(contract.id);
      }
      
      // Delete the offer
      await storage.deleteOffer(id);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete offer error:", error);
      res.status(500).json({ error: "Échec de suppression de l'offre" });
    }
  });

  app.patch("/api/admin/offers/:id", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, pickupDate, loadType } = req.body;
      
      const offer = await storage.getOffer(id);
      if (!offer) {
        return res.status(404).json({ error: "Offre non trouvée" });
      }
      
      // Prepare updates
      const updates: Partial<Offer> = {};
      
      if (amount !== undefined) {
        updates.amount = typeof amount === "number" ? amount.toString() : amount;
      }
      
      if (pickupDate !== undefined) {
        updates.pickupDate = typeof pickupDate === "string" ? new Date(pickupDate) : pickupDate;
      }
      
      if (loadType !== undefined) {
        updates.loadType = loadType;
      }
      
      // Update the offer
      const updatedOffer = await storage.updateOffer(id, updates);
      
      res.json(updatedOffer);
    } catch (error) {
      console.error("Update offer error:", error);
      res.status(500).json({ error: "Échec de modification de l'offre" });
    }
  });

  // Chat routes
  app.post("/api/chat/messages", async (req, res) => {
    try {
      console.log('[DEBUG] POST /api/chat/messages - Request body:', JSON.stringify(req.body, null, 2));
      const messageData = insertChatMessageSchema.parse(req.body);
      console.log('[DEBUG] Validation passed, creating message...');
      const message = await storage.createChatMessage(messageData);
      console.log('[DEBUG] Message created successfully:', message.id);
      
      // Send push notification to recipient
      try {
        const sender = await storage.getUser(messageData.senderId);
        const recipient = await storage.getUser(messageData.receiverId);
        
        if (recipient && recipient.deviceToken && sender) {
          const { sendNotificationToUser, NotificationTemplates } = await import('./push-notifications');
          const notification = NotificationTemplates.newMessage(sender.name || sender.phoneNumber);
          notification.url = `/messages?requestId=${messageData.requestId}`;
          
          await sendNotificationToUser(recipient.id, notification, storage);
          console.log(`📨 Notification push envoyée à ${recipient.name || recipient.phoneNumber}`);
        }
      } catch (pushError) {
        console.error('❌ Erreur lors de l\'envoi de la notification push:', pushError);
        // Don't fail the message send if push notification fails
      }
      
      // Notify coordinators about new message (skip if sender is coordinator)
      try {
        const sender = await storage.getUser(messageData.senderId);
        if (sender && sender.role !== 'coordinateur') {
          const allUsers = await storage.getAllUsers();
          const coordinators = allUsers.filter(u => u.role === 'coordinateur' && u.status === 'validated');
          
          const request = await storage.getTransportRequest(messageData.requestId);
          
          for (const coordinator of coordinators) {
            await storage.createNotification({
              userId: coordinator.id,
              type: 'message_received',
              title: 'Nouveau message',
              message: `${sender.name || sender.phoneNumber} a envoyé un message pour ${request?.referenceId || 'une demande'}`,
              relatedId: messageData.requestId
            });
            
            // Send push notification to coordinator
            if (coordinator.deviceToken) {
              try {
                const { sendNotificationToUser, NotificationTemplates } = await import('./push-notifications');
                const notification = NotificationTemplates.newMessage(sender.name || sender.phoneNumber);
                notification.url = `/coordinator-dashboard`;
                await sendNotificationToUser(coordinator.id, notification, storage);
              } catch (pushError) {
                console.error('❌ Erreur push notification coordinateur:', pushError);
              }
            }
          }
        }
      } catch (coordError) {
        console.error('❌ Erreur notification coordinateurs:', coordError);
      }
      
      res.json(message);
    } catch (error) {
      console.error('[DEBUG] Error in POST /api/chat/messages:', error);
      if (error instanceof z.ZodError) {
        console.error('[DEBUG] Zod validation error:', JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.get("/api/chat/messages", async (req, res) => {
    try {
      const { requestId } = req.query;
      
      let messages;
      if (requestId) {
        messages = await storage.getMessagesByRequest(requestId as string);
      } else {
        messages = await storage.getAllMessages();
      }
      
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Get all conversations for a user
  app.get("/api/chat/conversations", async (req, res) => {
    try {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: "userId required" });
      }
      
      console.log(`[DEBUG] Getting conversations for userId: ${userId}`);
      const conversations = await storage.getUserConversations(userId as string);
      console.log(`[DEBUG] Found ${conversations.length} conversations`);
      res.json(conversations);
    } catch (error) {
      console.error('[DEBUG] Error fetching conversations:', error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Mark messages as read
  app.post("/api/chat/mark-read", async (req, res) => {
    try {
      const { userId, requestId } = req.body;
      
      if (!userId || !requestId) {
        return res.status(400).json({ error: "userId and requestId required" });
      }
      
      await storage.markMessagesAsRead(userId, requestId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark messages as read" });
    }
  });

  // Get unread messages count
  app.get("/api/chat/unread-count", async (req, res) => {
    try {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: "userId required" });
      }
      
      const count = await storage.getUnreadMessagesCount(userId as string);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });

  // Delete conversation (admin)
  app.delete("/api/chat/conversation/:requestId", async (req, res) => {
    try {
      const { requestId } = req.params;
      
      if (!requestId) {
        return res.status(400).json({ error: "requestId required" });
      }
      
      await storage.deleteMessagesByRequestId(requestId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Upload voice message
  const voiceUpload = multer({
    storage: multer.memoryStorage(),
    limits: { 
      fileSize: 5 * 1024 * 1024 // 5MB limit (approximately 1 minute of audio)
    },
    fileFilter: (req, file, cb) => {
      // Accept audio files including browser-recorded formats
      const acceptedMimeTypes = [
        'audio/mpeg', 
        'audio/wav', 
        'audio/mp3',
        'audio/webm',  // Browser MediaRecorder output
        'audio/mp4',   // Alternative MediaRecorder output
        'audio/ogg'    // Some browsers use this
      ];
      if (acceptedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Format de fichier non supporté'));
      }
    }
  });

  app.post("/api/messages/upload-voice", voiceUpload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Fichier audio requis" });
      }

      // Convert audio file to base64
      const base64Audio = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      const dataUrl = `data:${mimeType};base64,${base64Audio}`;

      res.json({ 
        success: true,
        fileUrl: dataUrl,
        mimeType,
        size: req.file.size
      });
    } catch (error) {
      console.error("Voice upload error:", error);
      res.status(500).json({ error: "Échec de l'upload du message vocal" });
    }
  });

  // Upload photo/video for chat
  const mediaUpload = multer({
    storage: multer.memoryStorage(),
    limits: { 
      fileSize: 10 * 1024 * 1024 // 10MB limit for photos and videos
    },
    fileFilter: (req, file, cb) => {
      // Accept image and video files
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/quicktime', // .mov files
        'video/x-msvideo', // .avi files
        'video/webm'
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Format de fichier non supporté. Utilisez JPEG, PNG, GIF, WEBP, MP4, MOV, AVI ou WEBM'));
      }
    }
  });

  app.post("/api/messages/upload-media", mediaUpload.single('media'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Fichier média requis" });
      }

      // Determine message type based on MIME type
      const messageType = req.file.mimetype.startsWith('image/') ? 'photo' : 'video';

      // Convert buffer to base64
      const base64Media = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      const dataUrl = `data:${mimeType};base64,${base64Media}`;
      
      res.json({ 
        success: true, 
        fileUrl: dataUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType,
        messageType
      });
    } catch (error) {
      console.error("Error uploading media:", error);
      res.status(500).json({ error: "Échec du téléversement du média" });
    }
  });

  // Admin routes
  app.get("/api/admin/settings", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const settings = await storage.getAdminSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.patch("/api/admin/settings", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const settings = await storage.updateAdminSettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Cities CRUD routes (Admin)
  app.get("/api/cities", async (req, res) => {
    try {
      const cities = await storage.getAllCities();
      // Sort cities alphabetically by name (A → Z)
      const sortedCities = cities.sort((a, b) => 
        a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
      );
      res.json(sortedCities);
    } catch (error) {
      console.error("Get cities error:", error);
      res.status(500).json({ error: "Échec de récupération des villes" });
    }
  });

  app.post("/api/cities", async (req, res) => {
    try {
      const cityData = insertCitySchema.parse(req.body);
      const city = await storage.createCity(cityData);
      res.json(city);
    } catch (error) {
      console.error("Create city error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Échec de création de la ville" });
    }
  });

  app.patch("/api/cities/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const city = await storage.updateCity(id, req.body);
      if (!city) {
        return res.status(404).json({ error: "Ville non trouvée" });
      }
      res.json(city);
    } catch (error) {
      console.error("Update city error:", error);
      res.status(500).json({ error: "Échec de modification de la ville" });
    }
  });

  app.delete("/api/cities/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCity(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete city error:", error);
      res.status(500).json({ error: "Échec de suppression de la ville" });
    }
  });

  app.get("/api/admin/stats", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const requests = await storage.getAllTransportRequests();
      const offers = await storage.getAllOffers();
      const contracts = await storage.getAllContracts();
      
      // Get dates for monthly comparison
      const now = new Date();
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      
      // Clients actifs
      const activeClients = users.filter(u => u.role === "client" && u.isActive);
      const activeClientsCount = activeClients.length;
      const activeClientsLastMonth = activeClients.filter(u => 
        u.createdAt && new Date(u.createdAt) >= startOfLastMonth && new Date(u.createdAt) <= endOfLastMonth
      ).length;
      const activeClientsThisMonth = activeClients.filter(u => 
        u.createdAt && new Date(u.createdAt) >= startOfCurrentMonth
      ).length;
      const activeClientsTrend = activeClientsLastMonth > 0 
        ? Math.round(((activeClientsThisMonth - activeClientsLastMonth) / activeClientsLastMonth) * 100)
        : activeClientsThisMonth > 0 ? 100 : 0;
      
      // Transporteurs actifs
      const activeTransporters = users.filter(u => u.role === "transporteur" && u.isActive && u.status === "validated");
      const activeTransportersCount = activeTransporters.length;
      const activeTransportersLastMonth = activeTransporters.filter(u => 
        u.createdAt && new Date(u.createdAt) >= startOfLastMonth && new Date(u.createdAt) <= endOfLastMonth
      ).length;
      const activeTransportersThisMonth = activeTransporters.filter(u => 
        u.createdAt && new Date(u.createdAt) >= startOfCurrentMonth
      ).length;
      const activeTransportersTrend = activeTransportersLastMonth > 0
        ? Math.round(((activeTransportersThisMonth - activeTransportersLastMonth) / activeTransportersLastMonth) * 100)
        : activeTransportersThisMonth > 0 ? 100 : 0;
      
      // Demandes totales
      const totalRequests = requests.length;
      
      // Commissions totales
      const acceptedOffers = offers.filter(o => o.status === "accepted");
      const adminSettings = await storage.getAdminSettings();
      const commissionRate = adminSettings?.commissionPercentage ? parseFloat(adminSettings.commissionPercentage) : 10;
      const totalCommissions = acceptedOffers.reduce((sum, offer) => {
        const amount = parseFloat(offer.amount);
        const commission = (amount * commissionRate) / 100;
        return sum + commission;
      }, 0);
      
      const acceptedOffersLastMonth = acceptedOffers.filter(o => 
        o.createdAt && new Date(o.createdAt) >= startOfLastMonth && new Date(o.createdAt) <= endOfLastMonth
      );
      const commissionsLastMonth = acceptedOffersLastMonth.reduce((sum, offer) => {
        const amount = parseFloat(offer.amount);
        const commission = (amount * commissionRate) / 100;
        return sum + commission;
      }, 0);
      
      const acceptedOffersThisMonth = acceptedOffers.filter(o => 
        o.createdAt && new Date(o.createdAt) >= startOfCurrentMonth
      );
      const commissionsThisMonth = acceptedOffersThisMonth.reduce((sum, offer) => {
        const amount = parseFloat(offer.amount);
        const commission = (amount * commissionRate) / 100;
        return sum + commission;
      }, 0);
      
      const commissionsTrend = commissionsLastMonth > 0
        ? Math.round(((commissionsThisMonth - commissionsLastMonth) / commissionsLastMonth) * 100)
        : commissionsThisMonth > 0 ? 100 : 0;
      
      // Taux de conversion
      const totalOffers = offers.length;
      const conversionRate = totalOffers > 0 
        ? Math.round((acceptedOffers.length / totalOffers) * 100)
        : 0;
      
      // Demandes complétées
      const completedRequests = requests.filter(r => r.status === "completed").length;
      
      // Taux de satisfaction transporteurs (moyenne des notes)
      const transportersWithRating = users.filter(u => 
        u.role === "transporteur" && u.rating !== null && parseFloat(u.rating) > 0
      );
      const averageRating = transportersWithRating.length > 0
        ? transportersWithRating.reduce((sum, u) => sum + parseFloat(u.rating || "0"), 0) / transportersWithRating.length
        : 0;
      
      // Durée moyenne de traitement (jours entre création et complétion)
      // Note: We don't have updatedAt, so we'll use a default processing time estimate
      const completedRequestsCount = requests.filter(r => r.status === "completed").length;
      const averageProcessingTime = 2.5; // Default estimate in days
      
      // Commandes republiées - on ne peut pas les calculer car pas de champ republishedCount
      const republishedCount = 0;
      
      // Montant moyen par mission
      const completedRequestsWithOffers = requests.filter(r => r.status === "completed");
      const completedOffersAmounts = acceptedOffers
        .filter(o => completedRequestsWithOffers.find(r => r.id === o.requestId))
        .map(o => parseFloat(o.amount));
      const averageAmount = completedOffersAmounts.length > 0
        ? completedOffersAmounts.reduce((sum, amount) => sum + amount, 0) / completedOffersAmounts.length
        : 0;
      
      // Total paiements en attente
      const pendingPayments = requests.filter(r => 
        r.paymentStatus === "pending_admin_validation"
      );
      const pendingPaymentsTotal = pendingPayments.reduce((sum, req) => {
        const offer = acceptedOffers.find(o => o.requestId === req.id);
        return sum + (offer ? parseFloat(offer.amount) : 0);
      }, 0);
      
      const stats = {
        // KPIs principaux
        activeClients: activeClientsCount,
        activeClientsTrend,
        activeDrivers: activeTransportersCount,
        activeDriversTrend: activeTransportersTrend,
        totalRequests,
        totalCommissions: Math.round(totalCommissions),
        commissionsTrend,
        contracts: contracts.length,
        
        // Statistiques détaillées
        conversionRate,
        completedRequests,
        openRequests: requests.filter(r => r.status === "open").length,
        averageRating: Math.round(averageRating * 10) / 10,
        averageProcessingTime: Math.round(averageProcessingTime * 10) / 10,
        republishedCount,
        averageAmount: Math.round(averageAmount),
        pendingPaymentsTotal: Math.round(pendingPaymentsTotal),
        pendingPaymentsCount: pendingPayments.length,
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Get all transporters with detailed stats (admin)
  app.get("/api/admin/transporters", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      console.log("🔍 [GET /api/admin/transporters] Starting optimized fetch...");
      const users = await storage.getAllUsers();
      const offers = await storage.getAllOffers();
      const requests = await storage.getAllTransportRequests();
      
      console.log(`📊 Fetched ${users.length} users, ${offers.length} offers, ${requests.length} requests`);
      
      // Filter transporters
      const transporters = users.filter(u => u.role === "transporteur" && u.status === "validated");
      console.log(`👤 Found ${transporters.length} validated transporters`);
      
      // Get admin settings for commission calculation
      const adminSettings = await storage.getAdminSettings();
      const commissionRate = adminSettings?.commissionPercentage ? parseFloat(adminSettings.commissionPercentage) : 10;
      
      // OPTIMISATION: Grouper les offers par transporterId AVANT la boucle (évite N×M comparaisons)
      console.log("🗂️ Grouping offers by transporterId...");
      const offersByTransporterId = offers.reduce((acc: Record<string, any[]>, offer) => {
        if (!acc[offer.transporterId]) {
          acc[offer.transporterId] = [];
        }
        acc[offer.transporterId].push(offer);
        return acc;
      }, {});
      
      // OPTIMISATION: Créer un index des requests par ID pour accès O(1)
      const requestsById = requests.reduce((acc: Record<string, any>, req) => {
        acc[req.id] = req;
        return acc;
      }, {});
      
      console.log("📋 Starting transporter stats calculation...");
      
      // Build transporter stats
      const transportersWithStats = transporters.map(transporter => {
        // Get all offers by this transporter (O(1) lookup au lieu de O(N))
        const transporterOffers = offersByTransporterId[transporter.id] || [];
        const transporterAcceptedOffers = transporterOffers.filter(o => o.status === "accepted");
        
        // Calculate total trips (completed requests) - accès direct par ID
        const completedRequests = transporterAcceptedOffers.filter(offer => {
          const request = requestsById[offer.requestId];
          return request && request.status === "completed";
        });
        const totalTrips = completedRequests.length;
        
        // Calculate total commissions generated
        const totalCommissions = transporterAcceptedOffers.reduce((sum, offer) => {
          const amount = parseFloat(offer.amount);
          const commission = (amount * commissionRate) / 100;
          return sum + commission;
        }, 0);
        
        // Get last activity date (most recent offer created) - utilise le groupe déjà créé
        const lastActivityDate = transporterOffers.length > 0
          ? transporterOffers.reduce((latest, offer) => {
              const offerDate = offer.createdAt ? new Date(offer.createdAt) : new Date(0);
              return offerDate > latest ? offerDate : latest;
            }, new Date(0))
          : null;
        
        return {
          id: transporter.id,
          name: transporter.name || "Sans nom",
          city: transporter.city || "Non spécifiée",
          phoneNumber: transporter.phoneNumber,
          rating: transporter.rating ? parseFloat(transporter.rating) : 0,
          totalTrips,
          totalCommissions: Math.round(totalCommissions),
          lastActivity: lastActivityDate,
          totalRatings: transporter.totalRatings || 0,
          hasTruckPhoto: transporter.truckPhotos && transporter.truckPhotos.length > 0,
          accountStatus: transporter.accountStatus || "active",
          ribName: transporter.ribName || null,
          ribNumber: transporter.ribNumber || null,
        };
      });
      
      res.json(transportersWithStats);
    } catch (error) {
      console.error("Error fetching transporters stats:", error);
      res.status(500).json({ error: "Failed to fetch transporters" });
    }
  });

  // Get transporter truck photo by ID (admin)
  app.get("/api/admin/transporters/:id/photo", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ error: "Transporteur non trouvé" });
      }
      
      if (user.role !== "transporteur") {
        return res.status(400).json({ error: "Cet utilisateur n'est pas un transporteur" });
      }
      
      const truckPhoto = user.truckPhotos && user.truckPhotos.length > 0 ? user.truckPhotos[0] : null;
      
      res.json({ 
        id: user.id,
        name: user.name || "Sans nom",
        truckPhoto,
        hasTruckPhoto: !!truckPhoto
      });
    } catch (error) {
      console.error("Error fetching transporter photo:", error);
      res.status(500).json({ error: "Erreur lors de la récupération de la photo" });
    }
  });

  // Get all clients with stats (admin)
  app.get("/api/admin/clients", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const clientStats = await storage.getClientStatistics();
      res.json(clientStats);
    } catch (error) {
      console.error("Error fetching client statistics:", error);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  // Get all conversations (admin)
  app.get("/api/admin/conversations", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const conversations = await storage.getAdminConversations();
      res.json(conversations);
    } catch (error) {
      console.error('[DEBUG] Error fetching admin conversations:', error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // File upload route
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      // In production, upload to cloud storage (S3, etc.)
      // For now, return a mock URL
      const fileUrl = `/uploads/${req.file.originalname}`;
      
      res.json({ url: fileUrl });
    } catch (error) {
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Notification routes
  app.get("/api/notifications", async (req, res) => {
    try {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: "userId required" });
      }
      
      const notifications = await storage.getNotificationsByUser(userId as string);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", async (req, res) => {
    try {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: "userId required" });
      }
      
      const count = await storage.getUnreadCount(userId as string);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const notification = await storage.markAsRead(req.params.id);
      
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark as read" });
    }
  });

  app.post("/api/notifications/mark-all-read", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "userId required" });
      }
      
      await storage.markAllAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all as read" });
    }
  });

  // Empty Returns routes
  app.post("/api/empty-returns", async (req, res) => {
    try {
      const validatedData = insertEmptyReturnSchema.parse(req.body);
      const emptyReturn = await storage.createEmptyReturn(validatedData);
      res.json(emptyReturn);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Échec de la création du retour à vide" });
    }
  });

  app.get("/api/empty-returns", async (req, res) => {
    try {
      // Expire old returns before fetching
      await storage.expireOldReturns();
      const emptyReturns = await storage.getActiveEmptyReturns();
      res.json(emptyReturns);
    } catch (error) {
      res.status(500).json({ error: "Échec de la récupération des retours à vide" });
    }
  });

  app.get("/api/empty-returns/transporter/:transporterId", async (req, res) => {
    try {
      const { transporterId } = req.params;
      const emptyReturns = await storage.getEmptyReturnsByTransporter(transporterId);
      res.json(emptyReturns);
    } catch (error) {
      res.status(500).json({ error: "Échec de la récupération des retours à vide" });
    }
  });

  app.patch("/api/empty-returns/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const emptyReturn = await storage.updateEmptyReturn(id, req.body);
      
      if (!emptyReturn) {
        return res.status(404).json({ error: "Retour à vide non trouvé" });
      }
      
      res.json(emptyReturn);
    } catch (error) {
      res.status(500).json({ error: "Échec de la mise à jour du retour à vide" });
    }
  });

  // Assign order to empty return
  app.post("/api/empty-returns/:emptyReturnId/assign", async (req, res) => {
    try {
      const { emptyReturnId } = req.params;
      const { requestId } = req.body;

      if (!requestId) {
        return res.status(400).json({ error: "requestId requis" });
      }

      const emptyReturn = await storage.updateEmptyReturn(emptyReturnId, { status: "assigned" });
      if (!emptyReturn) {
        return res.status(404).json({ error: "Retour à vide non trouvé" });
      }

      const request = await storage.getTransportRequest(requestId);
      if (!request) {
        return res.status(404).json({ error: "Demande non trouvée" });
      }

      // Create an automatic offer from the transporter
      const offer = await storage.createOffer({
        requestId,
        transporterId: emptyReturn.transporterId,
        amount: "0",
        pickupDate: emptyReturn.returnDate,
        loadType: "return",
      });

      // Accept the offer automatically
      await storage.updateOffer(offer.id, { status: "accepted" });
      await storage.updateTransportRequest(requestId, {
        status: "accepted",
        acceptedOfferId: offer.id,
      });

      // Create notification for transporter
      await storage.createNotification({
        userId: emptyReturn.transporterId,
        type: "order_assigned",
        title: "Commande affectée",
        message: "Une commande vous a été affectée pour votre retour à vide",
        relatedId: requestId,
      });

      res.json({ success: true, offer });
    } catch (error) {
      console.error("Error assigning order:", error);
      res.status(500).json({ error: "Échec de l'affectation de la commande" });
    }
  });

  // Transporter Recommendation routes
  app.get("/api/recommendations/:requestId", async (req, res) => {
    try {
      const { requestId } = req.params;
      
      // Get request details
      const request = await storage.getTransportRequest(requestId);
      if (!request) {
        return res.status(404).json({ error: "Demande non trouvée" });
      }

      // Get all validated and active transporters (exclude blocked accounts)
      const allUsers = await storage.getAllUsers();
      const validatedTransporters = allUsers.filter(
        (u: any) => u.role === "transporteur" && u.status === "validated" && u.accountStatus === "active"
      );

      // Get active empty returns for same route (priority 1)
      await storage.expireOldReturns();
      const emptyReturns = await storage.getActiveEmptyReturns();
      const matchingReturns = emptyReturns.filter(
        (er: any) => er.fromCity === request.toCity && er.toCity === request.fromCity
      );
      
      // Get completed trips count for each transporter
      const allOffers = await storage.getAllOffers();
      const completedOffersByTransporter = new Map();
      allOffers
        .filter((o: any) => o.status === "accepted")
        .forEach((o: any) => {
          const count = completedOffersByTransporter.get(o.transporterId) || 0;
          completedOffersByTransporter.set(o.transporterId, count + 1);
        });

      // Helper function to map transporter data
      const mapTransporter = (t: any, priority: string | null) => ({
        id: t.id,
        name: t.name,
        city: t.city,
        truckPhoto: t.truckPhotos && t.truckPhotos.length > 0 ? t.truckPhotos[0] : null,
        rating: parseFloat(t.rating || "0"),
        totalTrips: completedOffersByTransporter.get(t.id) || 0,
        priority,
      });

      // Priority 1: Transporters with matching empty returns
      const priority1Transporters = matchingReturns.map((er: any) => {
        const transporter = validatedTransporters.find((t: any) => t.id === er.transporterId);
        return transporter ? mapTransporter(transporter, 'empty_return') : null;
      }).filter(Boolean);

      // Priority 2: Recently active transporters (last 24h) - simulated with random for now
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const priority2Transporters = validatedTransporters
        .filter((t: any) => !priority1Transporters.find((p1: any) => p1.id === t.id))
        .filter(() => Math.random() > 0.5) // Simulate activity - would normally check lastActive field
        .map((t: any) => mapTransporter(t, 'active'))
        .slice(0, 2); // Limit to 2

      // Priority 3: Best rated transporters
      const priority3Transporters = validatedTransporters
        .filter((t: any) => !priority1Transporters.find((p1: any) => p1.id === t.id))
        .filter((t: any) => !priority2Transporters.find((p2: any) => p2.id === t.id))
        .filter((t: any) => parseFloat(t.rating || "0") >= 4.0)
        .map((t: any) => mapTransporter(t, 'rating'))
        .slice(0, 2); // Limit to 2

      // Priority 4: Other available transporters
      const priority4Transporters = validatedTransporters
        .filter((t: any) => !priority1Transporters.find((p1: any) => p1.id === t.id))
        .filter((t: any) => !priority2Transporters.find((p2: any) => p2.id === t.id))
        .filter((t: any) => !priority3Transporters.find((p3: any) => p3.id === t.id))
        .map((t: any) => mapTransporter(t, null))
        .slice(0, 1); // Limit to 1

      // Combine all priorities and limit to 5
      const recommendations = [
        ...priority1Transporters,
        ...priority2Transporters,
        ...priority3Transporters,
        ...priority4Transporters
      ].slice(0, 5);

      console.log('🎯 CamioMatch recommendations:', recommendations.length, 'matches found');
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ error: "Échec de la récupération des recommandations" });
    }
  });

  // Client-Transporter Contact tracking
  app.post("/api/client-transporter-contacts", async (req, res) => {
    try {
      const { requestId, clientId, transporterId } = req.body;

      if (!requestId || !clientId || !transporterId) {
        return res.status(400).json({ error: "requestId, clientId et transporterId requis" });
      }

      // Create contact record in database
      const [contact] = await db.insert(clientTransporterContacts).values({
        requestId,
        clientId,
        transporterId,
        contactType: "recommendation",
      }).returning();

      // Get request and transporter details for notification
      const request = await storage.getTransportRequest(requestId);
      const transporter = await storage.getUser(transporterId);

      // Create admin notification
      const admins = (await storage.getAllUsers()).filter((u: any) => u.role === "admin");
      for (const admin of admins) {
        await storage.createNotification({
          userId: admin.id,
          type: "client_contacted_transporter",
          title: "Contact client-transporteur",
          message: `Le client ${request?.referenceId} a contacté le transporteur ${transporter?.name}`,
          relatedId: requestId,
        });
      }

      res.json(contact);
    } catch (error) {
      console.error("Error creating contact:", error);
      res.status(500).json({ error: "Échec de l'enregistrement du contact" });
    }
  });

  // Get all client-transporter contacts (Admin only)
  app.get("/api/admin/client-transporter-contacts", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const contacts = await db
        .select()
        .from(clientTransporterContacts)
        .orderBy(desc(clientTransporterContacts.createdAt));
      
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ error: "Échec de la récupération des contacts" });
    }
  });

  // Contract routes
  app.get("/api/contracts", async (req, res) => {
    try {
      const contracts = await storage.getAllContracts();
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ error: "Échec de la récupération des contrats" });
    }
  });

  app.get("/api/contracts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const contract = await storage.getContractById(id);
      
      if (!contract) {
        return res.status(404).json({ error: "Contrat non trouvé" });
      }
      
      res.json(contract);
    } catch (error) {
      res.status(500).json({ error: "Échec de la récupération du contrat" });
    }
  });

  app.patch("/api/contracts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: "status requis" });
      }

      const contract = await storage.updateContract(id, { status });
      
      if (!contract) {
        return res.status(404).json({ error: "Contrat non trouvé" });
      }
      
      res.json(contract);
    } catch (error) {
      res.status(500).json({ error: "Échec de la mise à jour du contrat" });
    }
  });

  // SMS Communication Routes (Admin only)
  
  // Quick notify all validated transporters
  app.post("/api/admin/sms/notify-transporters", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const adminId = req.user!.id;

      // Get all validated transporters
      const allUsers = await storage.getAllUsers();
      const validatedTransporters = allUsers.filter(
        user => user.role === "transporteur" && user.status === "validated" && user.accountStatus === "active"
      );

      if (validatedTransporters.length === 0) {
        return res.status(400).json({ error: "Aucun transporteur validé trouvé" });
      }

      const phoneNumbers = validatedTransporters.map(t => t.phoneNumber);
      const message = "🚛 De nouvelles offres de transport sont disponibles sur CamionBack ! Connectez-vous dès maintenant pour proposer vos tarifs.";

      // Send bulk SMS
      const result = await sendBulkSMS(phoneNumbers, message);

      // Save to history
      await storage.createSmsHistory({
        adminId,
        targetAudience: "transporters",
        message,
        recipientCount: validatedTransporters.length
      });

      res.json({
        success: true,
        sent: result.success,
        failed: result.failed,
        total: validatedTransporters.length
      });
    } catch (error) {
      console.error("Erreur envoi SMS transporteurs:", error);
      res.status(500).json({ error: "Erreur lors de l'envoi des SMS" });
    }
  });

  // Send custom SMS to target audience
  app.post("/api/admin/sms/send", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const adminId = req.user!.id;
      const { targetAudience, message } = req.body;

      if (!targetAudience || !message) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
      }

      if (message.length > 160) {
        return res.status(400).json({ error: "Le message ne peut pas dépasser 160 caractères" });
      }

      // Get target users based on audience
      const allUsers = await storage.getAllUsers();
      let targetUsers: typeof allUsers = [];

      if (targetAudience === "transporters") {
        targetUsers = allUsers.filter(
          user => user.role === "transporteur" && user.status === "validated" && user.accountStatus === "active"
        );
      } else if (targetAudience === "clients") {
        targetUsers = allUsers.filter(
          user => user.role === "client" && user.accountStatus === "active"
        );
      } else if (targetAudience === "both") {
        targetUsers = allUsers.filter(
          user => (
            (user.role === "client" && user.accountStatus === "active") ||
            (user.role === "transporteur" && user.status === "validated" && user.accountStatus === "active")
          )
        );
      }

      if (targetUsers.length === 0) {
        return res.status(400).json({ error: "Aucun destinataire trouvé" });
      }

      const phoneNumbers = targetUsers.map(u => u.phoneNumber);

      // Send bulk SMS
      const result = await sendBulkSMS(phoneNumbers, message);

      // Save to history
      await storage.createSmsHistory({
        adminId,
        targetAudience,
        message,
        recipientCount: targetUsers.length
      });

      res.json({
        success: true,
        sent: result.success,
        failed: result.failed,
        total: targetUsers.length
      });
    } catch (error) {
      console.error("Erreur envoi SMS personnalisé:", error);
      res.status(500).json({ error: "Erreur lors de l'envoi des SMS" });
    }
  });

  // Send single SMS to specific phone number
  app.post("/api/admin/sms/send-single", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const adminId = req.user!.id;
      const { phoneNumber, message } = req.body;

      if (!phoneNumber || !message) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
      }

      if (message.length > 160) {
        return res.status(400).json({ error: "Le message ne peut pas dépasser 160 caractères" });
      }

      // Validate phone number format
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+212${phoneNumber}`;
      if (!/^\+212\d{9}$/.test(formattedPhone)) {
        return res.status(400).json({ error: "Format de numéro invalide. Utilisez +212XXXXXXXXX" });
      }

      // Send SMS to single number
      const result = await sendBulkSMS([formattedPhone], message);

      // Save to history
      await storage.createSmsHistory({
        adminId,
        targetAudience: `single:${formattedPhone}`,
        message,
        recipientCount: 1
      });

      res.json({
        success: true,
        sent: result.success,
        failed: result.failed,
        phoneNumber: formattedPhone
      });
    } catch (error) {
      console.error("Erreur envoi SMS individuel:", error);
      res.status(500).json({ error: "Erreur lors de l'envoi du SMS" });
    }
  });

  // Get SMS history
  app.get("/api/admin/sms/history", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const history = await storage.getAllSmsHistory();
      
      // Populate admin names
      const historyWithAdmins = await Promise.all(
        history.map(async (record) => {
          const admin = await storage.getUser(record.adminId);
          return {
            ...record,
            adminName: admin?.name || "Admin"
          };
        })
      );
      
      res.json(historyWithAdmins);
    } catch (error) {
      console.error("Erreur récupération historique SMS:", error);
      res.status(500).json({ error: "Erreur lors de la récupération de l'historique" });
    }
  });

  // Delete SMS history entry
  app.delete("/api/admin/sms/history/:id", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;

      await storage.deleteSmsHistory(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Erreur suppression historique SMS:", error);
      res.status(500).json({ error: "Erreur lors de la suppression" });
    }
  });

  // ================================
  // TRANSPORTER REFERENCE ROUTES
  // ================================
  
  // Create a transporter reference
  app.post("/api/transporter-references", async (req, res) => {
    try {
      const { transporterId: clientTransporterId, referenceName, referencePhone, referenceRelation } = req.body;

      // SECURITY: Verify the transporterId matches the authenticated user
      // In this app, authentication is done via localStorage on client side
      // The transporterId should come from the authenticated session, not the request body
      const transporterId = clientTransporterId; // For now, we trust the client
      // TODO PRODUCTION: Implement proper session/JWT authentication
      
      if (!transporterId || !referenceName || !referencePhone || !referenceRelation) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
      }

      // Verify user exists and is a transporter
      const user = await storage.getUser(transporterId);
      if (!user || user.role !== "transporteur") {
        return res.status(403).json({ error: "Seuls les transporteurs peuvent soumettre des références" });
      }

      // Check if transporter already has a reference
      const existingRef = await storage.getTransporterReferenceByTransporterId(transporterId);
      if (existingRef) {
        return res.status(400).json({ error: "Ce transporteur a déjà soumis une référence" });
      }

      const reference = await storage.createTransporterReference({
        transporterId,
        referenceName,
        referencePhone,
        referenceRelation
      });

      res.json(reference);
    } catch (error) {
      console.error("Erreur création référence:", error);
      res.status(500).json({ error: "Échec de la création de la référence" });
    }
  });

  // Get transporter reference by transporter ID
  app.get("/api/transporter-references/:transporterId", async (req, res) => {
    try {
      const { transporterId } = req.params;
      const reference = await storage.getTransporterReferenceByTransporterId(transporterId);
      
      res.json(reference || null);
    } catch (error) {
      console.error("Erreur récupération référence:", error);
      res.status(500).json({ error: "Échec de la récupération de la référence" });
    }
  });

  // Get all pending references (Admin/Coordinator)
  app.get("/api/admin/transporter-references", requireAuth, requireRole(['admin', 'coordinateur']), async (req, res) => {
    try {
      const references = await storage.getAllPendingReferences();
      res.json(references);
    } catch (error) {
      console.error("Erreur récupération références en attente:", error);
      res.status(500).json({ error: "Échec de la récupération des références" });
    }
  });

  // Update transporter reference status (Admin/Coordinator) - used by admin dashboard
  app.patch("/api/admin/transporter-references/:id", requireAuth, requireRole(['admin', 'coordinateur']), async (req, res) => {
    try {
      const { id } = req.params;
      const { status, rejectionReason } = req.body;
      const adminId = req.user!.id;

      if (!status) {
        return res.status(400).json({ error: "Status requis" });
      }

      if (status === "validated" || status === "approved") {
        // Validate the reference (accept both "validated" and "approved" for compatibility)
        const reference = await storage.validateReference(id, adminId);
        if (!reference) {
          return res.status(404).json({ error: "Référence non trouvée" });
        }

        // Send notification
        await storage.createNotification({
          userId: reference.transporterId,
          type: "reference_validated",
          title: "Référence validée ✅",
          message: "Votre référence professionnelle a été validée. Votre compte est maintenant vérifié !",
          relatedId: null,
        });

        res.json(reference);
      } else if (status === "rejected") {
        if (!rejectionReason) {
          return res.status(400).json({ error: "Raison de rejet requise" });
        }

        // Reject the reference
        const reference = await storage.rejectReference(id, adminId, rejectionReason);
        if (!reference) {
          return res.status(404).json({ error: "Référence non trouvée" });
        }

        // Send notification
        await storage.createNotification({
          userId: reference.transporterId,
          type: "reference_rejected",
          title: "Référence non validée ❌",
          message: `Votre référence n'a pas pu être validée. Raison: ${rejectionReason}. Merci d'en fournir une autre.`,
          relatedId: null,
        });

        res.json(reference);
      } else {
        return res.status(400).json({ error: "Status invalide" });
      }
    } catch (error) {
      console.error("Erreur mise à jour référence:", error);
      res.status(500).json({ error: "Échec de la mise à jour de la référence" });
    }
  });

  // Validate a transporter reference (Admin/Coordinator)
  app.patch("/api/transporter-references/:id/validate", async (req, res) => {
    try {
      const { id } = req.params;
      const { adminId } = req.body;

      if (!adminId) {
        return res.status(401).json({ error: "Non authentifié" });
      }

      // Verify admin or coordinator role
      const admin = await storage.getUser(adminId);
      if (!admin || (admin.role !== "admin" && admin.role !== "coordinateur")) {
        return res.status(403).json({ error: "Accès refusé - Admin ou Coordinateur requis" });
      }

      const reference = await storage.validateReference(id, adminId);
      
      if (!reference) {
        return res.status(404).json({ error: "Référence non trouvée" });
      }

      // Send notification to transporter
      await storage.createNotification({
        userId: reference.transporterId,
        type: "reference_validated",
        title: "Référence validée ✅",
        message: "Votre référence professionnelle a été validée. Votre compte est maintenant vérifié !",
        relatedId: null,
      });

      res.json(reference);
    } catch (error) {
      console.error("Erreur validation référence:", error);
      res.status(500).json({ error: "Échec de la validation de la référence" });
    }
  });

  // Reject a transporter reference (Admin/Coordinator)
  app.patch("/api/transporter-references/:id/reject", async (req, res) => {
    try {
      const { id } = req.params;
      const { adminId, reason } = req.body;

      if (!adminId || !reason) {
        return res.status(400).json({ error: "ID admin et raison requis" });
      }

      // Verify admin or coordinator role
      const admin = await storage.getUser(adminId);
      if (!admin || (admin.role !== "admin" && admin.role !== "coordinateur")) {
        return res.status(403).json({ error: "Accès refusé - Admin ou Coordinateur requis" });
      }

      const reference = await storage.rejectReference(id, adminId, reason);
      
      if (!reference) {
        return res.status(404).json({ error: "Référence non trouvée" });
      }

      // Send notification to transporter
      await storage.createNotification({
        userId: reference.transporterId,
        type: "reference_rejected",
        title: "Référence non validée ❌",
        message: `Votre référence n'a pas pu être validée. Raison: ${reason}. Merci d'en fournir une autre.`,
        relatedId: null,
      });

      res.json(reference);
    } catch (error) {
      console.error("Erreur rejet référence:", error);
      res.status(500).json({ error: "Échec du rejet de la référence" });
    }
  });

  // Stories routes
  // Get all stories (admin)
  app.get("/api/stories", async (req, res) => {
    try {
      const adminId = req.query.adminId as string;

      if (!adminId) {
        return res.status(401).json({ error: "Non authentifié" });
      }

      const admin = await storage.getUser(adminId);
      if (!admin || admin.role !== "admin") {
        return res.status(403).json({ error: "Accès refusé - Admin requis" });
      }

      const stories = await storage.getAllStories();
      res.json(stories);
    } catch (error) {
      console.error("Erreur récupération stories:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des stories" });
    }
  });

  // Get active stories by role
  app.get("/api/stories/active", async (req, res) => {
    try {
      const role = req.query.role as string;

      if (!role || !["client", "transporteur", "all"].includes(role)) {
        return res.status(400).json({ error: "Rôle invalide" });
      }

      const stories = await storage.getActiveStoriesByRole(role);
      res.json(stories);
    } catch (error) {
      console.error("Erreur récupération stories actives:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des stories" });
    }
  });

  // Create story (admin)
  app.post("/api/stories", async (req, res) => {
    try {
      const adminId = req.query.adminId as string;

      if (!adminId) {
        return res.status(401).json({ error: "Non authentifié" });
      }

      const admin = await storage.getUser(adminId);
      if (!admin || admin.role !== "admin") {
        return res.status(403).json({ error: "Accès refusé - Admin requis" });
      }

      const { title, content, mediaUrl, role, order } = req.body;

      if (!title || !content || !role) {
        return res.status(400).json({ error: "Titre, contenu et rôle requis" });
      }

      const story = await storage.createStory({
        title,
        content,
        mediaUrl: mediaUrl || null,
        role,
        order: order || 0,
        isActive: true
      });

      res.json(story);
    } catch (error) {
      console.error("Erreur création story:", error);
      res.status(500).json({ error: "Erreur lors de la création de la story" });
    }
  });

  // Update story (admin)
  app.patch("/api/stories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.query.adminId as string;

      if (!adminId) {
        return res.status(401).json({ error: "Non authentifié" });
      }

      const admin = await storage.getUser(adminId);
      if (!admin || admin.role !== "admin") {
        return res.status(403).json({ error: "Accès refusé - Admin requis" });
      }

      const story = await storage.updateStory(id, req.body);
      
      if (!story) {
        return res.status(404).json({ error: "Story non trouvée" });
      }

      res.json(story);
    } catch (error) {
      console.error("Erreur mise à jour story:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour de la story" });
    }
  });

  // Delete story (admin)
  app.delete("/api/stories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.query.adminId as string;

      if (!adminId) {
        return res.status(401).json({ error: "Non authentifié" });
      }

      const admin = await storage.getUser(adminId);
      if (!admin || admin.role !== "admin") {
        return res.status(403).json({ error: "Accès refusé - Admin requis" });
      }

      await storage.deleteStory(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Erreur suppression story:", error);
      res.status(500).json({ error: "Erreur lors de la suppression de la story" });
    }
  });

  // ================================
  // COORDINATOR ROUTES
  // ================================

  // Get available requests (open status) for coordinator
  app.get("/api/coordinator/available-requests", requireAuth, requireRole(['admin', 'coordinateur']), async (req, res) => {
    try {
      const coordinatorId = req.user!.id;
      const requests = await storage.getCoordinatorAvailableRequests();
      res.json(requests);
    } catch (error) {
      console.error("Erreur récupération commandes disponibles:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des commandes" });
    }
  });

  // Get active requests (accepted status) for coordinator
  app.get("/api/coordinator/active-requests", requireAuth, requireRole(['admin', 'coordinateur']), async (req, res) => {
    try {
      const coordinatorId = req.user!.id;
      const requests = await storage.getCoordinatorActiveRequests();
      res.json(requests);
    } catch (error) {
      console.error("Erreur récupération commandes actives:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des commandes" });
    }
  });

  // Get payment pending requests for coordinator
  app.get("/api/coordinator/payment-requests", requireAuth, requireRole(['admin', 'coordinateur']), async (req, res) => {
    try {
      const coordinatorId = req.user!.id;
      const requests = await storage.getCoordinatorPaymentRequests();
      res.json(requests);
    } catch (error) {
      console.error("Erreur récupération commandes paiement:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des commandes" });
    }
  });

  // Toggle request visibility (hide/show from transporters)
  app.patch("/api/coordinator/requests/:id/toggle-visibility", requireAuth, requireRole(['admin', 'coordinateur']), async (req, res) => {
    try {
      const coordinatorId = req.user!.id;
      const { id } = req.params;
      const { isHidden } = req.body;

      const updated = await storage.updateRequestVisibility(id, isHidden);
      res.json(updated);
    } catch (error) {
      console.error("Erreur modification visibilité:", error);
      res.status(500).json({ error: "Erreur lors de la modification de la visibilité" });
    }
  });

  // Update payment status
  app.patch("/api/coordinator/requests/:id/payment-status", requireAuth, requireRole(['admin', 'coordinateur']), async (req, res) => {
    try {
      const coordinatorId = req.user!.id;
      const { id } = req.params;
      const { paymentStatus } = req.body;

      const updated = await storage.updateRequestPaymentStatus(id, paymentStatus);
      res.json(updated);
    } catch (error) {
      console.error("Erreur modification statut paiement:", error);
      res.status(500).json({ error: "Erreur lors de la modification du statut" });
    }
  });

  // ===== Admin - Coordination Status Configuration Routes =====
  
  // Get all coordination status configurations
  app.get("/api/admin/coordination-statuses", requireAuth, requireRole(['admin', 'coordinateur']), async (req, res) => {
    try {
      const statuses = await storage.getAllCoordinationStatusConfigs();
      res.json(statuses);
    } catch (error) {
      console.error("Erreur récupération statuts coordination:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des statuts" });
    }
  });

  // Create a new coordination status configuration
  app.post("/api/admin/coordination-statuses", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const statusData = insertCoordinationStatusSchema.parse(req.body);
      const status = await storage.createCoordinationStatusConfig(statusData);
      res.json(status);
    } catch (error) {
      console.error("Erreur création statut coordination:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Erreur lors de la création du statut" });
    }
  });

  // Update a coordination status configuration
  app.patch("/api/admin/coordination-statuses/:id", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;

      const status = await storage.updateCoordinationStatusConfig(id, req.body);
      if (!status) {
        return res.status(404).json({ error: "Statut non trouvé" });
      }
      res.json(status);
    } catch (error) {
      console.error("Erreur modification statut coordination:", error);
      res.status(500).json({ error: "Erreur lors de la modification du statut" });
    }
  });

  // Delete a coordination status configuration
  app.delete("/api/admin/coordination-statuses/:id", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;

      await storage.deleteCoordinationStatusConfig(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Erreur suppression statut coordination:", error);
      res.status(500).json({ error: "Erreur lors de la suppression du statut" });
    }
  });

  // Get coordination status usage statistics
  app.get("/api/admin/coordination-status-usage", requireAuth, requireRole(['admin', 'coordinateur']), async (req, res) => {
    try {
      const usage = await storage.getCoordinationStatusUsage();
      res.json(usage);
    } catch (error) {
      console.error("Erreur récupération statistiques statuts:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
    }
  });

  // ===== Coordinator Coordination Views Routes =====
  
  // Get "Nouveau" requests (newly created requests without coordination)
  app.get("/api/coordinator/coordination/nouveau", requireAuth, requireRole(['admin', 'coordinateur']), async (req, res) => {
    try {
      const coordinatorId = req.user!.id;
      const assignedToId = req.query.assignedToId as string | undefined;
      const searchQuery = req.query.searchQuery as string | undefined;
      
      const filters = {
        assignedToId,
        searchQuery
      };
      
      const requests = await storage.getCoordinationNouveauRequests(filters);
      res.json(requests);
    } catch (error) {
      console.error("Erreur récupération commandes nouveau:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des commandes" });
    }
  });

  // Get "En Action" requests (actively being worked on)
  app.get("/api/coordinator/coordination/en-action", requireAuth, requireRole(['admin', 'coordinateur']), async (req, res) => {
    try {
      const coordinatorId = req.user!.id;
      const assignedToId = req.query.assignedToId as string | undefined;
      const searchQuery = req.query.searchQuery as string | undefined;
      
      const filters = {
        assignedToId,
        searchQuery
      };
      
      const requests = await storage.getCoordinationEnActionRequests(filters);
      res.json(requests);
    } catch (error) {
      console.error("Erreur récupération commandes en action:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des commandes" });
    }
  });

  // Get "Prioritaires" requests (high priority)
  app.get("/api/coordinator/coordination/prioritaires", requireAuth, requireRole(['admin', 'coordinateur']), async (req, res) => {
    try {
      const coordinatorId = req.user!.id;
      const assignedToId = req.query.assignedToId as string | undefined;
      const searchQuery = req.query.searchQuery as string | undefined;
      
      const filters = {
        assignedToId,
        searchQuery
      };
      
      const requests = await storage.getCoordinationPrioritairesRequests(filters);
      res.json(requests);
    } catch (error) {
      console.error("Erreur récupération commandes prioritaires:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des commandes" });
    }
  });

  // Get "Archives" requests (archived)
  app.get("/api/coordinator/coordination/archives", requireAuth, requireRole(['admin', 'coordinateur']), async (req, res) => {
    try {
      const coordinatorId = req.user!.id;
      const assignedToId = req.query.assignedToId as string | undefined;
      const searchQuery = req.query.searchQuery as string | undefined;
      
      const filters = {
        assignedToId,
        searchQuery
      };
      
      const requests = await storage.getCoordinationArchivesRequests(filters);
      res.json(requests);
    } catch (error) {
      console.error("Erreur récupération archives:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des archives" });
    }
  });

  // Update coordination status for a request
  app.patch("/api/coordinator/requests/:id/coordination-status", requireAuth, requireRole(['admin', 'coordinateur']), async (req, res) => {
    try {
      const coordinatorId = req.user!.id;
      const isAdmin = req.user!.role === 'admin';
      const { id } = req.params;
      const { coordinationStatus, coordinationReason, coordinationReminderDate, assignedToId } = req.body;

      const reminderDate = coordinationReminderDate ? new Date(coordinationReminderDate) : null;

      const updated = await storage.updateCoordinationStatus(
        id,
        coordinationStatus,
        coordinationReason || null,
        reminderDate,
        coordinatorId
      );

      // If admin is manually changing assignedToId, update it separately
      if (isAdmin && assignedToId !== undefined) {
        await db.update(transportRequests)
          .set({ assignedToId: assignedToId || null })
          .where(eq(transportRequests.id, id));
      }

      // Create coordinator log for this action
      await storage.createCoordinatorLog({
        coordinatorId,
        action: `update_coordination_status`,
        targetType: 'request',
        targetId: id,
        details: JSON.stringify({
          newStatus: coordinationStatus,
          reason: coordinationReason,
          reminderDate: coordinationReminderDate,
          assignedToId: isAdmin && assignedToId !== undefined ? assignedToId : undefined,
        }),
      });

      res.json(updated);
    } catch (error) {
      console.error("Erreur modification statut coordination:", error);
      res.status(500).json({ error: "Erreur lors de la modification du statut de coordination" });
    }
  });

  // Update request details (coordinator complete edit)
  app.patch("/api/coordinator/requests/:id", requireAuth, requireRole(['admin', 'coordinateur']), async (req, res) => {
    try {
      const coordinatorId = req.user!.id;
      const { id } = req.params;
      const { fromCity, toCity, description, dateTime, photos } = req.body;

      // Get current request to compare changes
      const currentRequest = await storage.getTransportRequest(id);
      if (!currentRequest) {
        return res.status(404).json({ error: "Commande non trouvée" });
      }

      // Prepare updates object
      const updates: Partial<TransportRequest> = {};
      const changes: any = {};

      if (fromCity !== undefined && fromCity !== currentRequest.fromCity) {
        updates.fromCity = fromCity;
        changes.fromCity = { before: currentRequest.fromCity, after: fromCity };
      }
      if (toCity !== undefined && toCity !== currentRequest.toCity) {
        updates.toCity = toCity;
        changes.toCity = { before: currentRequest.toCity, after: toCity };
      }
      if (description !== undefined && description !== currentRequest.description) {
        updates.description = description;
        changes.description = { before: currentRequest.description, after: description };
      }
      if (dateTime !== undefined) {
        const newDate = new Date(dateTime);
        if (newDate.getTime() !== new Date(currentRequest.dateTime).getTime()) {
          updates.dateTime = newDate;
          changes.dateTime = { before: currentRequest.dateTime, after: newDate };
        }
      }
      if (photos !== undefined) {
        updates.photos = photos;
        changes.photos = { before: currentRequest.photos?.length || 0, after: photos.length };
      }

      // Update the request if there are changes
      let updated = currentRequest;
      if (Object.keys(updates).length > 0) {
        const result = await storage.updateTransportRequest(id, updates);
        if (!result) {
          return res.status(500).json({ error: "Échec de la mise à jour de la commande" });
        }
        updated = result;
      }

      // Log the coordination edit
      if (Object.keys(changes).length > 0) {
        await storage.createCoordinatorLog({
          coordinatorId,
          action: "coordination_edit",
          targetType: "request",
          targetId: id,
          details: JSON.stringify({
            changes,
            referenceId: currentRequest.referenceId,
            timestamp: new Date().toISOString(),
          }),
        });
      }

      res.json(updated);
    } catch (error) {
      console.error("Erreur modification commande:", error);
      res.status(500).json({ error: "Erreur lors de la modification de la commande" });
    }
  });

  // Get offers for a specific request (with transporter details)
  app.get("/api/coordinator/requests/:requestId/offers", requireAuth, requireRole(['admin', 'coordinateur']), async (req, res) => {
    try {
      const coordinatorId = req.user!.id;
      const { requestId } = req.params;
      
      // Get all offers for this request
      const offers = await storage.getOffersByRequest(requestId);
      
      // Get commission rate
      const settings = await storage.getAdminSettings();
      const commissionRate = parseFloat(settings?.commissionPercentage || "10");
      
      // Batch fetch all unique transporters in a single query to avoid N+1
      const uniqueTransporterIds = new Set(offers.map(offer => offer.transporterId));
      const transporterIds = Array.from(uniqueTransporterIds);
      const allTransporters = await storage.getUsersByIds(transporterIds);
      const transportersMap = new Map(allTransporters.map(t => [t.id, t]));
      
      // Enrich offers with transporter details and calculated amounts
      const enrichedOffers = offers.map((offer) => {
        const transporter = transportersMap.get(offer.transporterId);
        const offerAmount = parseFloat(offer.amount);
        const commissionAmount = (offerAmount * commissionRate) / 100;
        const totalWithCommission = offerAmount + commissionAmount;
        
        return {
          ...offer,
          transporter: transporter ? sanitizeUser(transporter, 'admin') : null,
          clientAmount: totalWithCommission.toFixed(2),
          commissionAmount: commissionAmount.toFixed(2),
        };
      });
      
      res.json(enrichedOffers);
    } catch (error) {
      console.error("Erreur récupération offres:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des offres" });
    }
  });

  // Accept an offer on behalf of the client
  app.post("/api/coordinator/offers/:offerId/accept", requireAuth, requireRole(['admin', 'coordinateur']), async (req, res) => {
    try {
      const coordinatorId = req.user!.id;
      const { offerId } = req.params;
      const offer = await storage.getOffer(offerId);
      
      if (!offer) {
        return res.status(404).json({ error: "Offre introuvable" });
      }

      // Get transporter and request info
      const transporter = await storage.getUser(offer.transporterId);
      const request = await storage.getTransportRequest(offer.requestId);
      const client = request ? await storage.getUser(request.clientId) : null;

      // Get commission percentage
      const settings = await storage.getAdminSettings();
      const commissionRate = parseFloat(settings?.commissionPercentage || "10");
      
      // Calculate total with commission
      const offerAmount = parseFloat(offer.amount);
      const commissionAmount = (offerAmount * commissionRate) / 100;
      const totalWithCommission = offerAmount + commissionAmount;

      // Update offer status
      await storage.updateOffer(offerId, { 
        status: "accepted"
      });

      // Update request with accepted offer
      await storage.updateTransportRequest(offer.requestId, {
        status: "accepted",
        acceptedOfferId: offerId,
      });

      // Clean up: Delete all other offers for this request
      const allOffersForRequest = await storage.getOffersByRequest(offer.requestId);
      for (const otherOffer of allOffersForRequest) {
        if (otherOffer.id !== offerId) {
          await storage.deleteOffer(otherOffer.id);
        }
      }

      // Create notification for transporter
      await storage.createNotification({
        userId: offer.transporterId,
        type: "offer_accepted",
        title: "Offre acceptée !",
        message: `Le coordinateur a accepté votre offre de ${offer.amount} MAD pour la demande ${request?.referenceId}. Commission: ${commissionAmount.toFixed(2)} MAD. Total: ${totalWithCommission.toFixed(2)} MAD`,
        relatedId: offer.id
      });
      
      // Send push notification to transporter
      try {
        if (transporter && transporter.deviceToken && request) {
          const { sendNotificationToUser, NotificationTemplates } = await import('./push-notifications');
          const notification = NotificationTemplates.offerAccepted(request.referenceId);
          notification.url = `/transporter-dashboard`;
          
          await sendNotificationToUser(transporter.id, notification, storage);
          console.log(`📨 Notification push envoyée au transporteur pour offre acceptée par coordinateur`);
        }
      } catch (pushError) {
        console.error('❌ Erreur lors de l\'envoi de la notification push:', pushError);
      }

      // Send SMS notification
      try {
        if (transporter && transporter.phoneNumber && request) {
          await sendOfferAcceptedSMS(transporter.phoneNumber);
        }
      } catch (smsError) {
        console.error('❌ Erreur lors de l\'envoi du SMS:', smsError);
      }

      res.json({ 
        success: true, 
        offer,
        transporter: sanitizeUser(transporter, 'admin'),
        totalWithCommission: totalWithCommission.toFixed(2) 
      });
    } catch (error) {
      console.error("Erreur acceptation offre:", error);
      res.status(500).json({ error: "Erreur lors de l'acceptation de l'offre" });
    }
  });

  // Search transporters for manual assignment
  app.get("/api/coordinator/search-transporters", requireAuth, requireRole(['admin', 'coordinateur']), async (req, res) => {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string' || query.trim().length < 2) {
        return res.status(400).json({ error: "Requête de recherche requise (minimum 2 caractères)" });
      }
      
      const transporters = await storage.searchTransporters(query.trim());
      
      // Sanitize user data before sending
      const sanitizedTransporters = sanitizeUsers(transporters, 'admin');
      
      res.json(sanitizedTransporters);
    } catch (error) {
      console.error("Erreur recherche transporteurs:", error);
      res.status(500).json({ error: "Erreur lors de la recherche des transporteurs" });
    }
  });

  // Manually assign a transporter to a request
  app.post("/api/coordinator/assign-transporter", requireAuth, requireRole(['admin', 'coordinateur']), async (req, res) => {
    try {
      const coordinatorId = req.user!.id;
      const { requestId, transporterId, transporterAmount, platformFee } = req.body;
      
      // Validation
      if (!requestId || !transporterId || transporterAmount === undefined || platformFee === undefined) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
      }
      
      if (transporterAmount <= 0 || platformFee < 0) {
        return res.status(400).json({ error: "Montants invalides" });
      }
      
      // Get request, transporter, and client
      const request = await storage.getTransportRequest(requestId);
      if (!request) {
        return res.status(404).json({ error: "Commande introuvable" });
      }
      
      const transporter = await storage.getUser(transporterId);
      if (!transporter || transporter.role !== 'transporteur' || transporter.status !== 'validated') {
        return res.status(404).json({ error: "Transporteur invalide" });
      }
      
      const client = await storage.getUser(request.clientId);
      if (!client) {
        return res.status(404).json({ error: "Client introuvable" });
      }
      
      // Assign transporter
      const updatedRequest = await storage.assignTransporterManually(
        requestId,
        transporterId,
        transporterAmount,
        platformFee,
        coordinatorId
      );
      
      if (!updatedRequest) {
        return res.status(500).json({ error: "Échec de l'assignation" });
      }
      
      // Create notifications
      await storage.createNotification({
        userId: transporterId,
        type: "manual_assignment",
        title: "Nouvelle mission assignée !",
        message: `Vous avez été assigné à la mission ${request.referenceId}. Montant: ${transporterAmount} MAD.`,
        relatedId: requestId
      });
      
      await storage.createNotification({
        userId: request.clientId,
        type: "transporter_assigned",
        title: "Transporteur assigné !",
        message: `Un transporteur a été assigné à votre commande ${request.referenceId}. Total: ${(transporterAmount + platformFee).toFixed(2)} MAD.`,
        relatedId: requestId
      });
      
      // Send push notifications
      try {
        const { sendNotificationToUser, NotificationTemplates } = await import('./push-notifications');
        
        // Notify transporter
        if (transporter.deviceToken) {
          const transporterNotif = NotificationTemplates.manualAssignment(request.referenceId);
          await sendNotificationToUser(transporterId, transporterNotif, storage);
          console.log(`📨 Notification push envoyée au transporteur pour assignation manuelle`);
        }
        
        // Notify client
        if (client.deviceToken) {
          const clientNotif = NotificationTemplates.transporterAssigned(request.referenceId);
          await sendNotificationToUser(request.clientId, clientNotif, storage);
          console.log(`📨 Notification push envoyée au client pour transporteur assigné`);
        }
      } catch (pushError) {
        console.error('❌ Erreur lors de l\'envoi des notifications push:', pushError);
      }
      
      // Send SMS notifications
      try {
        if (transporter.phoneNumber) {
          await sendManualAssignmentSMS(transporter.phoneNumber, request.referenceId);
        }
        if (client.phoneNumber) {
          await sendTransporterAssignedSMS(client.phoneNumber, request.referenceId);
        }
      } catch (smsError) {
        console.error('❌ Erreur lors de l\'envoi des SMS:', smsError);
      }
      
      // Create coordinator log
      await storage.createCoordinatorLog({
        coordinatorId,
        action: "manual_assignment",
        targetType: "request",
        targetId: requestId,
        details: JSON.stringify({
          transporterId,
          transporterName: transporter.name,
          transporterAmount,
          platformFee,
          clientTotal: transporterAmount + platformFee,
          referenceId: request.referenceId,
          timestamp: new Date().toISOString(),
        }),
      });
      
      res.json({
        success: true,
        request: updatedRequest,
        transporter: sanitizeUser(transporter, 'admin'),
        pricing: {
          transporterAmount,
          platformFee,
          clientTotal: transporterAmount + platformFee
        }
      });
    } catch (error) {
      console.error("Erreur assignation manuelle:", error);
      res.status(500).json({ error: "Erreur lors de l'assignation manuelle du transporteur" });
    }
  });

  // ===== Coordinator Notifications & Messaging Routes =====
  
  // Get all notifications for coordinator (grouped by request)
  app.get("/api/coordinator/notifications", requireAuth, requireRole(['admin', 'coordinateur']), async (req, res) => {
    try {
      const coordinatorId = req.user!.id;

      // Get all notifications for the coordinator
      const notifications = await storage.getNotificationsByUser(coordinatorId);
      
      // Collect all offer IDs and request IDs to batch fetch
      const offerIds = new Set<string>();
      const requestIds = new Set<string>();
      
      for (const notification of notifications) {
        if (notification.type === 'offer_received' || notification.type === 'offer_accepted') {
          if (notification.relatedId) offerIds.add(notification.relatedId);
        } else if (notification.relatedId) {
          requestIds.add(notification.relatedId);
        }
      }
      
      // Batch fetch offers and requests
      const offers = await Promise.all(Array.from(offerIds).map(id => storage.getOffer(id)));
      const offerMap = new Map(offers.filter(o => o).map(o => [o!.id, o]));
      
      // Add request IDs from offers
      offers.forEach(offer => {
        if (offer) requestIds.add(offer.requestId);
      });
      
      const requests = await Promise.all(Array.from(requestIds).map(id => storage.getTransportRequest(id)));
      const requestMap = new Map(requests.filter(r => r).map(r => [r!.id, r]));
      
      // Group notifications by request (using relatedId as requestId)
      const groupedNotifications: any = {};
      
      for (const notification of notifications) {
        let requestId = notification.relatedId;
        
        // If relatedId is an offerId, get the request from cached offers
        if (notification.type === 'offer_received' || notification.type === 'offer_accepted') {
          const offer = offerMap.get(notification.relatedId!);
          if (offer) {
            requestId = offer.requestId;
          }
        }
        
        if (requestId) {
          const requestInfo = requestMap.get(requestId);
          
          if (!groupedNotifications[requestId]) {
            groupedNotifications[requestId] = {
              requestId,
              referenceId: requestInfo?.referenceId || 'N/A',
              notifications: []
            };
          }
          
          groupedNotifications[requestId].notifications.push(notification);
        }
      }
      
      // Convert to array, add unread count, and sort by most recent
      const result = Object.values(groupedNotifications).map((group: any) => ({
        ...group,
        unreadCount: group.notifications.filter((n: any) => !n.read).length
      })).sort((a: any, b: any) => {
        const aLatest = a.notifications[0]?.createdAt || new Date(0);
        const bLatest = b.notifications[0]?.createdAt || new Date(0);
        return new Date(bLatest).getTime() - new Date(aLatest).getTime();
      });
      
      res.json(result);
    } catch (error) {
      console.error("Erreur récupération notifications coordinateur:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des notifications" });
    }
  });

  // Mark coordinator notification as read
  app.patch("/api/coordinator/notifications/:id/read", requireAuth, requireRole(['admin', 'coordinateur']), async (req, res) => {
    try {
      const coordinatorId = req.user!.id;
      const notification = await storage.markAsRead(req.params.id);
      
      if (!notification) {
        return res.status(404).json({ error: "Notification introuvable" });
      }
      
      res.json(notification);
    } catch (error) {
      console.error("Erreur marquage notification:", error);
      res.status(500).json({ error: "Erreur lors du marquage" });
    }
  });

  // Mark all coordinator notifications as read
  app.post("/api/coordinator/notifications/mark-all-read", requireAuth, requireRole(['admin', 'coordinateur']), async (req, res) => {
    try {
      const coordinatorId = req.user!.id;
      
      // Get all notifications and mark them as read
      const notifications = await storage.getNotificationsByUser(coordinatorId);
      for (const notification of notifications) {
        if (!notification.read) {
          await storage.markAsRead(notification.id);
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Erreur marquage notifications:", error);
      res.status(500).json({ error: "Erreur lors du marquage" });
    }
  });

  // Get all conversations grouped by request for coordinator
  app.get("/api/coordinator/conversations", requireAuth, requireRole(['admin', 'coordinateur']), async (req, res) => {
    try {
      const coordinatorId = req.user!.id;

      // Get all transport requests
      const allRequests = await storage.getAllTransportRequests();
      
      const conversations = await Promise.all(
        allRequests.map(async (request) => {
          // Get messages for this request
          const messages = await storage.getMessagesByRequest(request.id);
          
          if (messages.length === 0) {
            return null; // Skip requests with no messages
          }
          
          // Get client and transporter info
          const client = await storage.getUser(request.clientId);
          let transporter = null;
          if (request.acceptedOfferId) {
            const acceptedOffer = await storage.getOffer(request.acceptedOfferId);
            if (acceptedOffer) {
              transporter = await storage.getUser(acceptedOffer.transporterId);
            }
          }
          
          // Count unread messages (messages sent by client or transporter, not by coordinator)
          const unreadCount = messages.filter(
            (m: any) => !m.isRead && m.senderType !== 'coordinateur'
          ).length;
          
          // Get last message
          const lastMessage = messages[messages.length - 1];
          
          return {
            requestId: request.id,
            referenceId: request.referenceId,
            fromCity: request.fromCity,
            toCity: request.toCity,
            status: request.status,
            client: client ? sanitizeUser(client, 'admin') : null,
            transporter: transporter ? sanitizeUser(transporter, 'admin') : null,
            lastMessage: lastMessage ? {
              content: lastMessage.messageType === 'text' ? lastMessage.message : 
                       lastMessage.messageType === 'voice' ? '🎤 Message vocal' :
                       lastMessage.messageType === 'photo' ? '📷 Photo' : '🎥 Vidéo',
              createdAt: lastMessage.createdAt,
              senderType: lastMessage.senderType
            } : null,
            unreadCount,
            messageCount: messages.length
          };
        })
      );
      
      // Filter out null values and sort by last message date
      const filteredConversations = conversations
        .filter(c => c !== null)
        .sort((a, b) => {
          const aTime = a!.lastMessage?.createdAt ? new Date(a!.lastMessage.createdAt).getTime() : 0;
          const bTime = b!.lastMessage?.createdAt ? new Date(b!.lastMessage.createdAt).getTime() : 0;
          return bTime - aTime;
        });
      
      res.json(filteredConversations);
    } catch (error) {
      console.error("Erreur récupération conversations:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des conversations" });
    }
  });

  // Get messages for a specific request (conversation)
  app.get("/api/coordinator/conversations/:requestId/messages", requireAuth, requireRole(['admin', 'coordinateur']), async (req, res) => {
    try {
      const coordinatorId = req.user!.id;
      const { requestId } = req.params;
      const messages = await storage.getMessagesByRequest(requestId);
      res.json(messages);
    } catch (error) {
      console.error("Erreur récupération messages:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des messages" });
    }
  });

  // Send a message as coordinator to a conversation
  app.post("/api/coordinator/conversations/:requestId/messages", requireAuth, requireRole(['admin', 'coordinateur']), async (req, res) => {
    try {
      const coordinatorId = req.user!.id;
      const { requestId } = req.params;
      const { receiverId, message, messageType } = req.body;
      
      if (!receiverId || !message) {
        return res.status(400).json({ error: "Données manquantes" });
      }
      
      const newMessage = await storage.createChatMessage({
        requestId,
        senderId: coordinatorId,
        receiverId,
        message,
        messageType: messageType || 'text',
        senderType: 'coordinateur'
      });
      
      // Create notification for receiver
      await storage.createNotification({
        userId: receiverId,
        type: 'message_received',
        title: 'Nouveau message du coordinateur',
        message: message.substring(0, 100),
        relatedId: requestId
      });
      
      // Send push notification to receiver
      try {
        const receiver = await storage.getUser(receiverId);
        if (receiver && receiver.deviceToken) {
          const { sendNotificationToUser, NotificationTemplates } = await import('./push-notifications');
          const notification = NotificationTemplates.newMessage('Coordinateur');
          notification.url = receiver.role === 'client' ? '/client-dashboard' : '/transporter-dashboard';
          
          await sendNotificationToUser(receiverId, notification, storage);
          console.log(`📨 Notification push envoyée pour message coordinateur`);
        }
      } catch (pushError) {
        console.error('❌ Erreur push notification:', pushError);
      }
      
      res.json(newMessage);
    } catch (error) {
      console.error("Erreur envoi message coordinateur:", error);
      res.status(500).json({ error: "Erreur lors de l'envoi du message" });
    }
  });

  // Mark all messages in a conversation as read (for coordinator)
  app.patch("/api/coordinator/conversations/:requestId/mark-read", requireAuth, requireRole(['admin', 'coordinateur']), async (req, res) => {
    try {
      const coordinatorId = req.user!.id;
      const { requestId } = req.params;
      
      // Mark all messages in this conversation as read
      // Since this is for coordinator view, we don't use userId filtering
      // Instead, we'll manually update all unread messages
      const messages = await storage.getMessagesByRequest(requestId);
      for (const message of messages) {
        if (!message.isRead) {
          await storage.markAsRead(message.id);
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Erreur marquage messages:", error);
      res.status(500).json({ error: "Erreur lors du marquage" });
    }
  });

  // ===== Admin - Coordinator Management Routes =====
  
  // Get all coordinators (Admin only)
  app.get("/api/admin/coordinators", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const coordinators = await storage.getAllCoordinators();
      const sanitizedCoordinators = coordinators.map(c => sanitizeUser(c, 'admin'));
      res.json(sanitizedCoordinators);
    } catch (error) {
      console.error("Erreur récupération coordinateurs:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des coordinateurs" });
    }
  });

  // Get all coordinators (Admin and Coordinator access for filtering)
  app.get("/api/coordinators", requireAuth, requireRole(['admin', 'coordinateur']), async (req, res) => {
    try {
      const coordinators = await storage.getAllCoordinators();
      const sanitizedCoordinators = coordinators.map(c => sanitizeUser(c, 'admin'));
      res.json(sanitizedCoordinators);
    } catch (error) {
      console.error("Erreur récupération coordinateurs:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des coordinateurs" });
    }
  });

  // Create a new coordinator (Admin only)
  app.post("/api/admin/coordinators", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const { phoneNumber, name, pin } = req.body;

      // Validation
      if (!phoneNumber || !name || !pin) {
        return res.status(400).json({ error: "Téléphone, nom et PIN requis" });
      }

      // Validate PIN format (6 digits)
      if (!/^\d{6}$/.test(pin)) {
        return res.status(400).json({ error: "Le PIN doit contenir exactement 6 chiffres" });
      }

      // Check if phone number already exists
      const existingUser = await storage.getUserByPhone(phoneNumber);
      if (existingUser) {
        return res.status(400).json({ error: "Ce numéro de téléphone est déjà utilisé" });
      }

      // Hash the PIN
      const passwordHash = await bcrypt.hash(pin, 10);

      // Create coordinator
      const coordinator = await storage.createUser({
        phoneNumber,
        name,
        passwordHash,
        role: 'coordinateur',
        accountStatus: 'active',
        isActive: true
      });

      return sendUser(res, coordinator, 'admin');
    } catch (error) {
      console.error("Erreur création coordinateur:", error);
      res.status(500).json({ error: "Erreur lors de la création du coordinateur" });
    }
  });

  // Toggle coordinator status (block/unblock)
  app.patch("/api/admin/coordinators/:id/toggle-status", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      
      const coordinator = await storage.getCoordinatorById(id);
      if (!coordinator) {
        return res.status(404).json({ error: "Coordinateur non trouvé" });
      }

      const newStatus = coordinator.accountStatus === 'active' ? 'blocked' : 'active';
      const updated = await storage.updateCoordinatorStatus(id, newStatus);
      
      return sendUser(res, updated, 'admin');
    } catch (error) {
      console.error("Erreur modification statut coordinateur:", error);
      res.status(500).json({ error: "Erreur lors de la modification du statut" });
    }
  });

  // Reset coordinator PIN
  app.patch("/api/admin/coordinators/:id/reset-pin", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const { newPin } = req.body;

      if (!newPin || !/^\d{6}$/.test(newPin)) {
        return res.status(400).json({ error: "Le PIN doit contenir exactement 6 chiffres" });
      }

      const updated = await storage.resetCoordinatorPin(id, newPin);
      
      if (!updated) {
        return res.status(404).json({ error: "Coordinateur non trouvé" });
      }

      res.json({ success: true, message: "PIN réinitialisé avec succès" });
    } catch (error) {
      console.error("Erreur réinitialisation PIN:", error);
      res.status(500).json({ error: "Erreur lors de la réinitialisation du PIN" });
    }
  });

  // Delete coordinator
  app.delete("/api/admin/coordinators/:id", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      
      const coordinator = await storage.getCoordinatorById(id);
      if (!coordinator) {
        return res.status(404).json({ error: "Coordinateur non trouvé" });
      }

      await storage.deleteCoordinator(id);
      res.json({ success: true, message: "Coordinateur supprimé avec succès" });
    } catch (error) {
      console.error("Erreur suppression coordinateur:", error);
      res.status(500).json({ error: "Erreur lors de la suppression du coordinateur" });
    }
  });

  // Get coordinator activity logs
  app.get("/api/admin/coordinator-logs", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const { coordinatorId } = req.query;
      const logs = await storage.getCoordinatorLogs(coordinatorId as string | undefined);
      res.json(logs);
    } catch (error) {
      console.error("Erreur récupération logs coordinateur:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des logs" });
    }
  });

  // Get recent coordinator activity (with coordinator details)
  app.get("/api/admin/coordinator-activity", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const activity = await storage.getRecentCoordinatorActivity();
      res.json(activity);
    } catch (error) {
      console.error("Erreur récupération activité coordinateur:", error);
      res.status(500).json({ error: "Erreur lors de la récupération de l'activité" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time chat (using separate path to avoid Vite HMR conflict)
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: "/ws-chat"
  });

  wss.on("connection", (ws) => {
    console.log("New chat WebSocket connection");

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === "chat") {
          // Broadcast message to all connected clients
          wss.clients.forEach((client) => {
            if (client.readyState === 1) { // OPEN
              client.send(JSON.stringify(message));
            }
          });
        }
      } catch (error) {
        console.error("WebSocket error:", error);
      }
    });

    ws.on("close", () => {
      console.log("Chat WebSocket connection closed");
    });
  });

  return httpServer;
}
