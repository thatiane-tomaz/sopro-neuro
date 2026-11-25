UPDATE public.habitos_jornada h SET habito_titulo = v.t, subtitulo_habito = v.s, imagem_nome = 'intensivo:dia_' || v.p || '.webp'
FROM (VALUES
 ('1','Confie no processo','Fortaleça sua decisão de parar de fumar'),
 ('2','Fumar rouba sua energia','Entenda que ao parar você terá mais motivação para viver'),
 ('3','Fumar te deixa mais ansioso','Você fuma para se acalmar, mas seria menos estressado se não fumasse'),
 ('4','Continue tendo as pausas','Você não precisa do cigarro para pausar e relaxar'),
 ('5','A abstinência passa','Os sintomas de abstinência passam em poucas semanas.'),
 ('6','Você está mais preparado','Reforce que sua vida será melhor sem o cigarro.'),
 ('7','O último cigarro','Você ficará livre e mais feliz.')
) AS v(p,t,s)
WHERE h.tipo_usuario = 'ultimo_cigarro' AND h.posicao = v.p;