
-- Admins can delete error logs
CREATE POLICY "Admins can delete error logs"
ON public.app_error_logs
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
