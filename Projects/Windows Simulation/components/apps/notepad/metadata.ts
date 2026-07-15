import type { AppMetadata } from "@/lib/types"

export const notepadMetadata: AppMetadata = {
  name: "Notepad",
  iconPath: "/placeholder.svg?height=32&width=32",
  capabilities: ["TXT", "TEXT_EDITOR"],
  runnableBy: "both",
  singleInstance: false,
  showOnDesktop: true,
  defaultWidth: 600,
  defaultHeight: 400,
  category: "productivity",
}
