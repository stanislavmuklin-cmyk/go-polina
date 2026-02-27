

# Plan: Two Report Types + Rename XP to "Баллы"

## Status: ✅ Implemented

All changes from the plan have been implemented:
- XP renamed to "баллы" in Dashboard, Gamification
- UserContext updated with `lastWeeklyReportDate` and `dailyReports`
- Progress page split into Daily Report (workout, energy, nutrition, sleep → +5 баллов) and Weekly Report (weight, measurements → AI analysis, +20 баллов)
- Weekly report has 7-day cooldown with date display
- Summary cards reduced to 2 (weight, energy), sleep removed from chart
