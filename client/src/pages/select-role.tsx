import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Package, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SelectRole() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"client" | "transporter" | null>(null);
  const { toast } = useToast();
  
  const user = JSON.parse(localStorage.getItem("camionback_user") || "{}");
  
  // Redirect if user already has a role
  if (user.role) {
    setLocation("/");
    return null;
  }

  const handleSelectRole = async (role: "client" | "transporter") => {
    setSelectedRole(role);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/select-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role }),
      });

      if (!response.ok) {
        throw new Error("Failed to select role");
      }

      const data = await response.json();
      
      // Update localStorage with new user data
      localStorage.setItem("camionback_user", JSON.stringify(data.user));
      
      // Redirect based on role
      if (role === "client") {
        setLocation("/client-dashboard");
      } else {
        setLocation("/complete-profile");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de la sélection du rôle",
      });
      setSelectedRole(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <div className="w-full max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header Section */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Bienvenue sur CamionBack 🚛
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Choisissez comment vous souhaitez utiliser la plateforme :
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Client Card */}
          <Card 
            className={`
              relative overflow-hidden cursor-pointer transition-all duration-300 border-2
              hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]
              ${selectedRole === "client" ? "ring-4 ring-[#1CA6A6] border-[#1CA6A6]" : "hover:border-[#1CA6A6]/50"}
              animate-in fade-in slide-in-from-bottom-6 duration-500
            `}
            onClick={() => !loading && handleSelectRole("client")}
            data-testid="card-role-client"
          >
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1CA6A6]/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
            
            <CardHeader className="text-center space-y-6 relative">
              {/* Icon Container */}
              <div className="mx-auto w-28 h-28 rounded-2xl bg-gradient-to-br from-[#1CA6A6]/20 to-[#1CA6A6]/10 flex items-center justify-center transition-transform duration-300 hover:scale-110 hover:rotate-3">
                <Package className="w-14 h-14 text-[#1CA6A6] transition-transform duration-300 hover:scale-110" />
              </div>
              
              <div className="space-y-2">
                <CardTitle className="text-2xl md:text-3xl font-bold">
                  Je veux envoyer quelque chose
                </CardTitle>
                <CardDescription className="text-base md:text-lg leading-relaxed">
                  Publiez une demande de transport pour vos meubles, colis ou marchandises.
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="relative pb-8">
              <Button 
                className="w-full h-12 text-base font-semibold bg-[#1CA6A6] hover:bg-[#1CA6A6]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
                disabled={loading}
                data-testid="button-select-client"
              >
                {loading && selectedRole === "client" ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Sélection en cours...
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
              ${selectedRole === "transporter" ? "ring-4 ring-[#2BB673] border-[#2BB673]" : "hover:border-[#2BB673]/50"}
              animate-in fade-in slide-in-from-bottom-6 duration-500 delay-100
            `}
            onClick={() => !loading && handleSelectRole("transporter")}
            data-testid="card-role-transporter"
          >
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#2BB673]/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
            
            <CardHeader className="text-center space-y-6 relative">
              {/* Icon Container */}
              <div className="mx-auto w-28 h-28 rounded-2xl bg-gradient-to-br from-[#2BB673]/20 to-[#2BB673]/10 flex items-center justify-center transition-transform duration-300 hover:scale-110 hover:rotate-3">
                <Truck className="w-14 h-14 text-[#2BB673] transition-transform duration-300 hover:scale-110" />
              </div>
              
              <div className="space-y-2">
                <CardTitle className="text-2xl md:text-3xl font-bold">
                  Je suis un transporteur
                </CardTitle>
                <CardDescription className="text-base md:text-lg leading-relaxed">
                  Recevez des demandes de livraison et proposez vos services.
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="relative pb-8">
              <Button 
                className="w-full h-12 text-base font-semibold bg-[#2BB673] hover:bg-[#2BB673]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
                disabled={loading}
                data-testid="button-select-transporter"
              >
                {loading && selectedRole === "transporter" ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Sélection en cours...
                  </span>
                ) : (
                  "Continuer comme Transporteur"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Reassurance Message */}
        <div className="text-center pt-4 animate-in fade-in duration-1000 delay-300">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
            <Info className="w-4 h-4" />
            <span>Vous pourrez modifier votre rôle plus tard depuis votre profil.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
