// PWA and Push Notification utilities for CamionBack

/**
 * Register service worker for PWA functionality
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none' // Force check for updates every time
      });
      
      console.log('✅ Service Worker enregistré pour CamionBack:', registration.scope);
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 Nouvelle version du Service Worker détectée');
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('✨ Nouvelle version disponible, rafraîchissement recommandé');
              // Notify the user that a new version is available
              window.dispatchEvent(new CustomEvent('sw-update-available'));
            }
          });
        }
      });
      
      // Listen for messages from the service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SW_ACTIVATED') {
          console.log(`✅ Service Worker version ${event.data.version} activé`);
        }
      });
      
      // Check for updates more frequently
      setInterval(() => {
        console.log('🔍 Vérification des mises à jour du Service Worker...');
        registration.update();
      }, 30 * 60 * 1000); // Check every 30 minutes
      
      // Immediate update check
      registration.update();
      
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
 * Fetch VAPID public key from server
 */
async function getVapidPublicKey(): Promise<string | null> {
  try {
    const response = await fetch('/api/pwa/vapid-public-key');
    if (!response.ok) {
      console.error('❌ Erreur lors de la récupération de la clé VAPID');
      return null;
    }
    const data = await response.json();
    console.log('✅ Clé VAPID publique récupérée depuis le serveur');
    return data.publicKey;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la clé VAPID:', error);
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
    console.log('🔔 Demande de permission de notification...');
    const permission = await Notification.requestPermission();
    console.log('🔔 Permission de notification:', permission);
    
    if (permission !== 'granted') {
      console.log('ℹ️ Permission de notification refusée');
      return null;
    }

    console.log('⏳ Attente du Service Worker...');
    const registration = await navigator.serviceWorker.ready;
    console.log('✅ Service Worker prêt');

    // Get VAPID public key from server
    console.log('🔑 Récupération de la clé VAPID publique...');
    const vapidPublicKey = await getVapidPublicKey();
    if (!vapidPublicKey) {
      console.error('❌ Impossible de récupérer la clé VAPID publique');
      return null;
    }
    
    console.log('📱 Souscription aux push notifications...');
    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    console.log('✅ Souscription aux notifications push réussie');
    console.log('📋 Détails de la souscription:', {
      endpoint: subscription.endpoint.substring(0, 50) + '...',
      hasKeys: !!subscription.getKey('p256dh') && !!subscription.getKey('auth')
    });
    
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
