"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { useSystem } from "@/lib/system-context"
import { AppRegistry } from "@/lib/registry"
import {
  NotepadIcon,
  PaintIcon,
  BrowserIcon,
  CmdIcon,
  FileExplorerIcon,
  ControlPanelIcon,
  FileIcon, // Import FileIcon for generic files
  FolderIcon, // Import FolderIcon for folders
} from "@/components/icons/AppIcons"
import ContextMenu from "@/components/system/ContextMenu"
import { useSystemAPI } from "@/lib/api"

interface DesktopIconProps {
  app: any // Can be a registered app or a file system item
  position: { x: number; y: number }
  isSelected: boolean
  onSelect: () => void
  onDoubleClick: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
}

function DesktopIcon({ app, position, isSelected, onSelect, onDoubleClick, onDragStart, onDragEnd }: DesktopIconProps) {
  const getIcon = (appOrItem: any) => {
    if (appOrItem.path) {
      // It's a file system item
      if (appOrItem.metadata.category === "system" && appOrItem.metadata.name === "File Explorer") {
        return <FileExplorerIcon />
      }
      if (appOrItem.metadata.category === "graphics" && appOrItem.metadata.name === "Paint") {
        return <PaintIcon />
      }
      if (appOrItem.metadata.category === "productivity" && appOrItem.metadata.name === "Notepad") {
        return <NotepadIcon />
      }
      if (appOrItem.type === "folder") {
        return <FolderIcon />
      }
      // For files, try to determine icon by extension
      const fileName = appOrItem.name ?? appOrItem.metadata?.name ?? ""
      const extension = fileName.split(".").pop()?.toLowerCase()
      switch (extension) {
        case "txt":
          return <NotepadIcon />
        case "html":
        case "htm":
          return <BrowserIcon />
        case "png":
        case "jpg":
        case "jpeg":
        case "bmp":
          return <PaintIcon />
        default:
          return <FileIcon /> // Generic file icon
      }
    } else {
      // It's a registered app
      switch (appOrItem.id) {
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
        default:
          return <FileIcon /> // Fallback for unknown registered apps
      }
    }
  }

  return (
    <div
      className={`desktop-icon ${isSelected ? "selected" : ""}`}
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
      }}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="icon-image">{getIcon(app)}</div>
      <div className="icon-text">{app.metadata.name}</div>
    </div>
  )
}

