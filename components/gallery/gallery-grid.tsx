'use client'

import React, {useEffect, useState} from 'react'
import type {ImageItem} from '@/lib/gallery'
import GalleryItem from './gallery-item'

type Props = {
    images: ImageItem[]
    selected: string[]
    onToggle: any
}

export default function GalleryGrid({images, selected, onToggle}: Props) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Fade out, then fade in when images change
        setIsVisible(false);
        const timeout = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timeout);
    }, [images.length]);

    return (
        <section
            aria-label="Gallery"
            className="gallery-masonry"
            style={{
                contentVisibility: 'auto',
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 0.4s ease-in-out'
            }}
        >
            {images.map((img, index) => (
                <div
                    key={img.path}
                    className="gallery-item"
                    style={{
                        animationDelay: `${Math.min(index * 0.03, 0.6)}s`,
                        animation: isVisible ? 'slideUp 0.4s ease-out both' : 'none'
                    }}
                >
                    <GalleryItem
                        image={img}
                        isSelected={selected.includes(img.path)}
                        onToggle={() => (onToggle as Function)(img.path)}
                    />
                </div>
            ))}
            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </section>
    )
}
