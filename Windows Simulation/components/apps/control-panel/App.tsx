"use client"

import type React from "react"

import { useState } from "react"
import { useSystemAPI } from "@/lib/api"
import { ControlPanelIcon, FileIcon } from "@/components/icons/AppIcons"

interface ControlPanelItem {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: string
}

export default function ControlPanelApp() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const api = useSystemAPI()

  const controlPanelItems: ControlPanelItem[] = [
    {
      id: "display",
      name: "Display",
      description: "Change display settings, desktop background, screen saver",
      icon: <FileIcon />, // Using generic FileIcon for now
      category: "appearance",
    },
    {
      id: "sound",
      name: "Sounds and Multimedia",
      description: "Change sound settings for system events",
      icon: <FileIcon />,
      category: "hardware",
    },
    {
      id: "network",
      name: "Network",
      description: "Configure network connections",
      icon: <FileIcon />,
      category: "network",
    },
    {
      id: "system",
      name: "System",
      description: "View system information, hardware, and performance",
      icon: <FileIcon />,
      category: "system",
    },
    {
      id: "add-remove-programs",
      name: "Add/Remove Programs",
      description: "Install or remove programs from your computer",
      icon: <FileIcon />,
      category: "software",
    },
    {
      id: "date-time",
      name: "Date/Time",
      description: "Set the system date and time",
      icon: <FileIcon />,
      category: "system",
    },
  ]

  const categories = [
    { id: "all", name: "All Control Panel Items" },
    { id: "appearance", name: "Appearance and Themes" },
    { id: "hardware", name: "Printers and Other Hardware" },
    { id: "network", name: "Network and Internet Connections" },
    { id: "software", name: "Add or Remove Programs" },
    { id: "system", name: "Performance and Maintenance" },
  ]

  const filteredItems =
    selectedCategory === "all"
      ? controlPanelItems
      : controlPanelItems.filter((item) => item.category === selectedCategory)

  const handleItemClick = (item: ControlPanelItem) => {
    api.info(`Opening "${item.name}" settings (simulated)`)
  }

  return (
    <div className="h-full bg-gray-300 flex flex-col">
      {/* Toolbar */}
      <div className="win98-panel-raised p-1 flex items-center space-x-1 text-xs">
        <button className="win98-button px-2 py-1">File</button>
        <button className="win98-button px-2 py-1">Edit</button>
        <button className="win98-button px-2 py-1">View</button>
        <button className="win98-button px-2 py-1">Favorites</button>
        <button className="win98-button px-2 py-1">Help</button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="win98-panel-raised w-64 p-2 flex flex-col border-r">
          <h3 className="font-bold mb-2">Control Panel</h3>
          <div className="space-y-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full text-left px-2 py-1 text-xs ${
                  selectedCategory === category.id ? "bg-blue-500 text-white" : "hover:bg-gray-200"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Item List */}
        <div className="flex-1 p-4 overflow-auto">
          <h2 className="text-lg font-bold mb-4 flex items-center space-x-2">
            <ControlPanelIcon />{" "}
            <span>{categories.find((c) => c.id === selectedCategory)?.name || "Control Panel"}</span>
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="win98-panel-raised p-2 flex items-center space-x-2 cursor-pointer hover:bg-gray-200"
                onClick={() => handleItemClick(item)}
              >
                <div className="w-8 h-8 flex-shrink-0">{item.icon}</div>
                <div>
                  <h3 className="font-bold">{item.name}</h3>
                  <p className="text-xs text-gray-700">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-gray-600">No items found in this category.</div>
          )}
        </div>
      </div>
    </div>
  )
}
