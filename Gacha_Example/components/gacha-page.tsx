"use client"

import { useState } from "react"
import { useGame } from "@/contexts/game-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Zap, Sparkles, Star, Gem, ArrowRight } from "lucide-react"

export function GachaPage() {
  const { gameData, performWish, exchangeGems } = useGame()
  const [isWishing, setIsWishing] = useState(false)
  const [wishResults, setWishResults] = useState<any[]>([])
  const [currentResultIndex, setCurrentResultIndex] = useState(0)
  const [gemsToExchange, setGemsToExchange] = useState(1000)

  const handleWish = async (poolType: "characters" | "weapons", count: 1 | 10 = 1) => {
    if (gameData.currency.orbs < count) return

    setIsWishing(true)
    setWishResults([])
    setCurrentResultIndex(0)

    // Animation delay based on highest rarity
    await new Promise((resolve) => setTimeout(resolve, 1200))

    const results = await performWish(poolType, count)
    if (results) {
      setWishResults(results)
      // Start showing results one by one for x10
      if (count === 10) {
        showResultsSequentially(results)
      }
    }
    setIsWishing(false)
  }

  const showResultsSequentially = (results: any[]) => {
    let index = 0
    const interval = setInterval(() => {
      setCurrentResultIndex(index)
      index++
      if (index >= results.length) {
        clearInterval(interval)
      }
    }, 300)
  }

  const handleExchange = () => {
    const success = exchangeGems(gemsToExchange)
    if (success) {
      setGemsToExchange(1000)
    }
  }

  const getRarityColor = (rarity: number) => {
    switch (rarity) {
      case 5:
        return "border-yellow-500 bg-gradient-to-br from-yellow-600/50 to-orange-600/50 shadow-2xl shadow-yellow-500/50"
      case 4:
        return "border-purple-500 bg-gradient-to-br from-purple-600/50 to-pink-600/50 shadow-2xl shadow-purple-500/50"
      case 3:
        return "border-blue-500 bg-gradient-to-br from-blue-600/40 to-cyan-600/40 shadow-lg shadow-blue-500/30"
      default:
        return "border-gray-500 bg-gradient-to-br from-gray-600/40 to-slate-600/40"
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

  const getRarityStarColor = (rarity: number) => {
    switch (rarity) {
      case 5:
        return "text-yellow-400"
      case 4:
        return "text-purple-400"
      case 3:
        return "text-blue-400"
      default:
        return "text-gray-400"
    }
  }

  const getWishAnimation = () => {
    if (wishResults.length === 0) return null

    const highestRarity = Math.max(...wishResults.map((r) => r.rarity))

    if (highestRarity === 5) {
      return (
        <div className="absolute inset-0 pointer-events-none">
          {/* Epic 5-star background */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-orange-500/30 to-red-500/20 animate-pulse" />

          {/* Shooting stars */}
          <div
            className="absolute top-10 left-10 w-2 h-2 bg-yellow-400 rounded-full animate-ping"
            style={{ animationDelay: "0s", animationDuration: "2s" }}
          />
          <div
            className="absolute top-20 right-20 w-3 h-3 bg-orange-400 rounded-full animate-ping"
            style={{ animationDelay: "0.5s", animationDuration: "1.5s" }}
          />
          <div
            className="absolute bottom-20 left-20 w-2 h-2 bg-yellow-300 rounded-full animate-ping"
            style={{ animationDelay: "1s", animationDuration: "2.5s" }}
          />
          <div
            className="absolute bottom-10 right-10 w-3 h-3 bg-orange-300 rounded-full animate-ping"
            style={{ animationDelay: "1.5s", animationDuration: "1.8s" }}
          />

          {/* Floating particles */}
          <div
            className="absolute top-1/4 left-1/4 w-1 h-1 bg-yellow-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          />
          <div
            className="absolute top-3/4 right-1/4 w-1 h-1 bg-orange-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.8s" }}
          />
        </div>
      )
    } else if (highestRarity === 4) {
      return (
        <div className="absolute inset-0 pointer-events-none">
          {/* 4-star background */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/15 via-pink-500/25 to-purple-500/15 animate-pulse" />

          {/* Purple sparkles */}
          <div
            className="absolute top-16 left-16 w-2 h-2 bg-purple-400 rounded-full animate-ping"
            style={{ animationDelay: "0s", animationDuration: "1.5s" }}
          />
          <div
            className="absolute top-32 right-24 w-2 h-2 bg-pink-400 rounded-full animate-ping"
            style={{ animationDelay: "0.7s", animationDuration: "1.8s" }}
          />
          <div
            className="absolute bottom-24 left-32 w-2 h-2 bg-purple-300 rounded-full animate-ping"
            style={{ animationDelay: "1.2s", animationDuration: "1.3s" }}
          />
        </div>
      )
    }

    return null
  }

  return (
    <div className="space-y-6">
      {/* Epic Wish Animation Area */}
      <Card className="bg-gray-900/90 backdrop-blur-sm border-gray-700 relative overflow-hidden">
        {getWishAnimation()}
        <CardContent className="p-8 relative z-10">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            {isWishing ? (
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  {/* Epic multi-layered animation */}
                  <div className="w-48 h-48 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 animate-pulse" />
                  <div className="absolute inset-0 w-48 h-48 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 animate-ping opacity-75" />
                  <div className="absolute inset-4 w-40 h-40 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 animate-spin" />
                  <div className="absolute inset-8 w-32 h-32 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 animate-pulse" />
                  <div className="absolute inset-16 w-16 h-16 rounded-full bg-gradient-to-r from-white to-yellow-200 animate-bounce" />

                  {/* Epic floating particles */}
                  <div className="absolute -top-8 -left-8 w-4 h-4 bg-yellow-400 rounded-full animate-ping" />
                  <div className="absolute -top-4 -right-12 w-6 h-6 bg-purple-400 rounded-full animate-pulse" />
                  <div className="absolute -bottom-8 -left-12 w-4 h-4 bg-blue-400 rounded-full animate-bounce" />
                  <div className="absolute -bottom-4 -right-8 w-6 h-6 bg-pink-400 rounded-full animate-ping" />

                  {/* Additional sparkles */}
                  <div className="absolute top-2 left-2 w-2 h-2 bg-white rounded-full animate-pulse" />
                  <div className="absolute top-8 right-4 w-3 h-3 bg-yellow-300 rounded-full animate-bounce" />
                  <div className="absolute bottom-6 left-6 w-2 h-2 bg-cyan-300 rounded-full animate-ping" />
                </div>
                <div className="text-center">
                  <p className="text-white text-4xl font-bold animate-pulse mb-3 drop-shadow-lg">✨ SUMMONING... ✨</p>
                  <p className="text-gray-300 text-2xl animate-bounce">The stars are aligning...</p>
                </div>
              </div>
            ) : wishResults.length > 0 ? (
              <div className="w-full max-w-4xl">
                {wishResults.length === 1 ? (
                  // Single wish result with epic reveal
                  <div
                    className={`flex flex-col items-center gap-6 p-8 rounded-xl border-4 ${getRarityColor(wishResults[0].rarity)} animate-in fade-in-0 zoom-in-95 duration-1000`}
                  >
                    <div className="flex items-center gap-2">
                      {Array.from({ length: wishResults[0].rarity }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-12 h-12 fill-current ${getRarityStarColor(wishResults[0].rarity)} animate-pulse drop-shadow-2xl`}
                          style={{ animationDelay: `${i * 200}ms` }}
                        />
                      ))}
                    </div>
                    <div className="text-center">
                      <p
                        className={`text-6xl font-bold mb-4 ${getRarityTextColor(wishResults[0].rarity)} drop-shadow-2xl animate-pulse`}
                      >
                        {wishResults[0].name}
                      </p>
                      <p className={`text-3xl font-semibold mb-4 ${getElementColor(wishResults[0].element || "")}`}>
                        {wishResults[0].element && `${wishResults[0].element} • `}
                        {wishResults[0].weapon_type || wishResults[0].type}
                      </p>
                      <p className="text-2xl text-gray-300">
                        {wishResults[0].rarity}★ {wishResults[0].type === "characters" ? "Character" : "Weapon"}
                      </p>
                      {/* Show special messages */}
                      {wishResults[0].special_message && (
                        <Badge className="bg-purple-600 text-white mt-4 text-lg px-4 py-2">
                          {wishResults[0].special_message}
                        </Badge>
                      )}
                    </div>
                    <Button
                      onClick={() => setWishResults([])}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 text-lg border-gray-600"
                    >
                      Continue
                    </Button>
                  </div>
                ) : (
                  // x10 wish results with staggered animation
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">✨ WISH RESULTS ✨</h3>
                      <p className="text-gray-300 text-xl">
                        Showing {Math.min(currentResultIndex + 1, wishResults.length)} of {wishResults.length}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {wishResults.slice(0, currentResultIndex + 1).map((result, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border-2 ${getRarityColor(result.rarity)} animate-in fade-in-0 zoom-in-95`}
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="text-center">
                            <div className="flex justify-center mb-2">
                              {Array.from({ length: result.rarity }).map((_, i) => (
                                <Star key={i} className={`w-5 h-5 fill-current ${getRarityStarColor(result.rarity)}`} />
                              ))}
                            </div>
                            <p className={`font-bold text-sm mb-1 ${getRarityTextColor(result.rarity)}`}>
                              {result.name}
                            </p>
                            <p className={`text-xs ${getElementColor(result.element || "")}`}>
                              {result.element && `${result.element} • `}
                              {result.weapon_type || result.type}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {currentResultIndex >= wishResults.length - 1 && (
                      <div className="text-center">
                        <Button
                          onClick={() => setWishResults([])}
                          className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 border-gray-600"
                        >
                          Continue
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <Sparkles className="w-28 h-28 text-purple-400 mx-auto mb-6 animate-pulse drop-shadow-lg" />
                <p className="text-white text-4xl font-bold mb-4">Ready to make a wish?</p>
                <p className="text-gray-400 text-2xl">Choose a banner below</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gacha Banners */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Character Banner */}
        <Card className="bg-gray-900 border-gray-700 hover:border-red-500 transition-colors">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-red-400" />
              Character Banner
            </CardTitle>
            <CardDescription className="text-gray-400">Featured: Eris (5★ Pyro Greatsword)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Pity Counter:</span>
              <Badge className="bg-gray-700 text-white border-gray-600">{gameData.pity_counters.characters}/80</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleWish("characters", 1)}
                disabled={gameData.currency.orbs < 1 || isWishing}
                className="bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-600 disabled:text-gray-400 border-red-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                Wish x1
              </Button>
              <Button
                onClick={() => handleWish("characters", 10)}
                disabled={gameData.currency.orbs < 10 || isWishing}
                className="bg-red-700 hover:bg-red-800 text-white disabled:bg-gray-600 disabled:text-gray-400 border-red-800"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Wish x10
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Weapon Banner */}
        <Card className="bg-gray-900 border-gray-700 hover:border-blue-500 transition-colors">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              Weapon Banner
            </CardTitle>
            <CardDescription className="text-gray-400">Featured: Inferno Greatsword (5★)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Pity Counter:</span>
              <Badge className="bg-gray-700 text-white border-gray-600">{gameData.pity_counters.weapons}/80</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleWish("weapons", 1)}
                disabled={gameData.currency.orbs < 1 || isWishing}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600 disabled:text-gray-400 border-blue-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                Wish x1
              </Button>
              <Button
                onClick={() => handleWish("weapons", 10)}
                disabled={gameData.currency.orbs < 10 || isWishing}
                className="bg-blue-700 hover:bg-blue-800 text-white disabled:bg-gray-600 disabled:text-gray-400 border-blue-800"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Wish x10
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exchange Section */}
      <Card className="bg-gray-900/90 backdrop-blur-sm border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Gem className="w-5 h-5 text-blue-400" />
            Exchange Gems for Orbs
          </CardTitle>
          <CardDescription className="text-gray-400">100 Gems = 1 Orb</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-white text-sm mb-2 block">Gems to Exchange:</label>
              <Input
                type="number"
                value={gemsToExchange}
                onChange={(e) => setGemsToExchange(Math.max(100, Number.parseInt(e.target.value) || 100))}
                min={100}
                step={100}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div className="flex items-center gap-2 text-white">
              <Gem className="w-4 h-4 text-blue-400" />
              <span>{gemsToExchange}</span>
              <ArrowRight className="w-4 h-4" />
              <Zap className="w-4 h-4 text-purple-400" />
              <span>{Math.floor(gemsToExchange / 100)}</span>
            </div>
          </div>
          <Button
            onClick={handleExchange}
            disabled={gameData.currency.gems < gemsToExchange}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-600 disabled:text-gray-400 border-purple-700"
          >
            <Gem className="w-4 h-4 mr-2" />
            Exchange {gemsToExchange} Gems → {Math.floor(gemsToExchange / 100)} Orbs
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
