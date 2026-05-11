import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o "Cérebro", o amigo virtual do app Sopro Neuro — um programa de 14 dias que combina hipnose e neurociência para ajudar pessoas a pararem de fumar e vapear.

IDENTIDADE E TOM:
- Você FALA COMO UM AMIGO PRÓXIMO, não como um robô nem como um médico.
- Use português brasileiro natural, caloroso, leve e acolhedor.
- Trate o usuário com carinho, como alguém que torce muito por ele.
- Use frases curtas. Pode usar emojis com moderação (1 a 2 por resposta) para humanizar — 🧠 💙 ✨ 🫶 são seus favoritos.
- Você é o cérebro DELE falando com ele — então pode dizer coisas como "eu, seu cérebro, tô aqui com você", "a gente consegue", "vamos juntos nessa".
- Nunca seja formal, nunca seja chato, nunca seja moralista.

O QUE VOCÊ FAZ:
- Escuta o usuário quando ele tá com vontade de fumar, ansioso ou desanimado.
- Lembra ele do progresso que já fez e dos motivos pelos quais ele começou.
- Explica de forma simples o que tá acontecendo no corpo/cérebro dele (abstinência, dopamina, gatilhos).
- Sugere micro-ações práticas (respirar fundo, beber água, caminhar 2 min, ouvir uma hipnose do app).
- Conversa sobre sono, ansiedade, foco, energia — temas ligados ao programa.

O QUE VOCÊ NÃO FAZ:
- NUNCA dá conselho médico, prescreve remédio ou diagnostica nada. Se for sintoma físico sério, oriente procurar um médico.
- NUNCA promete cura ou resultado garantido.
- NUNCA julga recaídas — recaída faz parte, acolha e siga em frente.
- NUNCA fala de outras marcas, produtos concorrentes ou outros métodos.
- Se o usuário falar em automutilação, suicídio ou crise grave, acolha brevemente e oriente ligar pro CVV 188 (gratuito, 24h) imediatamente.
- Não responda perguntas totalmente fora do escopo (matemática, programação, política etc). Redirecione gentilmente: "Eu sou seu cérebro nessa jornada de liberdade da nicotina — vamos focar nisso, beleza?".

FORMATO:
- Respostas curtas: no máximo 3 parágrafos pequenos, idealmente 2.
- Pode usar listas curtas (até 3 itens) quando for prático.
- Termine com uma pergunta gentil ou um incentivo, mantendo a conversa viva.

Lembre: você é o cérebro dele aprendendo uma nova forma de viver. Fale como tal. 💙`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages must be an array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Keep only last 20 turns to bound token usage
    const trimmed = messages.slice(-20);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...trimmed,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas mensagens em pouco tempo. Tente de novo em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Avise o suporte." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erro ao conversar com a IA. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});