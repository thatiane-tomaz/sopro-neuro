-- Update fase_descricao texts with new content

-- Days 1-7: Updated text with "7 dias" and "último cigarro"
UPDATE daily_texts 
SET text_content = 'Nesta fase de 7 dias você irá descobrir como a nicotina age no seu corpo e mente, quebrando falsas crenças sobre o cigarro. Ao final desta fase você fumará seu último cigarro.'
WHERE text_type = 'fase_descricao' AND day_number BETWEEN 1 AND 7;

-- Days 8-14: Keep the same text about withdrawal support
UPDATE daily_texts 
SET text_content = 'Nesta semana você terá apoio para atravessar a abstinência de forma leve. Vai aprender práticas para reduzir a ansiedade e perceber que pode se sentir calmo e confiante sem o cigarro.'
WHERE text_type = 'fase_descricao' AND day_number BETWEEN 8 AND 14;

-- Days 15-21: Keep the same text about renewal
UPDATE daily_texts 
SET text_content = 'Hora de renovar. Você irá trocar o cigarro por hábitos que trazem prazer e bem-estar, transformando esta mudança em um novo estilo de vida.'
WHERE text_type = 'fase_descricao' AND day_number BETWEEN 15 AND 21;