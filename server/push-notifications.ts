// Push Notification Service using Web Push API
import webpush from "web-push";

const INFOBIP_BASE_URL = process.env.INFOBIP_BASE_URL || "https://1g692n.api.infobip.com";
const INFOBIP_API_KEY = process.env.INFOBIP_API_KEY;

// VAPID keys for Web Push (generate with: web-push generate-vapid-keys)
// For production, store these in environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'UUxXMr2vJ7gvmxUzTN9MhsLIu7oN3XZRkxqY9vXuPYM';

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
      console.error('❌ Device token invalide:', parseError);
      return false;
    }
    
    // Prepare the notification payload
    const payload = {
      title: options.notification.title,
      body: options.notification.body,
      icon: options.notification.icon || '/icons/icon-192.png',
      badge: options.notification.badge || '/icons/icon-192.png',
      url: options.notification.url || '/',
    };

    console.log('📨 Envoi notification push:', {
      endpoint: subscription.endpoint?.substring(0, 50) + '...',
      title: payload.title,
      body: payload.body
    });

    // Send notification via web-push
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      console.log('✅ Notification push envoyée avec succès');
      return true;
    } catch (sendError: any) {
      // Handle subscription expiration/invalidation
      if (sendError.statusCode === 404 || sendError.statusCode === 410) {
        console.warn('⚠️ Subscription expirée ou invalide, devrait être supprimée');
        // In production, you would remove this subscription from the database
      } else {
        console.error('❌ Erreur lors de l\'envoi Web Push:', sendError);
      }
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de la notification push:', error);
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
    const user = await storage.getUserById(userId);
    
    if (!user || !user.deviceToken) {
      console.log(`ℹ️ Utilisateur ${userId} n'a pas de device token configuré`);
      return false;
    }

    return await sendPushNotification({
      deviceToken: user.deviceToken,
      notification
    });
  } catch (error) {
    console.error(`❌ Erreur lors de l'envoi de notification à l'utilisateur ${userId}:`, error);
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
