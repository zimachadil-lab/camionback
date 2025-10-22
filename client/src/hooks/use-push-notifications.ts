// Hook pour gérer les notifications push
import { useEffect, useState } from "react";
import { requestPushPermission, getDeviceTokenFromSubscription } from "@/lib/pwa";
import { apiRequest } from "@/lib/queryClient";

interface UsePushNotificationsOptions {
  userId: string | null;
  enabled: boolean;
}

export function usePushNotifications({ userId, enabled }: UsePushNotificationsOptions) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check current permission status
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    // Request push notification permission and register device token
    async function setupPushNotifications() {
      if (!enabled || !userId) {
        console.log('ℹ️ Push notifications désactivées ou userId manquant');
        return;
      }

      try {
        console.log('🔔 Configuration des push notifications pour userId:', userId);
        let subscription = null;

        // If permission already granted, get existing subscription
        if (permission === 'granted') {
          console.log('✅ Permission déjà accordée, récupération de la souscription...');
          const { getPushSubscription } = await import('@/lib/pwa');
          subscription = await getPushSubscription();
          
          // If no subscription exists, request a new one
          if (!subscription) {
            console.log('ℹ️ Aucune souscription existante, création d\'une nouvelle...');
            subscription = await requestPushPermission();
          } else {
            console.log('✅ Souscription existante trouvée');
          }
        } 
        // If permission is default, request permission
        else if (permission === 'default') {
          console.log('🔔 Permission par défaut, demande de permission...');
          subscription = await requestPushPermission();
        }
        
        // If we have a subscription, register it with backend
        if (subscription) {
          const deviceToken = getDeviceTokenFromSubscription(subscription);
          console.log('📤 Envoi du device token au serveur...');
          
          await apiRequest('PATCH', `/api/users/${userId}/device-token`, {
            deviceToken
          });
          
          setIsSubscribed(true);
          setPermission('granted');
          console.log('✅ Notifications push activées et synchronisées avec le serveur');
        } else if (permission === 'denied') {
          console.log('ℹ️ Permission de notification refusée par l\'utilisateur');
        }
      } catch (error) {
        console.error('❌ Erreur lors de la configuration des notifications:', error);
      }
    }

    setupPushNotifications();
  }, [userId, enabled, permission]);

  return {
    isSubscribed,
    permission
  };
}
