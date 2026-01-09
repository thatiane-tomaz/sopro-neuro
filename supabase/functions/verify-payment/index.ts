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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const { session_id } = await req.json();
    if (!session_id) throw new Error("session_id is required");
    logStep("Session ID received", { session_id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Retrieve checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Stripe session retrieved", { 
      payment_status: session.payment_status,
      customer_email: session.customer_details?.email,
      amount_total: session.amount_total
    });

    if (session.payment_status === 'paid') {
      const customerEmail = session.customer_details?.email;
      if (!customerEmail) throw new Error("Customer email not found in session");

      const amountPaid = session.amount_total || 0;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      logStep("Payment confirmed, creating/updating subscription", { 
        email: customerEmail,
        amount: amountPaid,
        expires_at: expiresAt.toISOString()
      });

      // Upsert subscription by email
      const { data: subData, error: subError } = await supabaseClient
        .from('subscriptions')
        .upsert({
          email: customerEmail,
          status: 'premium',
          plan_type: 'premium',
          amount_paid: amountPaid,
          expires_at: expiresAt.toISOString(),
          started_at: new Date().toISOString(),
          stripe_customer_id: session.customer as string,
        }, {
          onConflict: 'email'
        })
        .select()
        .single();

      if (subError) {
        logStep("Error upserting subscription", { error: subError });
        throw subError;
      }

      logStep("Subscription created/updated successfully", { subscription_id: subData?.id });

      // Send welcome email
      try {
        const emailResponse = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-welcome-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            },
            body: JSON.stringify({
              email: customerEmail,
              expiresAt: expiresAt.toISOString(),
            }),
          }
        );
        const emailResult = await emailResponse.json();
        logStep("Welcome email sent", { result: emailResult });
      } catch (emailError) {
        // Don't fail the payment verification if email fails
        logStep("Error sending welcome email (non-blocking)", { error: emailError });
      }

      return new Response(JSON.stringify({ 
        success: true,
        email: customerEmail,
        expires_at: expiresAt.toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ 
      success: false, 
      message: "Payment not completed" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
