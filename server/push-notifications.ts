// Push Notification Service using Web Push API
import webpush from "web-push";

const INFOBIP_BASE_URL = process.env.INFOBIP_BASE_URL || "https://1g692n.api.infobip.com";
const INFOBIP_API_KEY = process.env.INFOBIP_API_KEY;

// VAPID keys for Web Push - loaded from environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('⚠️ VAPID keys not configured! Push notifications will not work.');
  console.error('Please set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables.');
}

// Configure web-push with VAPID details
webpush.setVapidDetails(
  'mailto:contact@camionback.ma',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
}

interface SendPushOptions {
  deviceToken: string;
  notification: PushNotificationPayload;
}

/**
 * Send push notification via Web Push API
 */
export async function sendPushNotification(options: SendPushOptions): Promise<boolean> {
  try {
    // Parse device token (which is a PushSubscription object)
    let subscription;
    try {
      subscription = JSON.parse(options.deviceToken);
    } catch (parseError) {
      console.error('Push notification: device token invalide');
      return false;
    }
    
    // Prepare the notification payload
    // Note: Push notifications require absolute URLs for icons
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : 'https://camionback.com';
    
    const payload = {
      title: options.notification.title,
      body: options.notification.body,
      icon: options.notification.icon || `${baseUrl}/apple-touch-icon.png`,
      badge: options.notification.badge || `${baseUrl}/icons/notification-badge.png`,
      url: options.notification.url || '/',
    };

    // Send notification via web-push
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      console.log(`✅ Push notification envoyée: ${payload.title}`);
      return true;
    } catch (sendError: any) {
      // Handle subscription expiration/invalidation
      if (sendError.statusCode === 404 || sendError.statusCode === 410) {
        console.warn(`⚠️ Subscription expirée (code ${sendError.statusCode})`);
      } else {
        console.error('Erreur push notification:', sendError.message);
      }
      return false;
    }
  } catch (error) {
    console.error('Erreur critique push notification:', error);
    return false;
  }
}

/**
 * Send push notification to multiple devices
 */
export async function sendBulkPushNotifications(
  deviceTokens: string[],
  notification: PushNotificationPayload
): Promise<{ success: number; failed: number }> {
  const results = await Promise.allSettled(
    deviceTokens.map(deviceToken =>
      sendPushNotification({ deviceToken, notification })
    )
  );

  const success = results.filter(r => r.status === 'fulfilled' && r.value).length;
  const failed = results.length - success;

  console.log(`📊 Notifications envoyées: ${success} réussies, ${failed} échouées`);
  
  return { success, failed };
}

/**
 * Notification templates for different events
 */
export const NotificationTemplates = {
  newOffer: (requestRef: string) => ({
    title: '🚛 Nouvelle offre reçue !',
    body: `Une nouvelle offre a été soumise pour votre demande ${requestRef}`,
    url: '/client-dashboard'
  }),

  offerAccepted: (requestRef: string) => ({
    title: '✅ Offre acceptée !',
    body: `Votre offre pour ${requestRef} a été acceptée`,
    url: '/transporter-dashboard'
  }),

  newMessage: (senderName: string) => ({
    title: '💬 Nouveau message',
    body: `${senderName} vous a envoyé un message`,
    url: '/messages'
  }),

  orderValidated: (requestRef: string) => ({
    title: '🎉 Commande validée !',
    body: `Votre commande ${requestRef} a été validée par l'admin`,
    url: '/client-dashboard'
  }),

  paymentReceived: (amount: string) => ({
    title: '💰 Paiement reçu',
    body: `Un paiement de ${amount} MAD a été reçu`,
    url: '/transporter-dashboard'
  }),

  accountValidated: () => ({
    title: '✅ Compte validé !',
    body: 'Votre compte transporteur a été validé. Vous pouvez maintenant accepter des commandes !',
    url: '/transporter-dashboard'
  }),

  newReport: (requestRef: string) => ({
    title: '⚠️ Nouveau litige',
    body: `Un litige a été signalé sur ${requestRef}`,
    url: '/admin-dashboard'
  }),

  disputeResolved: (requestRef: string) => ({
    title: '✅ Litige résolu',
    body: `Le litige sur ${requestRef} a été résolu`,
    url: '/dashboard'
  }),

  manualAssignment: (requestRef: string) => ({
    title: '📦 Nouvelle mission assignée !',
    body: `Vous avez été assigné à la mission ${requestRef} par un coordinateur`,
    url: '/transporter-dashboard'
  }),

  transporterAssigned: (requestRef: string) => ({
    title: '✅ Transporteur assigné !',
    body: `Un transporteur a été assigné à votre commande ${requestRef}`,
    url: '/client-dashboard'
  }),

  // New coordinator-centric workflow notifications
  requestQualified: (requestRef: string, clientTotal: number) => ({
    title: '✅ Demande qualifiée !',
    body: `Votre demande ${requestRef} a été évaluée. Montant total: ${clientTotal} MAD`,
    url: '/client-dashboard'
  }),

  requestPublished: (requestRef: string) => ({
    title: '🚛 Nouvelle mission disponible !',
    body: `Mission ${requestRef} publiée - Cliquez pour exprimer votre intérêt`,
    url: '/transporter-dashboard'
  }),

  transporterInterested: (requestRef: string, transporterName: string) => ({
    title: '👋 Transporteur intéressé !',
    body: `${transporterName} est intéressé par votre mission ${requestRef}`,
    url: '/client-dashboard'
  }),

  clientContacted: (requestRef: string, clientName: string) => ({
    title: '💬 Le client vous a contacté !',
    body: `${clientName} souhaite discuter de la mission ${requestRef}`,
    url: '/transporter-dashboard'
  }),

  requestArchived: (requestRef: string, reason: string) => ({
    title: '📁 Demande archivée',
    body: `Votre demande ${requestRef} a été archivée. Motif: ${reason}`,
    url: '/client-dashboard'
  }),

  coordinatorAssigned: (requestRef: string) => ({
    title: '📋 Nouvelle demande assignée',
    body: `La demande ${requestRef} vous a été assignée pour qualification`,
    url: '/coordinator-dashboard'
  }),

  clientChoseYou: (requestRef: string) => ({
    title: '🎉 Félicitations ! Un client vous a choisi',
    body: `Vous avez été sélectionné pour la mission ${requestRef}`,
    url: '/transporter-dashboard'
  }),

  transporterSelected: (requestRef: string, transporterName: string) => ({
    title: '✅ Transporteur sélectionné',
    body: `Vous avez choisi ${transporterName} pour ${requestRef}`,
    url: '/client-dashboard'
  })
};

/**
 * Helper function to send notification to a user by their ID
 */
export async function sendNotificationToUser(
  userId: string,
  notification: PushNotificationPayload,
  storage: any // IStorage interface
): Promise<boolean> {
  try {
    const user = await storage.getUser(userId);
    
    if (!user || !user.deviceToken) {
      return false;
    }
    
    return await sendPushNotification({
      deviceToken: user.deviceToken,
      notification
    });
  } catch (error) {
    console.error('Erreur envoi notification:', error);
    return false;
  }
}

/**
 * Helper to update user's device token
 */
export async function updateUserDeviceToken(
  userId: string,
  deviceToken: string,
  storage: any
): Promise<boolean> {
  try {
    await storage.updateUser(userId, { deviceToken });
    console.log(`✅ Device token mis à jour pour l'utilisateur ${userId}`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de la mise à jour du device token:`, error);
    return false;
  }
}
