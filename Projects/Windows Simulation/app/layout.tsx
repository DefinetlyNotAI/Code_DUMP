import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SystemProvider } from "@/lib/system-context"
import NotificationManager from "@/components/system/NotificationManager"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Windows OS Simulation",
  description: "A Next.js-based Windows OS simulation with modular app architecture",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SystemProvider>
          {children}
          <NotificationManager />
        </SystemProvider>
      </body>
    </html>
  )
}
