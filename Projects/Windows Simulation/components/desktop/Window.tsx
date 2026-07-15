"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useSystem } from "@/lib/system-context"
import type { AppInstance } from "@/lib/types"
import {
  NotepadIcon,
  PaintIcon,
  BrowserIcon,
  CmdIcon,
  FileExplorerIcon,
  ControlPanelIcon,
  RunIcon,
} from "@/components/icons/AppIcons"

interface WindowProps {
  app: AppInstance
}

export default function Window({ app }: WindowProps) {
  const { closeApp, activeApp, setActiveApp } = useSystem()
  const [position, setPosition] = useState({ x: 100 + Math.random() * 200, y: 100 + Math.random() * 100 })
  const [size, setSize] = useState({
    width: app.metadata.defaultWidth || 800,
    height: app.metadata.defaultHeight || 600,
  })
  const [isMaximized, setIsMaximized] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number }>()

  const isActive = activeApp === app.id

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setActiveApp(app.id)
      setIsDragging(true)
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPosX: position.x,
        startPosY: position.y,
      }
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragRef.current) {
        const deltaX = e.clientX - dragRef.current.startX
        const deltaY = e.clientY - dragRef.current.startY
        setPosition({
          x: Math.max(0, dragRef.current.startPosX + deltaX),
          y: Math.max(0, dragRef.current.startPosY + deltaY),
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  const windowStyle = isMaximized
    ? { top: 0, left: 0, width: "100%", height: "calc(100% - 28px)" }
    : {
        top: position.y,
        left: position.x,
        width: size.width,
        height: size.height,
      }

  const getAppIcon = (appId: string) => {
    switch (appId) {
      case "notepad":
        return <NotepadIcon />
      case "paint":
        return <PaintIcon />
      case "browser":
        return <BrowserIcon />
      case "cmd":
        return <CmdIcon />
      case "file-explorer":
        return <FileExplorerIcon />
      case "control-panel":
        return <ControlPanelIcon />
      case "run":
        return <RunIcon />
      default:
        return <div className="w-4 h-4 bg-gray-500" /> // Generic placeholder
    }
  }

  return (
    <div
      className={`absolute win98-window pointer-events-auto ${isActive ? "z-40" : "z-30"}`}
      style={windowStyle}
      onClick={() => setActiveApp(app.id)}
    >
      {/* Title Bar */}
      <div className={`win98-titlebar ${isActive ? "" : "inactive"}`} onMouseDown={handleMouseDown}>
        <div className="flex items-center">
          <div className="w-4 h-4 mr-1 flex-shrink-0">{getAppIcon(app.appId)}</div>
          <span>{app.metadata.name}</span>
        </div>
        <div className="flex items-center">
          <button className="win98-titlebar-button">
            <span style={{ fontSize: "10px" }}>_</span>
          </button>
          <button className="win98-titlebar-button" onClick={() => setIsMaximized(!isMaximized)}>
            <span style={{ fontSize: "8px" }}>□</span>
          </button>
          <button className="win98-titlebar-button" onClick={() => closeApp(app.id)}>
            <span style={{ fontSize: "10px" }}>×</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-hidden bg-gray-300" style={{ height: "calc(100% - 18px)" }}>
        <app.component {...app.props} />
      </div>
    </div>
  )
}
