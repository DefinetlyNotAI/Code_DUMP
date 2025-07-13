import { useSystem } from "./system-context"
import { FileSystem } from "./file-system"
import { AppRegistry } from "./registry"
import type { FileSystemItem, ClipboardContent, AppMetadata, SystemState } from "./types"

/**
 * @class SystemAPIClass
 * @description Provides a singleton interface for applications to interact with the simulated OS.
 * This class handles system-level operations like notifications, app lifecycle,
 * inter-app communication, system state, and file system operations.
 */
class SystemAPIClass {
  constructor() {
    // Bind all methods to the instance to ensure 'this' context is preserved
    this.error = this.error.bind(this)
    this.info = this.info.bind(this)
    this.warn = this.warn.bind(this)
    this.success = this.success.bind(this)
    this.openApp = this.openApp.bind(this)
    this.closeApp = this.closeApp.bind(this)
    this.broadcast = this.broadcast.bind(this)
    this.subscribe = this.subscribe.bind(this)
    this.getSystemState = this.getSystemState.bind(this)
    this.readFile = this.readFile.bind(this)
    this.writeFile = this.writeFile.bind(this)
    this.listDirectory = this.listDirectory.bind(this)
    this.createDirectory = this.createDirectory.bind(this)
    this.deleteItem = this.deleteItem.bind(this)
    this.renameItem = this.renameItem.bind(this)
    this.copyItem = this.copyItem.bind(this)
    this.moveItem = this.moveItem.bind(this)
    this.executeFile = this.executeFile.bind(this)
    this.getAppMetadata = this.getAppMetadata.bind(this)
    this.broadcastFileSystemChange = this.broadcastFileSystemChange.bind(this)
    this.subscribeToFileSystemChanges = this.subscribeToFileSystemChanges.bind(this)
  }

  /**
   * @function initialize
   * @description Placeholder for any initialization logic that needs to run once the system context is available.
   */
  initialize() {
    // This will be called after the system context is available
  }

  // --- System Messaging ---

  /**
   * @function error
   * @description Displays an error notification to the user.
   * @param {string} message - The error message.
   * @param {string} [title="Error"] - The title of the notification.
   */
  error(message: string, title = "Error") {
    if (typeof window !== "undefined") {
      const event = new CustomEvent("system-notification", {
        detail: { type: "error", title, message },
      })
      window.dispatchEvent(event)
    }
  }

  /**
   * @function info
   * @description Displays an informational notification to the user.
   * @param {string} message - The information message.
   * @param {string} [title="Information"] - The title of the notification.
   */
  info(message: string, title = "Information") {
    if (typeof window !== "undefined") {
      const event = new CustomEvent("system-notification", {
        detail: { type: "info", title, message },
      })
      window.dispatchEvent(event)
    }
  }

  /**
   * @function warn
   * @description Displays a warning notification to the user.
   * @param {string} message - The warning message.
   * @param {string} [title="Warning"] - The title of the notification.
   */
  warn(message: string, title = "Warning") {
    if (typeof window !== "undefined") {
      const event = new CustomEvent("system-notification", {
        detail: { type: "warning", title, message },
      })
      window.dispatchEvent(event)
    }
  }

  /**
   * @function success
   * @description Displays a success notification to the user.
   * @param {string} message - The success message.
   * @param {string} [title="Success"] - The title of the notification.
   */
  success(message: string, title = "Success") {
    if (typeof window !== "undefined") {
      const event = new CustomEvent("system-notification", {
        detail: { type: "success", title, message },
      })
      window.dispatchEvent(event)
    }
  }

  // --- App Lifecycle ---

  /**
   * @function openApp
   * @description Requests the system to open an application.
   * @param {string} appId - The ID of the application to open.
   * @param {any} [props] - Optional props to pass to the application component.
   */
  openApp(appId: string, props?: any) {
    if (typeof window !== "undefined") {
      const event = new CustomEvent("system-open-app", {
        detail: { appId, props },
      })
      window.dispatchEvent(event)
    }
  }

  /**
   * @function closeApp
   * @description Requests the system to close an application instance.
   * @param {string} instanceId - The ID of the application instance to close.
   */
  closeApp(instanceId: string) {
    if (typeof window !== "undefined") {
      const event = new CustomEvent("system-close-app", {
        detail: { instanceId },
      })
      window.dispatchEvent(event)
    }
  }

  /**
   * @function getAppMetadata
   * @description Retrieves the metadata for a registered application.
   * @param {string} appId - The ID of the application.
   * @returns {AppMetadata | undefined} The application metadata or undefined if not found.
   */
  getAppMetadata(appId: string): AppMetadata | undefined {
    return AppRegistry.getApp(appId)?.metadata
  }

