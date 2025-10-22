// PWA and Push Notification utilities for CamionBack

/**
 * Register service worker for PWA functionality
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      
      console.log('✅ Service Worker enregistré pour CamionBack:', registration.scope);
      
      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Check every hour
      
      return registration;
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement du Service Worker:', error);
      return null;
    }
  } else {
    console.warn('⚠️ Service Worker non supporté par ce navigateur');
    return null;
  }
}

/**
 * Request push notification permission and subscribe
 */
export async function requestPushPermission(): Promise<PushSubscription | null> {
  if (!('Notification' in window)) {
    console.warn('⚠️ Notifications non supportées par ce navigateur');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('ℹ️ Permission de notification refusée');
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    
    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        // VAPID public key - matches server configuration
        import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
      )
    });

    console.log('✅ Souscription aux notifications push réussie');
    return subscription;
  } catch (error) {
    console.error('❌ Erreur lors de la souscription aux notifications:', error);
    return null;
  }
}

/**
 * Get current push subscription
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return subscription;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de la souscription:', error);
      return null;
    }
  }
  return null;
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribePush(): Promise<boolean> {
  try {
    const subscription = await getPushSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      console.log('✅ Désinscription des notifications push réussie');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Erreur lors de la désinscription:', error);
    return false;
  }
}

/**
 * Convert base64 string to Uint8Array for VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if PWA is installed
 */
export function isPWAInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}

/**
 * Prompt user to install PWA
 */
export function setupPWAInstallPrompt(): void {
  let deferredPrompt: any = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    console.log('📱 PWA peut être installée');
    
    // You can show a custom install button here
    // For example, dispatch a custom event or update app state
    window.dispatchEvent(new CustomEvent('pwa-installable', { detail: deferredPrompt }));
  });

  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA installée avec succès');
    deferredPrompt = null;
  });
}

/**
 * Extract device token from push subscription for backend storage
 */
export function getDeviceTokenFromSubscription(subscription: PushSubscription): string {
  return JSON.stringify(subscription);
}

/**
 * Initialize PWA features
 */
export async function initializePWA(): Promise<void> {
  console.log('🚀 Initialisation PWA CamionBack...');
  
  // Register service worker
  await registerServiceWorker();
  
  // Setup install prompt handler
  setupPWAInstallPrompt();
  
  // Log PWA status
  if (isPWAInstalled()) {
    console.log('✅ CamionBack fonctionne en mode PWA');
  } else {
    console.log('ℹ️ CamionBack en mode navigateur web');
  }
}
