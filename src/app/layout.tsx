import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ConnectedNavbar } from '@/components/connected-navbar'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MySchool - Homeschool Assignment Manager',
  description: 'Manage assignments for homeschooling families',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
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
            <div
              className="fixed inset-0 z-0"
              style={{
                backgroundImage: `
        linear-gradient(to right, var(--muted) 1px, transparent 1px),
        linear-gradient(to bottom, var(--muted) 1px, transparent 1px)
      `,
                backgroundSize: "20px 30px",
                WebkitMaskImage:
                  "radial-gradient(ellipse 70% 60% at 50% 100%, #000 60%, transparent 100%)",
                maskImage:
                  "radial-gradient(ellipse 70% 60% at 50% 100%, #000 60%, transparent 100%)",
              }}
            />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
