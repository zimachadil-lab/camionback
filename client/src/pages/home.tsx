import { useState, useEffect } from "react";
import { PhoneAuth } from "@/components/auth/phone-auth";
import ClientDashboard from "./client-dashboard";
import TransporterDashboard from "./transporter-dashboard";
import AdminDashboard from "./admin-dashboard";

export default function Home() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("camionback_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

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

  return <ClientDashboard />;
}
