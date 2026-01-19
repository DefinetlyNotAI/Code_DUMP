import React from 'react'
import {readImageTree} from '@/lib/gallery'
import dynamic from 'next/dynamic'

// Load client component dynamically to avoid SSR hydration mismatch
const GalleryClient = dynamic(() => import('@/components/gallery/gallery-client'), {ssr: false})

export default async function GalleryPage() {
    const folders = await readImageTree()

    return (
        <main className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-6">
                    <h1 className="text-2xl font-semibold">WESMUN Photo Gallery</h1>
                    <p className="text-sm text-muted-foreground mt-1">Browse official WESMUN photos. Filter by category,
                        select images and download.</p>
                </header>

                <GalleryClient folders={folders}/>
            </div>
        </main>
    )
}
