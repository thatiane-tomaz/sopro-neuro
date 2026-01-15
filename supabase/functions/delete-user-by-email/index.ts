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
    
    const { email } = await req.json();
    
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

    // Delete user from auth.users (this cascades to profiles, etc.)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      logStep("Error deleting user", { error: deleteError.message });
      throw deleteError;
    }

    logStep("User deleted successfully", { userId: user.id });

    // Also clean up subscriptions by email (not user_id)
    const { error: subDeleteError } = await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('email', email);

    if (subDeleteError) {
      logStep("Error deleting subscriptions", { error: subDeleteError.message });
    } else {
      logStep("Subscriptions cleaned up");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "User deleted successfully",
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
