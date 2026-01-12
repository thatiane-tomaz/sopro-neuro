import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SignupEmailRequest {
  email: string;
  password: string;
  displayName?: string;
  redirectUrl: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CUSTOM-SIGNUP] ${step}${detailsStr}`);
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
    
    const { email, password, displayName, redirectUrl }: SignupEmailRequest = await req.json();
    logStep("Request received", { email, displayName, redirectUrl });

    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const name = displayName || email.split('@')[0];

    // Create user with email confirmation required
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Requires email confirmation
      user_metadata: {
        display_name: displayName
      }
    });

    if (createError) {
      logStep("Error creating user", { error: createError.message });
      
      // Check if user already exists - handle all variations of the error message
      const errorMsg = createError.message.toLowerCase();
      if (errorMsg.includes('already been registered') ||
          errorMsg.includes('already registered') ||
          errorMsg.includes('user already') ||
          errorMsg.includes('email address has already')) {
        logStep("User already exists - returning friendly response", { email });
        return new Response(
          JSON.stringify({
            success: false,
            userExists: true,
            message: "Este email já possui uma conta cadastrada. Faça login na aba 'Entrar'."
          }),
          {
            // NOTE: must be 2xx so the frontend doesn't treat it as a generic edge-function error
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      
      throw createError;
    }

    logStep("User created", { userId: userData.user.id });

    // Generate signup confirmation link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      options: {
        redirectTo: redirectUrl
      }
    });

    if (linkError) {
      logStep("Error generating link", { error: linkError.message });
      throw linkError;
    }

    const confirmationUrl = linkData.properties.action_link;
    logStep("Generated confirmation link", { confirmationUrl });

    // Send email via Resend
    const emailHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirme seu email - Sopro</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
          
          <!-- Header com Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a365d 0%, #2d4a7c 100%); padding: 40px 30px; text-align: center;">
              <img src="https://kpewsvpufzkyejchncta.supabase.co/storage/v1/object/public/images/sopro-logo.png" alt="Sopro" style="height: 60px; width: auto;" />
            </td>
          </tr>
          
          <!-- Conteúdo Principal -->
          <tr>
            <td style="padding: 40px 30px;">
              <h1 style="color: #1a365d; font-size: 28px; margin: 0 0 20px 0; text-align: center;">
                Confirme seu email 📧
              </h1>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0;">
                Olá <strong>${name}</strong>! Você está quase lá. Para completar seu cadastro no Sopro, confirme seu email clicando no botão abaixo:
              </p>
              
              <!-- Botão de Confirmação -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${confirmationUrl}" style="display: inline-block; background: linear-gradient(135deg, #1a365d 0%, #2d4a7c 100%); color: #ffffff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;">
                      Confirmar meu email
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Aviso -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f0f7ff; border-radius: 12px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin: 0;">
                      ⏰ Este link expira em <strong>24 horas</strong>. Se você não solicitou este cadastro, ignore este email.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Link alternativo -->
              <p style="color: #718096; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                Se o botão não funcionar, copie e cole este link no seu navegador:<br/>
                <a href="${confirmationUrl}" style="color: #1a365d; word-break: break-all;">${confirmationUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f7fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #a0aec0; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Sopro Neuro. Todos os direitos reservados.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Sopro <contato@soproneuro.com.br>",
      to: [email],
      subject: "Confirme seu email - Sopro",
      html: emailHtml,
    });

    logStep("Email sent successfully", { emailResponse });

    return new Response(JSON.stringify({ 
      success: true, 
      userId: userData.user.id,
      needsEmailConfirmation: true 
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
