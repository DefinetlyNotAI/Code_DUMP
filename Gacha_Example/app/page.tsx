"use client"

import { GameProvider } from "@/contexts/game-context"
import { GameLayout } from "@/components/game-layout"
import { GachaPage } from "@/components/gacha-page"

export default function Home() {
  return (
    <GameProvider>
      <GameLayout>
        <GachaPage />
      </GameLayout>
    </GameProvider>
  )
}
