import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';

export const initializePushNotifications = async () => {
  // Apenas funciona em plataformas nativas
  if (!Capacitor.isNativePlatform()) {
    console.log('Push notifications só funcionam em apps nativos');
    return;
  }

  try {
    // Solicitar permissão
    const permStatus = await PushNotifications.requestPermissions();
    
    if (permStatus.receive === 'granted') {
      await PushNotifications.register();
    }

    // Listener para quando o token for registrado
    await PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token:', token.value);
      
      // Salvar o player ID no perfil do usuário
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ onesignal_player_id: token.value })
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Erro ao salvar player ID:', error);
        }
      }
    });

    // Listener para erros de registro
    await PushNotifications.addListener('registrationError', (error) => {
      console.error('Erro no registro de push:', error);
    });

    // Listener para notificações recebidas
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push recebido:', notification);
    });

    // Listener para quando o usuário toca na notificação
    await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed:', notification);
    });

  } catch (error) {
    console.error('Erro ao inicializar push notifications:', error);
  }
};
