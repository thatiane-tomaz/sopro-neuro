-- Update dia_descricao texts for days 1-7 with specific content for each day

-- Day 1
UPDATE daily_texts 
SET text_content = 'Hoje você vai ganhar confiança no processo, entendendo como a hipnose pode ser sua aliada para mudar de forma leve e natural.'
WHERE text_type = 'dia_descricao' AND day_number = 1;

-- Day 2
UPDATE daily_texts 
SET text_content = 'Você vai sentir que sua energia não depende do cigarro, ela aumenta quando o corpo começa a se equilibrar.'
WHERE text_type = 'dia_descricao' AND day_number = 2;

-- Day 3
UPDATE daily_texts 
SET text_content = 'Vai perceber que o cigarro não reduz a ansiedade, mas aumenta o estresse e ainda prejudica seu foco; sem ele, sua mente fica mais clara e tranquila.'
WHERE text_type = 'dia_descricao' AND day_number = 3;

-- Day 4
UPDATE daily_texts 
SET text_content = 'Você vai descobrir que pode ter momentos de pausa genuínos e que estar com pessoas amadas fica ainda mais prazeroso sem o cigarro.'
WHERE text_type = 'dia_descricao' AND day_number = 4;

-- Day 5
UPDATE daily_texts 
SET text_content = 'Você vai sentir alívio ao entender que a abstinência pode ser mais simples e tranquila do que imaginava.'
WHERE text_type = 'dia_descricao' AND day_number = 5;

-- Day 6
UPDATE daily_texts 
SET text_content = 'Ao revisar tudo o que aprendeu, você terá a segurança e a motivação necessárias para dar o próximo passo.'
WHERE text_type = 'dia_descricao' AND day_number = 6;

-- Day 7
UPDATE daily_texts 
SET text_content = 'Hoje você fará o ritual do último cigarro e sentirá a força de estar iniciando uma nova fase, livre e com mais controle sobre a sua vida.'
WHERE text_type = 'dia_descricao' AND day_number = 7;