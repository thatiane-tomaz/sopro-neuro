-- Update real durations for hypnosis and video content
-- Hypnosis durations
UPDATE daily_texts 
SET duration_minutes = 7, text_content = '7'
WHERE text_type = 'hipnose_duracao' AND day_number = 1;

UPDATE daily_texts 
SET duration_minutes = 7, text_content = '7'
WHERE text_type = 'hipnose_duracao' AND day_number = 2;

UPDATE daily_texts 
SET duration_minutes = 6, text_content = '6'
WHERE text_type = 'hipnose_duracao' AND day_number = 3;

UPDATE daily_texts 
SET duration_minutes = 7, text_content = '7'
WHERE text_type = 'hipnose_duracao' AND day_number = 4;

UPDATE daily_texts 
SET duration_minutes = 7, text_content = '7'
WHERE text_type = 'hipnose_duracao' AND day_number = 5;

UPDATE daily_texts 
SET duration_minutes = 8, text_content = '8'
WHERE text_type = 'hipnose_duracao' AND day_number = 6;

-- Video duration for day 1
UPDATE daily_texts 
SET duration_minutes = 3, text_content = '3'
WHERE text_type = 'video_duracao' AND day_number = 1;