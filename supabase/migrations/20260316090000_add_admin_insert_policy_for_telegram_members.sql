CREATE POLICY "Admins can insert memberships"
  ON public.telegram_members
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
