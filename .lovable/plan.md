

# Plan: Интеграция Telegram Mini App + контроль подписки клуба

## Обзор

Приложение будет работать в двух режимах:
- **Как обычный сайт** — вход по email/паролю (как сейчас)
- **Как Telegram Mini App** — автоматический вход через Telegram, доступ только для членов клуба

При входе через Telegram бот проверяет членство в клубе. Внешний сервис оплаты (ЮKassa, Stripe и т.д.) отправляет webhook при оплате/отмене подписки.

---

## Архитектура

```text
Пользователь в Telegram
       |
       v
  Telegram Mini App (WebApp SDK)
       |
       | initData (подпись Telegram)
       v
  Edge Function: telegram-auth
       |
       | Проверяет подпись BOT_TOKEN
       | Создаёт/находит Supabase-пользователя
       | Проверяет членство в таблице telegram_members
       | Возвращает session token
       v
  Приложение загружается
       
---

  Внешний платёжный сервис
       |
       | Webhook: оплата / отмена
       v
  Edge Function: telegram-webhook
       |
       | Обновляет telegram_members.is_active
       v
  При следующем входе — доступ открыт/закрыт
```

---

## 1. Новая таблица: `telegram_members`

Хранит связь между Telegram ID и пользователем приложения, а также статус членства.

```text
Table: telegram_members
- id: uuid (PK)
- telegram_id: bigint (UNIQUE, NOT NULL) — Telegram user ID
- user_id: uuid (FK -> auth.users, ON DELETE CASCADE, NULLABLE) — связь с аккаунтом
- telegram_username: text — @username в Telegram
- telegram_first_name: text — имя в Telegram
- is_active: boolean (default true) — активно ли членство
- activated_at: timestamptz (default now())
- deactivated_at: timestamptz (nullable)

RLS:
- Пользователи могут SELECT свою строку (user_id = auth.uid())
- Edge functions работают через service_role ключ (без RLS)
```

---

## 2. Edge Function: `telegram-auth`

Отвечает за авторизацию через Telegram Mini App.

**Логика:**
1. Получает `initData` из запроса (строка, которую Telegram передаёт в WebApp)
2. Валидирует подпись через HMAC-SHA256 с `BOT_TOKEN` (стандартный алгоритм Telegram)
3. Извлекает `telegram_id`, `first_name`, `username`
4. Проверяет `telegram_members` — есть ли запись с `is_active = true`
5. Если нет активного членства — возвращает ошибку "Доступ только для членов клуба"
6. Ищет существующего пользователя по `telegram_id` в `telegram_members.user_id`
7. Если пользователя нет — создаёт через `supabase.auth.admin.createUser()` с email вида `tg_{telegram_id}@telegram.local` и случайным паролем
8. Генерирует сессию через `supabase.auth.admin.generateLink()` или custom JWT
9. Возвращает `access_token` и `refresh_token` клиенту

**Требуемые секреты:** `TELEGRAM_BOT_TOKEN`

---

## 3. Edge Function: `telegram-webhook`

Принимает колбэки от внешнего платёжного сервиса о статусе подписки.

**Логика:**
1. Принимает POST-запрос с payload (telegram_id, action: "activate" | "deactivate")
2. Проверяет секретный ключ webhook (`WEBHOOK_SECRET`) в заголовке
3. При `activate`:
   - Upsert в `telegram_members` (telegram_id, is_active = true, activated_at = now())
4. При `deactivate`:
   - Update `telegram_members` SET is_active = false, deactivated_at = now()
5. Возвращает 200 OK

**Формат webhook запроса:**
```text
POST /telegram-webhook
Header: X-Webhook-Secret: <WEBHOOK_SECRET>
Body: { "telegram_id": 123456789, "action": "activate" | "deactivate" }
```

Это универсальный формат — вы можете вызывать этот endpoint из любого платёжного сервиса или даже вручную.

**Требуемые секреты:** `WEBHOOK_SECRET`

---

## 4. Фронтенд: Telegram WebApp SDK

**Новый файл: `src/lib/telegram.ts`**
- Определяет, запущено ли приложение внутри Telegram (`window.Telegram?.WebApp`)
- Экспортирует `isTelegramMiniApp()` и `getTelegramInitData()`
- Подключает тему Telegram (тёмная/светлая) к приложению

**Обновление `AuthContext.tsx`:**
- При загрузке проверяет: если `isTelegramMiniApp()` — вызывает edge function `telegram-auth` с `initData`
- Устанавливает сессию через `supabase.auth.setSession()`
- Если не Telegram — работает как раньше (email/пароль)

**Обновление `App.tsx`:**
- Добавляет `MembershipGate` — проверяет, что у Telegram-пользователя активная подписка
- Для обычных пользователей (email/пароль) — пропускает проверку членства (или проверяет, по вашему желанию)

---

## 5. Обновление Login/Signup

**Страница Login:**
- Если открыта в Telegram — автоматический вход, форму не показываем
- Если открыта как обычный сайт — форма email/пароль как сейчас

**Страница Signup:**
- Если в Telegram — регистрация автоматическая, перенаправление на onboarding
- Если как сайт — форма регистрации как сейчас

---

## 6. Админ-панель: управление членами

**Обновление `Admin.tsx`:**
- Новая вкладка "Участники клуба"
- Таблица со списком `telegram_members` (telegram_id, username, is_active, дата)
- Кнопки "Активировать" / "Деактивировать" для ручного управления
- Полезно для случаев, когда нужно вручную дать/забрать доступ

---

## Файлы для изменения

| Файл | Что меняется |
|---|---|
| Новая миграция SQL | Таблица `telegram_members` + RLS |
| `supabase/functions/telegram-auth/index.ts` | Новая edge function: авторизация через Telegram |
| `supabase/functions/telegram-webhook/index.ts` | Новая edge function: webhook подписки |
| `supabase/config.toml` | Регистрация двух новых функций (verify_jwt = false) |
| `src/lib/telegram.ts` | Новый файл: утилиты Telegram WebApp SDK |
| `src/context/AuthContext.tsx` | Добавить Telegram-авторизацию при загрузке |
| `src/pages/Login.tsx` | Авто-вход в Telegram-режиме |
| `src/pages/Signup.tsx` | Авто-регистрация в Telegram-режиме |
| `src/App.tsx` | MembershipGate для Telegram-пользователей |
| `src/pages/Admin.tsx` | Вкладка управления участниками клуба |
| `index.html` | Подключение Telegram WebApp SDK скрипта |

---

## Требуемые секреты

Перед реализацией нужно будет добавить два секрета:
1. **TELEGRAM_BOT_TOKEN** — токен вашего бота (получен через @BotFather)
2. **WEBHOOK_SECRET** — произвольная строка для защиты webhook-эндпоинта

---

## Как настроить бота после реализации

1. Откройте @BotFather в Telegram
2. Отправьте `/setmenubutton` и выберите вашего бота
3. Укажите URL приложения (например, `https://go-polina.lovable.app`)
4. Отправьте `/setwebapp` — укажите тот же URL
5. Теперь у бота появится кнопка "Открыть приложение"

