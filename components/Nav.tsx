'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Nav() {
  const path = usePathname()
  const isApp = path.startsWith('/dashboard') || path.startsWith('/wedding')

  if (isApp) return null // app has its own sidebar

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 56px',
      background: 'rgba(253,250,245,0.90)',
      backdropFilter: 'blur(14px)',
      borderBottom: '1px solid var(--stone)',
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          border: '1.5px solid var(--blush)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', width: 16, height: 16, borderRadius: '50%',
            border: '1px solid var(--gold)', opacity: 0.5,
          }} />
        </div>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: 'var(--ink)' }}>
          Vo<em style={{ fontStyle: 'italic', color: 'var(--blush)' }}>wo</em>
        </span>
      </Link>

      <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
        {[['#features', 'Features'], ['#how', 'How it works'], ['/pricing', 'Pricing']].map(([href, label]) => (
          <a key={href} href={href} style={{
            fontSize: 13.5, color: 'var(--ink-muted)', textDecoration: 'none',
          }}>{label}</a>
        ))}
        <Link href="/dashboard" className="btn-primary">Start free trial</Link>
      </div>
    </nav>
  )
}
