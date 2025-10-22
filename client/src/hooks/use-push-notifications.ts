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

      // Only request permission if not already granted or denied
      if (permission === 'default') {
        try {
          const subscription = await requestPushPermission();
          
          if (subscription) {
            // Convert subscription to device token string
            const deviceToken = getDeviceTokenFromSubscription(subscription);
            
            // Register device token with backend
            await apiRequest('PATCH', `/api/users/${userId}/device-token`, {
              deviceToken
            });
            
            setIsSubscribed(true);
            setPermission('granted');
            console.log('✅ Notifications push activées');
          } else {
            setPermission('denied');
            console.log('ℹ️ Permission de notification refusée');
          }
        } catch (error) {
          console.error('❌ Erreur lors de la configuration des notifications:', error);
        }
      }
    }

    setupPushNotifications();
  }, [userId, enabled, permission]);

  return {
    isSubscribed,
    permission
  };
}
