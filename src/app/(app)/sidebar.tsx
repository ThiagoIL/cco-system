"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarClock,
  PhoneIncoming,
  ClipboardList,
  RotateCcw,
  Map,
  Users,
  Truck,
  BarChart3,
  Tv,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/programacao", label: "Programação", icon: CalendarClock },
  { href: "/chamados", label: "Chamados", icon: PhoneIncoming },
  { href: "/pendencias", label: "Pendências", icon: ClipboardList },
  { href: "/retornos", label: "Retornos", icon: RotateCcw },
  { href: "/mapa", label: "Mapa Operacional", icon: Map },
  { href: "/equipes", label: "Equipes", icon: Users },
  { href: "/viaturas", label: "Viaturas", icon: Truck },
  { href: "/indicadores", label: "Indicadores", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname?.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition",
              active
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
      <Link
        href="/tv"
        target="_blank"
        className="mt-2 flex items-center gap-2.5 rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Tv className="size-4 shrink-0" />
        Painel para TV
      </Link>
    </nav>
  );
}
