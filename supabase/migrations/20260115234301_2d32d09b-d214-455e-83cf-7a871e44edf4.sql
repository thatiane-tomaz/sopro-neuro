-- Corrigir registros de tracking onde o usuário assistiu quase tudo (>=95%) mas não salvou finished_at
-- Isso pode acontecer se o usuário fechou o app antes de terminar ou houve erro de rede

UPDATE journey_tracking
SET finished_at = updated_at
WHERE progress_percentage >= 95
  AND finished_at IS NULL;

-- Criar trigger para evitar isso no futuro: se progress >= 95%, marca como concluído automaticamente
CREATE OR REPLACE FUNCTION public.auto_complete_high_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o progresso chegou a 95% ou mais e ainda não tem finished_at, marcar como concluído
  IF NEW.progress_percentage >= 95 AND NEW.finished_at IS NULL THEN
    NEW.finished_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Dropar o trigger se existir
DROP TRIGGER IF EXISTS trigger_auto_complete_high_progress ON journey_tracking;

-- Criar o trigger
CREATE TRIGGER trigger_auto_complete_high_progress
  BEFORE UPDATE ON journey_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_complete_high_progress();