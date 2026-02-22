import fs from 'fs'
import path from 'path'
import sizeOf from 'image-size'


export type ImageItem = {
    path: string // e.g. "opening_ceremony/photo.jpg"
    filename: string
    folder: string
    url: string // "/images/opening_ceremony/photo.jpg"
    width?: number
    height?: number
}

export type Folder = {
    rawName: string
    title: string
    files: ImageItem[]
}

const PUBLIC_IMAGES_PATH = path.join(process.cwd(), 'public', 'images')
const MANIFEST_PATH = path.join(process.cwd(), 'public', 'gallery-manifest.json')

function normalizeFolderName(raw: string): string {
    if (!raw) return raw

    // Handle common acronyms that should be uppercase
    const acronyms = ['WHO', 'AL', 'ECOSOC', 'F1', 'GA1', 'GA3', 'HCC', 'INTERPOL',
        'PBC', 'UNHRC', 'UNICEF', 'UNW', 'UNODC', 'UNOOSA', 'UNSC'];

    const upperRaw = raw.toUpperCase();
    if (acronyms.includes(upperRaw)) return upperRaw;

    // Replace underscores and hyphens with spaces
    const clean = raw.replace(/[_-]+/g, ' ').trim();

    // Title case each word
    return clean
        .split(' ')
        .map((w) => {
            if (!w.length) return w;
            // Check if entire word is an acronym
            if (acronyms.includes(w.toUpperCase())) return w.toUpperCase();
            // Normal title case
            return w[0].toUpperCase() + w.slice(1).toLowerCase();
        })
        .join(' ');
}

async function statImageSize(filePath: string): Promise<{ width?: number; height?: number }> {
    try {
        // Read file into a Buffer (Uint8Array is acceptable to image-size types)
        const data = await fs.promises.readFile(filePath)
        const dims = sizeOf(data as Buffer)
        return {width: dims.width || undefined, height: dims.height || undefined}
    } catch (e) {
        return {}
    }
}

async function readImageTreeFromFS(): Promise<Folder[]> {
    const root = PUBLIC_IMAGES_PATH
    if (!fs.existsSync(root)) return []

    const foldersMap: Record<string, Folder> = {}

    async function processDir(dirPath: string, relParts: string[]): Promise<void> {
        const entries = await fs.promises.readdir(dirPath, {withFileTypes: true})

        for (const entry of entries) {
            const entryPath = path.join(dirPath, entry.name)

            if (entry.isDirectory()) {
                await processDir(entryPath, [...relParts, entry.name])
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase()
                if (!['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg'].includes(ext)) continue

                // Determine top-level parent folder
                const topFolder = relParts.length > 0 ? relParts[0] : ''
                if (!topFolder) continue // Skip files in root

                const dims = await statImageSize(entryPath)

                // Build the relative path for this file
                const relPathForFile = [...relParts, entry.name].join('/')
                const urlParts = [...relParts, entry.name].map(encodeURIComponent)
                const url = `/images/${urlParts.join('/')}`

                if (!foldersMap[topFolder]) {
                    foldersMap[topFolder] = {
                        rawName: topFolder,
                        title: normalizeFolderName(topFolder),
                        files: []
                    }
                }

                foldersMap[topFolder].files.push({
                    path: relPathForFile,
                    filename: entry.name,
                    folder: topFolder,
                    url,
                    width: dims.width,
                    height: dims.height,
                })
            }
        }
    }

    await processDir(root, [])

    // Convert map to array and sort
    const folders = Object.values(foldersMap)
    folders.sort((a, b) => a.rawName.localeCompare(b.rawName))
    return folders
}

async function readImageTreeFromManifest(): Promise<Folder[]> {
    try {
        if (!fs.existsSync(MANIFEST_PATH)) return []
        const raw = await fs.promises.readFile(MANIFEST_PATH, 'utf-8')
        return JSON.parse(raw) as Folder[]
    } catch (e) {
        return []
    }
}

export async function readImageTree(): Promise<Folder[]> {
    // Try FS first; if unavailable (serverless), fall back to manifest
    try {
        return await readImageTreeFromFS()
    } catch (e) {
        return await readImageTreeFromManifest()
    }
}

export function validateRequestedPaths(rootPublicImages: string, requested: string[]): {
    valid: string[];
    invalid: string[]
} {
    const valid: string[] = []
    const invalid: string[] = []
    for (const p of requested) {
        // Normalize path separators
        if (p.includes('..') || path.isAbsolute(p)) {
            invalid.push(p)
            continue
        }
        const resolved = path.resolve(rootPublicImages, p)
        if (!resolved.startsWith(rootPublicImages)) {
            invalid.push(p)
            continue
        }
        if (!fs.existsSync(resolved)) {
            invalid.push(p)
            continue
        }
        valid.push(resolved)
    }
    return {valid, invalid}
}

export {normalizeFolderName, PUBLIC_IMAGES_PATH}
