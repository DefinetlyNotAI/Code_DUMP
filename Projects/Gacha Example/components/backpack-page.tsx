"use client"

import { useState } from "react"
import { useGame } from "@/contexts/game-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Package, Star, Plus, Gift } from "lucide-react"
import { ChestSystem } from "@/components/chest-system"

export function BackpackPage() {
  const { gameData, devMode, addItem } = useGame()
  const [selectedItem, setSelectedItem] = useState("")
  const [itemCount, setItemCount] = useState(1)
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)

  const sampleItems = {
    blazing_ember: { name: "Blazing Ember", rarity: 3, type: "Ascension Material" },
    flame_core: { name: "Flame Core", rarity: 4, type: "Ascension Material" },
    inferno_crystal: { name: "Inferno Crystal", rarity: 5, type: "Ascension Material" },
    hydro_crystal: { name: "Hydro Crystal", rarity: 3, type: "Ascension Material" },
    water_essence: { name: "Water Essence", rarity: 4, type: "Ascension Material" },
    aqua_gem: { name: "Aqua Gem", rarity: 5, type: "Ascension Material" },
    enhancement_ore: { name: "Enhancement Ore", rarity: 2, type: "Enhancement Material" },
    weapon_crystal: { name: "Weapon Crystal", rarity: 3, type: "Weapon Material" },
    exp_book_small: { name: "EXP Book (Small)", rarity: 2, type: "Experience Material" },
    exp_book_large: { name: "EXP Book (Large)", rarity: 3, type: "Experience Material" },
    golden_chest: { name: "Golden Chest", rarity: 5, type: "Chest" },
    silver_chest: { name: "Silver Chest", rarity: 4, type: "Chest" },
  }

  const getRarityTextColor = (rarity: number) => {
    switch (rarity) {
      case 5:
        return "text-yellow-300"
      case 4:
        return "text-purple-300"
      case 3:
        return "text-blue-300"
      case 2:
        return "text-green-300"
      default:
        return "text-gray-300"
    }
  }

  const handleAddItem = () => {
    if (selectedItem && itemCount > 0) {
      addItem(selectedItem, itemCount)
      setSelectedItem("")
      setItemCount(1)
      setIsAddItemOpen(false)
    }
  }
  Object.entries(gameData.backpack.items).filter(([key]) => key.includes("chest"));
  const regularItems = Object.entries(gameData.backpack.items).filter(([key]) => !key.includes("chest"))

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Package className="w-5 h-5" />
            Items & Materials
          </CardTitle>
          <CardDescription className="text-gray-400">Manage your items and materials</CardDescription>
        </CardHeader>
      </Card>

      {/* Items Section */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Items & Materials</CardTitle>
            {devMode && (
              <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                <DialogTrigger asChild>
                  <div className="flex gap-2">
                    <Button className="bg-green-700 hover:bg-green-600 text-white border-green-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                    <Button
                      onClick={() => addItem("golden_chest", 1)}
                      className="bg-yellow-700 hover:bg-yellow-600 text-white border-yellow-700"
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Add Golden Chest
                    </Button>
                    <Button
                      onClick={() => addItem("silver_chest", 1)}
                      className="bg-purple-700 hover:bg-purple-600 text-white border-purple-700"
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Add Silver Chest
                    </Button>
                  </div>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Add Item</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-white text-sm mb-2 block">Select Item:</label>
                      <Select value={selectedItem} onValueChange={setSelectedItem}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Choose an item to add" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          {Object.entries(sampleItems).map(([key, item]) => (
                            <SelectItem key={key} value={key} className="text-white hover:bg-gray-600">
                              <span className={getRarityTextColor(item.rarity)}>{item.name}</span>
                              <span className="text-gray-400 ml-2">({item.type})</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-white text-sm mb-2 block">Count:</label>
                      <Input
                        type="number"
                        value={itemCount}
                        onChange={(e) => setItemCount(Math.max(1, Number.parseInt(e.target.value) || 1))}
                        min={1}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <Button
                      onClick={handleAddItem}
                      className="w-full bg-green-700 hover:bg-green-600 text-white border-green-700"
                    >
                      Add {itemCount} {selectedItem && sampleItems[selectedItem as keyof typeof sampleItems]?.name}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {regularItems.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {regularItems.map(([key, count]) => {
                const item = sampleItems[key as keyof typeof sampleItems]
                if (!item) return null

                return (
                  <Card key={key} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4 text-center">
                      <div className="flex justify-center mb-2">
                        {Array.from({ length: item.rarity }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current text-yellow-400" />
                        ))}
                      </div>
                      <h3 className={`font-semibold text-sm mb-1 ${getRarityTextColor(item.rarity)}`}>{item.name}</h3>
                      <p className="text-gray-400 text-xs mb-2">{item.type}</p>
                      <Badge className="bg-gray-700 text-white border-gray-600">{count}</Badge>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300 text-lg">No items yet</p>
              <p className="text-gray-500">Items will appear here as you play</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chests Section */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Chests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChestSystem />
        </CardContent>
      </Card>
    </div>
  )
}
