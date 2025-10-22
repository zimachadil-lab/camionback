import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { db } from "./db";
import multer from "multer";
import { z } from "zod";
import bcrypt from "bcrypt";
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
  type Offer,
  clientTransporterContacts
} from "@shared/schema";
import { desc } from "drizzle-orm";
import { sendFirstOfferSMS, sendOfferAcceptedSMS, sendTransporterActivatedSMS, sendBulkSMS } from "./infobip-sms";
import { emailService } from "./email-service";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // PWA - Get VAPID public key for push notifications
  app.get("/api/pwa/vapid-public-key", (req, res) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    
    if (!publicKey) {
      console.error('❌ VAPID_PUBLIC_KEY not configured');
      return res.status(500).json({ error: "Push notifications not configured" });
    }
    
    res.json({ publicKey });
  });

  // PWA - Test endpoint to send a test push notification
  app.post("/api/pwa/test-push", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "userId requis" });
      }

      console.log('🧪 === TEST PUSH NOTIFICATION ===');
      console.log('🧪 Envoi d\'une notification de test à userId:', userId);

      const { sendNotificationToUser, NotificationTemplates } = await import('./push-notifications');
      
      const testNotification = {
        title: '🧪 Test Notification CamionBack',
        body: 'Ceci est une notification de test. Si vous la voyez, les push notifications fonctionnent !',
        url: '/',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png'
      };

      const result = await sendNotificationToUser(userId, testNotification, storage);

      if (result) {
        console.log('🧪 ✅ Notification de test envoyée avec succès');
        res.json({ 
          success: true, 
          message: 'Notification de test envoyée. Vérifiez votre appareil !' 
        });
      } else {
        console.log('🧪 ❌ Échec de l\'envoi de la notification de test');
        res.json({ 
          success: false, 
          message: 'Échec de l\'envoi. Vérifiez les logs serveur pour plus de détails.' 
        });
      }
    } catch (error) {
      console.error('🧪 ❌ Erreur lors du test push:', error);
      res.status(500).json({ error: "Erreur lors du test" });
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
      const isAdmin = phoneNumber.includes("000000");
      const user = await storage.createUser({
        phoneNumber,
        passwordHash,
        role: isAdmin ? "admin" : null, // Will be updated when role is selected
        name: null,
        city: null,
        truckPhotos: null,
        rating: null,
        totalTrips: null,
        status: null,
        isActive: true,
      });

      res.json({ user });
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

      res.json({ user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Échec de la connexion" });
    }
  });

  // Get current user data (refreshes from database)
  app.get("/api/auth/me/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: "ID utilisateur requis" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      res.json({ user });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des données" });
    }
  });

  // Select role after registration
  app.post("/api/auth/select-role", async (req, res) => {
    try {
      const { userId, role } = req.body;
      
      if (!userId || !role) {
        return res.status(400).json({ error: "ID utilisateur et rôle requis" });
      }

      if (role !== "client" && role !== "transporter") {
        return res.status(400).json({ error: "Rôle invalide" });
      }

      // Update user role
      const updates: any = { role };
      
      // If client, generate automatic clientId
      if (role === "client") {
        const clientId = await storage.getNextClientId();
        updates.clientId = clientId;
      }
      
      // If transporter, set status to pending
      if (role === "transporter") {
        updates.status = "pending";
      }

      const user = await storage.updateUser(userId, updates);
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      res.json({ user });
    } catch (error) {
      console.error("Select role error:", error);
      res.status(500).json({ error: "Échec de la sélection du rôle" });
    }
  });

  // Complete transporter profile
  app.post("/api/auth/complete-profile", upload.single("truckPhoto"), async (req, res) => {
    try {
      const { userId, name, city } = req.body;
      const truckPhoto = req.file;

      if (!userId || !name || !city || !truckPhoto) {
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

      res.json({ user });
    } catch (error) {
      console.error("Complete profile error:", error);
      res.status(500).json({ error: "Échec de la complétion du profil" });
    }
  });

  // Admin routes for driver validation
  app.get("/api/admin/pending-drivers", async (req, res) => {
    try {
      const drivers = await storage.getPendingDrivers();
      res.json(drivers);
    } catch (error) {
      console.error("Get pending drivers error:", error);
      res.status(500).json({ error: "Échec de récupération des transporteurs" });
    }
  });

  app.post("/api/admin/validate-driver/:id", async (req, res) => {
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

      res.json({ user });
    } catch (error) {
      console.error("Validate driver error:", error);
      res.status(500).json({ error: "Échec de la validation" });
    }
  });

  // Admin routes for blocking/unblocking users
  app.post("/api/admin/block-user/:id", async (req, res) => {
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

      res.json({ user });
    } catch (error) {
      console.error("Block user error:", error);
      res.status(500).json({ error: "Échec du blocage de l'utilisateur" });
    }
  });

  app.post("/api/admin/unblock-user/:id", async (req, res) => {
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

      res.json({ user });
    } catch (error) {
      console.error("Unblock user error:", error);
      res.status(500).json({ error: "Échec du déblocage de l'utilisateur" });
    }
  });

  // Delete user account permanently (admin)
  app.delete("/api/admin/users/:id", async (req, res) => {
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
  app.patch("/api/admin/transporters/:id", upload.single("truckPhoto"), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, city, phoneNumber, newPassword } = req.body;
      
      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "Transporteur non trouvé" });
      }

      if (user.role !== "transporter") {
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
      res.json({ user: updatedUser });
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
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Update transporter profile (with truck photo)
  app.patch("/api/users/:id/profile", upload.single("truckPhoto"), async (req, res) => {
    try {
      const { phoneNumber, name } = req.body;
      const truckPhoto = req.file;

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

      const user = await storage.updateUser(req.params.id, updateData);
      
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      res.json(user);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Échec de la mise à jour du profil" });
    }
  });

  // Update user PIN
  app.patch("/api/users/:id/pin", async (req, res) => {
    try {
      const { pin } = req.body;

      if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
        return res.status(400).json({ error: "Le PIN doit contenir exactement 6 chiffres" });
      }

      // Hash the new PIN
      const hashedPin = await bcrypt.hash(pin, 10);

      const user = await storage.updateUser(req.params.id, {
        passwordHash: hashedPin,
      });

      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Update PIN error:", error);
      res.status(500).json({ error: "Échec de la mise à jour du PIN" });
    }
  });

  // Update user device token for push notifications
  app.patch("/api/users/:id/device-token", async (req, res) => {
    console.log('🚨 🚨 🚨 [ROUTE HIT] /api/users/:id/device-token appelée !');
    console.log('🚨 userId:', req.params.id);
    console.log('🚨 req.body:', JSON.stringify(req.body, null, 2));
    console.log('🚨 Content-Type:', req.headers['content-type']);
    
    try {
      const { deviceToken } = req.body;

      if (!deviceToken) {
        console.error('❌ Device token manquant dans la requête');
        return res.status(400).json({ error: "Device token requis" });
      }

      // Parse device token to validate it's a proper PushSubscription
      try {
        const subscription = JSON.parse(deviceToken);
        console.log('📱 Device token valide reçu:', {
          userId: req.params.id,
          endpoint: subscription.endpoint?.substring(0, 50) + '...',
          hasKeys: !!(subscription.keys?.p256dh && subscription.keys?.auth)
        });
      } catch (e) {
        console.error('❌ Device token invalide (pas un JSON valide)');
        return res.status(400).json({ error: "Device token invalide" });
      }

      const user = await storage.updateUser(req.params.id, {
        deviceToken: deviceToken,
      });

      if (!user) {
        console.error(`❌ Utilisateur ${req.params.id} non trouvé`);
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      console.log(`✅ Device token enregistré pour ${user.name} (${user.phoneNumber}) - Role: ${user.role}`);
      res.json({ success: true });
    } catch (error) {
      console.error("❌ Erreur lors de l'enregistrement du device token:", error);
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

  app.get("/api/requests", async (req, res) => {
    try {
      const { clientId, status, transporterId, accepted, payments } = req.query;
      
      let requests;
      if (clientId) {
        requests = await storage.getRequestsByClient(clientId as string);
      } else if (payments === "true" && transporterId) {
        requests = await storage.getPaymentsByTransporter(transporterId as string);
      } else if (accepted === "true" && transporterId) {
        requests = await storage.getAcceptedRequestsByTransporter(transporterId as string);
      } else if (status === "open") {
        requests = await storage.getOpenRequests(transporterId as string | undefined);
      } else {
        requests = await storage.getAllTransportRequests();
      }
      
      // Enrich requests with offers count
      const enrichedRequests = await Promise.all(
        requests.map(async (request) => {
          const offers = await storage.getOffersByRequest(request.id);
          return {
            ...request,
            offersCount: offers.length,
          };
        })
      );
      
      res.json(enrichedRequests);
    } catch (error) {
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
      const request = await storage.updateTransportRequest(req.params.id, req.body);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to update request" });
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

  app.delete("/api/requests/:id", async (req, res) => {
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

  // Get accepted transporter info for a request
  app.get("/api/requests/:id/accepted-transporter", async (req, res) => {
    try {
      const request = await storage.getTransportRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      if (!request.acceptedOfferId) {
        return res.status(400).json({ error: "No accepted offer for this request" });
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
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transporter info" });
    }
  });

  // Republish a request (reset to open status)
  app.post("/api/requests/:id/republish", async (req, res) => {
    try {
      const request = await storage.getTransportRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      if (request.status !== "accepted" && request.status !== "completed") {
        return res.status(400).json({ error: "Only accepted or completed requests can be republished" });
      }

      // Delete all offers associated with this request
      await storage.deleteOffersByRequest(req.params.id);

      // Reset request to open status
      const updatedRequest = await storage.updateTransportRequest(req.params.id, {
        status: "open",
        acceptedOfferId: null,
      });

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
      if (!user || user.role !== "transporter") {
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
      if (!user || user.role !== "transporter") {
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
  app.get("/api/admin/users/:id/rib", async (req, res) => {
    try {
      const adminId = req.query.adminId as string;
      
      if (!adminId) {
        return res.status(401).json({ error: "Non authentifié" });
      }

      const admin = await storage.getUser(adminId);
      if (!admin || admin.role !== "admin") {
        return res.status(403).json({ error: "Accès refusé" });
      }

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

  app.patch("/api/admin/users/:id/rib", async (req, res) => {
    try {
      const { adminId, ribName, ribNumber } = req.body;
      
      if (!adminId) {
        return res.status(401).json({ error: "Non authentifié" });
      }

      const admin = await storage.getUser(adminId);
      if (!admin || admin.role !== "admin") {
        return res.status(403).json({ error: "Accès refusé" });
      }

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

        // Send SMS to client if this is the first offer
        const allOffers = await storage.getOffersByRequest(offer.requestId);
        if (allOffers.length === 1 && !request.smsSent) {
          const client = await storage.getUser(request.clientId);
          if (client?.phoneNumber) {
            const smsSent = await sendFirstOfferSMS(client.phoneNumber);
            if (smsSent) {
              // Mark SMS as sent to avoid sending again
              await storage.updateTransportRequest(request.id, { smsSent: true });
            }
          }
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
        
        // Add clientAmount (with commission) for each offer
        offers = offers.map(offer => ({
          ...offer,
          clientAmount: (parseFloat(offer.amount) * (1 + commissionRate / 100)).toFixed(2)
        }));
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
  app.delete("/api/admin/offers/:id", async (req, res) => {
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

  app.patch("/api/admin/offers/:id", async (req, res) => {
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
  app.get("/api/admin/settings", async (req, res) => {
    try {
      const settings = await storage.getAdminSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.patch("/api/admin/settings", async (req, res) => {
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

  app.get("/api/admin/stats", async (req, res) => {
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
      const activeTransporters = users.filter(u => u.role === "transporter" && u.isActive && u.status === "validated");
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
        u.role === "transporter" && u.rating !== null && parseFloat(u.rating) > 0
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
  app.get("/api/admin/transporters", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const offers = await storage.getAllOffers();
      const requests = await storage.getAllTransportRequests();
      
      // Filter transporters
      const transporters = users.filter(u => u.role === "transporter" && u.status === "validated");
      
      // Get admin settings for commission calculation
      const adminSettings = await storage.getAdminSettings();
      const commissionRate = adminSettings?.commissionPercentage ? parseFloat(adminSettings.commissionPercentage) : 10;
      
      // Build transporter stats
      const transportersWithStats = transporters.map(transporter => {
        // Get all accepted offers by this transporter
        const transporterAcceptedOffers = offers.filter(
          o => o.transporterId === transporter.id && o.status === "accepted"
        );
        
        // Calculate total trips (completed requests)
        const completedRequests = requests.filter(r => {
          const acceptedOffer = transporterAcceptedOffers.find(o => o.requestId === r.id);
          return acceptedOffer && r.status === "completed";
        });
        const totalTrips = completedRequests.length;
        
        // Calculate total commissions generated
        const totalCommissions = transporterAcceptedOffers.reduce((sum, offer) => {
          const amount = parseFloat(offer.amount);
          const commission = (amount * commissionRate) / 100;
          return sum + commission;
        }, 0);
        
        // Get last activity date (most recent offer created)
        const allTransporterOffers = offers.filter(o => o.transporterId === transporter.id);
        const lastActivityDate = allTransporterOffers.length > 0
          ? allTransporterOffers.reduce((latest, offer) => {
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
  app.get("/api/admin/transporters/:id/photo", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ error: "Transporteur non trouvé" });
      }
      
      if (user.role !== "transporter") {
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
  app.get("/api/admin/clients", async (req, res) => {
    try {
      const clientStats = await storage.getClientStatistics();
      res.json(clientStats);
    } catch (error) {
      console.error("Error fetching client statistics:", error);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  // Get all conversations (admin)
  app.get("/api/admin/conversations", async (req, res) => {
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
        (u: any) => u.role === "transporter" && u.status === "validated" && u.accountStatus === "active"
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
  app.get("/api/admin/client-transporter-contacts", async (req, res) => {
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
  app.post("/api/admin/sms/notify-transporters", async (req, res) => {
    try {
      const { adminId } = req.body;

      if (!adminId) {
        return res.status(401).json({ error: "Non authentifié" });
      }

      // Verify admin role
      const admin = await storage.getUser(adminId);
      if (!admin || admin.role !== "admin") {
        return res.status(403).json({ error: "Accès refusé - Admin requis" });
      }

      // Get all validated transporters
      const allUsers = await storage.getAllUsers();
      const validatedTransporters = allUsers.filter(
        user => user.role === "transporter" && user.status === "validated" && user.accountStatus === "active"
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
  app.post("/api/admin/sms/send", async (req, res) => {
    try {
      const { adminId, targetAudience, message } = req.body;

      if (!adminId || !targetAudience || !message) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
      }

      // Verify admin role
      const admin = await storage.getUser(adminId);
      if (!admin || admin.role !== "admin") {
        return res.status(403).json({ error: "Accès refusé - Admin requis" });
      }

      if (message.length > 160) {
        return res.status(400).json({ error: "Le message ne peut pas dépasser 160 caractères" });
      }

      // Get target users based on audience
      const allUsers = await storage.getAllUsers();
      let targetUsers: typeof allUsers = [];

      if (targetAudience === "transporters") {
        targetUsers = allUsers.filter(
          user => user.role === "transporter" && user.status === "validated" && user.accountStatus === "active"
        );
      } else if (targetAudience === "clients") {
        targetUsers = allUsers.filter(
          user => user.role === "client" && user.accountStatus === "active"
        );
      } else if (targetAudience === "both") {
        targetUsers = allUsers.filter(
          user => (
            (user.role === "client" && user.accountStatus === "active") ||
            (user.role === "transporter" && user.status === "validated" && user.accountStatus === "active")
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
  app.post("/api/admin/sms/send-single", async (req, res) => {
    try {
      const { adminId, phoneNumber, message } = req.body;

      if (!adminId || !phoneNumber || !message) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
      }

      // Verify admin role
      const admin = await storage.getUser(adminId);
      if (!admin || admin.role !== "admin") {
        return res.status(403).json({ error: "Accès refusé - Admin requis" });
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
  app.get("/api/admin/sms/history", async (req, res) => {
    try {
      const adminId = req.query.adminId as string;

      if (!adminId) {
        return res.status(401).json({ error: "Non authentifié" });
      }

      // Verify admin role
      const admin = await storage.getUser(adminId);
      if (!admin || admin.role !== "admin") {
        return res.status(403).json({ error: "Accès refusé - Admin requis" });
      }

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
  app.delete("/api/admin/sms/history/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.query.adminId as string;

      if (!adminId) {
        return res.status(401).json({ error: "Non authentifié" });
      }

      // Verify admin role
      const admin = await storage.getUser(adminId);
      if (!admin || admin.role !== "admin") {
        return res.status(403).json({ error: "Accès refusé - Admin requis" });
      }

      await storage.deleteSmsHistory(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Erreur suppression historique SMS:", error);
      res.status(500).json({ error: "Erreur lors de la suppression" });
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
