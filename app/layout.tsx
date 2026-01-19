import './globals.css'
import React from 'react'
import {Footer} from "@/components/footer";
import {Metadata} from "next";

export const metadata: Metadata = {
    title: 'WESMUN Gallery',
    description: 'A simple gallery for WESMUN images',
    icons: {
        icon: [
            {url: '/wesmun.svg', type: 'image/svg+xml'},
            {url: '/wesmun.webp', type: 'image/webp'},
        ]
    }
}

export default function RootLayout({children}: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <body>
        {children}
        <Footer/>
        </body>
        </html>
    )
}