  // --- Inter-app Communication ---

  /**
   * @function broadcast
   * @description Broadcasts a custom event to all subscribed applications.
   * @param {string} channel - The channel name for the broadcast.
   * @param {any} data - The data to send with the broadcast.
   */
  broadcast(channel: string, data: any) {
    if (typeof window !== "undefined") {
      const event = new CustomEvent(`app-broadcast-${channel}`, {
        detail: data,
      })
      window.dispatchEvent(event)
    }
  }

  /**
   * @function subscribe
   * @description Subscribes to a custom broadcast channel.
   * @param {string} channel - The channel name to subscribe to.
   * @param {(data: any) => void} callback - The callback function to execute when a broadcast is received.
   * @returns {() => void} A cleanup function to unsubscribe.
   */
  subscribe(channel: string, callback: (data: any) => void) {
    if (typeof window !== "undefined") {
      const handler = (event: any) => callback(event.detail)
      window.addEventListener(`app-broadcast-${channel}`, handler)
      return () => window.removeEventListener(`app-broadcast-${channel}`, handler)
    }
    return () => {}
  }

  // --- System State ---

  /**
   * @function getSystemState
   * @description Retrieves the current simulated system state.
   * @returns {SystemState} The current system state.
   */
  getSystemState(): SystemState {
    return {
      time: new Date(),
      clipboard: "", // This will be managed by useSystem hook
      battery: {
        level: Math.floor(Math.random() * 100),
        charging: Math.random() > 0.5,
      },
      network: {
        connected: true,
        type: "dialup" as const,
      },
    }
  }

  // --- Clipboard Operations ---

  /**
   * @function readClipboard
   * @description Reads the current content of the system clipboard.
   * @returns {ClipboardContent | null} The clipboard content or null if empty.
   */
  readClipboard(): ClipboardContent | null {
    // This method needs to be overridden by useSystemAPI hook to access React state
    return null
  }

  /**
   * @function writeClipboard
   * @description Writes content to the system clipboard.
   * @param {ClipboardContent | null} content - The content to write to the clipboard.
   */
  writeClipboard(content: ClipboardContent | null) {
    // This method needs to be overridden by useSystemAPI hook to access React state
  }

  // --- File System Operations ---

  /**
   * @function readFile
   * @description Reads the content of a file from the simulated file system.
   * @param {string} path - The full path to the file.
   * @returns {Promise<string>} A promise that resolves with the file content.
   */
  async readFile(path: string): Promise<string> {
    return FileSystem.readFile(path)
  }

  /**
   * @function writeFile
   * @description Writes content to a file in the simulated file system.
   * @param {string} path - The full path to the file.
   * @param {string} content - The content to write.
   * @returns {Promise<void>} A promise that resolves when the write is complete.
   */
  async writeFile(path: string, content: string): Promise<void> {
    await FileSystem.writeFile(path, content)
    this.broadcastFileSystemChange(path) // Broadcast change
  }

  /**
   * @function listDirectory
   * @description Lists the contents of a directory in the simulated file system.
   * @param {string} path - The full path to the directory.
   * @returns {Promise<FileSystemItem[]>} A promise that resolves with an array of items.
   */
  async listDirectory(path: string): Promise<FileSystemItem[]> {
    return FileSystem.listDirectory(path)
  }

  /**
   * @function createDirectory
   * @description Creates a new directory in the simulated file system.
   * @param {string} path - The full path for the new directory.
   * @returns {Promise<void>} A promise that resolves when the directory is created.
   */
  async createDirectory(path: string): Promise<void> {
    await FileSystem.createDirectory(path)
    this.broadcastFileSystemChange(path) // Broadcast change
  }

  /**
   * @function deleteItem
   * @description Deletes a file or directory from the simulated file system.
   * @param {string} path - The full path to the item to delete.
   * @returns {Promise<void>} A promise that resolves when the item is deleted.
   */
  async deleteItem(path: string): Promise<void> {
    await FileSystem.deleteItem(path)
    this.broadcastFileSystemChange(path) // Broadcast change
  }

  /**
   * @function renameItem
   * @description Renames a file system item within the same directory.
   * @param {string} oldPath - The current full path of the item.
   * @param {string} newName - The new name for the item (not a full path if different).
   * @returns {Promise<void>} A promise that resolves when the item is renamed.
   */
  async renameItem(oldPath: string, newName: string): Promise<void> {
    await FileSystem.renameItem(oldPath, newName)
    this.broadcastFileSystemChange(oldPath) // Broadcast change for old path's parent
    this.broadcastFileSystemChange(
      newName.includes("\\") ? newName : `${oldPath.substring(0, oldPath.lastIndexOf("\\"))}\\${newName}`,
    ) // Broadcast change for new path's parent
  }

