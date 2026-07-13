
DO $$
DECLARE
  r record;
  v_event text;
  v_value int;
BEGIN
  FOR r IN
    SELECT DISTINCT ON (user_id, interaction_type)
      user_id, interaction_type, finished_at
    FROM public.journey_tracking
    WHERE finished_at IS NOT NULL
    ORDER BY user_id, interaction_type, finished_at ASC
  LOOP
    IF r.interaction_type LIKE 'video_%' THEN
      v_event := 'video_completed'; v_value := 5;
    ELSIF r.interaction_type LIKE 'hipnose_%' THEN
      v_event := 'hypnosis_completed'; v_value := 5;
    ELSIF r.interaction_type LIKE 'missao_%' THEN
      v_event := 'mission_completed'; v_value := 5;
    ELSE
      CONTINUE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.brain_sparks_log
      WHERE user_id = r.user_id
        AND event_key = v_event
        AND (metadata->>'interaction_type') = r.interaction_type
    ) THEN
      INSERT INTO public.brain_sparks_log (user_id, event_key, sparks_awarded, metadata, created_at)
      VALUES (r.user_id, v_event, v_value,
              jsonb_build_object('interaction_type', r.interaction_type, 'backfilled', true),
              r.finished_at);

      UPDATE public.profiles
      SET brain_sparks = COALESCE(brain_sparks, 0) + v_value,
          brain_last_active_at = GREATEST(COALESCE(brain_last_active_at, r.finished_at), r.finished_at)
      WHERE user_id = r.user_id;
    END IF;
  END LOOP;

  FOR r IN
    SELECT user_id, habito_id, consentiu_postar, postado_no_mural, created_at
    FROM public.resultado_missao_usuario
  LOOP
    v_event := CASE WHEN COALESCE(r.postado_no_mural, r.consentiu_postar, false)
                    THEN 'mission_completed_with_mural_post'
                    ELSE 'mission_completed' END;
    v_value := CASE WHEN COALESCE(r.postado_no_mural, r.consentiu_postar, false) THEN 10 ELSE 5 END;

    IF NOT EXISTS (
      SELECT 1 FROM public.brain_sparks_log
      WHERE user_id = r.user_id
        AND event_key IN ('mission_completed','mission_completed_with_mural_post')
        AND (metadata->>'habito_id') = r.habito_id::text
    ) THEN
      INSERT INTO public.brain_sparks_log (user_id, event_key, sparks_awarded, metadata, created_at)
      VALUES (r.user_id, v_event, v_value,
              jsonb_build_object('habito_id', r.habito_id::text, 'backfilled', true),
              r.created_at);

      UPDATE public.profiles
      SET brain_sparks = COALESCE(brain_sparks, 0) + v_value,
          brain_last_active_at = GREATEST(COALESCE(brain_last_active_at, r.created_at), r.created_at)
      WHERE user_id = r.user_id;
    END IF;
  END LOOP;
END $$;
