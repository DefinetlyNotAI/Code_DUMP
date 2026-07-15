"use client"

import { useSystem } from "@/lib/system-context"
import { useState, useEffect } from "react"
import { StartIcon } from "@/components/icons/AppIcons"
import StartMenu from "./StartMenu"

export default function Taskbar() {
  const { openApps, activeApp, setActiveApp, openApp } = useSystem()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const toggleStartMenu = () => {
    setIsStartMenuOpen(!isStartMenuOpen)
  }

  return (
    <>
      <div className="absolute bottom-0 left-0 right-0 win98-taskbar z-50">
        {/* Start Button */}
        <button className="win98-start-button" onClick={toggleStartMenu}>
          <StartIcon />
          <span className="ml-1">Start</span>
        </button>

        {/* Running Apps */}
        <div className="flex-1 flex items-center">
          {openApps.map((app) => (
            <button
              key={app.id}
              className={`win98-taskbar-button ${activeApp === app.id ? "active" : ""}`}
              onClick={() => setActiveApp(app.id)}
            >
              <div className="w-4 h-4 mr-1 flex-shrink-0">
                {/* Small icon placeholder - could be replaced with actual app icon */}
                <div className="w-full h-full bg-blue-500 border border-gray-600"></div>
              </div>
              <span className="truncate">{app.metadata.name}</span>
            </button>
          ))}
        </div>

        {/* System Tray */}
        <div className="win98-system-tray">
          {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
      {isStartMenuOpen && <StartMenu onClose={() => setIsStartMenuOpen(false)} />}
    </>
  )
}
