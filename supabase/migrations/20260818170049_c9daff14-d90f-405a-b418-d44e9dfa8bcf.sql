-- Remove políticas públicas dos buckets antigos
DROP POLICY IF EXISTS "Videos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Hypnosis files are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "hypnosis_public_access" ON storage.objects;
DROP POLICY IF EXISTS "videos_public_access" ON storage.objects;

-- Somente usuários autenticados podem ler
DROP POLICY IF EXISTS "Authenticated can read videos" ON storage.objects;
CREATE POLICY "Authenticated can read videos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'videos');

DROP POLICY IF EXISTS "Authenticated can read hypnosis" ON storage.objects;
CREATE POLICY "Authenticated can read hypnosis"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'hypnosis');