import fs from 'fs'
import path from 'path'
import sizeOf from 'image-size'

const ROOT = path.join(process.cwd(), 'public', 'images')
const OUT = path.join(process.cwd(), 'public', 'gallery-manifest.json')

function isImage(file) {
    return /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(file)
}

function capitalizeSegment(s) {
    if (!s) return s
    // replace hyphens/underscores with spaces, trim, then capitalize first letter
    const cleaned = s.replace(/[-_]+/g, ' ').trim()
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

async function generate() {
    const folders = []
    if (!fs.existsSync(ROOT)) {
        await fs.promises.writeFile(OUT, JSON.stringify([]))
        console.log('No images directory, wrote empty manifest.')
        return
    }

    async function processDir(dirPath, relParts) {
        const entries = await fs.promises.readdir(dirPath, {withFileTypes: true})
        const images = []

        for (const entry of entries) {
            const entryPath = path.join(dirPath, entry.name)
            if (entry.isDirectory()) {
                await processDir(entryPath, [...relParts, entry.name])
            } else if (entry.isFile() && isImage(entry.name)) {
                let dims = {}
                try {
                    const d = sizeOf(entryPath)
                    dims = {width: d.width, height: d.height}
                } catch (e) {
                    dims = {}
                }

                const rawFolder = relParts.join('/') // use forward slashes for manifest
                const relPathForFile = rawFolder ? `${rawFolder}/${entry.name}` : entry.name
                const url = rawFolder
                    ? `/images/${relParts.map(encodeURIComponent).join('/')}/${encodeURIComponent(entry.name)}`
                    : `/images/${encodeURIComponent(entry.name)}`

                images.push({
                    path: relPathForFile,
                    filename: entry.name,
                    folder: rawFolder,
                    url,
                    ...dims,
                })
            }
        }

        if (images.length > 0) {
            const rawName = relParts.join('/')
            const title = relParts.length > 0 ? relParts.map(capitalizeSegment).join(' - ') : 'Root'
            folders.push({rawName, title, files: images})
        }
    }

    await processDir(ROOT, [])

    await fs.promises.writeFile(OUT, JSON.stringify(folders, null, 2))
    console.log('Wrote manifest to', OUT)
}

generate().catch((err) => {
    console.error('Failed to generate manifest:', err)
    process.exit(1)
})
