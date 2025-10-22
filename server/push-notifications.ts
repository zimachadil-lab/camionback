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
    console.log('🚀 === DÉBUT ENVOI PUSH NOTIFICATION ===');
    
    // Parse device token (which is a PushSubscription object)
    let subscription;
    try {
      subscription = JSON.parse(options.deviceToken);
      console.log('✅ Device token parsé avec succès:', {
        endpoint: subscription.endpoint?.substring(0, 60) + '...',
        hasP256dh: !!subscription.keys?.p256dh,
        hasAuth: !!subscription.keys?.auth
      });
    } catch (parseError) {
      console.error('❌ Device token invalide (JSON parse failed):', parseError);
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

    console.log('📨 Envoi notification push via Web Push API:', {
      endpoint: subscription.endpoint?.substring(0, 60) + '...',
      title: payload.title,
      body: payload.body,
      url: payload.url
    });

    // Send notification via web-push
    try {
      const result = await webpush.sendNotification(subscription, JSON.stringify(payload));
      console.log('✅ ✅ ✅ PUSH NOTIFICATION ENVOYÉE AVEC SUCCÈS ✅ ✅ ✅');
      console.log('📊 Résultat Web Push:', {
        statusCode: result.statusCode,
        body: result.body
      });
      console.log('🚀 === FIN ENVOI PUSH NOTIFICATION (SUCCÈS) ===');
      return true;
    } catch (sendError: any) {
      console.error('❌ ❌ ❌ ÉCHEC ENVOI PUSH NOTIFICATION ❌ ❌ ❌');
      
      // Handle subscription expiration/invalidation
      if (sendError.statusCode === 404 || sendError.statusCode === 410) {
        console.warn('⚠️ Subscription expirée ou invalide (code:', sendError.statusCode, ')');
        console.warn('⚠️ Cette subscription devrait être supprimée de la base de données');
      } else {
        console.error('❌ Erreur lors de l\'envoi Web Push:', {
          statusCode: sendError.statusCode,
          message: sendError.message,
          body: sendError.body
        });
      }
      console.log('🚀 === FIN ENVOI PUSH NOTIFICATION (ÉCHEC) ===');
      return false;
    }
  } catch (error) {
    console.error('❌ ❌ ❌ ERREUR CRITIQUE lors de l\'envoi de la notification push ❌ ❌ ❌');
    console.error('Détails:', error);
    console.log('🚀 === FIN ENVOI PUSH NOTIFICATION (ERREUR CRITIQUE) ===');
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
    console.log(`🔍 Recherche de l'utilisateur ${userId} pour envoi push...`);
    const user = await storage.getUserById(userId);
    
    if (!user) {
      console.error(`❌ Utilisateur ${userId} introuvable`);
      return false;
    }

    console.log(`✅ Utilisateur trouvé: ${user.name} (${user.phoneNumber}) - Role: ${user.role}`);
    
    if (!user.deviceToken) {
      console.log(`⚠️ Utilisateur ${user.name} (${user.phoneNumber}) n'a pas de device token configuré`);
      console.log(`⚠️ L'utilisateur doit autoriser les notifications dans son navigateur`);
      return false;
    }

    console.log(`✅ Device token trouvé pour ${user.name}, envoi en cours...`);
    
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
