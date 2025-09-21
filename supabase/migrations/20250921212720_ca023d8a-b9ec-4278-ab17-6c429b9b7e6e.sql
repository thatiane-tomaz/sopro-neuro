-- Create storage policies for public access to videos and hypnosis buckets

-- Policy for public access to videos bucket
INSERT INTO storage.policies (id, bucket_id, name, definition, check_expression, command)
VALUES (
  'videos_public_access',
  'videos', 
  'Public access to videos',
  'true',
  NULL,
  'SELECT'
) ON CONFLICT (id) DO NOTHING;

-- Policy for public access to hypnosis bucket
INSERT INTO storage.policies (id, bucket_id, name, definition, check_expression, command)
VALUES (
  'hypnosis_public_access',
  'hypnosis',
  'Public access to hypnosis',
  'true', 
  NULL,
  'SELECT'
) ON CONFLICT (id) DO NOTHING;