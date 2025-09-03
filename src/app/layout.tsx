import type { Metadata } from 'next'
import {
  Schibsted_Grotesk
} from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ConnectedNavbar } from '@/components/connected-navbar'
import { ThemeProvider } from '@/components/theme-provider'

const font = Schibsted_Grotesk({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'My School - Daily Assignment Tracker',
  description: 'Track your daily assignments',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={font.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >

          <div className="min-h-screen w-full bg-background relative">
            {/* Bottom Fade Grid Background */}
            <ConnectedNavbar />
            {children}
            <Toaster />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
