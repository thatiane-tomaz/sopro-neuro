import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");
const CRON_SECRET = Deno.env.get("CRON_SECRET");

const HOUR_MS = 60 * 60 * 1000;
const SP_OFFSET_MS = 3 * HOUR_MS;

// Início do dia atual no fuso de São Paulo, em UTC
const spDayStart = (now: number) => {
  const shifted = new Date(now - SP_OFFSET_MS);
  const dateStr = shifted.toISOString().slice(0, 10);
  return new Date(`${dateStr}T00:00:00.000Z`).getTime() + SP_OFFSET_MS;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const provided = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!provided) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dryRun === true;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Aceita a chave do agendamento (todos os usuários) ou o login da própria pessoa (só ela)
    let onlyUserId: string | null = null;
    if (provided !== CRON_SECRET) {
      const { data: userData, error: uErr } = await supabase.auth.getUser(provided);
      if (uErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
      onlyUserId = userData.user.id;
    }

    const now = Date.now();
    const dayStart = spDayStart(now);

    // 1) Mensagens ainda não enviadas (agendadas para daqui pra frente) e não canceladas
    let pendingQuery = supabase
      .from("notification_sends")
      .select("id, user_id, kind, sent_at, onesignal_notification_id")
      .is("cancelled_at", null)
      .not("onesignal_notification_id", "is", null)
      .gt("sent_at", new Date(now + 60_000).toISOString());
    if (onlyUserId) pendingQuery = pendingQuery.eq("user_id", onlyUserId);
    const { data: pending, error: pErr } = await pendingQuery;
    if (pErr) throw pErr;


    if (!pending || pending.length === 0) {
      return json({ success: true, cancelled: 0, message: "Nenhuma mensagem pendente" });
    }

    const userIds = [...new Set(pending.map((p: any) => p.user_id as string))];

    // 2) Quem abriu o app hoje (fuso de São Paulo)
    const { data: sessions, error: sErr } = await supabase
      .from("app_sessions")
      .select("user_id")
      .in("user_id", userIds)
      .gte("opened_at", new Date(dayStart).toISOString());
    if (sErr) throw sErr;

    const activeToday = new Set((sessions ?? []).map((s: any) => s.user_id as string));
    const toCancel = pending.filter((p: any) => activeToday.has(p.user_id));

    if (toCancel.length === 0) {
      return json({ success: true, cancelled: 0, message: "Ninguém usou o app ainda hoje" });
    }

    let cancelled = 0;
    const failures: any[] = [];
    for (const item of toCancel as any[]) {
      if (dryRun) {
        cancelled++;
        continue;
      }
      const url = `https://onesignal.com/api/v1/notifications/${item.onesignal_notification_id}?app_id=${ONESIGNAL_APP_ID}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Basic ${ONESIGNAL_REST_API_KEY}` },
      });
      const payload = await res.json().catch(() => ({}));

      // 404/400 = já saiu ou não existe mais: marcamos como resolvido para não tentar de novo
      const gone = res.status === 404 || res.status === 400;
      if (!res.ok && !gone) {
        failures.push({ id: item.id, status: res.status, payload });
        continue;
      }

      await supabase
        .from("notification_sends")
        .update({ cancelled_at: new Date().toISOString() })
        .eq("id", item.id);
      cancelled++;
    }

    console.log(`canceladas=${cancelled} falhas=${failures.length}`);
    return json({ success: true, dryRun, cancelled, failures });
  } catch (error: any) {
    console.error("notifications-cancel-on-activity error:", error);
    return json({ error: error.message }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
