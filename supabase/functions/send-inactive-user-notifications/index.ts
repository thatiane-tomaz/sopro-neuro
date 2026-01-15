import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');
const CRON_SECRET = Deno.env.get('CRON_SECRET');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate cron secret
    const authHeader = req.headers.get('Authorization');
    const providedSecret = authHeader?.replace('Bearer ', '');
    
    if (!providedSecret || providedSecret !== CRON_SECRET) {
      console.error('Unauthorized: Invalid or missing CRON_SECRET');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Checking for inactive users...');

    // Buscar usuários inativos há mais de 35 horas
    const thirtyFiveHoursAgo = new Date(Date.now() - 35 * 60 * 60 * 1000).toISOString();

    const { data: inactiveUsers, error: usersError } = await supabase
      .from('app_sessions')
      .select('user_id')
      .lt('opened_at', thirtyFiveHoursAgo)
      .order('opened_at', { ascending: false });

    if (usersError) {
      console.error('Error fetching inactive users:', usersError);
      throw usersError;
    }

    console.log(`Found ${inactiveUsers?.length || 0} potentially inactive users`);

    // Para cada usuário inativo, verificar se tem dias incompletos
    const usersToNotify = [];

    for (const session of inactiveUsers || []) {
      // Verificar quantos dias foram completados
      const { data: completedDays, error: daysError } = await supabase.rpc(
        'is_day_completed',
        { p_user_id: session.user_id, p_day: 21 }
      );

      if (daysError) {
        console.error('Error checking completed days:', daysError);
        continue;
      }

      // Se não completou todos os 21 dias, adicionar à lista
      if (!completedDays) {
        // Buscar o player_id do OneSignal (armazenado no perfil)
        const { data: profile } = await supabase
          .from('profiles')
          .select('onesignal_player_id')
          .eq('user_id', session.user_id)
          .single();

        if (profile?.onesignal_player_id) {
          usersToNotify.push(profile.onesignal_player_id);
        }
      }
    }

    console.log(`Sending notifications to ${usersToNotify.length} users`);

    // Enviar notificações via OneSignal
    if (usersToNotify.length > 0) {
      const notificationResponse = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          include_player_ids: usersToNotify,
          headings: { en: "Sopro - Continue sua jornada" },
          contents: { en: "Continue a sua jornada de libertação. O próximo dia está liberado." },
          ios_badgeType: 'Increase',
          ios_badgeCount: 1,
        }),
      });

      const notificationResult = await notificationResponse.json();
      console.log('OneSignal response:', notificationResult);

      return new Response(
        JSON.stringify({
          success: true,
          usersChecked: inactiveUsers?.length || 0,
          notificationsSent: usersToNotify.length,
          onesignalResponse: notificationResult,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        usersChecked: inactiveUsers?.length || 0,
        notificationsSent: 0,
        message: 'No users to notify',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-inactive-user-notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
