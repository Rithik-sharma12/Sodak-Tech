import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const geist = Geist({ 
  subsets: ['latin'], 
  variable: '--font-geist',
  display: 'swap',
})
const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
})
const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'], 
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Sodak-Tech - Competitive Programming Platform',
    template: '%s | Sodak-Tech',
  },
  description: 'High-performance competitive programming platform with real-time coding challenges',
  keywords: ['competitive programming', 'coding challenges', 'algorithms', 'data structures'],
  authors: [{ name: 'Sodak-Tech' }],
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.png',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0b1326',
  userScalable: true,
  initialScale: 1,
  maximumScale: 5,
  width: 'device-width',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      {/* Background and font come from the base layer in globals.css so the
          page is styled even before any component mounts — a body that paints
          white first and corrects afterwards is a visible flash. */}
      <body className="min-h-screen antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
