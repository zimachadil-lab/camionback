import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";

export default function ForceSWUpdate() {
  const [status, setStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const forceUpdate = async () => {
    setIsLoading(true);
    setStatus("Désinscription de l'ancien Service Worker...");

    try {
      // Unregister all service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      for (const registration of registrations) {
        await registration.unregister();
        setStatus(`✅ Service Worker désinscrit`);
      }

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Clear all caches
      setStatus("Suppression des caches...");
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      setStatus(`✅ ${cacheNames.length} caches supprimés`);

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reload the page
      setStatus("✅ Terminé ! Rechargement de la page dans 2 secondes...");
      
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);

    } catch (error: any) {
      setStatus(`❌ Erreur: ${error.message}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-6 h-6" />
            Forcer Mise à Jour Service Worker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-4">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium mb-1">Action Destructive</p>
                <p>
                  Cette action va supprimer tous les caches et forcer le rechargement du Service Worker.
                  L'application va redémarrer.
                </p>
              </div>
            </div>
          </div>

          {status && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-4">
              <div className="flex gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  {status}
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={forceUpdate}
            disabled={isLoading}
            className="w-full"
            size="lg"
            data-testid="button-force-update"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Mise à jour en cours...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Forcer la Mise à Jour
              </>
            )}
          </Button>

          <div className="text-xs text-muted-foreground text-center">
            Cette opération prend environ 5 secondes
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
