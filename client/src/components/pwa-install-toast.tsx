import { useEffect, useState, useRef } from "react";
import { X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const DISMISS_KEY = 'pwaPromptDismissed';
const IDLE_TIMEOUT = 10000; // 10 secondes d'inactivité
const AUTO_HIDE_TIMEOUT = 15000; // Disparition automatique après 15 secondes

export function PWAInstallToast() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownThisSession = useRef(false);

  // Vérifier si déjà installé
  const isStandalone = () => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  };

  // Vérifier si déjà refusé
  const isDismissed = () => {
    return localStorage.getItem(DISMISS_KEY) === 'true';
  };

  useEffect(() => {
    // Ne pas afficher si déjà installé, déjà refusé, ou déjà montré cette session
    if (isStandalone() || isDismissed() || hasShownThisSession.current) {
      return;
    }

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('📱 PWA installable détectée');
    };

    // Écouter les événements personnalisés
    const handlePWAInstallable = (e: Event) => {
      const customEvent = e as CustomEvent;
      setDeferredPrompt(customEvent.detail);
      console.log('📱 Événement PWA-installable reçu');
    };

    // Écouter l'installation réussie
    const handleAppInstalled = () => {
      setShowToast(false);
      setIsVisible(false);
      setDeferredPrompt(null);
      console.log('✅ CamionBack installé avec succès');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-installable', handlePWAInstallable);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Vérifier si deferredPrompt global existe déjà
    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
      console.log('📱 deferredPrompt global détecté');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-installable', handlePWAInstallable);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    };
  }, []);

  // Gérer le timer d'inactivité
  useEffect(() => {
    if (!deferredPrompt || showToast || hasShownThisSession.current) return;

    const resetIdleTimer = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      idleTimerRef.current = setTimeout(() => {
        setShowToast(true);
        hasShownThisSession.current = true;
        console.log('🔔 Affichage du toast d\'installation PWA');
      }, IDLE_TIMEOUT);
    };

    // Événements qui réinitialisent le timer
    const events = ['mousemove', 'scroll', 'touchstart', 'click', 'keydown'];
    events.forEach(event => window.addEventListener(event, resetIdleTimer));

    // Démarrer le timer initial
    resetIdleTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [deferredPrompt, showToast]);

  // Gérer l'animation d'apparition et la disparition automatique
  useEffect(() => {
    if (showToast) {
      // Animation d'apparition avec délai
      setTimeout(() => setIsVisible(true), 50);

      // Disparition automatique après 15 secondes
      autoHideTimerRef.current = setTimeout(() => {
        handleDismiss();
      }, AUTO_HIDE_TIMEOUT);

      return () => {
        if (autoHideTimerRef.current) {
          clearTimeout(autoHideTimerRef.current);
        }
      };
    }
  }, [showToast]);

  const handleInstall = async () => {
    const prompt = deferredPrompt || (window as any).deferredPrompt;
    
    if (!prompt) {
      console.warn('⚠️ Aucun prompt d\'installation disponible');
      return;
    }

    try {
      // Afficher le prompt d'installation
      await prompt.prompt();
      
      // Attendre la réponse de l'utilisateur
      const { outcome } = await prompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ Utilisateur a accepté l\'installation');
      } else {
        console.log('❌ Utilisateur a refusé l\'installation');
        localStorage.setItem(DISMISS_KEY, 'true');
      }
      
      // Cacher le toast
      setIsVisible(false);
      setTimeout(() => setShowToast(false), 400);
      setDeferredPrompt(null);
    } catch (error) {
      console.error('❌ Erreur lors de l\'installation:', error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => setShowToast(false), 400);
    localStorage.setItem(DISMISS_KEY, 'true');
    console.log('⏭️ Installation PWA reportée');
  };

  if (!showToast) return null;

  return (
    <div
      className={`
        fixed z-50
        bottom-4 right-4 sm:top-4 sm:bottom-auto
        transition-all duration-400 ease-out
        ${isVisible 
          ? 'opacity-100 translate-y-0 sm:translate-y-0' 
          : 'opacity-0 translate-y-8 sm:translate-y-[-2rem]'
        }
      `}
      data-testid="pwa-install-toast"
    >
      <Card className="w-[340px] sm:w-[380px] shadow-lg border border-border/50 bg-background">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Smartphone className="h-6 w-6 text-[#00BFA5]" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground mb-1">
                Installer CamionBack
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Accédez rapidement à vos transports depuis votre écran d'accueil
              </p>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="bg-[#00BFA5] hover:bg-[#00a892] text-white flex-1"
                  data-testid="button-install-pwa"
                >
                  Installer
                </Button>
                <Button
                  onClick={handleDismiss}
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground"
                  data-testid="button-dismiss-pwa"
                >
                  Plus tard
                </Button>
              </div>
            </div>

            <Button
              onClick={handleDismiss}
              size="icon"
              variant="ghost"
              className="h-6 w-6 flex-shrink-0 -mt-1 -mr-1"
              data-testid="button-close-pwa-toast"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
