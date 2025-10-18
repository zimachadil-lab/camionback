import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import multer from "multer";
import { z } from "zod";
import bcrypt from "bcrypt";
import { 
  insertUserSchema, 
  insertOtpCodeSchema, 
  insertTransportRequestSchema,
  insertOfferSchema,
  insertChatMessageSchema,
  insertNotificationSchema
} from "@shared/schema";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
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
        return res.status(404).json({ error: "Transporteur non trouvé" });
      }

      // TODO: Send notification to transporter about validation status

      res.json({ user });
    } catch (error) {
      console.error("Validate driver error:", error);
      res.status(500).json({ error: "Échec de la validation" });
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

  // Transport request routes
  app.post("/api/requests", async (req, res) => {
    try {
      console.log("Request body received:", JSON.stringify(req.body, null, 2));
      const requestData = insertTransportRequestSchema.parse(req.body);
      const request = await storage.createTransportRequest(requestData);
      
      // TODO: Send WhatsApp notifications to transporters in production
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
      
      res.json(requests);
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
      }
      
      res.json(offers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch offers" });
    }
  });

  app.patch("/api/offers/:id", async (req, res) => {
    try {
      const offer = await storage.updateOffer(req.params.id, req.body);
      if (!offer) {
        return res.status(404).json({ error: "Offer not found" });
      }
      res.json(offer);
    } catch (error) {
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

      // Update offer status with commission details
      await storage.updateOffer(req.params.id, { 
        status: "accepted",
        message: offer.message ? `${offer.message}\n\nCommission CamionBack: ${commissionAmount.toFixed(2)} MAD (${commissionRate}%)\nTotal: ${totalWithCommission.toFixed(2)} MAD` : undefined
      });

      // Update request with accepted offer
      await storage.updateTransportRequest(offer.requestId, {
        status: "accepted",
        acceptedOfferId: req.params.id,
      });

      // Create notification for transporter
      await storage.createNotification({
        userId: offer.transporterId,
        type: "offer_accepted",
        title: "Offre acceptée !",
        message: `${client?.name || "Le client"} a accepté votre offre de ${offer.amount} MAD pour la demande ${request?.referenceId}. Commission: ${commissionAmount.toFixed(2)} MAD. Total: ${totalWithCommission.toFixed(2)} MAD`,
        relatedId: offer.id
      });

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

  // Chat routes
  app.post("/api/chat/messages", async (req, res) => {
    try {
      const messageData = insertChatMessageSchema.parse(req.body);
      const message = await storage.createChatMessage(messageData);
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
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

  app.get("/api/admin/stats", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const requests = await storage.getAllTransportRequests();
      
      const stats = {
        activeClients: users.filter(u => u.role === "client" && u.isActive).length,
        activeDrivers: users.filter(u => u.role === "transporter" && u.isActive).length,
        totalRequests: requests.length,
        completedRequests: requests.filter(r => r.status === "completed").length,
        openRequests: requests.filter(r => r.status === "open").length,
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
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
