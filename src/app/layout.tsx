import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ConnectedNavbar } from '@/components/connected-navbar';

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
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <ConnectedNavbar />
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  )
}
