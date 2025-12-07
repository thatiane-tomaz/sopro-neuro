-- Renomear "Lidando com a Ansiedade" para "Momentos de ansiedade e estresse"
UPDATE triggers_content 
SET title = 'Momentos de ansiedade e estresse'
WHERE id = 'c9f5490f-afa1-4319-a809-d486e7579060';

-- Renomear "Festas e encontros" para "Festas e encontros sociais"
UPDATE triggers_content 
SET title = 'Festas e encontros sociais'
WHERE id = 'f4601ba1-2039-4218-8ff2-2e031c4068a9';

-- Desativar "Ao voltar do trabalho"
UPDATE triggers_content 
SET is_active = false
WHERE id = 'a085eba3-11a2-4854-9aa0-df8f1e3d1224';

-- Desativar "Momento estressante"
UPDATE triggers_content 
SET is_active = false
WHERE id = '085a8ee8-829c-4088-b8d7-dab5a4399ac9';

-- Reordenar: Festas(1), Ansiedade(2), Fumante(3), Pausa casa(4), Pausa trabalho(5), Nutrição(6), Energia(7)
UPDATE triggers_content SET display_order = 1 WHERE id = 'f4601ba1-2039-4218-8ff2-2e031c4068a9'; -- Festas
UPDATE triggers_content SET display_order = 2 WHERE id = 'c9f5490f-afa1-4319-a809-d486e7579060'; -- Ansiedade
UPDATE triggers_content SET display_order = 3 WHERE id = '33f2cea0-bea5-4d4b-8096-3c7871fe2070'; -- Fumante
UPDATE triggers_content SET display_order = 4 WHERE id = '71fd392e-79b1-4b33-a91c-aa3c2217a3c4'; -- Pausa casa
UPDATE triggers_content SET display_order = 5 WHERE id = '745ed795-b833-45b7-8e31-64f955bcda53'; -- Pausa trabalho
UPDATE triggers_content SET display_order = 6 WHERE id = 'f3b2f86d-3551-4390-8cc5-668841ad1ba6'; -- Nutrição
UPDATE triggers_content SET display_order = 7 WHERE id = '596f450a-195a-4dc1-b509-7dbb452eac41'; -- Energia