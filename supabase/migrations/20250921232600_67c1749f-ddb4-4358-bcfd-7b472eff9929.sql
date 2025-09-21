-- Clear existing daily texts and redesign with only the 4 required text types
DELETE FROM daily_texts;

-- Insert the 4 text types for each day (1-21)
-- fase_descricao: Days 1-7
INSERT INTO daily_texts (text_key, text_type, text_content, day_number) VALUES
('fase_descricao', 'fase_descricao', 'Nesta fase você vai descobrir como a nicotina age no seu corpo e mente, quebrando falsas crenças sobre o cigarro.', 1),
('fase_descricao', 'fase_descricao', 'Nesta fase você vai descobrir como a nicotina age no seu corpo e mente, quebrando falsas crenças sobre o cigarro.', 2),
('fase_descricao', 'fase_descricao', 'Nesta fase você vai descobrir como a nicotina age no seu corpo e mente, quebrando falsas crenças sobre o cigarro.', 3),
('fase_descricao', 'fase_descricao', 'Nesta fase você vai descobrir como a nicotina age no seu corpo e mente, quebrando falsas crenças sobre o cigarro.', 4),
('fase_descricao', 'fase_descricao', 'Nesta fase você vai descobrir como a nicotina age no seu corpo e mente, quebrando falsas crenças sobre o cigarro.', 5),
('fase_descricao', 'fase_descricao', 'Nesta fase você vai descobrir como a nicotina age no seu corpo e mente, quebrando falsas crenças sobre o cigarro.', 6),
('fase_descricao', 'fase_descricao', 'Nesta fase você vai descobrir como a nicotina age no seu corpo e mente, quebrando falsas crenças sobre o cigarro.', 7);

-- fase_descricao: Days 8-14
INSERT INTO daily_texts (text_key, text_type, text_content, day_number) VALUES
('fase_descricao', 'fase_descricao', 'Nesta semana você terá apoio para atravessar a abstinência de forma leve. Vai aprender práticas para reduzir a ansiedade e perceber que pode se sentir calmo e confiante sem o cigarro.', 8),
('fase_descricao', 'fase_descricao', 'Nesta semana você terá apoio para atravessar a abstinência de forma leve. Vai aprender práticas para reduzir a ansiedade e perceber que pode se sentir calmo e confiante sem o cigarro.', 9),
('fase_descricao', 'fase_descricao', 'Nesta semana você terá apoio para atravessar a abstinência de forma leve. Vai aprender práticas para reduzir a ansiedade e perceber que pode se sentir calmo e confiante sem o cigarro.', 10),
('fase_descricao', 'fase_descricao', 'Nesta semana você terá apoio para atravessar a abstinência de forma leve. Vai aprender práticas para reduzir a ansiedade e perceber que pode se sentir calmo e confiante sem o cigarro.', 11),
('fase_descricao', 'fase_descricao', 'Nesta semana você terá apoio para atravessar a abstinência de forma leve. Vai aprender práticas para reduzir a ansiedade e perceber que pode se sentir calmo e confiante sem o cigarro.', 12),
('fase_descricao', 'fase_descricao', 'Nesta semana você terá apoio para atravessar a abstinência de forma leve. Vai aprender práticas para reduzir a ansiedade e perceber que pode se sentir calmo e confiante sem o cigarro.', 13),
('fase_descricao', 'fase_descricao', 'Nesta semana você terá apoio para atravessar a abstinência de forma leve. Vai aprender práticas para reduzir a ansiedade e perceber que pode se sentir calmo e confiante sem o cigarro.', 14);

-- fase_descricao: Days 15-21
INSERT INTO daily_texts (text_key, text_type, text_content, day_number) VALUES
('fase_descricao', 'fase_descricao', 'Hora de renovar. Você irá trocar o cigarro por hábitos que trazem prazer e bem-estar, transformando esta mudança em um novo estilo de vida.', 15),
('fase_descricao', 'fase_descricao', 'Hora de renovar. Você irá trocar o cigarro por hábitos que trazem prazer e bem-estar, transformando esta mudança em um novo estilo de vida.', 16),
('fase_descricao', 'fase_descricao', 'Hora de renovar. Você irá trocar o cigarro por hábitos que trazem prazer e bem-estar, transformando esta mudança em um novo estilo de vida.', 17),
('fase_descricao', 'fase_descricao', 'Hora de renovar. Você irá trocar o cigarro por hábitos que trazem prazer e bem-estar, transformando esta mudança em um novo estilo de vida.', 18),
('fase_descricao', 'fase_descricao', 'Hora de renovar. Você irá trocar o cigarro por hábitos que trazem prazer e bem-estar, transformando esta mudança em um novo estilo de vida.', 19),
('fase_descricao', 'fase_descricao', 'Hora de renovar. Você irá trocar o cigarro por hábitos que trazem prazer e bem-estar, transformando esta mudança em um novo estilo de vida.', 20),
('fase_descricao', 'fase_descricao', 'Hora de renovar. Você irá trocar o cigarro por hábitos que trazem prazer e bem-estar, transformando esta mudança em um novo estilo de vida.', 21);

-- dia_descricao: Same for all days
INSERT INTO daily_texts (text_key, text_type, text_content, day_number) 
SELECT 'dia_descricao', 'dia_descricao', 'Atividades do dia para sua transformação', generate_series(1, 21);

-- nome_video: Default for all days (can be customized later)
INSERT INTO daily_texts (text_key, text_type, text_content, day_number) 
SELECT 'nome_video', 'nome_video', 'Neurociência do Vício', generate_series(1, 21);

-- nome_hipnose: Default for all days (can be customized later)
INSERT INTO daily_texts (text_key, text_type, text_content, day_number) 
SELECT 'nome_hipnose', 'nome_hipnose', 'Sessão de Hipnose', generate_series(1, 21);