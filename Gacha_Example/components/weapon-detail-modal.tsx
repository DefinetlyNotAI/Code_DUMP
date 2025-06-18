"use client"

import { useState } from "react"
import { useGame } from "@/contexts/game-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sword, Star, TrendingUp, Plus, Coins, Merge } from "lucide-react"

interface WeaponDetailModalProps {
  isOpen: boolean
  onCloseAction: () => void
  weaponKey: string
  instanceIndex: number
}

export function WeaponDetailModal({ isOpen, onCloseAction, weaponKey, instanceIndex }: WeaponDetailModalProps) {
  const { gameData, levelUpWeapon, addWeaponExp, mergeWeapons } = useGame()
  const [mergeMode, setMergeMode] = useState(false)

  const sampleWeapons = {
    inferno_greatsword: {
      name: "Inferno Greatsword",
      rarity: 5,
      type: "Greatsword",
      base_stats: { atk_modifier: 6, crit_rate: 5, crit_dmg: 20 },
      passive: "Inferno's Wrath: Normal attacks have 50% chance to create flame burst",
    },
    frost_blade: {
      name: "Frost Blade",
      rarity: 4,
      type: "Sword",
      base_stats: { atk_modifier: 4, crit_rate: 8, crit_dmg: 15 },
      passive: "Frost Strike: Attacks slow enemies by 20%",
    },
    iron_sword: {
      name: "Iron Sword",
      rarity: 3,
      type: "Sword",
      base_stats: { atk_modifier: 3, crit_rate: 3, crit_dmg: 10 },
      passive: null,
    },
  }

  const weapon = sampleWeapons[weaponKey as keyof typeof sampleWeapons]
  const instance = gameData.backpack.weapons[weaponKey]?.[instanceIndex]

  if (!weapon || !instance) return null

  // Check if weapon is equipped
  const weaponId = `${weaponKey}-${instanceIndex}`
  const isEquipped = Object.values(gameData.backpack.characters).some((instances) =>
    instances.some((char) => char.equipped_weapon === weaponId),
  )

  const getEquippedCharacter = () => {
    for (const [charKey, instances] of Object.entries(gameData.backpack.characters)) {
      for (const char of instances) {
        if (char.equipped_weapon === weaponId) {
          return charKey
        }
      }
    }
    return null
  }

  const getRarityColor = (rarity: number) => {
    switch (rarity) {
      case 5:
        return "border-yellow-400 bg-yellow-500/20"
      case 4:
        return "border-purple-400 bg-purple-500/20"
      case 3:
        return "border-blue-400 bg-blue-500/20"
      default:
        return "border-slate-600 bg-slate-800"
    }
  }

  const calculateWeaponStats = (weapon: any, instance: any) => {
    const level = instance.lv
    const baseAtk = 100 + level * weapon.base_stats.atk_modifier
    const critRate = weapon.base_stats.crit_rate + instance.refinement * 2
    const critDmg = weapon.base_stats.crit_dmg + instance.refinement * 5

    return {
      atk: Math.floor(baseAtk),
      crit_rate: critRate,
      crit_dmg: critDmg,
    }
  }

  const stats = calculateWeaponStats(weapon, instance)
  const expToNext = instance.lv * 800
  const expProgress = (instance.exp / expToNext) * 100
  const levelUpCost = instance.lv * 800
  const canLevelUp = gameData.currency.coins >= levelUpCost && instance.exp >= expToNext

  const handleLevelUp = () => {
    const success = levelUpWeapon(weaponKey, instanceIndex)
    if (!success) {
      alert("Not enough coins or EXP!")
    }
  }

  const handleAddExp = (amount: number) => {
    addWeaponExp(weaponKey, instanceIndex, amount)
  }

  const getSameWeapons = () => {
    const sameWeapons = gameData.backpack.weapons[weaponKey] || []
    return sameWeapons
      .map((wpn, idx) => ({ ...wpn, index: idx }))
      .filter((wpn) => {
        if (wpn.index === instanceIndex) return false

        // Check if this weapon is equipped
        const checkWeaponId = `${weaponKey}-${wpn.index}`
        const isWeaponEquipped = Object.values(gameData.backpack.characters).some((charInstances) =>
          charInstances.some((char) => char.equipped_weapon === checkWeaponId),
        )

        return !isWeaponEquipped
      })
  }

  const handleMerge = (sourceIndex: number) => {
    if (instance.refinement >= 4) {
      alert("Weapon is already at max refinement (R5)!")
      return
    }

    const success = mergeWeapons(weaponKey, sourceIndex, weaponKey, instanceIndex)
    if (success) {
      setMergeMode(false)
      alert("Weapons merged successfully! Refinement increased.")
    } else {
      alert("Cannot merge weapons!")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-white text-2xl">{weapon.name}</DialogTitle>
              <p className="text-slate-300 text-lg">{weapon.type}</p>
              {isEquipped && (
                <Badge className="bg-red-600 text-white mt-2">🔒 Equipped to {getEquippedCharacter()}</Badge>
              )}
            </div>
            <div className="text-right">
              <div className="flex justify-end mb-1">
                {Array.from({ length: weapon.rarity }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current text-yellow-400" />
                ))}
              </div>
              <Badge variant="outline" className="text-white border-slate-600 bg-slate-800">
                Level {instance.lv}
              </Badge>
              <Badge variant="outline" className="text-purple-300 border-purple-500 bg-purple-900/30 ml-2">
                R{instance.refinement + 1}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {isEquipped && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4">
            <p className="text-red-300 text-sm">
              🔒 This weapon is currently equipped and cannot be enhanced, refined, or deleted. Unequip it first to
              perform these actions.
            </p>
          </div>
        )}

        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800">
            <TabsTrigger
              value="stats"
              className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
            >
              Stats
            </TabsTrigger>
            <TabsTrigger
              value="enhance"
              className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
              disabled={isEquipped}
            >
              Enhance
            </TabsTrigger>
            <TabsTrigger
              value="refine"
              className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
              disabled={isEquipped}
            >
              Refine
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="mt-6">
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sword className="w-4 h-4 text-orange-400" />
                    <span className="text-white font-semibold">ATK</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.atk}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-white font-semibold">Crit Rate</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.crit_rate}%</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-purple-400" />
                    <span className="text-white font-semibold">Crit DMG</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.crit_dmg}%</p>
                </CardContent>
              </Card>
            </div>

            {weapon.passive && (
              <Card className="bg-slate-800 border-slate-700 mt-4">
                <CardHeader>
                  <CardTitle className="text-white">Weapon Passive</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-purple-500/20 rounded-lg">
                    <p className="text-white font-semibold mb-2">{weapon.passive.split(":")[0]}</p>
                    <p className="text-slate-300">{weapon.passive.split(":")[1]}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="enhance" className="mt-6">
            <div className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-white font-semibold">Experience</span>
                    <span className="text-slate-300">
                      {instance.exp} / {expToNext}
                    </span>
                  </div>
                  <Progress value={expProgress} className="mb-4" />
                  <div className="flex gap-2 mb-4">
                    <Button
                      onClick={() => handleAddExp(400)}
                      className="bg-green-700 hover:bg-green-600 text-white"
                      disabled={isEquipped}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      +400 EXP
                    </Button>
                    <Button
                      onClick={() => handleAddExp(800)}
                      className="bg-green-800 hover:bg-green-700 text-white"
                      disabled={isEquipped}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      +800 EXP
                    </Button>
                  </div>
                  <Button
                    onClick={handleLevelUp}
                    disabled={!canLevelUp || isEquipped}
                    className="w-full bg-blue-700 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Level Up ({levelUpCost} <Coins className="w-4 h-4 ml-1" />)
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="refine" className="mt-6">
            <div className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Weapon Refinement</CardTitle>
                  <CardDescription className="text-slate-300">
                    Current: R{instance.refinement + 1} / R5 {instance.refinement >= 4 && "(MAX)"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {instance.refinement >= 4 ? (
                    <div className="text-center py-8">
                      <Star className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                      <p className="text-white text-lg font-semibold">Maximum Refinement Reached!</p>
                      <p className="text-slate-400">This weapon is at R5 (maximum refinement)</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-slate-300 mb-4">
                        Merge duplicate weapons to increase refinement level and boost stats.
                      </p>

                      {getSameWeapons().length > 0 ? (
                        <div className="space-y-2">
                          {getSameWeapons().map((wpn, idx) => (
                            <div
                              key={wpn.index}
                              className="flex items-center justify-between p-3 bg-slate-700 rounded-lg"
                            >
                              <div>
                                <p className="text-white font-semibold">{weapon.name}</p>
                                <p className="text-slate-300 text-sm">
                                  Level {wpn.lv} • R{wpn.refinement + 1}
                                </p>
                              </div>
                              <Button
                                onClick={() => handleMerge(wpn.index)}
                                className="bg-purple-700 hover:bg-purple-600 text-white"
                                disabled={isEquipped}
                              >
                                <Merge className="w-4 h-4 mr-2" />
                                Merge
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Sword className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                          <p className="text-slate-400">
                            {isEquipped
                              ? "No unequipped duplicate weapons available for merging"
                              : "No duplicate weapons available for merging"}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
