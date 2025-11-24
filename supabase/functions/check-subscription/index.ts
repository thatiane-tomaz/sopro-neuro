import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check subscription in database
    const { data: subData, error: subError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subError && subError.code !== 'PGRST116') {
      logStep("Error fetching subscription", { error: subError });
      throw subError;
    }

    const now = new Date();
    let hasActiveSub = false;
    let subscriptionEnd = null;

    if (subData && subData.expires_at) {
      const expiresAt = new Date(subData.expires_at);
      hasActiveSub = expiresAt > now && subData.status === 'premium';
      subscriptionEnd = subData.expires_at;
      logStep("Subscription found", { 
        expiresAt: subData.expires_at, 
        isActive: hasActiveSub,
        status: subData.status
      });

      // Update profile if status changed
      if (!hasActiveSub && subData.status === 'premium') {
        logStep("Subscription expired, updating profile");
        await supabaseClient
          .from('profiles')
          .update({ subscription_status: 'free' })
          .eq('user_id', user.id);

        await supabaseClient
          .from('subscriptions')
          .update({ 
            status: 'expired',
            previous_status: 'premium'
          })
          .eq('user_id', user.id)
          .eq('id', subData.id);
      } else if (hasActiveSub) {
        // Ensure profile is premium if sub is active
        await supabaseClient
          .from('profiles')
          .update({ subscription_status: 'premium' })
          .eq('user_id', user.id);
      }
    } else {
      logStep("No subscription found or no expiration date");
      
      // Update profile to free status
      await supabaseClient
        .from('profiles')
        .update({ subscription_status: 'free' })
        .eq('user_id', user.id);
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      product_id: hasActiveSub ? '30_days_access' : null,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
