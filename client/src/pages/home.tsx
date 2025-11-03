import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { PhoneAuth } from "@/components/auth/phone-auth";
import ClientDashboard from "./client-dashboard";
import TransporterDashboard from "./transporter-dashboard";
import AdminDashboard from "./admin-dashboard";
import CoordinatorDashboard from "./coordinator-dashboard";

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
    return <CoordinatorDashboard />;
  }

  if (user.role === "transporteur") {
    // Check if transporter has completed their profile (name and city are required)
    const hasCompletedProfile = user.name && user.city;
    
    if (!hasCompletedProfile) {
      // Redirect to complete profile if not done yet
      if (window.location.pathname !== "/complete-profile") {
        setLocation("/complete-profile");
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0A2540] to-[#163049]">
            <div className="text-white text-xl">Redirection vers complétion du profil...</div>
          </div>
        );
      }
    }
    
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
