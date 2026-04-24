"use client";

import { useEffect, useState } from "react";
import type { Ticket } from "./types";
import { ticketsStore } from "./tickets-store";

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTickets(ticketsStore.getAll());
    setMounted(true);
    return ticketsStore.subscribe(setTickets);
  }, []);

  return { tickets, mounted };
}
