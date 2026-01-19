'use client'

import React from 'react'
import type {ImageItem} from '@/lib/gallery'
import GalleryItem from './gallery-item'

type Props = {
    images: ImageItem[]
    selected: string[]
    onToggle: any
}

export default function GalleryGrid({images, selected, onToggle}: Props) {
    return (
        <section aria-label="Gallery" className="gallery-columns" style={{contentVisibility: 'auto'}}>
            <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                {images.map((img) => (
                    <div key={img.path} className="break-inside-avoid">
                        <GalleryItem image={img} isSelected={selected.includes(img.path)}
                                     onToggle={() => (onToggle as Function)(img.path)}/>
                    </div>
                ))}
            </div>
        </section>
    )
}
