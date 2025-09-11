import type { Metadata } from 'next'
import { SUSE } from 'next/font/google'
import '../globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ConnectedNavbar } from '@/components/connected-navbar'
import { ThemeProvider } from '@/components/theme-provider'

const font = SUSE({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MySchool',
  description: 'Daily Assignment Tracker',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={font.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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
