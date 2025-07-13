"use client"

import { useEffect } from "react"
import { useSystem } from "@/lib/system-context"

export default function NotificationManager() {
  const { notifications, removeNotification, addNotification } = useSystem()

  useEffect(() => {
    const handleSystemNotification = (event: any) => {
      addNotification(event.detail)
    }

    window.addEventListener("system-notification", handleSystemNotification)

    return () => {
      window.removeEventListener("system-notification", handleSystemNotification)
    }
  }, [addNotification])

  const getIcon = (type: string) => {
    switch (type) {
      case "error":
        return (
          <div className="w-8 h-8 bg-red-500 border border-gray-600 flex items-center justify-center text-white font-bold text-xs">
            ✕
          </div>
        )
      case "warning":
        return (
          <div className="w-8 h-8 bg-yellow-500 border border-gray-600 flex items-center justify-center text-black font-bold text-xs">
            !
          </div>
        )
      case "success":
        return (
          <div className="w-8 h-8 bg-green-500 border border-gray-600 flex items-center justify-center text-white font-bold text-xs">
            ✓
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 bg-blue-500 border border-gray-600 flex items-center justify-center text-white font-bold text-xs">
            i
          </div>
        )
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div key={notification.id} className="win98-window w-80">
          <div className="win98-titlebar">
            <span className="text-xs">{notification.title}</span>
            <button className="win98-titlebar-button" onClick={() => removeNotification(notification.id)}>
              ×
            </button>
          </div>
          <div className="p-3 bg-gray-300 flex items-start space-x-3 text-xs">
            {getIcon(notification.type)}
            <div className="flex-1">
              <p className="text-black">{notification.message}</p>
            </div>
            <button className="win98-button px-2 py-1 text-xs" onClick={() => removeNotification(notification.id)}>
              OK
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
