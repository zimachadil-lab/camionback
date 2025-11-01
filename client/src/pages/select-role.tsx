import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Package, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";

export default function SelectRole() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"client" | "transporteur" | null>(null);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  // Redirect if user already has a role
  useEffect(() => {
    if (!authLoading && user?.role) {
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);
  
  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#0A2540] to-[#163049]">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }
  
  // Redirect to home if not authenticated
  if (!authLoading && !user) {
    setLocation("/");
    return null;
  }

  const handleSelectRole = async (role: "client" | "transporteur") => {
    setSelectedRole(role);
    setLoading(true);
    try {
      console.log("🔄 [SELECT-ROLE] Sending request:", { role });
      
      const response = await fetch("/api/auth/select-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
        credentials: "include",
      });

      console.log("📡 [SELECT-ROLE] Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("❌ [SELECT-ROLE] Error response:", errorData);
        throw new Error(errorData.error || errorData.details || "Failed to select role");
      }

      const data = await response.json();
      console.log("✅ [SELECT-ROLE] Success:", data);
      
      // Redirect based on role
      if (role === "client") {
        setLocation("/client-dashboard");
      } else {
        setLocation("/complete-profile");
      }
    } catch (error: any) {
      console.error("❌ [SELECT-ROLE] Final error:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Échec de la sélection du rôle",
      });
      setSelectedRole(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center bg-gradient-to-b from-[#0A2540] to-[#163049] overflow-hidden" style={{ minHeight: '100vh', height: '100vh' }}>
      <div className="w-full max-w-5xl px-4 py-3 md:py-8 flex flex-col justify-center items-center h-full relative animate-in fade-in duration-700">
        {/* Header Section */}
        <div className="text-center mb-3 md:mb-8">
          <h1 className="text-xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-1 md:mb-3">
            Bienvenue sur CamionBack 🚛
          </h1>
          <p className="text-sm md:text-lg lg:text-xl text-white/80 max-w-2xl mx-auto">
            Choisissez comment vous souhaitez utiliser la plateforme :
          </p>
        </div>

        {/* Role Cards */}
        <div className="w-full grid md:grid-cols-2 gap-3 md:gap-6 lg:gap-8 flex-1 md:flex-none max-h-[70vh] md:max-h-none mb-12 md:mb-0">
          {/* Client Card */}
          <Card 
            className={`
              relative overflow-hidden cursor-pointer transition-all duration-300 border-2
              hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]
              ${selectedRole === "client" ? "ring-4 ring-[#1CA6A6] border-[#1CA6A6]" : "hover:border-[#1CA6A6]/50"}
              animate-in fade-in slide-in-from-bottom-6 duration-500
              py-2 md:py-4
            `}
            onClick={() => !loading && handleSelectRole("client")}
            data-testid="card-role-client"
          >
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1CA6A6]/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
            
            <CardHeader className="text-center space-y-2 md:space-y-6 relative p-3 md:p-6">
              {/* Icon Container */}
              <div className="mx-auto w-12 h-12 md:w-28 md:h-28 rounded-xl md:rounded-2xl bg-gradient-to-br from-[#1CA6A6]/20 to-[#1CA6A6]/10 flex items-center justify-center transition-transform duration-300 hover:scale-110 hover:rotate-3">
                <Package className="w-6 h-6 md:w-14 md:h-14 text-[#1CA6A6] transition-transform duration-300 hover:scale-110" />
              </div>
              
              <div className="space-y-1 md:space-y-2">
                <CardTitle className="text-base md:text-2xl lg:text-3xl font-bold leading-tight">
                  Je veux envoyer quelque chose
                </CardTitle>
                <CardDescription className="text-xs md:text-base lg:text-lg leading-tight md:leading-relaxed">
                  Publiez une demande de transport pour vos meubles, colis ou marchandises.
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="relative pb-3 md:pb-8 px-3 md:px-6">
              <Button 
                className="w-full h-9 md:h-12 text-xs md:text-base font-semibold bg-[#1CA6A6] hover:bg-[#1CA6A6]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
                disabled={loading}
                data-testid="button-select-client"
              >
                {loading && selectedRole === "client" ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white" />
                    <span className="text-xs md:text-base">Sélection en cours...</span>
                  </span>
                ) : (
                  "Continuer comme Client"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Transporter Card */}
          <Card 
            className={`
              relative overflow-hidden cursor-pointer transition-all duration-300 border-2
              hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]
              ${selectedRole === "transporteur" ? "ring-4 ring-[#2BB673] border-[#2BB673]" : "hover:border-[#2BB673]/50"}
              animate-in fade-in slide-in-from-bottom-6 duration-500 delay-100
              py-2 md:py-4
            `}
            onClick={() => !loading && handleSelectRole("transporteur")}
            data-testid="card-role-transporter"
          >
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#2BB673]/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
            
            <CardHeader className="text-center space-y-2 md:space-y-6 relative p-3 md:p-6">
              {/* Icon Container */}
              <div className="mx-auto w-12 h-12 md:w-28 md:h-28 rounded-xl md:rounded-2xl bg-gradient-to-br from-[#2BB673]/20 to-[#2BB673]/10 flex items-center justify-center transition-transform duration-300 hover:scale-110 hover:rotate-3">
                <Truck className="w-6 h-6 md:w-14 md:h-14 text-[#2BB673] transition-transform duration-300 hover:scale-110" />
              </div>
              
              <div className="space-y-1 md:space-y-2">
                <CardTitle className="text-base md:text-2xl lg:text-3xl font-bold leading-tight">
                  Je suis un transporteur
                </CardTitle>
                <CardDescription className="text-xs md:text-base lg:text-lg leading-tight md:leading-relaxed">
                  Recevez des demandes de livraison et proposez vos services.
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="relative pb-3 md:pb-8 px-3 md:px-6">
              <Button 
                className="w-full h-9 md:h-12 text-xs md:text-base font-semibold bg-[#2BB673] hover:bg-[#2BB673]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
                disabled={loading}
                data-testid="button-select-transporter"
              >
                {loading && selectedRole === "transporteur" ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white" />
                    <span className="text-xs md:text-base">Sélection en cours...</span>
                  </span>
                ) : (
                  "Continuer comme Transporteur"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Reassurance Message - Fixed at bottom on mobile */}
        <div className="absolute bottom-0 left-0 right-0 text-center pb-2 md:pb-4 animate-in fade-in duration-1000 delay-300">
          <div className="inline-flex items-center gap-1 md:gap-2 text-[11px] md:text-sm text-white/70 bg-white/10 px-2 md:px-4 py-1 md:py-2 rounded-full backdrop-blur-sm">
            <Info className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span>Vous pourrez modifier votre rôle plus tard depuis votre profil.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
