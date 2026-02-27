const RUSSIAN_DAYS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

export function getTodayRussian(): string {
  return RUSSIAN_DAYS[new Date().getDay()];
}

export function findTodayIndex<T extends { day?: string; dayName?: string }>(items: T[]): number {
  const today = getTodayRussian();
  const idx = items.findIndex(
    (item) => {
      const name = (item.day || item.dayName || "").split(/[\s(–—-]/)[0];
      return name === today;
    }
  );
  return idx >= 0 ? idx : 0;
}
