import React from 'react'
import {readImageTree} from '@/lib/gallery'
import GalleryClientWrapper from '@/components/gallery/gallery-client-wrapper'

export default async function GalleryPage() {
    const folders = await readImageTree()

    return (
        <main className="min-h-screen p-4 md:p-8" style={{background: '#000000'}}>
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 text-center">
                    <h1
                        className="text-4xl md:text-5xl font-bold mb-3"
                        style={{
                            background: 'linear-gradient(135deg, #D4AF37 0%, #E5C158 50%, #D4AF37 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            letterSpacing: '-0.02em'
                        }}
                    >
                        WESMUN Photo Gallery
                    </h1>
                    <p className="text-sm md:text-base max-w-2xl mx-auto" style={{color: '#7a7a7a'}}>
                        Browse official WESMUN photos. Filter by category, select images and download.
                    </p>
                    <div
                        className="w-24 h-1 mx-auto mt-4 rounded-full"
                        style={{
                            background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)'
                        }}
                    />
                </header>

                <GalleryClientWrapper folders={folders}/>
            </div>
        </main>
    )
}
