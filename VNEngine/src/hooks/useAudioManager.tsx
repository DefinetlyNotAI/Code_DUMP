"use client"

import {useEffect, useRef, useState} from "react"

export const useAudioManager = () => {
    const [musicVolume, setMusicVolume] = useState(80)
    const [sfxVolume, setSfxVolume] = useState(80)

    const currentMusicRef = useRef<HTMLAudioElement | null>(null)
    const sfxPool = useRef<HTMLAudioElement[]>([])

    // Clean up audio elements on unmount
    useEffect(() => {
        return () => {
            if (currentMusicRef.current) {
                currentMusicRef.current.pause()
                currentMusicRef.current = null
            }

            sfxPool.current.forEach((audio) => {
                audio.pause()
            })
            sfxPool.current = []
        }
    }, [])

    // Update volume when it changes
    useEffect(() => {
        if (currentMusicRef.current) {
            currentMusicRef.current.volume = musicVolume / 100
        }
    }, [musicVolume])

    const playMusic = (musicFile: string) => {
        try {
            // Stop current music if playing
            if (currentMusicRef.current) {
                currentMusicRef.current.pause()
            }

            // Create new audio element
            const audio = new Audio(`/assets/audio/music/${musicFile}`)
            audio.loop = true
            audio.volume = musicVolume / 100

            // Handle loading errors
            audio.onerror = () => {
                console.warn(`Failed to load music: ${musicFile}`)
                currentMusicRef.current = null
            }

            // Start playing
            audio.play().catch((error) => {
                console.error("Failed to play music:", error)
            })

            currentMusicRef.current = audio
        } catch (error) {
            console.error("Error playing music:", error)
        }
    }

    const stopMusic = () => {
        if (currentMusicRef.current) {
            // Fade out
            const fadeInterval = setInterval(() => {
                if (currentMusicRef.current && currentMusicRef.current.volume > 0.1) {
                    currentMusicRef.current.volume -= 0.1
                } else {
                    if (currentMusicRef.current) {
                        currentMusicRef.current.pause()
                        currentMusicRef.current = null
                    }
                    clearInterval(fadeInterval)
                }
            }, 100)
        }
    }

    const playSfx = (sfxFile: string) => {
        try {
            // Create new audio element
            const audio = new Audio(`/assets/audio/sfx/${sfxFile}`)
            audio.volume = sfxVolume / 100

            // Handle loading errors
            audio.onerror = () => {
                console.warn(`Failed to load SFX: ${sfxFile}`)
                // Remove from pool when done
                sfxPool.current = sfxPool.current.filter((a) => a !== audio)
            }

            // Remove from pool when done
            audio.onended = () => {
                sfxPool.current = sfxPool.current.filter((a) => a !== audio)
            }

            // Add to pool and play
            sfxPool.current.push(audio)
            audio.play().catch((error) => {
                console.error("Failed to play SFX:", error)
                sfxPool.current = sfxPool.current.filter((a) => a !== audio)
            })
        } catch (error) {
            console.error("Error playing SFX:", error)
        }
    }

    return {
        playMusic,
        stopMusic,
        playSfx,
        setMusicVolume,
        setSfxVolume,
        musicVolume,
        sfxVolume,
    }
}
