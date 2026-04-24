"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ticket, Train } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Расписание", icon: Train },
  { href: "/tickets", label: "Мои билеты", icon: Ticket },
];

export function AppHeader() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" || pathname.startsWith("/search") : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Train className="h-5 w-5" aria-hidden />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">Электричка</span>
            <span className="text-[11px] text-muted-foreground">
              Расписание и билеты
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
