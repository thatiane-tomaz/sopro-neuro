import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import soproLogo from "@/assets/sopro-logo.png";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setStatus('error');
      setMessage('Sessão de pagamento não encontrada');
      return;
    }

    const verifyPayment = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { session_id: sessionId }
        });

        if (error) {
          console.error('Error verifying payment:', error);
          setStatus('error');
          setMessage('Erro ao verificar pagamento. Tente novamente.');
          return;
        }

        if (data?.success) {
          setStatus('success');
          setEmail(data.email);
          setMessage('Pagamento confirmado! Você já pode criar sua conta.');
        } else {
          setStatus('error');
          setMessage(data?.message || 'Pagamento não foi concluído');
        }
      } catch (err) {
        console.error('Error:', err);
        setStatus('error');
        setMessage('Erro ao processar pagamento');
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex items-center justify-center mb-4">
          <img src={soproLogo} alt="Sopro" className="h-12 w-auto object-contain" />
        </div>

        {status === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto" />
            <h2 className="text-xl font-semibold text-slate-700">Verificando pagamento...</h2>
            <p className="text-slate-500">Aguarde enquanto confirmamos seu pagamento</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-green-700">Pagamento Confirmado!</h2>
            <p className="text-slate-600">
              Sua assinatura de 30 dias foi ativada com sucesso.
            </p>
            {email && (
              <p className="text-sm text-slate-500">
                Email: <span className="font-medium">{email}</span>
              </p>
            )}
            <div className="pt-4 space-y-3">
              <Button 
                onClick={() => navigate('/install')} 
                className="w-full bg-primary hover:bg-primary/90"
              >
                Instalar o App
              </Button>
              <p className="text-xs text-slate-500">
                Instale o app e crie sua conta com o mesmo email do pagamento
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="bg-red-100 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-red-700">Erro no Pagamento</h2>
            <p className="text-slate-600">{message}</p>
            <div className="pt-4">
              <Button 
                onClick={() => navigate('/')} 
                variant="outline"
                className="w-full"
              >
                Voltar ao início
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
