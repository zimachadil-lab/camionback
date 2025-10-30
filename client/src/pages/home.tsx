import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { PhoneAuth } from "@/components/auth/phone-auth";
import ClientDashboard from "./client-dashboard";
import TransporterDashboard from "./transporter-dashboard";
import AdminDashboard from "./admin-dashboard";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      if (!user.role) {
        setLocation("/select-role");
      } else if (user.role === "coordinateur") {
        setLocation("/coordinator-dashboard");
      }
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0A2540] to-[#163049]">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return <PhoneAuth />;
  }

  // Route to appropriate dashboard based on user role
  if (user.role === "admin") {
    return <AdminDashboard />;
  }

  if (user.role === "coordinateur") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0A2540] to-[#163049]">
        <div className="text-white text-xl">Redirection...</div>
      </div>
    );
  }

  if (user.role === "transporter") {
    return <TransporterDashboard />;
  }

  if (user.role === "client") {
    return <ClientDashboard />;
  }

  // If somehow user has no role, show loading while useEffect redirects
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0A2540] to-[#163049]">
      <div className="text-white text-xl">Redirection...</div>
    </div>
  );
}
