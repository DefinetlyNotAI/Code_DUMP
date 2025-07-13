"use client"

import { useSystem } from "@/lib/system-context"
import Window from "./Window"

export default function WindowManager() {
  const { openApps } = useSystem()

  return (
    <div className="absolute inset-0 pointer-events-none">
      {openApps.map((app) => (
        <Window key={app.id} app={app} />
      ))}
    </div>
  )
}
