import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, IBM_Plex_Mono, Pixelify_Sans } from 'next/font/google'
import { VaultStoreProvider } from '@/lib/vault-store'
import { MascotProvider } from '@/components/mascot/mascot-provider'
import './globals.css'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-mono',
})
const pixelifySans = Pixelify_Sans({
  subsets: ['latin'],
  variable: '--font-pixelify-sans',
})

export const metadata: Metadata = {
  title: 'PDF-Crab — Knowledge workspace for master notes',
  description:
    'Upload PDFs and handwritten notes. Compile them into one master note — original wording preserved, duplicates removed.',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#08090c',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable} ${ibmPlexMono.variable} ${pixelifySans.variable}`}>
      <body className="bg-background font-sans antialiased text-foreground selection:bg-accent/20 selection:text-accent">
        <VaultStoreProvider>
          <MascotProvider>
            {children}
          </MascotProvider>
        </VaultStoreProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
