import type React from "react"

/**
 * @interface AppMetadata
 * @description Defines the metadata for an application in the OS simulation.
 */
export interface AppMetadata {
  name: string
  iconPath: string // Path to the icon SVG component
  capabilities: string[] // e.g., "TXT", "IMAGE_EDITOR", "WEB_BROWSER"
  runnableBy: "system" | "user" | "both" // Who can launch this app
  singleInstance?: boolean // If true, only one instance of the app can be open at a time
  showOnDesktop?: boolean // If true, an icon for this app appears on the desktop
  defaultWidth?: number
  defaultHeight?: number
  category?: string // e.g., "productivity", "system", "internet"
}

/**
 * @interface AppDefinition
 * @description Defines a registered application, linking its component and metadata.
 */
export interface AppDefinition {
  id: string
  component: React.ComponentType<any>
  metadata: AppMetadata
}

/**
 * @interface AppInstance
 * @description Represents an open instance of an application.
 */
export interface AppInstance {
  id: string // Unique instance ID (e.g., "notepad-12345")
  appId: string // The ID from AppDefinition (e.g., "notepad")
  component: React.ComponentType<any>
  metadata: AppMetadata
  props: any // Props passed to the app component
}

/**
 * @interface SystemNotification
 * @description Defines the structure for system-wide notifications.
 */
export interface SystemNotification {
  id: string
  type: "info" | "warning" | "error" | "success"
  title: string
  message: string
  timestamp: Date
}

/**
 * @interface SystemState
 * @description Represents the current state of the simulated OS.
 */
export interface SystemState {
  time: Date
  clipboard: string // Current clipboard content (simple string for now)
  battery: {
    level: number
    charging: boolean
  }
  network: {
    connected: boolean
    type: "wifi" | "ethernet" | "cellular" | "dialup"
  }
}

/**
 * @interface FileSystemItem
 * @description Represents a file or folder in the simulated file system.
 */
export interface FileSystemItem {
  name: string
  type: "file" | "folder"
  content?: string // For files, holds the content (e.g., text, base64 image)
  children?: Record<string, FileSystemItem> // For folders, holds child items
  size?: number // Size in bytes for files
  modified: Date
}

/**
 * @interface ClipboardContent
 * @description Defines the structure for content stored in the system clipboard.
 */
export interface ClipboardContent {
  type: "text" | "file" | "folder"
  data: string // For file/folder, this is the full path
  isCut?: boolean // True if the item was cut (for move operation), false for copy
}
