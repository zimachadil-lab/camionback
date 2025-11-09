import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Package, Search, Shield, CreditCard } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export default function HowItWorksClient() {
  const { t } = useTranslation();
  
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
            <h1 className="text-2xl font-bold">{t('howItWorks.client.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('howItWorks.client.subtitle')}</p>
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
              <CardTitle className="text-2xl">{t('howItWorks.client.brandTitle')}</CardTitle>
              <CardDescription className="text-base">
                {t('howItWorks.client.brandDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div>
                <h2 className="text-lg font-semibold mb-3">{t('howItWorks.client.whatIs')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('howItWorks.client.whatIsDescription')}
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold">{t('howItWorks.client.howItWorksTitle')}</h2>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">1</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">{t('howItWorks.client.step1Title')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('howItWorks.client.step1Description')}
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
                    <h3 className="font-medium mb-1">{t('howItWorks.client.step2Title')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('howItWorks.client.step2Description')}
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
                    <h3 className="font-medium mb-1">{t('howItWorks.client.step3Title')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('howItWorks.client.step3Description')}
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
                    <h3 className="font-medium mb-1">{t('howItWorks.client.step4Title')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('howItWorks.client.step4Description')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-medium text-sm mb-2">✨ {t('howItWorks.client.advantagesTitle')}</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>{t('howItWorks.client.advantage1')}</li>
                  <li>{t('howItWorks.client.advantage2')}</li>
                  <li>{t('howItWorks.client.advantage3')}</li>
                  <li>{t('howItWorks.client.advantage4')}</li>
                  <li>{t('howItWorks.client.advantage5')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Link href="/client-dashboard">
            <Button className="w-full" size="lg" data-testid="button-back-dashboard">
              {t('howItWorks.client.backToDashboard')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
