// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/navbar'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BlueGuard - Smart Water Quality Monitoring',
  description: 'Smart Monitoring for Safer Water, Healthier Lives',
  keywords: ['water quality', 'monitoring', 'Jakarta', 'IoT', 'prediction'],
  authors: [{ name: 'BlueGuard Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <div className="min-h-screen bg-background">
            <Navbar />
            <main className="relative">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}