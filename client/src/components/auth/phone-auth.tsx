import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Eye, EyeOff, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { LanguageSelector } from "@/components/language-selector";
import { useTranslation } from "react-i18next";
import camionbackLogo from "@assets/logo camion (14)_1760911574566.png";

export function PhoneAuth() {
  const { login } = useAuth();
  const { t } = useTranslation();
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
        title: t('common.error'),
        description: t('auth.phoneNumberError'),
      });
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch("/api/auth/check-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: `+212${cleanPhone}` }),
        credentials: "include",
      });
      
      if (!response.ok) throw new Error();
      
      const data = await response.json();
      setMode(data.exists ? "login" : "register");
      setStep("pin");
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('auth.verificationFailed'),
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
        title: t('common.error'),
        description: t('auth.pinError'),
      });
      return;
    }

    if (mode === "register" && pin !== confirmPin) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('auth.pinMismatch'),
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
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: t('common.error'),
          description: error.error || (mode === "login" ? t('auth.invalidCredentials') : t('auth.registerFailed')),
        });
        return;
      }
      
      const data = await response.json();
      const user = data.user;
      
      // Update auth context with session-based user
      login(user);
      
      // Redirect based on user role and profile completion
      if (!user.role) {
        setLocation("/select-role");
      } else if (user.role === "transporteur" && (!user.name || !user.city)) {
        setLocation("/complete-profile");
      } else {
        // All other users go to home which renders appropriate dashboard
        setLocation("/");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: mode === "login" ? t('auth.loginFailed') : t('auth.registerFailed'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-[#0A2540] to-[#163049]">
      <div className="w-full max-w-md space-y-6">
        {/* Language Selector - Très visible en haut */}
        <div className="bg-card/30 backdrop-blur-md rounded-lg p-4 border border-card/50">
          <LanguageSelector />
        </div>

        <Card className="w-full">
        <CardHeader className="text-center space-y-3 pb-4">
          {/* Animation des camions - Version améliorée et dynamique */}
          <div className="relative mb-4" style={{ height: '100px', overflow: 'hidden' }}>
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes truckDrive {
                0% { 
                  transform: translateX(-130%) translateY(0px) scale(1);
                  filter: drop-shadow(0 3px 6px rgba(28, 166, 166, 0.5));
                }
                25% { 
                  transform: translateX(-40%) translateY(-2px) scale(1.02);
                  filter: drop-shadow(0 5px 10px rgba(28, 166, 166, 0.6));
                }
                50% { 
                  transform: translateX(20%) translateY(0px) scale(1);
                  filter: drop-shadow(0 3px 6px rgba(28, 166, 166, 0.5));
                }
                75% { 
                  transform: translateX(80%) translateY(-2px) scale(0.98);
                  filter: drop-shadow(0 5px 10px rgba(28, 166, 166, 0.6));
                }
                100% { 
                  transform: translateX(130%) translateY(0px) scale(1);
                  filter: drop-shadow(0 3px 6px rgba(28, 166, 166, 0.5));
                }
              }
              
              @keyframes truckReturn {
                0% { 
                  transform: translateX(130%) scaleX(-1) translateY(0px) scale(1, 1);
                  filter: drop-shadow(0 3px 6px rgba(43, 182, 115, 0.5));
                }
                25% { 
                  transform: translateX(40%) scaleX(-1) translateY(-3px) scale(1.03, 1.03);
                  filter: drop-shadow(0 6px 12px rgba(43, 182, 115, 0.7));
                }
                50% { 
                  transform: translateX(-20%) scaleX(-1) translateY(0px) scale(1, 1);
                  filter: drop-shadow(0 3px 6px rgba(43, 182, 115, 0.5));
                }
                75% { 
                  transform: translateX(-80%) scaleX(-1) translateY(-3px) scale(0.97, 0.97);
                  filter: drop-shadow(0 6px 12px rgba(43, 182, 115, 0.7));
                }
                100% { 
                  transform: translateX(-130%) scaleX(-1) translateY(0px) scale(1, 1);
                  filter: drop-shadow(0 3px 6px rgba(43, 182, 115, 0.5));
                }
              }
              
              @keyframes roadPulse {
                0%, 100% { opacity: 0.15; }
                50% { opacity: 0.3; }
              }
              
              @keyframes dashMove {
                0% { stroke-dashoffset: 0; }
                100% { stroke-dashoffset: -20; }
              }
              
              .truck-top-new {
                animation: truckDrive 5s ease-in-out infinite;
                display: block;
                will-change: transform;
              }
              
              .truck-bottom-new {
                animation: truckReturn 6.5s ease-in-out infinite;
                animation-delay: 0.8s;
                display: block;
                will-change: transform;
              }
              
              .road-line {
                animation: dashMove 1s linear infinite;
                stroke-dasharray: 10 10;
              }
              
              .road-bg {
                animation: roadPulse 3s ease-in-out infinite;
              }
              
              .truck-container-new.paused .truck-top-new,
              .truck-container-new.paused .truck-bottom-new,
              .truck-container-new.paused .road-line {
                animation-play-state: paused;
              }
              
              @media (max-height: 680px) {
                .truck-animation-wrapper {
                  transform: scale(0.95);
                }
              }
            `}} />
            
            <div className="truck-animation-wrapper" style={{ overflow: 'hidden', position: 'relative', height: '100%' }}>
              {/* Route animée en arrière-plan */}
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, transform: 'translateY(-50%)', zIndex: 0, overflow: 'hidden' }}>
                <svg width="100%" height="60" style={{ opacity: 0.2 }}>
                  <rect className="road-bg" width="100%" height="60" fill="#1CA6A6" rx="4" />
                  <line className="road-line" x1="0" y1="20" x2="100%" y2="20" stroke="#CDE8E8" strokeWidth="2" strokeDasharray="10 10" />
                  <line className="road-line" x1="0" y1="40" x2="100%" y2="40" stroke="#CDE8E8" strokeWidth="2" strokeDasharray="10 10" style={{ animationDelay: '0.5s' }} />
                </svg>
              </div>
              
              {/* Conteneur des camions */}
              <div className={`truck-container-new ${isPaused ? 'paused' : ''}`} style={{ position: 'relative', height: '75px', zIndex: 1, overflow: 'hidden' }}>
                {/* Camion turquoise - Allant de gauche à droite */}
                <div className="truck-top-new" style={{ position: 'absolute', top: '8px', left: 0, right: 0, overflow: 'visible' }}>
                  <Truck className="w-12 h-12 md:w-14 md:h-14 text-[#1CA6A6]" />
                </div>
                
                {/* Camion vert - Retour de droite à gauche */}
                <div className="truck-bottom-new" style={{ position: 'absolute', top: '40px', left: 0, right: 0, overflow: 'visible' }}>
                  <Truck className="w-11 h-11 md:w-13 md:h-13 text-[#2BB673]" />
                </div>
              </div>
              
              {/* Texte bonus avec animation subtile */}
              <div style={{ marginTop: '2px', textAlign: 'center', position: 'relative', zIndex: 2 }}>
                <p className="text-[11px] md:text-xs text-[#CDE8E8]/90 font-semibold tracking-wide" style={{ 
                  textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  animation: 'roadPulse 3s ease-in-out infinite'
                }}>
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
              ? t('auth.enterPhoneNumber') 
              : mode === "login" 
                ? t('auth.enterPIN') 
                : t('auth.createPIN')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === "phone" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('auth.phoneNumber')}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none select-none">
                    +212
                  </span>
                  <Input
                    type="tel"
                    placeholder={t('auth.phonePlaceholder')}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                    onFocus={() => setIsPaused(true)}
                    onBlur={() => setIsPaused(false)}
                    className="pl-16"
                    data-testid="input-phone"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('auth.phoneFormat')}
                </p>
              </div>
              <Button 
                onClick={handleCheckPhone} 
                className="w-full" 
                size="lg"
                disabled={loading}
                data-testid="button-continue"
              >
                {loading ? t('auth.verifying') : t('auth.continue')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {mode === "login" ? t('auth.pin') : t('auth.createNewPIN')}
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
                  <label className="text-sm font-medium">{t('auth.confirmPIN')}</label>
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
                  ? (mode === "login" ? t('auth.loggingIn') : t('auth.registering')) 
                  : (mode === "login" ? t('auth.login') : t('auth.register'))}
              </Button>

              {mode === "login" && (
                <Button 
                  variant="ghost" 
                  className="w-full text-sm"
                  disabled
                  data-testid="button-forgot-pin"
                >
                  {t('auth.forgotPassword')}
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
                {t('auth.changeNumber')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
