-- Update content URLs to match uploaded files in storage

-- Update hypnosis files (days 1-6)
UPDATE content 
SET file_url = 'https://kpewsvpufzkyejchncta.supabase.co/storage/v1/object/public/hypnosis/hipnose_1'
WHERE content_type = 'hypnosis' AND day_number = 1;

UPDATE content 
SET file_url = 'https://kpewsvpufzkyejchncta.supabase.co/storage/v1/object/public/hypnosis/hipnose_2'
WHERE content_type = 'hypnosis' AND day_number = 2;

UPDATE content 
SET file_url = 'https://kpewsvpufzkyejchncta.supabase.co/storage/v1/object/public/hypnosis/hipnose_3'
WHERE content_type = 'hypnosis' AND day_number = 3;

-- Add missing hypnosis content for days 4-6
INSERT INTO content (title, description, content_type, week_number, day_number, duration_minutes, file_url, is_premium, sort_order)
VALUES 
  ('Fortalecendo a Determinação', 'Hipnose para fortalecer sua vontade', 'hypnosis', 1, 4, 10, 'https://kpewsvpufzkyejchncta.supabase.co/storage/v1/object/public/hypnosis/hipnose_4', false, 0),
  ('Libertação Emocional', 'Liberando vínculos emocionais com o cigarro', 'hypnosis', 1, 5, 12, 'https://kpewsvpufzkyejchncta.supabase.co/storage/v1/object/public/hypnosis/hipnose_5', false, 0),
  ('Nova Identidade', 'Consolidando sua nova identidade de não fumante', 'hypnosis', 1, 6, 15, 'https://kpewsvpufzkyejchncta.supabase.co/storage/v1/object/public/hypnosis/hipnose_6', true, 0);

-- Update video for day 1
UPDATE content 
SET file_url = 'https://kpewsvpufzkyejchncta.supabase.co/storage/v1/object/public/videos/video_1'
WHERE content_type = 'video' AND day_number = 1;