"use client"

import type React from "react"

import { useState } from "react"
import { useGame } from "@/contexts/game-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, Star, Plus, Trash2 } from "lucide-react"
import { ArtifactDetailModal } from "@/components/artifact-detail-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function ArtifactPage() {
  const { gameData, devMode, generateArtifact, deleteArtifact } = useGame()
  const [selectedArtifact, setSelectedArtifact] = useState<{ key: string; index: number } | null>(null)
  const [newArtifactSet, setNewArtifactSet] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ key: string; index: number } | null>(null)

  const artifactSets = {
    Godflame: { name: "Godflame Set", rarity: 5 },
    Frostguard: { name: "Frostguard Set", rarity: 4 },
    Windwalker: { name: "Windwalker Set", rarity: 3 },
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

  const handleGenerateArtifact = () => {
    if (newArtifactSet && artifactSets[newArtifactSet as keyof typeof artifactSets]) {
      const setData = artifactSets[newArtifactSet as keyof typeof artifactSets]
      generateArtifact(newArtifactSet, setData.rarity)
      setNewArtifactSet("")
    }
  }

  const getArtifactSetData = (artifactKey: string) => {
    // Extract set name from artifact key (e.g., "godflame_artifact_1" -> "Godflame")
    const setName = artifactKey.split("_")[0]
    const capitalizedSetName = setName.charAt(0).toUpperCase() + setName.slice(1)
    return artifactSets[capitalizedSetName as keyof typeof artifactSets]
  }

  const handleManageArtifact = (key: string, index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setSelectedArtifact({ key, index })
  }

  const handleDeleteArtifact = (artifactKey: string, instanceIndex: number) => {
    const success = deleteArtifact(artifactKey, instanceIndex)
    if (success) {
      setShowDeleteConfirm(null)
      alert(`Artifact deleted! Received enhancement ore based on artifact level.`)
    } else {
      alert("Cannot delete equipped artifact!")
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Artifact Management
          </CardTitle>
          <CardDescription className="text-gray-400">Manage and enhance your artifacts</CardDescription>
        </CardHeader>
      </Card>

      {devMode && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Dev Mode: Generate Artifacts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Select value={newArtifactSet} onValueChange={setNewArtifactSet}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Select artifact set to generate" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {Object.entries(artifactSets).map(([key, set]) => (
                    <SelectItem key={key} value={key} className="text-white hover:bg-gray-600">
                      <span className={getRarityTextColor(set.rarity)}>{set.name}</span>
                      <span className="text-gray-400 ml-2">({set.rarity}★)</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleGenerateArtifact} className="bg-purple-700 hover:bg-purple-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Generate Artifact
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {Object.keys(gameData.backpack.artifacts).length === 0 ? (
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300 text-lg">No artifacts available</p>
            <p className="text-gray-500">Generate some in dev mode!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(gameData.backpack.artifacts).map(([key, instances]) => {
            const setData = getArtifactSetData(key)

            return instances.map((instance, index) => {
              const isEquipped = !!instance.equipped_to

              return (
                <Card
                  key={`${key}-${index}`}
                  className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className={`text-lg ${getRarityTextColor(setData?.rarity || 3)}`}>
                        {setData?.name || "Unknown Set"}
                      </CardTitle>
                      <div className="flex">
                        {Array.from({ length: setData?.rarity || 3 }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    {isEquipped && <Badge className="bg-red-600 text-white w-fit">🔒 Equipped</Badge>}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-1 text-xs">
                      <p className="text-blue-400">{instance.main1}</p>
                      <p className="text-green-400">{instance.main2}</p>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Level:</span>
                      <Badge className="bg-gray-700 text-white border-gray-600">{instance.lv}/25</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Substats:</span>
                      <Badge className="bg-gray-700 text-white border-gray-600">{instance.substats.length}/5</Badge>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        onClick={(e) => handleManageArtifact(key, index, e)}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                      >
                        Manage
                      </Button>
                      <Button
                        onClick={() => setShowDeleteConfirm({ key, index })}
                        className="bg-red-700 hover:bg-red-600 text-white border-red-700"
                        disabled={isEquipped}
                        title={isEquipped ? "Cannot delete equipped artifact" : "Delete artifact"}
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

      {/* Artifact Detail Modal */}
      {selectedArtifact && (
        <ArtifactDetailModal
          isOpen={!!selectedArtifact}
          onCloseAction={() => {
            setSelectedArtifact(null)
          }}
          artifactKey={selectedArtifact.key}
          instanceIndex={selectedArtifact.index}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <Dialog open={true} onOpenChange={() => setShowDeleteConfirm(null)}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Delete Artifact</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-300">
                Are you sure you want to delete this artifact? You will receive enhancement ore based on the artifact's
                level and experience.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleDeleteArtifact(showDeleteConfirm.key, showDeleteConfirm.index)}
                  className="bg-red-700 hover:bg-red-600 text-white border-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Artifact
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
