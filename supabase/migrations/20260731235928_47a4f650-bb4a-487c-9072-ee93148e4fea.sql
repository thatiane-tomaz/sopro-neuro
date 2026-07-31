CREATE TABLE public.chat_prompts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria text NOT NULL CHECK (categoria IN ('gancho_neo','abstinencia','reducao')),
  mensagem text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.chat_prompts TO authenticated;
GRANT SELECT ON public.chat_prompts TO anon;
GRANT ALL ON public.chat_prompts TO service_role;

ALTER TABLE public.chat_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_prompts_select_all" ON public.chat_prompts
FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "chat_prompts_admin_write" ON public.chat_prompts
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER chat_prompts_updated_at BEFORE UPDATE ON public.chat_prompts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.chat_prompts (categoria, mensagem, ordem) VALUES
('gancho_neo','O que vamos descobrir hoje?',1),
('gancho_neo','Como posso te ajudar hoje?',2),
('gancho_neo','Vamos dar mais um passo hoje?',3),
('gancho_neo','O que você quer entender hoje?',4),
('gancho_neo','Hoje quero te mostrar uma coisa sobre você.',5),
('reducao','Por que continuo fumando mesmo querendo parar?',1),
('reducao','Qual é o meu gatilho mais forte?',2),
('reducao','Que vazio o cigarro está preenchendo?',3),
('reducao','Qual crença está mantendo esse hábito?',4),
('reducao','O que mudou nos dias em que senti menos vontade?',5),
('reducao','O que acontece no meu cérebro quando eu fumo?',6),
('reducao','Como saber quando estou pronto para parar?',7),
('reducao','Como começo a pensar como um não fumante?',8),
('reducao','Como me conectar com meu corpo?',9),
('reducao','O que meu corpo está tentando me mostrar?',10),
('abstinencia','O que está acontecendo no meu cérebro?',1),
('abstinencia','O que meu cérebro está sentindo agora?',2),
('abstinencia','Como fortalecer minha nova identidade?',3),
('abstinencia','Por que estou mais estressado?',4),
('abstinencia','O que observar hoje?',5),
('abstinencia','Meu corpo já começou a se recuperar?',6),
('abstinencia','O que fazer na próxima vontade?',7),
('abstinencia','Qual gatilho ainda me faz querer fumar?',8),
('abstinencia','Como evitar uma recaída?',9),
('abstinencia','Como me conectar com meu corpo?',10);