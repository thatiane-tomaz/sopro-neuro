
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE public.push_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  sequence_order integer NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX push_messages_sequence_order_key ON public.push_messages(sequence_order);

GRANT SELECT ON public.push_messages TO authenticated;
GRANT ALL ON public.push_messages TO service_role;
ALTER TABLE public.push_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read push_messages" ON public.push_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage push_messages" ON public.push_messages FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.push_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  push_message_id uuid NOT NULL REFERENCES public.push_messages(id) ON DELETE CASCADE,
  sequence_order integer NOT NULL,
  slot text NOT NULL,
  recipients_count integer NOT NULL DEFAULT 0,
  onesignal_response jsonb,
  sent_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.push_send_log TO authenticated;
GRANT ALL ON public.push_send_log TO service_role;
ALTER TABLE public.push_send_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read push_send_log" ON public.push_send_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

INSERT INTO public.push_messages (message, sequence_order) VALUES
('Faça 3 respirações profundas. 💙', 1),
('Perceba 3 sons ao seu redor. 💙', 2),
('Como seu corpo está se sentindo agora? 💙', 3),
('Quais sensações você percebe neste momento? 💙', 4),
('Relaxe seu rosto e corpo. 💙', 5),
('Solte a tensão dos ombros. 💙', 6),
('Pense em uma coisa pela qual você é grato. 💙', 7),
('Observe um detalhe que você nunca tinha reparado. 💙', 8),
('Faça uma pausa de 1 minuto e apenas respire. 💙', 9),
('Qual pensamento está ocupando sua mente agora? 💙', 10),
('O que você aprendeu hoje? 💙', 11),
('Levante-se e alongue o corpo por 30 segundos. 💙', 12),
('Inspire calma. Expire tensão. 💙', 13),
('O que você realmente precisa agora? 💙', 14),
('Escolha fazer algo gentil por você. 💙', 15),
('Escolha fazer algo gentil por alguém. 💙', 16);
