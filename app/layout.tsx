import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/AuthProvider'
import { Onboarding } from '@/components/Onboarding'
import { NoZoom } from '@/components/NoZoom'

import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CampusGist',
  description: 'Anonymous campus discussion',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#101010',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-black text-white`}>
        <NoZoom />
        <AuthProvider>
          <Onboarding />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}