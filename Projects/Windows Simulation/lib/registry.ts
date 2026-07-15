import type React from "react"
import type { AppDefinition } from "./types"

// Import all apps
import NotepadApp from "@/components/apps/notepad/App"
import PaintApp from "@/components/apps/paint/App"
import BrowserApp from "@/components/apps/browser/App"
import RunApp from "@/components/apps/run/App"
import ControlPanelApp from "@/components/apps/control-panel/App"
import FileExplorerApp from "@/components/apps/file-explorer/App"
import CmdApp from "@/components/apps/cmd/App"

// Import metadata
import { notepadMetadata } from "@/components/apps/notepad/metadata"
import { paintMetadata } from "@/components/apps/paint/metadata"
import { browserMetadata } from "@/components/apps/browser/metadata"
import { runMetadata } from "@/components/apps/run/metadata"
import { controlPanelMetadata } from "@/components/apps/control-panel/metadata"
import { fileExplorerMetadata } from "@/components/apps/file-explorer/metadata"
import { cmdMetadata } from "@/components/apps/cmd/metadata"

class AppRegistryClass {
  private apps: Map<string, AppDefinition> = new Map()

  initialize() {
    // Register all apps
    this.registerApp("notepad", NotepadApp, notepadMetadata)
    this.registerApp("paint", PaintApp, paintMetadata)
    this.registerApp("browser", BrowserApp, browserMetadata)
    this.registerApp("run", RunApp, runMetadata)
    this.registerApp("control-panel", ControlPanelApp, controlPanelMetadata)
    this.registerApp("file-explorer", FileExplorerApp, fileExplorerMetadata)
    this.registerApp("cmd", CmdApp, cmdMetadata)
  }

  registerApp(id: string, component: React.ComponentType<any>, metadata: any) {
    this.apps.set(id, {
      id,
      component,
      metadata,
    })
  }

  getApp(id: string): AppDefinition | undefined {
    return this.apps.get(id)
  }

  getApps(): AppDefinition[] {
    return Array.from(this.apps.values())
  }

  getAppsByCapability(capability: string): AppDefinition[] {
    return this.getApps().filter((app) => app.metadata.capabilities.includes(capability))
  }

  getAppsByCategory(category: string): AppDefinition[] {
    return this.getApps().filter((app) => app.metadata.category === category)
  }
}

export const AppRegistry = new AppRegistryClass()
