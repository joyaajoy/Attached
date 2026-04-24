export function formatTime(iso: string): string {
  if (!iso) return "--:--";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Moscow",
    });
  } catch {
    return "--:--";
  }
}

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      timeZone: "Europe/Moscow",
    });
  } catch {
    return iso;
  }
}

export function formatDateFull(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/Moscow",
    });
  } catch {
    return iso;
  }
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return "";
  const totalMin = Math.round(seconds / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}

export function formatPrice(rub: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(rub);
}

export function todayIso(): string {
  const d = new Date();
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().split("T")[0];
}

export function minutesUntil(iso: string): number {
  const now = Date.now();
  const then = new Date(iso).getTime();
  return Math.round((then - now) / 60000);
}

export function formatRelative(iso: string): string {
  const mins = minutesUntil(iso);
  if (mins < -5) return "отправился";
  if (mins < 0) return "отправляется";
  if (mins === 0) return "сейчас";
  if (mins < 60) return `через ${mins} мин`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h < 24) return m === 0 ? `через ${h} ч` : `через ${h} ч ${m} мин`;
  return "";
}
