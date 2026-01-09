-- Create images bucket for email assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);

-- Allow public read access
CREATE POLICY "Public read access for images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');