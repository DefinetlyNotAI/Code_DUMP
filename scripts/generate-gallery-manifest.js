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
    const cleaned = s.replace(/[-_]+/g, ' ').trim()
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

async function generate() {
    if (!fs.existsSync(ROOT)) {
        await fs.promises.writeFile(OUT, JSON.stringify([]))
        console.log('No images directory, wrote empty manifest.')
        return
    }

    const foldersMap = {} // key: top-level folder, value: {title, files}

    async function processDir(dirPath, relParts) {
        const entries = await fs.promises.readdir(dirPath, {withFileTypes: true})

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

                // Determine top-level parent folder
                const topFolder = relParts.length > 0 ? relParts[0] : ''
                const title = topFolder ? capitalizeSegment(topFolder) : 'Root'

                const relPathForFile = relParts.length > 0 ? `${relParts.join('/')}/${entry.name}` : entry.name
                const url = relParts.length > 0
                    ? `/images/${relParts.map(encodeURIComponent).join('/')}/${encodeURIComponent(entry.name)}`
                    : `/images/${encodeURIComponent(entry.name)}`

                if (!foldersMap[topFolder]) {
                    foldersMap[topFolder] = {rawName: topFolder, title, files: []}
                }

                foldersMap[topFolder].files.push({
                    path: relPathForFile,
                    filename: entry.name,
                    folder: topFolder,
                    url,
                    ...dims,
                })
            }
        }
    }

    await processDir(ROOT, [])

    // Convert map to array
    const folders = Object.values(foldersMap)

    await fs.promises.writeFile(OUT, JSON.stringify(folders, null, 2))
    console.log('Wrote manifest to', OUT)
}

generate().catch((err) => {
    console.error('Failed to generate manifest:', err)
    process.exit(1)
})
