import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function generateTicketId(): string {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `EL-${t}-${r}`;
}

export function generateSeat(): string {
  const car = 1 + Math.floor(Math.random() * 8);
  const place = 1 + Math.floor(Math.random() * 64);
  return `${car} вагон · место ${place}`;
}
