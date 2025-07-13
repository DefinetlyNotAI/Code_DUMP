"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { useSystemAPI } from "@/lib/api"

type Tool = "brush" | "eraser" | "rectangle" | "circle" | "line"

export default function PaintApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState<Tool>("brush")
  const [color, setColor] = useState("#000000")
  const [brushSize, setBrushSize] = useState(5)
  const [pixelMode, setPixelMode] = useState(false)
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [canvasHistory, setCanvasHistory] = useState<string[]>([]) // Stores canvas states as data URLs
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveFilename, setSaveFilename] = useState("my_drawing.png")
  const [showLoadDialog, setShowLoadDialog] = useState(false)

  const api = useSystemAPI()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Initialize canvas
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    saveCanvasState()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.imageSmoothingEnabled = !pixelMode
  }, [pixelMode])

  const saveCanvasState = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataURL = canvas.toDataURL()
    setCanvasHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1)
      return [...newHistory, dataURL]
    })
    setHistoryIndex((prev) => prev + 1)
  }

  const restoreCanvasState = (index: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    if (canvasHistory[index]) {
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
      }
      img.src = canvasHistory[index]
    }
  }

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    let x = e.clientX - rect.left
    let y = e.clientY - rect.top

    if (pixelMode) {
      x = Math.floor(x / brushSize) * brushSize
      y = Math.floor(y / brushSize) * brushSize
    }
    return { x, y }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const { x, y } = getCanvasCoordinates(e)
    setStartPoint({ x, y })

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { x, y } = getCanvasCoordinates(e)

    ctx.lineWidth = brushSize
    ctx.lineCap = "round"
    ctx.strokeStyle = color
    ctx.fillStyle = color // For filled shapes if implemented later

    if (tool === "brush" || tool === "eraser") {
      ctx.globalCompositeOperation = tool === "brush" ? "source-over" : "destination-out"
      if (pixelMode) {
        ctx.fillRect(x, y, brushSize, brushSize)
      } else {
        ctx.lineTo(x, y)
        ctx.stroke()
      }
    } else {
      // For shapes, draw a preview
      restoreCanvasState(historyIndex) // Restore previous state
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = brushSize

      if (tool === "rectangle") {
        ctx.strokeRect(startPoint.x, startPoint.y, x - startPoint.x, y - startPoint.y)
      } else if (tool === "circle") {
        const radius = Math.sqrt(Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2))
        ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI)
        ctx.stroke()
      } else if (tool === "line") {
        ctx.moveTo(startPoint.x, startPoint.y)
        ctx.lineTo(x, y)
        ctx.stroke()
      }
    }
  }

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return
    setIsDrawing(false)

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { x, y } = getCanvasCoordinates(e)

    // Draw final shape
    if (tool !== "brush" && tool !== "eraser") {
      restoreCanvasState(historyIndex) // Restore previous state
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = brushSize

      if (tool === "rectangle") {
        ctx.strokeRect(startPoint.x, startPoint.y, x - startPoint.x, y - startPoint.y)
      } else if (tool === "circle") {
        const radius = Math.sqrt(Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2))
        ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI)
        ctx.stroke()
      } else if (tool === "line") {
        ctx.moveTo(startPoint.x, startPoint.y)
        ctx.lineTo(x, y)
        ctx.stroke()
      }
    }
    ctx.globalCompositeOperation = "source-over" // Reset to default
    saveCanvasState()
    setStartPoint(null)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    saveCanvasState()
    api.info("Canvas cleared")
  }

  const handleSaveDialogOk = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      const dataURL = canvas.toDataURL("image/png")
      await api.writeFile(`C:\\My Documents\\${saveFilename}`, dataURL)
      api.success(`Drawing saved as ${saveFilename}`)
      setShowSaveDialog(false)
    } catch (error: any) {
      api.error(`Failed to save drawing: ${error.message}`)
    }
  }

  const handleLoadFromPC = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const content = event.target?.result as string
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      try {
        const img = new Image()
        img.crossOrigin = "anonymous" // Required for loading images from data URLs to avoid CORS issues on canvas
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          saveCanvasState()
          api.info("Drawing loaded successfully from PC")
          setShowLoadDialog(false)
        }
        img.onerror = () => {
          api.error("Failed to load image from PC. Invalid image file.")
        }
        img.src = content
      } catch (error: any) {
        api.error(`Failed to load drawing from PC: ${error.message}`)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleLoadFromOS = async (filePath: string) => {
    try {
      const content = await api.readFile(filePath)
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const img = new Image()
      img.crossOrigin = "anonymous" // Required for loading images from data URLs to avoid CORS issues on canvas
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        saveCanvasState()
        api.info(`Drawing loaded successfully from OS: ${filePath}`)
        setShowLoadDialog(false)
      }
      img.onerror = () => {
        api.error("Failed to load image from OS. Invalid image data.")
      }
      img.src = content
    } catch (error: any) {
      api.error(`Failed to load drawing from OS: ${error.message}`)
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-300">
      {/* Toolbar */}
      <div className="win98-panel-raised p-1 flex items-center space-x-1 text-xs">
        <button className={`win98-button ${tool === "brush" ? "pressed" : ""}`} onClick={() => setTool("brush")}>
          Brush
        </button>
        <button className={`win98-button ${tool === "eraser" ? "pressed" : ""}`} onClick={() => setTool("eraser")}>
          Eraser
        </button>
        <div className="w-px h-4 bg-gray-600 mx-1"></div>
        <button className={`win98-button ${tool === "line" ? "pressed" : ""}`} onClick={() => setTool("line")}>
          Line
        </button>
        <button
          className={`win98-button ${tool === "rectangle" ? "pressed" : ""}`}
          onClick={() => setTool("rectangle")}
        >
          Rect
        </button>
        <button className={`win98-button ${tool === "circle" ? "pressed" : ""}`} onClick={() => setTool("circle")}>
          Circle
        </button>
        <div className="w-px h-4 bg-gray-600 mx-1"></div>

        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-6 h-6 border border-gray-600"
          style={{ background: color }}
        />

        <input
          type="range"
          min="1"
          max="20"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="w-20"
        />
        <span className="text-xs text-gray-700">{brushSize}px</span>

        <div className="w-px h-4 bg-gray-600 mx-1"></div>
        <button className={`win98-button ${pixelMode ? "pressed" : ""}`} onClick={() => setPixelMode(!pixelMode)}>
          Pixel Mode
        </button>

        <div className="flex-1" />

        <button className="win98-button px-2 py-1" onClick={() => setShowSaveDialog(true)}>
          Save
        </button>
        <button className="win98-button px-2 py-1" onClick={() => setShowLoadDialog(true)}>
          Load
        </button>
        <button className="win98-button px-2 py-1" onClick={clearCanvas}>
          Clear
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 p-2 overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="win98-panel bg-white cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="win98-window w-80">
            <div className="win98-titlebar">
              <span>Save Drawing</span>
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

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="win98-window w-96">
            <div className="win98-titlebar">
              <span>Load Drawing</span>
              <button className="win98-titlebar-button" onClick={() => setShowLoadDialog(false)}>
                ×
              </button>
            </div>
            <div className="p-4 bg-gray-300">
              <div className="mb-3">
                <label className="block text-xs font-bold mb-1">Load from:</label>
                <div className="flex space-x-2">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/bmp"
                    onChange={handleLoadFromPC}
                    className="hidden"
                    id="paint-upload-input"
                  />
                  <label htmlFor="paint-upload-input" className="win98-button px-4 py-1 cursor-pointer">
                    Load from PC
                  </label>
                  <button
                    className="win98-button px-4 py-1"
                    onClick={() =>
                      api.openApp("file-explorer", {
                        onFileSelect: handleLoadFromOS,
                        filter: ["png", "jpg", "jpeg", "bmp"],
                      })
                    }
                  >
                    Load from OS
                  </button>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button className="win98-button px-4 py-1" onClick={() => setShowLoadDialog(false)}>
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
