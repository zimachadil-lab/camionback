import { useEffect, useState } from "react";
import { Smartphone, Download, Chrome, Share, Home, Truck, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PWAInstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop'>('android');

  useEffect(() => {
    // Détecter si déjà installé
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    };
    checkInstalled();

    // Détecter la plateforme
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Capturer l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Stocker globalement pour réutilisation
      (window as any).deferredPrompt = e;
      console.log('[PWA] Install prompt captured');
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log('[PWA] Application installed successfully');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Vérifier si prompt existe déjà
    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    const prompt = deferredPrompt || (window as any).deferredPrompt;
    
    if (!prompt) {
      console.warn('[PWA] Install prompt not available');
      alert('Veuillez utiliser Chrome ou Edge pour installer l\'application');
      return;
    }

    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('[PWA] Installation accepted');
        setIsInstalled(true);
      } else {
        console.log('[PWA] Installation declined');
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('[PWA] Installation error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-[#00BFA5]/5">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header avec logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#00BFA5] mb-4">
              <Truck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              CamionBack
            </h1>
            <p className="text-lg text-muted-foreground">
              Votre plateforme de transport au Maroc
            </p>
          </div>

          {/* Bouton d'installation principal - TOUJOURS VISIBLE */}
          <Card className="mb-6 overflow-hidden shadow-xl">
            {isInstalled ? (
              <div className="p-6 bg-green-500/10 border-2 border-green-500/50">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-500 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-green-700 dark:text-green-400">
                      Application installée !
                    </h3>
                    <p className="text-sm text-green-600 dark:text-green-500">
                      CamionBack est accessible depuis votre écran d'accueil
                    </p>
                  </div>
                </div>
                <a
                  href="/"
                  className="block w-full"
                  data-testid="link-open-app"
                >
                  <Button
                    size="lg"
                    variant="default"
                    className="w-full bg-green-600 text-white"
                  >
                    <ArrowRight className="mr-2 h-5 w-5" />
                    Ouvrir l'application
                  </Button>
                </a>
              </div>
            ) : platform === 'ios' ? (
              <div className="p-6 bg-blue-500/10 border-2 border-blue-500/50">
                <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                  <Smartphone className="h-6 w-6 text-blue-500" />
                  Installation sur iPhone/iPad
                </h3>
                <ol className="space-y-2 text-sm mb-4">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600 flex-shrink-0">1.</span>
                    <span className="text-foreground">Appuyez sur le bouton <strong>Partager</strong> <Share className="inline h-4 w-4" /> (en bas de Safari)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600 flex-shrink-0">2.</span>
                    <span className="text-foreground">Sélectionnez <strong>"Sur l'écran d'accueil"</strong> <Home className="inline h-4 w-4" /></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600 flex-shrink-0">3.</span>
                    <span className="text-foreground">Appuyez sur <strong>Ajouter</strong></span>
                  </li>
                </ol>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <div className="h-4 w-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">!</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Assurez-vous d'utiliser Safari pour installer l'application
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-gradient-to-r from-[#00BFA5] to-[#00897B]">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Smartphone className="h-6 w-6 text-white" />
                  <h3 className="text-xl font-bold text-white text-center">
                    Installez CamionBack maintenant
                  </h3>
                </div>
                <p className="text-white/90 text-center mb-5">
                  Un clic suffit pour avoir l'application sur votre appareil
                </p>
                <Button
                  onClick={handleInstall}
                  size="lg"
                  variant="secondary"
                  className="w-full bg-white text-[#00BFA5] text-lg font-bold"
                  data-testid="button-install-pwa"
                >
                  <Download className="mr-2 h-6 w-6" />
                  INSTALLER L'APPLICATION
                </Button>
                {!deferredPrompt && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <div className="h-4 w-4 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-white text-xs">i</span>
                    </div>
                    <p className="text-white/70 text-xs text-center">
                      Utilisez Chrome ou Edge pour installer l'application
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Carte avantages */}
          <Card className="mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 sm:p-8 text-white">
              <h2 className="text-2xl font-bold mb-2">
                Pourquoi installer CamionBack ?
              </h2>
              <p className="text-white/90">
                Une expérience optimale pour gérer vos transports
              </p>
            </div>

            <div className="p-6 sm:p-8">
              {/* Avantages */}
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#00BFA5]/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-[#00BFA5]" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Accès instantané</p>
                    <p className="text-sm text-muted-foreground">Lancez l'app depuis votre écran d'accueil en un clic</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#00BFA5]/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-[#00BFA5]" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Notifications en temps réel</p>
                    <p className="text-sm text-muted-foreground">Recevez des alertes pour vos demandes et offres</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#00BFA5]/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-[#00BFA5]" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Fonctionne hors ligne</p>
                    <p className="text-sm text-muted-foreground">Consultez vos données même sans connexion internet</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#00BFA5]/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-[#00BFA5]" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Zéro téléchargement</p>
                    <p className="text-sm text-muted-foreground">Pas besoin du Play Store ou App Store</p>
                  </div>
                </div>
              </div>

              {/* Note d'aide */}
              <div className="border-t pt-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="h-6 w-6 rounded-full bg-[#00BFA5]/10 flex items-center justify-center">
                    <span className="text-[#00BFA5] font-bold">!</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <strong>Astuce</strong> : Une fois installée, l'application apparaîtra sur votre écran d'accueil comme une application native
                  </p>
                </div>
                {!isInstalled && (
                  <a
                    href="/"
                    className="inline-flex items-center text-sm text-[#00BFA5] hover:underline"
                  >
                    Utiliser la version web sans installer
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Besoin d'aide ? Contactez notre support</p>
          </div>
        </div>
      </div>
    </div>
  );
}
