import type { AppMetadata } from "@/lib/types"

export const controlPanelMetadata: AppMetadata = {
  name: "Control Panel",
  iconPath: "/placeholder.svg?height=32&width=32",
  capabilities: ["SYSTEM_SETTINGS", "CONFIGURATION"],
  runnableBy: "both",
  singleInstance: true,
  showOnDesktop: true,
  defaultWidth: 900,
  defaultHeight: 600,
  category: "system",
}
