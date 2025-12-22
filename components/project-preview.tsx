"use client"

import {useState, useEffect} from "react"
import {Loader2, ExternalLink} from "lucide-react"

interface ProjectPreviewProps {
    url: string
    title: string
}

export function ProjectPreview({url, title}: ProjectPreviewProps) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string>("")

    const handleLoad = () => {
        setLoading(false)
        setError(false)
    }

    const handleError = () => {
        setLoading(false)
        setError(true)
        setErrorMessage("Preview unavailable - site blocks iframe embedding")
    }

    // Set a timeout to detect if iframe is stuck loading
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (loading) {
                setLoading(false)
                setError(true)
                setErrorMessage("Preview timed out - site may block iframe embedding")
            }
        }, 15000) // 15 second timeout

        return () => clearTimeout(timeout)
    }, [loading])

    return (
        <div className="relative aspect-video w-full overflow-hidden bg-muted rounded-lg border border-border">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/80 backdrop-blur-sm z-10">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2"/>
                        <p className="text-xs text-muted-foreground">Loading preview...</p>
                    </div>
                </div>
            )}

            {error ? (
                <div className="flex h-full items-center justify-center text-muted-foreground p-4">
                    <div className="text-center">
                        <div className="text-4xl font-bold opacity-20 mb-3">{title[0]}</div>
                        <div className="text-sm mb-3">{errorMessage}</div>
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs text-primary hover:underline"
                        >
                            <ExternalLink className="h-3 w-3"/>
                            Open in new tab
                        </a>
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
                    sandbox="allow-same-origin allow-scripts allow-forms"
                />
            )}
        </div>
    )
}