  /**
   * @function copyItem
   * @description Copies a file or folder from a source path to a destination path.
   * @param {string} sourcePath - The full path of the item to copy.
   * @param {string} destinationPath - The full path where the item should be copied (including new name if different).
   * @returns {Promise<void>} A promise that resolves when the copy operation is complete.
   */
  async copyItem(sourcePath: string, destinationPath: string): Promise<void> {
    await FileSystem.copyItem(sourcePath, destinationPath)
    this.broadcastFileSystemChange(destinationPath) // Broadcast change at destination
  }

  /**
   * @function moveItem
   * @description Moves a file or folder from a source path to a destination path.
   * This is essentially a copy followed by a delete of the source.
   * @param {string} sourcePath - The full path of the item to move.
   * @param {string} destinationPath - The full path where the item should be moved (including new name if different).
   * @returns {Promise<void>} A promise that resolves when the move operation is complete.
   */
  async moveItem(sourcePath: string, destinationPath: string): Promise<void> {
    await FileSystem.moveItem(sourcePath, destinationPath)
    this.broadcastFileSystemChange(sourcePath) // Broadcast change at source (item removed)
    this.broadcastFileSystemChange(destinationPath) // Broadcast change at destination (item added)
  }

  /**
   * @function executeFile
   * @description Attempts to open a file using its associated application.
   * @param {string} filePath - The full path to the file to execute.
   * @param {any} [props] - Optional props to pass to the opened application.
   */
  executeFile(filePath: string, props?: any) {
    const extension = filePath.split(".").pop()?.toLowerCase()
    let appIdToOpen: string | undefined

    switch (extension) {
      case "txt":
        appIdToOpen = "notepad"
        break
      case "html":
      case "htm":
        appIdToOpen = "browser"
        break
      case "png":
      case "jpg":
      case "jpeg":
      case "bmp":
        appIdToOpen = "paint"
        break
      // Add more file associations here
      default:
        this.warn(`No default application for .${extension} files.`)
        return
    }

    if (appIdToOpen) {
      this.openApp(appIdToOpen, { initialFilePath: filePath, ...props })
    }
  }

  // --- File System Change Events ---

  /**
   * @function broadcastFileSystemChange
   * @description Broadcasts an event indicating a change in the file system.
   * Components can subscribe to this to refresh their views.
   * @param {string} changedPath - The path that was changed (e.g., a file, or a directory where an item was added/removed).
   */
  broadcastFileSystemChange(changedPath: string) {
    if (typeof window !== "undefined") {
      const event = new CustomEvent("file-system-change", {
        detail: { path: changedPath, timestamp: Date.now() },
      })
      window.dispatchEvent(event)
    }
  }

  /**
   * @function subscribeToFileSystemChanges
   * @description Subscribes to file system change events.
   * @param {(data: { path: string; timestamp: number }) => void} callback - The callback function to execute when a change is detected.
   * @returns {() => void} A cleanup function to unsubscribe.
   */
  subscribeToFileSystemChanges(callback: (data: { path: string; timestamp: number }) => void) {
    if (typeof window !== "undefined") {
      const handler = (event: any) => callback(event.detail)
      window.addEventListener("file-system-change", handler)
      return () => window.removeEventListener("file-system-change", handler)
    }
    return () => {}
  }
}

export const SystemAPI = new SystemAPIClass()

/**
 * @function useSystemAPI
 * @description A custom React hook for applications to interact with the SystemAPI.
 * It integrates the SystemAPI singleton with React's context for state management.
 * @returns {SystemAPIClass & { openApp: (appId: string, props?: any) => void; closeApp: (instanceId: string) => void; addNotification: (notification: Omit<SystemNotification, "id" | "timestamp">) => void; readClipboard: () => ClipboardContent | null; writeClipboard: (content: ClipboardContent | null) => void; }}
 * The extended SystemAPI instance with context-aware functions.
 */
export function useSystemAPI() {
  const system = useSystem()

  // Override SystemAPI methods that need access to React context state
  SystemAPI.openApp = system.openApp
  SystemAPI.closeApp = system.closeApp
  SystemAPI.readClipboard = () => system.clipboard
  SystemAPI.writeClipboard = system.setClipboard

  return {
    ...SystemAPI,
    addNotification: system.addNotification, // Expose addNotification directly from context
  }
}
