"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import Cookies from "js-cookie"

export interface Currency {
  coins: number
  gems: number
  orbs: number
}

export interface PityCounters {
  characters: number
  weapons: number
  guaranteed_featured: { characters: boolean; weapons: boolean }
}

export interface CharacterInstance {
  lv: number
  exp: number
  ascension_level: number
  constellation: number
  equipped_weapon?: string
  equipped_artifacts: string[]
  skill_levels: { normal: number; skill: number; burst: number }
}

export interface WeaponInstance {
  lv: number
  exp: number
  refinement: number
}

export interface ArtifactInstance {
  lv: number
  exp: number
  main1: string
  main2: string
  substats: string[]
  equipped_to?: string
}

export interface GameSave {
  currency: Currency
  pity_counters: PityCounters
  backpack: {
    items: Record<string, number>
    weapons: Record<string, WeaponInstance[]>
    characters: Record<string, CharacterInstance[]>
    artifacts: Record<string, ArtifactInstance[]>
    character_orbs: Record<string, number>
  }
}

interface GameContextType {
  gameData: GameSave
  devMode: boolean
  setDevMode: (enabled: boolean) => void
  addCurrency: (type: keyof Currency, amount: number) => void
  addItem: (itemId: string, count: number) => void
  performWish: (poolType: "characters" | "weapons", count?: 1 | 10) => Promise<any>
  saveGame: () => void
  loadGame: () => void
  exchangeGems: (amount: number) => boolean
  levelUpCharacter: (charKey: string, instanceIndex: number) => boolean
  upgradeConstellation: (charKey: string, instanceIndex: number) => boolean
  addCharacterExp: (charKey: string, instanceIndex: number, expAmount: number) => void
  generateArtifact: (setName: string, rarity: number) => void
  levelUpArtifact: (artifactKey: string, instanceIndex: number) => boolean
  addArtifactExp: (artifactKey: string, instanceIndex: number, expAmount: number) => void
  levelUpWeapon: (weaponKey: string, instanceIndex: number) => boolean
  addWeaponExp: (weaponKey: string, instanceIndex: number, expAmount: number) => void
  mergeWeapons: (sourceKey: string, sourceIndex: number, targetKey: string, targetIndex: number) => boolean
  deleteWeapon: (weaponKey: string, instanceIndex: number) => boolean
  deleteArtifact: (artifactKey: string, instanceIndex: number) => boolean
  openChest: (chestType: string) => any[]
  equipWeapon: (charKey: string, charIndex: number, weaponKey: string, weaponIndex: number) => boolean
  unequipWeapon: (charKey: string, charIndex: number) => boolean
  equipArtifact: (
    charKey: string,
    charIndex: number,
    artifactKey: string,
    artifactIndex: number,
    slot: number,
  ) => boolean
  unequipArtifact: (charKey: string, charIndex: number, slot: number) => boolean
  ascendCharacter: (charKey: string, instanceIndex: number) => boolean
  addCharacter: (charKey: string) => void
  addWeapon: (weaponKey: string) => void
  consumeItems: (items: Record<string, number>) => boolean
  upgradeSkill: (charKey: string, instanceIndex: number, skillType: "normal" | "skill" | "burst") => boolean
}

const GameContext = createContext<GameContextType | undefined>(undefined)

const defaultGameData: GameSave = {
  currency: { coins: 50000, gems: 1600, orbs: 10 },
  pity_counters: {
    characters: 0,
    weapons: 0,
    guaranteed_featured: { characters: false, weapons: false },
  },
  backpack: {
    items: {},
    weapons: {},
    characters: {},
    artifacts: {
      // Add some example artifacts with proper naming
      godflame_artifact_1: [
        {
          lv: 5,
          exp: 0,
          main1: "Atk%",
          main2: "CritDmg%",
          substats: ["HP", "Def%", "CritRate%"],
        },
      ],
      frostguard_artifact_2: [
        {
          lv: 3,
          exp: 0,
          main1: "HP%",
          main2: "Def%",
          substats: ["Atk", "CritDmg%"],
        },
      ],
      windwalker_artifact_3: [
        {
          lv: 8,
          exp: 0,
          main1: "CritRate%",
          main2: "Atk%",
          substats: ["HP%", "Def", "CritDmg%", "Atk"],
        },
      ],
    },
    character_orbs: {},
  },
}

