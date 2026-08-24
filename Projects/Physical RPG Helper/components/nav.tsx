"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Skull,
  Swords,
  Backpack,
  Store,
  Sparkles,
  ScrollText,
} from "lucide-react"

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/characters", label: "Characters", icon: Users },
  { href: "/enemies", label: "Enemies", icon: Skull },
  { href: "/battle", label: "Battle", icon: Swords },
  { href: "/inventory", label: "Inventory", icon: Backpack },
  { href: "/shop", label: "Shop", icon: Store },
  { href: "/gacha", label: "Gacha", icon: Sparkles },
  { href: "/history", label: "History", icon: ScrollText },
] as const

export function Nav() {
  const pathname = usePathname()
  return (
    <nav className="flex flex-col gap-1 p-2">
      {NAV.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
            )}
          >
            <Icon
              className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}
            />
            <span className="font-medium">{item.label}</span>
            {active && <span className="ml-auto h-4 w-1 rounded-full bg-primary" aria-hidden />}
          </Link>
        )
      })}
    </nav>
  )
}
