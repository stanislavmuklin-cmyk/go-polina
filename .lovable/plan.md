

## Fix: Redirect onboarded users past onboarding

### Problem
The `/onboarding` route has no guard checking if the user already completed onboarding. When a returning user lands there (or gets redirected), they see "Добро пожаловать" again instead of going straight to the dashboard.

### Solution
Wrap the `/onboarding` route with a check: if `isOnboarded === true`, redirect to `/dashboard`.

### Changes

**`src/App.tsx`** (1 change):
- Change the `/onboarding` route from:
  ```
  <Route path="/onboarding" element={<AuthGate><Onboarding /></AuthGate>} />
  ```
  to use a new `OnboardingGate` that checks `isOnboarded` and `profileLoading` from `useUser()`. If already onboarded, redirect to `/dashboard`. If still loading, show spinner. Otherwise, render `<Onboarding />`.

This is a minimal change (~10 lines) that follows the existing pattern of `ProtectedRoute` and `AdminGate`.
