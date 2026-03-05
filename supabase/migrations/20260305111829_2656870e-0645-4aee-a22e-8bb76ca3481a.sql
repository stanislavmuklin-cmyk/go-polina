
-- Create showcase_items table
CREATE TABLE public.showcase_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  button_text text NOT NULL DEFAULT '',
  button_url text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

-- Enable RLS
ALTER TABLE public.showcase_items ENABLE ROW LEVEL SECURITY;

-- SELECT for all authenticated
CREATE POLICY "Authenticated can read showcase items"
  ON public.showcase_items FOR SELECT
  TO authenticated
  USING (true);

-- INSERT for admins
CREATE POLICY "Admins can insert showcase items"
  ON public.showcase_items FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- UPDATE for admins
CREATE POLICY "Admins can update showcase items"
  ON public.showcase_items FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- DELETE for admins
CREATE POLICY "Admins can delete showcase items"
  ON public.showcase_items FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for showcase images
INSERT INTO storage.buckets (id, name, public) VALUES ('showcase', 'showcase', true);

-- Storage RLS: anyone can read
CREATE POLICY "Public read showcase images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'showcase');

-- Storage RLS: admins can upload
CREATE POLICY "Admins can upload showcase images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'showcase' AND public.has_role(auth.uid(), 'admin'));

-- Storage RLS: admins can update
CREATE POLICY "Admins can update showcase images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'showcase' AND public.has_role(auth.uid(), 'admin'));

-- Storage RLS: admins can delete
CREATE POLICY "Admins can delete showcase images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'showcase' AND public.has_role(auth.uid(), 'admin'));
