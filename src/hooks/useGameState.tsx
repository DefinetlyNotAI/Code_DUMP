"use client"

import {useEffect, useState} from "react"

export const useGameState = () => {
    const [currentEvent, setCurrentEvent] = useState<string | null>(null)
    const [currentNodeIndex, setCurrentNodeIndex] = useState(0)
    const [choices, setChoices] = useState<Record<string, any>>({})
    const [eventStatus, setEventStatus] = useState<Record<string, string>>({})

    // Load state from localStorage on mount
    useEffect(() => {
        const savedState = localStorage.getItem("vn_game_state")
        if (savedState) {
            try {
                const {currentEvent, currentNodeIndex, choices, eventStatus} = JSON.parse(savedState)
                if (currentEvent) setCurrentEvent(currentEvent)
                if (currentNodeIndex !== undefined) setCurrentNodeIndex(currentNodeIndex)
                if (choices) setChoices(choices)
                if (eventStatus) setEventStatus(eventStatus)
            } catch (error) {
                console.error("Failed to load game state:", error)
            }
        }
    }, [])

    // Save state to localStorage when it changes
    useEffect(() => {
        if (currentEvent) {
            const gameState = {
                currentEvent,
                currentNodeIndex,
                choices,
                eventStatus,
            }
            localStorage.setItem("vn_game_state", JSON.stringify(gameState))
        }
    }, [currentEvent, currentNodeIndex, choices, eventStatus])

    const updateChoice = (key: string, value: any) => {
        setChoices((prev) => ({
            ...prev,
            [key]: value,
        }))
    }

    const markEventStatus = (eventName: string, status: "completed" | "skipped" | "pending") => {
        setEventStatus((prev) => ({
            ...prev,
            [eventName]: status,
        }))
    }

    const resetNodeIndex = () => {
        setCurrentNodeIndex(0)
    }

    const saveGame = (slotName: string) => {
        const saveData = {
            currentEvent,
            currentNodeIndex,
            choices,
            eventStatus,
            timestamp: new Date().toISOString(),
        }

        localStorage.setItem(`vn_save_${slotName}`, JSON.stringify(saveData))
    }

    const loadGame = (saveData: any) => {
        if (saveData.currentEvent) setCurrentEvent(saveData.currentEvent)
        if (saveData.currentNodeIndex !== undefined) setCurrentNodeIndex(saveData.currentNodeIndex)
        if (saveData.choices) setChoices(saveData.choices)
        if (saveData.eventStatus) setEventStatus(saveData.eventStatus)
    }

    return {
        gameState: {
            currentEvent,
            currentNodeIndex,
            choices,
            eventStatus,
        },
        currentEvent,
        currentNodeIndex,
        choices,
        eventStatus,
        setCurrentEvent,
        setCurrentNodeIndex,
        updateChoice,
        markEventStatus,
        resetNodeIndex,
        saveGame,
        loadGame,
    }
}
