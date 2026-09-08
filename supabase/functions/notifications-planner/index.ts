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
// Tamanho da página nas leituras (evita o teto de 1.000 linhas)
const PAGE = 1000;

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
  created_at?: string | null;
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

    // 2) Aparelhos inscritos (paginado: sem teto de 1.000 linhas)
    const subscribers: any[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error: pErr } = await supabase
        .from("profiles")
        .select("user_id, onesignal_player_id, last_push_sent_at, push_last_kind, push_last_rotativa_id")
        .not("onesignal_player_id", "is", null)
        .order("user_id", { ascending: true })
        .range(from, from + PAGE - 1);
      if (pErr) throw pErr;
      subscribers.push(...(data ?? []).filter((p: any) => !!p.onesignal_player_id));
      if ((data ?? []).length < PAGE) break;
    }
    if (subscribers.length === 0) return json({ success: true, planned: 0, message: "Nenhum aparelho inscrito" });

    const userIds = subscribers.map((p: any) => p.user_id as string);
    const playerById = new Map<string, string>(
      subscribers.map((p: any) => [p.user_id as string, p.onesignal_player_id as string]),
    );
    // Estado de rotação guardado no próprio perfil — dispensa varrer meses de histórico
    const lastAny = new Map<string, number>();
    const lastKindByUser = new Map<string, string>();
    const lastRotativaByUser = new Map<string, string>();
    for (const p of subscribers) {
      if (p.last_push_sent_at) lastAny.set(p.user_id, new Date(p.last_push_sent_at).getTime());
      if (p.push_last_kind) lastKindByUser.set(p.user_id, p.push_last_kind);
      if (p.push_last_rotativa_id) lastRotativaByUser.set(p.user_id, p.push_last_rotativa_id);
    }

    // 3) Jornada de cada pessoa (paginado)
    const journeyByUser = new Map<string, string>();
    for (let from = 0; ; from += PAGE) {
      const { data } = await supabase
        .from("historico_jornada_usuario")
        .select("user_id, jornada, created_at")
        .order("created_at", { ascending: false })
        .range(from, from + PAGE - 1);
      const rows = data ?? [];
      for (const h of rows) {
        if (!journeyByUser.has(h.user_id)) journeyByUser.set(h.user_id, normalizeJourney(h.jornada));
      }
      if (rows.length < PAGE) break;
    }

    // 5) Quais missões liberam hoje (started_at + 72h) e ainda não foram concluídas
    const missaoUnlockByUser = new Map<string, number>();
    {
      const tracks: any[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data } = await supabase
          .from("journey_tracking")
          .select("user_id, interaction_type, started_at, finished_at")
          .or("interaction_type.like.%missao_iniciada_semana_%,interaction_type.like.%missao_semana_%")
          .order("started_at", { ascending: false })
          .range(from, from + PAGE - 1);
        const rows = data ?? [];
        tracks.push(...rows);
        if (rows.length < PAGE) break;
      }

      const done = new Set<string>();
      const pending: { user: string; key: string; unlock: number }[] = [];
      for (const t of tracks) {
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
      const minHours = missaoCampaign.min_hours_between > 0 ? missaoCampaign.min_hours_between : 72;
      // Histórico curto: só desta campanha e só dentro da própria janela de repetição
      const lastMissao = new Map<string, number>();
      for (let from = 0; ; from += PAGE) {
        const { data } = await supabase
          .from("notification_sends")
          .select("user_id, sent_at")
          .eq("campaign_id", missaoCampaign.id)
          .gte("sent_at", new Date(now - minHours * HOUR_MS).toISOString())
          .order("sent_at", { ascending: false })
          .range(from, from + PAGE - 1);
        const rows = data ?? [];
        for (const s of rows) {
          const t = new Date(s.sent_at).getTime();
          if (t > (lastMissao.get(s.user_id) ?? 0)) lastMissao.set(s.user_id, t);
        }
        if (rows.length < PAGE) break;
      }

      for (const [uid, unlock] of missaoUnlockByUser) {
        if (!playerById.has(uid)) continue;
        const userJourney = journeyByUser.get(uid) ?? "reducao";
        if (missaoCampaign.journey !== "ambas" && missaoCampaign.journey !== userJourney) continue;
        if (lastMissao.has(uid)) continue;
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
    // Fila de rotativas em ordem fixa: sabendo a última, sabemos a próxima
    const rotativas = campaigns
      .filter((c) => c.kind === "rotativa")
      .sort((a, b) => a.priority - b.priority || (a.created_at ?? "").localeCompare(b.created_at ?? ""));

    // Próxima da fila depois da última enviada para esta pessoa
    const nextRotativa = (uid: string, journey: string) => {
      if (rotativas.length === 0) return null;
      const lastId = lastRotativaByUser.get(uid);
      const lastIdx = lastId ? rotativas.findIndex((c) => c.id === lastId) : -1;
      for (let step = 1; step <= rotativas.length; step++) {
        const c = rotativas[(lastIdx + step + rotativas.length) % rotativas.length];
        if (c.journey === "ambas" || c.journey === journey) return c;
      }
      return null;
    };

    for (const uid of userIds) {
      if (planned.has(uid)) continue;
      if (now - (lastAny.get(uid) ?? 0) < GLOBAL_MIN_HOURS * HOUR_MS) continue;
      const userJourney = journeyByUser.get(uid) ?? "reducao";

      const fixaOption = fixas.find((c) => c.journey === "ambas" || c.journey === userJourney) ?? null;
      const rotativaOption = nextRotativa(uid, userJourney);
      // Se a última foi a fixa, hoje é dia de rotativa — e vice-versa
      const order = lastKindByUser.get(uid) === "fixa"
        ? [rotativaOption, fixaOption]
        : [fixaOption, rotativaOption];

      let chosen: { c: Campaign; at: number } | null = null;
      for (const c of order) {
        if (!c) continue;
        const at = pickSlot(c);
        if (at !== null) {
          chosen = { c, at };
          break;
        }
      }
      if (!chosen) continue;
      plans.push({ user: uid, campaign: chosen.c, at: chosen.at });
      planned.add(uid);
    }


    if (plans.length === 0) {
      return json({ success: true, day: today.date, planned: 0, message: "Nada a agendar hoje" });
    }

    // 7) Agenda no OneSignal: um envio individual por pessoa
    //    (individual para que possa ser cancelado se a pessoa usar o app no dia)
    const results: any[] = [];
    for (const p of plans) {
      const playerId = playerById.get(p.user);
      if (!playerId) continue;

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
            include_player_ids: [playerId],
            headings: { pt: p.campaign.title, en: p.campaign.title },
            contents: { pt: p.campaign.message, en: p.campaign.message },
            send_after: new Date(p.at).toISOString(),
          }),
        });
        onesignalRes = await res.json();

        const scheduledIso = new Date(p.at).toISOString();
        await supabase.from("notification_sends").insert({
          campaign_id: p.campaign.id,
          user_id: p.user,
          kind: p.campaign.kind,
          slot: scheduledIso.slice(11, 16),
          onesignal_response: onesignalRes,
          onesignal_notification_id: onesignalRes?.id ?? null,
          sent_at: scheduledIso,
        });
        // Guarda o ponteiro da rotação: qual tipo e qual frase foram as últimas
        const profileUpdate: Record<string, unknown> = { last_push_sent_at: scheduledIso };
        if (p.campaign.kind === "fixa" || p.campaign.kind === "rotativa") {
          profileUpdate.push_last_kind = p.campaign.kind;
          if (p.campaign.kind === "rotativa") profileUpdate.push_last_rotativa_id = p.campaign.id;
        }
        await supabase.from("profiles").update(profileUpdate).eq("user_id", p.user);
        if (p.campaign.kind === "esporadica") {
          await supabase
            .from("notification_campaigns")
            .update({ sent_at: new Date().toISOString() })
            .eq("id", p.campaign.id);
        }
      }

      results.push({
        campaign: p.campaign.name,
        kind: p.campaign.kind,
        scheduled_for: new Date(p.at).toISOString(),
        onesignal_id: onesignalRes?.id ?? null,
        onesignal: onesignalRes,
      });
    }

    console.log(`dia=${today.date} agendados=${results.length}`);

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
