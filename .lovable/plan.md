
# Plan: Migration to Database + Rate Limits + Daily Reset + Admin Link Cleanup

## Overview
Five major changes:
1. Move all user profile data from localStorage to a `profiles` database table
2. Remove "Админ" from sidebar navigation -- admin panel accessible only via direct URL `/admin`
3. Add daily auto-reset of counters (water, completed meals/supplements/workouts)
4. Rate-limit AI chat to 20 requests/day and meal regeneration to 3/day
5. Cache `useIsAdmin` result in context to eliminate redundant RPC calls

---

## 1. Database: Create `profiles` table

New migration to create a `profiles` table storing all user data currently in localStorage:

```text
Table: profiles
- id: uuid (PK, default gen_random_uuid())
- user_id: uuid (FK -> auth.users, ON DELETE CASCADE, UNIQUE)
- name: text (default '')
- gender: text (default 'female')
- age: integer (default 30)
- height: integer (default 165)
- weight: integer (default 65)
- fitness_level: text (default 'beginner')
- goal: text (default 'fat-loss')
- diet_preferences: jsonb (default '[]')
- diet_type: text (default 'no-restriction')
- workout_location: text (default 'gym')
- equipment: jsonb (default '[]')
- track_cycle: boolean (default false)
- complaints: text (default '')
- xp: integer (default 0)
- level: integer (default 1)
- streak: integer (default 0)
- completed_workouts: jsonb (default '[]')
- water_glasses: integer (default 0)
- completed_meals: jsonb (default '[]')
- completed_supplements: jsonb (default '[]')
- last_weekly_report_date: date (nullable)
- daily_reports: jsonb (default '[]')
- is_onboarded: boolean (default false)
- last_daily_reset: date (nullable)
- ai_chat_count: integer (default 0)
- ai_chat_reset_date: date (nullable)
- meal_regen_count: integer (default 0)
- meal_regen_reset_date: date (nullable)
- created_at: timestamptz (default now())
- updated_at: timestamptz (default now())

RLS:
- Users can SELECT/UPDATE own row (user_id = auth.uid())
- Users can INSERT own row (user_id = auth.uid())

Trigger: auto-create profile row on auth.users insert
```

---

## 2. Rewrite `UserContext.tsx` -- Database-backed

Replace localStorage with database reads/writes:
- On mount (when `user` is available), fetch profile from `profiles` table
- `updateProfile()` writes partial updates to the database via `supabase.from('profiles').update()`
- Keep local state for UI responsiveness, debounce DB writes
- `addXP()` updates both local state and DB
- Daily reset logic: on load, check if `last_daily_reset < today`, if so reset `water_glasses`, `completed_workouts`, `completed_meals`, `completed_supplements` to defaults and set `last_daily_reset = today`
- Remove all localStorage usage for profile data

---

## 3. Remove "Админ" from sidebar (`AppLayout.tsx`)

- Remove `useIsAdmin` import and call from `AppLayout`
- Remove the conditional admin nav item from `allNavItems`
- Admin panel remains accessible only via direct URL `/admin`
- This eliminates the RPC call on every page navigation for all users

---

## 4. Optimize `useIsAdmin` -- cache in memory

- The hook is now only used in `AdminGate` (App.tsx) and `Workouts.tsx`
- Add a simple module-level cache so the RPC is called at most once per session per user
- Clear cache on logout

---

## 5. Rate Limits

### AI Chat (20/day) -- `AskAI.tsx`
- Before sending, check `profile.ai_chat_count` and `profile.ai_chat_reset_date`
- If reset date is not today, reset count to 0
- If count >= 20, show toast "Лимит запросов на сегодня исчерпан (20/20)" and block
- On successful send, increment count in DB

### Meal Regeneration (3/day) -- `Nutrition.tsx`
- Same pattern with `meal_regen_count` and `meal_regen_reset_date`
- If count >= 3, show toast "Лимит замен блюд на сегодня исчерпан (3/3)" and block
- On successful regeneration, increment count in DB
- Display remaining count near the regenerate button

---

## 6. Daily Auto-Reset

On profile load in `UserContext`, check `last_daily_reset`:
- If it's before today, reset these fields:
  - `water_glasses` -> 0
  - `completed_workouts` -> []
  - `completed_meals` -> []
  - `completed_supplements` -> []
  - `ai_chat_count` -> 0
  - `meal_regen_count` -> 0
- Update `last_daily_reset` to today
- This runs once per day on first app load

---

## 7. Onboarding Migration

Update `Onboarding.tsx`:
- On `finish()`, insert/upsert profile row to `profiles` table instead of localStorage
- Set `is_onboarded = true` in the DB

Update `Profile.tsx`:
- `resetProfile()` updates `is_onboarded = false` in DB instead of `localStorage.clear()`
- Update privacy notice text (data now stored securely in the cloud)

---

## Files to Change

| File | Changes |
|---|---|
| New migration SQL | Create `profiles` table + trigger + RLS |
| `src/context/UserContext.tsx` | Full rewrite: DB-backed state, daily reset logic |
| `src/components/AppLayout.tsx` | Remove admin nav item and `useIsAdmin` |
| `src/hooks/useIsAdmin.ts` | Add per-session caching |
| `src/pages/AskAI.tsx` | Add 20/day rate limit check |
| `src/pages/Nutrition.tsx` | Add 3/day meal regen limit |
| `src/pages/Onboarding.tsx` | Save to DB instead of localStorage |
| `src/pages/Profile.tsx` | Reset via DB, update privacy text |
| `src/pages/Dashboard.tsx` | Minor: water/meal counters now auto-reset |
| `src/pages/Workouts.tsx` | No admin check needed for nav (already only in AdminGate) |

---

## Technical Notes

- Profile data is loaded once on login, cached in React state for performance
- DB writes are done on each `updateProfile` call (not debounced, since updates are infrequent user actions)
- The trigger `handle_new_user_profile` auto-creates a profile row on signup so the profile always exists
- localStorage keys for AI-generated content (meals, supplements, shopping) remain in localStorage as cache -- these are regenerated content, not user data
- The existing `handle_new_user_role` trigger for admin auto-assignment remains unchanged
