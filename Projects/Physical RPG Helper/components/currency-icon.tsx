import { Coins, Gem, Sparkle, Circle, Star, Diamond, Banknote, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

const MAP: Record<string, typeof Coins> = {
  coins: Coins,
  gem: Gem,
  gems: Gem,
  sparkle: Sparkle,
  orbs: Sparkle,
  star: Star,
  diamond: Diamond,
  banknote: Banknote,
  wallet: Wallet,
}

export function CurrencyIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = MAP[icon] ?? Circle
  return <Icon className={cn("size-4", className)} aria-hidden />
}

export const CURRENCY_ICON_OPTIONS = Object.keys(MAP).filter((k, i, a) => a.indexOf(k) === i)
