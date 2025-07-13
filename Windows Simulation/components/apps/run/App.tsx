"use client"

import { useState } from "react"
import { useSystemAPI } from "@/lib/api"
import { AppRegistry } from "@/lib/registry"
import FilePickerDialog from "@/components/system/FilePickerDialog"

export default function RunApp() {
  const [command, setCommand] = useState("")
  const [recentCommands] = useState(["notepad", "paint", "cmd", "control-panel", "file-explorer"])
  const [showFilePicker, setShowFilePicker] = useState(false)
  const api = useSystemAPI()

  const executeCommand = () => {
    if (!command.trim()) return

    // Check if it's an app name
    const app = AppRegistry.getApp(command.toLowerCase())
    if (app) {
      api.openApp(command.toLowerCase())
      api.closeApp("run") // Close the run dialog
      return
    }

    // Check if it's a file path
    if (command.includes("\\") || command.includes("/") || command.includes(".")) {
      api.executeFile(command)
      api.closeApp("run")
      return
    }

    // Check for system commands
    switch (command.toLowerCase()) {
      case "shutdown":
        api.info("Windows is shutting down...")
        api.closeApp("run")
        break
      case "restart":
        api.info("Windows is restarting...")
        api.closeApp("run")
        break
      case "logoff":
        api.info("User logoff initiated (simulated)")
        api.closeApp("run")
        break
      default:
        api.error(`'${command}' is not recognized as an internal or external command.`)
    }
  }

  const handleFileSelect = (filePath: string) => {
    setCommand(filePath)
    setShowFilePicker(false)
  }

  return (
    <div className="w-96 win98-window">
      <div className="win98-titlebar">
        <span>Run</span>
        <button className="win98-titlebar-button" onClick={() => api.closeApp("run")}>
          ×
        </button>
      </div>

      <div className="p-4 space-y-4 bg-gray-300 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 border-2 border-gray-600 flex items-center justify-center">
            <div className="w-4 h-4 bg-yellow-400"></div>
          </div>
          <div>
            <div className="font-bold mb-1">
              Type the name of a program, folder, document, or Internet resource, and Windows will open it for you.
            </div>
          </div>
        </div>

        <div>
          <label className="block font-bold mb-1">Open:</label>
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && executeCommand()}
            placeholder="Enter command or file path..."
            className="win98-input w-full"
            autoFocus
          />
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <button className="win98-button px-4 py-1" onClick={executeCommand}>
            OK
          </button>
          <button className="win98-button px-4 py-1" onClick={() => api.closeApp("run")}>
            Cancel
          </button>
          <button className="win98-button px-4 py-1" onClick={() => setShowFilePicker(true)}>
            Browse...
          </button>
        </div>
      </div>

      {showFilePicker && (
        <FilePickerDialog onSelect={handleFileSelect} onClose={() => setShowFilePicker(false)} title="Browse" />
      )}
    </div>
  )
}
