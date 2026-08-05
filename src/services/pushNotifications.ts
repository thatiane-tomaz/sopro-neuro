import { supabase } from '@/integrations/supabase/client';

let isInitialized = false;

// Carrega o Capacitor somente quando necessário (no navegador não existe)
const getCapacitor = async () => {
  try {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor;
  } catch {
    console.log('Capacitor não disponível');
    return null;
  }
};

const getOneSignal = async (): Promise<any | null> => {
  try {
    const mod: any = await import('onesignal-cordova-plugin');
    return mod.default ?? mod;
  } catch (error) {
    console.log('Plugin do OneSignal não disponível', error);
    return null;
  }
};

const fetchAppId = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('push-config');
    if (error) {
      console.error('Erro ao buscar App ID do OneSignal:', error);
      return null;
    }
    return (data as any)?.appId ?? null;
  } catch (error) {
    console.error('Erro ao buscar configuração de push:', error);
    return null;
  }
};

// Salva o subscription ID do OneSignal (é isso que a API include_player_ids espera)
const saveSubscriptionId = async (subscriptionId: string | null | undefined) => {
  if (!subscriptionId) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ onesignal_player_id: subscriptionId })
      .eq('user_id', user.id);

    if (error) console.error('Erro ao salvar subscription ID:', error);
    else console.log('OneSignal subscription ID salvo:', subscriptionId);
  } catch (error) {
    console.error('Erro ao processar subscription ID:', error);
  }
};

export const initializePushNotifications = async () => {
  if (isInitialized) {
    console.log('Push notifications já inicializadas');
    return;
  }

  try {
    const Capacitor = await getCapacitor();
    if (!Capacitor || !Capacitor.isNativePlatform()) {
      console.log('Push notifications só funcionam em apps nativos');
      return;
    }

    const OneSignal = await getOneSignal();
    if (!OneSignal) return;

    const appId = await fetchAppId();
    if (!appId) {
      console.error('App ID do OneSignal não configurado');
      return;
    }

    OneSignal.initialize(appId);

    // Vincula o usuário do app ao OneSignal (permite envio por external id no futuro)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) OneSignal.login(user.id);
    } catch (error) {
      console.error('Erro ao vincular usuário ao OneSignal:', error);
    }

    // Atualiza o ID sempre que a inscrição mudar (troca de token, reinstalação, etc.)
    try {
      OneSignal.User.pushSubscription.addEventListener('change', (event: any) => {
        saveSubscriptionId(event?.current?.id);
      });
    } catch (error) {
      console.log('Listener de inscrição indisponível', error);
    }

    const accepted = await OneSignal.Notifications.requestPermission(true);
    if (!accepted) {
      console.log('Permissão de push notifications negada');
      isInitialized = true;
      return;
    }

    const subscriptionId = await OneSignal.User.pushSubscription.getIdAsync();
    await saveSubscriptionId(subscriptionId);

    isInitialized = true;
    console.log('Push notifications inicializadas com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar push notifications:', error);
    isInitialized = false;
  }
};
