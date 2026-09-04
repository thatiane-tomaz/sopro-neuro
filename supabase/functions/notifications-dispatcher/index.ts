import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");
const CRON_SECRET = Deno.env.get("CRON_SECRET");

// Regra global: no máximo 1 push por pessoa a cada 24h.
const GLOBAL_MIN_HOURS = 24;
// Gatilhos imediatos (ex.: missão liberada) podem furar o limite diário,
// respeitando apenas um intervalo curto para não empilhar avisos.
const IMMEDIATE_MIN_HOURS = 6;
const IMMEDIATE_TRIGGERS = ["missao_pronta"];

const PRIORITY: Record<string, number> = {
  gatilho: 10,
  esporadica: 20,
  fixa: 30,
  rotativa: 40,
};


const HOUR_MS = 60 * 60 * 1000;

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

// Hora/minuto/dia-da-semana no fuso de São Paulo
const spNow = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return {
    hour: Number(get("hour")) % 24,
    minute: Number(get("minute")),
    weekday: weekdayMap[get("weekday")] ?? 0,
  };
};

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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dryRun === true;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = Date.now();
    const { hour, minute, weekday } = spNow();
    const bucket = minute < 30 ? 0 : 30;
    const slot = `${String(hour).padStart(2, "0")}:${String(bucket).padStart(2, "0")}`;

    // 1) Campanhas ativas
    const { data: rawCampaigns, error: cErr } = await supabase
      .from("notification_campaigns")
      .select("*")
      .eq("active", true);
    if (cErr) throw cErr;

    const matchesSlot = (c: Campaign) =>
      Array.isArray(c.slot_hours) &&
      c.slot_hours.includes(hour) &&
      (c.slot_minute ?? 0) === bucket;

    const campaigns = (rawCampaigns ?? []).filter((c: Campaign) => {
      if (c.kind === "esporadica") {
        return !c.sent_at && !!c.send_at && new Date(c.send_at).getTime() <= now;
      }
      // Missão liberada: avaliada em toda rodada, não espera horário fixo
      if (c.kind === "gatilho" && IMMEDIATE_TRIGGERS.includes(c.trigger_key ?? "")) return true;
      if (!matchesSlot(c)) return false;
      if (c.kind === "fixa" && c.frequency === "weekly") return c.weekday === weekday;
      return true;
    }) as Campaign[];


    if (campaigns.length === 0) {
      return json({ success: true, slot, sent: 0, message: "Nenhuma campanha para este horário" });
    }

    // 2) Usuários inscritos
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("user_id, onesignal_player_id")
      .not("onesignal_player_id", "is", null);
    if (pErr) throw pErr;

    const subscribers = (profiles ?? []).filter((p: any) => !!p.onesignal_player_id);
    if (subscribers.length === 0) {
      return json({ success: true, slot, sent: 0, message: "Nenhum aparelho inscrito" });
    }
    const userIds = subscribers.map((p: any) => p.user_id as string);
    const playerById = new Map<string, string>(
      subscribers.map((p: any) => [p.user_id as string, p.onesignal_player_id as string]),
    );

    // 3) Histórico de envios (limite global, intervalo por campanha e alternância)
    const historySince = new Date(now - 60 * 24 * HOUR_MS).toISOString();
    const { data: sends } = await supabase
      .from("notification_sends")
      .select("user_id, campaign_id, kind, sent_at")
      .gte("sent_at", historySince)
      .order("sent_at", { ascending: false });

    const lastAny = new Map<string, number>();
    const lastByCampaign = new Map<string, number>();
    const lastKindByUser = new Map<string, string>();
    for (const s of sends ?? []) {
      const t = new Date(s.sent_at).getTime();
      const k = `${s.user_id}|${s.campaign_id}`;
      if (t > (lastAny.get(s.user_id) ?? 0)) lastAny.set(s.user_id, t);
      if (t > (lastByCampaign.get(k) ?? 0)) lastByCampaign.set(k, t);
      // vem ordenado do mais recente para o mais antigo, exclui gatilhos da alternância
      if (!lastKindByUser.has(s.user_id) && (s.kind === "fixa" || s.kind === "rotativa")) {
        lastKindByUser.set(s.user_id, s.kind);
      }
    }


    // Limite global: 1 push por pessoa a cada 24h
    const available = userIds.filter(
      (id) => now - (lastAny.get(id) ?? 0) >= GLOBAL_MIN_HOURS * HOUR_MS,
    );
    // Missão liberada é prioridade: respeita apenas um intervalo curto
    const immediateAvailable = userIds.filter(
      (id) => now - (lastAny.get(id) ?? 0) >= IMMEDIATE_MIN_HOURS * HOUR_MS,
    );
    const audienceUsers = Array.from(new Set([...available, ...immediateAvailable]));
    if (audienceUsers.length === 0) {
      return json({ success: true, slot, sent: 0, message: "Todos no intervalo mínimo" });
    }

    // 4) Jornada de cada usuário
    const { data: hist } = await supabase
      .from("historico_jornada_usuario")
      .select("user_id, jornada, created_at")
      .in("user_id", audienceUsers)
      .order("created_at", { ascending: false });
    const journeyByUser = new Map<string, string>();
    for (const h of hist ?? []) {
      if (!journeyByUser.has(h.user_id)) journeyByUser.set(h.user_id, normalizeJourney(h.jornada));
    }


    // 5) Públicos dos gatilhos (calculados só se houver campanha do tipo)
    const triggerAudience = new Map<string, Set<string>>();
    const neededTriggers = new Set(
      campaigns.filter((c) => c.kind === "gatilho" && c.trigger_key).map((c) => c.trigger_key!),
    );

    if (neededTriggers.has("missao_pronta")) {
      const set = new Set<string>();
      const { data: tracks } = await supabase
        .from("journey_tracking")
        .select("user_id, interaction_type, started_at, finished_at")
        .in("user_id", audienceUsers)
        .or("interaction_type.like.%missao_iniciada_semana_%,interaction_type.like.%missao_semana_%");
      const done = new Set<string>();
      const startedReady: { user: string; key: string }[] = [];
      for (const t of tracks ?? []) {
        const type = t.interaction_type as string;
        if (type.includes("missao_iniciada_semana_")) {
          if (new Date(t.started_at).getTime() <= now - 72 * HOUR_MS && !t.finished_at) {
            startedReady.push({ user: t.user_id, key: type.replace("missao_iniciada_", "missao_") });
          }
        } else if (t.finished_at) {
          done.add(`${t.user_id}|${type}`);
        }
      }
      for (const s of startedReady) {
        if (!done.has(`${s.user}|${s.key}`)) set.add(s.user);
      }
      triggerAudience.set("missao_pronta", set);
    }

    if (neededTriggers.has("inativo_3d")) {
      const { data: sessions } = await supabase
        .from("app_sessions")
        .select("user_id, opened_at")
        .in("user_id", audienceUsers)
        .order("opened_at", { ascending: false });
      const last = new Map<string, number>();
      for (const s of sessions ?? []) {
        if (!last.has(s.user_id)) last.set(s.user_id, new Date(s.opened_at).getTime());
      }
      const set = new Set<string>();
      for (const [uid, t] of last) if (now - t >= 72 * HOUR_MS) set.add(uid);
      triggerAudience.set("inativo_3d", set);
    }

    if (neededTriggers.has("sem_registro_3d")) {
      const { data: logs } = await supabase
        .from("daily_smoking_logs")
        .select("user_id, log_date")
        .in("user_id", audienceUsers)
        .order("log_date", { ascending: false });
      const last = new Map<string, string>();
      for (const l of logs ?? []) {
        if (!last.has(l.user_id)) last.set(l.user_id, l.log_date);
      }
      const cutoff = new Date(now - 72 * HOUR_MS).toISOString().slice(0, 10);
      const set = new Set<string>();
      for (const [uid, d] of last) if (d < cutoff) set.add(uid);
      triggerAudience.set("sem_registro_3d", set);
    }

    // 6) Escolhe UMA campanha por usuário, por prioridade
    const ordered = [...campaigns].sort((a, b) => {
      const pa = PRIORITY[a.kind] ?? a.priority;
      const pb = PRIORITY[b.kind] ?? b.priority;
      if (pa !== pb) return pa - pb;
      return a.priority - b.priority;
    });

    const assignment = new Map<string, Campaign>();

    // 6a) Prioridade máxima: missão liberada — sai na hora, sem esperar o slot
    const immediateCampaigns = ordered.filter(
      (c) => c.kind === "gatilho" && IMMEDIATE_TRIGGERS.includes(c.trigger_key ?? ""),
    );
    for (const c of immediateCampaigns) {
      const aud = triggerAudience.get(c.trigger_key ?? "");
      if (!aud) continue;
      for (const uid of immediateAvailable) {
        if (assignment.has(uid)) continue;
        if (!aud.has(uid)) continue;
        const userJourney = journeyByUser.get(uid) ?? "reducao";
        if (c.journey !== "ambas" && c.journey !== userJourney) continue;
        const lastForCampaign = lastByCampaign.get(`${uid}|${c.id}`) ?? 0;
        const minHours = c.min_hours_between && c.min_hours_between > 0 ? c.min_hours_between : 72;
        if (now - lastForCampaign < minHours * HOUR_MS) continue;
        assignment.set(uid, c);
      }
    }

    for (const uid of available) {
      if (assignment.has(uid)) continue;
      const userJourney = journeyByUser.get(uid) ?? "reducao";
      const rotativas: Campaign[] = [];
      const lastKind = lastKindByUser.get(uid);

      for (const c of ordered) {
        if (c.journey !== "ambas" && c.journey !== userJourney) continue;
        const lastForCampaign = lastByCampaign.get(`${uid}|${c.id}`) ?? 0;
        if (now - lastForCampaign < (c.min_hours_between ?? 0) * HOUR_MS) continue;
        if (c.kind === "gatilho") {
          const aud = triggerAudience.get(c.trigger_key ?? "");
          if (!aud || !aud.has(uid)) continue;
        }
        if (c.kind === "rotativa") {
          rotativas.push(c);
          continue;
        }
        // Alternância: se o último push foi o lembrete fixo, hoje é dia de rotativa
        if (c.kind === "fixa" && lastKind === "fixa") continue;
        assignment.set(uid, c);
        break;
      }

      if (!assignment.has(uid) && rotativas.length > 0) {
        // rotação: a menos recente para esta pessoa
        rotativas.sort(
          (a, b) =>
            (lastByCampaign.get(`${uid}|${a.id}`) ?? 0) - (lastByCampaign.get(`${uid}|${b.id}`) ?? 0),
        );
        assignment.set(uid, rotativas[0]);
      }
    }


    if (assignment.size === 0) {
      return json({ success: true, slot, sent: 0, message: "Ninguém elegível neste horário" });
    }

    // 7) Envia agrupado por campanha
    const byCampaign = new Map<string, string[]>();
    for (const [uid, c] of assignment) {
      const arr = byCampaign.get(c.id) ?? [];
      arr.push(uid);
      byCampaign.set(c.id, arr);
    }

    const results: any[] = [];
    for (const [campaignId, uids] of byCampaign) {
      const c = campaigns.find((x) => x.id === campaignId)!;
      const playerIds = uids.map((u) => playerById.get(u)!).filter(Boolean);
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
            headings: { pt: c.title, en: c.title },
            contents: { pt: c.message, en: c.message },
          }),
        });
        onesignalRes = await res.json();

        await supabase.from("notification_sends").insert(
          uids.map((u) => ({
            campaign_id: c.id,
            user_id: u,
            kind: c.kind,
            slot,
            onesignal_response: onesignalRes,
          })),
        );
        await supabase
          .from("profiles")
          .update({ last_push_sent_at: new Date().toISOString() })
          .in("user_id", uids);
        if (c.kind === "esporadica") {
          await supabase
            .from("notification_campaigns")
            .update({ sent_at: new Date().toISOString() })
            .eq("id", c.id);
        }
      }

      results.push({
        campaign: c.name,
        kind: c.kind,
        journey: c.journey,
        recipients: playerIds.length,
        onesignal: onesignalRes,
      });
    }

    console.log(`slot=${slot} campanhas=${results.length} pessoas=${assignment.size}`);
    return json({ success: true, slot, dryRun, sent: assignment.size, results });
  } catch (error: any) {
    console.error("notifications-dispatcher error:", error);
    return json({ error: error.message }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
