import type { AppMetadata } from "@/lib/types"

export const cmdMetadata: AppMetadata = {
  name: "Command Prompt",
  iconPath: "/placeholder.svg?height=32&width=32",
  capabilities: ["COMMAND_LINE", "SYSTEM_COMMANDS"],
  runnableBy: "both",
  singleInstance: false,
  showOnDesktop: true,
  defaultWidth: 800,
  defaultHeight: 500,
  category: "system",
}
