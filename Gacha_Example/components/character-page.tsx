"use client"

import { useState } from "react"
import { useGame } from "@/contexts/game-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Star, Plus } from "lucide-react"
import { CharacterDetailModal } from "@/components/character-detail-modal"

export function CharacterPage() {
  const { gameData, devMode, addCharacter } = useGame()
  const [selectedCharacter, setSelectedCharacter] = useState<{ key: string; index: number } | null>(null)
  const [newCharacterKey, setNewCharacterKey] = useState("")

  const sampleCharacters = {
    eris: { name: "Eris", rarity: 5, element: "Pyro", weapon_type: "Greatsword" },
    zara: { name: "Zara", rarity: 4, element: "Hydro", weapon_type: "Catalyst" },
    thane: { name: "Thane", rarity: 4, element: "Geo", weapon_type: "Polearm" },
    lumen: { name: "Lumen", rarity: 5, element: "Electro", weapon_type: "Sword" },
    dusk: { name: "Dusk", rarity: 5, element: "Cryo", weapon_type: "Bow" },
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
        return "text-gray-400"
    }
  }

  const handleAddCharacter = () => {
    if (newCharacterKey && sampleCharacters[newCharacterKey as keyof typeof sampleCharacters]) {
      addCharacter(newCharacterKey)
      setNewCharacterKey("")
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Character Management
          </CardTitle>
          <CardDescription className="text-gray-400">Level up and manage your characters</CardDescription>
        </CardHeader>
      </Card>

      {devMode && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Dev Mode: Add Characters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Select value={newCharacterKey} onValueChange={setNewCharacterKey}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Select character to add" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {Object.entries(sampleCharacters).map(([key, char]) => (
                    <SelectItem key={key} value={key} className="text-white hover:bg-gray-600">
                      <span className={getRarityTextColor(char.rarity)}>{char.name}</span>
                      <span className="text-gray-400 ml-2">({char.rarity}★)</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddCharacter} className="bg-green-700 hover:bg-green-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Character
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {Object.keys(gameData.backpack.characters).length === 0 ? (
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300 text-lg">No characters available</p>
            <p className="text-gray-500">Make some wishes to get characters!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(gameData.backpack.characters).map(([key, instances]) => {
            const character = sampleCharacters[key as keyof typeof sampleCharacters]
            if (!character) return null

            return instances.map((instance, index) => (
              <Card
                key={`${key}-${index}`}
                className="bg-gray-800 border-gray-700 cursor-pointer hover:bg-gray-750 transition-colors"
                onClick={() => setSelectedCharacter({ key, index })}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className={`text-lg ${getRarityTextColor(character.rarity)}`}>
                      {character.name}
                    </CardTitle>
                    <div className="flex">
                      {Array.from({ length: character.rarity }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <CardDescription className={`${getElementColor(character.element)} font-semibold`}>
                    {character.element} • {character.weapon_type}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Level:</span>
                    <Badge className="bg-gray-700 text-white border-gray-600">{instance.lv}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Constellation:</span>
                    <Badge className="bg-gray-700 text-white border-gray-600">C{instance.constellation}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Ascension:</span>
                    <Badge className="bg-gray-700 text-white border-gray-600">{instance.ascension_level}/6</Badge>
                  </div>
                  <Button className="w-full mt-3 bg-gray-700 hover:bg-gray-600 text-white">Manage Character</Button>
                </CardContent>
              </Card>
            ))
          })}
        </div>
      )}

      {/* Character Detail Modal */}
      {selectedCharacter && (
        <CharacterDetailModal
          isOpen={!!selectedCharacter}
          onCloseAction={() => setSelectedCharacter(null)}
          charKey={selectedCharacter.key}
          instanceIndex={selectedCharacter.index}
        />
      )}
    </div>
  )
}
