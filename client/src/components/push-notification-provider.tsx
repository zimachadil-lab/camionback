// Provider pour gérer automatiquement les notifications push pour les utilisateurs connectés
import { useEffect, useState, useRef } from "react";
import { usePushNotifications } from "@/hooks/use-push-notifications";

export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  // Use state to react to localStorage changes
  const [user, setUser] = useState<any>(null);
  const userRef = useRef<any>(null);

  // Check localStorage on mount and listen for storage events
  useEffect(() => {
    // Initial load from localStorage
    const loadUser = () => {
      const userJson = localStorage.getItem("camionback_user");
      const parsedUser = userJson ? JSON.parse(userJson) : null;
      console.log('🔄 [PushNotificationProvider] User loaded from localStorage:', parsedUser ? {
        id: parsedUser.id,
        name: parsedUser.name,
        role: parsedUser.role,
        phoneNumber: parsedUser.phoneNumber
      } : 'null');
      userRef.current = parsedUser;
      setUser(parsedUser);
    };

    loadUser();

    // Poll localStorage every 2 seconds to detect changes
    // This is more reliable than storage events which don't fire in the same tab
    const intervalId = setInterval(() => {
      const currentUserJson = localStorage.getItem("camionback_user");
      const currentUser = currentUserJson ? JSON.parse(currentUserJson) : null;
      
      // Compare with current state using ref
      if (JSON.stringify(currentUser) !== JSON.stringify(userRef.current)) {
        console.log('🔄 [PushNotificationProvider] User change detected in localStorage, reloading...');
        userRef.current = currentUser;
        setUser(currentUser);
      }
    }, 2000); // Check every 2 seconds

    // Listen for storage changes from other tabs (this won't fire in the same tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'camionback_user') {
        console.log('🔄 [PushNotificationProvider] localStorage change detected from another tab');
        loadUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Enable push notifications for logged-in users
  const { permission } = usePushNotifications({
    userId: user?.id || null,
    enabled: !!user?.id
  });

  useEffect(() => {
    if (permission === 'granted' && user) {
      console.log(`✅ [PushNotificationProvider] Notifications push activées pour ${user.name || user.phoneNumber}`);
    }
  }, [permission, user]);

  return <>{children}</>;
}
