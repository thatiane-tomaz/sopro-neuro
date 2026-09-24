CREATE OR REPLACE VIEW public.user_current_status AS
WITH j AS (
  SELECT DISTINCT ON (h.user_id) h.user_id, h.jornada, h.created_at AS journey_start, h.habitos_selecionados
  FROM public.historico_jornada_usuario h
  ORDER BY h.user_id, h.created_at DESC
),
jj AS (
  SELECT j.*,
    CASE j.jornada WHEN 'abstinencia' THEN 'abstinência' WHEN 'reducao' THEN 'redução' ELSE j.jornada END AS tipo,
    CASE WHEN j.jornada IN ('abstinencia','abstinência') THEN 'abst_' ELSE '' END AS pfx
  FROM j
),
temas AS (
  SELECT jj.user_id, hj.id, hj.habito_titulo,
    (hj.video IS DISTINCT FROM false AND coalesce(trim(hj.video_nome),'') <> '') AS has_video,
    (hj.hipnose IS DISTINCT FROM false AND coalesce(trim(hj.hipnose_nome),'') <> '') AS has_hipnose,
    (hj.missao IS DISTINCT FROM false) AS has_missao,
    row_number() OVER (PARTITION BY jj.user_id ORDER BY
      CASE WHEN hj.tema_fixo THEN 0 ELSE 1 END,
      CASE WHEN hj.posicao ~ '^\d+$' THEN hj.posicao::int END NULLS LAST,
      hj.habito_titulo) AS rn,
    CASE WHEN hj.posicao ~ '^\d+$' THEN hj.posicao::int END AS posicao_num
  FROM jj
  JOIN public.habitos_jornada hj ON hj.tipo_usuario = jj.tipo
  WHERE hj.tema_fixo = true
     OR (jsonb_typeof(jj.habitos_selecionados) = 'array' AND jj.habitos_selecionados ? hj.habito_titulo)
),
st AS (
  SELECT t.*, jj.pfx, coalesce(t.posicao_num, t.rn::int) AS pos,
    (SELECT CASE WHEN bool_or(jt.finished_at IS NOT NULL) THEN 'finalizado' WHEN count(*)>0 THEN 'iniciado' ELSE 'nao_iniciado' END
       FROM public.journey_tracking jt WHERE jt.user_id=t.user_id AND jt.created_at>=jj.journey_start
        AND jt.interaction_type = jj.pfx||'video_semana_'||coalesce(t.posicao_num,t.rn::int)) AS s_video,
    (SELECT CASE WHEN bool_or(jt.finished_at IS NOT NULL) THEN 'finalizado' WHEN count(*)>0 THEN 'iniciado' ELSE 'nao_iniciado' END
       FROM public.journey_tracking jt WHERE jt.user_id=t.user_id AND jt.created_at>=jj.journey_start
        AND jt.interaction_type = jj.pfx||'hipnose_semana_'||coalesce(t.posicao_num,t.rn::int)) AS s_hipnose,
    (SELECT CASE WHEN bool_or(jt.interaction_type = jj.pfx||'missao_semana_'||coalesce(t.posicao_num,t.rn::int) AND jt.finished_at IS NOT NULL) THEN 'finalizado'
                 WHEN count(*)>0 THEN 'iniciado' ELSE 'nao_iniciado' END
       FROM public.journey_tracking jt WHERE jt.user_id=t.user_id AND jt.created_at>=jj.journey_start
        AND jt.interaction_type IN (jj.pfx||'missao_semana_'||coalesce(t.posicao_num,t.rn::int), jj.pfx||'missao_iniciada_semana_'||coalesce(t.posicao_num,t.rn::int))) AS s_missao
  FROM temas t JOIN jj ON jj.user_id = t.user_id
),
st2 AS (
  SELECT st.*,
    ((NOT has_video OR s_video='finalizado') AND (NOT has_hipnose OR s_hipnose='finalizado') AND (NOT has_missao OR s_missao='finalizado')
      AND (has_video OR has_hipnose OR has_missao)) AS concluido
  FROM st
),
atual AS (
  SELECT DISTINCT ON (user_id) * FROM st2
  ORDER BY user_id, concluido, rn
)
SELECT
  p.user_id,
  p.email,
  jj.jornada,
  (SELECT max(s.opened_at) FROM public.app_sessions s WHERE s.user_id = p.user_id) AS ultima_sessao,
  a.pos AS tema_atual_posicao,
  a.habito_titulo AS tema_atual,
  CASE WHEN a.id IS NULL THEN NULL WHEN a.has_video THEN a.s_video ELSE 'sem_conteudo' END AS video_status,
  CASE WHEN a.id IS NULL THEN NULL WHEN a.has_hipnose THEN a.s_hipnose ELSE 'sem_conteudo' END AS hipnose_status,
  CASE WHEN a.id IS NULL THEN NULL WHEN a.has_missao THEN a.s_missao ELSE 'sem_conteudo' END AS missao_status,
  coalesce(a.concluido, false) AS jornada_concluida,
  (SELECT n.habito_titulo FROM st2 n WHERE n.user_id = a.user_id AND n.rn > a.rn ORDER BY n.rn LIMIT 1) AS proximo_tema
FROM public.profiles p
LEFT JOIN jj ON jj.user_id = p.user_id
LEFT JOIN atual a ON a.user_id = p.user_id;

REVOKE ALL ON public.user_current_status FROM anon, authenticated;
GRANT SELECT ON public.user_current_status TO service_role;