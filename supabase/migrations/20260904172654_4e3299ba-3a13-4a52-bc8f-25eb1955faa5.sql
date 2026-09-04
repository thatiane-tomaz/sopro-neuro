ALTER TABLE public.notification_sends
  ADD COLUMN IF NOT EXISTS onesignal_notification_id text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS notification_sends_pending_idx
  ON public.notification_sends (sent_at)
  WHERE cancelled_at IS NULL;