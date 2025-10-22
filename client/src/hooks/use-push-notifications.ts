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
        console.log('ℹ️ [usePushNotifications] Push notifications désactivées ou userId manquant');
        return;
      }

      try {
        console.log('🔔 === [usePushNotifications] DÉBUT CONFIGURATION PUSH NOTIFICATIONS ===');
        console.log('🔔 [usePushNotifications] userId:', userId);
        console.log('🔔 [usePushNotifications] permission actuelle:', permission);
        
        let subscription = null;

        // If permission already granted, get existing subscription
        if (permission === 'granted') {
          console.log('✅ [usePushNotifications] Permission déjà accordée');
          console.log('🔍 [usePushNotifications] Récupération de la souscription existante...');
          
          const { getPushSubscription } = await import('@/lib/pwa');
          subscription = await getPushSubscription();
          
          if (subscription) {
            console.log('✅ [usePushNotifications] Souscription existante trouvée:', {
              endpoint: subscription.endpoint.substring(0, 50) + '...',
              expirationTime: subscription.expirationTime
            });
          } else {
            console.log('⚠️ [usePushNotifications] Aucune souscription existante !');
            console.log('🔧 [usePushNotifications] Création d\'une nouvelle subscription...');
            subscription = await requestPushPermission();
          }
        } 
        // If permission is default, request permission
        else if (permission === 'default') {
          console.log('🔔 [usePushNotifications] Permission par défaut, demande de permission...');
          subscription = await requestPushPermission();
        } else if (permission === 'denied') {
          console.log('❌ [usePushNotifications] Permission refusée par l\'utilisateur');
        }
        
        // If we have a subscription, register it with backend
        if (subscription) {
          console.log('✅ [usePushNotifications] Subscription obtenue !');
          
          const deviceToken = getDeviceTokenFromSubscription(subscription);
          console.log('📤 [usePushNotifications] Envoi du device token au serveur...');
          console.log('📤 [usePushNotifications] Device token length:', deviceToken.length);
          console.log('📤 [usePushNotifications] URL:', `/api/users/${userId}/device-token`);
          console.log('📤 [usePushNotifications] Method: PATCH');
          console.log('📤 [usePushNotifications] Body:', JSON.stringify({ deviceToken }, null, 2));
          
          try {
            console.log('🚀 [usePushNotifications] Appel de apiRequest...');
            const response = await apiRequest('PATCH', `/api/users/${userId}/device-token`, {
              deviceToken
            });
            console.log('✅ [usePushNotifications] apiRequest retourné avec succès !');
            console.log('✅ [usePushNotifications] Response status:', response.status);
            console.log('✅ [usePushNotifications] Response ok:', response.ok);
            
            // Parse response to check success
            const data = await response.json();
            console.log('✅ [usePushNotifications] Response data:', data);
          } catch (apiError) {
            console.error('❌ ❌ ❌ [usePushNotifications] ERREUR LORS DE L\'ENVOI DU TOKEN ❌ ❌ ❌');
            console.error('❌ [usePushNotifications] Type:', apiError instanceof Error ? apiError.name : typeof apiError);
            console.error('❌ [usePushNotifications] Message:', apiError instanceof Error ? apiError.message : String(apiError));
            console.error('❌ [usePushNotifications] Stack:', apiError instanceof Error ? apiError.stack : 'N/A');
            throw apiError; // Re-throw to be caught by outer catch
          }
          
          setIsSubscribed(true);
          setPermission('granted');
          console.log('✅ ✅ ✅ [usePushNotifications] PUSH NOTIFICATIONS ACTIVÉES ET SYNCHRONISÉES ! ✅ ✅ ✅');
        } else {
          console.log('⚠️ [usePushNotifications] Aucune subscription obtenue');
        }
      } catch (error) {
        console.error('❌ ❌ ❌ [usePushNotifications] ERREUR CONFIGURATION ❌ ❌ ❌');
        console.error('❌ [usePushNotifications] Erreur:', error);
      }
    }

    setupPushNotifications();
  }, [userId, enabled, permission]);

  return {
    isSubscribed,
    permission
  };
}
