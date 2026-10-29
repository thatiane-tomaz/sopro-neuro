CREATE POLICY "Temp upload neo-explica desmotivacao"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'neo-explica' AND (storage.foldername(name))[1] = 'desmotivacao');

INSERT INTO public.neo_explica (titulo, pasta, ordem, ativo, segundos_por_imagem)
VALUES ('Por que o cigarro te deixa mais desmotivado para viver a vida?', 'desmotivacao', 2, true, 7);