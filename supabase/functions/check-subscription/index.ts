import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

    // Check if request has email in body (for pre-signup check) or auth header (for logged in user)
    const authHeader = req.headers.get("Authorization");
    let email: string | null = null;
    let userId: string | null = null;
    let requestedEmail: string | null = null;
    let isAuthenticated = false;

    // Try to get email from request body first
    try {
      const body = await req.json();
      if (typeof body?.email === "string" && body.email.length <= 320) {
        requestedEmail = body.email;
      }
    } catch {
      // No body, will try auth header
    }

    // Always prefer the verified identity of the caller
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

      if (!userError && userData.user?.email) {
        email = userData.user.email;
        userId = userData.user.id;
        isAuthenticated = true;
        logStep("Email from authenticated user", { email, userId });
      }
    }

    // Unauthenticated pre-signup lookup: never reveal subscription/payment details,
    // only whether the email already has an account and a subscription record.
    if (!isAuthenticated) {
      if (!requestedEmail) {
        return new Response(JSON.stringify({ subscribed: false, error: "Email not provided" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const lookupEmail = requestedEmail.toLowerCase();

      const { data: sub } = await supabaseClient
        .from("subscriptions")
        .select("id")
        .eq("email", requestedEmail)
        .maybeSingle();

      const { data: freelist } = await supabaseClient
        .from("freelist_users")
        .select("id, expires_at")
        .eq("email", requestedEmail)
        .maybeSingle();

      const freelistValid = !!freelist &&
        (!freelist.expires_at || new Date(freelist.expires_at) > new Date());

      const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
      const hasAccount = existingUsers?.users?.some(
        (u) => u.email?.toLowerCase() === lookupEmail,
      ) || false;

      logStep("Minimal pre-signup lookup performed");

      return new Response(JSON.stringify({
        subscribed: false,
        has_subscription: !!sub || freelistValid,
        has_account: hasAccount,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (!email) {
      return new Response(JSON.stringify({ 
        subscribed: false,
        error: "Email not provided" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // First check freelist (users who can access without payment)
    const { data: freelistData } = await supabaseClient
      .from('freelist_users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (freelistData) {
      // Check if freelist entry has expiration
      const now = new Date();
      const freelistExpired = freelistData.expires_at ? new Date(freelistData.expires_at) < now : false;
      
      if (!freelistExpired) {
        logStep("User found in freelist", { email, reason: freelistData.reason });
        
        // Check if user already has an account in Supabase Auth
        const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
        const userExists = existingUsers?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase()) || false;
        logStep("Checking if freelist user has account", { email, userExists });
        
        return new Response(JSON.stringify({
          subscribed: true,
          has_subscription: true,
          status: 'freelist',
          is_freelist: true,
          reason: freelistData.reason,
          expires_at: freelistData.expires_at,
          has_account: userExists
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // Check subscription in database by email first, then by user_id
    let subData = null;
    let subError = null;

    // Try by email
    const emailResult = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    subData = emailResult.data;
    subError = emailResult.error;

    // If not found by email and we have a userId, try by user_id
    if (!subData && !subError && userId) {
      logStep("No subscription by email, trying user_id", { userId });
      const userIdResult = await supabaseClient
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      subData = userIdResult.data;
      subError = userIdResult.error;
    }

    if (subError) {
      logStep("Error fetching subscription", { error: subError });
      throw subError;
    }

    if (!subData) {
      logStep("No subscription found", { email, userId });
      return new Response(JSON.stringify({ 
        subscribed: false,
        has_subscription: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // If subscription found by user_id but missing email, update it
    if (subData && !subData.email && email) {
      logStep("Updating subscription with email", { email });
      await supabaseClient
        .from('subscriptions')
        .update({ email })
        .eq('id', subData.id);
    }

    const now = new Date();
    const expiresAt = subData.expires_at ? new Date(subData.expires_at) : null;
    const isActive = expiresAt ? expiresAt > now : false;

    logStep("Subscription found", { 
      email,
      status: subData.status,
      expires_at: subData.expires_at,
      is_active: isActive,
      has_user_id: !!subData.user_id
    });

    // If user is logged in and subscription doesn't have user_id, link them
    if (userId && !subData.user_id && isActive) {
      logStep("Linking user_id to subscription", { userId });
      await supabaseClient
        .from('subscriptions')
        .update({ user_id: userId })
        .eq('id', subData.id);
    }

    // Update status if expired
    if (!isActive && subData.status === 'premium') {
      logStep("Subscription expired, updating status");
      await supabaseClient
        .from('subscriptions')
        .update({ 
          status: 'expired',
          previous_status: 'premium'
        })
        .eq('id', subData.id);
    }

    return new Response(JSON.stringify({
      subscribed: isActive,
      has_subscription: true,
      status: isActive ? 'active' : 'expired',
      expires_at: subData.expires_at,
      amount_paid: subData.amount_paid,
      started_at: subData.started_at,
      has_account: !!subData.user_id
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
