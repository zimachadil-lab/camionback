import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PushDiagnostic() {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<string>("Checking...");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null);
  const [vapidKey, setVapidKey] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      setUser(JSON.parse(userJson));
    }

    checkServiceWorker();
    checkNotificationPermission();
    checkPushSubscription();
    fetchVapidKey();
  }, []);

  const checkServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        if (registration.active) {
          setServiceWorkerStatus("✅ Actif");
        } else if (registration.installing) {
          setServiceWorkerStatus("⏳ Installation en cours...");
        } else {
          setServiceWorkerStatus("⚠️ Non actif");
        }
      } else {
        setServiceWorkerStatus("❌ Non enregistré");
      }
    } else {
      setServiceWorkerStatus("❌ Non supporté");
    }
  };

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  };

  const checkPushSubscription = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setPushSubscription(subscription);
        
        if (subscription) {
          console.log('📱 Push Subscription Details:', {
            endpoint: subscription.endpoint,
            expirationTime: subscription.expirationTime,
            keys: {
              p256dh: subscription.getKey('p256dh'),
              auth: subscription.getKey('auth')
            }
          });
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de la subscription:', error);
      }
    }
  };

  const fetchVapidKey = async () => {
    try {
      const response = await fetch('/api/pwa/vapid-public-key');
      const data = await response.json();
      setVapidKey(data.publicKey);
    } catch (error) {
      console.error('Erreur lors de la récupération de la clé VAPID:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        toast({
          title: "✅ Permission accordée",
          description: "Rechargez la page pour activer les notifications push"
        });
        
        // Refresh subscription after permission granted
        setTimeout(() => {
          checkPushSubscription();
        }, 1000);
      }
    }
  };

  const sendTestNotification = async () => {
    if (!user?.id) {
      toast({
        title: "❌ Erreur",
        description: "Vous devez être connecté pour tester",
        variant: "destructive"
      });
      return;
    }

    if (!pushSubscription) {
      toast({
        title: "❌ Pas de subscription",
        description: "Autorisez d'abord les notifications",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    
    try {
      console.log('🧪 Envoi d\'une notification de test...');
      
      const response: any = await apiRequest('POST', '/api/pwa/test-push', {
        userId: user.id
      });

      if (response.success) {
        toast({
          title: "✅ Notification envoyée !",
          description: "Vérifiez votre appareil. Si rien n'apparaît, consultez les logs du service worker."
        });
      } else {
        toast({
          title: "❌ Échec",
          description: response.message || "Erreur lors de l'envoi",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Erreur lors du test:', error);
      toast({
        title: "❌ Erreur",
        description: error.message || "Erreur lors du test",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const testBrowserNotification = async () => {
    console.log('🧪 [Test Navigateur] Début du test de notification navigateur');
    console.log('🧪 [Test Navigateur] Permission actuelle:', Notification.permission);
    
    if (Notification.permission === 'granted') {
      try {
        console.log('🧪 [Test Navigateur] Permission accordée, création de la notification...');
        console.log('🧪 [Test Navigateur] Attente du Service Worker...');
        
        const registration = await navigator.serviceWorker.ready;
        console.log('✅ [Test Navigateur] Service Worker prêt:', registration.active?.state);
        
        console.log('🧪 [Test Navigateur] Appel de registration.showNotification()...');
        const notificationOptions = {
          body: 'Ceci est une notification de test via Service Worker (compatible Android)',
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          vibrate: [200, 100, 200],
          tag: 'test-notification',
          requireInteraction: false
        };
        
        await registration.showNotification('🧪 Test Navigateur', notificationOptions as any);
        
        console.log('✅ ✅ ✅ [Test Navigateur] NOTIFICATION AFFICHÉE AVEC SUCCÈS ! ✅ ✅ ✅');
        console.log('✅ [Test Navigateur] Si vous ne voyez pas la notification, le problème vient des paramètres Android');
        
        toast({
          title: "✅ Notification navigateur envoyée",
          description: "Si vous ne la voyez pas, vérifiez les paramètres Android (Ne pas déranger, etc.)"
        });
      } catch (error) {
        console.error('❌ [Test Navigateur] Erreur lors de l\'affichage de la notification:', error);
        toast({
          title: "❌ Erreur",
          description: "Impossible d'afficher la notification. Voir console.",
          variant: "destructive"
        });
      }
    } else {
      console.log('❌ [Test Navigateur] Permission refusée:', Notification.permission);
      toast({
        title: "❌ Permission refusée",
        description: "Autorisez d'abord les notifications",
        variant: "destructive"
      });
    }
  };

  const copySubscription = () => {
    if (pushSubscription) {
      const subscriptionJson = JSON.stringify(pushSubscription, null, 2);
      navigator.clipboard.writeText(subscriptionJson);
      toast({
        title: "✅ Copié",
        description: "Subscription copiée dans le presse-papier"
      });
    }
  };

  const forceCreateSubscription = async () => {
    try {
      console.log('🔧 Création forcée d\'une nouvelle subscription...');
      
      const { requestPushPermission } = await import('@/lib/pwa');
      const subscription = await requestPushPermission();
      
      if (subscription) {
        toast({
          title: "✅ Subscription créée !",
          description: "Rechargez la page pour voir les détails"
        });
        
        // Refresh page to show new subscription
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast({
          title: "❌ Échec",
          description: "Impossible de créer la subscription. Vérifiez la console.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('❌ Erreur création subscription:', error);
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const copyCurlCommand = () => {
    if (!pushSubscription || !user?.id) return;

    const curlCommand = `curl -X POST https://[votre-url].replit.dev/api/pwa/test-push \\
  -H "Content-Type: application/json" \\
  -d '{"userId": "${user.id}"}'`;

    navigator.clipboard.writeText(curlCommand);
    toast({
      title: "✅ Copié",
      description: "Commande curl copiée. Remplacez [votre-url] par votre URL Replit."
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-title">🔔 Diagnostic Push Notifications</h1>
          <p className="text-muted-foreground">
            Cette page vous aide à diagnostiquer les problèmes de notifications push
          </p>
        </div>

        {user && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Connecté en tant que : <strong>{user.name || user.phoneNumber}</strong> ({user.role})
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>État du Système</CardTitle>
            <CardDescription>Vérification des composants requis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Service Worker</span>
              <span className="font-mono text-sm">{serviceWorkerStatus}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Permission Notifications</span>
              <span className="font-mono text-sm">
                {notificationPermission === 'granted' ? '✅ Accordée' : 
                 notificationPermission === 'denied' ? '❌ Refusée' : 
                 '⚠️ Non demandée'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Push Subscription</span>
              <span className="font-mono text-sm">
                {pushSubscription ? '✅ Active' : '❌ Aucune'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Clé VAPID publique</span>
              <span className="font-mono text-sm">
                {vapidKey ? '✅ Récupérée' : '❌ Manquante'}
              </span>
            </div>
          </CardContent>
        </Card>

        {pushSubscription && (
          <Card>
            <CardHeader>
              <CardTitle>Détails de la Subscription</CardTitle>
              <CardDescription>Informations techniques de votre souscription push</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Endpoint:</p>
                <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                  {pushSubscription.endpoint}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-1">Expiration:</p>
                <p className="text-xs font-mono bg-muted p-2 rounded">
                  {pushSubscription.expirationTime || 'Jamais'}
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={copySubscription} variant="outline" size="sm" data-testid="button-copy-subscription">
                  Copier la Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Tests de Notifications</CardTitle>
            <CardDescription>Testez différents types de notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notificationPermission !== 'granted' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Vous devez d'abord autoriser les notifications pour tester
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-2">
              {notificationPermission !== 'granted' && (
                <Button 
                  onClick={requestNotificationPermission} 
                  variant="default"
                  data-testid="button-request-permission"
                >
                  Demander la Permission
                </Button>
              )}

              {notificationPermission === 'granted' && !pushSubscription && (
                <Button 
                  onClick={forceCreateSubscription}
                  variant="default"
                  data-testid="button-force-subscription"
                >
                  🔧 Forcer Création de la Subscription
                </Button>
              )}

              <Button 
                onClick={testBrowserNotification}
                variant="outline"
                disabled={notificationPermission !== 'granted'}
                data-testid="button-test-browser"
              >
                Test Notification Navigateur Direct
              </Button>

              <Button 
                onClick={sendTestNotification}
                disabled={!pushSubscription || testing || !user}
                data-testid="button-test-push"
              >
                {testing ? 'Envoi en cours...' : 'Test Notification Push (Web Push API)'}
              </Button>

              {user && (
                <Button 
                  onClick={copyCurlCommand}
                  variant="secondary"
                  size="sm"
                  data-testid="button-copy-curl"
                >
                  Copier la commande curl
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instructions de Diagnostic</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">1. Vérifier les logs du Service Worker</h4>
              <p className="text-muted-foreground">
                Sur PC : Ouvrez Chrome DevTools (F12) → Console<br/>
                Sur Android : Connectez votre téléphone et utilisez chrome://inspect
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">2. Test Notification Navigateur</h4>
              <p className="text-muted-foreground">
                Cliquez sur "Test Notification Navigateur Direct" pour vérifier que les notifications fonctionnent en général sur votre appareil.
                Si cette notification ne s'affiche pas, le problème vient des paramètres Android/iOS.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">3. Test Notification Push</h4>
              <p className="text-muted-foreground">
                Cliquez sur "Test Notification Push" pour envoyer une vraie notification via Web Push API.
                Vérifiez les logs serveur dans Replit et les logs du service worker dans DevTools.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">4. Logs à Surveiller</h4>
              <p className="text-muted-foreground font-mono text-xs bg-muted p-2 rounded">
                🔔 [Service Worker] PUSH EVENT RECEIVED! ← Le push est arrivé<br/>
                ✅ [Service Worker] NOTIFICATION DISPLAYED SUCCESSFULLY! ← Notification affichée
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">5. Test avec curl</h4>
              <p className="text-muted-foreground">
                Copiez la commande curl et exécutez-la depuis votre ordinateur pendant que vous surveillez votre téléphone.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
