import Link from 'next/link'
import { weddings } from '@/lib/data'

export default function SharePage({ params }: { params: { token: string } }) {
  const wedding = weddings.find(w => w.id === params.token) ?? weddings[0]
  const spent = wedding.budget_breakdown.reduce((s, c) => s + c.amount, 0)
  const pct = Math.round((spent / wedding.budget) * 100)

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>

      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid var(--stone)', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid var(--blush)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50%', border: '1px solid var(--gold)', opacity: 0.5 }} />
          </div>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20 }}>Wedly</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11.5, background: 'var(--sage-light)', color: 'var(--sage)', padding: '4px 12px', borderRadius: 100, fontWeight: 500 }}>Read-only view</span>
          <Link href="/" style={{ fontSize: 12.5, color: 'var(--ink-muted)', textDecoration: 'none' }}>Powered by Vowo</Link>
        </div>
      </header>

      {/* Hero */}
      <div style={{ background: 'var(--ink)', padding: '56px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: "radial-gradient(ellipse 500px 300px at 50% 50%, rgba(196,112,90,0.12) 0%, transparent 70%)", pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', padding: '6px 16px', borderRadius: 100, marginBottom: 20 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: wedding.color }} />
            <span style={{ fontSize: 12, color: 'var(--stone-mid)', letterSpacing: 1, textTransform: 'uppercase' }}>Your wedding portal</span>
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 56, color: 'var(--cream)', fontWeight: 300, fontStyle: 'italic', marginBottom: 10 }}>{wedding.couple}</h1>
          <p style={{ fontSize: 16, color: 'var(--stone-mid)' }}>{wedding.date} · {wedding.daysAway} days away · {wedding.guests} guests</p>
          <div style={{ marginTop: 28, maxWidth: 400, margin: '28px auto 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--stone-mid)', marginBottom: 8 }}>
              <span>Planning progress</span><span style={{ color: wedding.color }}>{wedding.progress}%</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 100, height: 6, overflow: 'hidden' }}>
              <div style={{ width: `${wedding.progress}%`, height: '100%', background: wedding.color, borderRadius: 100 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

          {/* Budget */}
          <div style={{ background: '#fff', border: '1px solid var(--stone)', borderRadius: 14, padding: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--stone-dark)', marginBottom: 16 }}>Budget overview</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Total</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28 }}>${wedding.budget.toLocaleString()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Spent</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28 }}>${spent.toLocaleString()}</div>
              </div>
            </div>
            <div style={{ background: 'var(--parchment)', borderRadius: 100, height: 6, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--sage)', borderRadius: 100 }} />
            </div>
            {wedding.budget_breakdown.map(c => (
              <div key={c.category} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.color }} />
                <span style={{ fontSize: 12.5, flex: 1, color: 'var(--ink-soft)' }}>{c.category}</span>
                <span style={{ fontSize: 12.5, fontWeight: 500 }}>${c.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div style={{ background: '#fff', border: '1px solid var(--stone)', borderRadius: 14, padding: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--stone-dark)', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Day timeline
              <span style={{ fontSize: 10.5, background: 'var(--sage-light)', color: 'var(--sage)', padding: '2px 8px', borderRadius: 100, textTransform: 'none', letterSpacing: 0 }}>
                {wedding.timeline.filter(t => t.done).length}/{wedding.timeline.length} done
              </span>
            </div>
            {wedding.timeline.map((event, i) => (
              <div key={event.time} style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', flexShrink: 0, background: event.done ? 'var(--sage)' : event.current ? 'var(--blush)' : 'var(--parchment)', border: event.current ? '2px solid var(--blush-light)' : '1px solid var(--stone-mid)' }} />
                  {i < wedding.timeline.length - 1 && <div style={{ width: 1, height: 32, background: 'var(--stone)' }} />}
                </div>
                <div style={{ paddingBottom: 16 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: event.current ? 'var(--blush)' : event.done ? 'var(--stone-dark)' : 'var(--ink)' }}>{event.time} — {event.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>{event.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vendors (public-safe) */}
        <div style={{ background: '#fff', border: '1px solid var(--stone)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--stone)', background: 'var(--warm)', fontSize: 13.5, fontWeight: 500 }}>Your vendor team</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--stone)' }}>
            {wedding.vendors.filter(v => v.status === 'confirmed').map(v => (
              <div key={v.name} style={{ background: '#fff', padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: v.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: '#fff' }}>{v.initials}</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{v.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>{v.category}</div>
                  </div>
                </div>
                <span style={{ fontSize: 10, background: 'var(--sage-light)', color: 'var(--sage)', padding: '2px 8px', borderRadius: 100, fontWeight: 500 }}>Confirmed ✓</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 32, textAlign: 'center', padding: '24px', background: 'var(--warm)', borderRadius: 14, border: '1px solid var(--stone)' }}>
          <p style={{ fontSize: 13.5, color: 'var(--ink-muted)', marginBottom: 10 }}>Questions about your wedding plan? Contact your planner directly.</p>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontStyle: 'italic', color: 'var(--ink)' }}>Sofia Reyes · <a href="mailto:sofia@altaweddings.com" style={{ color: 'var(--blush)', textDecoration: 'none' }}>sofia@altaweddings.com</a></div>
        </div>
      </div>
    </div>
  )
}