const getExpToNextLevel = (lv: number): number => {
  return lv * 1000
}

const getArtifactExpToNextLevel = (lv: number): number => {
  return (lv + 1) * 500
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameData, setGameData] = useState<GameSave>(defaultGameData)
  const [devMode, setDevMode] = useState(false)

  useEffect(() => {
    loadGame()
  }, [])

  const saveGame = () => {
    Cookies.set("gacha-rpg-save", JSON.stringify(gameData), { expires: 365 })
    localStorage.setItem("gacha-rpg-save", JSON.stringify(gameData))
  }

  const loadGame = () => {
    const cookieSave = Cookies.get("gacha-rpg-save")
    const localSave = localStorage.getItem("gacha-rpg-save")
    const saveData = cookieSave || localSave

    if (saveData) {
      try {
        const parsed = JSON.parse(saveData)
        setGameData({ ...defaultGameData, ...parsed })
      } catch (error) {
        console.error("Failed to load save data:", error)
      }
    }
  }

  const addCurrency = (type: keyof Currency, amount: number) => {
    setGameData((prev) => ({
      ...prev,
      currency: {
        ...prev.currency,
        [type]: prev.currency[type] + amount,
      },
    }))
  }

  const addItem = (itemId: string, count: number) => {
    setGameData((prev) => ({
      ...prev,
      backpack: {
        ...prev.backpack,
        items: {
          ...prev.backpack.items,
          [itemId]: (prev.backpack.items[itemId] || 0) + count,
        },
      },
    }))
  }

  const consumeItems = (items: Record<string, number>): boolean => {
    // Check if we have enough items
    for (const [itemId, count] of Object.entries(items)) {
      if ((gameData.backpack.items[itemId] || 0) < count) {
        return false
      }
    }

    // Consume the items
    setGameData((prev) => {
      const newItems = { ...prev.backpack.items }
      for (const [itemId, count] of Object.entries(items)) {
        newItems[itemId] = (newItems[itemId] || 0) - count
        if (newItems[itemId] <= 0) {
          delete newItems[itemId]
        }
      }
      return {
        ...prev,
        backpack: {
          ...prev.backpack,
          items: newItems,
        },
      }
    })
    return true
  }

  const exchangeGems = (amount: number): boolean => {
    const orbsToGet = Math.floor(amount / 100)
    if (gameData.currency.gems >= amount && orbsToGet > 0) {
      setGameData((prev) => ({
        ...prev,
        currency: {
          ...prev.currency,
          gems: prev.currency.gems - amount,
          orbs: prev.currency.orbs + orbsToGet,
        },
      }))
      return true
    }
    return false
  }

  const performWish = async (poolType: "characters" | "weapons", count: 1 | 10 = 1) => {
    if (gameData.currency.orbs < count) return null

    const results: ({
      rarity: number;
      type: "characters" | "weapons";
      name: string;
      element?: string;
      weapon_type?: string;
      special_message?: string;
    })[] = [];
    let currentPity = gameData.pity_counters[poolType]
    let guaranteedFeatured = gameData.pity_counters.guaranteed_featured[poolType]

    const sampleItems = {
      characters: {
        featured: [{ name: "Eris", rarity: 5, element: "Pyro", weapon_type: "Greatsword" }],
        standard_5: [
          { name: "Lumen", rarity: 5, element: "Electro", weapon_type: "Sword" },
          { name: "Dusk", rarity: 5, element: "Cryo", weapon_type: "Bow" },
        ],
        4: [
          { name: "Zara", rarity: 4, element: "Hydro", weapon_type: "Catalyst" },
          { name: "Thane", rarity: 4, element: "Geo", weapon_type: "Polearm" },
        ],
      },
      weapons: {
        featured: [{ name: "Inferno Greatsword", rarity: 5, type: "Greatsword" }],
        standard_5: [
          { name: "Celestial Blade", rarity: 5, type: "Sword" },
          { name: "Void Bow", rarity: 5, type: "Bow" },
        ],
        4: [
          { name: "Frost Blade", rarity: 4, type: "Sword" },
          { name: "Thunder Bow", rarity: 4, type: "Bow" },
        ],
        3: [
          { name: "Iron Sword", rarity: 3, type: "Sword" },
          { name: "Wooden Bow", rarity: 3, type: "Bow" },
          { name: "Steel Spear", rarity: 3, type: "Polearm" },
        ],
      },
    }

    for (let i = 0; i < count; i++) {
      const isGuaranteed5Star = currentPity >= 79
      const isGuaranteed4Star = (currentPity + 1) % 10 === 0

      let rarity = 3
      if (isGuaranteed5Star) {
        rarity = 5
      } else if (isGuaranteed4Star) {
        rarity = 4
      } else {
        const roll = Math.random()
        if (roll < 0.006) rarity = 5
        else if (roll < 0.057) rarity = 4
      }

      let item
      let actualType = poolType

      if (poolType === "characters" && rarity === 3) {
        const weaponPool = sampleItems.weapons[3]
        item = weaponPool[Math.floor(Math.random() * weaponPool.length)]
        actualType = "weapons"
      } else if (rarity === 5) {
        // 50/50 system for 5-stars
        if (guaranteedFeatured) {
          // Guaranteed featured
          item = sampleItems[poolType].featured[0]
          guaranteedFeatured = false
        } else {
          // 50/50 chance
          const isFeatured = Math.random() < 0.5
          if (isFeatured) {
            item = sampleItems[poolType].featured[0]
          } else {
            const standardPool = sampleItems[poolType].standard_5
            item = standardPool[Math.floor(Math.random() * standardPool.length)]
            guaranteedFeatured = true // Next 5-star is guaranteed featured
          }
        }
      } else {
        const itemPool = sampleItems[poolType][rarity as keyof typeof sampleItems.characters]
        item = itemPool[Math.floor(Math.random() * itemPool.length)]
      }

      results.push({ ...item, rarity, type: actualType })
      currentPity = rarity === 5 ? 0 : currentPity + 1
    }

    setGameData((prev) => {
      const newBackpack = { ...prev.backpack }
      let orbsToReturn = 0

      results.forEach((item) => {
        const key = item.name.toLowerCase().replace(/\s+/g, "_")

        if (item.type === "characters") {
          if (newBackpack.characters[key] && newBackpack.characters[key].length > 0) {
            // Check if character is already max constellation
            if (newBackpack.characters[key][0].constellation >= 6) {
              // Return 2 orbs for max constellation character
              orbsToReturn += 2
              item.special_message = "+2 Orbs (Max Constellation)"
            } else {
              // Auto constellation - upgrade existing character
              newBackpack.characters[key][0].constellation = Math.min(
                6,
                newBackpack.characters[key][0].constellation + 1,
              )
              item.special_message = "+1 Constellation"
            }
          } else {
            if (!newBackpack.characters[key]) newBackpack.characters[key] = []
            newBackpack.characters[key].push({
              lv: 1,
              exp: 0,
              constellation: 0,
              ascension_level: 0,
              equipped_artifacts: ["", "", ""],
              skill_levels: { normal: 1, skill: 1, burst: 1 },
            })
          }
        } else if (item.type === "weapons") {
          if (!newBackpack.weapons[key]) newBackpack.weapons[key] = []
          newBackpack.weapons[key].push({
            lv: 1,
            exp: 0,
            refinement: 0,
          })
        }
      })

      return {
        ...prev,
        pity_counters: {
          ...prev.pity_counters,
          [poolType]: currentPity,
          guaranteed_featured: {
            ...prev.pity_counters.guaranteed_featured,
            [poolType]: guaranteedFeatured,
          },
        },
        currency: {
          ...prev.currency,
          orbs: prev.currency.orbs - count + orbsToReturn,
        },
        backpack: newBackpack,
      }
    })

    return results
  }

  const deleteWeapon = (weaponKey: string, instanceIndex: number): boolean => {
    const weapon = gameData.backpack.weapons[weaponKey]?.[instanceIndex]
    if (!weapon) return false

    // Check if weapon is equipped to any character
    const weaponId = `${weaponKey}-${instanceIndex}`
    const isEquipped = Object.values(gameData.backpack.characters).some((instances) =>
      instances.some((char) => char.equipped_weapon === weaponId),
    )

    if (isEquipped) return false

    // Calculate EXP books to give based on weapon rarity and level
    const sampleWeapons = {
      inferno_greatsword: { rarity: 5 },
      celestial_blade: { rarity: 5 },
      void_bow: { rarity: 5 },
      frost_blade: { rarity: 4 },
      thunder_bow: { rarity: 4 },
      iron_sword: { rarity: 3 },
      wooden_bow: { rarity: 3 },
      steel_spear: { rarity: 3 },
    }

    const weaponData = sampleWeapons[weaponKey as keyof typeof sampleWeapons]
    if (!weaponData) return false

    const expBooksToGive = Math.max(1, Math.floor((weapon.lv * weaponData.rarity) / 3))
    const bookType = weaponData.rarity >= 4 ? "exp_book_large" : "exp_book_small"

    setGameData((prev) => {
      const newWeapons = { ...prev.backpack.weapons }
      const newItems = { ...prev.backpack.items }

      // Remove the weapon
      newWeapons[weaponKey].splice(instanceIndex, 1)
      if (newWeapons[weaponKey].length === 0) {
        delete newWeapons[weaponKey]
      }

      // Add EXP books
      newItems[bookType] = (newItems[bookType] || 0) + expBooksToGive

      return {
        ...prev,
        backpack: {
          ...prev.backpack,
          weapons: newWeapons,
          items: newItems,
        },
      }
    })

    return true
  }

  const deleteArtifact = (artifactKey: string, instanceIndex: number): boolean => {
    const artifact = gameData.backpack.artifacts[artifactKey]?.[instanceIndex]
    if (!artifact) return false

    // Check if artifact is equipped to any character
    if (artifact.equipped_to) return false

    // Calculate EXP to give back based on artifact level
    const expToGive = Math.floor(artifact.lv * 100 + artifact.exp * 0.8)

    setGameData((prev) => {
      const newArtifacts = { ...prev.backpack.artifacts }
      const newItems = { ...prev.backpack.items }

      // Remove the artifact
      newArtifacts[artifactKey].splice(instanceIndex, 1)
      if (newArtifacts[artifactKey].length === 0) {
        delete newArtifacts[artifactKey]
      }

      // Add enhancement ore back
      newItems.enhancement_ore = (newItems.enhancement_ore || 0) + Math.max(1, Math.floor(expToGive / 100))

      return {
        ...prev,
        backpack: {
          ...prev.backpack,
          artifacts: newArtifacts,
          items: newItems,
        },
      }
    })

    return true
  }

  const levelUpCharacter = (charKey: string, instanceIndex: number): boolean => {
    const character = gameData.backpack.characters[charKey]?.[instanceIndex]
    if (!character) return false

    const expNeeded = getExpToNextLevel(character.lv)
    const coinsNeeded = character.lv * 1000

    if (gameData.currency.coins >= coinsNeeded && character.exp >= expNeeded) {
      setGameData((prev) => ({
        ...prev,
        currency: {
          ...prev.currency,
          coins: prev.currency.coins - coinsNeeded,
        },
        backpack: {
          ...prev.backpack,
          characters: {
            ...prev.backpack.characters,
            [charKey]: prev.backpack.characters[charKey].map((char, idx) =>
              idx === instanceIndex ? { ...char, lv: char.lv + 1, exp: char.exp - expNeeded } : char,
            ),
          },
        },
      }))
      return true
    }
    return false
  }

  const upgradeConstellation = (charKey: string, instanceIndex: number): boolean => {
    const character = gameData.backpack.characters[charKey]?.[instanceIndex]
    const orbs = gameData.backpack.character_orbs[charKey] || 0

    if (!character || orbs < 1 || character.constellation >= 6) return false

    setGameData((prev) => ({
      ...prev,
      backpack: {
        ...prev.backpack,
        character_orbs: {
          ...prev.backpack.character_orbs,
          [charKey]: orbs - 1,
        },
        characters: {
          ...prev.backpack.characters,
          [charKey]: prev.backpack.characters[charKey].map((char, idx) =>
            idx === instanceIndex ? { ...char, constellation: char.constellation + 1 } : char,
          ),
        },
      },
    }))
    return true
  }

  const upgradeSkill = (charKey: string, instanceIndex: number, skillType: "normal" | "skill" | "burst"): boolean => {
    const character = gameData.backpack.characters[charKey]?.[instanceIndex]
    if (!character) return false

    const currentLevel = character.skill_levels[skillType]
    const maxLevel = 10
    const requiredAscension = Math.floor((currentLevel - 1) / 2)

    // Check if character has required ascension level
    if (character.ascension_level < requiredAscension) return false
    if (currentLevel >= maxLevel) return false

    const cost = currentLevel * 5000 // Skill upgrade cost

    if (gameData.currency.coins >= cost) {
      setGameData((prev) => ({
        ...prev,
        currency: {
          ...prev.currency,
          coins: prev.currency.coins - cost,
        },
        backpack: {
          ...prev.backpack,
          characters: {
            ...prev.backpack.characters,
            [charKey]: prev.backpack.characters[charKey].map((char, idx) =>
              idx === instanceIndex
                ? {
                    ...char,
                    skill_levels: {
                      ...char.skill_levels,
                      [skillType]: char.skill_levels[skillType] + 1,
                    },
                  }
                : char,
            ),
          },
        },
      }))
      return true
    }
    return false
  }

  const ascendCharacter = (charKey: string, instanceIndex: number): boolean => {
    const character = gameData.backpack.characters[charKey]?.[instanceIndex]
    if (!character) return false

    // Get character data for ascension requirements
    const sampleCharacters = {
      eris: {
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

    const charData = sampleCharacters[charKey as keyof typeof sampleCharacters]
    if (!charData) return false

    // Find next ascension
    const nextAscension = charData.ascensions[character.ascension_level]
    if (!nextAscension) return false

    // Check if character is at required level
    if (character.lv < nextAscension.level) return false

    const sanitizedMaterials = Object.fromEntries(
        Object.entries(nextAscension.materials).filter(([_, v]) => v !== undefined)
    ) as Record<string, number>;

    // Check materials and consume them
    if (consumeItems(sanitizedMaterials)) {
      setGameData((prev) => ({
        ...prev,
        backpack: {
          ...prev.backpack,
          characters: {
            ...prev.backpack.characters,
            [charKey]: prev.backpack.characters[charKey].map((char, idx) =>
              idx === instanceIndex ? { ...char, ascension_level: char.ascension_level + 1 } : char,
            ),
          },
        },
      }))
      return true
    }
    return false
  }

  const addCharacterExp = (charKey: string, instanceIndex: number, expAmount: number) => {
    setGameData((prev) => ({
      ...prev,
      backpack: {
        ...prev.backpack,
        characters: {
          ...prev.backpack.characters,
          [charKey]: prev.backpack.characters[charKey].map((char, idx) =>
            idx === instanceIndex ? { ...char, exp: char.exp + expAmount } : char,
          ),
        },
      },
    }))
  }

  const generateArtifact = (setName: string, rarity: number) => {
    const artifactSets = {
      Godflame: {
        main_stats: ["Atk%", "CritDmg%", "CritRate%", "HP%"],
        substats_pool: ["Atk", "Atk%", "HP", "HP%", "Def", "Def%", "CritRate%", "CritDmg%"],
      },
      Frostguard: {
        main_stats: ["HP%", "Def%", "CritRate%", "Atk%"],
        substats_pool: ["Atk", "Atk%", "HP", "HP%", "Def", "Def%", "CritRate%", "CritDmg%"],
      },
      Windwalker: {
        main_stats: ["Atk%", "CritRate%", "HP%", "Def%"],
        substats_pool: ["Atk", "Atk%", "HP", "HP%", "Def", "Def%", "CritRate%", "CritDmg%"],
      },
    }

    const set = artifactSets[setName as keyof typeof artifactSets] || artifactSets["Godflame"]
    const main1 = set.main_stats[Math.floor(Math.random() * set.main_stats.length)]
    const main2 = set.main_stats[Math.floor(Math.random() * set.main_stats.length)]

    const substats: string[] = []
    const availableSubstats = [...set.substats_pool]
    const initialSubstatCount = Math.min(rarity - 2, 2)

    for (let i = 0; i < initialSubstatCount; i++) {
      if (availableSubstats.length === 0) break
      const randomIndex = Math.floor(Math.random() * availableSubstats.length)
      substats.push(availableSubstats.splice(randomIndex, 1)[0])
    }

    const artifactKey = `${setName.toLowerCase()}_artifact_${Date.now()}`

    setGameData((prev) => ({
      ...prev,
      backpack: {
        ...prev.backpack,
        artifacts: {
          ...prev.backpack.artifacts,
          [artifactKey]: [
            {
              lv: 0,
              exp: 0,
              main1,
              main2,
              substats,
            },
          ],
        },
      },
    }))
  }

  const levelUpArtifact = (artifactKey: string, instanceIndex: number): boolean => {
    const artifact = gameData.backpack.artifacts[artifactKey]?.[instanceIndex]
    if (!artifact || artifact.lv >= 25) return false

    const expNeeded = getArtifactExpToNextLevel(artifact.lv)
    const coinsNeeded = (artifact.lv + 1) * 200

    if (gameData.currency.coins >= coinsNeeded && artifact.exp >= expNeeded) {
      setGameData((prev) => {
        const newArtifacts = { ...prev.backpack.artifacts }
        const updatedArtifact = {
          ...artifact,
          lv: artifact.lv + 1,
          exp: artifact.exp - expNeeded,
        }

        if (updatedArtifact.lv % 5 === 0 && updatedArtifact.substats.length < 5) {
          const availableSubstats = ["Atk", "Atk%", "HP", "HP%", "Def", "Def%", "CritRate%", "CritDmg%"]
          const unusedSubstats = availableSubstats.filter((stat) => !updatedArtifact.substats.includes(stat))
          if (unusedSubstats.length > 0) {
            const newSubstat = unusedSubstats[Math.floor(Math.random() * unusedSubstats.length)]
            updatedArtifact.substats.push(newSubstat)
          }
        }

        newArtifacts[artifactKey][instanceIndex] = updatedArtifact

        return {
          ...prev,
          currency: {
            ...prev.currency,
            coins: prev.currency.coins - coinsNeeded,
          },
          backpack: {
            ...prev.backpack,
            artifacts: newArtifacts,
          },
        }
      })
      return true
    }
    return false
  }

  const addArtifactExp = (artifactKey: string, instanceIndex: number, expAmount: number) => {
    setGameData((prev) => ({
      ...prev,
      backpack: {
        ...prev.backpack,
        artifacts: {
          ...prev.backpack.artifacts,
          [artifactKey]: prev.backpack.artifacts[artifactKey].map((artifact, idx) =>
            idx === instanceIndex ? { ...artifact, exp: artifact.exp + expAmount } : artifact,
          ),
        },
      },
    }))
  }

  const levelUpWeapon = (weaponKey: string, instanceIndex: number): boolean => {
    const weapon = gameData.backpack.weapons[weaponKey]?.[instanceIndex]
    if (!weapon) return false

    const expNeeded = getExpToNextLevel(weapon.lv)
    const coinsNeeded = weapon.lv * 800

    if (gameData.currency.coins >= coinsNeeded && weapon.exp >= expNeeded) {
      setGameData((prev) => ({
        ...prev,
        currency: {
          ...prev.currency,
          coins: prev.currency.coins - coinsNeeded,
        },
        backpack: {
          ...prev.backpack,
          weapons: {
            ...prev.backpack.weapons,
            [weaponKey]: prev.backpack.weapons[weaponKey].map((wpn, idx) =>
              idx === instanceIndex ? { ...wpn, lv: wpn.lv + 1, exp: wpn.exp - expNeeded } : wpn,
            ),
          },
        },
      }))
      return true
    }
    return false
  }

  const addWeaponExp = (weaponKey: string, instanceIndex: number, expAmount: number) => {
    setGameData((prev) => ({
      ...prev,
      backpack: {
        ...prev.backpack,
        weapons: {
          ...prev.backpack.weapons,
          [weaponKey]: prev.backpack.weapons[weaponKey].map((wpn, idx) =>
            idx === instanceIndex ? { ...wpn, exp: wpn.exp + expAmount } : wpn,
          ),
        },
      },
    }))
  }

  const mergeWeapons = (sourceKey: string, sourceIndex: number, targetKey: string, targetIndex: number): boolean => {
    if (sourceKey !== targetKey) return false

    const sourceWeapon = gameData.backpack.weapons[sourceKey]?.[sourceIndex]
    const targetWeapon = gameData.backpack.weapons[targetKey]?.[targetIndex]

    if (!sourceWeapon || !targetWeapon || sourceIndex === targetIndex) return false
    if (targetWeapon.refinement >= 4) return false

    // Check if source weapon is equipped
    const sourceWeaponId = `${sourceKey}-${sourceIndex}`
    const isSourceEquipped = Object.values(gameData.backpack.characters).some((instances) =>
      instances.some((char) => char.equipped_weapon === sourceWeaponId),
    )

    if (isSourceEquipped) return false

    setGameData((prev) => {
      const newWeapons = { ...prev.backpack.weapons }

      newWeapons[targetKey][targetIndex] = {
        ...targetWeapon,
        refinement: targetWeapon.refinement + 1,
      }

      newWeapons[sourceKey].splice(sourceIndex, 1)
      if (newWeapons[sourceKey].length === 0) {
        delete newWeapons[sourceKey]
      }

      return {
        ...prev,
        backpack: {
          ...prev.backpack,
          weapons: newWeapons,
        },
      }
    })
    return true
  }

  const openChest = (chestType: string) => {
    const chestRewards = {
      golden_chest: [
        { item: "inferno_crystal", count: 2, weight: 20 },
        { item: "flame_core", count: 5, weight: 40 },
        { item: "blazing_ember", count: 10, weight: 60 },
        { item: "enhancement_ore", count: 15, weight: 80 },
      ],
      silver_chest: [
        { item: "flame_core", count: 3, weight: 30 },
        { item: "blazing_ember", count: 8, weight: 50 },
        { item: "enhancement_ore", count: 10, weight: 70 },
        { item: "weapon_crystal", count: 5, weight: 60 },
      ],
    }

    const rewards = chestRewards[chestType as keyof typeof chestRewards] || []
    const loot: any[] = []
    const itemCount = Math.floor(Math.random() * 3) + 2

    for (let i = 0; i < itemCount; i++) {
      const totalWeight = rewards.reduce((sum, reward) => sum + reward.weight, 0)
      let random = Math.random() * totalWeight

      for (const reward of rewards) {
        random -= reward.weight
        if (random <= 0) {
          loot.push(reward)
          break
        }
      }
    }

    setGameData((prev) => {
      const newItems = { ...prev.backpack.items }
      loot.forEach((reward) => {
        newItems[reward.item] = (newItems[reward.item] || 0) + reward.count
      })

      return {
        ...prev,
        backpack: {
          ...prev.backpack,
          items: newItems,
        },
      }
    })

    return loot
  }

  const equipWeapon = (charKey: string, charIndex: number, weaponKey: string, weaponIndex: number): boolean => {
    const character = gameData.backpack.characters[charKey]?.[charIndex]
    const weapon = gameData.backpack.weapons[weaponKey]?.[weaponIndex]

    if (!character || !weapon) return false

    setGameData((prev) => ({
      ...prev,
      backpack: {
        ...prev.backpack,
        characters: {
          ...prev.backpack.characters,
          [charKey]: prev.backpack.characters[charKey].map((char, idx) =>
            idx === charIndex ? { ...char, equipped_weapon: `${weaponKey}-${weaponIndex}` } : char,
          ),
        },
      },
    }))
    return true
  }

  const unequipWeapon = (charKey: string, charIndex: number): boolean => {
    setGameData((prev) => ({
      ...prev,
      backpack: {
        ...prev.backpack,
        characters: {
          ...prev.backpack.characters,
          [charKey]: prev.backpack.characters[charKey].map((char, idx) =>
            idx === charIndex ? { ...char, equipped_weapon: undefined } : char,
          ),
        },
      },
    }))
    return true
  }

  const equipArtifact = (
    charKey: string,
    charIndex: number,
    artifactKey: string,
    artifactIndex: number,
    slot: number,
  ): boolean => {
    const character = gameData.backpack.characters[charKey]?.[charIndex]
    const artifact = gameData.backpack.artifacts[artifactKey]?.[artifactIndex]

    if (!character || !artifact || slot < 0 || slot > 2) return false

    // Check if artifact is already equipped to someone else
    if (artifact.equipped_to && artifact.equipped_to !== `${charKey}-${charIndex}`) return false

    setGameData((prev) => {
      const newCharacters = { ...prev.backpack.characters }
      const newArtifacts = { ...prev.backpack.artifacts }

      // Unequip any artifact currently in this slot
      const currentArtifactId = character.equipped_artifacts[slot]
      if (currentArtifactId) {
        const [currentKey, currentIndex] = currentArtifactId.split("-")
        if (newArtifacts[currentKey]?.[Number.parseInt(currentIndex)]) {
          newArtifacts[currentKey][Number.parseInt(currentIndex)] = {
            ...newArtifacts[currentKey][Number.parseInt(currentIndex)],
            equipped_to: undefined,
          }
        }
      }

      const updatedArtifacts = [...character.equipped_artifacts]
      updatedArtifacts[slot] = `${artifactKey}-${artifactIndex}`

      newCharacters[charKey][charIndex] = {
        ...character,
        equipped_artifacts: updatedArtifacts,
      }

      newArtifacts[artifactKey][artifactIndex] = {
        ...artifact,
        equipped_to: `${charKey}-${charIndex}`,
      }

      return {
        ...prev,
        backpack: {
          ...prev.backpack,
          characters: newCharacters,
          artifacts: newArtifacts,
        },
      }
    })
    return true
  }

  const unequipArtifact = (charKey: string, charIndex: number, slot: number): boolean => {
    const character = gameData.backpack.characters[charKey]?.[charIndex]
    if (!character || slot < 0 || slot > 2) return false

    const artifactId = character.equipped_artifacts[slot]
    if (!artifactId) return false

    const [artifactKey, artifactIndex] = artifactId.split("-")

    setGameData((prev) => {
      const newCharacters = { ...prev.backpack.characters }
      const newArtifacts = { ...prev.backpack.artifacts }

      const updatedArtifacts = [...character.equipped_artifacts]
      updatedArtifacts[slot] = ""

      newCharacters[charKey][charIndex] = {
        ...character,
        equipped_artifacts: updatedArtifacts,
      }

      if (newArtifacts[artifactKey]?.[Number.parseInt(artifactIndex)]) {
        newArtifacts[artifactKey][Number.parseInt(artifactIndex)] = {
          ...newArtifacts[artifactKey][Number.parseInt(artifactIndex)],
          equipped_to: undefined,
        }
      }

      return {
        ...prev,
        backpack: {
          ...prev.backpack,
          characters: newCharacters,
          artifacts: newArtifacts,
        },
      }
    })
    return true
  }

  const addCharacter = (charKey: string) => {
    setGameData((prev) => ({
      ...prev,
      backpack: {
        ...prev.backpack,
        characters: {
          ...prev.backpack.characters,
          [charKey]: [
            ...(prev.backpack.characters[charKey] || []),
            {
              lv: 1,
              exp: 0,
              constellation: 0,
              ascension_level: 0,
              equipped_artifacts: ["", "", ""],
              skill_levels: { normal: 1, skill: 1, burst: 1 },
            },
          ],
        },
      },
    }))
  }

  const addWeapon = (weaponKey: string) => {
    setGameData((prev) => ({
      ...prev,
      backpack: {
        ...prev.backpack,
        weapons: {
          ...prev.backpack.weapons,
          [weaponKey]: [
            ...(prev.backpack.weapons[weaponKey] || []),
            {
              lv: 1,
              exp: 0,
              refinement: 0,
            },
          ],
        },
      },
    }))
  }

  useEffect(() => {
    saveGame()
  }, [gameData])

  return (
    <GameContext.Provider
      value={{
        gameData,
        devMode,
        setDevMode,
        addCurrency,
        addItem,
        performWish,
        exchangeGems,
        saveGame,
        loadGame,
        levelUpCharacter,
        upgradeConstellation,
        addCharacterExp,
        generateArtifact,
        levelUpArtifact,
        addArtifactExp,
        levelUpWeapon,
        addWeaponExp,
        mergeWeapons,
        deleteWeapon,
        deleteArtifact,
        openChest,
        equipWeapon,
        unequipWeapon,
        equipArtifact,
        unequipArtifact,
        ascendCharacter,
        addCharacter,
        addWeapon,
        consumeItems,
        upgradeSkill,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error("useGame must be used within GameProvider")
  }
  return context
}
