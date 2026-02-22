import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
    // Try SVG first, fallback to PNG
    const svgPath = path.join(process.cwd(), 'public', 'status.svg')
    const pngPath = path.join(process.cwd(), 'public', 'status.png')

    try {
        if (fs.existsSync(svgPath)) {
            const svg = fs.readFileSync(svgPath)
            return new NextResponse(svg, {
                headers: {
                    'Content-Type': 'image/svg+xml',
                    'Cache-Control': 'public, max-age=31536000, immutable',
                },
            })
        } else if (fs.existsSync(pngPath)) {
            const png = fs.readFileSync(pngPath)
            return new NextResponse(png, {
                headers: {
                    'Content-Type': 'image/png',
                    'Cache-Control': 'public, max-age=31536000, immutable',
                },
            })
        }
    } catch (error) {
        console.error('Error serving favicon:', error)
    }

    // If both fail, redirect to the SVG URL
    return NextResponse.redirect(new URL('/status.svg', process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'))
}

