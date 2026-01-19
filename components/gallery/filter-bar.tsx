'use client'

import React from 'react'
import type {Folder} from '@/lib/gallery'

type Props = {
    folders: Folder[]
    active: string
    onSelect: any
}

export default function FilterBar({folders, active, onSelect}: Props) {
    return (
        <div className="flex gap-2 flex-wrap items-center mb-4">
            <button
                className={`px-3 py-1 rounded-md text-sm font-medium ${active === 'ALL' ? 'bg-primary text-primary-foreground' : 'border bg-transparent text-foreground/80'}`}
                onClick={() => (onSelect as Function)('ALL')}
                aria-pressed={active === 'ALL'}
            >
                ALL
            </button>

            {folders.map((f) => (
                <button
                    key={f.rawName}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${active === f.rawName ? 'bg-primary text-primary-foreground' : 'border bg-transparent text-foreground/80'}`}
                    onClick={() => (onSelect as Function)(f.rawName)}
                    aria-pressed={active === f.rawName}
                >
                    {f.title}
                </button>
            ))}
        </div>
    )
}
