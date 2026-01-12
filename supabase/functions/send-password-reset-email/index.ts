import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetEmailRequest {
  email: string;
  resetUrl: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-PASSWORD-RESET-EMAIL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    const { email, resetUrl }: PasswordResetEmailRequest = await req.json();
    logStep("Request received", { email, resetUrl });

    if (!email || !resetUrl) {
      throw new Error("Email and resetUrl are required");
    }

    const emailHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinir senha - Sopro Neuro</title>
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
                Redefinir sua senha 🔐
              </h1>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0;">
                Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Sopro Neuro</strong>. Clique no botão abaixo para criar uma nova senha:
              </p>
              
              <!-- Botão de Reset -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #1a365d 0%, #2d4a7c 100%); color: #ffffff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;">
                      Redefinir minha senha
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Aviso -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fff5f5; border-radius: 12px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #c53030; font-size: 14px; line-height: 1.6; margin: 0;">
                      ⚠️ Se você não solicitou a redefinição de senha, <strong>ignore este email</strong>. Sua senha permanecerá a mesma.
                    </p>
                  </td>
                </tr>
              </table>
              
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f0f7ff; border-radius: 12px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin: 0;">
                      ⏰ Este link expira em <strong>1 hora</strong> por motivos de segurança.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Link alternativo -->
              <p style="color: #718096; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                Se o botão não funcionar, copie e cole este link no seu navegador:<br/>
                <a href="${resetUrl}" style="color: #1a365d; word-break: break-all;">${resetUrl}</a>
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
      from: "Sopro Neuro <contato@soproneuro.com.br>",
      to: [email],
      subject: "Redefinir sua senha - Sopro Neuro",
      html: emailHtml,
    });

    logStep("Email sent successfully", { emailResponse });

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    logStep("ERROR sending email", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
