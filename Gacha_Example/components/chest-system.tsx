"use client"

import { useState } from "react"
import { useGame } from "@/contexts/game-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Gift, Star, Sparkles } from "lucide-react"

export function ChestSystem() {
  const { gameData, openChest } = useGame()
  const [isOpening, setIsOpening] = useState(false)
  const [openResults, setOpenResults] = useState<any[]>([])

  const sampleChests = {
    golden_chest: { name: "Golden Chest", rarity: 5, type: "Chest" },
    silver_chest: { name: "Silver Chest", rarity: 4, type: "Chest" },
    bronze_chest: { name: "Bronze Chest", rarity: 3, type: "Chest" },
  }

  const sampleItems = {
    blazing_ember: { name: "Blazing Ember", rarity: 3 },
    flame_core: { name: "Flame Core", rarity: 4 },
    inferno_crystal: { name: "Inferno Crystal", rarity: 5 },
    enhancement_ore: { name: "Enhancement Ore", rarity: 2 },
    weapon_crystal: { name: "Weapon Crystal", rarity: 3 },
  }

  const getRarityColor = (rarity: number) => {
    switch (rarity) {
      case 5:
        return "border-yellow-400 bg-gradient-to-br from-yellow-500/20 to-orange-500/20"
      case 4:
        return "border-purple-400 bg-gradient-to-br from-purple-500/20 to-pink-500/20"
      case 3:
        return "border-blue-400 bg-gradient-to-br from-blue-500/20 to-cyan-500/20"
      default:
        return "border-gray-400 bg-gradient-to-br from-gray-500/20 to-slate-500/20"
    }
  }

  const handleOpenChest = async (chestType: string) => {
    setIsOpening(true)
    setOpenResults([])

    // Animation delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const loot = openChest(chestType)
    setOpenResults(loot)
    setIsOpening(false)

    // Remove chest from inventory
    // This would be handled in the openChest function
  }

  const chestItems = Object.entries(gameData.backpack.items).filter(([key]) => key.includes("chest"))

  return (
    <div className="space-y-6">
      {/* Opening Animation */}
      {(isOpening || openResults.length > 0) && (
        <Card className="bg-black/20 backdrop-blur-sm border-white/10">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              {isOpening ? (
                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 animate-bounce" />
                    <div className="absolute inset-0 w-24 h-24 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 animate-ping opacity-75" />
                    <Sparkles className="absolute inset-0 w-24 h-24 text-white animate-spin" />
                  </div>
                  <p className="text-white text-2xl font-bold animate-pulse">Opening chest...</p>
                </div>
              ) : (
                <div className="w-full max-w-2xl">
                  <div className="text-center mb-6">
                    <h3 className="text-3xl font-bold text-white mb-2">✨ Chest Rewards ✨</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {openResults.map((reward, index) => {
                      const item = sampleItems[reward.item as keyof typeof sampleItems]
                      return (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border-2 ${getRarityColor(item?.rarity || 2)} animate-in fade-in-0 zoom-in-95`}
                          style={{ animationDelay: `${index * 200}ms` }}
                        >
                          <div className="text-center">
                            <div className="flex justify-center mb-2">
                              {Array.from({ length: item?.rarity || 2 }).map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-current text-yellow-400" />
                              ))}
                            </div>
                            <p className="font-bold text-white text-sm mb-1">{item?.name || reward.item}</p>
                            <Badge variant="outline" className="text-white border-white/30">
                              x{reward.count}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="text-center mt-6">
                    <Button
                      onClick={() => setOpenResults([])}
                      className="bg-white/20 hover:bg-white/30 text-white px-8 py-2"
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chest Inventory */}
      <Card className="bg-black/20 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Chest Inventory
          </CardTitle>
          <CardDescription className="text-gray-300">Open chests to get rewards</CardDescription>
        </CardHeader>
        <CardContent>
          {chestItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chestItems.map(([key, count]) => {
                const chest = sampleChests[key as keyof typeof sampleChests]
                if (!chest) return null

                return (
                  <Card key={key} className={`border-2 ${getRarityColor(chest.rarity)}`}>
                    <CardContent className="p-6 text-center">
                      <div className="flex justify-center mb-3">
                        {Array.from({ length: chest.rarity }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current text-yellow-400" />
                        ))}
                      </div>
                      <Gift className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                      <h3 className="text-white font-semibold text-lg mb-2">{chest.name}</h3>
                      <Badge variant="outline" className="text-white border-white/30 mb-4">
                        x{count}
                      </Badge>
                      <Button
                        onClick={() => handleOpenChest(key)}
                        disabled={isOpening || count === 0}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        Open Chest
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No chests available</p>
              <p className="text-gray-500">Chests will appear here when you obtain them</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
