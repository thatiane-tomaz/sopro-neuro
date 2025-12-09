import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';

let isInitialized = false;

export const initializePushNotifications = async () => {
  // Evitar inicialização duplicada
  if (isInitialized) {
    console.log('Push notifications já inicializadas');
    return;
  }

  // Apenas funciona em plataformas nativas
  if (!Capacitor.isNativePlatform()) {
    console.log('Push notifications só funcionam em apps nativos');
    return;
  }

  try {
    // Remover todos os listeners existentes antes de adicionar novos
    await PushNotifications.removeAllListeners();

    // Solicitar permissão
    const permStatus = await PushNotifications.requestPermissions();
    
    if (permStatus.receive === 'granted') {
      await PushNotifications.register();
    } else {
      console.log('Permissão de push notifications negada');
      return;
    }

    // Listener para quando o token for registrado
    await PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token:', token.value);
      
      try {
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
      } catch (err) {
        console.error('Erro ao processar registro de push:', err);
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

    isInitialized = true;
    console.log('Push notifications inicializadas com sucesso');

  } catch (error) {
    console.error('Erro ao inicializar push notifications:', error);
    // Não propagar o erro para não quebrar o app
  }
};
