import type { AppMetadata } from "@/lib/types"

export const runMetadata: AppMetadata = {
  name: "Run",
  iconPath: "/placeholder.svg?height=32&width=32",
  capabilities: ["SYSTEM_LAUNCHER"],
  runnableBy: "both",
  singleInstance: true,
  showOnDesktop: false,
  defaultWidth: 400,
  defaultHeight: 300,
  category: "system",
}
