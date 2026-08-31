Deno.serve(async () => {
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Lovable-API-Key": Deno.env.get("LOVABLE_API_KEY")!,
      "X-Lovable-AIG-SDK": "fetch",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "google/gemini-3.7-flash", messages: [{ role: "user", content: "diga oi" }] }),
  });
  return new Response(JSON.stringify({ status: r.status, body: (await r.text()).slice(0, 400) }), { headers: { "Content-Type": "application/json" } });
});
