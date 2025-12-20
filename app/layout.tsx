import type React from "react"
import type {Metadata} from "next"
import {Analytics} from "@vercel/analytics/next"
import "./globals.css"


export const metadata: Metadata = {
    title: "Email Supervision Dashboard",
    description: "Secure read-only email supervision system for WESMUN",
    icons: {
        icon: [
            {
                url: "/wesmun.webp",
                media: "(prefers-color-scheme: light)",
            },
            {
                url: "/wesmun.webp",
                media: "(prefers-color-scheme: dark)",
            },
            {
                url: "/wesmun.svg",
                type: "image/svg+xml",
            },
        ],
    },
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" className="dark">
        <body className={`font-sans antialiased`}>
        {children}
        <Analytics/>
        </body>
        </html>
    )
}
