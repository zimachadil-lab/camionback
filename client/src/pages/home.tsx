import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { PhoneAuth } from "@/components/auth/phone-auth";
import ClientDashboard from "./client-dashboard";
import TransporterDashboard from "./transporter-dashboard";
import AdminDashboard from "./admin-dashboard";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem("camionback_user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      
      // Redirect to role selection if user has no role
      if (!userData.role) {
        setLocation("/select-role");
      }
    }
  }, [setLocation]);

  const handleAuthSuccess = (userData: any) => {
    localStorage.setItem("camionback_user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("camionback_user");
    setUser(null);
  };

  if (!user) {
    return <PhoneAuth onAuthSuccess={handleAuthSuccess} />;
  }

  // Route to appropriate dashboard based on user role
  if (user.role === "admin") {
    return <AdminDashboard />;
  }

  if (user.role === "transporter") {
    return <TransporterDashboard />;
  }

  if (user.role === "client") {
    return <ClientDashboard />;
  }

  // If somehow user has no role, redirect to role selection
  setLocation("/select-role");
  return null;
}
