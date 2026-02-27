
-- Create telegram_members table
CREATE TABLE public.telegram_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_username text,
  telegram_first_name text,
  is_active boolean NOT NULL DEFAULT true,
  activated_at timestamptz NOT NULL DEFAULT now(),
  deactivated_at timestamptz
);

-- Enable RLS
ALTER TABLE public.telegram_members ENABLE ROW LEVEL SECURITY;

-- Users can read their own membership
CREATE POLICY "Users can select own membership"
  ON public.telegram_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can read all memberships
CREATE POLICY "Admins can select all memberships"
  ON public.telegram_members
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update memberships
CREATE POLICY "Admins can update memberships"
  ON public.telegram_members
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
