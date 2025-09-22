-- Add duration_minutes column to daily_texts table for media content
ALTER TABLE daily_texts 
ADD COLUMN duration_minutes integer NULL;

-- Add some sample durations for video and hypnosis content
-- You can update these with real durations later
INSERT INTO daily_texts (day_number, text_type, text_key, text_content, duration_minutes) VALUES
-- Video durations (example values)
(1, 'video_duracao', 'video_day_1', '7', 7),
(2, 'video_duracao', 'video_day_2', '6', 6),
(3, 'video_duracao', 'video_day_3', '8', 8),
(4, 'video_duracao', 'video_day_4', '5', 5),
(5, 'video_duracao', 'video_day_5', '9', 9),
(6, 'video_duracao', 'video_day_6', '6', 6),
(7, 'video_duracao', 'video_day_7', '10', 10),

-- Hypnosis durations (example values)
(1, 'hipnose_duracao', 'hypnosis_day_1', '12', 12),
(2, 'hipnose_duracao', 'hypnosis_day_2', '15', 15),
(3, 'hipnose_duracao', 'hypnosis_day_3', '10', 10),
(4, 'hipnose_duracao', 'hypnosis_day_4', '14', 14),
(5, 'hipnose_duracao', 'hypnosis_day_5', '11', 11),
(6, 'hipnose_duracao', 'hypnosis_day_6', '13', 13),
(7, 'hipnose_duracao', 'hypnosis_day_7', '16', 16);