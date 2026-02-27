

# Plan: Report Panel with AI Analysis

## Overview
Replace the current basic "log data" form on the Progress page with a full **Report Panel**. Add a prominent "Submit Report" button on the Dashboard that navigates to the Progress page and auto-scrolls to the report form. Remove the static AI recommendation block -- AI feedback will appear only after submitting a report.

## Changes

### 1. Redesign the Report Panel on Progress page (`src/pages/Progress.tsx`)

Replace the current simple input grid with a structured report form containing:

- **Weight** (kg) -- number input
- **Workout completed** -- Yes/No toggle (switch or two buttons)
- **Energy level** -- slider 1-10 with visual scale
- **Body measurements** (cm) -- 4 fields: Chest, Waist, Glutes, Thigh
- **Nutrition satisfaction** -- slider 1-10 with emoji/label indicator (1 = "Ужасно", 10 = "Идеально")
- **Submit button** -- "Сдать отчёт"

On submit: call the AI edge function with the report data + user profile context, then display the AI recommendation in a card below the form.

Remove the static "AI Recommendation" block that currently always shows.

### 2. Add "Submit Report" button on Dashboard (`src/pages/Dashboard.tsx`)

Add a visually prominent button/card (e.g., with a `ClipboardCheck` icon) between the water tracker and today's plan sections. Clicking it navigates to `/progress#report` which scrolls to the report section.

### 3. Update AI generate function (`supabase/functions/ai-generate/index.ts`)

Add a new type `"report"` that accepts the report data alongside the user profile and returns a personalized AI analysis/recommendation based on the submitted metrics.

## Technical Details

**Progress page structure:**
- Add `useRef` for the report section, use `useEffect` to scroll into view when URL hash is `#report`
- Report state: `{ weight, workoutDone, energy, chest, waist, glutes, thigh, nutritionScore }`
- On submit: call `generateContent("report", profile, reportData)`, show loading state, then render AI response in a card with `ReactMarkdown`
- Remove the hardcoded AI recommendation block (lines 90-97)

**Dashboard button:**
- Use `Link` to `/progress#report` with a styled card/button using gradient background
- Icon: `ClipboardCheck` from lucide-react
- Label: "Сдать отчёт"

**Edge function update:**
- Add `"report"` case in the type switch
- System prompt instructs AI to analyze the report data (weight trend, workout adherence, energy, measurements, nutrition quality) and give a brief, actionable recommendation
