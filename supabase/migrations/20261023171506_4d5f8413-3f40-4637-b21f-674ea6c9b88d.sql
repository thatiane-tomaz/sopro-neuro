CREATE POLICY "Authenticated can read images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'images');