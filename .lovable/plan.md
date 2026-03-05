

## Витрина: админ-управление + отображение для пользователей

### 1. База данных — новая таблица `showcase_items`

```sql
CREATE TABLE public.showcase_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  button_text text NOT NULL DEFAULT '',
  button_url text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
```

RLS-политики:
- SELECT для всех аутентифицированных (витрина публична для пользователей)
- INSERT/UPDATE/DELETE только для админов (`has_role`)

Также создать storage bucket `showcase` (public) для загрузки изображений с RLS: админы могут загружать, все аутентифицированные могут читать.

### 2. Админ-панель (`src/pages/Admin.tsx`)

Добавить 4-ю вкладку **"Витрина"** в `Tabs`:
- Список карточек с полями: изображение (upload), название, описание (textarea), текст кнопки, URL кнопки
- Кнопки: добавить карточку, удалить, сохранить порядок
- Загрузка изображений через Supabase Storage (`showcase` bucket)
- Drag-порядок или числовой `sort_order`

### 3. Страница Витрина (`src/pages/Showcase.tsx`)

- Загрузка данных из `showcase_items` (where `is_active = true`, order by `sort_order`)
- Сетка: 2 колонки на мобильных, 3-4 на десктопе
- Каждая карточка: изображение сверху, описание, кнопка-ссылка снизу
- Пустое состояние если нет товаров

### Файлы

| Файл | Действие |
|---|---|
| Migration | Создать таблицу `showcase_items` + storage bucket + RLS |
| `src/pages/Admin.tsx` | Добавить вкладку "Витрина" с CRUD |
| `src/pages/Showcase.tsx` | Переписать — реальные данные из БД |

