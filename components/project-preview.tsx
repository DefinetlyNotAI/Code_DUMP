"use client"

import {useState} from "react"
import {Loader2} from "lucide-react"

interface ProjectPreviewProps {
    url: string
    title: string
}

export function ProjectPreview({url, title}: ProjectPreviewProps) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    const handleLoad = () => {
        setLoading(false)
    }

    const handleError = () => {
        setLoading(false)
        setError(true)
    }

    return (
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
                </div>
            )}

            {error ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                    <div className="text-center">
                        <div className="text-4xl font-bold opacity-20 mb-2">{title[0]}</div>
                        <div className="text-xs">Preview unavailable</div>
                    </div>
                </div>
            ) : (
                <iframe
                    src={`/api/preview?url=${encodeURIComponent(url)}`}
                    title={`Preview of ${title}`}
                    className="h-full w-full scale-[0.5] origin-top-left"
                    style={{width: "200%", height: "200%"}}
                    onLoad={handleLoad}
                    onError={handleError}
                    sandbox="allow-same-origin"
                />
            )}
        </div>
    )
}
