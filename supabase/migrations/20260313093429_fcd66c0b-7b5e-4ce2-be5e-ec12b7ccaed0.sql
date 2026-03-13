
-- Create progress_photos table
CREATE TABLE public.progress_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  report_date date NOT NULL,
  photo_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own photos"
  ON public.progress_photos FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can select own photos"
  ON public.progress_photos FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own photos"
  ON public.progress_photos FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can select all photos"
  ON public.progress_photos FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('progress-photos', 'progress-photos', true);

-- Storage RLS policies
CREATE POLICY "Users can upload own progress photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view progress photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'progress-photos');

CREATE POLICY "Users can delete own progress photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
