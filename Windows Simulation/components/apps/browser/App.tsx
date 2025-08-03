"use client"

import { useState, useEffect } from "react"
import { useSystemAPI } from "@/lib/api"
import FilePickerDialog from "@/components/system/FilePickerDialog"

interface BrowserAppProps {
  initialFilePath?: string
}

// Utility to escape HTML special characters
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default function BrowserApp({ initialFilePath }: BrowserAppProps) {
  const [filePath, setFilePath] = useState(initialFilePath || "C:\\My Documents\\index.html")
  const [htmlContent, setHtmlContent] = useState("")
  const [showFilePicker, setShowFilePicker] = useState(false)
  const api = useSystemAPI()

  useEffect(() => {
    if (initialFilePath) {
      loadHtmlFile(initialFilePath)
    }
  }, [initialFilePath])

  const loadHtmlFile = async (path: string) => {
    if (!path.trim()) {
      api.warn("Please enter a file path.")
      return
    }
    try {
      const content = await api.readFile(path)
      if (path.toLowerCase().endsWith(".html") || path.toLowerCase().endsWith(".htm")) {
        setHtmlContent(content)
        api.info(`Loaded HTML from ${path}`)
      } else {
        setHtmlContent(`<!-- Content of ${escapeHtml(path)} -->\n<pre>${escapeHtml(content)}</pre>`)
        api.warn("File is not an HTML file, displaying as plain text.")
      }
    } catch (error: any) {
      setHtmlContent(`<!-- Error loading ${escapeHtml(path)} -->\n<pre>Error: ${escapeHtml(error.message)}</pre>`)
      api.error(`Failed to load file: ${error.message}`)
    }
  }

  const handleFileSelect = (selectedPath: string) => {
    setFilePath(selectedPath)
    loadHtmlFile(selectedPath)
    setShowFilePicker(false)
  }

  return (
    <div className="h-full flex flex-col bg-gray-300">
      {/* Address Bar */}
      <div className="win98-panel-raised p-1 flex items-center space-x-1 text-xs">
        <label className="font-bold">File:</label>
        <input
          type="text"
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && loadHtmlFile(filePath)}
          className="win98-input flex-1"
          placeholder="C:\My Documents\index.html"
        />
        <button className="win98-button px-2 py-1" onClick={() => loadHtmlFile(filePath)}>
          Go
        </button>
        <button className="win98-button px-2 py-1" onClick={() => setShowFilePicker(true)}>
          Browse...
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-2 overflow-auto win98-panel bg-white">
        {htmlContent ? (
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        ) : (
          <div className="text-center py-12 text-gray-600">
            <p>Enter a local HTML file path (e.g., C:\My Documents\index.html) and click Go.</p>
          </div>
        )}
      </div>

      {showFilePicker && (
        <FilePickerDialog
          onSelect={handleFileSelect}
          onClose={() => setShowFilePicker(false)}
          filter={["html", "htm"]}
          title="Open HTML File"
        />
      )}
    </div>
  )
}
