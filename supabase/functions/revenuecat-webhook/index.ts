import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REVENUECAT-WEBHOOK] ${step}${detailsStr}`);
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
    logStep("Webhook received");

    // Validate authorization header
    const authHeader = req.headers.get("Authorization");
    const expectedSecret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
    
    // Accept either raw secret or "Bearer <secret>" format
    const isValid = authHeader === expectedSecret || authHeader === `Bearer ${expectedSecret}`;
    
    if (!authHeader || !isValid) {
      logStep("Unauthorized request", { hasAuth: !!authHeader });
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const body = await req.json();
    logStep("Webhook body received", { event_type: body.event?.type });

    const event = body.event;
    if (!event) {
      return new Response(JSON.stringify({ error: "No event in body" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const eventType = event.type;
    const appUserId = event.app_user_id;
    const productId = event.product_id;
    const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms) : null;
    const purchasedAt = event.purchased_at_ms ? new Date(event.purchased_at_ms) : null;
    const priceInPurchasedCurrency = event.price_in_purchased_currency;
    const email = event.subscriber_attributes?.["$email"]?.value;

    logStep("Event details", {
      eventType,
      appUserId,
      productId,
      expiresAt: expiresAt?.toISOString(),
      email
    });

    // Events that grant premium access
    const grantPremiumEvents = [
      "INITIAL_PURCHASE",
      "RENEWAL",
      "PRODUCT_CHANGE",
      "UNCANCELLATION",
      "NON_RENEWING_PURCHASE"
    ];

    // Events that revoke premium access
    const revokePremiumEvents = [
      "EXPIRATION",
      "BILLING_ISSUE",
      "CANCELLATION"
    ];

    let status: 'premium' | 'expired' | 'cancelled' | null = null;

    if (grantPremiumEvents.includes(eventType)) {
      status = 'premium';
    } else if (eventType === "EXPIRATION") {
      status = 'expired';
    } else if (eventType === "CANCELLATION") {
      status = 'cancelled';
    }

    if (!status) {
      logStep("Event type not handled, skipping", { eventType });
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Try to find user by app_user_id (which should be the Supabase user ID)
    // or by email if available
    let userId = appUserId;
    
    // If app_user_id looks like a RevenueCat anonymous ID, try to find by email
    if (appUserId.startsWith("$RCAnonymousID") && email) {
      const { data: profileData } = await supabaseClient
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .maybeSingle();
      
      if (profileData) {
        userId = profileData.user_id;
        logStep("Found user by email", { email, userId });
      }
    }

    // Check if subscription exists for this user
    const { data: existingSub } = await supabaseClient
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const subscriptionData = {
      user_id: userId,
      email: email || null,
      status: status,
      plan_type: status === 'premium' ? 'premium_30' : 'free',
      expires_at: expiresAt?.toISOString() || null,
      started_at: purchasedAt?.toISOString() || new Date().toISOString(),
      amount_paid: priceInPurchasedCurrency ? Math.round(priceInPurchasedCurrency * 100) : null,
      updated_at: new Date().toISOString()
    };

    if (existingSub) {
      // Update existing subscription
      const { error: updateError } = await supabaseClient
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existingSub.id);

      if (updateError) {
        logStep("Error updating subscription", { error: updateError });
        throw updateError;
      }
      logStep("Subscription updated", { subscriptionId: existingSub.id, status });
    } else {
      // Insert new subscription
      const { error: insertError } = await supabaseClient
        .from('subscriptions')
        .insert(subscriptionData);

      if (insertError) {
        logStep("Error inserting subscription", { error: insertError });
        throw insertError;
      }
      logStep("Subscription created", { userId, status });
    }

    // Update profile subscription status
    await supabaseClient
      .from('profiles')
      .update({ subscription_status: status })
      .eq('user_id', userId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in revenuecat-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
