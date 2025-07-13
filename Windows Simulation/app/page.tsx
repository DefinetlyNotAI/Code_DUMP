"use client"

import { useState, useEffect } from "react"
import Desktop from "@/components/desktop/Desktop"
import Taskbar from "@/components/desktop/Taskbar"
import WindowManager from "@/components/desktop/WindowManager"
import { SystemProvider } from "@/lib/system-context"
import { AppRegistry } from "@/lib/registry"
import { SystemAPI } from "@/lib/api"

export default function WindowsOS() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Initialize the system
    AppRegistry.initialize()
    SystemAPI.initialize()
    setIsLoaded(true)
  }, [])

  if (!isLoaded) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-white text-sm font-mono">Microsoft Windows 98</div>
      </div>
    )
  }

  return (
    <SystemProvider>
      <div className="h-screen w-screen overflow-hidden win98-desktop relative">
        <Desktop />
        <WindowManager />
        <Taskbar />
      </div>
    </SystemProvider>
  )
}
