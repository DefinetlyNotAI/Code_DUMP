"use client"

import { useSystem } from "@/lib/system-context"
import { AppRegistry } from "@/lib/registry"
import {
  NotepadIcon,
  PaintIcon,
  BrowserIcon,
  CmdIcon,
  FileExplorerIcon,
  ControlPanelIcon,
  RunIcon,
} from "@/components/icons/AppIcons"

interface StartMenuProps {
  onClose: () => void
}

export default function StartMenu({ onClose }: StartMenuProps) {
  const { openApp } = useSystem()

  const handleAppClick = (appId: string) => {
    openApp(appId)
    onClose()
  }

  const getAppIcon = (appId: string) => {
    switch (appId) {
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
      case "run":
        return <RunIcon />
      default:
        return <div className="w-4 h-4 bg-gray-500" /> // Generic placeholder
    }
  }

  const allApps = AppRegistry.getApps().sort((a, b) => a.metadata.name.localeCompare(b.metadata.name))

  return (
    <div
      className="absolute bottom-7 left-0 win98-menu w-64 z-50"
      style={{ transform: "translateY(100%)", animation: "slideUp 0.1s forwards" }}
    >
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
      <div className="flex">
        <div className="w-6 bg-gray-800 text-white flex flex-col items-center justify-end py-2 text-xs font-bold writing-mode-vertical-lr rotate-180">
          <span style={{ writingMode: "vertical-lr", textOrientation: "upright" }}>Windows 98</span>
        </div>
        <div className="flex-1 py-1">
          <div className="win98-menu-item" onClick={() => handleAppClick("run")}>
            <div className="w-4 h-4 mr-2">{getAppIcon("run")}</div>
            Run...
          </div>
          <div className="win98-menu-separator" />
          <div className="font-bold px-2 py-1">Programs</div>
          {allApps.map((app) => (
            <div key={app.id} className="win98-menu-item" onClick={() => handleAppClick(app.id)}>
              <div className="w-4 h-4 mr-2">{getAppIcon(app.id)}</div>
              {app.metadata.name}
            </div>
          ))}
          <div className="win98-menu-separator" />
          <div className="win98-menu-item" onClick={() => console.log("Shut Down")}>
            Shut Down...
          </div>
        </div>
      </div>
    </div>
  )
}
