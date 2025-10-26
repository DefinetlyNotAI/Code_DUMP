"use client"

import {useEffect, useRef, useState} from "react"

interface DialogueBoxProps {
    text: string
    speaker: string | null
    textSpeed: number
    onComplete?: () => void
}

export const DialogueBox = ({text, speaker, textSpeed, onComplete}: DialogueBoxProps) => {
    const [displayedText, setDisplayedText] = useState("")
    const [isComplete, setIsComplete] = useState(false)
    const [isTyping, setIsTyping] = useState(false)
    const typingIntervalRef = useRef<number | null>(null)
    const fullTextRef = useRef(text)

    useEffect(() => {
        // Reset when text changes
        fullTextRef.current = text
        setDisplayedText("")
        setIsComplete(false)
        setIsTyping(true)

        if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current)
        }

        // Start typewriter effect
        let charIndex = -1;

        // Start typewriter effect
        typingIntervalRef.current = window.setInterval(() => {
            charIndex++;
            if (charIndex < text.length) {
                setDisplayedText((prev) => prev + text.charAt(charIndex));
            } else {
                setIsTyping(false)
                setIsComplete(true)
                if (typingIntervalRef.current) {
                    clearInterval(typingIntervalRef.current)
                    typingIntervalRef.current = null
                }
            }
        }, textSpeed)

        return () => {
            if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current)
            }
        }
    }, [text, textSpeed])

    const handleClick = () => {
        // If still typing, complete the text immediately
        if (isTyping) {
            if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current)
                typingIntervalRef.current = null
            }
            setDisplayedText(fullTextRef.current)
            setIsTyping(false)
            setIsComplete(true)
        } else if (isComplete && onComplete) {
            // If already complete, advance to next
            onComplete()
        }
    }

    return (
        <div className="dialogue-box" onClick={handleClick}>
            {speaker && <div className="speaker">{speaker}</div>}
            <div className="text-content">{displayedText}</div>
            {isComplete && <div className="continue-indicator">▼</div>}
        </div>
    )
}
