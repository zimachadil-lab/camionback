import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Eye, EyeOff, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import camionbackLogo from "@assets/logo camion (14)_1760911574566.png";

export function PhoneAuth({ onAuthSuccess }: { onAuthSuccess: (user: any) => void }) {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"phone" | "pin">("phone");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const { toast } = useToast();

  // Format phone number as user types (6 12 34 56 78)
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 9);
    if (digits.length === 0) return '';
    if (digits.length <= 1) return digits;
    if (digits.length <= 3) return `${digits.slice(0, 1)} ${digits.slice(1)}`;
    if (digits.length <= 5) return `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3)}`;
    if (digits.length <= 7) return `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
    return `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
  };

  const handleCheckPhone = async () => {
    const cleanPhone = phoneNumber.replace(/\s/g, '');
    if (cleanPhone.length !== 9) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Le numéro doit contenir exactement 9 chiffres",
      });
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch("/api/auth/check-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: `+212${cleanPhone}` }),
      });
      
      if (!response.ok) throw new Error();
      
      const data = await response.json();
      setMode(data.exists ? "login" : "register");
      setStep("pin");
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

  const handleAuth = async () => {
    const cleanPhone = phoneNumber.replace(/\s/g, '');
    
    if (pin.length !== 6) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Le code PIN doit contenir 6 chiffres",
      });
      return;
    }

    if (mode === "register" && pin !== confirmPin) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Les codes PIN ne correspondent pas",
      });
      return;
    }
    
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phoneNumber: `+212${cleanPhone}`,
          pin 
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error.error || (mode === "login" ? "Numéro ou code PIN incorrect" : "Échec de l'inscription"),
        });
        return;
      }
      
      const data = await response.json();
      const user = data.user;
      
      // Save user to localStorage
      localStorage.setItem("camionback_user", JSON.stringify(user));
      onAuthSuccess(user);
      
      // Redirect based on user role and profile completion
      if (!user.role) {
        // New user needs to select role
        setLocation("/select-role");
      } else if (user.role === "admin") {
        // Admin users go directly to admin dashboard
        setLocation("/admin-dashboard");
      } else if (user.role === "transporter" && (!user.name || !user.city)) {
        // Transporter needs to complete profile
        setLocation("/complete-profile");
      } else {
        // User has complete profile, go to home (which will redirect to appropriate dashboard)
        setLocation("/");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: mode === "login" ? "Échec de la connexion" : "Échec de l'inscription",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-[#0A2540] to-[#163049]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3 pb-4">
          {/* Animation des camions aller-retour */}
          <div className="relative mb-4" style={{ height: '90px' }}>
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes truckTop {
                0% { transform: translateX(-120%); }
                100% { transform: translateX(120%); }
              }
              @keyframes truckBottom {
                0% { transform: translateX(120%) scaleX(-1); }
                100% { transform: translateX(-120%) scaleX(-1); }
              }
              .truck-top {
                animation: truckTop 6s linear infinite;
                display: block;
              }
              .truck-bottom {
                animation: truckBottom 6s linear infinite;
                animation-delay: 0.5s;
                display: block;
              }
              .truck-container.paused .truck-top,
              .truck-container.paused .truck-bottom {
                animation-play-state: paused;
              }
              @media (max-height: 680px) {
                .truck-container-wrapper {
                  transform: scale(0.9);
                  margin-top: -8px;
                }
              }
            `}} />
            <div className="truck-container-wrapper">
              <div className={`truck-container ${isPaused ? 'paused' : ''}`} style={{ position: 'relative', height: '60px', overflow: 'visible', paddingTop: '8px' }}>
                {/* Camion du haut - Turquoise (gauche vers droite →) */}
                <div className="truck-top" style={{ position: 'absolute', top: '8px', left: 0, right: 0 }}>
                  <Truck className="w-10 h-10 md:w-11 md:h-11 text-[#1CA6A6]" style={{ filter: 'drop-shadow(0 2px 4px rgba(28, 166, 166, 0.4))' }} />
                </div>
                {/* Camion du bas - Vert (droite vers gauche ←) */}
                <div className="truck-bottom" style={{ position: 'absolute', top: '38px', left: 0, right: 0 }}>
                  <Truck className="w-10 h-10 md:w-11 md:h-11 text-[#2BB673]" style={{ filter: 'drop-shadow(0 2px 4px rgba(43, 182, 115, 0.4))' }} />
                </div>
              </div>
              {/* Texte bonus - bien espacé sous les camions */}
              <div style={{ marginTop: '10px', textAlign: 'center' }}>
                <p className="text-[11px] md:text-xs text-[#CDE8E8]/85 font-medium">
                  Pas de retour à vide 🚛💨
                </p>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[200px]">
            <img 
              src={camionbackLogo} 
              alt="CamionBack Logo" 
              className="w-full h-auto"
              loading="eager"
              data-testid="img-logo"
            />
          </div>
          <CardDescription className="text-base">
            {step === "phone" 
              ? "Entrez votre numéro de téléphone" 
              : mode === "login" 
                ? "Entrez votre code PIN" 
                : "Créez votre code PIN à 6 chiffres"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === "phone" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Numéro de téléphone</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none select-none">
                    +212
                  </span>
                  <Input
                    type="tel"
                    placeholder="6 12 34 56 78"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                    onFocus={() => setIsPaused(true)}
                    onBlur={() => setIsPaused(false)}
                    className="pl-16"
                    data-testid="input-phone"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Format: 6 12 34 56 78 (9 chiffres)
                </p>
              </div>
              <Button 
                onClick={handleCheckPhone} 
                className="w-full" 
                size="lg"
                disabled={loading}
                data-testid="button-continue"
              >
                {loading ? "Vérification..." : "Continuer"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {mode === "login" ? "Code PIN" : "Créer un code PIN"}
                </label>
                <div className="relative">
                  <Input
                    type={showPin ? "text" : "password"}
                    placeholder="••••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onFocus={() => setIsPaused(true)}
                    onBlur={() => setIsPaused(false)}
                    className="text-center text-2xl tracking-widest pr-12"
                    maxLength={6}
                    data-testid="input-pin"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    data-testid="button-toggle-pin"
                  >
                    {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {mode === "register" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirmer le code PIN</label>
                  <Input
                    type={showPin ? "text" : "password"}
                    placeholder="••••••"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onFocus={() => setIsPaused(true)}
                    onBlur={() => setIsPaused(false)}
                    className="text-center text-2xl tracking-widest"
                    maxLength={6}
                    data-testid="input-confirm-pin"
                  />
                </div>
              )}

              <Button 
                onClick={handleAuth} 
                className="w-full" 
                size="lg"
                disabled={loading}
                data-testid="button-submit"
              >
                {loading 
                  ? (mode === "login" ? "Connexion..." : "Inscription...") 
                  : (mode === "login" ? "Se connecter" : "S'inscrire")}
              </Button>

              {mode === "login" && (
                <Button 
                  variant="ghost" 
                  className="w-full text-sm"
                  disabled
                  data-testid="button-forgot-pin"
                >
                  Mot de passe oublié ?
                </Button>
              )}

              <Button 
                variant="ghost" 
                onClick={() => {
                  setStep("phone");
                  setPin("");
                  setConfirmPin("");
                }} 
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
