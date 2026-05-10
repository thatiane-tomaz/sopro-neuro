
-- 1. Fix deleted_accounts INSERT policy: restrict to service_role only
DROP POLICY IF EXISTS "Service role can insert deleted accounts" ON public.deleted_accounts;
CREATE POLICY "Service role can insert deleted accounts"
ON public.deleted_accounts
FOR INSERT
TO service_role
WITH CHECK (true);

-- 2. Add length validation constraints to feedback_responses
ALTER TABLE public.feedback_responses
  DROP CONSTRAINT IF EXISTS feedback_response_max_length,
  DROP CONSTRAINT IF EXISTS feedback_comment_max_length,
  DROP CONSTRAINT IF EXISTS feedback_question_type_max_length,
  DROP CONSTRAINT IF EXISTS feedback_question_type_whitelist;

ALTER TABLE public.feedback_responses
  ADD CONSTRAINT feedback_response_max_length
    CHECK (response IS NULL OR char_length(response) <= 2000),
  ADD CONSTRAINT feedback_comment_max_length
    CHECK (comment IS NULL OR char_length(comment) <= 1000),
  ADD CONSTRAINT feedback_question_type_max_length
    CHECK (char_length(question_type) <= 50);

-- 3. Scope images bucket uploads/updates/deletes to user's own folder
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;

CREATE POLICY "Users can upload images to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Revoke EXECUTE on SECURITY DEFINER functions from anon/authenticated
-- Keep has_role accessible (used inside RLS policies evaluated as the calling role)
REVOKE EXECUTE ON FUNCTION public.is_day_completed(uuid, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_day_completion_time(uuid, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_current_subscription(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_button_click(text, text) FROM anon;

-- Trigger functions don't need client EXECUTE
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_default_role() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_complete_high_progress() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.upsert_user_progress_on_session() FROM anon, authenticated;
