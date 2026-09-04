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
// Missão libera 72h depois de iniciada
const MISSAO_LOCK_MS = 72 * HOUR_MS;
// Limite geral: 1 push por pessoa a cada 24h
const GLOBAL_MIN_HOURS = 24;
// Aviso de missão liberada pode furar o limite, respeitando um respiro curto
const IMMEDIATE_MIN_HOURS = 6;
// Nada é agendado depois desta hora (fuso de São Paulo)
const LAST_HOUR = 21;

type Campaign = {
  id: string;
  name: string;
  kind: string;
  title: string;
  message: string;
  journey: string;
  active: boolean;
  frequency: string | null;
  slot_hours: number[] | null;
  slot_minute: number;
  weekday: number | null;
  trigger_key: string | null;
  min_hours_between: number;
  priority: number;
  send_at: string | null;
  sent_at: string | null;
};

// Offset do fuso de São Paulo em ms (sempre UTC-3)
const SP_OFFSET_MS = 3 * HOUR_MS;
const spParts = (d: Date) => {
  const shifted = new Date(d.getTime() - SP_OFFSET_MS);
  return {
    date: shifted.toISOString().slice(0, 10),
    hour: shifted.getUTCHours(),
    weekday: shifted.getUTCDay(),
  };
};
// Constrói um instante UTC a partir de data/hora de São Paulo
const spInstant = (dateStr: string, hour: number, minute = 0) =>
  new Date(`${dateStr}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`)
    .getTime() + SP_OFFSET_MS;

