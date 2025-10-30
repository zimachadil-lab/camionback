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
      console.log('📱 PWA installable - Prompt capturé');
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log('✅ Application installée avec succès');
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
      console.warn('⚠️ Prompt d\'installation non disponible');
      alert('Veuillez utiliser Chrome ou Edge pour installer l\'application');
      return;
    }

    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ Installation acceptée');
        setIsInstalled(true);
      } else {
        console.log('❌ Installation refusée');
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('❌ Erreur installation:', error);
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

          {/* État d'installation */}
          {isInstalled && (
            <Card className="mb-6 p-6 bg-green-500/10 border-green-500/20">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-700 dark:text-green-400">
                    Application installée !
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    CamionBack est maintenant accessible depuis votre écran d'accueil
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Carte principale */}
          <Card className="mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-[#00BFA5] to-[#00897B] p-6 sm:p-8 text-white">
              <h2 className="text-2xl font-bold mb-2">
                Installez l'application mobile
              </h2>
              <p className="text-white/90">
                Accédez instantanément à vos services de transport, gérez vos demandes et suivez vos livraisons en temps réel
              </p>
            </div>

            <div className="p-6 sm:p-8">
              {/* Avantages */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#00BFA5] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Accès instantané</p>
                    <p className="text-sm text-muted-foreground">Lancez l'app depuis votre écran d'accueil</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#00BFA5] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Notifications en temps réel</p>
                    <p className="text-sm text-muted-foreground">Restez informé de vos demandes et offres</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#00BFA5] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Fonctionne hors ligne</p>
                    <p className="text-sm text-muted-foreground">Consultez vos données même sans connexion</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#00BFA5] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Zéro téléchargement</p>
                    <p className="text-sm text-muted-foreground">Pas besoin de passer par un store</p>
                  </div>
                </div>
              </div>

              {/* Bouton d'installation Android/Desktop */}
              {platform !== 'ios' && (
                <div className="mb-6">
                  {deferredPrompt ? (
                    <Button
                      onClick={handleInstall}
                      size="lg"
                      className="w-full bg-[#00BFA5] hover:bg-[#00a892] text-white text-base"
                      disabled={isInstalled}
                      data-testid="button-install-pwa"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      {isInstalled ? 'Déjà installée' : 'Installer maintenant'}
                    </Button>
                  ) : (
                    <div className="text-center">
                      <Badge variant="outline" className="mb-3">
                        Installation disponible sur Chrome/Edge
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        Ouvrez cette page avec Chrome ou Edge pour installer l'application
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Instructions spécifiques à la plateforme */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-[#00BFA5]" />
                  Instructions d'installation
                </h3>

                {platform === 'ios' && (
                  <Card className="p-4 bg-blue-500/5 border-blue-500/20">
                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                      <Share className="h-4 w-4" />
                      Sur iPhone/iPad (Safari)
                    </h4>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-foreground flex-shrink-0">1.</span>
                        <span>Ouvrez cette page dans <strong>Safari</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-foreground flex-shrink-0">2.</span>
                        <span>Appuyez sur le bouton <strong>Partager</strong> <Share className="inline h-3 w-3" /> (en bas)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-foreground flex-shrink-0">3.</span>
                        <span>Sélectionnez <strong>"Sur l'écran d'accueil"</strong> <Home className="inline h-3 w-3" /></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-foreground flex-shrink-0">4.</span>
                        <span>Confirmez en appuyant sur <strong>Ajouter</strong></span>
                      </li>
                    </ol>
                  </Card>
                )}

                {platform === 'android' && (
                  <Card className="p-4 bg-green-500/5 border-green-500/20">
                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                      <Chrome className="h-4 w-4" />
                      Sur Android (Chrome)
                    </h4>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-foreground flex-shrink-0">1.</span>
                        <span>Cliquez sur le bouton <strong>"Installer maintenant"</strong> ci-dessus</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-foreground flex-shrink-0">2.</span>
                        <span>Ou appuyez sur le menu <strong>⋮</strong> (en haut à droite)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-foreground flex-shrink-0">3.</span>
                        <span>Sélectionnez <strong>"Ajouter à l'écran d'accueil"</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-foreground flex-shrink-0">4.</span>
                        <span>Confirmez l'installation</span>
                      </li>
                    </ol>
                  </Card>
                )}

                {platform === 'desktop' && (
                  <Card className="p-4 bg-purple-500/5 border-purple-500/20">
                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                      <Chrome className="h-4 w-4" />
                      Sur ordinateur (Chrome/Edge)
                    </h4>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-foreground flex-shrink-0">1.</span>
                        <span>Cliquez sur le bouton <strong>"Installer maintenant"</strong> ci-dessus</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-foreground flex-shrink-0">2.</span>
                        <span>Ou cliquez sur l'icône <strong>Installer</strong> dans la barre d'adresse</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-foreground flex-shrink-0">3.</span>
                        <span>Confirmez l'installation dans la popup</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-foreground flex-shrink-0">4.</span>
                        <span>L'application s'ouvrira dans sa propre fenêtre</span>
                      </li>
                    </ol>
                  </Card>
                )}
              </div>

              {/* Lien vers l'application */}
              <div className="mt-6 text-center">
                <a
                  href="/"
                  className="inline-flex items-center text-sm text-[#00BFA5] hover:underline"
                  data-testid="link-open-app"
                >
                  Accéder directement à l'application
                  <ArrowRight className="ml-1 h-4 w-4" />
                </a>
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
