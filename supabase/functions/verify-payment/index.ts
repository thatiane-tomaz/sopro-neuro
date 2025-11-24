import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id });

    const { session_id } = await req.json();
    if (!session_id) throw new Error("session_id is required");
    logStep("Session ID received", { session_id });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2024-11-20.acacia" as any
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Session retrieved", { status: session.payment_status });

    if (session.payment_status === "paid") {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      logStep("Payment confirmed, updating profile", { expiresAt: expiresAt.toISOString() });

      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ 
          subscription_status: 'premium'
        })
        .eq('user_id', user.id);

      if (updateError) {
        logStep("Error updating profile", { error: updateError });
        throw updateError;
      }

      // Update or create subscription record
      const { error: subError } = await supabaseClient
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          status: 'premium',
          plan_type: '30_days',
          expires_at: expiresAt.toISOString(),
          started_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (subError) {
        logStep("Error updating subscription", { error: subError });
        throw subError;
      }

      logStep("Profile and subscription updated successfully");

      return new Response(JSON.stringify({ 
        success: true,
        expires_at: expiresAt.toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      logStep("Payment not completed", { payment_status: session.payment_status });
      return new Response(JSON.stringify({ 
        success: false,
        payment_status: session.payment_status
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
