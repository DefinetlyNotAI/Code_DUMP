"use client"

import { useState } from "react"
import { useGame } from "@/contexts/game-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Star, TrendingUp, Zap, Shield, Heart, Swords, Coins, Plus, X, ArrowUp } from "lucide-react"
import { getArtifactStats } from "@/utils/artifact-utils"

interface CharacterDetailModalProps {
  isOpen: boolean
  onCloseAction: () => void
  charKey: string
  instanceIndex: number
}

const sampleCharacters = {
  eris: {
    name: "Eris",
    rarity: 5,
    element: "Pyro",
    weapon_type: "Greatsword",
    base_stats: { hp_modifier: 10, atk_modifier: 3, def_modifier: 4, crit_rate: 5, crit_dmg: 50 },
    max_level: 80,
    constellations: [
      { id: "s1", effect: "Basic ATK deals 10% more damage" },
      { id: "s2", effect: "Elemental Skill cooldown reduced by 2 seconds" },
      { id: "s3", effect: "Elemental Burst level +3" },
      { id: "s4", effect: "Crit Rate increased by 15% for 10s after Elemental Skill" },
      { id: "s5", effect: "Elemental Skill level +3" },
      { id: "s6", effect: "Elemental Burst creates flame field that deals continuous damage" },
    ],
    skills: [
      { name: "Flame Strike", type: "Normal Attack", description: "Performs up to 4 consecutive strikes" },
      { name: "Blazing Dash", type: "Elemental Skill", description: "Dashes forward dealing Pyro damage" },
      { name: "Inferno Burst", type: "Elemental Burst", description: "Creates a massive fire explosion" },
    ],
    ascensions: [
      { level: 20, materials: { blazing_ember: 3 } },
      { level: 40, materials: { blazing_ember: 6, flame_core: 2 } },
      { level: 50, materials: { blazing_ember: 9, flame_core: 4 } },
      { level: 60, materials: { blazing_ember: 12, flame_core: 6, inferno_crystal: 1 } },
      { level: 70, materials: { blazing_ember: 15, flame_core: 8, inferno_crystal: 2 } },
      { level: 80, materials: { blazing_ember: 20, flame_core: 12, inferno_crystal: 4 } },
    ],
  },
  zara: {
    name: "Zara",
    rarity: 4,
    element: "Hydro",
    weapon_type: "Catalyst",
    base_stats: { hp_modifier: 8, atk_modifier: 4, def_modifier: 3, crit_rate: 5, crit_dmg: 50 },
    max_level: 80,
    constellations: [
      { id: "s1", effect: "Elemental Skill heals nearby allies" },
      { id: "s2", effect: "Hydro DMG increased by 15%" },
      { id: "s3", effect: "Elemental Burst level +3" },
      { id: "s4", effect: "Elemental reactions deal 25% more damage" },
      { id: "s5", effect: "Elemental Skill level +3" },
      { id: "s6", effect: "Elemental Burst creates healing field" },
    ],
    skills: [
      { name: "Water Orb", type: "Normal Attack", description: "Shoots water projectiles" },
      { name: "Healing Spring", type: "Elemental Skill", description: "Creates a healing area" },
      { name: "Tidal Wave", type: "Elemental Burst", description: "Summons a massive wave" },
    ],
    ascensions: [
      { level: 20, materials: { hydro_crystal: 3 } },
      { level: 40, materials: { hydro_crystal: 6, water_essence: 2 } },
      { level: 50, materials: { hydro_crystal: 9, water_essence: 4 } },
      { level: 60, materials: { hydro_crystal: 12, water_essence: 6, aqua_gem: 1 } },
      { level: 70, materials: { hydro_crystal: 15, water_essence: 8, aqua_gem: 2 } },
      { level: 80, materials: { hydro_crystal: 20, water_essence: 12, aqua_gem: 4 } },
    ],
  },
}

