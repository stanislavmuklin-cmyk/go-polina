

# Plan: Dashboard "Today's Plan" with Inline Dialogs + Nutrition Day Name Cleanup

## Overview
Instead of navigating to full pages when clicking "Тренировка", "Питание", or "Добавки" on the Dashboard, each item will open a **dialog (modal)** showing only today's content. The Nutrition page will also be cleaned up to show just day names without "training/rest day" labels.

## Changes

### 1. Remove "training/rest day" from Nutrition day names
**File:** `supabase/functions/ai-generate/index.ts`
- Update the meals generation prompt to instruct the AI to return only day names (Пн, Вт, Ср...) without appending workout/rest context.

**File:** `src/pages/Nutrition.tsx`
- Add a fallback: strip any text after the day name if the AI still includes it (e.g., take only the first word/abbreviation).

### 2. Create a TodayWorkout dialog component
**File:** `src/components/dashboard/TodayWorkoutDialog.tsx` (new)
- Reads cached workout data from `localStorage` (same keys as Workouts page).
- Determines today's day of week (JS `getDay()` mapped to Пн-Вс).
- Shows the matching workout day's exercises in a Dialog.
- Includes gym/home toggle that switches the cached plan.
- If no cached data exists, shows a message prompting user to visit Workouts page first.

### 3. Create a TodayNutrition dialog component
**File:** `src/components/dashboard/TodayNutritionDialog.tsx` (new)
- Reads cached meal data from `localStorage` key `ai_meals`.
- Finds the day matching today's day of week.
- Shows the meals list (time, name, items, macros) in a Dialog.
- If no data, prompts to visit Nutrition page.

### 4. Create a TodaySupplements dialog component
**File:** `src/components/dashboard/TodaySupplementsDialog.tsx` (new)
- Reads cached supplements from `localStorage` key `ai_supplements`.
- Shows the full supplements list in a Dialog (supplements are the same every day).
- If no data, prompts to visit Nutrition page.

### 5. Update Dashboard to use dialogs
**File:** `src/pages/Dashboard.tsx`
- Replace the three `<a href="...">` links in "Today's plan" with Dialog triggers.
- Each card opens its respective dialog instead of navigating away.
- Update the description text to show dynamic info from cached data when available (e.g., today's workout type, today's calorie total).

## Technical Details

**Day mapping logic (shared helper):**
```text
JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat
Map to Russian: ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"]
Match against workout/meal day names by checking if the day string starts with the abbreviation.
```

**Workout cache key pattern:** `workouts_{fitnessLevel}_{location}_{goal}` -- the dialog will need access to `profile` to construct the key, plus the `location` state with toggle.

**Dialog components** will use the existing `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` from `src/components/ui/dialog.tsx`.

**No new AI calls** -- all dialogs read from existing localStorage cache. If cache is empty, a friendly message with a link to the full page is shown.

