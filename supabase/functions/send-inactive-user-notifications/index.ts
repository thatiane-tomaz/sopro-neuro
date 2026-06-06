import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');
const CRON_SECRET = Deno.env.get('CRON_SECRET');

const INACTIVITY_HOURS = 72;
const MIN_HOURS_BETWEEN_NOTIFICATIONS = 72;

const PHASE_1_MESSAGE = "Falta pouco para a sua liberdade! Volte para o Sopro 🫁";
const PHASE_2_MESSAGE = "Toda onda passa! Respire e siga em frente 🫁";

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

    // Calculate timestamps
    const fortyEightHoursAgo = new Date(Date.now() - INACTIVITY_HOURS * 60 * 60 * 1000).toISOString();
    const minTimeBetweenPush = new Date(Date.now() - MIN_HOURS_BETWEEN_NOTIFICATIONS * 60 * 60 * 1000).toISOString();

    // Get all users with their latest session
    const { data: allSessions, error: sessionsError } = await supabase
      .from('app_sessions')
      .select('user_id, opened_at')
      .order('opened_at', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      throw sessionsError;
    }

    // Get unique users with their most recent session
    const userLatestSession = new Map<string, string>();
    for (const session of allSessions || []) {
      if (!userLatestSession.has(session.user_id)) {
        userLatestSession.set(session.user_id, session.opened_at);
      }
    }

    // Filter users inactive for more than 48 hours
    const inactiveUserIds = Array.from(userLatestSession.entries())
      .filter(([_, lastOpened]) => new Date(lastOpened) < new Date(fortyEightHoursAgo))
      .map(([userId]) => userId);

    console.log(`Found ${inactiveUserIds.length} users inactive for more than ${INACTIVITY_HOURS}h`);

    if (inactiveUserIds.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          usersChecked: userLatestSession.size,
          notificationsSent: 0,
          message: 'No inactive users found',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get profiles with OneSignal player_id for inactive users
    // Filter out users who received a push in the last 48 hours
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, onesignal_player_id, last_push_sent_at')
      .in('user_id', inactiveUserIds)
      .not('onesignal_player_id', 'is', null);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    // Filter users who haven't received a notification in the last 48 hours
    const eligibleProfiles = (profiles || []).filter(profile => {
      if (!profile.last_push_sent_at) return true;
      return new Date(profile.last_push_sent_at) < new Date(minTimeBetweenPush);
    });

    console.log(`${eligibleProfiles.length} users eligible for notification (not notified in last ${MIN_HOURS_BETWEEN_NOTIFICATIONS}h)`);

    if (eligibleProfiles.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          usersChecked: userLatestSession.size,
          inactiveUsers: inactiveUserIds.length,
          notificationsSent: 0,
          message: 'All inactive users were already notified recently',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check which users haven't completed all 21 days
    const usersPhase1: { userId: string; playerId: string }[] = [];
    const usersPhase2: { userId: string; playerId: string }[] = [];

    for (const profile of eligibleProfiles) {
      // Skip users who already completed day 14 (program done)
      const { data: day14Done } = await supabase.rpc(
        'is_day_completed',
        { p_user_id: profile.user_id, p_day: 14 }
      );
      if (day14Done) continue;

      // Determine phase: find highest completed day (1..13)
      let lastCompletedDay = 0;
      for (let d = 13; d >= 1; d--) {
        const { data: done } = await supabase.rpc(
          'is_day_completed',
          { p_user_id: profile.user_id, p_day: d }
        );
        if (done) { lastCompletedDay = d; break; }
      }

      // Phase 1 = days 1-7 (next day to do is 1..7 → last completed 0..6)
      // Phase 2 = days 8-14 (last completed 7..13)
      const entry = {
        userId: profile.user_id,
        playerId: profile.onesignal_player_id!,
      };
      if (lastCompletedDay < 7) {
        usersPhase1.push(entry);
      } else {
        usersPhase2.push(entry);
      }
    }

    const usersToNotify = [...usersPhase1, ...usersPhase2];
    console.log(`To notify: ${usersPhase1.length} (Phase 1) + ${usersPhase2.length} (Phase 2) = ${usersToNotify.length}`);

    if (usersToNotify.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          usersChecked: userLatestSession.size,
          inactiveUsers: inactiveUserIds.length,
          notificationsSent: 0,
          message: 'No eligible users to notify',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Helper: send batch via OneSignal
    const sendBatch = async (playerIds: string[], message: string, label: string) => {
      if (playerIds.length === 0) return null;
      const res = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          include_player_ids: playerIds,
          headings: { pt: "Sopro", en: "Sopro" },
          contents: { pt: message, en: message },
          ios_badgeType: 'Increase',
          ios_badgeCount: 1,
        }),
      });
      const json = await res.json();
      console.log(`OneSignal ${label} response:`, json);
      return json;
    };

    const [phase1Result, phase2Result] = await Promise.all([
      sendBatch(usersPhase1.map(u => u.playerId), PHASE_1_MESSAGE, 'Phase 1'),
      sendBatch(usersPhase2.map(u => u.playerId), PHASE_2_MESSAGE, 'Phase 2'),
    ]);

    // Update last_push_sent_at for notified users
    const userIdsToUpdate = usersToNotify.map(u => u.userId);
    const now = new Date().toISOString();
    
    for (const userId of userIdsToUpdate) {
      await supabase
        .from('profiles')
        .update({ last_push_sent_at: now })
        .eq('user_id', userId);
    }

    console.log(`Updated last_push_sent_at for ${userIdsToUpdate.length} users`);

    return new Response(
      JSON.stringify({
        success: true,
        usersChecked: userLatestSession.size,
        inactiveUsers: inactiveUserIds.length,
        notificationsSent: usersToNotify.length,
        phase1Sent: usersPhase1.length,
        phase2Sent: usersPhase2.length,
        phase1Response: phase1Result,
        phase2Response: phase2Result,
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
