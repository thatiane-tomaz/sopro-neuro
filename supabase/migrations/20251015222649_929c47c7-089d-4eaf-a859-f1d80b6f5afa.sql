-- Add section column to triggers_content to distinguish between initial and post-cigarette hypnosis
ALTER TABLE triggers_content ADD COLUMN section text NOT NULL DEFAULT 'post_cigarette';

-- Update existing triggers to be post_cigarette section
UPDATE triggers_content SET section = 'post_cigarette';

-- Insert new initial support hypnosis
INSERT INTO triggers_content (title, description, file_name, duration_minutes, section, display_order, is_active)
VALUES 
  ('Lidando com a Ansiedade', 'Hipnose para acalmar a ansiedade e encontrar equilíbrio emocional', 'ansiedade.mp3', 15, 'initial', 1, true),
  ('Energia para se Movimentar', 'Hipnose para aumentar a motivação e disposição para atividades físicas', 'energia.mp3', 12, 'initial', 2, true),
  ('Nutrição Consciente', 'Hipnose para desenvolver uma relação saudável com a alimentação', 'nutricao.mp3', 14, 'initial', 3, true);