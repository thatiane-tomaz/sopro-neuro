import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  expiresAt: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-WELCOME-EMAIL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    const { email, expiresAt }: WelcomeEmailRequest = await req.json();
    logStep("Request received", { email, expiresAt });

    if (!email) {
      throw new Error("Email is required");
    }

    const expirationDate = new Date(expiresAt).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const emailHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao Sopro</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
          
          <!-- Header com Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a365d 0%, #2d4a7c 100%); padding: 40px 30px; text-align: center;">
              <img src="https://kpewsvpufzkyejchncta.supabase.co/storage/v1/object/public/videos/sopro-logo-white.png" alt="Sopro" style="height: 60px; width: auto;" />
            </td>
          </tr>
          
          <!-- Conteúdo Principal -->
          <tr>
            <td style="padding: 40px 30px;">
              <h1 style="color: #1a365d; font-size: 28px; margin: 0 0 20px 0; text-align: center;">
                Bem-vindo à sua jornada de transformação! 🌟
              </h1>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
                Parabéns por dar o primeiro passo! Você está prestes a iniciar uma jornada que irá <strong>transformar a sua vida</strong>. Com o Sopro, você terá acesso a técnicas comprovadas de neurociência e hipnose que vão te ajudar a alcançar seus objetivos.
              </p>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0;">
                Este é o começo de uma nova fase. Estamos aqui para te acompanhar em cada passo dessa transformação.
              </p>
              
              <!-- Box de Download -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f0f7ff; border-radius: 12px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px;">
                    <h2 style="color: #1a365d; font-size: 18px; margin: 0 0 15px 0;">
                      📱 Baixe o App
                    </h2>
                    <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
                      Para começar sua jornada, baixe o aplicativo Sopro:
                    </p>
                    <table role="presentation" style="border-collapse: collapse;">
                      <tr>
                        <td style="padding-right: 10px;">
                          <a href="#" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-size: 14px;">
                            App Store (em breve)
                          </a>
                        </td>
                        <td>
                          <a href="#" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-size: 14px;">
                            Google Play (em breve)
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="color: #e53e3e; font-size: 13px; font-weight: 600; margin: 15px 0 0 0;">
                      ⚠️ Importante: Utilize este mesmo email (${email}) ao criar sua conta no app.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Box de Acesso -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f0fff4; border-radius: 12px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px; text-align: center;">
                    <h2 style="color: #22543d; font-size: 18px; margin: 0 0 10px 0;">
                      ✅ Seu Acesso Premium
                    </h2>
                    <p style="color: #4a5568; font-size: 16px; margin: 0;">
                      Você tem <strong>30 dias de acesso</strong> ao conteúdo completo.
                    </p>
                    <p style="color: #718096; font-size: 14px; margin: 10px 0 0 0;">
                      Válido até: <strong>${expirationDate}</strong>
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Suporte -->
              <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">
                Dúvidas? Entre em contato conosco:<br/>
                <a href="mailto:contato@soproneuro.com.br" style="color: #1a365d; font-weight: 600;">contato@soproneuro.com.br</a>
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
      subject: "🎉 Bem-vindo ao Sopro! Sua jornada de transformação começa agora",
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
