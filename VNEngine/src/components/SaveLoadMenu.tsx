"use client"

import type React from "react"
import { useEffect, useState } from "react"

interface SaveLoadMenuProps {
  onSaveAction: (slotName: string) => void
  onLoadAction: (saveData: any) => void
  onCloseAction: () => void
}

export const SaveLoadMenu = ({ onSaveAction, onLoadAction, onCloseAction }: SaveLoadMenuProps) => {
  const [saveSlots, setSaveSlots] = useState<Record<string, any>>({})
  const [activeTab, setActiveTab] = useState<"save" | "load">("save")
  const [newSaveName, setNewSaveName] = useState("")

  useEffect(() => {
    // Load save slots from a JSON file
    const loadSaveSlots = async () => {
      try {
        const response = await fetch("/saves.json")
        const data = await response.json()
        setSaveSlots(data)
      } catch (e) {
        console.error("Failed to load save slots:", e)
        setSaveSlots({})
      }
    }

    loadSaveSlots()
  }, [])

  const handleSave = async () => {
    if (!newSaveName.trim()) return

    const saveName = newSaveName.trim()
    onSaveAction(saveName)

    const updatedSlots = {
      ...saveSlots,
      [saveName]: { timestamp: new Date().toISOString() },
    }

    setSaveSlots(updatedSlots)
    setNewSaveName("")

    // Save to JSON file
    try {
      await fetch("/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSlots),
      })
    } catch (e) {
      console.error("Failed to save data:", e)
    }
  }

  const handleLoad = (slotName: string) => {
    const saveData = saveSlots[slotName]
    if (saveData) {
      onLoadAction(saveData)
      onCloseAction()
    }
  }

  const handleDelete = async (slotName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Are you sure you want to delete save "${slotName}"?`)) {
      const updatedSlots = { ...saveSlots }
      delete updatedSlots[slotName]
      setSaveSlots(updatedSlots)

      // Save updated slots to JSON file
      try {
        await fetch("/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedSlots),
        })
      } catch (e) {
        console.error("Failed to delete save:", e)
      }
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString()
    } catch (e) {
      return "Unknown date"
    }
  }

  return (
    <div className="save-load-menu">
      <div className="save-load-header">
        <div className="tabs">
          <button
            className={`tab ${activeTab === "save" ? "active" : ""}`}
            onClick={() => setActiveTab("save")}
          >
            Save
          </button>
          <button
            className={`tab ${activeTab === "load" ? "active" : ""}`}
            onClick={() => setActiveTab("load")}
          >
            Load
          </button>
        </div>
        <button className="close-button" onClick={onCloseAction}>
          ×
        </button>
      </div>

      <div className="save-load-content">
        {activeTab === "save" && (
          <div className="save-tab">
            <div className="new-save">
              <input
                type="text"
                placeholder="Enter save name..."
                value={newSaveName}
                onChange={(e) => setNewSaveName(e.target.value)}
              />
              <button onClick={handleSave}>Save</button>
            </div>

            <div className="save-slots">
              {Object.keys(saveSlots).length > 0 ? (
                Object.entries(saveSlots).map(([name, data]) => (
                  <div key={name} className="save-slot">
                    <div className="save-info">
                      <div className="save-name">{name}</div>
                      <div className="save-date">{formatDate(data.timestamp)}</div>
                    </div>
                    <button className="delete-save" onClick={(e) => handleDelete(name, e)}>
                      ×
                    </button>
                  </div>
                ))
              ) : (
                <div className="no-saves">No saves found</div>
              )}
            </div>
          </div>
        )}

        {activeTab === "load" && (
          <div className="load-tab">
            <div className="save-slots">
              {Object.keys(saveSlots).length > 0 ? (
                Object.entries(saveSlots).map(([name, data]) => (
                  <div key={name} className="save-slot" onClick={() => handleLoad(name)}>
                    <div className="save-info">
                      <div className="save-name">{name}</div>
                      <div className="save-date">{formatDate(data.timestamp)}</div>
                    </div>
                    <button className="delete-save" onClick={(e) => handleDelete(name, e)}>
                      ×
                    </button>
                  </div>
                ))
              ) : (
                <div className="no-saves">No saves found</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
