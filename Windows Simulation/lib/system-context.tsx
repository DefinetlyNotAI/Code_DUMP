"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { AppInstance, SystemNotification, ClipboardContent } from "./types"
import { AppRegistry } from "./registry"
import { SystemAPI } from "./api"

/**
 * @interface SystemContextType
 * @description Defines the shape of the system context, providing access to OS-level state and functions.
 */
interface SystemContextType {
  openApps: AppInstance[]
  activeApp: string | null
  notifications: SystemNotification[]
  clipboard: ClipboardContent | null
  openApp: (appId: string, props?: any) => void
  closeApp: (appId: string) => void
  setActiveApp: (appId: string) => void
  addNotification: (notification: Omit<SystemNotification, "id" | "timestamp">) => void
  removeNotification: (id: string) => void
  setClipboard: (content: ClipboardContent | null) => void
}

const SystemContext = createContext<SystemContextType | undefined>(undefined)

/**
 * @component SystemProvider
 * @description Provides the system context to its children, managing global OS state.
 * @param {ReactNode} children - The child components to be wrapped by the provider.
 */
export function SystemProvider({ children }: { children: ReactNode }) {
  const [openApps, setOpenApps] = useState<AppInstance[]>([])
  const [activeApp, setActiveApp] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<SystemNotification[]>([])
  const [clipboard, setClipboard] = useState<ClipboardContent | null>(null)

  /**
   * @function openApp
   * @description Opens a new instance of an application. If the app is a single instance, it activates the existing one.
   * @param {string} appId - The ID of the application to open.
   * @param {any} [props] - Optional props to pass to the application component.
   */
  const openApp = (appId: string, props: any = {}) => {
    const appDefinition = AppRegistry.getApp(appId)
    if (!appDefinition) {
      SystemAPI.error(`App "${appId}" not found`)
      return
    }

    // Check if app is already open and is single instance
    if (appDefinition.metadata.singleInstance && openApps.find((app) => app.id === appId)) {
      setActiveApp(appId)
      return
    }

    const instanceId = appDefinition.metadata.singleInstance ? appId : `${appId}-${Date.now()}`

    const instance: AppInstance = {
      id: instanceId,
      appId,
      component: appDefinition.component,
      metadata: appDefinition.metadata,
      props,
    }

    setOpenApps((prev) => [...prev, instance])
    setActiveApp(instanceId)
  }

  /**
   * @function closeApp
   * @description Closes an application instance.
   * @param {string} instanceId - The ID of the application instance to close.
   */
  const closeApp = (instanceId: string) => {
    setOpenApps((prev) => prev.filter((app) => app.id !== instanceId))
    if (activeApp === instanceId) {
      const remaining = openApps.filter((app) => app.id !== instanceId)
      setActiveApp(remaining.length > 0 ? remaining[remaining.length - 1].id : null)
    }
  }

  /**
   * @function addNotification
   * @description Adds a new system notification.
   * @param {Omit<SystemNotification, "id" | "timestamp">} notification - The notification details (type, title, message).
   */
  const addNotification = (notification: Omit<SystemNotification, "id" | "timestamp">) => {
    const newNotification: SystemNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
    }
    setNotifications((prev) => [...prev, newNotification])

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(newNotification.id)
    }, 5000)
  }

  /**
   * @function removeNotification
   * @description Removes a system notification by its ID.
   * @param {string} id - The ID of the notification to remove.
   */
  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <SystemContext.Provider
      value={{
        openApps,
        activeApp,
        notifications,
        clipboard,
        openApp,
        closeApp,
        setActiveApp,
        addNotification,
        removeNotification,
        setClipboard,
      }}
    >
      {children}
    </SystemContext.Provider>
  )
}

/**
 * @function useSystem
 * @description A custom hook to access the system context.
 * @returns {SystemContextType} The system context object.
 * @throws {Error} If used outside of a SystemProvider.
 */
export function useSystem() {
  const context = useContext(SystemContext)
  if (context === undefined) {
    throw new Error("useSystem must be used within a SystemProvider")
  }
  return context
}
