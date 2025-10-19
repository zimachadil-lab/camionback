import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Package, Search, Shield, CreditCard } from "lucide-react";
import { Link } from "wouter";

export default function HowItWorksClient() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/client-dashboard">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Comment ça marche</h1>
            <p className="text-sm text-muted-foreground">Guide pour les clients</p>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                  <Package className="h-10 w-10 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="text-2xl">CamionBack</CardTitle>
              <CardDescription className="text-base">
                Votre plateforme de transport au Maroc
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div>
                <h2 className="text-lg font-semibold mb-3">Qu'est-ce que CamionBack ?</h2>
                <p className="text-muted-foreground leading-relaxed">
                  CamionBack est une plateforme marocaine qui met en relation les particuliers 
                  et entreprises avec des transporteurs disponibles pour des trajets inter-villes. 
                  Trouvez facilement un transporteur fiable pour vos marchandises en quelques clics.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Comment ça fonctionne ?</h2>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">1</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Publiez votre commande</h3>
                    <p className="text-sm text-muted-foreground">
                      Décrivez votre besoin : ville de départ, destination, type de marchandise, 
                      date souhaitée et budget approximatif.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Search className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Recevez plusieurs offres</h3>
                    <p className="text-sm text-muted-foreground">
                      Les transporteurs disponibles vous envoient leurs propositions avec 
                      leurs prix et dates de prise en charge.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Comparez et choisissez</h3>
                    <p className="text-sm text-muted-foreground">
                      Consultez les profils, notes et avis des transporteurs. 
                      Sélectionnez celui qui correspond le mieux à vos besoins.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Paiement sécurisé</h3>
                    <p className="text-sm text-muted-foreground">
                      Le paiement n'est libéré qu'après la confirmation de la livraison. 
                      Votre satisfaction et sécurité sont garanties.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-medium text-sm mb-2">✨ Avantages</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Comparaison de prix en temps réel</li>
                  <li>Transporteurs vérifiés et notés</li>
                  <li>Communication directe via chat intégré</li>
                  <li>Paiement sécurisé</li>
                  <li>Support client disponible</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Link href="/client-dashboard">
            <Button className="w-full" size="lg" data-testid="button-back-dashboard">
              Retour au tableau de bord
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
