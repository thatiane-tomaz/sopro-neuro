-- Create storage policies for public access to videos and hypnosis buckets using correct storage.objects table

-- Policy for public access to videos bucket
CREATE POLICY "videos_public_access" ON storage.objects
FOR SELECT USING (bucket_id = 'videos');

-- Policy for public access to hypnosis bucket  
CREATE POLICY "hypnosis_public_access" ON storage.objects
FOR SELECT USING (bucket_id = 'hypnosis');