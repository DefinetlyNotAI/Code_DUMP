"use client"

import type React from "react"

import { useState } from "react"
import { useSystemAPI } from "@/lib/api"

interface NotepadAppProps {
  initialFilePath?: string
}

export default function NotepadApp({ initialFilePath }: NotepadAppProps) {
  const [content, setContent] = useState("")
  const [filename, setFilename] = useState("Untitled")
  const [currentPath, setCurrentPath] = useState<string | null>(null)
  const [isModified, setIsModified] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveFilename, setSaveFilename] = useState("document.txt")
  const api = useSystemAPI()

  // React.useEffect(() => {
  //   if (initialFilePath) {
  //     loadFromFile(initialFilePath)
  //   }
  // }, [initialFilePath])

  const loadFromFile = async (path: string) => {
    try {
      const fileContent = await api.readFile(path)
      setContent(fileContent)
      setFilename(path.split("\\").pop() || "Untitled")
      setCurrentPath(path)
      setIsModified(false)
      api.info(`File opened: ${path}`)
    } catch (error: any) {
      api.error(`Failed to open file: ${error.message}`)
    }
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    setIsModified(true)
  }

  const handleSave = async () => {
    const targetPath = currentPath || `C:\\My Documents\\${filename}`
    try {
      await api.writeFile(targetPath, content)
      setFilename(targetPath.split("\\").pop() || "Untitled")
      setCurrentPath(targetPath)
      setIsModified(false)
      api.success(`File saved as ${targetPath.split("\\").pop()}`)
    } catch (error: any) {
      api.error(`Failed to save file: ${error.message}`)
    }
  }

  const handleSaveAs = () => {
    setSaveFilename(filename === "Untitled" ? "document.txt" : filename)
    setShowSaveDialog(true)
  }

  const handleSaveDialogOk = async () => {
    const targetPath = `C:\\My Documents\\${saveFilename}`
    try {
      await api.writeFile(targetPath, content)
      setFilename(saveFilename)
      setCurrentPath(targetPath)
      setIsModified(false)
      setShowSaveDialog(false)
      api.success(`File saved as ${saveFilename}`)
    } catch (error: any) {
      api.error(`Failed to save file: ${error.message}`)
    }
  }

  const handleNew = () => {
    if (isModified) {
      if (confirm("Do you want to save changes?")) {
        handleSave()
      }
    }
    setContent("")
    setFilename("Untitled")
    setCurrentPath(null)
    setIsModified(false)
  }

  return (
    <div className="h-full flex flex-col bg-gray-300">
      {/* Menu Bar */}
      <div className="win98-panel-raised p-1 flex items-center text-xs">
        <div className="win98-menu">
          <button className="win98-button px-2 py-1" onClick={handleNew}>
            &File
          </button>
        </div>
        <div className="win98-menu ml-1">
          <button className="win98-button px-2 py-1">&Edit</button>
        </div>
        <div className="win98-menu ml-1">
          <button className="win98-button px-2 py-1">&View</button>
        </div>
        <div className="win98-menu ml-1">
          <button className="win98-button px-2 py-1">&Help</button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="win98-panel-raised p-1 flex items-center space-x-1 text-xs border-t">
        <button className="win98-button px-2 py-1" onClick={handleNew}>
          New
        </button>
        <button
          className="win98-button px-2 py-1"
          onClick={() => api.openApp("file-explorer", { onFileSelect: loadFromFile, filter: ["txt"] })}
        >
          Open
        </button>
        <button className="win98-button px-2 py-1" onClick={handleSave}>
          Save
        </button>
        <button className="win98-button px-2 py-1" onClick={handleSaveAs}>
          Save As...
        </button>
        <div className="w-px h-4 bg-gray-600 mx-1"></div>
        <button className="win98-button px-2 py-1">Cut</button>
        <button className="win98-button px-2 py-1">Copy</button>
        <button className="win98-button px-2 py-1">Paste</button>
      </div>

      {/* Text Area */}
      <div className="flex-1 p-2">
        <textarea
          value={content}
          onChange={handleContentChange}
          className="w-full h-full win98-input resize-none font-mono text-xs"
          style={{ fontFamily: "Courier New, monospace" }}
          placeholder="Type your text here..."
        />
      </div>

      {/* Status Bar */}
      <div className="win98-panel px-2 py-1 text-xs flex justify-between border-t">
        <span>
          {isModified ? "Modified" : "Ready"} | {filename}
        </span>
        <span>
          Ln {content.split("\n").length}, Col 1 | {content.length} chars
        </span>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="win98-window w-80">
            <div className="win98-titlebar">
              <span>Save As</span>
              <button className="win98-titlebar-button" onClick={() => setShowSaveDialog(false)}>
                ×
              </button>
            </div>
            <div className="p-4 bg-gray-300">
              <div className="mb-3">
                <label className="block text-xs font-bold mb-1">File name:</label>
                <input
                  type="text"
                  value={saveFilename}
                  onChange={(e) => setSaveFilename(e.target.value)}
                  className="win98-input w-full"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button className="win98-button px-4 py-1" onClick={handleSaveDialogOk}>
                  Save
                </button>
                <button className="win98-button px-4 py-1" onClick={() => setShowSaveDialog(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
