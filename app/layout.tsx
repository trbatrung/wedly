import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vowo — Wedding Planning, Reinvented',
  description: 'The workspace built for wedding planners. Kanban boards, vendor CRM, budgets, timelines, and guest lists — all in one place.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