export default function Desktop() {
  const { openApp } = useSystem()
  const api = useSystemAPI()
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null)
  const [iconPositions, setIconPositions] = useState<Record<string, { x: number; y: number }>>({})
  const [draggedIcon, setDraggedIcon] = useState<string | null>(null)
  const desktopRef = useRef<HTMLDivElement>(null)

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    items: { label: string; action: () => void; separator?: boolean; disabled?: boolean }[]
  } | null>(null)

  const [desktopItems, setDesktopItems] = useState<any[]>([]) // Combined registered apps and file system items

  // Function to refresh desktop icons from the file system
  const refreshDesktopItems = useCallback(async () => {
    try {
      const myDocumentsItems = await api.listDirectory("C:\\My Documents")
      const desktopFileItems = myDocumentsItems.map((item) => ({
        id: `fs-${item.name}`, // Unique ID for file system items
        name: item.name,
        appId: item.type === "folder" ? "file-explorer" : item.name.split(".").pop()?.toLowerCase() || "file", // Use file-explorer for folders, extension for files
        component: null, // Not directly rendered by WindowManager, but opened via executeFile
        metadata: {
          name: item.name,
          iconPath: "/placeholder.svg?height=32&width=32", // Placeholder, actual icon determined by getIcon
          capabilities: [],
          runnableBy: "user",
          singleInstance: false,
          showOnDesktop: true, // Treat all My Documents items as desktop items for now
          defaultWidth: 800,
          defaultHeight: 600,
          category: item.type === "folder" ? "system" : "documents",
        },
        path: `C:\\My Documents\\${item.name}`, // Store full path for file system items
        type: item.type, // Add type for icon rendering
      }))

      // Combine registered desktop apps with file system items
      const registeredDesktopApps = AppRegistry.getApps().filter((app) => app.metadata.showOnDesktop)

      // Filter out file system items that have a corresponding registered app (e.g., if Notepad is on desktop, don't show readme.txt as a separate icon unless it's explicitly a file)
      const uniqueDesktopFileItems = desktopFileItems.filter(
        (fsItem) => !registeredDesktopApps.some((app) => app.metadata.name === fsItem.metadata.name),
      )

      setDesktopItems([...registeredDesktopApps, ...uniqueDesktopFileItems])
    } catch (error) {
      api.error("Failed to load desktop items.")
      console.error("Failed to load desktop items:", error)
    }
  }, [api])

  useEffect(() => {
    refreshDesktopItems() // Initial load

    const unsubscribe = api.subscribeToFileSystemChanges((change) => {
      // Only refresh if the change is relevant to My Documents (where desktop items are stored)
      if (change.path.startsWith("C:\\My Documents") || change.path === "C:") {
        refreshDesktopItems()
      }
    })

    return () => unsubscribe()
  }, [api, refreshDesktopItems])

  // Initialize icon positions
  const getIconPosition = (appId: string, index: number) => {
    if (iconPositions[appId]) {
      return iconPositions[appId]
    }

    const iconWidth = 64
    const iconHeight = 64
    const padding = 10

    const availableHeight = window.innerHeight - 28 - padding * 2 // Subtract taskbar height and desktop padding
    const availableWidth = window.innerWidth - padding * 2

    const iconsPerRow = Math.floor(availableHeight / (iconHeight + padding))
    const row = Math.floor(index / iconsPerRow)
    const col = index % iconsPerRow

    return {
      x: padding + row * (iconWidth + padding),
      y: padding + col * (iconHeight + padding),
    }
  }

  const handleIconSelect = (appId: string) => {
    setSelectedIcon(appId)
  }

  const handleIconDoubleClick = (app: any) => {
    if (app.path) {
      // It's a file system item
      api.executeFile(app.path)
    } else {
      // It's a registered app
      openApp(app.id)
    }
  }

  const handleDragStart = (e: React.DragEvent, appId: string) => {
    setDraggedIcon(appId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragEnd = () => {
    setDraggedIcon(null)
  }

  const handleDesktopClick = (e: React.MouseEvent) => {
    if (e.target === desktopRef.current) {
      setSelectedIcon(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (draggedIcon) {
      const rect = desktopRef.current?.getBoundingClientRect()
      if (rect) {
        const newPosition = {
          x: e.clientX - rect.left - 32, // Adjust for icon center
          y: e.clientY - rect.top - 32, // Adjust for icon center
        }

        setIconPositions((prev) => ({
          ...prev,
          [draggedIcon]: newPosition,
        }))
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleNewFolder = async () => {
    const folderName = prompt("Enter new folder name:")
    if (folderName) {
      try {
        await api.createDirectory(`C:\\My Documents\\${folderName}`)
        api.success(`Folder '${folderName}' created on desktop.`)
      } catch (error: any) {
        api.error(`Failed to create folder: ${error.message}`)
      }
    }
  }

  const handleNewTextDocument = async () => {
    const fileName = prompt("Enter new text document name (e.g., mydoc.txt):")
    if (fileName) {
      try {
        await api.writeFile(`C:\\My Documents\\${fileName}`, "")
        api.success(`Text document '${fileName}' created on desktop.`)
      } catch (error: any) {
        api.error(`Failed to create text document: ${error.message}`)
      }
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: "Arrange Icons", action: () => console.log("Arrange Icons") },
        { label: "Line Up Icons", action: () => console.log("Line Up Icons") },
        { separator: true, label: "" },
        { label: "New", action: () => {}, disabled: true }, // Parent for sub-menu
        { label: "Folder", action: handleNewFolder },
        { label: "Text Document", action: handleNewTextDocument },
        { separator: true, label: "" },
        { label: "Properties", action: () => console.log("Properties") },
      ],
    })
  }

  return (
    <div
      ref={desktopRef}
      className="absolute inset-0 win98-desktop"
      onClick={handleDesktopClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onContextMenu={handleContextMenu}
    >
      {desktopItems.map((item, index) => (
        <DesktopIcon
          key={item.id}
          app={item}
          position={getIconPosition(item.id, index)}
          isSelected={selectedIcon === item.id}
          onSelect={() => handleIconSelect(item.id)}
          onDoubleClick={() => handleIconDoubleClick(item)}
          onDragStart={(e) => handleDragStart(e, item.id)}
          onDragEnd={handleDragEnd}
        />
      ))}

      {contextMenu && contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
