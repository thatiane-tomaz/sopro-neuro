import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REQUEST-REFUND] ${step}${detailsStr}`);
};

const REFUND_PERIOD_DAYS = 7;

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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get refund reason from request body
    const body = await req.json();
    const { reason, additional_info } = body;
    
    if (!reason) {
      throw new Error("Refund reason is required");
    }
    logStep("Refund reason received", { reason, additional_info });

    // Check if user has an active subscription
    const { data: subData, error: subError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('email', user.email)
      .eq('status', 'premium')
      .maybeSingle();

    if (subError) throw subError;
    if (!subData) {
      throw new Error("No active subscription found");
    }
    logStep("Subscription found", { subscriptionId: subData.id, startedAt: subData.started_at });

    // Check if within refund period (7 days from payment)
    const paymentDate = new Date(subData.started_at);
    const now = new Date();
    const daysSincePayment = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    logStep("Checking refund eligibility", { daysSincePayment, refundPeriod: REFUND_PERIOD_DAYS });
    
    if (daysSincePayment > REFUND_PERIOD_DAYS) {
      throw new Error(`Refund period expired. Refunds are only available within ${REFUND_PERIOD_DAYS} days of payment.`);
    }

    // Initialize Stripe and find the payment
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    if (!subData.stripe_customer_id) {
      throw new Error("No Stripe customer ID found for this subscription");
    }

    // Find the most recent successful payment for this customer
    const paymentIntents = await stripe.paymentIntents.list({
      customer: subData.stripe_customer_id,
      limit: 1,
    });

    if (paymentIntents.data.length === 0) {
      throw new Error("No payment found to refund");
    }

    const paymentIntent = paymentIntents.data[0];
    logStep("Found payment intent", { paymentIntentId: paymentIntent.id, amount: paymentIntent.amount });

    // Check if payment was successful
    if (paymentIntent.status !== 'succeeded') {
      throw new Error("Payment was not successful, cannot refund");
    }

    // Process the refund
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntent.id,
      reason: 'requested_by_customer',
    });
    logStep("Refund created", { refundId: refund.id, status: refund.status });

    // Update subscription status to cancelled
    const cancellationNotes = additional_info 
      ? `${reason}: ${additional_info}`
      : reason;

    const { error: updateError } = await supabaseClient
      .from('subscriptions')
      .update({
        status: 'cancelled',
        previous_status: 'premium',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: 'user_request',
        cancellation_notes: cancellationNotes
      })
      .eq('id', subData.id);

    if (updateError) {
      logStep("Error updating subscription", { error: updateError });
      // Don't throw - refund was processed, just log the error
    }

    // Send refund confirmation email via Resend
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
      
      await fetch(`${supabaseUrl}/functions/v1/send-refund-confirmation-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          email: user.email,
          amountRefunded: refund.amount / 100,
          refundId: refund.id
        })
      });
      logStep("Refund confirmation email sent");
    } catch (emailError) {
      logStep("Error sending refund email", { error: emailError });
      // Don't throw - refund was processed successfully
    }

    logStep("Subscription cancelled successfully");

    return new Response(JSON.stringify({
      success: true,
      refund_id: refund.id,
      refund_status: refund.status,
      amount_refunded: refund.amount / 100, // Convert from cents
      message: "Reembolso processado com sucesso"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in request-refund", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
