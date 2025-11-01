import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";

export default function AdminMigrate() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not admin
  if (user && user.role !== 'admin') {
    setLocation('/');
    return null;
  }

  const runMigration = async () => {
    setMigrating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/migrate-production', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A2540] to-[#163049] p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">🔧 Migration Production - Rôles</CardTitle>
            <CardDescription>
              Cette page permet de migrer les données de production : "transporter" → "transporteur"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!result && !error && (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-semibold mb-2">⚠️ ATTENTION - Migration de production</p>
                      <p className="mb-2">Cette opération va :</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Mettre à jour tous les "transporter" en "transporteur"</li>
                        <li>Corriger les "coordinateur" en "coordinator"</li>
                        <li>Supprimer les comptes incomplets (sans rôle)</li>
                      </ul>
                      <p className="mt-2 font-semibold">✅ Vos données client/transporteur seront préservées</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={runMigration}
                  disabled={migrating}
                  className="w-full"
                  size="lg"
                  data-testid="button-run-migration"
                >
                  {migrating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Migration en cours...
                    </>
                  ) : (
                    'Lancer la migration'
                  )}
                </Button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-800">Erreur de migration</p>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setError(null);
                    setResult(null);
                  }}
                  variant="outline"
                  className="mt-4"
                >
                  Réessayer
                </Button>
              </div>
            )}

            {result && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-800 text-lg mb-4">🎉 Migration réussie !</p>
                    
                    {result.updated && (
                      <div className="space-y-2 mb-4">
                        <p className="text-sm font-medium text-green-800">Modifications effectuées :</p>
                        <ul className="text-sm text-green-700 space-y-1">
                          <li>✅ {result.updated.transporteurs} transporteurs mis à jour</li>
                          <li>✅ {result.updated.coordinateurs} coordinateurs corrigés</li>
                          <li>✅ {result.updated.supprimés} comptes incomplets supprimés</li>
                        </ul>
                      </div>
                    )}

                    {result.after && (
                      <div className="mt-4 p-3 bg-white rounded border border-green-200">
                        <p className="text-sm font-medium text-gray-700 mb-2">📊 État final de la base :</p>
                        <table className="text-sm w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-1 px-2">Rôle</th>
                              <th className="text-right py-1 px-2">Nombre</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.after.map((row: any, i: number) => (
                              <tr key={i} className="border-b last:border-0">
                                <td className="py-1 px-2">{row.role || '(vide)'}</td>
                                <td className="text-right py-1 px-2 font-mono">{row.count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm font-semibold text-blue-800 mb-2">📋 Prochaines étapes :</p>
                      <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                        <li>Retourner à l'onglet "Publishing"</li>
                        <li>Cliquer sur "Publish" pour republier l'application</li>
                        <li>Cette fois, la publication devrait réussir !</li>
                      </ol>
                    </div>

                    <Button
                      onClick={() => setLocation('/')}
                      className="mt-4 w-full"
                    >
                      Retourner à l'accueil
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
