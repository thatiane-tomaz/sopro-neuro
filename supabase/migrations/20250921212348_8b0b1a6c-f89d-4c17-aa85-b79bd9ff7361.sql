-- Update content URLs to include file extensions

-- Update hypnosis files (days 1-6) with correct extensions
UPDATE content 
SET file_url = 'https://kpewsvpufzkyejchncta.supabase.co/storage/v1/object/public/hypnosis/hipnose_1.mp3'
WHERE content_type = 'hypnosis' AND day_number = 1;

UPDATE content 
SET file_url = 'https://kpewsvpufzkyejchncta.supabase.co/storage/v1/object/public/hypnosis/hipnose_2.mp3'
WHERE content_type = 'hypnosis' AND day_number = 2;

UPDATE content 
SET file_url = 'https://kpewsvpufzkyejchncta.supabase.co/storage/v1/object/public/hypnosis/hipnose_3.mp3'
WHERE content_type = 'hypnosis' AND day_number = 3;

UPDATE content 
SET file_url = 'https://kpewsvpufzkyejchncta.supabase.co/storage/v1/object/public/hypnosis/hipnose_4.mp3'
WHERE content_type = 'hypnosis' AND day_number = 4;

UPDATE content 
SET file_url = 'https://kpewsvpufzkyejchncta.supabase.co/storage/v1/object/public/hypnosis/hipnose_5.mp3'
WHERE content_type = 'hypnosis' AND day_number = 5;

UPDATE content 
SET file_url = 'https://kpewsvpufzkyejchncta.supabase.co/storage/v1/object/public/hypnosis/hipnose_6.mp3'
WHERE content_type = 'hypnosis' AND day_number = 6;

-- Update video for day 1 with correct extension
UPDATE content 
SET file_url = 'https://kpewsvpufzkyejchncta.supabase.co/storage/v1/object/public/videos/video_1.mp4'
WHERE content_type = 'video' AND day_number = 1;