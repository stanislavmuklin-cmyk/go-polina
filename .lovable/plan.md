

## Plan: Admin Challenges + Enhanced Members View

### 1. Database: Create `challenges` table

```sql
CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  start_date date NOT NULL,
  end_date date NOT NULL,
  duration_days integer NOT NULL DEFAULT 21,
  xp_reward integer NOT NULL DEFAULT 50,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

RLS: admins can CRUD, authenticated can SELECT.

### 2. Database: Create `challenge_progress` table

Tracks per-user daily check-ins:

```sql
CREATE TABLE public.challenge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  checked_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id, checked_date)
);
```

RLS: users can INSERT/SELECT own rows, admins can SELECT all.

### 3. Admin Panel: Add "Челленджи" section

- Add `"challenges"` to `AdminSection` type in `AdminLayout.tsx` with `Swords` icon
- New component `src/components/admin/ChallengesTab.tsx`:
  - List existing challenges (title, dates, duration, active/inactive)
  - Form to create/edit: title, description, start date, end date (auto-calculates duration), XP reward
  - Toggle active/deactivate
  - Delete challenge

### 4. Admin Panel: Enhanced "Участники" section

Update the members tab to show a unified view of all users:
- Query `profiles` table (all users) joined with `telegram_members` (by `user_id`)
- Display columns: Name, Source (Telegram/Email), Level, XP, Telegram username (linkable), Email
- Sort by level descending
- Admins can see contact info (telegram username as link `t.me/username`)

### 5. User-facing Challenges page

Update `src/pages/Challenges.tsx`:
- List active challenges with calendar-style progress grid (dates from start to end)
- Each day shows date number; checked days are highlighted
- One check-in per day (button), only for current date
- Progress bar showing X/N days completed
- When all days checked, auto-award XP via `addXP(50)` and show congratulations

### Files to change:
- **Migration**: 2 new tables + RLS policies
- `src/components/admin/AdminLayout.tsx` — add "challenges" to nav
- `src/components/admin/ChallengesTab.tsx` — new file, admin CRUD for challenges
- `src/pages/Admin.tsx` — add challenges case to renderContent
- `src/pages/Challenges.tsx` — full rewrite with challenge cards + calendar check-ins
- `src/pages/Admin.tsx` (members section) — enhanced with profiles join

