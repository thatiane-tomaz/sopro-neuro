import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");
const CRON_SECRET = Deno.env.get("CRON_SECRET");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const providedSecret = authHeader?.replace("Bearer ", "");
    if (!providedSecret || providedSecret !== CRON_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const slot: string = body.slot ?? "manual";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch active messages ordered by sequence
    const { data: messages, error: msgErr } = await supabase
      .from("push_messages")
      .select("id, message, sequence_order")
      .eq("active", true)
      .order("sequence_order", { ascending: true });

    if (msgErr) throw msgErr;
    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No active messages" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine next message via total send count (rotates infinitely)
    const { count: totalSends } = await supabase
      .from("push_send_log")
      .select("*", { count: "exact", head: true });

    const idx = (totalSends ?? 0) % messages.length;
    const next = messages[idx];

    // Get all player ids
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("onesignal_player_id")
      .not("onesignal_player_id", "is", null);

    if (profErr) throw profErr;
    const playerIds = (profiles ?? [])
      .map((p: any) => p.onesignal_player_id)
      .filter((v: string | null) => !!v);

    let onesignalRes: any = null;
    if (playerIds.length > 0) {
      const res = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          include_player_ids: playerIds,
          headings: { pt: "Sopro", en: "Sopro" },
          contents: { pt: next.message, en: next.message },
        }),
      });
      onesignalRes = await res.json();
    }

    await supabase.from("push_send_log").insert({
      push_message_id: next.id,
      sequence_order: next.sequence_order,
      slot,
      recipients_count: playerIds.length,
      onesignal_response: onesignalRes,
    });

    return new Response(
      JSON.stringify({
        success: true,
        slot,
        message: next.message,
        sequence_order: next.sequence_order,
        recipients: playerIds.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("send-scheduled-push error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});