'use client'

import React from 'react'
import type {Folder} from '@/lib/gallery'

type Props = {
    folders: Folder[]
    activeFilters: Set<string>
    onToggleFilterAction: (raw: string) => void
}

export default function FilterBar({folders, activeFilters, onToggleFilterAction}: Props) {
    const isActive = (key: string) => activeFilters.has(key)

    return (
        <div className="flex gap-3 flex-wrap items-center mb-6">
            <button
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300"
                onClick={() => onToggleFilterAction('ALL')}
                aria-pressed={isActive('ALL')}
                style={{
                    background: isActive('ALL') ? '#D4AF37' : 'transparent',
                    color: isActive('ALL') ? '#000' : '#7a7a7a',
                    border: isActive('ALL') ? 'none' : '1px solid #333',
                    boxShadow: isActive('ALL') ? '0 4px 20px rgba(212, 175, 55, 0.25)' : 'none',
                    transform: isActive('ALL') ? 'translateY(-1px)' : 'none',
                    fontWeight: 600
                }}
                onMouseEnter={(e) => {
                    if (!isActive('ALL')) {
                        e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)'
                        e.currentTarget.style.color = '#D4AF37'
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isActive('ALL')) {
                        e.currentTarget.style.borderColor = '#333'
                        e.currentTarget.style.color = '#7a7a7a'
                    }
                }}
            >
                ALL
            </button>

            {folders.map((f) => (
                <button
                    key={f.rawName}
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300"
                    onClick={() => onToggleFilterAction(f.rawName)}
                    aria-pressed={isActive(f.rawName)}
                    style={{
                        background: isActive(f.rawName) ? '#D4AF37' : 'transparent',
                        color: isActive(f.rawName) ? '#000' : '#7a7a7a',
                        border: isActive(f.rawName) ? 'none' : '1px solid #333',
                        boxShadow: isActive(f.rawName) ? '0 4px 20px rgba(212, 175, 55, 0.25)' : 'none',
                        transform: isActive(f.rawName) ? 'translateY(-1px)' : 'none',
                        fontWeight: 600
                    }}
                    onMouseEnter={(e) => {
                        if (!isActive(f.rawName)) {
                            e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)'
                            e.currentTarget.style.color = '#D4AF37'
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isActive(f.rawName)) {
                            e.currentTarget.style.borderColor = '#333'
                            e.currentTarget.style.color = '#7a7a7a'
                        }
                    }}
                >
                    {f.title}
                </button>
            ))}
        </div>
    )
}
