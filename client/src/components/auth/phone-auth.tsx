import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function PhoneAuth({ onAuthSuccess }: { onAuthSuccess: (user: any) => void }) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez entrer un numéro de téléphone valide",
      });
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: `+212${phoneNumber}` }),
      });
      
      if (!response.ok) throw new Error();
      
      setStep("otp");
      toast({
        title: "Code envoyé",
        description: "Vérifiez votre téléphone pour le code OTP",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de l'envoi du code",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez entrer un code à 6 chiffres",
      });
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phoneNumber: `+212${phoneNumber}`,
          code: otp 
        }),
      });
      
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Code invalide ou expiré",
        });
        return;
      }
      
      const data = await response.json();
      onAuthSuccess(data.user);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de la vérification",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Truck className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">CamionBack</CardTitle>
          <CardDescription className="text-base">
            {step === "phone" 
              ? "Entrez votre numéro de téléphone pour continuer" 
              : "Entrez le code reçu par SMS"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === "phone" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Numéro de téléphone</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    +212
                  </span>
                  <Input
                    type="tel"
                    placeholder="6 12 34 56 78"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-16"
                    data-testid="input-phone"
                  />
                </div>
              </div>
              <Button 
                onClick={handleSendOtp} 
                className="w-full" 
                size="lg"
                disabled={loading}
                data-testid="button-send-otp"
              >
                {loading ? "Envoi..." : "Envoyer le code"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Code de vérification</label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                  data-testid="input-otp"
                />
              </div>
              <Button 
                onClick={handleVerifyOtp} 
                className="w-full" 
                size="lg"
                disabled={loading}
                data-testid="button-verify-otp"
              >
                {loading ? "Vérification..." : "Vérifier"}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setStep("phone")} 
                className="w-full"
                data-testid="button-back"
              >
                Changer de numéro
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
