import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RefundEmailRequest {
  email: string;
  amountRefunded: number;
  refundId: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-REFUND-CONFIRMATION-EMAIL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    const { email, amountRefunded, refundId }: RefundEmailRequest = await req.json();
    logStep("Request received", { email, amountRefunded, refundId });

    if (!email) {
      throw new Error("Email is required");
    }

    const formattedAmount = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amountRefunded);

    const emailHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reembolso Confirmado - Sopro</title>
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
                Reembolso Confirmado ✅
              </h1>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0;">
                Seu pedido de reembolso foi processado com sucesso. Abaixo estão os detalhes:
              </p>
              
              <!-- Detalhes do Reembolso -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f0fff4; border-radius: 12px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #c6f6d5;">
                          <span style="color: #718096; font-size: 14px;">Valor reembolsado:</span>
                        </td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #c6f6d5; text-align: right;">
                          <span style="color: #22543d; font-size: 18px; font-weight: 600;">${formattedAmount}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0;">
                          <span style="color: #718096; font-size: 14px;">ID do reembolso:</span>
                        </td>
                        <td style="padding: 10px 0; text-align: right;">
                          <span style="color: #4a5568; font-size: 14px; font-family: monospace;">${refundId}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Aviso -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f0f7ff; border-radius: 12px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin: 0;">
                      💳 O valor será creditado na sua forma de pagamento original em até <strong>5-10 dias úteis</strong>, dependendo do seu banco.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
                Lamentamos que você esteja cancelando. Se houver algo que possamos melhorar, nos conte!
              </p>
              
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
      subject: "Reembolso Confirmado - Sopro",
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