const normalizeJourney = (raw: string | null | undefined) => {
  const v = (raw ?? "").toLowerCase();
  if (v.includes("lib") || v.includes("abst")) return "liberdade";
  return "reducao";
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const provided = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!provided || provided !== CRON_SECRET) {
      return json({ error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dryRun === true;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = Date.now();
    const today = spParts(new Date(now));
    const dayEnd = spInstant(today.date, LAST_HOUR, 59);

    // 1) Campanhas ativas
    const { data: rawCampaigns, error: cErr } = await supabase
      .from("notification_campaigns")
      .select("*")
      .eq("active", true);
    if (cErr) throw cErr;
    const campaigns = (rawCampaigns ?? []) as Campaign[];

    // 2) Aparelhos inscritos
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("user_id, onesignal_player_id")
      .not("onesignal_player_id", "is", null);
    if (pErr) throw pErr;
    const subscribers = (profiles ?? []).filter((p: any) => !!p.onesignal_player_id);
    if (subscribers.length === 0) return json({ success: true, planned: 0, message: "Nenhum aparelho inscrito" });

    const userIds = subscribers.map((p: any) => p.user_id as string);
    const playerById = new Map<string, string>(
      subscribers.map((p: any) => [p.user_id as string, p.onesignal_player_id as string]),
    );

    // 3) Histórico (limite geral, intervalo por campanha e alternância)
    const { data: sends } = await supabase
      .from("notification_sends")
      .select("user_id, campaign_id, kind, sent_at")
      .gte("sent_at", new Date(now - 60 * 24 * HOUR_MS).toISOString())
      .order("sent_at", { ascending: false });

    const lastAny = new Map<string, number>();
    const lastByCampaign = new Map<string, number>();
    const lastKindByUser = new Map<string, string>();
    for (const s of sends ?? []) {
      const t = new Date(s.sent_at).getTime();
      if (t > (lastAny.get(s.user_id) ?? 0)) lastAny.set(s.user_id, t);
      const k = `${s.user_id}|${s.campaign_id}`;
      if (t > (lastByCampaign.get(k) ?? 0)) lastByCampaign.set(k, t);
      if (!lastKindByUser.has(s.user_id) && (s.kind === "fixa" || s.kind === "rotativa")) {
        lastKindByUser.set(s.user_id, s.kind);
      }
    }

    // 4) Jornada de cada pessoa
    const { data: hist } = await supabase
      .from("historico_jornada_usuario")
      .select("user_id, jornada, created_at")
      .in("user_id", userIds)
      .order("created_at", { ascending: false });
    const journeyByUser = new Map<string, string>();
    for (const h of hist ?? []) {
      if (!journeyByUser.has(h.user_id)) journeyByUser.set(h.user_id, normalizeJourney(h.jornada));
    }

    // 5) Quais missões liberam hoje (started_at + 72h) e ainda não foram concluídas
    const missaoUnlockByUser = new Map<string, number>();
    {
      const { data: tracks } = await supabase
        .from("journey_tracking")
        .select("user_id, interaction_type, started_at, finished_at")
        .in("user_id", userIds)
        .or("interaction_type.like.%missao_iniciada_semana_%,interaction_type.like.%missao_semana_%");

      const done = new Set<string>();
      const pending: { user: string; key: string; unlock: number }[] = [];
      for (const t of tracks ?? []) {
        const type = t.interaction_type as string;
        if (type.includes("missao_iniciada_semana_")) {
          if (!t.finished_at) {
            pending.push({
              user: t.user_id,
              key: type.replace("missao_iniciada_", "missao_"),
              unlock: new Date(t.started_at).getTime() + MISSAO_LOCK_MS,
            });
          }
        } else if (t.finished_at) {
          done.add(`${t.user_id}|${type}`);
        }
      }
      for (const p of pending) {
        if (done.has(`${p.user}|${p.key}`)) continue;
        // libera hoje (ou já liberou e ainda não avisamos)
        if (p.unlock > dayEnd) continue;
        const prev = missaoUnlockByUser.get(p.user);
        if (prev === undefined || p.unlock < prev) missaoUnlockByUser.set(p.user, p.unlock);
      }
    }

    // 6) Monta o plano do dia: no máximo 1 mensagem por pessoa
    type Plan = { user: string; campaign: Campaign; at: number };
    const plans: Plan[] = [];
    const planned = new Set<string>();

    const pickSlot = (c: Campaign) => {
      const hours = (c.slot_hours ?? []).filter((h) => h <= LAST_HOUR).sort((a, b) => a - b);
      const hour = hours.find((h) => spInstant(today.date, h, c.slot_minute ?? 0) > now) ?? hours[0];
      if (hour === undefined) return null;
      const at = spInstant(today.date, hour, c.slot_minute ?? 0);
      return at > now ? at : null;
    };

    // 6a) Prioridade máxima: missão liberada — agendada para a hora exata da liberação
    const missaoCampaign = campaigns.find((c) => c.kind === "gatilho" && c.trigger_key === "missao_pronta");
    if (missaoCampaign) {
      for (const [uid, unlock] of missaoUnlockByUser) {
        const userJourney = journeyByUser.get(uid) ?? "reducao";
        if (missaoCampaign.journey !== "ambas" && missaoCampaign.journey !== userJourney) continue;
        const lastCamp = lastByCampaign.get(`${uid}|${missaoCampaign.id}`) ?? 0;
        const minHours = missaoCampaign.min_hours_between > 0 ? missaoCampaign.min_hours_between : 72;
        if (now - lastCamp < minHours * HOUR_MS) continue;
        // respiro curto em relação ao último push recebido
        const earliest = Math.max(unlock, (lastAny.get(uid) ?? 0) + IMMEDIATE_MIN_HOURS * HOUR_MS, now + 60_000);
        if (earliest > dayEnd) continue;
        plans.push({ user: uid, campaign: missaoCampaign, at: earliest });
        planned.add(uid);
      }
    }

    // 6b) Esporádicas do dia
    for (const c of campaigns.filter((c) => c.kind === "esporadica" && !c.sent_at && c.send_at)) {
      const at = Math.max(new Date(c.send_at!).getTime(), now + 60_000);
      if (at > dayEnd) continue;
      for (const uid of userIds) {
        if (planned.has(uid)) continue;
        const userJourney = journeyByUser.get(uid) ?? "reducao";
        if (c.journey !== "ambas" && c.journey !== userJourney) continue;
        if (now - (lastAny.get(uid) ?? 0) < GLOBAL_MIN_HOURS * HOUR_MS) continue;
        plans.push({ user: uid, campaign: c, at });
        planned.add(uid);
      }
    }

    // 6c) Alternância: um dia o lembrete fixo, no outro uma frase rotativa
    const fixas = campaigns.filter((c) => {
      if (c.kind !== "fixa") return false;
      if (c.frequency === "weekly") return c.weekday === today.weekday;
      return true;
    });
    const rotativas = campaigns.filter((c) => c.kind === "rotativa");

    for (const uid of userIds) {
      if (planned.has(uid)) continue;
      if (now - (lastAny.get(uid) ?? 0) < GLOBAL_MIN_HOURS * HOUR_MS) continue;
      const userJourney = journeyByUser.get(uid) ?? "reducao";
      const fits = (c: Campaign) =>
        (c.journey === "ambas" || c.journey === userJourney) &&
        now - (lastByCampaign.get(`${uid}|${c.id}`) ?? 0) >= (c.min_hours_between ?? 0) * HOUR_MS;

      const preferRotativa = lastKindByUser.get(uid) === "fixa";
      const groups = preferRotativa ? [rotativas, fixas] : [fixas, rotativas];

      let chosen: { c: Campaign; at: number } | null = null;
      for (const group of groups) {
        const options = group.filter(fits);
        if (options.length === 0) continue;
        // rotativa: a menos recente para esta pessoa
        options.sort(
          (a, b) =>
            (lastByCampaign.get(`${uid}|${a.id}`) ?? 0) - (lastByCampaign.get(`${uid}|${b.id}`) ?? 0),
        );
        for (const c of options) {
          const at = pickSlot(c);
          if (at !== null) {
            chosen = { c, at };
            break;
          }
        }
        if (chosen) break;
      }
      if (!chosen) continue;
      plans.push({ user: uid, campaign: chosen.c, at: chosen.at });
      planned.add(uid);
    }

    if (plans.length === 0) {
      return json({ success: true, day: today.date, planned: 0, message: "Nada a agendar hoje" });
    }

    // 7) Agenda no OneSignal: um envio por (campanha, horário)
    const groups = new Map<string, { campaign: Campaign; at: number; users: string[] }>();
    for (const p of plans) {
      const key = `${p.campaign.id}|${Math.floor(p.at / 60_000)}`;
      const g = groups.get(key) ?? { campaign: p.campaign, at: p.at, users: [] };
      g.users.push(p.user);
      groups.set(key, g);
    }

    const results: any[] = [];
    for (const g of groups.values()) {
      const playerIds = g.users.map((u) => playerById.get(u)!).filter(Boolean);
      if (playerIds.length === 0) continue;

      let onesignalRes: any = { dryRun: true };
      if (!dryRun) {
        const res = await fetch("https://onesignal.com/api/v1/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
          },
          body: JSON.stringify({
            app_id: ONESIGNAL_APP_ID,
            include_player_ids: playerIds,
            headings: { pt: g.campaign.title, en: g.campaign.title },
            contents: { pt: g.campaign.message, en: g.campaign.message },
            send_after: new Date(g.at).toISOString(),
          }),
        });
        onesignalRes = await res.json();

        const scheduledIso = new Date(g.at).toISOString();
        await supabase.from("notification_sends").insert(
          g.users.map((u) => ({
            campaign_id: g.campaign.id,
            user_id: u,
            kind: g.campaign.kind,
            slot: scheduledIso.slice(11, 16),
            onesignal_response: onesignalRes,
            sent_at: scheduledIso,
          })),
        );
        await supabase
          .from("profiles")
          .update({ last_push_sent_at: scheduledIso })
          .in("user_id", g.users);
        if (g.campaign.kind === "esporadica") {
          await supabase
            .from("notification_campaigns")
            .update({ sent_at: new Date().toISOString() })
            .eq("id", g.campaign.id);
        }
      }

      results.push({
        campaign: g.campaign.name,
        kind: g.campaign.kind,
        scheduled_for: new Date(g.at).toISOString(),
        recipients: playerIds.length,
        onesignal: onesignalRes,
      });
    }

    console.log(`dia=${today.date} grupos=${results.length} pessoas=${plans.length}`);
    return json({ success: true, day: today.date, dryRun, planned: plans.length, results });
  } catch (error: any) {
    console.error("notifications-planner error:", error);
    return json({ error: error.message }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
