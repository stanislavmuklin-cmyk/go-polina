

## Plan: Persist Nutrition Data in Database

Currently meals, supplements, and shopping lists are stored in `localStorage` and re-generated on first visit. The user wants them persisted server-side so they load instantly and only regenerate when the user explicitly replaces individual meals.

### 1. Database: New table `user_nutrition`

```sql
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
```

RLS: users can SELECT/INSERT/UPDATE own row, admins can SELECT all.

### 2. Update `src/pages/Nutrition.tsx`

- **On load**: Query `user_nutrition` for the current user. If data exists, use it (no generation). If no row exists, generate via AI and insert into DB.
- **Remove "Обновить план" button** for meals entirely. Keep only per-meal replace buttons.
- **Remove "Обновить" buttons** for supplements and shopping tabs.
- **On meal replace** (`regenerateMeal`): After generating the replacement meal, update the `meals` column in `user_nutrition`.
- **On supplements/shopping generation**: Save to `user_nutrition` on first generation only.
- Keep `localStorage` as a fast cache mirror, but DB is the source of truth.

### 3. Update dashboard dialogs

`TodayNutritionDialog` and `TodaySupplementsDialog` currently read from `localStorage` — these will continue to work since we keep localStorage in sync.

### Files to change:
- **Migration**: 1 new table + RLS
- `src/pages/Nutrition.tsx` — load from DB, remove bulk regenerate buttons, save to DB on generate/replace

