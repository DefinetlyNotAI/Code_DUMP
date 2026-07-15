"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSystemAPI } from "@/lib/api"
import { FolderIcon, FileIcon, HtmlFileIcon, ImageFileIcon } from "@/components/icons/AppIcons"
import ContextMenu from "@/components/system/ContextMenu"
import type { FileSystemItem } from "@/lib/types"

interface FileExplorerAppProps {
  onFileSelect?: (path: string) => void // Callback for when a file is selected (e.g., from a file picker dialog)
  filter?: string[] // Array of extensions to filter by (e.g., ["html", "txt"])
}

export default function FileExplorerApp({ onFileSelect, filter }: FileExplorerAppProps) {
  const [currentPath, setCurrentPath] = useState("C:\\My Documents")
  const [items, setItems] = useState<FileSystemItem[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [selectedItem, setSelectedItem] = useState<FileSystemItem | null>(null)
  const [draggedItem, setDraggedItem] = useState<FileSystemItem | null>(null)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [newFileName, setNewFileName] = useState("")
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    items: { label: string; action: () => void; separator?: boolean; disabled?: boolean }[]
  } | null>(null)

  const api = useSystemAPI()
  const containerRef = useRef<HTMLDivElement>(null)

  const loadDirectory = useCallback(
    async (path: string) => {
      try {
        const loadedItems = await api.listDirectory(path)
        const filteredItems = filter
          ? loadedItems.filter((item) => {
              if (item.type === "folder") return true
              const ext = item.name.split(".").pop()?.toLowerCase()
              return ext && filter.includes(ext)
            })
          : loadedItems

        setItems(
          filteredItems.map((item) => ({
            ...item,
            path: `${path}\\${item.name}`,
          })),
        )
        setSelectedItem(null)
      } catch (error: any) {
        api.error(`Failed to load directory: ${error.message}`)
        setItems([])
      }
    },
    [api, filter],
  )

  useEffect(() => {
    loadDirectory(currentPath)

    const unsubscribe = api.subscribeToFileSystemChanges((change) => {
      // Only reload if the change is within the current directory or its parent
      const changedDir = change.path.substring(0, change.path.lastIndexOf("\\")) || "C:"
      if (change.path.startsWith(currentPath) || currentPath.startsWith(changedDir)) {
        loadDirectory(currentPath)
      }
    })

    return () => unsubscribe()
  }, [currentPath, loadDirectory, api])

  const navigateUp = () => {
    const pathParts = currentPath.split("\\")
    if (pathParts.length > 1) {
      const newPath = pathParts.slice(0, -1).join("\\") || "C:\\"
      setCurrentPath(newPath)
    }
  }

  const navigateToItem = (item: FileSystemItem) => {
    if (item.type === "folder") {
      setCurrentPath(item.path)
    } else {
      if (onFileSelect) {
        onFileSelect(item.path)
      } else {
        api.executeFile(item.path)
      }
    }
  }

  const handleNewFolder = async () => {
    const folderName = prompt("Enter new folder name:")
    if (folderName) {
      try {
        await api.createDirectory(`${currentPath}\\${folderName}`)
        api.success(`Folder '${folderName}' created.`)
      } catch (error: any) {
        api.error(`Failed to create folder: ${error.message}`)
      }
    }
  }

  const handleNewTextDocument = async () => {
    const fileName = prompt("Enter new text document name (e.g., mydoc.txt):")
    if (fileName) {
      try {
        await api.writeFile(`${currentPath}\\${fileName}`, "")
        api.success(`Text document '${fileName}' created.`)
      } catch (error: any) {
        api.error(`Failed to create text document: ${error.message}`)
      }
    }
  }

  const handleDeleteItem = async (item: FileSystemItem) => {
    if (confirm(`Are you sure you want to delete '${item.name}'?`)) {
      try {
        await api.deleteItem(item.path)
        api.success(`'${item.name}' deleted.`)
      } catch (error: any) {
        api.error(`Failed to delete item: ${error.message}`)
      }
    }
  }

  const handleRenameItem = (item: FileSystemItem) => {
    setSelectedItem(item)
    setNewFileName(item.name)
    setShowRenameDialog(true)
  }

  const handleRenameDialogOk = async () => {
    if (!selectedItem || !newFileName.trim()) return

    const oldPath = selectedItem.path
    const newPath = `${currentPath}\\${newFileName}`

    try {
      await api.renameItem(oldPath, newFileName) // Pass new name, not full path
      api.success(`'${selectedItem.name}' renamed to '${newFileName}'.`)
      setShowRenameDialog(false)
      setSelectedItem(null)
    } catch (error: any) {
      api.error(`Failed to rename item: ${error.message}`)
    }
  }

  const handlePaste = async () => {
    const clipboardContent = api.readClipboard()
    if (!clipboardContent || !clipboardContent.data) {
      api.warn("Clipboard is empty.")
      return
    }

    const sourcePath = clipboardContent.data
    const itemName = sourcePath.split("\\").pop()
    if (!itemName) {
      api.error("Invalid item in clipboard.")
      return
    }
    const destinationPath = `${currentPath}\\${itemName}`

    try {
      if (clipboardContent.isCut) {
        await api.moveItem(sourcePath, destinationPath)
        api.success(`Moved '${itemName}' to '${currentPath}'.`)
      } else {
        await api.copyItem(sourcePath, destinationPath)
        api.success(`Copied '${itemName}' to '${currentPath}'.`)
      }
      api.writeClipboard(null) // Clear clipboard after paste
    } catch (error: any) {
      api.error(`Failed to paste item: ${error.message}`)
    }
  }

  const getFileIcon = (item: FileSystemItem) => {
    if (item.type === "folder") {
      return <FolderIcon />
    }
    const extension = item.name.split(".").pop()?.toLowerCase()
    if (extension === "html" || extension === "htm") {
      return <HtmlFileIcon />
    }
    if (["png", "jpg", "jpeg", "bmp"].includes(extension || "")) {
      return <ImageFileIcon />
    }
    return <FileIcon />
  }

  const handleItemClick = (item: FileSystemItem) => {
    setSelectedItem(item)
  }

  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current) {
      setSelectedItem(null)
    }
  }

  const handleDragStart = (e: React.DragEvent, item: FileSystemItem) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDrop = async (e: React.DragEvent, targetItem?: FileSystemItem) => {
    e.preventDefault()
    if (!draggedItem) return

    const sourcePath = draggedItem.path
    let destinationPath = currentPath

    if (targetItem && targetItem.type === "folder") {
      destinationPath = targetItem.path
    }

    const newPath = `${destinationPath}\\${draggedItem.name}`

    if (sourcePath === newPath) {
      setDraggedItem(null)
      return // Dropped on itself or same location
    }

    try {
      await api.moveItem(sourcePath, newPath) // moveItem handles renaming across directories
      api.success(`Moved '${draggedItem.name}' to '${destinationPath}'`)
    } catch (error: any) {
      api.error(`Failed to move item: ${error.message}`)
    } finally {
      setDraggedItem(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleContextMenu = (e: React.MouseEvent, item?: FileSystemItem) => {
    e.preventDefault()
    setSelectedItem(item || null) // Select the item if right-clicked on one

    const clipboardContent = api.readClipboard()
    const canPaste = clipboardContent !== null

    const commonItems = [
      {
        label: "Open",
        action: () => item && api.executeFile(item.path),
        disabled: !item || item.type === "folder" || onFileSelect !== undefined,
      },
      {
        label: "Select",
        action: () => item && onFileSelect && onFileSelect(item.path),
        disabled: !item || item.type === "folder" || onFileSelect === undefined,
      },
      { label: "Explore", action: () => item && navigateToItem(item), disabled: !item || item.type === "file" },
      { separator: true, label: "" },
      {
        label: "Cut",
        action: () => item && api.writeClipboard({ type: item.type, data: item.path, isCut: true }),
        disabled: !item,
      },
      {
        label: "Copy",
        action: () => item && api.writeClipboard({ type: item.type, data: item.path, isCut: false }),
        disabled: !item,
      },
      { label: "Paste", action: handlePaste, disabled: !canPaste },
      { separator: true, label: "" },
      { label: "Delete", action: () => item && handleDeleteItem(item), disabled: !item },
      { label: "Rename", action: () => item && handleRenameItem(item), disabled: !item },
      { separator: true, label: "" },
      { label: "Properties", action: () => console.log("Properties"), disabled: !item },
    ]

    const backgroundItems = [
      { label: "New", action: () => {}, disabled: true },
      { label: "Folder", action: handleNewFolder },
      { label: "Text Document", action: handleNewTextDocument },
      { separator: true, label: "" },
      { label: "Paste", action: handlePaste, disabled: !canPaste },
    ]

    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      items: item ? commonItems : backgroundItems,
    })
  }

  return (
    <div className="h-full bg-gray-300 flex flex-col">
      {/* Toolbar */}
      <div className="win98-panel-raised p-1 flex items-center space-x-1 text-xs">
        <button className="win98-button px-2 py-1" onClick={navigateUp}>
          Up
        </button>
        <button className="win98-button px-2 py-1" onClick={() => setCurrentPath("C:\\")}>
          Home
        </button>
        <div className="flex-1 mx-2">
          <input type="text" value={currentPath} readOnly className="win98-input w-full" />
        </div>
        <button className="win98-button px-2 py-1" onClick={() => setViewMode("list")}>
          List
        </button>
        <button className="win98-button px-2 py-1" onClick={() => setViewMode("grid")}>
          Icons
        </button>
      </div>

      {/* Content Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto win98-panel bg-white p-2"
        onClick={handleContainerClick}
        onDrop={(e) => handleDrop(e)}
        onDragOver={handleDragOver}
        onContextMenu={(e) => handleContextMenu(e)}
      >
        {viewMode === "list" ? (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-400 text-left">
                <th className="pb-1">Name</th>
                <th className="pb-1">Size</th>
                <th className="pb-1">Type</th>
                <th className="pb-1">Modified</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.path}
                  className={`hover:bg-blue-500 hover:text-white cursor-pointer ${
                    selectedItem?.path === item.path ? "bg-blue-500 text-white" : ""
                  }`}
                  onClick={() => handleItemClick(item)}
                  onDoubleClick={() => navigateToItem(item)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDrop={(e) => handleDrop(e, item)}
                  onDragOver={handleDragOver}
                  onContextMenu={(e) => handleContextMenu(e, item)}
                >
                  <td className="py-1 flex items-center space-x-1">
                    <div className="w-4 h-4 flex-shrink-0">{getFileIcon(item)}</div>
                    <span>{item.name}</span>
                  </td>
                  <td className="py-1">{item.type === "file" ? `${item.size || 0} bytes` : ""}</td>
                  <td className="py-1">
                    {item.type === "file" ? item.name.split(".").pop()?.toUpperCase() : "File Folder"}
                  </td>
                  <td className="py-1">
                    {item.modified.toLocaleDateString()} {item.modified.toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="grid grid-cols-auto-fill-64 gap-2">
            {items.map((item) => (
              <div
                key={item.path}
                className={`desktop-icon w-16 h-16 ${selectedItem?.path === item.path ? "selected" : ""}`}
                onClick={() => handleItemClick(item)}
                onDoubleClick={() => navigateToItem(item)}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onDrop={(e) => handleDrop(e, item)}
                onDragOver={handleDragOver}
                onContextMenu={(e) => handleContextMenu(e, item)}
              >
                <div className="icon-image">{getFileIcon(item)}</div>
                <div className="icon-text text-black">{item.name}</div>
              </div>
            ))}
          </div>
        )}

        {items.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-gray-600">
            <p>This folder is empty.</p>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="win98-panel px-2 py-1 text-xs flex justify-between border-t">
        <span>{selectedItem ? `1 object selected` : `${items.length} objects`}</span>
        <span>{currentPath}</span>
      </div>

      {/* Rename Dialog */}
      {showRenameDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="win98-window w-80">
            <div className="win98-titlebar">
              <span>Rename</span>
              <button className="win98-titlebar-button" onClick={() => setShowRenameDialog(false)}>
                ×
              </button>
            </div>
            <div className="p-4 bg-gray-300">
              <div className="mb-3">
                <label className="block text-xs font-bold mb-1">New name for '{selectedItem?.name}':</label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="win98-input w-full"
                  autoFocus
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button className="win98-button px-4 py-1" onClick={handleRenameDialogOk}>
                  OK
                </button>
                <button className="win98-button px-4 py-1" onClick={() => setShowRenameDialog(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
