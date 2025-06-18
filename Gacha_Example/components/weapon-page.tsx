"use client"

import { useState } from "react"
import { useGame } from "@/contexts/game-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sword, Star, Plus, Trash2 } from "lucide-react"
import { WeaponDetailModal } from "@/components/weapon-detail-modal"

export function WeaponPage() {
  const { gameData, devMode, addWeapon, deleteWeapon } = useGame()
  const [selectedWeapon, setSelectedWeapon] = useState<{ key: string; index: number } | null>(null)
  const [newWeaponKey, setNewWeaponKey] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ key: string; index: number } | null>(null)

  const sampleWeapons = {
    inferno_greatsword: { name: "Inferno Greatsword", rarity: 5, type: "Greatsword" },
    frost_blade: { name: "Frost Blade", rarity: 4, type: "Sword" },
    iron_sword: { name: "Iron Sword", rarity: 3, type: "Sword" },
    wooden_bow: { name: "Wooden Bow", rarity: 3, type: "Bow" },
    steel_spear: { name: "Steel Spear", rarity: 3, type: "Polearm" },
    celestial_blade: { name: "Celestial Blade", rarity: 5, type: "Sword" },
    void_bow: { name: "Void Bow", rarity: 5, type: "Bow" },
    thunder_bow: { name: "Thunder Bow", rarity: 4, type: "Bow" },
  }

  const getRarityTextColor = (rarity: number) => {
    switch (rarity) {
      case 5:
        return "text-yellow-300"
      case 4:
        return "text-purple-300"
      case 3:
        return "text-blue-300"
      default:
        return "text-gray-300"
    }
  }

  const handleAddWeapon = () => {
    if (newWeaponKey && sampleWeapons[newWeaponKey as keyof typeof sampleWeapons]) {
      addWeapon(newWeaponKey)
      setNewWeaponKey("")
    }
  }

  const isWeaponEquipped = (weaponKey: string, instanceIndex: number) => {
    const weaponId = `${weaponKey}-${instanceIndex}`
    return Object.values(gameData.backpack.characters).some((instances) =>
      instances.some((char) => char.equipped_weapon === weaponId),
    )
  }

  const handleDeleteWeapon = (weaponKey: string, instanceIndex: number) => {
    const weapon = sampleWeapons[weaponKey as keyof typeof sampleWeapons]
    if (!weapon) return

    const success = deleteWeapon(weaponKey, instanceIndex)
    if (success) {
      setShowDeleteConfirm(null)
      alert(`Weapon deleted! Received EXP books based on weapon rarity.`)
    } else {
      alert("Cannot delete equipped weapon!")
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sword className="w-5 h-5" />
            Weapon Management
          </CardTitle>
          <CardDescription className="text-gray-400">Enhance and merge your weapons</CardDescription>
        </CardHeader>
      </Card>

      {devMode && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Dev Mode: Add Weapons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Select value={newWeaponKey} onValueChange={setNewWeaponKey}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Select weapon to add" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {Object.entries(sampleWeapons).map(([key, weapon]) => (
                    <SelectItem key={key} value={key} className="text-white hover:bg-gray-600">
                      <span className={getRarityTextColor(weapon.rarity)}>{weapon.name}</span>
                      <span className="text-gray-400 ml-2">({weapon.rarity}★)</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddWeapon} className="bg-blue-700 hover:bg-blue-600 text-white border-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Weapon
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {Object.keys(gameData.backpack.weapons).length === 0 ? (
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="text-center py-12">
            <Sword className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300 text-lg">No weapons available</p>
            <p className="text-gray-500">Make some wishes to get weapons!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(gameData.backpack.weapons).map(([key, instances]) => {
            const weapon = sampleWeapons[key as keyof typeof sampleWeapons]
            if (!weapon) return null

            return instances.map((instance, index) => {
              const isEquipped = isWeaponEquipped(key, index)

              return (
                <Card
                  key={`${key}-${index}`}
                  className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className={`text-lg ${getRarityTextColor(weapon.rarity)}`}>{weapon.name}</CardTitle>
                      <div className="flex">
                        {Array.from({ length: weapon.rarity }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <CardDescription className="text-gray-400 font-semibold">{weapon.type}</CardDescription>
                    {isEquipped && <Badge className="bg-red-600 text-white w-fit">🔒 Equipped</Badge>}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Level:</span>
                      <Badge className="bg-gray-700 text-white border-gray-600">{instance.lv}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Refinement:</span>
                      <Badge className="bg-gray-700 text-white border-gray-600">R{instance.refinement + 1}</Badge>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        onClick={() => setSelectedWeapon({ key, index })}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                      >
                        Manage
                      </Button>
                      <Button
                        onClick={() => setShowDeleteConfirm({ key, index })}
                        className="bg-red-700 hover:bg-red-600 text-white border-red-700"
                        disabled={isEquipped}
                        title={isEquipped ? "Cannot delete equipped weapon" : "Delete weapon"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          })}
        </div>
      )}

      {/* Weapon Detail Modal */}
      {selectedWeapon && (
        <WeaponDetailModal
          isOpen={!!selectedWeapon}
          onCloseAction={() => setSelectedWeapon(null)}
          weaponKey={selectedWeapon.key}
          instanceIndex={selectedWeapon.index}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <Dialog open={true} onOpenChange={() => setShowDeleteConfirm(null)}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Delete Weapon</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-300">
                Are you sure you want to delete this weapon? You will receive EXP books based on the weapon's rarity and
                level.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleDeleteWeapon(showDeleteConfirm.key, showDeleteConfirm.index)}
                  className="bg-red-700 hover:bg-red-600 text-white border-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Weapon
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
