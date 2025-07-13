import type { AppMetadata } from "@/lib/types"

export const paintMetadata: AppMetadata = {
  name: "Paint",
  iconPath: "/placeholder.svg?height=32&width=32",
  capabilities: ["IMAGE_EDITOR", "GRAPHICS"],
  runnableBy: "both",
  singleInstance: false,
  showOnDesktop: true,
  defaultWidth: 900,
  defaultHeight: 700,
  category: "graphics",
}
