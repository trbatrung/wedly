'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const weddings = [
  { id: 'anderson-kim',   name: 'Anderson & Kim',    date: 'Jun 14, 2025', color: '#C4705A' },
  { id: 'martinez-osei',  name: 'Martínez & Osei',   date: 'Aug 2, 2025',  color: '#4D6B44' },
  { id: 'patel-nguyen',   name: 'Patel & Nguyen',    date: 'Sep 20, 2025', color: '#A8883A' },
  { id: 'chen-kowalski',  name: 'Chen & Kowalski',   date: 'Nov 8, 2025',  color: '#B5748A' },
  { id: 'williams-rossi', name: 'Williams & Rossi',  date: 'Dec 28, 2025', color: '#8FAB8A' },
]

const navItems = [
  { href: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { href: '/dashboard/tasks', icon: '📋', label: 'All tasks', badge: '5' },
  { href: '/dashboard/calendar', icon: '📅', label: 'Calendar' },
  { href: '/dashboard/vendors', icon: '👥', label: 'Vendor directory' },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside style={{
      width: 220, background: 'var(--cream)', borderRight: '1px solid var(--stone)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--stone)', display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', border: '1.5px solid var(--blush)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
          <div style={{ position: 'absolute', width: 16, height: 16, borderRadius: '50%', border: '1px solid var(--gold)', opacity: 0.5 }} />
        </div>
        <Link href="/" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: 'var(--ink)', textDecoration: 'none' }}>
          Wedly
        </Link>
      </div>

      {/* Nav */}
      <div style={{ padding: '16px 12px 8px' }}>
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--stone-dark)', padding: '0 8px', marginBottom: 4 }}>Overview</div>
        {navItems.map(({ href, icon, label, badge }) => {
          const active = path === href
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '8px 10px', borderRadius: 7, fontSize: 13,
              color: active ? 'var(--ink)' : 'var(--ink-muted)',
              background: active ? 'var(--parchment)' : 'transparent',
              fontWeight: active ? 500 : 400,
              textDecoration: 'none', marginBottom: 1,
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{icon}</span>
              {label}
              {badge && (
                <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 500, background: 'var(--blush-light)', color: 'var(--blush)', padding: '1px 7px', borderRadius: 100 }}>{badge}</span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Weddings */}
      <div style={{ padding: '0 12px 12px', flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--stone-dark)', padding: '12px 8px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          My weddings
          <button style={{ fontSize: 18, color: 'var(--stone-dark)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>+</button>
        </div>
        {weddings.map(w => {
          const active = path.includes(w.id)
          return (
            <Link key={w.id} href={`/wedding/${w.id}`} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '8px 10px', borderRadius: 7, cursor: 'pointer',
              marginBottom: 2, textDecoration: 'none',
              background: active ? 'var(--parchment)' : 'transparent',
              transition: 'background 0.15s',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: w.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.name}</div>
                <div style={{ fontSize: 10.5, color: 'var(--stone-dark)' }}>{w.date}</div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* User */}
      <div style={{ padding: 12, borderTop: '1px solid var(--stone)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 7 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--sage-light)', border: '1.5px solid var(--sage-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: 'var(--sage)', flexShrink: 0 }}>SR</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Sofia Reyes</div>
            <div style={{ fontSize: 10.5, color: 'var(--stone-dark)' }}>Pro plan</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
