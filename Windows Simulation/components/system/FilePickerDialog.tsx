"use client"

import { useState, useEffect, useCallback } from "react"
import { useSystemAPI } from "@/lib/api"
import { FolderIcon, FileIcon, HtmlFileIcon, ImageFileIcon } from "@/components/icons/AppIcons"
import type { FileSystemItem } from "@/lib/types"

interface FilePickerDialogProps {
  onSelect: (path: string) => void
  onClose: () => void
  filter?: string[] // Array of extensions to filter by (e.g., ["html", "txt"])
  title?: string
}

export default function FilePickerDialog({ onSelect, onClose, filter, title = "Open" }: FilePickerDialogProps) {
  const [currentPath, setCurrentPath] = useState("C:\\My Documents")
  const [items, setItems] = useState<FileSystemItem[]>([])
  const [selectedItem, setSelectedItem] = useState<FileSystemItem | null>(null)
  const api = useSystemAPI()

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
      setSelectedItem(item)
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

  const handleSelectClick = () => {
    if (selectedItem && selectedItem.type === "file") {
      onSelect(selectedItem.path)
    } else {
      api.warn("Please select a file.")
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="win98-window w-[600px] h-[400px] flex flex-col">
        <div className="win98-titlebar">
          <span>{title}</span>
          <button className="win98-titlebar-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="flex-1 flex flex-col p-2 bg-gray-300">
          {/* Toolbar */}
          <div className="win98-panel-raised p-1 flex items-center space-x-1 text-xs mb-2">
            <button className="win98-button px-2 py-1" onClick={navigateUp}>
              Up
            </button>
            <button className="win98-button px-2 py-1" onClick={() => setCurrentPath("C:\\")}>
              Home
            </button>
            <div className="flex-1 mx-2">
              <input type="text" value={currentPath} readOnly className="win98-input w-full" />
            </div>
          </div>

          {/* File List */}
          <div className="flex-1 overflow-auto win98-panel bg-white p-2">
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
                    onClick={() => setSelectedItem(item)}
                    onDoubleClick={() => navigateToItem(item)}
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
            {items.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-gray-600">
                <p>This folder is empty.</p>
              </div>
            )}
          </div>

          {/* Selected File Info */}
          <div className="mt-2">
            <label className="block text-xs font-bold mb-1">File name:</label>
            <input type="text" value={selectedItem?.name || ""} readOnly className="win98-input w-full" />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2 mt-4">
            <button className="win98-button px-4 py-1" onClick={handleSelectClick}>
              Open
            </button>
            <button className="win98-button px-4 py-1" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
