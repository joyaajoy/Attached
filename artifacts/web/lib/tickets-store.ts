"use client";

import type { Ticket } from "./types";

const STORAGE_KEY = "elektrichka.tickets.v1";

type Listener = (tickets: Ticket[]) => void;
const listeners = new Set<Listener>();

function read(): Ticket[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Ticket[];
  } catch {
    return [];
  }
}

function write(tickets: Ticket[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  listeners.forEach((l) => l(tickets));
}

export const ticketsStore = {
  getAll(): Ticket[] {
    return read();
  },
  get(id: string): Ticket | undefined {
    return read().find((t) => t.id === id);
  },
  add(ticket: Ticket) {
    const current = read();
    write([ticket, ...current]);
  },
  remove(id: string) {
    write(read().filter((t) => t.id !== id));
  },
  updateStatus(id: string, status: Ticket["status"]) {
    write(read().map((t) => (t.id === id ? { ...t, status } : t)));
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    // Sync across tabs
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) listener(read());
    };
    if (typeof window !== "undefined") {
      window.addEventListener("storage", onStorage);
    }
    return () => {
      listeners.delete(listener);
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", onStorage);
      }
    };
  },
};
