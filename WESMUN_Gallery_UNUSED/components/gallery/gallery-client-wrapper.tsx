'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import type {Folder} from '@/lib/gallery'

// Dynamically import the actual client component with ssr disabled
const GalleryClient = dynamic(() => import('./gallery-client'), {ssr: false})

export default function GalleryClientWrapper({folders}: { folders: Folder[] }) {
    return <GalleryClient folders={folders}/>
}
