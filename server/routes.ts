import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import multer from "multer";
import { z } from "zod";
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
  // Auth routes
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number required" });
      }

      // Generate 6-digit OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await storage.createOtp({
        phoneNumber,
        code,
        expiresAt,
      });

      // TODO: Send OTP via Twilio SMS in production
      console.log(`OTP for ${phoneNumber}: ${code}`);

      res.json({ success: true, message: "OTP sent" });
    } catch (error) {
      res.status(500).json({ error: "Failed to send OTP" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { phoneNumber, code } = req.body;
      
      // In development mode, accept any 6-digit code for easier testing
      const isDevelopment = process.env.NODE_ENV === "development";
      const isValidFormat = /^\d{6}$/.test(code);
      
      let isValid = false;
      if (isDevelopment && isValidFormat) {
        isValid = true;
      } else {
        isValid = await storage.verifyOtp(phoneNumber, code);
      }
      
      if (!isValid) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      // Check if user exists
      let user = await storage.getUserByPhone(phoneNumber);
      
      // Create new user if doesn't exist
      if (!user) {
        // Determine role based on phone number for testing
        let role = "client"; // default
        
        // Test transporters
        if (phoneNumber.includes("98765") || phoneNumber.includes("0698765432")) {
          role = "transporter";
        }
        // Test admin
        else if (phoneNumber.includes("000000") || phoneNumber.includes("0612000000")) {
          role = "admin";
        }
        
        // Generate default name based on role
        let defaultName = "Client";
        if (role === "transporter") {
          defaultName = "Transporteur Pro";
        } else if (role === "admin") {
          defaultName = "Administrateur";
        }
        
        user = await storage.createUser({
          phoneNumber,
          role,
          name: defaultName,
          truckPhotos: null,
          rating: role === "transporter" ? "4.5" : null,
          totalTrips: role === "transporter" ? 25 : null,
          isActive: null,
        });
      }

      res.json({ user });
    } catch (error) {
      res.status(500).json({ error: "Verification failed" });
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
      const { clientId, status } = req.query;
      
      let requests;
      if (clientId) {
        requests = await storage.getRequestsByClient(clientId as string);
      } else if (status === "open") {
        requests = await storage.getOpenRequests();
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

  // Offer routes
  app.post("/api/offers", async (req, res) => {
    try {
      const offerData = insertOfferSchema.parse(req.body);
      const offer = await storage.createOffer(offerData);
      
      // Get request and transporter info for notification
      const request = await storage.getTransportRequest(offer.requestId);
      const transporter = await storage.getUser(offer.transporterId);
      
      if (request) {
        // Create notification for client
        await storage.createNotification({
          userId: request.clientId,
          type: "offer_received",
          title: "Nouvelle offre reçue",
          message: `${transporter?.name || "Un transporteur"} a soumis une offre de ${offer.amount} MAD pour votre demande ${request.referenceId}`,
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
      } else if (transporterId) {
        offers = await storage.getOffersByTransporter(transporterId as string);
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
