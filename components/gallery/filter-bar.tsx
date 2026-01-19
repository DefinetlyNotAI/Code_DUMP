'use client'

import React from 'react'
import type {Folder} from '@/lib/gallery'

type Props = {
    folders: Folder[]
    active: string
    onSelectAction: (raw: string) => void
}

export default function FilterBar({folders, active, onSelectAction}: Props) {
    return (
        <div className="flex gap-3 flex-wrap items-center mb-6">
            <button
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    active === 'ALL'
                        ? 'bg-primary text-black shadow-[0_4px_20px_rgba(212,175,55,0.25)]'
                        : 'bg-transparent text-gray-400 border border-gray-800 hover:border-primary hover:text-primary hover:shadow-[0_2px_10px_rgba(212,175,55,0.15)]'
                }`}
                onClick={() => onSelectAction('ALL')}
                aria-pressed={active === 'ALL'}
                style={{
                    transform: active === 'ALL' ? 'translateY(-1px)' : 'none'
                }}
            >
                ALL
            </button>

            {folders.map((f) => (
                <button
                    key={f.rawName}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        active === f.rawName
                            ? 'bg-primary text-black shadow-[0_4px_20px_rgba(212,175,55,0.25)]'
                            : 'bg-transparent text-gray-400 border border-gray-800 hover:border-primary hover:text-primary hover:shadow-[0_2px_10px_rgba(212,175,55,0.15)]'
                    }`}
                    onClick={() => onSelectAction(f.rawName)}
                    aria-pressed={active === f.rawName}
                    style={{
                        transform: active === f.rawName ? 'translateY(-1px)' : 'none'
                    }}
                >
                    {f.title}
                </button>
            ))}
        </div>
    )
}
