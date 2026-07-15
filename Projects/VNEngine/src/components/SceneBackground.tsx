"use client"

import {useEffect, useRef, useState} from "react"

interface SceneBackgroundProps {
    background?: string
    effect?: string | object
}

export const SceneBackground = ({background, effect}: SceneBackgroundProps) => {
    const [currentBg, setCurrentBg] = useState<string | null>(null)
    const [transition, setTransition] = useState("")
    const errorLogged = useRef(false) // Track if the error has already been logged

    useEffect(() => {
        errorLogged.current = false // Reset error state when background changes
        if (background) {
            // Handle different transition effects
            if (effect === "fade") {
                setTransition("fade")
                setTimeout(() => {
                    setCurrentBg(background)
                    setTimeout(() => setTransition(""), 500)
                }, 500)
            } else if (effect === "glitch") {
                setTransition("glitch")
                setTimeout(() => {
                    setCurrentBg(background)
                    setTimeout(() => setTransition(""), 800)
                }, 300)
            } else {
                setCurrentBg(background)
            }
        } else {
            setCurrentBg(null) // Clear background if none is provided
        }
    }, [background, effect])

    // Determine if it's an image or video
    const isVideo = currentBg?.match(/\.(mp4|webm|ogg)$/i)

    return (
        <div className={`scene-background ${transition}`}>
            {currentBg && !isVideo && (
                <img
                    src={`/assets/backgrounds/${currentBg}`}
                    alt="Background"
                    onError={(e) => {
                        if (!errorLogged.current) {
                            console.warn(`Failed to load background: ${currentBg}: ${e.currentTarget.src}`)
                            errorLogged.current = true
                        }
                        setCurrentBg(null) // Remove background on error
                    }}
                />
            )}

            {currentBg && isVideo && (
                <video
                    autoPlay
                    loop
                    muted
                    onError={() => {
                        if (!errorLogged.current) {
                            console.warn(`Failed to load video background: ${currentBg}`)
                            errorLogged.current = true
                        }
                        setCurrentBg(null) // Remove background on error
                    }}
                >
                    <source src={`/assets/backgrounds/${currentBg}`}/>
                </video>
            )}
        </div>
    )
}
