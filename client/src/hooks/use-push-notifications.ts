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
        return;
      }

      try {
        let subscription = null;

        // If permission already granted, get existing subscription
        if (permission === 'granted') {
          const { getPushSubscription } = await import('@/lib/pwa');
          subscription = await getPushSubscription();
          
          // If no subscription exists, request a new one
          if (!subscription) {
            subscription = await requestPushPermission();
          }
        } 
        // If permission is default, request permission
        else if (permission === 'default') {
          subscription = await requestPushPermission();
        }
        
        // If we have a subscription, register it with backend
        if (subscription) {
          const deviceToken = getDeviceTokenFromSubscription(subscription);
          
          await apiRequest('PATCH', `/api/users/${userId}/device-token`, {
            deviceToken
          });
          
          setIsSubscribed(true);
          setPermission('granted');
          console.log('✅ Notifications push activées et synchronisées');
        } else if (permission === 'denied') {
          console.log('ℹ️ Permission de notification refusée');
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
