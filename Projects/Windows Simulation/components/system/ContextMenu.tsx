"use client"

import React from "react"

interface ContextMenuItem {
  label: string
  action: () => void
  separator?: boolean
  disabled?: boolean
}

interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click was outside the context menu
      const target = event.target as HTMLElement
      if (target && !target.closest(".win98-menu")) {
        onClose()
      }
    }
    window.addEventListener("mousedown", handleClickOutside)
    return () => window.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  return (
    <div
      className="win98-menu absolute z-50"
      style={{ left: x, top: y }}
      onContextMenu={(e) => e.preventDefault()} // Prevent nested context menus
    >
      {items.map((item, index) =>
        item.separator ? (
          <div key={`sep-${index}`} className="win98-menu-separator" />
        ) : (
          <button
            key={index}
            className="win98-menu-item w-full text-left"
            onClick={() => {
              if (!item.disabled) {
                item.action()
                onClose()
              }
            }}
            disabled={item.disabled}
          >
            {item.label}
          </button>
        ),
      )}
    </div>
  )
}
