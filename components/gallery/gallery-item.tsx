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
        >
            {/* Image container that respects natural aspect ratio */}
            <div className="w-full relative bg-black">
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
                    className="w-full h-auto object-contain block transition-opacity duration-300"
                    style={{
                        aspectRatio: image.width && image.height
                            ? `${image.width} / ${image.height}`
                            : 'auto',
                        opacity: isLoaded ? 1 : 0
                    }}
                    onLoad={() => setIsLoaded(true)}
                />
            </div>

            {/* Selection indicator with gold theme */}
            <div className="select-indicator">
                <Check
                    className="w-5 h-5"
                    style={{
                        color: isSelected ? '#000' : 'rgba(212, 175, 55, 0.8)',
                        strokeWidth: 3
                    }}
                />
            </div>

            {/* Selection overlay border */}
            {isSelected && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        border: '3px solid rgba(212, 175, 55, 0.6)',
                        borderRadius: '0',
                        boxShadow: 'inset 0 0 20px rgba(212, 175, 55, 0.2)'
                    }}
                />
            )}
        </figure>
    )
}
