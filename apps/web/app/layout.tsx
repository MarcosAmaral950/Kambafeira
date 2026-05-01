import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { AuthProvider } from '@/lib/auth-context'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'KambaFeira — Peças Usadas de Automóveis',
  description: 'Marketplace de peças usadas de automóveis em Angola. Feito em Angola · Para Angola.',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#dc2626" />
      </head>
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
        <Script id="sw-register" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {})
          }
        `}</Script>
      </body>
    </html>
  )
}
