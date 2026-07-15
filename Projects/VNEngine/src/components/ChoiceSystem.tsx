"use client"

import {useState} from "react"
import {useAudioManager} from "../hooks/useAudioManager"

interface Choice {
    text: string
    value: any
}

interface ChoiceSystemProps {
    choices: Array<{
        text: string
        value: any
    }>
    onChoiceSelectedAction: (choiceKey: string, choiceValue: any) => void // Renamed prop
}

export const ChoiceSystem = ({choices, onChoiceSelectedAction}: ChoiceSystemProps) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const {playSfx} = useAudioManager()

    const handleHover = (index: number) => {
        if (hoveredIndex !== index) {
            setHoveredIndex(index)
            playSfx("hover")
        }
    }

    const handleClick = (choice: Choice) => {
        playSfx("select")
        onChoiceSelectedAction("user_choice", choice.value) // Updated usage
    }

    return (
        <div className="choice-system">
            <div className="choices-container">
                {choices.map((choice, index) => (
                    <button
                        key={index}
                        className={`choice-button ${hoveredIndex === index ? "hovered" : ""}`}
                        onMouseEnter={() => handleHover(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        onClick={() => handleClick(choice)}
                    >
                        {choice.text}
                    </button>
                ))}
            </div>
        </div>
    )
}
