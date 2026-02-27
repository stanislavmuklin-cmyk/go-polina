
-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name text NOT NULL DEFAULT '',
  gender text NOT NULL DEFAULT 'female',
  age integer NOT NULL DEFAULT 30,
  height integer NOT NULL DEFAULT 165,
  weight integer NOT NULL DEFAULT 65,
  fitness_level text NOT NULL DEFAULT 'beginner',
  goal text NOT NULL DEFAULT 'fat-loss',
  diet_preferences jsonb NOT NULL DEFAULT '[]'::jsonb,
  diet_type text NOT NULL DEFAULT 'no-restriction',
  workout_location text NOT NULL DEFAULT 'gym',
  equipment jsonb NOT NULL DEFAULT '[]'::jsonb,
  track_cycle boolean NOT NULL DEFAULT false,
  complaints text NOT NULL DEFAULT '',
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  streak integer NOT NULL DEFAULT 0,
  completed_workouts jsonb NOT NULL DEFAULT '[]'::jsonb,
  water_glasses integer NOT NULL DEFAULT 0,
  completed_meals jsonb NOT NULL DEFAULT '[]'::jsonb,
  completed_supplements jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_weekly_report_date date,
  daily_reports jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_onboarded boolean NOT NULL DEFAULT false,
  last_daily_reset date,
  ai_chat_count integer NOT NULL DEFAULT 0,
  ai_chat_reset_date date,
  meal_regen_count integer NOT NULL DEFAULT 0,
  meal_regen_reset_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can select own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();
