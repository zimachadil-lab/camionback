// Provider pour gérer automatiquement les notifications push pour les utilisateurs connectés
import { useEffect } from "react";
import { usePushNotifications } from "@/hooks/use-push-notifications";

export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;

  // Enable push notifications for logged-in users
  const { permission } = usePushNotifications({
    userId: user?.id || null,
    enabled: !!user?.id
  });

  useEffect(() => {
    if (permission === 'granted' && user) {
      console.log(`✅ Notifications push activées pour ${user.name || user.phoneNumber}`);
    }
  }, [permission, user]);

  return <>{children}</>;
}
