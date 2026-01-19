import {NextRequest} from 'next/server'
import {PUBLIC_IMAGES_PATH, validateRequestedPaths} from '@/lib/gallery'
import fs from 'fs'
import path from 'path'
import yazl from 'yazl'
import {Readable} from 'stream'

export const runtime = 'node'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}))
        const {items, mode, filename} = body || {}
        const outName = typeof filename === 'string' && filename.trim().length ? filename : mode === 'all' ? 'gallery.zip' : 'selection.zip'

        const root = PUBLIC_IMAGES_PATH

        let filesToInclude: { abs?: string; rel: string; url?: string }[] = []
        const missing: string[] = []

        const hasLocalFs = fs.existsSync(root)

        if (hasLocalFs) {
            if (mode === 'all') {
                // Walk root synchronously (server-side)
                function walk(dir: string): string[] {
                    const all: string[] = []
                    const entries = fs.readdirSync(dir)
                    for (const e of entries) {
                        const full = path.join(dir, e)
                        const s = fs.statSync(full)
                        if (s.isDirectory()) all.push(...walk(full))
                        else all.push(full)
                    }
                    return all
                }

                const allFiles = walk(root).filter((p) => fs.statSync(p).isFile())
                filesToInclude = allFiles.map((abs) => ({abs, rel: path.relative(root, abs).split(path.sep).join('/')}))
            } else if (Array.isArray(items)) {
                const {valid, invalid} = validateRequestedPaths(root, items)
                if (invalid.length > 0) {
                    return new Response(JSON.stringify({error: 'Invalid paths', invalid}), {status: 400})
                }
                filesToInclude = valid.map((abs) => ({abs, rel: path.relative(root, abs).split(path.sep).join('/')}))
            } else {
                return new Response(JSON.stringify({error: 'No items specified'}), {status: 400})
            }
        } else {
            // Serverless fallback: read manifest or build file URLs (fetch from origin)
            const manifestPath = path.join(process.cwd(), 'public', 'gallery-manifest.json')
            let manifest: any[] = []
            if (fs.existsSync(manifestPath)) {
                try {
                    const raw = await fs.promises.readFile(manifestPath, 'utf-8')
                    manifest = JSON.parse(raw)
                } catch (e) {
                    manifest = []
                }
            }

            const origin = (() => {
                try {
                    const url = new URL(req.url)
                    return url.origin
                } catch (e) {
                    return ''
                }
            })()

            if (mode === 'all') {
                // include everything from manifest if available
                if (manifest.length === 0) {
                    return new Response(JSON.stringify({error: 'No filesystem access and manifest not found'}), {status: 500})
                }
                for (const f of manifest) {
                    for (const file of f.files || []) {
                        const rel = `${f.rawName}/${file.filename}`
                        const url = origin ? `${origin}/images/${encodeURIComponent(f.rawName)}/${encodeURIComponent(file.filename)}` : undefined
                        filesToInclude.push({rel, url})
                    }
                }
            } else if (Array.isArray(items)) {
                if (manifest.length === 0) {
                    return new Response(JSON.stringify({error: 'No filesystem access and manifest not found'}), {status: 500})
                }
                const manifestMap = new Map<string, any[]>()
                for (const f of manifest) manifestMap.set(f.rawName, f.files || [])
                for (const item of items) {
                    // item expected like: folder/filename.ext
                    const parts = item.split('/')
                    if (parts.length < 2) {
                        missing.push(item)
                        continue
                    }
                    const folder = parts.shift()!
                    const filenamePart = parts.join('/')
                    const filesInFolder = manifestMap.get(folder) || []
                    const matched = filesInFolder.find((x) => x.filename === filenamePart)
                    if (!matched) {
                        missing.push(item)
                        continue
                    }
                    const url = origin ? `${origin}/images/${encodeURIComponent(folder)}/${encodeURIComponent(filenamePart)}` : undefined
                    filesToInclude.push({rel: `${folder}/${filenamePart}`, url})
                }
                if (missing.length > 0) {
                    return new Response(JSON.stringify({error: 'Missing files in manifest', missing}), {status: 400})
                }
            } else {
                return new Response(JSON.stringify({error: 'No items specified'}), {status: 400})
            }
        }

        const zipfile = new yazl.ZipFile()

        if (hasLocalFs) {
            // Add files directly from disk (streamed by yazl)
            for (const f of filesToInclude) {
                if (!f.abs) continue
                // ensure file still exists
                if (!fs.existsSync(f.abs)) {
                    missing.push(f.rel)
                    continue
                }
                zipfile.addFile(f.abs, f.rel)
            }
        } else {
            // serverless: fetch each file and add as buffer to zip
            const concurrency = 3
            const queue = [...filesToInclude]
            const worker = async () => {
                while (queue.length) {
                    const item = queue.shift()
                    if (!item) break
                    try {
                        if (!item.url) {
                            missing.push(item.rel)
                        } else {
                            const res = await fetch(item.url)
                            if (!res.ok) {
                                missing.push(item.rel)
                            } else {
                                const buf = Buffer.from(await res.arrayBuffer())
                                zipfile.addBuffer(buf, item.rel)
                            }
                        }
                    } catch (e) {
                        missing.push(item.rel)
                    }
                }
            }
            // run small pool of workers sequentially
            const workers: Promise<void>[] = []
            for (let i = 0; i < concurrency; i++) workers.push(worker())
            await Promise.all(workers)
        }

        if (missing.length > 0) {
            const txt = missing.join('\n')
            zipfile.addBuffer(Buffer.from(`MISSING_FILES\n${txt}`), 'MISSING_FILES.txt')
        }

        zipfile.end()

        // Convert Node stream (zipfile.outputStream) to Web ReadableStream accepted by Response
        const nodeStream = zipfile.outputStream
        const webStream = Readable.toWeb(nodeStream)

        return new Response(webStream as unknown as BodyInit, {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${outName}"`,
            },
        })
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e)
        return new Response(JSON.stringify({error: 'Server error'}), {status: 500})
    }
}
