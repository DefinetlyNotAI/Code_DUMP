"use client"

import {useState} from "react"
import {FastForward, FileText, Pause, Play, Rewind, Save, Settings, Volume2, VolumeX} from "lucide-react"

interface ControlPanelProps {
    textSpeed: number
    setTextSpeedAction: (speed: number) => void
    autoMode: boolean
    setAutoModeAction: (auto: boolean) => void
    onEventViewerToggleAction: () => void
    onSaveLoadToggleAction: () => void
    musicVolume: number
    sfxVolume: number
    onMusicVolumeChangeAction: (volume: number) => void
    onSfxVolumeChangeAction: (volume: number) => void
}

export const ControlPanel = ({
                                 textSpeed,
                                 setTextSpeedAction,
                                 autoMode,
                                 setAutoModeAction,
                                 onEventViewerToggleAction,
                                 onSaveLoadToggleAction,
                                 musicVolume,
                                 sfxVolume,
                                 onMusicVolumeChangeAction,
                                 onSfxVolumeChangeAction,
                             }: ControlPanelProps) => {
    const [showSettings, setShowSettings] = useState(false)
    const [isMuted, setIsMuted] = useState(false)

    const toggleMute = () => {
        setIsMuted(!isMuted)
        if (!isMuted) {
            onMusicVolumeChangeAction(0)
            onSfxVolumeChangeAction(0)
        } else {
            onMusicVolumeChangeAction(musicVolume)
            onSfxVolumeChangeAction(sfxVolume)
        }
    }

    return (
        <div className="control-panel">
            <div className="main-controls">
                <button
                    className={`control-button ${autoMode ? "active" : ""}`}
                    onClick={() => setAutoModeAction(!autoMode)}
                    title="Auto Mode"
                >
                    {autoMode ? <Pause size={18}/> : <Play size={18}/>}
                </button>

                <button className="control-button" onClick={onEventViewerToggleAction} title="Event Viewer">
                    <FileText size={18}/>
                </button>

                <button className="control-button" onClick={onSaveLoadToggleAction} title="Save/Load">
                    <Save size={18}/>
                </button>

                <button className="control-button" onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
                    {isMuted ? <VolumeX size={18}/> : <Volume2 size={18}/>}
                </button>

                <button className="control-button" onClick={() => setShowSettings(!showSettings)} title="Settings">
                    <Settings size={18}/>
                </button>
            </div>

            {showSettings && (
                <div className="settings-panel">
                    <div className="setting-group">
                        <label>Text Speed:</label>
                        <div className="speed-controls">
                            <button onClick={() => setTextSpeedAction(Math.min(textSpeed + 10, 100))}>
                                <Rewind size={14}/>
                            </button>
                            <span>{textSpeed}ms</span>
                            <button onClick={() => setTextSpeedAction(Math.max(textSpeed - 10, 10))}>
                                <FastForward size={14}/>
                            </button>
                        </div>
                    </div>

                    <div className="setting-group">
                        <label>Music Volume:</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={musicVolume}
                            onChange={(e) => onMusicVolumeChangeAction(Number(e.target.value))}
                        />
                    </div>

                    <div className="setting-group">
                        <label>SFX Volume:</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={sfxVolume}
                            onChange={(e) => onSfxVolumeChangeAction(Number(e.target.value))}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
