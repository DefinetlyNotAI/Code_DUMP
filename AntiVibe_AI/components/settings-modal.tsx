"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"

interface SettingsModalProps {
  settings: {
    darkMode: boolean
    emojiMode: {
      enabled: boolean
      intensity: number
    }
    useContext: boolean
  }
  setSettings: React.Dispatch<
    React.SetStateAction<{
      darkMode: boolean
      emojiMode: {
        enabled: boolean
        intensity: number
      }
      useContext: boolean
    }>
  >
  onClose: () => void
}

export default function SettingsModal({ settings, setSettings, onClose }: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState(settings)
  const [activeTab, setActiveTab] = useState("general")

  useEffect(() => {
    // Add event listener to handle clicking outside the modal
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.classList.contains("modal-backdrop")) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  const handleSave = () => {
    setSettings(localSettings)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-backdrop">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-medium dark:text-white">Settings</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4 pt-2">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
            </TabsList>
          </div>

          <div className="p-4 space-y-4">
            <TabsContent value="general" className="space-y-4 mt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="context-toggle">Use Conversation History</Label>
                  <Switch
                    id="context-toggle"
                    checked={localSettings.useContext}
                    onCheckedChange={(checked) =>
                      setLocalSettings({
                        ...localSettings,
                        useContext: checked,
                      })
                    }
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  When enabled, the AI will remember previous messages in your conversation. When disabled, each message
                  will be treated as a new conversation.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="emoji-mode">Emoji Bombing</Label>
                  <Switch
                    id="emoji-mode"
                    checked={localSettings.emojiMode.enabled}
                    onCheckedChange={(checked) =>
                      setLocalSettings({
                        ...localSettings,
                        emojiMode: { ...localSettings.emojiMode, enabled: checked },
                      })
                    }
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enable to make the AI use emojis in its responses.
                </p>
              </div>

              {localSettings.emojiMode.enabled && (
                <div className="space-y-2">
                  <Label htmlFor="emoji-intensity">
                    Emoji Intensity:{" "}
                    {localSettings.emojiMode.intensity === 1
                      ? "Low"
                      : localSettings.emojiMode.intensity === 2
                        ? "Medium"
                        : "High"}
                  </Label>
                  <Slider
                    id="emoji-intensity"
                    min={1}
                    max={3}
                    step={1}
                    value={[localSettings.emojiMode.intensity]}
                    onValueChange={(value) =>
                      setLocalSettings({
                        ...localSettings,
                        emojiMode: { ...localSettings.emojiMode, intensity: value[0] },
                      })
                    }
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Control how many emojis the AI will use in its responses.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4 mt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <Switch
                    id="dark-mode"
                    checked={localSettings.darkMode}
                    onCheckedChange={(checked) => setLocalSettings({ ...localSettings, darkMode: checked })}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enable dark mode for a more comfortable viewing experience in low-light environments.
                </p>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end gap-2 p-4 border-t dark:border-gray-700">
          <Button variant="outline" onClick={onClose} className="dark:border-gray-600 dark:text-gray-200">
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </div>
    </div>
  )
}
