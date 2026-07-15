"use client"

import {useEffect, useRef, useState} from "react"
import {DialogueBox} from "./DialogueBox"
import {ChoiceSystem} from "./ChoiceSystem"
import {EventViewer} from "./EventViewer"
import {ControlPanel} from "./ControlPanel"
import {useGameState} from "../hooks/useGameState"
import {useAudioManager} from "../hooks/useAudioManager"
import {parseCondition} from "../utils/conditionParser"
import {SceneBackground} from "./SceneBackground"
import {SaveLoadMenu} from "./SaveLoadMenu"

export const NovelEngine = () => {
    // noinspection JSUnusedLocalSymbols
    const {
        gameState,
        currentEvent,
        currentNodeIndex,
        choices,
        setCurrentEvent,
        setCurrentNodeIndex,
        updateChoice,
        markEventStatus,
        eventStatus,
        resetNodeIndex,
        saveGame,
        loadGame,
    } = useGameState()

    const {playMusic, playSfx, stopMusic, setMusicVolume, setSfxVolume} = useAudioManager()

    const [isLoading, setIsLoading] = useState(true)
    const [currentNode, setCurrentNode] = useState<any>(null)
    const [showEventViewer, setShowEventViewer] = useState(false)
    const [showSaveLoadMenu, setShowSaveLoadMenu] = useState(false)
    const [textSpeed, setTextSpeed] = useState(30) // ms per character
    const [autoMode, setAutoMode] = useState(false)
    const autoModeTimeoutRef = useRef<number | null>(null)
    const [orderData, setOrderData] = useState<any[]>([])
    const [allEvents, setAllEvents] = useState<Record<string, any>>({})

    // Reset state to the beginning on page refresh
    useEffect(() => {
        setCurrentEvent(null)
        setCurrentNodeIndex(0)
        setCurrentNode(null)
        setShowEventViewer(false)
        setShowSaveLoadMenu(false)
        setTextSpeed(30)
        setAutoMode(false)
        setAllEvents({})
    }, [])

    // Load order.json on mount
    useEffect(() => {
        const loadOrderData = async () => {
            try {
                const response = await fetch("/data/order.json")
                const data = await response.json()
                setOrderData(data)
                setIsLoading(false)

                // If no current event is set, start with the first one
                if (!currentEvent) {
                    const firstEvent = data[0].event
                    await loadEvent(firstEvent)
                } else {
                    // Resume from saved state
                    await loadEvent(currentEvent)
                }
            } catch (error) {
                console.error("Failed to load order.json:", error)
                setIsLoading(false)
            }
        }

        loadOrderData().catch((error) => {
            console.error("Error in loadOrderData:", error)
        })
    }, [])

    // Load all events for the event viewer
    useEffect(() => {
        const loadAllEvents = async () => {
            const events: Record<string, any> = {}

            for (const item of orderData) {
                if (item.event && !events[item.event]) {
                    try {
                        const response = await fetch(`/data/${item.event}`)
                        events[item.event] = await response.json()
                    } catch (error) {
                        console.error(`Failed to load event ${item.event}:`, error)
                    }
                }
            }

            setAllEvents(events)
        }

        if (orderData.length > 0) {
            loadAllEvents().catch((error) => {
                console.error("Error in loadAllEvents:", error)
            })
        }
    }, [orderData])

    // Auto mode handler
    useEffect(() => {
        if (autoMode && currentNode && currentNode.type !== "choice") {
            const textLength = currentNode.text?.length || 0
            const autoDelay = textLength * textSpeed + 2000 // Base delay + text typing time

            autoModeTimeoutRef.current = window.setTimeout(() => {
                handleAdvance()
            }, autoDelay)
        }

        return () => {
            if (autoModeTimeoutRef.current) {
                clearTimeout(autoModeTimeoutRef.current)
            }
        }
    }, [autoMode, currentNode, currentNodeIndex])

    const loadEvent = async (eventName: string) => {
        try {
            setIsLoading(true)
            const response = await fetch(`/data/${eventName}`)
            const data = await response.json()
            setCurrentEvent(eventName)
            resetNodeIndex()
            setCurrentNode(data[0])
            markEventStatus(eventName, "pending")
            setIsLoading(false)
        } catch (error) {
            console.error(`Failed to load event ${eventName}:`, error)
            setIsLoading(false)
        }
    }

    const findNextEvent = () => {
        if (!orderData.length) return null

        const currentEventIndex = orderData.findIndex((item) => item.event === currentEvent)

        if (currentEventIndex === -1) return orderData[0].event

        // Check for next events based on conditions
        for (let i = currentEventIndex + 1; i < orderData.length; i++) {
            const item = orderData[i]

            // If there's no condition, or the condition is met
            if (!item.condition || parseCondition(item.condition, choices)) {
                return item.event
            } else {
                // Mark skipped events
                if (item.event) {
                    markEventStatus(item.event, "skipped")
                }
            }
        }

        return null // No more events
    }

    const handleAdvance = () => {
        if (showEventViewer || showSaveLoadMenu) return

        if (isLoading) return

        if (!currentEvent || !currentNode) return

        // Handle current node effects
        if (currentNode.effect) {
            // Handle variable assignments
            if (typeof currentNode.effect === "object") {
                Object.entries(currentNode.effect).forEach(([key, value]) => {
                    updateChoice(key, value)
                })
            }
        }

        // Handle audio
        if (currentNode.music) {
            if (currentNode.music === "stop") {
                stopMusic()
            } else {
                playMusic(currentNode.music)
            }
        }

        if (currentNode.sfx) {
            if (Array.isArray(currentNode.sfx)) {
                currentNode.sfx.forEach((sound: string) => playSfx(sound))
            } else {
                playSfx(currentNode.sfx)
            }
        }

        // Handle jump to another event
        if (currentNode.type === "jump" && currentNode.target) {
            markEventStatus(currentEvent, "completed")
            loadEvent(currentNode.target).catch((error) => {
                console.error("Error in loadEvent:", error)
            })
            return
        }

        // Get the current event data
        fetch(`/data/${currentEvent}`)
            .then((res) => res.json())
            .then((eventData) => {
                const nextNodeIndex = currentNodeIndex + 1

                // If we have more nodes in this event
                if (nextNodeIndex < eventData.length) {
                    setCurrentNodeIndex(nextNodeIndex)
                    setCurrentNode(eventData[nextNodeIndex])
                } else {
                    // Event completed, find the next event
                    markEventStatus(currentEvent, "completed")
                    const nextEvent = findNextEvent()

                    if (nextEvent) {
                        loadEvent(nextEvent).catch((error) => {
                            console.error("Error in loadEvent:", error)
                        })
                    } else {
                        console.log("Game completed!")
                        // Handle game completion
                    }
                }
            })
            .catch((error) => {
                console.error("Error advancing to next node:", error)
            })
    }

    const handleChoiceSelected = (choiceKey: string, choiceValue: any) => {
        updateChoice(choiceKey, choiceValue)
        handleAdvance()
    }

    const handleReplayEvent = (eventName: string) => {
        setShowEventViewer(false)
        loadEvent(eventName).catch((error) => {
            console.error("Error in loadEvent:", error)
        })
    }

    const handleKeyDown = (e: KeyboardEvent) => {
        if (showEventViewer || showSaveLoadMenu) return

        if (e.key === " " || e.key === "Enter") {
            if (currentNode?.type !== "choice") {
                e.preventDefault()
                handleAdvance()
            }
        }
    }

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [currentNode, showEventViewer, showSaveLoadMenu])

    if (isLoading) {
        return <div className="loading">Loading...</div>
    }

    return (
        <div className="novel-engine">
            <SceneBackground background={currentNode?.background} effect={currentNode?.effect}/>

            {!showEventViewer && !showSaveLoadMenu && (
                <>
                    {currentNode?.type === "choice" ? (
                        <ChoiceSystem choices={currentNode.choices} onChoiceSelectedAction={handleChoiceSelected}/>
                    ) : (
                        <DialogueBox
                            text={currentNode?.text || ""}
                            speaker={currentNode?.speaker}
                            textSpeed={textSpeed}
                            onComplete={autoMode ? undefined : handleAdvance}
                        />
                    )}
                </>
            )}

            {showEventViewer && (
                <EventViewer
                    events={allEvents}
                    eventStatus={eventStatus}
                    onCloseAction={() => setShowEventViewer(false)}
                    onReplayEventAction={handleReplayEvent}
                />
            )}

            {showSaveLoadMenu && (
                <SaveLoadMenu onSaveAction={saveGame} onLoadAction={loadGame}
                              onCloseAction={() => setShowSaveLoadMenu(false)}/>
            )}

            <ControlPanel
                textSpeed={textSpeed}
                setTextSpeedAction={setTextSpeed}
                autoMode={autoMode}
                setAutoModeAction={setAutoMode}
                onEventViewerToggleAction={() => {
                    setShowEventViewer(!showEventViewer)
                    setShowSaveLoadMenu(false)
                }}
                onSaveLoadToggleAction={() => {
                    setShowSaveLoadMenu(!showSaveLoadMenu)
                    setShowEventViewer(false)
                }}
                musicVolume={80}
                sfxVolume={80}
                onMusicVolumeChangeAction={setMusicVolume}
                onSfxVolumeChangeAction={setSfxVolume}
            />
        </div>
    )
}

