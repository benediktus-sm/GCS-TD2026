"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LayoutDashboard, Microchip, CircuitBoard, Map, Plane, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { icon: LayoutDashboard, labelKey: "dashboard", href: "/" },
  { icon: Microchip, labelKey: "command", href: "/command", hidden: true },
  { icon: Map, labelKey: "plan", href: "/plan" },
  { icon: Plane, labelKey: "simulate", href: "/simulate" },
  { icon: CircuitBoard, labelKey: "hardware", href: "/hardware", hidden: true },
  { icon: Clock, labelKey: "history", href: "/flight-logs" },
];

export function CommandNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const visibleTabs = tabs.filter((tab) => !tab.hidden);

  return (
    <nav className="flex items-center gap-1 p-0.5 bg-bg-primary/60 border border-border-default rounded">
      {visibleTabs.map(({ icon: Icon, labelKey, href }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 text-xs font-mono transition-colors rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-primary",
              active
                ? "text-accent-primary bg-accent-primary/15 font-semibold border border-accent-primary/30"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/40 border border-transparent"
            )}
          >
            <Icon size={13} />
            <span className="hidden lg:inline uppercase tracking-wider">{t(labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

