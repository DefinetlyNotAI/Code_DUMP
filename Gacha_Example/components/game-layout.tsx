"use client"

import type React from "react"

import { useState } from "react"
import { useGame } from "@/contexts/game-context"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Coins, Gem, Zap, Plus, Package, Users, Sword, Shield } from "lucide-react"
import { BackpackPage } from "@/components/backpack-page"
import { CharacterPage } from "@/components/character-page"
import { WeaponPage } from "@/components/weapon-page"
import { ArtifactPage } from "@/components/artifact-page"

interface GameLayoutProps {
  children: React.ReactNode
}

export function GameLayout({ children }: GameLayoutProps) {
  const { gameData, devMode, setDevMode, addCurrency } = useGame()
  const [currentPage, setCurrentPage] = useState<"gacha" | "backpack" | "characters" | "weapons" | "artifacts">("gacha")

  const handleAddCurrency = (type: "coins" | "gems" | "orbs", amount: number) => {
    if (devMode) {
      addCurrency(type, amount)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Gacha RPG</h1>

            {/* Currency Display */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-yellow-400">
                <Coins className="w-5 h-5" />
                <span className="font-semibold">{gameData.currency.coins.toLocaleString()}</span>
                {devMode && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-6 h-6 p-0 text-yellow-400 hover:bg-yellow-400/20"
                    onClick={() => handleAddCurrency("coins", 10000)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2 text-blue-400">
                <Gem className="w-5 h-5" />
                <span className="font-semibold">{gameData.currency.gems.toLocaleString()}</span>
                {devMode && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-6 h-6 p-0 text-blue-400 hover:bg-blue-400/20"
                    onClick={() => handleAddCurrency("gems", 1000)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2 text-purple-400">
                <Zap className="w-5 h-5" />
                <span className="font-semibold">{gameData.currency.orbs}</span>
                {devMode && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-6 h-6 p-0 text-purple-400 hover:bg-purple-400/20"
                    onClick={() => handleAddCurrency("orbs", 10)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Dev Mode Toggle */}
            <div className="flex items-center gap-2">
              <Label htmlFor="dev-mode" className="text-white text-sm">
                Dev Mode
              </Label>
              <Switch id="dev-mode" checked={devMode} onCheckedChange={setDevMode} />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            <Button
              variant={currentPage === "gacha" ? "default" : "ghost"}
              className={`text-white hover:bg-gray-700 ${
                currentPage === "gacha" ? "bg-gray-700 hover:bg-gray-600" : "hover:bg-gray-700"
              }`}
              onClick={() => setCurrentPage("gacha")}
            >
              <Zap className="w-4 h-4 mr-2" />
              Gacha
            </Button>
            <Button
              variant={currentPage === "backpack" ? "default" : "ghost"}
              className={`text-white hover:bg-gray-700 ${
                currentPage === "backpack" ? "bg-gray-700 hover:bg-gray-600" : "hover:bg-gray-700"
              }`}
              onClick={() => setCurrentPage("backpack")}
            >
              <Package className="w-4 h-4 mr-2" />
              Items
            </Button>
            <Button
              variant={currentPage === "characters" ? "default" : "ghost"}
              className={`text-white hover:bg-gray-700 ${
                currentPage === "characters" ? "bg-gray-700 hover:bg-gray-600" : "hover:bg-gray-700"
              }`}
              onClick={() => setCurrentPage("characters")}
            >
              <Users className="w-4 h-4 mr-2" />
              Characters
            </Button>
            <Button
              variant={currentPage === "weapons" ? "default" : "ghost"}
              className={`text-white hover:bg-gray-700 ${
                currentPage === "weapons" ? "bg-gray-700 hover:bg-gray-600" : "hover:bg-gray-700"
              }`}
              onClick={() => setCurrentPage("weapons")}
            >
              <Sword className="w-4 h-4 mr-2" />
              Weapons
            </Button>
            <Button
              variant={currentPage === "artifacts" ? "default" : "ghost"}
              className={`text-white hover:bg-gray-700 ${
                currentPage === "artifacts" ? "bg-gray-700 hover:bg-gray-600" : "hover:bg-gray-700"
              }`}
              onClick={() => setCurrentPage("artifacts")}
            >
              <Shield className="w-4 h-4 mr-2" />
              Artifacts
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {currentPage === "gacha" && children}
        {currentPage === "backpack" && <BackpackPage />}
        {currentPage === "characters" && <CharacterPage />}
        {currentPage === "weapons" && <WeaponPage />}
        {currentPage === "artifacts" && <ArtifactPage />}
      </main>
    </div>
  )
}
