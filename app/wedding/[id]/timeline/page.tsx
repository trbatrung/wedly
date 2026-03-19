import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { weddings } from '@/lib/data'

export default function TimelinePage({ params }: { params: { id: string } }) {
  const wedding = weddings.find(w => w.id === params.id) ?? weddings[0]
  const subPages = ['Kanban','Vendors','Budget','Timeline','Guests']

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: 220, flex: 1 }}>
        <header style={{ background: 'var(--cream)', borderBottom: '1px solid var(--stone)', padding: '14px 32px', position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: wedding.color }} />
              <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontStyle: 'italic', fontWeight: 300 }}>{wedding.couple}</h1>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href={`/share/${wedding.id}`} style={{ fontSize: 12.5, padding: '7px 14px', borderRadius: 5, border: '1px solid var(--stone)', color: 'var(--ink-muted)', textDecoration: 'none' }}>🔗 Share timeline</Link>
              <button style={{ fontSize: 12.5, padding: '7px 14px', borderRadius: 5, background: 'var(--ink)', color: 'var(--cream)', border: 'none', cursor: 'pointer' }}>+ Add event</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {subPages.map(label => {
              const active = label === 'Timeline'
              const href = label === 'Kanban' ? `/wedding/${wedding.id}` : `/wedding/${wedding.id}/${label.toLowerCase()}`
              return <Link key={label} href={href} style={{ fontSize: 13, padding: '6px 14px', borderRadius: 6, textDecoration: 'none', color: active ? 'var(--ink)' : 'var(--ink-muted)', background: active ? 'var(--parchment)' : 'transparent', fontWeight: active ? 500 : 400 }}>{label}</Link>
            })}
          </div>
        </header>

        <div style={{ padding: '28px 32px', maxWidth: 700 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontStyle: 'italic', fontWeight: 300 }}>{wedding.couple} · Day of Timeline</h2>
            <span style={{ fontSize: 11, background: 'var(--sage-light)', color: 'var(--sage)', padding: '4px 12px', borderRadius: 100, fontWeight: 500 }}>
              {wedding.timeline.filter(t => t.done).length} of {wedding.timeline.length} done
            </span>
          </div>

          <div>
            {wedding.timeline.map((event, i) => (
              <div key={event.time} style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2 }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                    background: event.done ? 'var(--sage)' : event.current ? 'var(--blush)' : 'var(--parchment)',
                    border: event.current ? '3px solid var(--blush-light)' : '1px solid var(--stone-mid)',
                    boxShadow: event.current ? '0 0 0 3px var(--blush-light)' : 'none',
                  }} />
                  {i < wedding.timeline.length - 1 && <div style={{ width: 1, height: 40, background: 'var(--stone)', margin: '4px 0' }} />}
                </div>
                <div style={{ paddingBottom: 24, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--stone-dark)', minWidth: 70 }}>{event.time}</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: event.current ? 'var(--blush)' : event.done ? 'var(--stone-dark)' : 'var(--ink)' }}>
                      {event.title}{event.current && ' ← Now'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 3, paddingLeft: 80 }}>{event.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
