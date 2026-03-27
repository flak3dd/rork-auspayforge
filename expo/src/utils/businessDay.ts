const AU_PUBLIC_HOLIDAYS_2025: string[] = [
  '2025-01-01', '2025-01-27', '2025-04-18', '2025-04-19', '2025-04-21',
  '2025-04-25', '2025-06-09', '2025-10-06', '2025-12-25', '2025-12-26',
];

const AU_PUBLIC_HOLIDAYS_2026: string[] = [
  '2026-01-01', '2026-01-26', '2026-04-03', '2026-04-04', '2026-04-06',
  '2026-04-25', '2026-06-08', '2026-10-05', '2026-12-25', '2026-12-28',
];

const AU_PUBLIC_HOLIDAYS_2024: string[] = [
  '2024-01-01', '2024-01-26', '2024-03-29', '2024-03-30', '2024-04-01',
  '2024-04-25', '2024-06-10', '2024-10-07', '2024-12-25', '2024-12-26',
];

const ALL_HOLIDAYS = new Set([
  ...AU_PUBLIC_HOLIDAYS_2024,
  ...AU_PUBLIC_HOLIDAYS_2025,
  ...AU_PUBLIC_HOLIDAYS_2026,
]);

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function isPublicHoliday(date: Date): boolean {
  return ALL_HOLIDAYS.has(date.toISOString().split('T')[0]);
}

export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date) && !isPublicHoliday(date);
}

export function nextBusinessDay(date: Date): Date {
  const d = new Date(date);
  while (!isBusinessDay(d)) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

export function isDaytimeTransaction(dayOfWeek: number): boolean {
  return dayOfWeek >= 1 && dayOfWeek <= 5;
}

export function getMerchantWeight(dayOfWeek: number): number {
  if (dayOfWeek === 0) return 0.5;
  if (dayOfWeek === 6) return 0.8;
  return 1.0;
}

export function getATMWeight(dayOfWeek: number): number {
  if (dayOfWeek === 0 || dayOfWeek === 6) return 1.4;
  if (dayOfWeek === 5) return 1.3;
  return 0.8;
}

export function getTransferWeight(dayOfWeek: number): number {
  if (dayOfWeek === 0 || dayOfWeek === 6) return 0.6;
  return 1.0;
}
