

## План: Добавить раздел «Анализы»

### 1. База данных
Создать таблицу `analyses` для хранения списка анализов:

```sql
CREATE TABLE public.analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

RLS: админы — полный доступ (CRUD), авторизованные пользователи — только чтение активных.

### 2. Админ-панель
- Добавить `"analyses"` в `AdminSection` type и навигацию в `AdminLayout.tsx` (иконка `ClipboardList`, label «Анализы»).
- Создать `src/components/admin/AnalysesTab.tsx` — по аналогии с `ChallengesTab`: загрузка списка анализов, добавление/удаление/редактирование (название + описание), сохранение в БД.
- Добавить case `"analyses"` в `renderContent()` в `Admin.tsx`.

### 3. Основное приложение
- Добавить пункт навигации `{ to: "/analyses", icon: ClipboardList, label: "Анализы" }` в `AppLayout.tsx`.
- Создать страницу `src/pages/Analyses.tsx` — загружает активные анализы из таблицы `analyses` и отображает их карточками (название + описание).
- Добавить маршрут `/analyses` в `App.tsx` (обёрнутый в `AuthGate > MembershipGate > ProtectedRoute`).

### Файлы для изменения/создания:
- Миграция: новая таблица `analyses` + RLS
- `src/components/admin/AdminLayout.tsx` — добавить секцию
- `src/components/admin/AnalysesTab.tsx` — новый файл
- `src/pages/Admin.tsx` — добавить case
- `src/components/AppLayout.tsx` — добавить навигацию
- `src/pages/Analyses.tsx` — новая страница
- `src/App.tsx` — добавить маршрут

