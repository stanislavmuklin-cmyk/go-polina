

# Plan: Admin Panel for Workout Management

## Overview
Create an admin panel where the app owner (stanislav.muklin@mail.ru) can manually set workouts for all users, manage co-admins, and control app content. Regular users will see admin-set workouts instead of AI-generated ones. The "Обновить" (regenerate) button will be hidden from regular users.

## Database Changes

### 1. Create `user_roles` table
Stores admin roles securely on the server side.

```text
Table: user_roles
- id: uuid (PK)
- user_id: uuid (FK -> auth.users, ON DELETE CASCADE)
- role: app_role enum ('admin', 'user')
- unique(user_id, role)
- RLS: admins can read/write, users can read own role
```

A `has_role()` security definer function will be created to avoid RLS recursion.

The initial admin (stanislav.muklin@mail.ru) will be seeded via a database trigger that fires on signup -- when a user registers with that email, they automatically get the 'admin' role.

### 2. Create `admin_workouts` table
Stores the workouts set by the admin for all users.

```text
Table: admin_workouts
- id: uuid (PK)
- location: text ('gym' | 'home')
- day: text ('Пн', 'Вт', ...)
- type: text (workout type description)
- exercises: jsonb (array of {name, sets})
- sort_order: integer (0-6 for day ordering)
- updated_at: timestamptz
- updated_by: uuid (FK -> auth.users)
- RLS: admins can CRUD, all authenticated users can SELECT
```

### 3. Create `admin_invites` table
Allows the owner to invite co-admins by email.

```text
Table: admin_invites
- id: uuid (PK)
- email: text (invited email)
- invited_by: uuid
- created_at: timestamptz
- RLS: admins only
```

A trigger on `auth.users` insert will check `admin_invites` and auto-assign the admin role if the new user's email matches.

## Frontend Changes

### 4. Create Admin page (`src/pages/Admin.tsx`)
A full admin panel with tabs:

**Tab 1 -- Workouts Editor:**
- Two sub-sections: "Зал" and "Дома" (gym/home toggle)
- 7 day cards (Пн-Вс), each editable:
  - Day type (text input, e.g. "Силовая", "Кардио", "Отдых")
  - List of exercises with name + sets fields
  - Add/remove exercise buttons
- "Сохранить" button to save all 7 days to the database
- Loads existing data on mount

**Tab 2 -- Co-admins Management:**
- List of current admins (from `user_roles`)
- "Пригласить администратора" form (email input)
- Remove admin button (except for the owner)

### 5. Update Workouts page (`src/pages/Workouts.tsx`)
- On load, first check `admin_workouts` table for the selected location
- If admin workouts exist, display them (no AI generation)
- Hide the "Обновить" (regenerate) button for non-admin users
- Admin users still see "Обновить" to allow AI-based generation as a fallback
- Cache admin workouts in localStorage with a version/timestamp check

### 6. Update TodayWorkoutDialog (`src/components/dashboard/TodayWorkoutDialog.tsx`)
- Also load from `admin_workouts` table instead of only localStorage cache

### 7. Add Admin route and nav link
- **`src/App.tsx`**: Add `/admin` route, protected by `AdminGate` component that checks `user_roles`
- **`src/components/AppLayout.tsx`**: Show "Админ" nav item only for users with admin role

### 8. Create admin role hook (`src/hooks/useIsAdmin.ts`)
- Queries `user_roles` table for current user
- Caches result in state
- Used by AppLayout, Workouts page, and AdminGate

## Additional Admin Capabilities
Beyond workouts, the admin panel will include:

- **App announcements/notifications** section (future-ready, placeholder tab)
- **User stats overview** -- see total registered users count (read from `user_roles` table count)

## Security
- All admin checks happen server-side via RLS policies using the `has_role()` function
- No client-side role storage or hardcoded credentials
- The owner email is only used in a one-time database seed trigger, not in client code

## Technical Flow

```text
User opens /workouts
  -> useEffect calls supabase.from('admin_workouts').select()
  -> If rows exist for location: display them
  -> If no rows: fall back to AI generation (existing behavior)
  -> "Обновить" button: visible only if useIsAdmin() returns true

Admin opens /admin
  -> AdminGate checks has_role via useIsAdmin hook
  -> Loads admin_workouts for editing
  -> Saves changes -> updates admin_workouts table
  -> All users see updated workouts on next page load
```

