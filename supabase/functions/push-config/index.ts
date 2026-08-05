import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Retorna apenas o App ID do OneSignal, que é um valor público (usado no app cliente).
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const appId = Deno.env.get("ONESIGNAL_APP_ID") ?? null;

  return new Response(JSON.stringify({ appId }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});