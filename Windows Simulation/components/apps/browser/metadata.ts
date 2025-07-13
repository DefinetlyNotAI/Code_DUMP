import type { AppMetadata } from "@/lib/types"

export const browserMetadata: AppMetadata = {
  name: "Browser",
  iconPath: "/placeholder.svg?height=32&width=32",
  capabilities: ["WEB_BROWSER", "HTML", "HTTP"],
  runnableBy: "both",
  singleInstance: false,
  showOnDesktop: true,
  defaultWidth: 1000,
  defaultHeight: 700,
  category: "internet",
}
