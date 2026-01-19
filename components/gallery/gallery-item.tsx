'use client'

import React from 'react'
import type {ImageItem} from '@/lib/gallery'
import {Badge} from '@/components/ui/badge'
import {Check} from 'lucide-react'

type Props = {
    image: ImageItem
    isSelected: boolean
    onToggle: any
}

export default function GalleryItem({image, isSelected, onToggle}: Props) {
    const aspectStyle = image.width && image.height ? {aspectRatio: `${image.width} / ${image.height}`} : {aspectRatio: '4 / 3'}

    return (
        <figure className="relative rounded-md overflow-hidden bg-muted-foreground/5 border">
            <div className="w-full bg-transparent flex items-center justify-center" style={aspectStyle}>
                <img
                    src={image.url}
                    alt={image.filename}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain"
                    style={{display: 'block'}}
                />
            </div>

            <figcaption className="flex items-center justify-between px-2 py-1 text-xs text-muted-foreground">
                <span className="truncate">{image.filename}</span>
                <Badge variant="default" className="ml-2">
                    {image.folder}
                </Badge>
            </figcaption>

            <button
                onClick={() => (onToggle as Function)()}
                aria-pressed={isSelected}
                aria-label={`${isSelected ? 'Deselect' : 'Select'} ${image.filename}`}
                className={`absolute top-2 right-2 rounded-full p-1 transition-all focus:outline-none ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-background/80 text-foreground/80'}`}
                style={{backdropFilter: 'saturate(120%) blur(6px)'}}
            >
                <Check className="size-4"/>
            </button>

            {isSelected &&
                <div className="absolute inset-0 pointer-events-none border-4 border-primary/40 rounded-md"/>}
        </figure>
    )
}
