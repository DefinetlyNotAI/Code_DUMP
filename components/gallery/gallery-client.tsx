'use client'

import React, {useCallback, useEffect, useMemo, useState} from 'react'
import type {Folder} from '@/lib/gallery'
import FilterBar from './filter-bar'
import GalleryGrid from './gallery-grid'
import DownloadToolbar from './download-toolbar'

export default function GalleryClient({folders}: { folders: Folder[] }) {
    const ALL_KEY = 'ALL'
    const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set([ALL_KEY]))
    const [selected, setSelected] = useState<Set<string>>(new Set())

    // Handle filter toggle
    const toggleFilter = useCallback((filterKey: string) => {
        setActiveFilters((prev) => {
            const next = new Set(prev)

            if (filterKey === ALL_KEY) {
                // If ALL is clicked, clear all other filters and select only ALL
                return new Set([ALL_KEY])
            } else {
                // Remove ALL if it's present
                next.delete(ALL_KEY)

                // Toggle the clicked filter
                if (next.has(filterKey)) {
                    next.delete(filterKey)
                } else {
                    next.add(filterKey)
                }

                // If no filters remain, select ALL
                if (next.size === 0) {
                    return new Set([ALL_KEY])
                }
            }

            return next
        })
    }, [ALL_KEY])

    // Visible images: include files based on active filters
    const visibleImages = useMemo(() => {
        if (activeFilters.has(ALL_KEY)) {
            return folders.flatMap((f) => f.files)
        }

        const activeArray = Array.from(activeFilters)
        const matched = folders.filter((f) => {
            const raw = (f.rawName || '').replace(/^\/+|\/+$/g, '')

            // Check if this folder matches any active filter
            return activeArray.some(activeFilter => {
                const normActive = activeFilter.replace(/^\/+|\/+$/g, '')
                return raw === normActive || raw.startsWith(`${normActive}/`)
            })
        })

        return matched.flatMap((f) => f.files)
    }, [activeFilters, folders])

    const toggleSelect = useCallback((path: string) => {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(path)) next.delete(path)
            else next.add(path)
            return next
        })
    }, [])

    const clearSelection = useCallback(() => setSelected(new Set()), [])

    const downloadBlob = async (res: Response, defaultName: string) => {
        if (!res.ok) {
            const txt = await res.text().catch(() => 'Download failed')
            alert(txt)
            return
        }
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = defaultName
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
    }

    const onDownloadSelected = useCallback(async () => {
        if (selected.size === 0) return
        const items = Array.from(selected)
        const res = await fetch('/api/download', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({items}),
        })
        await downloadBlob(res, 'selection.zip')
    }, [selected])

    const onDownloadAll = useCallback(async () => {
        const res = await fetch('/api/download', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({mode: 'all'}),
        })
        await downloadBlob(res, 'gallery.zip')
    }, [])

    // toolbar id (serializable)
    const toolbarId = useMemo(() => 'download-toolbar-' + Math.random().toString(36).slice(2, 8), [])

    useEffect(() => {
        const root = document.getElementById(toolbarId)
        if (!root) return
        const handler = (e: Event) => {
            const target = e.target as HTMLElement
            const btn = target.closest('[data-action]') as HTMLElement | null
            if (!btn) return
            const action = btn.getAttribute('data-action')
            if (action === 'download-selected') {
                void onDownloadSelected()
            } else if (action === 'download-all') {
                void onDownloadAll()
            }
        }
        root.addEventListener('click', handler)
        return () => root.removeEventListener('click', handler)
    }, [toolbarId, onDownloadSelected, onDownloadAll])

    const selectedArray = useMemo(() => Array.from(selected), [selected])

    return (
        <div>
            <FilterBar
                folders={folders}
                activeFilters={activeFilters}
                onToggleFilterAction={toggleFilter}
            />

            <DownloadToolbar id={toolbarId} selectedCount={selected.size} totalCount={visibleImages.length}/>

            <GalleryGrid images={visibleImages} selected={selectedArray} onToggle={toggleSelect}/>

            {selected.size > 0 && (
                <div className="mt-8 text-center">
                    <button
                        className="px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                        onClick={clearSelection}
                        style={{
                            background: 'transparent',
                            color: '#D4AF37',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#D4AF37'
                            e.currentTarget.style.boxShadow = '0 2px 10px rgba(212, 175, 55, 0.15)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)'
                            e.currentTarget.style.boxShadow = 'none'
                        }}
                    >
                        Clear Selection
                    </button>
                </div>
            )}
        </div>
    )
}