const sampleWeapons = {
  inferno_greatsword: { name: "Inferno Greatsword", rarity: 5, type: "Greatsword" },
  frost_blade: { name: "Frost Blade", rarity: 4, type: "Sword" },
  iron_sword: { name: "Iron Sword", rarity: 3, type: "Sword" },
}

const artifactSets = {
  Godflame: { name: "Godflame Set", rarity: 5 },
  Frostguard: { name: "Frostguard Set", rarity: 4 },
  Windwalker: { name: "Windwalker Set", rarity: 3 },
}

export function CharacterDetailModal({ isOpen, onCloseAction, charKey, instanceIndex }: CharacterDetailModalProps) {
  const {
    gameData,
    levelUpCharacter,
    upgradeConstellation,
    addCharacterExp,
    equipWeapon,
    unequipWeapon,
    equipArtifact,
    unequipArtifact,
    ascendCharacter,
    upgradeSkill,
  } = useGame()

  const [selectedTab, setSelectedTab] = useState("stats")
  const [showArtifactSelector, setShowArtifactSelector] = useState<number | null>(null)

  const character = sampleCharacters[charKey as keyof typeof sampleCharacters]
  const instance = gameData.backpack.characters[charKey]?.[instanceIndex]

  if (!character || !instance) return null

  // Helper functions that need access to gameData
  const getWeaponStats = (weaponKey: string, level: number, refinement: number) => {
    const weaponData = {
      inferno_greatsword: { atk_modifier: 6, crit_rate: 5, crit_dmg: 20 },
      frost_blade: { atk_modifier: 4, crit_rate: 8, crit_dmg: 15 },
      iron_sword: { atk_modifier: 3, crit_rate: 3, crit_dmg: 10 },
      celestial_blade: { atk_modifier: 6, crit_rate: 7, crit_dmg: 18 },
      void_bow: { atk_modifier: 5, crit_rate: 6, crit_dmg: 22 },
      thunder_bow: { atk_modifier: 4, crit_rate: 9, crit_dmg: 12 },
      wooden_bow: { atk_modifier: 2, crit_rate: 5, crit_dmg: 8 },
      steel_spear: { atk_modifier: 3, crit_rate: 4, crit_dmg: 12 },
    }

    const stats = weaponData[weaponKey as keyof typeof weaponData] || { atk_modifier: 2, crit_rate: 2, crit_dmg: 5 }

    return {
      atk: level * stats.atk_modifier + refinement * 10,
      crit_rate: stats.crit_rate + refinement * 2,
      crit_dmg: stats.crit_dmg + refinement * 5,
    }
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

  const getArtifactSetData = (artifactKey: string) => {
    // Extract set name from artifact key (e.g., "godflame_artifact_1" -> "Godflame")
    const setName = artifactKey.split("_")[0]
    const capitalizedSetName = setName.charAt(0).toUpperCase() + setName.slice(1)
    return artifactSets[capitalizedSetName as keyof typeof artifactSets]
  }

  const getEquippedWeapon = () => {
    if (!instance.equipped_weapon) return null
    const [weaponKey, weaponIndex] = instance.equipped_weapon.split("-")
    const weapon = gameData.backpack.weapons[weaponKey]?.[Number.parseInt(weaponIndex)]
    const weaponData = sampleWeapons[weaponKey as keyof typeof sampleWeapons]
    return weapon && weaponData ? { ...weaponData, instance: weapon, key: weaponKey, index: weaponIndex } : null
  }

  const getEquippedArtifact = (slot: number) => {
    const artifactId = instance.equipped_artifacts[slot]
    if (!artifactId) return null

    const [artifactKey, artifactIndex] = artifactId.split("-")
    const artifact = gameData.backpack.artifacts[artifactKey]?.[Number.parseInt(artifactIndex)]
    const setData = getArtifactSetData(artifactKey)

    return artifact && setData ? { ...setData, instance: artifact, key: artifactKey, index: artifactIndex } : null
  }

  const calculateStats = () => {
    const level = instance.lv
    let baseHp = 1000 + level * character.base_stats.hp_modifier
    let baseAtk = 100 + level * character.base_stats.atk_modifier
    let baseDef = 50 + level * character.base_stats.def_modifier
    let bonusCritRate = character.base_stats.crit_rate
    let bonusCritDmg = character.base_stats.crit_dmg

    // Constellation bonuses
    if (instance.constellation >= 1) baseAtk += baseAtk * 0.1
    if (instance.constellation >= 4) bonusCritRate += 15

    // Weapon bonuses
    const equippedWeapon = getEquippedWeapon()
    if (equippedWeapon) {
      const weaponLevel = equippedWeapon.instance.lv
      const refinement = equippedWeapon.instance.refinement

      // Get weapon stats based on type
      const weaponStats = getWeaponStats(equippedWeapon.key, weaponLevel, refinement)
      baseAtk += weaponStats.atk
      bonusCritRate += weaponStats.crit_rate
      bonusCritDmg += weaponStats.crit_dmg
    }

    // Artifact bonuses
    for (let slot = 0; slot < 3; slot++) {
      const artifact = getEquippedArtifact(slot)
      if (artifact) {
        getArtifactStats(artifact.instance);
        // Main stats
        if (artifact.instance.main1.includes("Atk%")) {
          baseAtk += baseAtk * (getMainStatValue(artifact.instance.main1, artifact.instance.lv) / 100)
        } else if (artifact.instance.main1.includes("HP%")) {
          baseHp += baseHp * (getMainStatValue(artifact.instance.main1, artifact.instance.lv) / 100)
        } else if (artifact.instance.main1.includes("Def%")) {
          baseDef += baseDef * (getMainStatValue(artifact.instance.main1, artifact.instance.lv) / 100)
        } else if (artifact.instance.main1.includes("CritRate%")) {
          bonusCritRate += getMainStatValue(artifact.instance.main1, artifact.instance.lv)
        } else if (artifact.instance.main1.includes("CritDmg%")) {
          bonusCritDmg += getMainStatValue(artifact.instance.main1, artifact.instance.lv)
        }

        if (artifact.instance.main2.includes("Atk%")) {
          baseAtk += baseAtk * (getMainStatValue(artifact.instance.main2, artifact.instance.lv) / 100)
        } else if (artifact.instance.main2.includes("HP%")) {
          baseHp += baseHp * (getMainStatValue(artifact.instance.main2, artifact.instance.lv) / 100)
        } else if (artifact.instance.main2.includes("Def%")) {
          baseDef += baseDef * (getMainStatValue(artifact.instance.main2, artifact.instance.lv) / 100)
        } else if (artifact.instance.main2.includes("CritRate%")) {
          bonusCritRate += getMainStatValue(artifact.instance.main2, artifact.instance.lv)
        } else if (artifact.instance.main2.includes("CritDmg%")) {
          bonusCritDmg += getMainStatValue(artifact.instance.main2, artifact.instance.lv)
        }

        // Substats
        artifact.instance.substats.forEach((substat) => {
          const substatValue = getSubstatValue(substat, artifact.instance.lv)
          if (substat.includes("Atk%")) {
            baseAtk += baseAtk * (substatValue / 100)
          } else if (substat === "Atk") {
            baseAtk += substatValue
          } else if (substat.includes("HP%")) {
            baseHp += baseHp * (substatValue / 100)
          } else if (substat === "HP") {
            baseHp += substatValue
          } else if (substat.includes("Def%")) {
            baseDef += baseDef * (substatValue / 100)
          } else if (substat === "Def") {
            baseDef += substatValue
          } else if (substat.includes("CritRate%")) {
            bonusCritRate += substatValue
          } else if (substat.includes("CritDmg%")) {
            bonusCritDmg += substatValue
          }
        })
      }
    }

    return {
      hp: Math.floor(baseHp),
      atk: Math.floor(baseAtk),
      def: Math.floor(baseDef),
      crit_rate: Math.round(bonusCritRate * 10) / 10,
      crit_dmg: Math.round(bonusCritDmg * 10) / 10,
    }
  }

  const getAvailableWeapons = () => {
    const weapons: any[] = []
    Object.entries(gameData.backpack.weapons).forEach(([key, instances]) => {
      const weaponData = sampleWeapons[key as keyof typeof sampleWeapons]
      if (weaponData && weaponData.type === character.weapon_type) {
        instances.forEach((instance, index) => {
          const weaponId = `${key}-${index}`
          // Check if weapon is equipped by any character
          const isEquipped = Object.values(gameData.backpack.characters).some((charInstances) =>
            charInstances.some((char) => char.equipped_weapon === weaponId),
          )
          if (!isEquipped) {
            weapons.push({ ...weaponData, instance, key, index })
          }
        })
      }
    })
    return weapons
  }

  const getAvailableArtifacts = () => {
    const artifacts: any[] = []
    Object.entries(gameData.backpack.artifacts).forEach(([key, instances]) => {
      const setData = getArtifactSetData(key)
      instances.forEach((artifact, index) => {
        // Only show artifacts that are not equipped to anyone, or equipped to this specific character
        if (!artifact.equipped_to || artifact.equipped_to === `${charKey}-${instanceIndex}`) {
          artifacts.push({ ...setData, instance: artifact, key, index })
        }
      })
    })
    return artifacts
  }

  const stats = calculateStats()

  const getElementColor = (element: string) => {
    switch (element) {
      case "Pyro":
        return "text-red-400"
      case "Hydro":
        return "text-blue-400"
      case "Electro":
        return "text-purple-400"
      case "Anemo":
        return "text-cyan-400"
      case "Geo":
        return "text-yellow-400"
      case "Cryo":
        return "text-blue-200"
      case "Dendro":
        return "text-green-400"
      default:
        return "text-gray-300"
    }
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

  const getNextAscension = () => {
    return character.ascensions[instance.ascension_level]
  }

  const canAscend = () => {
    const nextAsc = getNextAscension()
    if (!nextAsc || instance.lv < nextAsc.level) return false

    return Object.entries(nextAsc.materials).every(([item, count]) => (gameData.backpack.items[item] || 0) >= count)
  }

  const expToNext = instance.lv * 1000
  const expProgress = (instance.exp / expToNext) * 100
  const levelUpCost = instance.lv * 1000
  const canLevelUp = gameData.currency.coins >= levelUpCost && instance.exp >= expToNext
  const characterOrbs = gameData.backpack.character_orbs[charKey] || 0

  const handleLevelUp = () => {
    const success = levelUpCharacter(charKey, instanceIndex)
    if (!success) {
      alert("Not enough coins or EXP!")
    }
  }

  const handleConstellationUpgrade = () => {
    const success = upgradeConstellation(charKey, instanceIndex)
    if (!success) {
      alert("Not enough character orbs or max constellation reached!")
    }
  }

  const handleAddExp = (amount: number) => {
    addCharacterExp(charKey, instanceIndex, amount)
  }

  const handleAscension = () => {
    const success = ascendCharacter(charKey, instanceIndex)
    if (success) {
      alert("Character ascended successfully!")
    } else {
      alert("Cannot ascend: check level and materials!")
    }
  }

  const handleSkillUpgrade = (skillType: "normal" | "skill" | "burst") => {
    const success = upgradeSkill(charKey, instanceIndex, skillType)
    if (success) {
      alert(`${skillType} skill upgraded successfully!`)
    } else {
      alert("Cannot upgrade skill: check ascension level and coins!")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className={`text-2xl ${getRarityTextColor(character.rarity)}`}>{character.name}</DialogTitle>
              <p className={`text-lg ${getElementColor(character.element)}`}>
                {character.element} • {character.weapon_type}
              </p>
            </div>
            <div className="text-right">
              <div className="flex justify-end mb-1">
                {Array.from({ length: character.rarity }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current text-yellow-400" />
                ))}
              </div>
              <Badge className="bg-gray-700 text-white border-gray-600">Level {instance.lv}</Badge>
              {characterOrbs > 0 && (
                <Badge className="bg-purple-700 text-white border-purple-600 ml-2">{characterOrbs} Orbs</Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800">
            <TabsTrigger
              value="stats"
              className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
            >
              Stats
            </TabsTrigger>
            <TabsTrigger
              value="level"
              className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
            >
              Level Up
            </TabsTrigger>
            <TabsTrigger
              value="constellation"
              className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
            >
              Constellation
            </TabsTrigger>
            <TabsTrigger
              value="skills"
              className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
            >
              Skills
            </TabsTrigger>
            <TabsTrigger
              value="equipment"
              className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
            >
              Equipment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="mt-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-red-400" />
                    <span className="text-white font-semibold">HP</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.hp.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Swords className="w-4 h-4 text-orange-400" />
                    <span className="text-white font-semibold">ATK</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.atk.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span className="text-white font-semibold">DEF</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.def.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-white font-semibold">Crit Rate</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.crit_rate}%</p>
                </CardContent>
              </Card>
            </div>
            {/* Equipment Bonuses Display */}
            <Card className="bg-gray-800 border-gray-700 mt-4">
              <CardHeader>
                <CardTitle className="text-white text-lg">Equipment Bonuses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getEquippedWeapon() && (
                    <div className="flex justify-between items-center p-2 bg-gray-700 rounded">
                      <span className="text-blue-400">Weapon: {getEquippedWeapon()!.name}</span>
                      <span className="text-green-400">
                        +
                        {
                          getWeaponStats(
                            getEquippedWeapon()!.key,
                            getEquippedWeapon()!.instance.lv,
                            getEquippedWeapon()!.instance.refinement,
                          ).atk
                        }{" "}
                        ATK
                      </span>
                    </div>
                  )}
                  {[0, 1, 2].map((slot) => {
                    const artifact = getEquippedArtifact(slot)
                    if (!artifact) return null
                    return (
                      <div key={slot} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                        <span className="text-purple-400">
                          Slot {slot + 1}: {artifact.name}
                        </span>
                        <span className="text-green-400">
                          {artifact.instance.main1} • {artifact.instance.main2}
                        </span>
                      </div>
                    )
                  })}
                  {!getEquippedWeapon() && instance.equipped_artifacts.every((a) => !a) && (
                    <p className="text-gray-400 text-center py-2">No equipment bonuses active</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="level" className="mt-6">
            <div className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-white font-semibold">Experience</span>
                    <span className="text-gray-300">
                      {instance.exp} / {expToNext}
                    </span>
                  </div>
                  <Progress value={expProgress} className="mb-4" />
                  <div className="flex gap-2 mb-4">
                    <Button
                      onClick={() => handleAddExp(500)}
                      className="bg-green-700 hover:bg-green-600 text-white border-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      +500 EXP
                    </Button>
                    <Button
                      onClick={() => handleAddExp(1000)}
                      className="bg-green-800 hover:bg-green-700 text-white border-green-800"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      +1000 EXP
                    </Button>
                  </div>
                  <Button
                    onClick={handleLevelUp}
                    disabled={!canLevelUp}
                    className="w-full bg-blue-700 hover:bg-blue-600 text-white disabled:bg-gray-600 disabled:text-gray-400 border-blue-700"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Level Up ({levelUpCost} <Coins className="w-4 h-4 ml-1" />)
                  </Button>
                </CardContent>
              </Card>

              {/* Ascension Section */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Ascension</CardTitle>
                </CardHeader>
                <CardContent>
                  {getNextAscension() ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-semibold">
                          Next Ascension: Level {getNextAscension()!.level}
                        </span>
                        <Button
                          onClick={handleAscension}
                          disabled={!canAscend()}
                          className="bg-purple-700 hover:bg-purple-600 text-white disabled:bg-gray-600 disabled:text-gray-400 border-purple-700"
                        >
                          <ArrowUp className="w-4 h-4 mr-2" />
                          Ascend
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-gray-300 font-semibold">Required Materials:</h4>
                        {Object.entries(getNextAscension()!.materials).map(([item, count]) => {
                          const owned = gameData.backpack.items[item] || 0
                          const hasEnough = owned >= count
                          return (
                            <div key={item} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                              <span className="text-gray-300 capitalize">{item.replace(/_/g, " ")}</span>
                              <span className={hasEnough ? "text-green-400" : "text-red-400"}>
                                {owned} / {count}
                              </span>
                            </div>
                          )
                        })}
                      </div>

                      {instance.lv < getNextAscension()!.level && (
                        <div className="p-3 bg-yellow-500/20 rounded-lg">
                          <p className="text-yellow-400 text-sm">
                            Character must reach level {getNextAscension()!.level} before ascending
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-400">Character is at maximum ascension</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="constellation" className="mt-6">
            <div className="space-y-4">
              <div className="text-center mb-6">
                <Badge className="bg-gray-700 text-white border-gray-600 text-lg px-4 py-2">
                  Constellation {instance.constellation}
                </Badge>
                {characterOrbs > 0 && instance.constellation < 6 && (
                  <Button
                    onClick={handleConstellationUpgrade}
                    className="ml-4 bg-purple-700 hover:bg-purple-600 text-white border-purple-700"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Upgrade (1 Orb)
                  </Button>
                )}
              </div>

              <div className="grid gap-3">
                {character.constellations.map((constellation, index) => (
                  <Card
                    key={constellation.id}
                    className={`border-2 ${
                      index < instance.constellation
                        ? "border-yellow-400 bg-yellow-500/20"
                        : "border-gray-600 bg-gray-800"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            index < instance.constellation ? "bg-yellow-400 text-black" : "bg-gray-600 text-gray-300"
                          }`}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-semibold">C{index + 1}</h4>
                          <p
                            className={`text-sm ${index < instance.constellation ? "text-gray-200" : "text-gray-400"}`}
                          >
                            {constellation.effect}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="skills" className="mt-6">
            <div className="space-y-4">
              {character.skills.map((skill, index) => {
                const skillType = index === 0 ? "normal" : index === 1 ? "skill" : "burst"
                const currentLevel = instance.skill_levels[skillType]
                const requiredAscension = Math.floor((currentLevel - 1) / 2)
                const canUpgrade = instance.ascension_level >= requiredAscension && currentLevel < 10
                const upgradeCost = currentLevel * 5000

                return (
                  <Card key={index} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              skill.type === "Normal Attack"
                                ? "bg-gray-600"
                                : skill.type === "Elemental Skill"
                                  ? "bg-blue-600"
                                  : "bg-purple-600"
                            }`}
                          >
                            {skill.type === "Normal Attack" ? (
                              <Swords className="w-5 h-5" />
                            ) : skill.type === "Elemental Skill" ? (
                              <Zap className="w-5 h-5" />
                            ) : (
                              <Star className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{skill.name}</h3>
                            <p className="text-gray-400 text-sm">{skill.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-gray-700 text-white border-gray-600 mb-2">Level {currentLevel}/10</Badge>
                          <br />
                          <Button
                            onClick={() => handleSkillUpgrade(skillType)}
                            disabled={!canUpgrade || gameData.currency.coins < upgradeCost}
                            size="sm"
                            className="bg-green-700 hover:bg-green-600 text-white disabled:bg-gray-600 disabled:text-gray-400 border-green-700"
                          >
                            <TrendingUp className="w-4 h-4 mr-1" />
                            Upgrade ({upgradeCost} <Coins className="w-3 h-3 ml-1" />)
                          </Button>
                        </div>
                      </div>
                      <p className="text-gray-300">{skill.description}</p>
                      {!canUpgrade && currentLevel < 10 && (
                        <p className="text-yellow-400 text-sm mt-2">
                          Requires Ascension {requiredAscension} to upgrade further
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="equipment" className="mt-6">
            <div className="space-y-6">
              {/* Weapon Section */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Weapon</CardTitle>
                </CardHeader>
                <CardContent>
                  {getEquippedWeapon() ? (
                    <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                      <div>
                        <h3 className={`font-semibold ${getRarityTextColor(getEquippedWeapon()!.rarity)}`}>
                          {getEquippedWeapon()!.name}
                        </h3>
                        <p className="text-gray-300">
                          Level {getEquippedWeapon()!.instance.lv} • R{getEquippedWeapon()!.instance.refinement + 1}
                        </p>
                      </div>
                      <Button
                        onClick={() => unequipWeapon(charKey, instanceIndex)}
                        className="bg-red-700 hover:bg-red-600 text-white border-red-700"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Unequip
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                      <Swords className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-400 mb-4">No weapon equipped</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {getAvailableWeapons().map((weapon) => (
                          <Button
                            key={`${weapon.key}-${weapon.index}`}
                            onClick={() => equipWeapon(charKey, instanceIndex, weapon.key, weapon.index)}
                            className="w-full bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                          >
                            <span className={getRarityTextColor(weapon.rarity)}>{weapon.name}</span>
                            <span className="text-gray-400 ml-2">
                              (Lv.{weapon.instance.lv} R{weapon.instance.refinement + 1})
                            </span>
                          </Button>
                        ))}
                        {getAvailableWeapons().length === 0 && (
                          <p className="text-gray-500">No compatible weapons available</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Artifacts Section */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Artifacts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {[0, 1, 2].map((slot) => {
                      const equippedArtifact = getEquippedArtifact(slot)
                      return (
                        <div key={slot} className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center">
                          <Shield className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm mb-2">Slot {slot + 1}</p>
                          {equippedArtifact ? (
                            <div className="space-y-2">
                              <p className={`text-xs font-semibold ${getRarityTextColor(equippedArtifact.rarity)}`}>
                                {equippedArtifact.name}
                              </p>
                              <p className="text-xs text-gray-300">Lv. {equippedArtifact.instance.lv}</p>
                              <Button
                                onClick={() => unequipArtifact(charKey, instanceIndex, slot)}
                                size="sm"
                                className="bg-red-700 hover:bg-red-600 text-white border-red-700"
                              >
                                Unequip
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => setShowArtifactSelector(slot)}
                              size="sm"
                              className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                            >
                              Equip
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Artifact Selector Dialog */}
        {showArtifactSelector !== null && (
          <Dialog open={true} onOpenChange={() => setShowArtifactSelector(null)}>
            <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">Select Artifact for Slot {showArtifactSelector + 1}</DialogTitle>
              </DialogHeader>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {getAvailableArtifacts().map((artifact) => (
                  <Button
                    key={`${artifact.key}-${artifact.index}`}
                    onClick={() => {
                      equipArtifact(charKey, instanceIndex, artifact.key, artifact.index, showArtifactSelector!)
                      setShowArtifactSelector(null)
                    }}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white border-gray-600 p-4 h-auto"
                  >
                    <div className="text-left w-full">
                      <div className="flex justify-between items-center mb-2">
                        <span className={getRarityTextColor(artifact.rarity)}>{artifact.name}</span>
                        <Badge className="bg-gray-600 text-white">Lv. {artifact.instance.lv}</Badge>
                      </div>
                      <div className="text-sm text-gray-300">
                        <p>
                          {artifact.instance.main1} • {artifact.instance.main2}
                        </p>
                        <p className="text-xs">{artifact.instance.substats.join(", ")}</p>
                      </div>
                    </div>
                  </Button>
                ))}
                {getAvailableArtifacts().length === 0 && (
                  <p className="text-gray-400 text-center py-8">No artifacts available</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}
