import type React from "react"
import type {Metadata} from "next"
import {Analytics} from "@vercel/analytics/next"
import {Toaster} from "@/components/ui/toaster"
import "./globals.css"

export const metadata: Metadata = {
    title: "Website Monitoring Dashboard",
    description: "Monitor uptime and performance across all your projects",
    icons: {
        icon: [
            {
                url: "/status.png",
                media: "(prefers-color-scheme: light)",
            },
            {
                url: "/status.png",
                media: "(prefers-color-scheme: dark)",
            },
            {
                url: "/status.svg",
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
        <Toaster/>
        <Analytics/>
        </body>
        </html>
    )
}
