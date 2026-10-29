import type { Demand, Frequency } from "../types";
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function parseDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}
export function isDate(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    localDate(parseDate(value)) === value &&
    value >= "1900-01-01" &&
    value <= "2200-12-31"
  );
}
export function addDays(date: string, days: number): string {
  const d = parseDate(date);
  d.setDate(d.getDate() + days);
  return localDate(d);
}
export function formatDate(date: string): string {
  return date
    ? new Intl.DateTimeFormat("pt-BR").format(parseDate(date))
    : "Sem prazo";
}
export function closed(d: Demand): boolean {
  return d.status === "Concluída" || d.status === "Cancelada";
}
export function isOverdue(d: Demand, today = localDate()): boolean {
  return !closed(d) && !!d.deadline && d.deadline < today;
}
export function nextOccurrence(
  date: string,
  frequency: Frequency,
  anchorDay = parseDate(date).getDate(),
): string {
  const days = { Diária: 1, Semanal: 7, Quinzenal: 14 };
  if (frequency in days)
    return addDays(date, days[frequency as keyof typeof days]);
  const d = parseDate(date);
  const month = d.getMonth() + (frequency === "Trimestral" ? 3 : 1);
  const max = new Date(d.getFullYear(), month + 1, 0, 12).getDate();
  return localDate(
    new Date(d.getFullYear(), month, Math.min(anchorDay, max), 12),
  );
}
export function inPeriod(date: string, from: string, to: string) {
  return (!from || date >= from) && (!to || date <= to);
}
