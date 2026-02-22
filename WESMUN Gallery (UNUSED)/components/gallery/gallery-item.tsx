'use client'

import React, {useState} from 'react'
import type {ImageItem} from '@/lib/gallery'
import {Check} from 'lucide-react'

type Props = {
    image: ImageItem
    isSelected: boolean
    onToggle: any
}

export default function GalleryItem({image, isSelected, onToggle}: Props) {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <figure
            className={`relative overflow-hidden cursor-pointer group ${isSelected ? 'selected' : ''}`}
            onClick={() => (onToggle as Function)()}
            role="button"
            tabIndex={0}
            aria-label={`${isSelected ? 'Deselect' : 'Select'} ${image.filename}`}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    (onToggle as Function)();
                }
            }}
            style={{margin: 0, padding: 0, display: 'block'}}
        >
            {/* Image container - no black space */}
            <div className="w-full relative" style={{background: 'transparent', margin: 0, padding: 0}}>
                {/* Loading skeleton */}
                {!isLoaded && (
                    <div
                        className="img--skeleton absolute inset-0"
                        style={{
                            minHeight: image.height && image.width
                                ? `${(image.height / image.width) * 100}%`
                                : '200px'
                        }}
                    />
                )}

                <img
                    src={image.url}
                    alt={image.filename}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-auto block transition-opacity duration-300"
                    style={{
                        aspectRatio: image.width && image.height
                            ? `${image.width} / ${image.height}`
                            : 'auto',
                        opacity: isLoaded ? 1 : 0,
                        objectFit: 'cover',
                        margin: 0,
                        padding: 0,
                        display: 'block'
                    }}
                    onLoad={() => setIsLoaded(true)}
                />
            </div>

            {/* Selection indicator - ONLY show when selected */}
            {isSelected && (
                <div className="select-indicator" style={{opacity: 1}}>
                    <Check
                        className="w-5 h-5"
                        style={{
                            color: '#000',
                            strokeWidth: 3
                        }}
                    />
                </div>
            )}

            {/* Selection overlay border */}
            {isSelected && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        border: '3px solid rgba(212, 175, 55, 0.8)',
                        borderRadius: '0',
                        boxShadow: 'inset 0 0 20px rgba(212, 175, 55, 0.25)'
                    }}
                />
            )}
        </figure>
    )
}
