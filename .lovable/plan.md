

## Plan: Remove "Да/Нет" from workout toggle + Add photo uploads to weekly report

### 1. Remove "Да ✅" / "Нет" text from DailyReport

In `src/components/progress/DailyReport.tsx`, line 64 — remove the `<span>` showing "Да ✅" or "Нет". Keep only the label and the Switch toggle.

### 2. Add photo upload to WeeklyReport (1-3 photos per report)

**Storage bucket**: Create a `progress-photos` storage bucket (public) via migration, with RLS allowing authenticated users to upload to their own folder and read their own files.

**Database**: Add a `photos` column (jsonb, default `'[]'`) to the `profiles.weekly_reports` entries is not needed — instead, create a new `progress_photos` table:

```sql
CREATE TABLE public.progress_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  report_date date NOT NULL,
  photo_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- RLS: users CRUD own, admins SELECT all
```

**WeeklyReport UI changes** (`src/components/progress/WeeklyReport.tsx`):
- Add a "Загрузить фото" section with file input (accept images, max 3 files)
- Show selected photo thumbnails before submission
- On submit: upload photos to `progress-photos/{user_id}/{date}/` bucket, save URLs to `progress_photos` table alongside the weekly report

**Progress page** (`src/pages/Progress.tsx`):
- Add a new "Фото" tab or a photo gallery section showing thumbnails grouped by date
- Each photo is clickable to view full size in a dialog
- Photos are loaded from `progress_photos` table, displayed chronologically

### Files to change:
- `src/components/progress/DailyReport.tsx` — remove "Да/Нет" span (line 64)
- `src/components/progress/WeeklyReport.tsx` — add photo upload UI + upload logic
- `src/pages/Progress.tsx` — add photo gallery section
- New migration: `progress_photos` table + `progress-photos` storage bucket + RLS policies

