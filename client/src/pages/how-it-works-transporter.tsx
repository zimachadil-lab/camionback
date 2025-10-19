import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TruckIcon, Bell, MessageSquare, DollarSign } from "lucide-react";
import { Link } from "wouter";

export default function HowItWorksTransporter() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/transporter-dashboard">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Comment ça marche</h1>
            <p className="text-sm text-muted-foreground">Guide pour les transporteurs</p>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                  <TruckIcon className="h-10 w-10 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="text-2xl">CamionBack</CardTitle>
              <CardDescription className="text-base">
                Rentabilisez vos trajets au Maroc
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div>
                <h2 className="text-lg font-semibold mb-3">Qu'est-ce que CamionBack ?</h2>
                <p className="text-muted-foreground leading-relaxed">
                  CamionBack aide les transporteurs à rentabiliser leurs trajets en trouvant 
                  des chargements au retour. Plus besoin de rouler à vide ! Augmentez votre 
                  chiffre d'affaires en optimisant chaque trajet.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Comment ça fonctionne ?</h2>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Recevez des demandes</h3>
                    <p className="text-sm text-muted-foreground">
                      Consultez les demandes de transport dans les villes qui vous intéressent. 
                      Filtrez par trajet et date selon vos disponibilités.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Envoyez vos propositions</h3>
                    <p className="text-sm text-muted-foreground">
                      Proposez votre prix, date de prise en charge et type de chargement 
                      (retour ou groupage). Soyez compétitif pour augmenter vos chances.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Communiquez facilement</h3>
                    <p className="text-sm text-muted-foreground">
                      Discutez directement avec les clients via le chat intégré. 
                      Précisez les détails et confirmez les arrangements.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">💰</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Augmentez vos revenus</h3>
                    <p className="text-sm text-muted-foreground">
                      Évitez les trajets à vide, optimisez votre planning et 
                      augmentez votre chiffre d'affaires mensuel.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-medium text-sm mb-2">✨ Avantages</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Accès à de nombreuses demandes de transport</li>
                  <li>Vous fixez vos propres prix</li>
                  <li>Communication directe avec les clients</li>
                  <li>Planification facilitée de vos trajets</li>
                  <li>Facturation simplifiée</li>
                  <li>Système de notation pour construire votre réputation</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Link href="/transporter-dashboard">
            <Button className="w-full" size="lg" data-testid="button-back-dashboard">
              Retour au tableau de bord
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
