import React from 'react'
import {Footer} from "@/components/footer";

export const metadata = {
    title: 'WESMUN Gallery',
    description: 'A simple gallery for WESMUN images',
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
