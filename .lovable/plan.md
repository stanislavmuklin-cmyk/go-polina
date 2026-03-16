

## Анализ проблем и план исправлений

### Найденные баги

**1. Отметка приёмов пищи не сохраняется (Nutrition.tsx)**
`completedMeals` — это локальный `useState<Set>`, который никогда не записывается в профиль через `updateProfile`. При обновлении страницы всё сбрасывается. Более того, пользователь может повторно нажимать «Съел» и получать XP заново.

**2. Отметка тренировок не сохраняется (Workouts.tsx)**
`completed` — аналогично, локальный `useState<Set<number>>`, не синхронизируется с `profile.completedWorkouts`. При обновлении страницы всё теряется, XP можно получить повторно.

**3. Вода сохраняется корректно**
`drinkWater` в Dashboard.tsx вызывает `updateProfile({ waterGlasses: ... })`, что записывает в БД. Если у кого-то не сохраняется — возможно, это побочный эффект daily reset (сброс при смене дня). Саму логику менять не нужно.

**4. XP сохраняется в БД, но дублируется**
`addXP` корректно пишет в БД. Проблема в том, что из-за багов 1 и 2 пользователи могут повторно получать XP за те же действия после перезагрузки.

### План исправлений

#### A. Nutrition.tsx — сохранять отметки приёмов пищи
- Убрать локальный `completedMeals` state
- Инициализировать из `profile.completedMeals` (массив строк вида `"dayIdx-mealIdx"`)
- При нажатии «Съел» — вызывать `updateProfile({ completedMeals: [...profile.completedMeals, key] })` + `addXP(10)` только если ключ ещё не в массиве
- Проверку `completedMeals.has(key)` заменить на `profile.completedMeals.includes(key)`

#### B. Workouts.tsx — сохранять отметки тренировок
- Убрать локальный `completed` state
- Инициализировать из `profile.completedWorkouts` (массив строк, например индексы дней)
- При нажатии ✓ — вызывать `updateProfile({ completedWorkouts: [...] })` + `addXP(5)` только если ещё не отмечено
- Не позволять снимать галочку (или снимать без возврата XP)

#### C. AppLayout.tsx — переместить SOS перед FAQ
Текущий порядок: `...analyses, ask-ai, faq`. SOS сейчас на 5-й позиции.
Новый порядок: убрать SOS с 5-й позиции, вставить перед FAQ (после ask-ai).

### Файлы для изменения:
- `src/pages/Nutrition.tsx` — использовать `profile.completedMeals` вместо локального state
- `src/pages/Workouts.tsx` — использовать `profile.completedWorkouts` вместо локального state
- `src/components/AppLayout.tsx` — переместить SOS перед FAQ

