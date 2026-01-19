import fs from 'fs'
import path from 'path'
import sizeOf from 'image-size'

const ROOT = path.join(process.cwd(), 'public', 'images')
const OUT = path.join(process.cwd(), 'public', 'gallery-manifest.json')

function isImage(file) {
    return /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(file)
}

async function generate() {
    const folders = []
    if (!fs.existsSync(ROOT)) {
        await fs.promises.writeFile(OUT, JSON.stringify([]))
        console.log('No images directory, wrote empty manifest.')
        return
    }

    const items = await fs.promises.readdir(ROOT)
    for (const item of items) {
        const p = path.join(ROOT, item)
        const s = await fs.promises.stat(p)
        if (s.isDirectory()) {
            const files = await fs.promises.readdir(p)
            const images = []
            for (const f of files) {
                if (!isImage(f)) continue
                const absolute = path.join(p, f)
                let dims = {}
                try {
                    const d = sizeOf(absolute)
                    dims = {width: d.width, height: d.height}
                } catch (e) {
                    dims = {}
                }
                images.push({
                    path: `${item}/${f}`,
                    filename: f,
                    folder: item,
                    url: `/images/${encodeURIComponent(item)}/${encodeURIComponent(f)}`,
                    ...dims,
                })
            }
            folders.push({rawName: item, title: item, files: images})
        }
    }

    await fs.promises.writeFile(OUT, JSON.stringify(folders, null, 2))
    console.log('Wrote manifest to', OUT)
}

generate().catch((err) => {
    console.error('Failed to generate manifest:', err)
    process.exit(1)
})
