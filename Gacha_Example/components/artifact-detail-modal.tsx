"use client"

import { useGame } from "@/contexts/game-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Star, TrendingUp, Plus, Coins } from "lucide-react"

interface ArtifactDetailModalProps {
  isOpen: boolean
  onCloseAction: () => void
  artifactKey: string
  instanceIndex: number
}

export function ArtifactDetailModal({ isOpen, onCloseAction, artifactKey, instanceIndex }: ArtifactDetailModalProps) {
  const { gameData, levelUpArtifact, addArtifactExp } = useGame()
  const artifactSets = {
    godflame: {
      name: "Godflame Set",
      rarity: 5,
      set_bonus: { 2: "+15% Pyro DMG", 3: "+10% ATK when on fire terrain" },
    },
    frostguard: {
      name: "Frostguard Set",
      rarity: 4,
      set_bonus: { 2: "+15% Cryo DMG", 3: "+20% Shield Strength" },
    },
    windwalker: {
      name: "Windwalker Set",
      rarity: 3,
      set_bonus: { 2: "+15% Anemo DMG", 3: "+10% Movement Speed" },
    },
  }

  const setName = artifactKey.split("_")[0].toLowerCase()
  const setData = artifactSets[setName as keyof typeof artifactSets]
  const instance = gameData.backpack.artifacts[artifactKey]?.[instanceIndex]

  if (!setData || !instance) {
    return null
  }

  // Check if artifact is equipped
  const isEquipped = !!instance.equipped_to

  const getEquippedCharacter = () => {
    if (!instance.equipped_to) return null
    const [charKey] = instance.equipped_to.split("-")
    return charKey
  }
  const getMainStatValue = (stat: string, level: number) => {
    const baseValues = {
      "Atk%": 15 + level * 1.2,
      "HP%": 15 + level * 1.2,
      "Def%": 15 + level * 1.2,
      "CritRate%": 8 + level * 0.8,
      "CritDmg%": 16 + level * 1.6,
    }
    return Math.floor(baseValues[stat as keyof typeof baseValues] || 100 + level * 50)
  }

  const getSubstatValue = (substat: string, level: number) => {
    const baseValues = {
      Atk: 10 + level * 2,
      "Atk%": 3 + level * 0.5,
      HP: 100 + level * 20,
      "HP%": 3 + level * 0.5,
      Def: 8 + level * 1.5,
      "Def%": 3 + level * 0.5,
      "CritRate%": 2 + level * 0.3,
      "CritDmg%": 4 + level * 0.6,
    }
    return Math.floor(baseValues[substat as keyof typeof baseValues] || 0)
  }

  const expToNext = (instance.lv + 1) * 500
  const expProgress = (instance.exp / expToNext) * 100
  const enhanceCost = (instance.lv + 1) * 200
  const canEnhance = gameData.currency.coins >= enhanceCost && instance.lv < 25

  const handleEnhance = () => {
    const success = levelUpArtifact(artifactKey, instanceIndex)
    if (!success) {
      alert("Not enough coins or max level reached!")
    }
  }

  const handleAddExp = (amount: number) => {
    addArtifactExp(artifactKey, instanceIndex, amount)
  }
  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-white text-2xl">{setData.name}</DialogTitle>
              <p className="text-slate-300 text-lg">Artifact Level {instance.lv}</p>
              {isEquipped && (
                <Badge className="bg-red-600 text-white mt-2">🔒 Equipped to {getEquippedCharacter()}</Badge>
              )}
            </div>
            <div className="text-right">
              <div className="flex justify-end mb-1">
                {Array.from({ length: setData.rarity }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current text-yellow-400" />
                ))}
              </div>
              <Badge variant="outline" className="text-white border-slate-600 bg-slate-800">
                Level {instance.lv}/25
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {isEquipped && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4">
            <p className="text-red-300 text-sm">
              🔒 This artifact is currently equipped and cannot be enhanced or deleted. Unequip it first to perform
              these actions.
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
              value="set"
              className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
            >
              Set Bonus
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="mt-6">
            <div className="space-y-4">
              {/* Main Stats */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Main Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-500/20 rounded-lg">
                    <span className="text-blue-300 font-semibold">{instance.main1}</span>
                    <span className="text-white font-bold">
                      {getMainStatValue(instance.main1, instance.lv)}
                      {instance.main1.includes("%") ? "%" : ""}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-500/20 rounded-lg">
                    <span className="text-green-300 font-semibold">{instance.main2}</span>
                    <span className="text-white font-bold">
                      {getMainStatValue(instance.main2, instance.lv)}
                      {instance.main2.includes("%") ? "%" : ""}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Substats */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Substats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {instance.substats.map((substat, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-slate-700 rounded">
                      <span className="text-slate-300">{substat}</span>
                      <span className="text-white">
                        {getSubstatValue(substat, instance.lv)}
                        {substat.includes("%") ? "%" : ""}
                      </span>
                    </div>
                  ))}
                  {instance.substats.length < 5 && (
                    <div className="text-center py-2 text-slate-400 text-sm">
                      {5 - instance.substats.length} more substats will unlock as you enhance
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="enhance" className="mt-6">
            <div className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-white font-semibold">Enhancement Progress</span>
                    <span className="text-slate-300">Level {instance.lv} / 25</span>
                  </div>
                  <Progress value={(instance.lv / 25) * 100} className="mb-4" />

                  <div className="flex justify-between items-center mb-4">
                    <span className="text-white font-semibold">Experience</span>
                    <span className="text-slate-300">
                      {instance.exp} / {expToNext}
                    </span>
                  </div>
                  <Progress value={expProgress} className="mb-4" />

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <Button
                      onClick={() => handleAddExp(250)}
                      className="bg-green-700 hover:bg-green-600 text-white"
                      disabled={isEquipped}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      +250 EXP
                    </Button>
                    <Button
                      onClick={() => handleAddExp(500)}
                      className="bg-green-800 hover:bg-green-700 text-white"
                      disabled={isEquipped}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      +500 EXP
                    </Button>
                  </div>

                  <div className="mb-4 p-3 bg-slate-700 rounded-lg">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-300">Cost to enhance:</span>
                      <span className="text-white">
                        {enhanceCost} <Coins className="w-4 h-4 inline ml-1" />
                      </span>
                    </div>
                    {(instance.lv + 1) % 5 === 0 && instance.substats.length < 5 && (
                      <p className="text-yellow-400 text-sm">Next level will unlock a new substat!</p>
                    )}
                  </div>

                  <Button
                    onClick={handleEnhance}
                    disabled={!canEnhance || isEquipped}
                    className="w-full bg-purple-700 hover:bg-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Enhance (+1)
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="set" className="mt-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">{setData.name} Set Bonuses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(setData.set_bonus).map(([pieces, bonus]) => (
                  <div key={pieces} className="p-4 bg-slate-700 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-white border-slate-600 bg-slate-800">
                        {pieces} Piece
                      </Badge>
                      <Badge variant="outline" className="text-slate-400 border-slate-500 bg-slate-700">
                        Not Active
                      </Badge>
                    </div>
                    <p className="text-slate-300">{bonus}</p>
                  </div>
                ))}
                <div className="text-center text-slate-400 text-sm mt-4">
                  Equip multiple pieces of the same set to activate bonuses
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-4">
          <Button onClick={onCloseAction} className="bg-gray-700 hover:bg-gray-600 text-white">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
