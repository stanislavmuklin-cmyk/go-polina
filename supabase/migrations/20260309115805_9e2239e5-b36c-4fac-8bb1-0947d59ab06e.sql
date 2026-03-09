
CREATE TABLE public.user_nutrition (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  meals jsonb,
  supplements jsonb,
  shopping jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_nutrition ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own nutrition"
  ON public.user_nutrition FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own nutrition"
  ON public.user_nutrition FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own nutrition"
  ON public.user_nutrition FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can select all nutrition"
  ON public.user_nutrition FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
