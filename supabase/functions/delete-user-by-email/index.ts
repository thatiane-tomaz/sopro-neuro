import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DELETE-USER-BY-EMAIL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");
    
    const { email, reason } = await req.json();
    
    if (!email) {
      throw new Error("Email is required");
    }

    logStep("Searching for user", { email });

    // List all users and find by email
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      logStep("Error listing users", { error: listError.message });
      throw listError;
    }

    const user = usersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      logStep("User not found in auth.users", { email });
      return new Response(JSON.stringify({ 
        success: true, 
        message: "User not found - no deletion needed",
        found: false 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    logStep("User found", { userId: user.id, email: user.email });

    // 1. Record the deletion in deleted_accounts table BEFORE deleting user
    const { error: recordError } = await supabaseAdmin
      .from('deleted_accounts')
      .insert({
        user_id: user.id,
        reason: reason || 'User requested account deletion'
      });

    if (recordError) {
      logStep("Error recording deletion", { error: recordError.message });
      // Continue anyway - we don't want to block deletion
    } else {
      logStep("Deletion recorded in deleted_accounts");
    }

    // 2. Delete from profiles (personal info only)
    const { error: profileDeleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', user.id);

    if (profileDeleteError) {
      logStep("Error deleting profile", { error: profileDeleteError.message });
    } else {
      logStep("Profile deleted");
    }

    // 3. Delete subscriptions by email (not user_id to catch all)
    const { error: subDeleteError } = await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('email', email);

    if (subDeleteError) {
      logStep("Error deleting subscriptions", { error: subDeleteError.message });
    } else {
      logStep("Subscriptions cleaned up");
    }

    // 4. Delete onboarding_responses
    const { error: onboardingDeleteError } = await supabaseAdmin
      .from('onboarding_responses')
      .delete()
      .eq('user_id', user.id);

    if (onboardingDeleteError) {
      logStep("Error deleting onboarding responses", { error: onboardingDeleteError.message });
    } else {
      logStep("Onboarding responses deleted");
    }

    // 5. Delete feedback_responses
    const { error: feedbackDeleteError } = await supabaseAdmin
      .from('feedback_responses')
      .delete()
      .eq('user_id', user.id);

    if (feedbackDeleteError) {
      logStep("Error deleting feedback responses", { error: feedbackDeleteError.message });
    } else {
      logStep("Feedback responses deleted");
    }

    // NOTE: We intentionally DO NOT delete from journey_tracking
    // This data is kept for analytics purposes (anonymized after user deletion)
    logStep("Journey tracking data preserved for analytics");

    // 6. Delete user from auth.users (this will cascade to user_roles)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      logStep("Error deleting user from auth", { error: deleteError.message });
      throw deleteError;
    }

    logStep("User deleted successfully", { userId: user.id });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "User deleted successfully. Tracking data preserved.",
      found: true,
      deletedUserId: user.id
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
