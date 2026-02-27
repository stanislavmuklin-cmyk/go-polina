

# Plan: Two Report Types + Rename XP to "Баллы"

## Overview
Split the current single report into **Daily** and **Weekly** reports. Add sleep tracking to daily. Move weight and measurements to weekly. Weekly report triggers AI analysis and awards points. Rename all "XP" references to "баллы" throughout the app.

## Changes

### 1. Rename "XP" to "баллы" everywhere
**Files:** `UserContext.tsx`, `Gamification.tsx`, `Dashboard.tsx`
- Replace all visible "XP" text with "баллы" (e.g., "+50 XP" becomes "+50 баллов", "45 XP всего" becomes "45 баллов всего")
- Keep internal variable names (`xp`, `addXP`) unchanged -- only UI labels change

### 2. Add daily report fields to UserContext
**File:** `UserContext.tsx`
- Add `lastWeeklyReportDate: string | null` to track when the last weekly report was submitted
- Add `dailyReports: { date: string; workoutDone: boolean; energy: number; nutrition: number; sleep: number }[]` to store daily entries

### 3. Redesign Progress page with two report sections
**File:** `src/pages/Progress.tsx`

**Summary cards:** Remove "Сон" card, keep "Вес" and "Энергия" only. Remove sleep from chart toggle.

**Daily Report form:**
- Workout completed (switch)
- Energy level (slider 1-10)
- Nutrition satisfaction (slider 1-10)
- Sleep quality (slider 1-10, new)
- Submit button: "Отметить день" -- awards points, no AI call

**Weekly Report form:**
- Weight (kg input)
- Body measurements: Chest, Waist, Glutes, Thigh
- Submit button: "Сдать еженедельный отчёт" -- triggers AI analysis, awards more points
- Shows date of last weekly report and countdown: "Следующий отчёт: [date]"
- When 7 days have passed since last report, shows a prompt: "Сдайте еженедельный отчёт!"
- When not yet time, the submit button is disabled with text like "Доступен через X дней"

**AI response** appears only after weekly report submission (same as current behavior).

### 4. Update Dashboard CTA
**File:** `src/pages/Dashboard.tsx`
- Change "Сдать отчёт" description to "Ежедневный и еженедельный отчёты"
- Rename XP label to "баллы"

### 5. Update Gamification page labels
**File:** `src/pages/Gamification.tsx`
- All "XP" text becomes "баллов" / "баллы"
- Challenge rewards: "+50 баллов" etc.

## Technical Details

**Weekly report date logic:**
- Store `lastWeeklyReportDate` in UserProfile (persisted via localStorage)
- Calculate next report date as `lastWeeklyReportDate + 7 days` using `date-fns`
- If `lastWeeklyReportDate` is null (first time), show "Сдайте первый еженедельный отчёт!"
- On submit: set `lastWeeklyReportDate` to today's ISO date string

**Points awarded:**
- Daily report: +5 баллов
- Weekly report: +20 баллов

**Progress page layout order:**
1. Header
2. Summary cards (weight change, avg energy -- 2 cards instead of 3)
3. Chart (weight/energy toggle only, no sleep)
4. Daily report card
5. Weekly report card (with date info and conditional UI)
6. AI response (after weekly submit)

