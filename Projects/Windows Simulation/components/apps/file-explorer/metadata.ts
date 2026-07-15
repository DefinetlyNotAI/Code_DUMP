import type { AppMetadata } from "@/lib/types"

export const fileExplorerMetadata: AppMetadata = {
  name: "File Explorer",
  iconPath: "/placeholder.svg?height=32&width=32",
  capabilities: ["FILE_SYSTEM", "FILE_BROWSER"],
  runnableBy: "both",
  singleInstance: false,
  showOnDesktop: true,
  defaultWidth: 900,
  defaultHeight: 600,
  category: "system",
}
