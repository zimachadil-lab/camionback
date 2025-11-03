// Provider pour gérer automatiquement les notifications push pour les utilisateurs connectés
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { usePushNotifications } from "@/hooks/use-push-notifications";

export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const { user } = useAuth();

  // Delay initialization to avoid hook call errors during initial mount
  useEffect(() => {
    setIsReady(true);
  }, []);

  // Enable push notifications for logged-in users only after component is ready
  const { permission } = usePushNotifications({
    userId: user?.id || null,
    enabled: isReady && !!user?.id
  });

  useEffect(() => {
    if (permission === 'granted' && user) {
      console.log(`✅ [PushNotificationProvider] Notifications push activées pour ${user.name || user.phoneNumber}`);
    }
  }, [permission, user]);

  return <>{children}</>;
}
