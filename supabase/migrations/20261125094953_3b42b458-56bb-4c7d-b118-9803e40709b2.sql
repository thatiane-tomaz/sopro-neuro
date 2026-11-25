INSERT INTO public.habitos_jornada (habito_titulo, tipo_usuario, posicao, video_nome, hipnose_nome, imagem_nome, video, hipnose, missao, tema_fixo)
SELECT 'Dia ' || n, 'ultimo_cigarro', n::text, 'video_dia' || n || '.mp4', 'hipnose_dia' || n || '.mp3', NULL, true, true, false, true
FROM generate_series(1, 7) AS n
WHERE NOT EXISTS (SELECT 1 FROM public.habitos_jornada h WHERE h.tipo_usuario = 'ultimo_cigarro' AND h.posicao = n::text);

ALTER POLICY "own insert" ON public.ultima_jornada_usuario
WITH CHECK (auth.uid() = user_id AND jornada IN ('reducao', 'abstinencia', 'ultimo_cigarro'));
ALTER POLICY "own update" ON public.ultima_jornada_usuario
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND jornada IN ('reducao', 'abstinencia', 'ultimo_cigarro'));