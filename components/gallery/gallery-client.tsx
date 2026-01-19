'use client'

import React, {useCallback, useEffect, useMemo, useState} from 'react'
import type {Folder} from '@/lib/gallery'
import FilterBar from './filter-bar'
import GalleryGrid from './gallery-grid'
import DownloadToolbar from './download-toolbar'

export default function GalleryClient({folders}: { folders: Folder[] }) {
    const ALL_KEY = 'ALL'
    const [active, setActive] = useState<string>(ALL_KEY)
    const [selected, setSelected] = useState<Set<string>>(new Set())

    // Visible images: include files in the selected folder and any of its nested subfolders
    const visibleImages = useMemo(() => {
        if (active === ALL_KEY) return folders.flatMap((f) => f.files)

        // Normalize active: remove leading/trailing slashes
        const normActive = active.replace(/^\/+|\/+$/g, '')

        // If normalized active is empty, fall back to showing everything
        if (normActive === '') return folders.flatMap((f) => f.files)

        const matched = folders.filter((f) => {
            const raw = (f.rawName || '').replace(/^\/+|\/+$/g, '')
            return raw === normActive || raw.startsWith(`${normActive}/`)
        })

        return matched.flatMap((f) => f.files)
    }, [active, folders])

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
            <FilterBar folders={folders} active={active} onSelectAction={(raw) => setActive(raw)}/>

            <DownloadToolbar id={toolbarId} selectedCount={selected.size} totalCount={visibleImages.length}/>

            <GalleryGrid images={visibleImages} selected={selectedArray} onToggle={toggleSelect}/>

            <div className="mt-6 text-sm text-muted-foreground">
                <button className="underline" onClick={clearSelection} disabled={selected.size === 0}>
                    Clear selection
                </button>
            </div>
        </div>
    )
}
