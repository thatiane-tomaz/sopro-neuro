import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Inicia a inscrição em push notifications (OneSignal) assim que existe
 * um usuário logado. Só tem efeito em app nativo (iOS/Android).
 */
const PushInitializer = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const { initializePushNotifications } = await import(
          "@/services/pushNotifications"
        );
        if (!cancelled) await initializePushNotifications();
      } catch (error) {
        console.log("Falha ao iniciar push notifications", error);
      }
    }, 2500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [user]);

  return null;
};

export default PushInitializer;
