import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SelectRole() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const user = JSON.parse(localStorage.getItem("camionback_user") || "{}");
  
  // Redirect if user already has a role
  if (user.role) {
    setLocation("/");
    return null;
  }

  const handleSelectRole = async (role: "client" | "transporter") => {
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
        setLocation("/");
      } else {
        setLocation("/complete-profile");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de la sélection du rôle",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Bienvenue sur CamionBack</h1>
          <p className="text-muted-foreground">
            Choisissez votre rôle pour continuer
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card 
            className="hover-elevate active-elevate-2 cursor-pointer transition-all border-2"
            onClick={() => !loading && handleSelectRole("transporter")}
            data-testid="card-role-transporter"
          >
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <Truck className="w-12 h-12 text-primary" />
              </div>
              <CardTitle className="text-2xl">Transporteur</CardTitle>
              <CardDescription className="text-base">
                Je possède un camion et je souhaite proposer mes services de transport
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                size="lg"
                disabled={loading}
                data-testid="button-select-transporter"
              >
                {loading ? "Sélection..." : "Devenir Transporteur"}
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="hover-elevate active-elevate-2 cursor-pointer transition-all border-2"
            onClick={() => !loading && handleSelectRole("client")}
            data-testid="card-role-client"
          >
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="w-12 h-12 text-primary" />
              </div>
              <CardTitle className="text-2xl">Expéditeur</CardTitle>
              <CardDescription className="text-base">
                J'ai besoin de transporter des marchandises ou meubles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                size="lg"
                disabled={loading}
                data-testid="button-select-client"
              >
                {loading ? "Sélection..." : "Devenir Expéditeur"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
